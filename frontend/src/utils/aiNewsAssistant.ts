/**
 * Ambition News Portal - Dynamic Gemini AI Assistant
 * Communicates with backend /api/ai/assistant.
 * ZERO credentials stored in client bundle.
 * No static fallback: if Gemini fails or is unconfigured, reports exact error so editor can speak or type manually.
 */
import api from '../api/client';

export interface AIHeadlineSuggestion {
  style: 'breaking' | 'investigative' | 'viral';
  headline: string;
}

export async function generateHeadlinesAI(
  topicOrDraft: string, 
  district: string = 'कवर्धा'
): Promise<AIHeadlineSuggestion[]> {
  const cleanTopic = topicOrDraft.trim();
  if (!cleanTopic) {
    throw new Error('कृपया पहले हेडलाइन या कुछ पंक्तियां लिखें');
  }

  const res = await api.post('/ai/assistant', {
    action: 'generate-headlines',
    topic: cleanTopic,
    district
  });

  if (res.data?.success && Array.isArray(res.data.data)) {
    return res.data.data;
  }

  throw new Error(res.data?.message || 'Gemini से हेडलाइन प्राप्त नहीं हो सकी');
}

export async function autoSummarizeAI(
  content: string, 
  district: string = 'कवर्धा'
): Promise<string> {
  const cleanContent = content.trim();
  if (!cleanContent) {
    throw new Error('कृपया पहले विस्तृत समाचार सामग्री (Content) लिखें');
  }

  const res = await api.post('/ai/assistant', {
    action: 'summarize',
    content: cleanContent,
    district
  });

  if (res.data?.success && typeof res.data.data === 'string') {
    return res.data.data;
  }

  throw new Error(res.data?.message || 'Gemini से सारांश प्राप्त नहीं हो सका');
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
}
