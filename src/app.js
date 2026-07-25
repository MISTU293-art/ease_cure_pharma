import dotenv from 'dotenv';
dotenv.config({
    path: '../.env'
});

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import connectionDB from './config/db.config.js';
import cookieParser from 'cookie-parser';

const app = express();
connectionDB()
// For ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors({ origin: "*" }));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static Files
app.use(express.static(path.join(__dirname, "public")));

import allRoute from './routes/all.route.js';
app.use('/',allRoute)

export default app;