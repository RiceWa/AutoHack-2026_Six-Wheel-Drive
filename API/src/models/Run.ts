import mongoose, { Model, Schema, Types } from "mongoose";

export interface IRun {
    deviceId: number;
    runType: 'prod' | 'config'
    tickRate: number;
    startTime: Date;
    endTime: Date | null;
    duration: number | null;
    totalTicks: number | null;
}

const RunSchema = new Schema<IRun>({
    runType: { 
        type: String,
        enum : ['prod','config'],
        default: 'prod'
    },
    deviceId: { type: Number, required: [true, 'Device ID required'] },
    tickRate: { type: Number, required: [true, 'Tick rate required'] },
    startTime: { type: Date, required: [true, 'Start time required'] },
    endTime: { type: Date, default: null },
    duration: { type: Number, default: null },
    totalTicks: { type: Number, default: null },
});

const Run: Model<IRun> = mongoose.models.Run ?? mongoose.model<IRun>('Run', RunSchema);

export default Run;