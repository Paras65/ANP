import { GoogleGenAI } from '@google/genai';
import { getSafeGeminiErrorMessage, redactSecretKeys } from '../utils/sanitize.js';

export interface AIHeadlineResponse {
  style: 'breaking' | 'investigative' | 'viral';
  headline: string;
}

export interface GeminiAssistantRequest {
  action: 'generate-headlines' | 'summarize' | 'polish';
  topic?: string;
  content?: string;
  district?: string;
  author?: string;
}

/**
 * Resilient multi-model executor: tries modern universal models with fallback
 */
async function generateWithFallback(ai: GoogleGenAI, contents: string): Promise<string> {
  const candidateModels = [
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-3.6-flash',
    'gemini-3.7-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash'
  ];

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents
      });
      const text = res.text?.trim();
      if (text) {
        return text;
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      // If error is invalid API key or unauthenticated, immediately throw to alert user
      if (
        errMsg.includes('API_KEY_INVALID') || 
        errMsg.includes('API key not valid') || 
        errMsg.includes('UNAUTHENTICATED') ||
        errMsg.includes('401')
      ) {
        throw err;
      }
      console.warn(`[GEMINI_FALLBACK] Model ${model} failed, trying next candidate. Error: ${redactSecretKeys(errMsg).slice(0, 100)}`);
    }
  }

  throw lastError || new Error('सभी उपलब्ध Gemini AI मॉडल से उत्तर प्राप्त करने में विफल।');
}

export async function processGeminiNewsTask(req: GeminiAssistantRequest): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !apiKey.trim() || apiKey === 'your_gemini_api_key_here') {
    throw new Error('सर्वर पर GEMINI_API_KEY कॉन्फ़िगर नहीं है। कृपया Render Dashboard में वैध Google Gemini API Key जोड़ें।');
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

    if (req.action === 'generate-headlines') {
      const topic = (req.topic || req.content || '').trim();
      if (!topic) {
        throw new Error('हेडलाइन जनरेट करने के लिए विषय या खबर सामग्री आवश्यक है।');
      }

      const dist = req.district || 'छत्तीसगढ़';
      const prompt = `आप एम्बिशन न्यूज़ (छत्तीसगढ़ व मध्य प्रदेश का प्रमुख डिजिटल न्यूज़ नेटवर्क) के वरिष्ठ संपादक हैं।
विषय: "${topic}"
जिला: "${dist}"

कृपया इस समाचार के लिए 3 अलग-अलग पत्रकारिता शैलियों में सटीक, आकर्षक और उच्च-क्लिक हिंदी शीर्षक (Headlines) बनाएं:
1. breaking (🔴 से शुरू होने वाली ताज़ा ब्रेकिंग न्यूज़)
2. investigative (तथ्य, जांच व ग्राउंड रिपोर्ट आधारित)
3. viral (जनहित, असरदार व भावनात्मक)

केवल शुद्ध JSON ऐरे लौटाएं, कोई मार्कडाउन कोडब्लॉक नहीं:
[
  {"style": "breaking", "headline": "..."},
  {"style": "investigative", "headline": "..."},
  {"style": "viral", "headline": "..."}
]`;

      const rawText = await generateWithFallback(ai, prompt);
      const cleaned = rawText
        .replace(/^```json/i, '')
        .replace(/^```/, '')
        .replace(/```$/, '')
        .trim();

      try {
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        const lines = rawText.split('\n').filter(l => l.trim().length > 5);
        return [
          { style: 'breaking', headline: lines[0] || `🔴 ${dist} बड़ी खबर: ${topic}` },
          { style: 'investigative', headline: lines[1] || `${topic} मामले में नया खुलासा` },
          { style: 'viral', headline: lines[2] || `${dist} में ${topic}: ग्राउंड रिपोर्ट` }
        ];
      }
    }

    if (req.action === 'summarize') {
      const content = (req.content || req.topic || '').trim();
      if (!content) {
        throw new Error('सारांश बनाने के लिए समाचार सामग्री (Content) आवश्यक है।');
      }

      const dist = req.district || 'कवर्धा';
      const prompt = `आप एम्बिशन न्यूज़ के संपादक हैं। नीचे दिए गए समाचार का केवल 2 वाक्यों में अत्यंत सटीक, पठनीय और स्पष्ट संक्षिप्त सारांश (Excerpt) लिखें (अधिकतम 160 अक्षर)।
जिला: ${dist}
समाचार:
${content}

निर्देश: केवल सारांश का हिंदी टेक्स्ट लौटाएं, कोई भूमिका या अतिरिक्त शब्द नहीं।`;

      const resText = await generateWithFallback(ai, prompt);
      return resText;
    }

    if (req.action === 'polish') {
      const rawContent = (req.content || '').trim();
      const topic = (req.topic || '').trim();
      const dist = req.district || 'कवर्धा';
      const reporter = req.author || 'ब्यूरो चीफ';

      if (!rawContent && !topic) {
        throw new Error('पॉलिश करने के लिए समाचार सामग्री या ड्राफ्ट आवश्यक है।');
      }

      const prompt = `आप एम्बिशन न्यूज़ नेटवर्क (छत्तीसगढ़/म.प्र.) के मुख्य उप-संपादक (Chief Sub-Editor) हैं।
नीचे दिए गए कच्चे समाचार ड्राफ्ट को शुद्ध, गंभीर और आकर्षक पत्रकारिता हिंदी (Inverted Pyramid News Style) में पॉलिश करें।

विवरण:
- जिला: ${dist}
- रिपोर्टर: ${reporter}
- शीर्षक: ${topic || 'ताज़ा समाचार'}
- कच्चा ड्राफ्ट:
${rawContent || topic}

निर्देश:
1. शुरुआत में आधिकारिक डेटलाइन जोड़ें: 【एम्बिशन न्यूज़ • ${dist} डेस्क / रिपोर्ट: ${reporter}】
2. व्याकरण, वर्तनी और स्थानीय भाषा की त्रुटियों को दूर कर पत्रकारिता शैली में लिखें।
3. तथ्य और मूल जानकारी से छेड़छाड़ न करें।
4. अंत में जोड़ें: (विशेष रिपोर्ट: Ambition News Network)
5. केवल तैयार विस्तृत समाचार सामग्री ही लौटाएं।`;

      const resText = await generateWithFallback(ai, prompt);
      return resText;
    }

    throw new Error(`अमान्य AI कार्य: ${req.action}`);
  } catch (err: any) {
    console.error('💥 [GEMINI_ERROR]', redactSecretKeys(err?.message || String(err)));
    const safeMessage = getSafeGeminiErrorMessage(err);
    throw new Error(safeMessage);
  }
}
