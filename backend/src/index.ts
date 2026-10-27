import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import publicRoutes from './routes/public.routes.js';
import superAdminRoutes from './routes/superAdmin.routes.js';
import { logger } from './utils/logger.js';
import { requestLogger } from './middleware/requestLogger.middleware.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';
import { notFoundHandler } from './middleware/notFound.middleware.js';
import { sanitizeInputs } from './middleware/sanitizeInput.middleware.js';
import { antiBloatGuard } from './middleware/antiBloat.middleware.js';
import { apiLimiter } from './middleware/rateLimiter.middleware.js';

dotenv.config();

// Process-level unhandled exception & rejection safety (Anti-Crash & Anti-Leak)
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
});

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Enterprise HTTP Security Headers (OWASP Hardened via Helmet)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows news media images
  hidePoweredBy: true, // Strips X-Powered-By: Express
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny' // Defends against Clickjacking attacks
  },
  noSniff: true, // X-Content-Type-Options: nosniff
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
}));

// 2. Strict CORS Configuration for Local, Vercel & Production Domains
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
    // Allow non-browser requests (mobile native apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    // Allow Vercel preview & production deployments
    if (/\.vercel\.app$/.test(origin)) return callback(null, true);
    // Allow registered whitelist domains
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow local development
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    return callback(new Error('CORS blocked: अनधिकृत डोमेन से अनुरोध अस्वीकृत (Origin not allowed)'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Request Payload Size Limiting (Defends MongoDB against Base64 image bombs, Buffer Overflow & ReDoS)
app.use(express.json({ limit: '500kb' }));
app.use(express.urlencoded({ extended: true, limit: '500kb' }));

// 4. Global NoSQL Injection & Input Sanitizer (Recursively strips $ and . operators)
app.use(sanitizeInputs);

// 5. Anti-Bloat & Storage Exhaustion Guard (Rejects Base64 images, oversized strings, and deep JSON nesting)
app.use(antiBloatGuard);

// 6. Centralized Request Logger (Sanitized, zero secret leakage)
app.use(requestLogger);

// 7. Sacred Health Endpoint (Essential for Render keep-alive & uptime monitors)
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Ambition News Portal Backend',
    region: 'CG & MP (88 Districts)',
    timestamp: new Date().toISOString()
  });
});

// 8. Protected Public & Admin API Routes with Global Rate Limiting
app.use('/api', apiLimiter, publicRoutes);

// 8b. Dedicated Super Admin & Governance API Routes
app.use('/api/super-admin', apiLimiter, superAdminRoutes);

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Welcome to Ambition News Portal API (CG & MP 88 Districts)' });
});

// 9. 404 Catch-All for unmatched endpoints
app.use(notFoundHandler);

// 10. Centralized Error Handling Middleware (Catches all sync & async errors, scrubs secrets)
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
