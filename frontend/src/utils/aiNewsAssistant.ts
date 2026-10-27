/**
 * Ambition News Portal - AI News Assistant
 * Provides smart Hindi headline generation, summarization, and article polishing.
 */

export interface AIHeadlineSuggestion {
  style: 'breaking' | 'investigative' | 'viral';
  headline: string;
}

export async function generateHeadlinesAI(
  rawInput: string, 
  district: string = 'कवर्धा'
): Promise<AIHeadlineSuggestion[]> {
  const cleanInput = rawInput.trim();
  const dist = district || 'छत्तीसगढ़';

  // Smart algorithmic journalistic templates tailored to Chhattisgarh & MP journalism
  const cleanTopic = cleanInput
    .replace(/^.*?:/g, '')
    .replace(/(में|पर|का|के|की|को)\s*$/g, '')
    .trim();

  return [
    {
      style: 'breaking',
      headline: `🔴 ${dist} बड़ी खबर: ${cleanTopic || 'प्रशासन का बड़ा फैसला, आदेश जारी'}`
    },
    {
      style: 'investigative',
      headline: `${cleanTopic || 'योजना पर नया विवाद'}, मौके पर पहुंची टीम; जानिए पूरा मामला`
    },
    {
      style: 'viral',
      headline: `${dist} में ${cleanTopic || 'बड़ा उलटफेर'}: जनता में भारी उत्साह, सीधे ग्राउंड से देखें रिपोर्ट`
    }
  ];
}

export function autoSummarizeAI(content: string, district: string = 'कवर्धा'): string {
  if (!content || content.trim().length === 0) {
    return `${district}: मुख्य घटनाक्रम को लेकर प्रशासन सतर्क, विस्तृत जांच जारी है।`;
  }

  const sentences = content
    .split(/[।.\n]/)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  if (sentences.length === 0) {
    return content.slice(0, 140) + '...';
  }

  const firstTwo = sentences.slice(0, 2).join('। ') + '।';
  return firstTwo.length > 180 ? firstTwo.slice(0, 175) + '...' : firstTwo;
}

export function polishArticleAI(
  rawContent: string, 
  headline: string, 
  district: string, 
  author: string
): string {
  const dist = district || 'कवर्धा';
  const reporter = author || 'ब्यूरो चीफ';
  const dateline = `【एम्बिशन न्यूज़ • ${dist} डेस्क / रिपोर्ट: ${reporter}】\n\n`;

  const cleanBody = rawContent
    ? rawContent.trim()
    : `${headline} को लेकर क्षेत्र में बड़ी हलचल देखी जा रही है। स्थानीय नागरिकों और अधिकारियों से मिली जानकारी के अनुसार स्थिति पर लगातार नजर रखी जा रही है।`;

  return `${dateline}${cleanBody}\n\n(विशेष रिपोर्ट: Ambition News Network)`;
}

