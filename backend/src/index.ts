import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import publicRoutes from './routes/public.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Rule 13: The /api/health endpoint is sacred for Render free-tier keep-alive
app.get('/api/health', (req: Request, res: Response) => {
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
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to Ambition News Portal API (CG & MP 88 Districts)' });
});

// Start Server
const startServer = async () => {
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 [Server] Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`📡 [Health] http://localhost:${PORT}/api/health`);
    console.log(`📍 [Districts API] http://localhost:${PORT}/api/districts`);
    console.log(`📰 [Articles API] http://localhost:${PORT}/api/articles`);
  });
  await connectDB();
};

startServer();
