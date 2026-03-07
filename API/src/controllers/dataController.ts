import express, {Request, Response} from 'express';
import Data from '../models/data';
import { calcAccAngleDiff } from './warningController';

// export const getData = async (req: Request, res: Response) => {

//     // use req.query to get query parameters

//     const filter = req.query;

//     // use model to query 
//     const data =  await Data.find(filter);

//     if(!data || data.length === 0) {
//         return res.status(404).json({error: 'No data found'});
//     }

//     return res.status(200).json(data);
// };

// export const createData = async (req: Request, res: Response) => {
//     if (!req.body) {
//         return res.status(400).json({error: 'Invalid Request body'}); // 400: bad request
//     }

//     // add new game to db from request body
//     await Data.create(req.body);
//     return res.status(201).json(); // 201: resource created
// };

export const test = async (req: Request, res: Response) => {
    return res.status(200).json({message: calcAccAngleDiff([0,.5,1], [0,.7,.9])}); // should be 90 degrees
};