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
import { recordSecurityIncident } from './services/securityAudit.service.js';

dotenv.config();

// Process-level unhandled exception & rejection safety (Anti-Crash & Anti-Leak)
process.on('unhandledRejection', (reason: any) => {
  const errMsg = reason?.stack || reason?.message || String(reason);
  logger.error('Unhandled Promise Rejection:', errMsg);
  recordSecurityIncident({
    eventType: 'UNHANDLED_PROMISE_REJECTION',
    severity: 'CRITICAL',
    ip: '127.0.0.1',
    message: String(errMsg).slice(0, 500)
  });
});

process.on('uncaughtException', (err: any) => {
  const errMsg = err?.stack || err?.message || String(err);
  logger.error('Uncaught Exception:', errMsg);
  recordSecurityIncident({
    eventType: 'UNCAUGHT_EXCEPTION',
    severity: 'CRITICAL',
    ip: '127.0.0.1',
    message: String(errMsg).slice(0, 500)
  });
});

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy (Essential for Render, Vercel, AWS ELB to resolve client IP & satisfy express-rate-limit)
app.set('trust proxy', 1);

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

// 2. Dynamic Environment-Driven CORS (Zero Code Policy: 100% Configured via Environment Variables)
const getAllowedOrigins = (): string[] => {
  const configured = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  if (process.env.FRONTEND_URL) {
    configured.push(process.env.FRONTEND_URL.trim());
  }

  // Always permit local development in non-production
  if (process.env.NODE_ENV !== 'production') {
    configured.push('http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173');
  }

  return Array.from(new Set(configured));
};

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile native apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    const origins = getAllowedOrigins();

    // 1. Allow explicitly configured origins from process.env.ALLOWED_ORIGINS & FRONTEND_URL
    if (origins.includes(origin)) return callback(null, true);

    // 2. Allow dynamic domain suffix patterns configured in process.env.ALLOWED_DOMAIN_PATTERNS
    const patternEnv = process.env.ALLOWED_DOMAIN_PATTERNS || '.init65.co.in,.vercel.app,.pages.dev';
    const patterns = patternEnv.split(',').map(p => p.trim()).filter(Boolean);
    const matchesPattern = patterns.some(pattern => {
      try {
        const url = new URL(origin);
        return url.hostname.endsWith(pattern) || url.hostname === pattern.replace(/^\./, '');
      } catch {
        return false;
      }
    });

    if (matchesPattern) return callback(null, true);

    // 3. Allow any origin in non-production development
    if (process.env.NODE_ENV !== 'production') return callback(null, true);

    return callback(new Error(`CORS blocked: अनधिकृत डोमेन (${origin}) से अनुरोध अस्वीकृत (Origin not allowed)`));
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
    console.log(`🚀 [Server] Ambition News Portal active on port ${PORT}`);
  });
  await connectDB();
};

startServer();
