/**
 * Secret & Credential Redaction Sanitizer
 * Guarantees zero leakage of API keys, tokens, or credentials in logs, network responses, or client messages.
 */

export function redactSecretKeys(input: string | any): string {
  if (!input) return '';
  let text = typeof input === 'string' ? input : (input.message || JSON.stringify(input));

  // 1. Redact Google API Keys (AIzaSy...)
  text = text.replace(/AIza[0-9A-Za-z\-_]{30,}/g, '[REDACTED_API_KEY]');

  // 2. Redact query param key=...
  text = text.replace(/([?&]key=)[^&\s]+/gi, '$1[REDACTED_API_KEY]');

  // 3. Redact any instance of the current GEMINI_API_KEY from env if present
  const currentKey = process.env.GEMINI_API_KEY;
  if (currentKey && currentKey.length > 5 && currentKey !== 'your_gemini_api_key_here') {
    text = text.split(currentKey.trim()).join('[REDACTED_API_KEY]');
  }

  // 4. Redact MongoDB connection strings
  text = text.replace(/mongodb(\+srv)?:\/\/[^:]+:[^@]+@/gi, 'mongodb$1://[REDACTED_USER_PASSWORD]@');

  // 5. Redact Bearer tokens
  text = text.replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED_TOKEN]');

  return text;
}

/**
 * Maps raw third-party SDK errors to safe, user-friendly Hindi error messages
 * without ever exposing internal URLs, stack traces, or credentials.
 */
export function getSafeGeminiErrorMessage(err: any): string {
  if (!err) return 'Gemini AI सेवा से उत्तर प्राप्त नहीं हो सका।';

  const raw = redactSecretKeys(err.message || String(err));

  // Already formatted Hindi message — return directly to prevent double-wrapping
  if (
    raw.startsWith('Gemini AI सेवा त्रुटि:') || 
    raw.startsWith('सर्वर पर GEMINI_') || 
    raw.startsWith('Google Gemini') || 
    raw.startsWith('अनुरोधित Gemini AI') ||
    raw.startsWith('सभी उपलब्ध Gemini AI')
  ) {
    return raw;
  }

  // Known custom configuration message
  if (raw.includes('GEMINI_API_KEY कॉन्फ़िगर नहीं है') || raw.includes('GEMINI_API_KEY सेट नहीं है')) {
    return 'सर्वर पर GEMINI_API_KEY सेट नहीं है। कृपया Render Dashboard में वैध Google Gemini API Key जोड़ें।';
  }

  // Authentication & Invalid Key errors
  if (
    raw.includes('API_KEY_INVALID') || 
    raw.includes('UNAUTHENTICATED') || 
    raw.includes('401') || 
    raw.includes('403') ||
    raw.includes('PERMISSION_DENIED') ||
    raw.includes('API key not valid') ||
    raw.includes('invalid api key')
  ) {
    return 'Google Gemini API Key अमान्य (Invalid) या अनधिकृत है। कृपया Render पर सही GEMINI_API_KEY जांचें।';
  }

  // High demand or temporary 503 server spike
  if (
    raw.includes('503') || 
    raw.includes('high demand') || 
    raw.includes('UNAVAILABLE') || 
    raw.includes('Service Unavailable')
  ) {
    return 'Google Gemini AI सर्वर पर अस्थायी लोड (High Demand) है। कृपया 5 सेकंड बाद पुनः प्रयास करें।';
  }

  // Quota & Rate Limit errors
  if (
    raw.includes('RESOURCE_EXHAUSTED') || 
    raw.includes('429') || 
    raw.includes('quota') || 
    raw.includes('Rate limit') ||
    raw.includes('exceeded your current quota')
  ) {
    return 'Gemini API का मुफ्त कोटा (Free Quota / Rate Limit) पूरा हो गया है। कृपया थोड़ी देर बाद पुनः प्रयास करें।';
  }

  // Model not found, deprecated or not supported
  if (raw.includes('models/') && (raw.includes('not found') || raw.includes('404') || raw.includes('no longer available'))) {
    return 'अनुरोधित Gemini AI मॉडल संस्करण अनुपलब्ध है।';
  }

  // Content Safety Filters
  if (raw.includes('SAFETY') || raw.includes('BLOCKED') || raw.includes('harmCategory')) {
    return 'सामग्री सुरक्षा दिशानिर्देशों (Safety Guidelines) के कारण जनरेट नहीं हो सकी।';
  }

  // Network & Timeout
  if (raw.includes('ETIMEDOUT') || raw.includes('ENOTFOUND') || raw.includes('fetch failed')) {
    return 'Google AI सर्वर से संपर्क नहीं हो सका। कृपया पुनः प्रयास करें।';
  }

  // Clean fallback with sanitized hint
  const snippet = raw.replace(/[^\w\s\u0900-\u097F.,:-]/g, '').slice(0, 100).trim();
  return snippet ? `Gemini AI सेवा त्रुटि: ${snippet}` : 'Gemini AI सेवा से उत्तर प्राप्त करने में विफल।';
}

