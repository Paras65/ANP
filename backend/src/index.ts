import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import publicRoutes from './routes/public.routes.js';
import { logger } from './utils/logger.js';
import { requestLogger } from './middleware/requestLogger.middleware.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';
import { notFoundHandler } from './middleware/notFound.middleware.js';

dotenv.config();

// Process-level unhandled exception & rejection safety
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
});

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// CORS Configuration for Local, Vercel & Custom Domain
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://ambition-news-portal.vercel.app',
  'https://ambitionnews.com',
  'https://www.ambitionnews.com',
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (/\.vercel\.app$/.test(origin)) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

// Centralized Request Logger (Sanitized, zero secret leakage)
app.use(requestLogger);

// Health Endpoint (Essential for Render keep-alive)
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Ambition News Portal Backend',
    region: 'CG & MP (88 Districts)',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', publicRoutes);

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Welcome to Ambition News Portal API (CG & MP 88 Districts)' });
});

// 404 Catch-All for unmatched routes
app.use(notFoundHandler);

// Centralized Error Handling Middleware (Catches all sync & async errors)
app.use(errorHandler);

// Start Server
const startServer = async () => {
  app.listen(Number(PORT), '0.0.0.0', () => {
    logger.info(`🚀 [Server] Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    logger.info(`📡 [Health] http://localhost:${PORT}/api/health`);
    logger.info(`📍 [Districts API] http://localhost:${PORT}/api/districts`);
    logger.info(`📰 [Articles API] http://localhost:${PORT}/api/articles`);
  });
  await connectDB();
};

startServer();
