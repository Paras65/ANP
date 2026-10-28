import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { logger } from '../utils/logger.js';
import { redactSecretKeys, getSafeGeminiErrorMessage } from '../utils/sanitize.js';
import { recordSecurityIncident } from '../services/securityAudit.service.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'सर्वर पर अप्रत्याशित त्रुटि हुई (Internal Server Error)';

  // 1. Operational AppErrors (Bloat guard, Auth, Business rules)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    message = err.message;
  } 
  // 2. Express Payload Too Large (413 from body-parser 500KB limit)
  else if (err?.type === 'entity.too.large' || err?.status === 413 || err?.statusCode === 413) {
    statusCode = 413;
    errorCode = 'PAYLOAD_TOO_LARGE';
    message = 'अनुरोध पेलोड डेटाबेस सुरक्षा सीमा (500KB) से बड़ा है (Payload Too Large)। अनुरोध अस्वीकृत किया गया।';
  }
  // 3. Mongoose Validation Errors
  else if (err?.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    const fieldErrors = Object.values(err.errors || {}).map((e: any) => e.message);
    message = fieldErrors.length > 0 ? fieldErrors.join(', ') : 'डेटा सत्यापन विफल (Validation Failed)';
  }
  // 4. Mongoose Invalid ObjectId (CastError)
  else if (err?.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_ID';
    message = `अमान्य संसाधन पहचानकर्ता (Invalid ID format for ${err.path || 'resource'})`;
  }
  // 5. Mongoose Duplicate Key (11000)
  else if (err?.code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_ENTRY';
    message = 'यह रिकॉर्ड पहले से डेटाबेस में मौजूद है (Duplicate Record)';
  }
  // 6. JWT Authentication Errors
  else if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED_OR_INVALID';
    message = 'एडमिन सत्र समाप्त या अमान्य है। कृपया पुनः लॉग इन करें।';
  }
  // 7. JSON Syntax Error in Body Parser
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    errorCode = 'INVALID_JSON';
    message = 'अनुरोध में अमान्य JSON प्रारूप (Malformed JSON payload)';
  }
  // 8. Gemini / AI Errors
  else if (
    req.originalUrl?.includes('/ai/') ||
    err?.message?.includes('Gemini') || 
    err?.message?.includes('API_KEY') ||
    err?.message?.includes('GoogleGenAI') ||
    err?.message?.includes('generateContent')
  ) {
    statusCode = err?.status === 429 || err?.message?.includes('429') ? 429 : 500;
    errorCode = statusCode === 429 ? 'AI_RATE_LIMIT_EXCEEDED' : 'AI_SERVICE_ERROR';
    message = getSafeGeminiErrorMessage(err);
  }
  // 9. General Operational Message if available
  else if (err?.message) {
    message = redactSecretKeys(err.message);
  }

  // Final Redaction pass to ensure zero secrets in message
  const sanitizedMessage = redactSecretKeys(message);

  // Extract forensic metadata for optimized real-time debugging
  const clientIp = req.ip || (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  const userAgent = String(req.headers['user-agent'] || 'unknown').slice(0, 120);

  // High-visibility, categorized security and error logging (Quiet in production)
  if (statusCode >= 400 && statusCode < 500) {
    logger.warn(
      `🛡️ [BLOCKED_${statusCode}] [${errorCode}] IP=${clientIp} UA="${userAgent}" ${req.method} ${req.originalUrl} - ${sanitizedMessage}`
    );
  } else {
    logger.error(
      `💥 [ERROR_${statusCode}] [${errorCode}] IP=${clientIp} UA="${userAgent}" ${req.method} ${req.originalUrl} - ${sanitizedMessage}`
    );
  }

  // Save all errors (4xx and 5xx) to MongoDB Atlas for Super Admin monitoring
  if (statusCode >= 400) {
    let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
    if (['BASE64_PAYLOAD_FORBIDDEN', 'PAYLOAD_TOO_COMPLEX', 'AUTH_RATE_LIMIT_EXCEEDED'].includes(errorCode) || statusCode >= 500) {
      severity = 'CRITICAL';
    } else if (errorCode === 'AI_SERVICE_ERROR' || statusCode === 429) {
      severity = 'HIGH';
    } else if (statusCode === 404) {
      severity = 'LOW';
    }

    const actionDetail = req.body?.action ? `कार्य: ${req.body.action}` : undefined;

    recordSecurityIncident({
      eventType: errorCode,
      severity,
      ip: clientIp,
      userAgent,
      method: req.method,
      path: req.originalUrl,
      statusCode,
      message: sanitizedMessage,
      details: actionDetail,
      blocked: statusCode < 500
    });
  }

  const responsePayload: Record<string, any> = {
    success: false,
    message: sanitizedMessage, // Backward-compatible for client toast
    error: {
      code: errorCode,
      message: sanitizedMessage
    }
  };

  // Only include sanitized stack trace in development mode
  if (process.env.NODE_ENV === 'development' && err?.stack) {
    responsePayload.error.stack = redactSecretKeys(err.stack);
  }

  res.status(statusCode).json(responsePayload);
}
