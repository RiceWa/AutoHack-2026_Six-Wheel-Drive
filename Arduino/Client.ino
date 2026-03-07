#include "WiFiEsp.h"
#include <MPU6500_WE.h>
#include <Wire.h>

// ── Configuration ─────────────────────────────────────────────
#define DEVICE_ID 1
#define MPU6500_ADDR 0x68
#define TCP_HOST "172.20.10.10"
#define TCP_PORT 8080
#define TICK_RATE_HZ 4 // ticks per second (configurable)
#define TICK_INTERVAL_MS (1000 / TICK_RATE_HZ)

// Movement thresholds (tune to your environment)
#define ACCEL_THRESHOLD 0.15f // g-force delta from ~1g gravity baseline
#define GYRO_THRESHOLD 5.0f   // deg/s
#define STILL_TIMEOUT_MS 4000 // ms of stillness before ending run

// Packet types
#define PKT_START 0x01
#define PKT_DATA 0x02
#define PKT_END 0x03

// Packet sizes
#define PKT_START_SIZE 3 // type, device_id, tickRate
#define PKT_DATA_SIZE 34 // type, device_id, tick(4), ax,ay,az,gx,gy,gz,temp (7×4)
#define PKT_END_SIZE 2   // type, device_id

const char ssid[] = "Murads iPhone";
const char pass[] = "password1";

// ── Globals ───────────────────────────────────────────────────
WiFiEspClient client;
MPU6500_WE myMPU6500 = MPU6500_WE(MPU6500_ADDR);

enum State
{
    IDLE,
    RUNNING
};
State state = IDLE;

uint32_t tickCounter = 0;
uint32_t lastStillTime = 0;
uint32_t lastTickTime = 0;

// ── Helpers ───────────────────────────────────────────────────
void packFloat(uint8_t *buf, int offset, float value)
{
    memcpy(buf + offset, &value, sizeof(float));
}

void packUint32(uint8_t *buf, int offset, uint32_t value)
{
    memcpy(buf + offset, &value, sizeof(uint32_t));
}

bool ensureConnected()
{
    if (client.connected())
        return true;
    client.stop();
    Serial.println("Reconnecting...");
    delay(2000);
    if (!client.connect(TCP_HOST, TCP_PORT))
    {
        Serial.println("TCP connect failed");
        return false;
    }
    Serial.println("TCP connected!");
    return true;
}

bool sendPacket(uint8_t *buf, size_t len)
{
    if (client.write(buf, len) == len)
        return true;
    Serial.println("Send failed");
    client.stop();
    return false;
}

bool isMoving(xyzFloat &acc, xyzFloat &gyr)
{
    // Accel: measure deviation from 1g (gravity baseline on any axis)
    float accelMag = sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
    bool accelMove = abs(accelMag - 1.0f) > ACCEL_THRESHOLD;
    // Serial.println(accelMag);

    // Gyro: any axis rotating
    bool gyroMove = (abs(gyr.x) > GYRO_THRESHOLD ||
                     abs(gyr.y) > GYRO_THRESHOLD ||
                     abs(gyr.z) > GYRO_THRESHOLD);

    return accelMove || gyroMove;
}

void sendStartRun()
{
    uint8_t pkt[PKT_START_SIZE];
    pkt[0] = PKT_START;
    pkt[1] = DEVICE_ID;
    pkt[2] = TICK_RATE_HZ;
    sendPacket(pkt, PKT_START_SIZE);
    Serial.println(">> START_RUN sent");
}

void sendDataPacket(xyzFloat &acc, xyzFloat &gyr, float temp)
{
    uint8_t pkt[PKT_DATA_SIZE];
    pkt[0] = PKT_DATA;
    pkt[1] = DEVICE_ID;
    packUint32(pkt, 2, tickCounter);
    packFloat(pkt, 6, acc.x);
    packFloat(pkt, 10, acc.y);
    packFloat(pkt, 14, acc.z);
    packFloat(pkt, 18, gyr.x);
    packFloat(pkt, 22, gyr.y);
    packFloat(pkt, 26, gyr.z);
    packFloat(pkt, 30, temp);
    sendPacket(pkt, PKT_DATA_SIZE);
}

void sendEndRun()
{
    uint8_t pkt[PKT_END_SIZE];
    pkt[0] = PKT_END;
    pkt[1] = DEVICE_ID;
    sendPacket(pkt, PKT_END_SIZE);
    Serial.println(">> END_RUN sent");
}

// ── Setup ─────────────────────────────────────────────────────
void setup()
{
    Serial.begin(115200);
    Wire.begin();

    if (!myMPU6500.init())
        Serial.println("MPU6500 does not respond");
    else
        Serial.println("MPU6500 is connected");

    Serial1.begin(115200);
    WiFi.init(&Serial1);

    if (WiFi.status() == WL_NO_SHIELD)
    {
        Serial.println("WiFi module not found");
        while (true)
            ;
    }

    while (WiFi.begin(ssid, pass) != WL_CONNECTED)
    {
        delay(1000);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected!");

    Serial.println("Calibrating MPU6500...");
    delay(1000);
    myMPU6500.autoOffsets();
    Serial.println("Done!");

    myMPU6500.enableGyrDLPF();
    myMPU6500.setGyrDLPF(MPU6500_DLPF_6);
    myMPU6500.setSampleRateDivider(5);
    myMPU6500.setGyrRange(MPU6500_GYRO_RANGE_250);
    myMPU6500.setAccRange(MPU6500_ACC_RANGE_2G);
    myMPU6500.enableAccDLPF(true);
    myMPU6500.setAccDLPF(MPU6500_DLPF_6);
    delay(200);

    ensureConnected();
    lastTickTime = millis();
}

// ── Loop ──────────────────────────────────────────────────────
void loop()
{
    uint32_t now = millis();

    // Enforce tick rate
    if (now - lastTickTime < TICK_INTERVAL_MS)
        return;
    lastTickTime = now;

    if (!ensureConnected())
        return;

    xyzFloat acc = myMPU6500.getGValues();
    xyzFloat gyr = myMPU6500.getGyrValues();
    float temp = myMPU6500.getTemperature();
    bool moving = isMoving(acc, gyr);

    switch (state)
    {

    case IDLE:
        if (moving)
        {
            tickCounter = 0;
            lastStillTime = now;
            state = RUNNING;
            sendStartRun();
            // Send the first data packet immediately
            sendDataPacket(acc, gyr, temp);
            tickCounter++;
        }
        break;

    case RUNNING:
        sendDataPacket(acc, gyr, temp);
        tickCounter++;

        if (moving)
        {
            lastStillTime = now; // reset stillness timer
        }
        else if (now - lastStillTime >= STILL_TIMEOUT_MS)
        {
            sendEndRun();
            tickCounter = 0;
            state = IDLE;
        }
        break;
    }
}