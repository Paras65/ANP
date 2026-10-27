import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { logger } from '../utils/logger.js';
import { redactSecretKeys, getSafeGeminiErrorMessage } from '../utils/sanitize.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'सर्वर पर अप्रत्याशित त्रुटि हुई (Internal Server Error)';

  // 1. Operational AppErrors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    message = err.message;
  } 
  // 2. Mongoose Validation Errors
  else if (err?.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    const fieldErrors = Object.values(err.errors || {}).map((e: any) => e.message);
    message = fieldErrors.length > 0 ? fieldErrors.join(', ') : 'डेटा सत्यापन विफल (Validation Failed)';
  }
  // 3. Mongoose Invalid ObjectId (CastError)
  else if (err?.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_ID';
    message = `अमान्य संसाधन पहचानकर्ता (Invalid ID format for ${err.path || 'resource'})`;
  }
  // 4. Mongoose Duplicate Key (11000)
  else if (err?.code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_ENTRY';
    message = 'यह रिकॉर्ड पहले से डेटाबेस में मौजूद है (Duplicate Record)';
  }
  // 5. JWT Authentication Errors
  else if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED_OR_INVALID';
    message = 'एडमिन सत्र समाप्त या अमान्य है। कृपया पुनः लॉग इन करें।';
  }
  // 6. JSON Syntax Error in Body Parser
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    errorCode = 'INVALID_JSON';
    message = 'अनुरोध में अमान्य JSON प्रारूप (Malformed JSON payload)';
  }
  // 7. Gemini / AI Errors
  else if (err?.message?.includes('Gemini') || err?.message?.includes('API_KEY')) {
    statusCode = 500;
    errorCode = 'AI_SERVICE_ERROR';
    message = getSafeGeminiErrorMessage(err);
  }
  // 8. General Operational Message if available
  else if (err?.message) {
    message = redactSecretKeys(err.message);
  }

  // Final Redaction pass to ensure zero secrets in message
  const sanitizedMessage = redactSecretKeys(message);

  // Log error securely (never logs credentials)
  logger.error(
    `[${req.method}] ${req.originalUrl} - ${statusCode} ${errorCode}: ${sanitizedMessage}`
  );

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
