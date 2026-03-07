"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcAngleDifference = exports.calcMagitudeDifference = exports.compareRunsById = exports.getTickDataByRunId = exports.getTickData = exports.getRunData = void 0;
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
const compareRunsById = async (req, res) => {
    const runId1 = req.params.runId1;
    const runId2 = req.params.runId2;
    // use model to query
    const data1 = await Tick_1.default.find({ runId: runId1 });
    const data2 = await Tick_1.default.find({ runId: runId2 });
    const comparisonResults = [];
    for (let i = 0; i < Math.min(data1.length, data2.length); i++) {
        const tick1 = data1[i];
        const tick2 = data2[i];
        const accel1 = [tick1.accel.x, tick1.accel.y, tick1.accel.z];
        const accel2 = [tick2.accel.x, tick2.accel.y, tick2.accel.z];
        const angleDiff = (0, warningController_1.calcAngleDiff)(accel1, accel2);
        const magDiff = (0, warningController_1.calcMagitudeDiff)(accel1, accel2);
        comparisonResults.push({
            tickIndex: i,
            angleDifference: angleDiff,
            magnitudeDifference: magDiff
        });
        console.log(`Tick ${i}: Angle difference = ${angleDiff} degrees, Magnitude difference = ${magDiff}`);
    }
    return res.status(200).json(comparisonResults);
};
exports.compareRunsById = compareRunsById;
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
