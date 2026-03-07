"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcAngleDifference = exports.calcMagitudeDifference = exports.getTickDataByRunId = exports.getTickData = exports.getRunData = void 0;
const Run_1 = __importDefault(require("../models/Run"));
const Tick_1 = __importDefault(require("../models/Tick"));
const warningController_1 = require("./warningController");
const getRunData = async (req, res) => {
    // use req.query to get query parameters
    const filter = req.query;
    // use model to query 
    const data = await Run_1.default.find(filter);
    if (!data || data.length === 0) {
        return res.status(404).json({ error: 'No data found' });
    }
    return res.status(200).json(data);
};
exports.getRunData = getRunData;
const getTickData = async (req, res) => {
    // use req.query to get query parameters
    const filter = req.query;
    // use model to query 
    const data = await Tick_1.default.find(filter);
    if (!data || data.length === 0) {
        return res.status(404).json({ error: 'No data found' });
    }
    return res.status(200).json(data);
};
exports.getTickData = getTickData;
const getTickDataByRunId = async (req, res) => {
    const runId = req.params.runId;
    // use model to query
    const data = await Tick_1.default.find({ runId: runId });
    if (!data || data.length === 0) {
        return res.status(404).json({ error: 'No data found' });
    }
    return res.status(200).json(data);
};
exports.getTickDataByRunId = getTickDataByRunId;
// export const createData = async (req: Request, res: Response) => {
//     if (!req.body) {
//         return res.status(400).json({error: 'Invalid Request body'}); // 400: bad request
//     }
//     // add new game to db from request body
//     await Data.create(req.body);
//     return res.status(201).json(); // 201: resource created
// };
const calcMagitudeDifference = async (req, res) => {
    const vector1 = JSON.parse(req.query.v1);
    const vector2 = JSON.parse(req.query.v2);
    return res.status(200).json({ message: (0, warningController_1.calcMagitudeDiff)(vector1, vector2) }); // should be 90 degrees
    // Example: http://localhost:4000/api/data/calcMagitudeDifference?v1=[1,%201,%201]&v2=[2,1,0]
};
exports.calcMagitudeDifference = calcMagitudeDifference;
const calcAngleDifference = async (req, res) => {
    const vector1 = JSON.parse(req.query.v1);
    const vector2 = JSON.parse(req.query.v2);
    return res.status(200).json({ message: (0, warningController_1.calcAngleDiff)(vector1, vector2) }); // should be 90 degrees
    // Example: http://localhost:4000/api/data/calcMagitudeDifference?v1=[1,%201,%201]&v2=[2,1,0]
};
exports.calcAngleDifference = calcAngleDifference;
