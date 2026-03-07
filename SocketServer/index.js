const net = require("net");
const { MongoClient } = require("mongodb");
require('dotenv').config()

const PORT = 8080;
const DB_URI = process.env.DB;

// Packet types
const PKT_START = 0x01;
const PKT_DATA = 0x02;
const PKT_END = 0x03;

// Packet sizes
const PKT_START_SIZE = 3;
const PKT_DATA_SIZE = 34;
const PKT_END_SIZE = 2;

// Per-device run state
const deviceState = {};

let db;

function getState(deviceId) {
    if (!deviceState[deviceId]) {
        deviceState[deviceId] = { inRun: false, startTime: null, tickRate: null, lastTick: -1, runId: null };
    }
    return deviceState[deviceId];
}

function packetSize(type) {
    switch (type) {
        case PKT_START: return PKT_START_SIZE;
        case PKT_DATA: return PKT_DATA_SIZE;
        case PKT_END: return PKT_END_SIZE;
        default: return null;
    }
}

async function handlePacket(packet) {
    const type = packet.readUInt8(0);
    const deviceId = packet.readUInt8(1);
    const state = getState(deviceId);
    const now = new Date();

    switch (type) {
        case PKT_START: {
            const tickRate = packet.readUInt8(2);
            state.inRun = true;
            state.startTime = now;
            state.tickRate = tickRate;
            state.lastTick = -1;

            const result = await db.collection("runs").insertOne({
                deviceId,
                tickRate,
                startTime: now,
                endTime: null,
                duration: null,
                totalTicks: null,
            });
            state.runId = result.insertedId;

            console.log(`[${deviceId}] ▶ RUN STARTED  time=${now.toISOString()}  tickRate=${tickRate}Hz  runId=${state.runId}`);
            break;
        }

        case PKT_DATA: {
            const tick = packet.readUInt32LE(2);
            const accelX = packet.readFloatLE(6);
            const accelY = packet.readFloatLE(10);
            const accelZ = packet.readFloatLE(14);
            const gyroX = packet.readFloatLE(18);
            const gyroY = packet.readFloatLE(22);
            const gyroZ = packet.readFloatLE(26);
            const temp = packet.readFloatLE(30);

            if (state.lastTick !== -1 && tick !== state.lastTick + 1) {
                const dropped = tick - state.lastTick - 1;
                console.warn(`[${deviceId}] ⚠ ${dropped} dropped packet(s) between tick ${state.lastTick} and ${tick}`);
            }
            state.lastTick = tick;

            if (state.runId) {
                await db.collection("ticks").insertOne({
                    runId: state.runId,
                    deviceId,
                    tick,
                    timestamp: now,
                    accel: { x: accelX, y: accelY, z: accelZ },
                    gyro: { x: gyroX, y: gyroY, z: gyroZ },
                    temp,
                });
            }

            console.log(
                `[${deviceId}] tick=${String(tick).padStart(6)} ` +
                `accel=(${accelX.toFixed(2)}, ${accelY.toFixed(2)}, ${accelZ.toFixed(2)}) ` +
                `gyro=(${gyroX.toFixed(2)}, ${gyroY.toFixed(2)}, ${gyroZ.toFixed(2)}) ` +
                `temp=${temp.toFixed(1)}°C`
            );
            break;
        }

        case PKT_END: {
            const duration = state.startTime ? ((now - state.startTime) / 1000).toFixed(2) : null;

            if (state.runId) {
                await db.collection("runs").updateOne(
                    { _id: state.runId },
                    { $set: { endTime: now, duration: parseFloat(duration), totalTicks: state.lastTick + 1 } }
                );
            }

            console.log(
                `[${deviceId}] ■ RUN ENDED    ` +
                `time=${now.toISOString()}  duration=${duration}s  ticks=${state.lastTick + 1}  runId=${state.runId}`
            );

            state.inRun = false;
            state.startTime = null;
            state.lastTick = -1;
            state.runId = null;
            break;
        }

        default:
            console.warn(`[!] Unknown packet type: 0x${type.toString(16)}`);
    }
}

async function main() {
    const client = new MongoClient(DB_URI);
    await client.connect();
    db = client.db();
    console.log("MongoDB connected");

    // Index ticks by runId for fast queries
    await db.collection("ticks").createIndex({ runId: 1, tick: 1 });
    await db.collection("runs").createIndex({ deviceId: 1, startTime: -1 });

    const server = net.createServer((socket) => {
        const addr = `${socket.remoteAddress}:${socket.remotePort}`;
        console.log(`[+] Arduino connected: ${addr}`);

        let buffer = Buffer.alloc(0);

        socket.on("data", (data) => {
            buffer = Buffer.concat([buffer, data]);

            while (buffer.length > 0) {
                const type = buffer.readUInt8(0);
                const size = packetSize(type);

                if (size === null) {
                    console.error(`[!] Unknown packet type 0x${type.toString(16)}, discarding buffer`);
                    buffer = Buffer.alloc(0);
                    break;
                }

                if (buffer.length < size) break;

                const packet = buffer.subarray(0, size);
                buffer = buffer.subarray(size);

                handlePacket(packet).catch((err) =>
                    console.error(`[!] DB error handling packet: ${err.message}`)
                );
            }
        });

        socket.on("close", () => console.log(`[-] Arduino disconnected: ${addr}`));
        socket.on("error", (err) => console.error(`[!] Socket error: ${err.message}`));
    });

    server.listen(PORT, "0.0.0.0", () => {
        console.log(`Server listening on port ${PORT}`);
    });
}

main().catch((err) => {
    console.error("Fatal:", err.message);
    process.exit(1);
});