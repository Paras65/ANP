import { Request, Response } from 'express';
import { logger } from '../utils/logger.js';
import { redactSecretKeys } from '../utils/sanitize.js';

export function notFoundHandler(req: Request, res: Response) {
  const sanitizedUrl = redactSecretKeys(req.originalUrl);
  logger.warn(`[404 NOT FOUND] ${req.method} ${sanitizedUrl}`);

  res.status(404).json({
    success: false,
    message: `अनुरोधित एंडपॉइंट उपलब्ध नहीं है: ${sanitizedUrl}`,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The endpoint ${sanitizedUrl} was not found on this server.`
    }
  });
}
