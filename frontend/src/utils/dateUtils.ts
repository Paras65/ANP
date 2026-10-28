/**
 * Utility functions for Indian / Hindi Date and Time formatting in Ambition News Portal
 */

const HINDI_MONTHS = [
  'जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
  'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'
];

/**
 * Converts any date or ISO string into friendly, natural Hindi relative time:
 * e.g., "अभी-अभी", "12 मिनट पहले", "3 घंटे पहले", "कल, शाम 06:15", "25 अक्टूबर 2026"
 */
export function formatRelativeHindiTime(dateInput?: string | Date | null): string {
  if (!dateInput) return 'आज ताज़ा';

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return 'आज ताज़ा';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  // Future dates safeguard
  if (diffMs < 0) return 'अभी-अभी';

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'अभी-अभी';
  }

  if (diffMin < 60) {
    return `${diffMin} मिनट पहले`;
  }

  if (diffHour < 24) {
    return `${diffHour} घंटे पहले`;
  }

  if (diffDay === 1) {
    const hours = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    return `कल, ${hours}:${mins}`;
  }

  if (diffDay < 7) {
    return `${diffDay} दिन पहले`;
  }

  // Full Hindi Date format: "28 अक्टूबर 2026"
  const day = date.getDate();
  const month = HINDI_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Estimates reading time in Hindi (e.g., "⏱️ 2 मिनट")
 */
export function estimateReadingTime(text?: string): string {
  if (!text) return '⏱️ 1 मिनट';
  const words = text.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.ceil(words / 140)); // Approx 140 Hindi words per min
  return `⏱️ ${mins} मिनट`;
}

/**
 * Formats view counts for news readership (e.g., "1.4k व्यूज" or "620 व्यूज")
 */
export function formatHindiViews(views?: number): string {
  if (!views || views <= 0) return '500+ व्यूज';
  if (views >= 100000) {
    return `${(views / 100000).toFixed(1)} लाख व्यूज`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}k व्यूज`;
  }
  return `${views} व्यूज`;
}

