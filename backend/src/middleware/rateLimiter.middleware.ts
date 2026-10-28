import { rateLimit } from 'express-rate-limit';
import { logger } from '../utils/logger.js';
import { recordSecurityIncident } from '../services/securityAudit.service.js';

function createRateLimitHandler(limiterName: string) {
  return (req: any, res: any, _next: any, options: any) => {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    const userAgent = String(req.headers['user-agent'] || 'unknown').slice(0, 120);

    logger.warn(
      `🛡️ [RATE_LIMIT_TRIPPED] [${limiterName}] IP=${clientIp} UA="${userAgent}" ${req.method} ${req.originalUrl} - Limit: ${options.limit || options.max} in ${options.windowMs / 1000}s`
    );

    const eventType = limiterName === 'AI_QUOTA_FLOOD_PROTECT'
      ? 'AI_RATE_LIMIT_EXCEEDED'
      : limiterName.includes('AUTH')
      ? 'AUTH_RATE_LIMIT_EXCEEDED'
      : 'RATE_LIMIT_TRIPPED';

    const severity = limiterName.includes('AUTH') 
      ? 'CRITICAL' 
      : limiterName === 'AI_QUOTA_FLOOD_PROTECT' 
      ? 'HIGH' 
      : 'MEDIUM';

    // Persist to MongoDB Atlas for Super Admin dashboard
    recordSecurityIncident({
      eventType,
      severity,
      ip: clientIp,
      userAgent,
      method: req.method,
      path: req.originalUrl,
      statusCode: options.statusCode || 429,
      message: options.message?.message || 'Rate limit exceeded',
      details: limiterName,
      blocked: true
    });

    res.status(options.statusCode).json(options.message);
  };
}

// 1. Strict Brute-Force Rate Limiter for Authentication & PIN endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  handler: createRateLimitHandler('AUTH_BRUTE_FORCE_PROTECT'),
  message: {
    success: false,
    message: 'बहुत अधिक गलत प्रयास दर्ज किए गए हैं। सुरक्षा कारणों से आपका IP 15 मिनट के लिए अस्थायी रूप से ब्लॉक किया गया है।',
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again after 15 minutes.'
    }
  }
});

// 2. Rate Limiter for Gemini AI Assistant to prevent quota exhaustion & DDoS attacks
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // Maximum 15 AI requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  handler: createRateLimitHandler('AI_QUOTA_FLOOD_PROTECT'),
  message: {
    success: false,
    message: 'Gemini AI अनुरोध दर सीमा समाप्त। कृपया 1 मिनट बाद पुनः प्रयास करें।',
    error: {
      code: 'AI_RATE_LIMIT_EXCEEDED',
      message: 'AI request limit reached. Please wait 1 minute before generating again.'
    }
  }
});

// 3. General Public API Rate Limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  handler: createRateLimitHandler('PUBLIC_API_TRAFFIC_PROTECT'),
  message: {
    success: false,
    message: 'अनुरोध दर सीमा समाप्त (Too many requests from this IP).',
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please slow down.'
    }
  }
});

// 4. Strict Content Mutation Rate Limiter (Defends against Burp Suite / Postman DB Bloat Flooding)
export const contentCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Maximum 30 write mutations per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  handler: createRateLimitHandler('BURP_POSTMAN_WRITE_FLOOD_PROTECT'),
  message: {
    success: false,
    message: 'सामग्री निर्माण दर सीमा समाप्त (Rate limit exceeded)। Burp Suite / Postman जैसे टूल्स से ऑटोमेटेड फ्लडिंग प्रतिबंधित है।',
    error: {
      code: 'CONTENT_WRITE_LIMIT_EXCEEDED',
      message: 'Too many write requests in a short period. Please wait 15 minutes.'
    }
  }
});
