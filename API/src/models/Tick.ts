import mongoose, { Model, Schema, Types } from "mongoose";

interface IVec3 {
    x: number;
    y: number;
    z: number;
}

const Vec3Schema = new Schema<IVec3>(
    {
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        z: { type: Number, required: true },
    },
    { _id: false }
);

export interface ITick {
    runId: Types.ObjectId;
    deviceId: number;
    tick: number;
    timestamp: Date;
    accel: IVec3;
    gyro: IVec3;
    temp: number;
}

const TickSchema = new Schema<ITick>({
    runId: { type: Schema.Types.ObjectId, ref: 'Run', required: [true, 'Run ID required'] },
    deviceId: { type: Number, required: [true, 'Device ID required'] },
    tick: { type: Number, required: [true, 'Tick required'] },
    timestamp: { type: Date, required: [true, 'Timestamp required'] },
    accel: { type: Vec3Schema, required: [true, 'Accel required'] },
    gyro: { type: Vec3Schema, required: [true, 'Gyro required'] },
    temp: { type: Number, required: [true, 'Temperature required'] },
});

const Tick: Model<ITick> = mongoose.models.Tick ?? mongoose.model<ITick>('Tick', TickSchema);

export default Tick;