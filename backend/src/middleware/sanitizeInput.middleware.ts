import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

function cleanObject(obj: any, onThreatDetected?: (key: string) => void): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => cleanObject(item, onThreatDetected));
  }

  const cleaned: Record<string, any> = {};

  for (const key of Object.keys(obj)) {
    // Defend against NoSQL Injection: reject keys with $ or .
    if (key.startsWith('$') || key.includes('.')) {
      if (onThreatDetected) onThreatDetected(key);
      continue;
    }

    let val = obj[key];
    if (typeof val === 'string') {
      // Strip dangerous null byte characters
      if (val.includes('\0')) {
        if (onThreatDetected) onThreatDetected(`${key} (null byte)`);
        val = val.replace(/\0/g, '');
      }
    } else if (typeof val === 'object' && val !== null) {
      val = cleanObject(val, onThreatDetected);
    }

    cleaned[key] = val;
  }

  return cleaned;
}

/**
 * Global Request Sanitizer Middleware
 * Protects MongoDB against NoSQL Injection and null-byte bypasses.
 * Logs forensic security warnings when malicious operators are stripped.
 */
export function sanitizeInputs(req: Request, _res: Response, next: NextFunction) {
  const threats: string[] = [];
  const recordThreat = (key: string) => {
    threats.push(key);
  };

  if (req.body) {
    req.body = cleanObject(req.body, recordThreat);
  }

  if (req.query) {
    req.query = cleanObject(req.query, recordThreat);
  }

  if (req.params) {
    req.params = cleanObject(req.params, recordThreat);
  }

  if (threats.length > 0) {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    const userAgent = String(req.headers['user-agent'] || 'unknown').slice(0, 120);
    logger.warn(
      `🛡️ [NOSQL_INJECTION_DEFLECTED] IP=${clientIp} UA="${userAgent}" ${req.method} ${req.originalUrl} - Stripped operators: [${threats.join(', ')}]`
    );
  }

  next();
}
