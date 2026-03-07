import express, {Request, Response} from 'express';
import Run from '../models/Run';
import Tick from '../models/Tick';
import { calcAngleDiff, calcMagitudeDiff } from './warningController';

export const getRunData = async (req: Request, res: Response) => {

    // use req.query to get query parameters

    const filter = req.query;

    // use model to query 
    const data =  await Run.find(filter);

    if(!data || data.length === 0) {
        return res.status(404).json({error: 'No data found'});
    }

    return res.status(200).json(data);
};

export const getTickData = async (req: Request, res: Response) => {

    // use req.query to get query parameters

    const filter = req.query;

    // use model to query 
    const data =  await Tick.find(filter);

    if(!data || data.length === 0) {
        return res.status(404).json({error: 'No data found'});
    }

    return res.status(200).json(data);
};

export const getTickDataByRunId = async (req: Request, res: Response) => {

    const runId = req.params.runId;
    // use model to query
    const data =  await Tick.find({runId: runId});

    if(!data || data.length === 0) {
        return res.status(404).json({error: 'No data found'});
    }
    
    return res.status(200).json(data);
};

export const compareRunsById = async (req: Request, res: Response) => {

    const runId1 = req.params.runId1;
    const runId2 = req.params.runId2;
    // use model to query
    const data1 =  await Tick.find({runId: runId1});
    const data2 =  await Tick.find({runId: runId2});

    const comparisonResults = [];

    for (let i = 0; i < Math.min(data1.length, data2.length); i++) {
        const tick1 = data1[i];
        const tick2 = data2[i];

        const accel1: number[] = [tick1.accel.x, tick1.accel.y, tick1.accel.z];
        const accel2: number[] = [tick2.accel.x, tick2.accel.y, tick2.accel.z];

        const gyro1: number[] = [tick1.gyro.x, tick1.gyro.y, tick1.gyro.z];
        const gyro2: number[] = [tick2.gyro.x, tick2.gyro.y, tick2.gyro.z];

        const temp1: number = tick1.temp;
        const temp2: number = tick2.temp;

        const accel1angleDiff = calcAngleDiff(accel1, accel2);
        const accel2magDiff = calcMagitudeDiff(accel1, accel2);

        const gyroAngleDiff = calcAngleDiff(gyro1, gyro2);
        
        comparisonResults.push({
            tickIndex: i,
            accelerationAngleDifference: accel1angleDiff,
            accelerationMagnitudeDifference: accel2magDiff,
            gyroAngleDifference: gyroAngleDiff,
            tempDifference: Math.abs(temp1 - temp2)
        });

        // console.log(`Tick ${i}: Angle difference = ${accel1angleDiff} degrees, Magnitude difference = ${accel2magDiff}`);
    }

    return res.status(200).json(comparisonResults);
};




export const calcMagitudeDifference = async (req: Request, res: Response) => {

    const vector1 = JSON.parse(req.query.v1 as string) as number[];
    const vector2 = JSON.parse(req.query.v2 as string) as number[];

    return res.status(200).json({message: calcMagitudeDiff(vector1, vector2)}); // should be 90 degrees
    // Example: http://localhost:4000/api/data/calcMagitudeDifference?v1=[1,%201,%201]&v2=[2,1,0]
};


export const calcAngleDifference = async (req: Request, res: Response) => {

    const vector1 = JSON.parse(req.query.v1 as string) as number[];
    const vector2 = JSON.parse(req.query.v2 as string) as number[];

    return res.status(200).json({message: calcAngleDiff(vector1, vector2)}); // should be 90 degrees
    // Example: http://localhost:4000/api/data/calcMagitudeDifference?v1=[1,%201,%201]&v2=[2,1,0]
};