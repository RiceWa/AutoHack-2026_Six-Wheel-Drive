"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createData = exports.getData = void 0;
const data_1 = __importDefault(require("../models/data"));
const getData = async (req, res) => {
    // use req.query to get query parameters
    const filter = req.query;
    // use model to query 
    const data = await data_1.default.find(filter);
    if (!data || data.length === 0) {
        return res.status(404).json({ error: 'No data found' });
    }
    return res.status(200).json(data);
};
exports.getData = getData;
const createData = async (req, res) => {
    if (!req.body) {
        return res.status(400).json({ error: 'Invalid Request body' }); // 400: bad request
    }
    // add new game to db from request body
    await data_1.default.create(req.body);
    return res.status(201).json(); // 201: resource created
};
exports.createData = createData;
