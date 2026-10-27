import { rateLimit } from 'express-rate-limit';

// 1. Strict Brute-Force Rate Limiter for Authentication & PIN endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
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
  message: {
    success: false,
    message: 'सामग्री निर्माण दर सीमा समाप्त (Rate limit exceeded)। Burp Suite / Postman जैसे टूल्स से ऑटोमेटेड फ्लडिंग प्रतिबंधित है।',
    error: {
      code: 'CONTENT_WRITE_LIMIT_EXCEEDED',
      message: 'Too many write requests in a short period. Please wait 15 minutes.'
    }
  }
});
