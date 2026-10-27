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
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'local';

    const logLine = `${method} ${sanitizedUrl} - ${statusCode} (${duration}ms) [IP: ${clientIp}]`;

    if (statusCode >= 500) {
      logger.error(logLine);
    } else if (statusCode >= 400) {
      logger.warn(logLine);
    } else {
      logger.info(logLine);
    }
  });

  next();
}
