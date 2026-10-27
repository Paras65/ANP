/**
 * Ambition News Portal - Dynamic Gemini AI Assistant
 * Communicates with backend /api/ai/assistant.
 * ZERO credentials stored in client bundle.
 * Strict No-Leak Policy: Redacts any token or key pattern from client display, console, and network.
 */
import api from '../api/client';

export interface AIHeadlineSuggestion {
  style: 'breaking' | 'investigative' | 'viral';
  headline: string;
}

export function redactClientSecret(input: any): string {
  if (!input) return '';
  const text = typeof input === 'string' ? input : (input.message || JSON.stringify(input));
  return text
    .replace(/AIza[0-9A-Za-z\-_]{30,}/g, '[REDACTED_KEY]')
    .replace(/([?&]key=)[^&\s]+/gi, '$1[REDACTED_KEY]')
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED_TOKEN]');
}

export async function generateHeadlinesAI(
  topicOrDraft: string, 
  district: string = 'कवर्धा'
): Promise<AIHeadlineSuggestion[]> {
  const cleanTopic = topicOrDraft.trim();
  if (!cleanTopic) {
    throw new Error('कृपया पहले हेडलाइन या कुछ पंक्तियां लिखें');
  }

  try {
    const res = await api.post('/ai/assistant', {
      action: 'generate-headlines',
      topic: cleanTopic,
      district
    });

    if (res.data?.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }

    throw new Error(res.data?.message || 'Gemini से हेडलाइन प्राप्त नहीं हो सकी');
  } catch (err: any) {
    const rawMsg = err.response?.data?.message || err.message || 'Gemini AI सेवा से संपर्क नहीं हो सका';
    throw new Error(redactClientSecret(rawMsg));
  }
}

export async function autoSummarizeAI(
  content: string, 
  district: string = 'कवर्धा'
): Promise<string> {
  const cleanContent = content.trim();
  if (!cleanContent) {
    throw new Error('कृपया पहले विस्तृत समाचार सामग्री (Content) लिखें');
  }

  try {
    const res = await api.post('/ai/assistant', {
      action: 'summarize',
      content: cleanContent,
      district
    });

    if (res.data?.success && typeof res.data.data === 'string') {
      return res.data.data;
    }

    throw new Error(res.data?.message || 'Gemini से सारांश प्राप्त नहीं हो सका');
  } catch (err: any) {
    const rawMsg = err.response?.data?.message || err.message || 'Gemini AI सेवा से संपर्क नहीं हो सका';
    throw new Error(redactClientSecret(rawMsg));
  }
}

export async function polishArticleAI(
  rawContent: string, 
  headline: string, 
  district: string, 
  author: string
): Promise<string> {
  const cleanContent = rawContent.trim();
  const cleanTopic = headline.trim();

  if (!cleanContent && !cleanTopic) {
    throw new Error('कृपया पॉलिश करने के लिए समाचार ड्राफ्ट लिखें');
  }

  try {
    const res = await api.post('/ai/assistant', {
      action: 'polish',
      content: cleanContent,
      topic: cleanTopic,
      district,
      author
    });

    if (res.data?.success && typeof res.data.data === 'string') {
      return res.data.data;
    }

    throw new Error(res.data?.message || 'Gemini से पॉलिश रिपोर्ट प्राप्त नहीं हो सकी');
  } catch (err: any) {
    const rawMsg = err.response?.data?.message || err.message || 'Gemini AI सेवा से संपर्क नहीं हो सका';
    throw new Error(redactClientSecret(rawMsg));
  }
}
