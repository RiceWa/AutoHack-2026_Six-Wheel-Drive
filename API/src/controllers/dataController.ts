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

// export const createData = async (req: Request, res: Response) => {
//     if (!req.body) {
//         return res.status(400).json({error: 'Invalid Request body'}); // 400: bad request
//     }

//     // add new game to db from request body
//     await Data.create(req.body);
//     return res.status(201).json(); // 201: resource created
// };

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