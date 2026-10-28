import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { redactSecretKeys } from '../utils/sanitize.js';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, originalUrl } = req;

  // Don't log spammy Render health checks in production
  if (originalUrl === '/api/health' && process.env.NODE_ENV === 'production') {
    return next();
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const sanitizedUrl = redactSecretKeys(originalUrl);
    const clientIp = req.ip || (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'local';

    const logLine = `${method} ${sanitizedUrl} - ${statusCode} (${duration}ms) [IP: ${clientIp}]`;

    if (statusCode >= 500) {
      logger.error(logLine);
    } else if (statusCode >= 400) {
      logger.warn(logLine);
    } else if (process.env.NODE_ENV !== 'production' || process.env.VERBOSE_LOGS === 'true') {
      // In production, silence routine 200/304 GET requests to keep Render console clean
      // Actual errors and warnings remain prominent, while detailed logs are in MongoDB Atlas
      logger.info(logLine);
    }
  });

  next();
}
