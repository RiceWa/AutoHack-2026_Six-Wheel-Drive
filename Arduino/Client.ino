#include "WiFiEsp.h"
#include <MPU6500_WE.h>
#include <Wire.h>
// === ADDED FOR DHT11 Temperature SENSORS ===
#include <DHT.h>

// ── Configuration ─────────────────────────────────────────────
#define DEVICE_ID 1
#define MPU6500_ADDR 0x68
#define TCP_HOST "172.20.10.10"
#define TCP_PORT 8080
#define TICK_RATE_HZ 4 // ticks per second (configurable)
#define TICK_INTERVAL_MS (1000 / TICK_RATE_HZ)
// Movement thresholds (tune to your environment)
#define ACCEL_THRESHOLD 0.15f // g-force delta from ~1g gravity baseline
#define GYRO_THRESHOLD 5.0f // deg/s
#define STILL_TIMEOUT_MS 4000 // ms of stillness before ending run
// Packet types
#define PKT_START 0x01
#define PKT_DATA 0x02
#define PKT_END 0x03
// Packet sizes
#define PKT_START_SIZE 3 // type, device_id, tickRate
#define PKT_DATA_SIZE 50 // ← UPDATED (was 34) → added 4 floats (vib1, vib2, Temp1, Temp2)
#define PKT_END_SIZE 2 // type, device_id

// === ADDED: SENSOR PINS ===
#define VIB_PIN1 9
#define VIB_PIN2 10
#define DHTPIN1 8
#define DHTPIN2 7
#define DHTTYPE DHT11

const char ssid[] = "Murads iPhone";
const char pass[] = "password1";

// ── Globals ───────────────────────────────────────────────────
WiFiEspClient client;
MPU6500_WE myMPU6500 = MPU6500_WE(MPU6500_ADDR);

// === ADDED: DHT11 objects ===
DHT dht1(DHTPIN1, DHTTYPE);
DHT dht2(DHTPIN2, DHTTYPE);

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
    float accelMag = sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
    bool accelMove = abs(accelMag - 1.0f) > ACCEL_THRESHOLD;
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
// === UPDATED: Now also sends vibration + Temperature ===
void sendDataPacket(xyzFloat &acc, xyzFloat &gyr, float temp, float vib1, float vib2, float temp1, float temp2)
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
    // === ADDED: pack new sensor values (sent exactly like accel/gyro) ===
    packFloat(pkt, 34, vib1);   // vibration joint 1 (1.0 = HIGH, 0.0 = LOW)
    packFloat(pkt, 38, vib2);   // vibration joint 2
    packFloat(pkt, 42, temp1);   // temperature joint 1 (%)
    packFloat(pkt, 46, temp2);   // Temperature joint 2 (%)

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

    // === ADDED: Initialize DHT11 sensors ===
    dht1.begin();
    dht2.begin();
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
    delay(200);
    ensureConnected();
    lastTickTime = millis();
}

// ── Loop ──────────────────────────────────────────────────────
void loop()
{
    uint32_t now = millis();
    if (now - lastTickTime < TICK_INTERVAL_MS)
        return;
    lastTickTime = now;
    if (!ensureConnected())
        return;

    xyzFloat acc = myMPU6500.getGValues();
    xyzFloat gyr = myMPU6500.getGyrValues();
    float temp = myMPU6500.getTemperature();

    // === ADDED: Read vibration and Temperature sensors every tick ===
    int vibRaw1 = digitalRead(VIB_PIN1);
    int vibRaw2 = digitalRead(VIB_PIN2);
    float vib1 = (vibRaw1 == HIGH) ? 1.0f : 0.0f;   // send as float like accel
    float vib2 = (vibRaw2 == HIGH) ? 1.0f : 0.0f;
    float temp1 = dht1.readTemperature();               // % RH
    float temp2 = dht2.readTemperature();

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
            sendDataPacket(acc, gyr, temp, vib1, vib2, temp1, temp2);  // ← UPDATED call
            tickCounter++;
        }
        break;
    case RUNNING:
        sendDataPacket(acc, gyr, temp, vib1, vib2, temp1, temp2);  // ← UPDATED call
        tickCounter++;
        if (moving)
        {
            lastStillTime = now;
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
