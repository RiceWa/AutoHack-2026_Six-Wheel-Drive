import express, { Application, Request, Response } from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';

// controllers
import data from './routes/dataRoutes';


const app: Application = express();

// configure
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../../FRONTEND/public')));

// Load env from repo root (one level above API/)
dotenv.config({ path: path.join(__dirname, '../../.env') });

// db connection
const dbUri = process.env.MONGODB_URI ?? process.env.DB;

if (!dbUri) {
    console.error('Missing MONGODB_URI (or DB) environment variable.');
    process.exit(1);
}

mongoose.connect(dbUri)
.then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Error connecting to MongoDB:', err.message);
});

app.use('/api/data', data);


const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Six Wheel Drive API',
            version: '1.0.0'
        }
    },
    apis: ['./dist/controllers/*.js']
}

app.listen(4000, () => { console.log('Server running on port 4000') });
