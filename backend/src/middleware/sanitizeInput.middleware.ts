import { Request, Response, NextFunction } from 'express';

function cleanObject(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(cleanObject);
  }

  const cleaned: Record<string, any> = {};

  for (const key of Object.keys(obj)) {
    // Defend against NoSQL Injection: reject keys with $ or .
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }

    let val = obj[key];
    if (typeof val === 'string') {
      // Strip dangerous null byte characters
      val = val.replace(/\0/g, '');
    } else if (typeof val === 'object' && val !== null) {
      val = cleanObject(val);
    }

    cleaned[key] = val;
  }

  return cleaned;
}

/**
 * Global Request Sanitizer Middleware
 * Protects MongoDB against NoSQL Injection and null-byte bypasses.
 */
export function sanitizeInputs(req: Request, _res: Response, next: NextFunction) {
  if (req.body) {
    req.body = cleanObject(req.body);
  }

  if (req.query) {
    req.query = cleanObject(req.query);
  }

  if (req.params) {
    req.params = cleanObject(req.params);
  }

  next();
}
