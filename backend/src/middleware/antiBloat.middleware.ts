import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';

const MAX_STRING_LENGTH = 60000; // 60k chars max for rich article body
const MAX_URL_LENGTH = 2048;

/**
 * Deep inspector to check for Base64 image bombs, oversized strings, and JSON nesting attacks.
 */
function inspectPayloadForBloat(obj: any, depth: number = 0): void {
  if (depth > 6) {
    throw new AppError('गहरी नेस्टेड संरचना अस्वीकृत (Nested JSON depth limit exceeded).', 400, 'PAYLOAD_TOO_COMPLEX');
  }

  if (!obj || typeof obj !== 'object') {
    return;
  }

  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string') {
      // 1. Detect Base64 Image Bomb (common Burp Suite / Postman DB exhaustion vector)
      if (val.startsWith('data:image/') || val.startsWith('data:application/') || val.startsWith('data:video/')) {
        throw new AppError(
          `फ़ील्ड '${key}' में Base64 डेटा अस्वीकृत है। MongoDB Atlas स्टोरेज सुरक्षा के लिए केवल वैध इमेज URL (https://...) की अनुमति है।`,
          400,
          'BASE64_PAYLOAD_FORBIDDEN'
        );
      }

      // 2. Detect oversized individual string values (buffer bloat prevention)
      if (val.length > MAX_STRING_LENGTH) {
        throw new AppError(
          `फ़ील्ड '${key}' की लंबाई सीमा (${MAX_STRING_LENGTH} अक्षर) से अधिक है।`,
          400,
          'STRING_LENGTH_EXCEEDED'
        );
      }

      // 3. Image URL fields boundary check
      if (['coverImage', 'thumbnail', 'imageUrl'].includes(key)) {
        if (val.length > MAX_URL_LENGTH) {
          throw new AppError(`छवि URL की लंबाई ${MAX_URL_LENGTH} अक्षरों से अधिक नहीं हो सकती।`, 400, 'URL_TOO_LONG');
        }
        if (val.length > 0 && !val.startsWith('http://') && !val.startsWith('https://') && !val.startsWith('/')) {
          throw new AppError(`फ़ील्ड '${key}' एक मान्य URL होना चाहिए (http:// या https://)।`, 400, 'INVALID_URL_SCHEME');
        }
      }
    } else if (typeof val === 'object' && val !== null) {
      inspectPayloadForBloat(val, depth + 1);
    }
  }
}

/**
 * Express Middleware: Anti-Bloat & Storage Exhaustion Guard
 * Defends MongoDB Atlas M0 (512MB storage limit) against Burp Suite / Postman payload injection.
 */
export function antiBloatGuard(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    try {
      inspectPayloadForBloat(req.body);
    } catch (err) {
      return next(err);
    }
  }
  next();
}
