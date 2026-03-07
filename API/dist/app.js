"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const mongoose_1 = __importDefault(require("mongoose"));
// controllers
const dataRoutes_1 = __importDefault(require("./routes/dataRoutes"));
const app = (0, express_1.default)();
// configure
app.use(body_parser_1.default.json());
// db connection
const dbUri = process.env.DB;
mongoose_1.default.connect(dbUri)
    .then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Error connecting to MongoDB:', err.message);
});
app.use('/api/data', dataRoutes_1.default);
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Six Wheel Drive API',
            version: '1.0.0'
        }
    },
    apis: ['./dist/controllers/*.js']
};
app.listen(4000, () => { console.log('Server running on port 4000'); });
