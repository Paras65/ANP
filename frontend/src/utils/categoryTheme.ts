// Ambition News Portal — Smart Category Theme & Content Engine
// Automatically provides authentic, topic-driven visuals, ring gradients, and icons

export interface CategoryThemeInfo {
  key: string;
  label: string;
  icon: string;
  badgeBg: string;
  badgeText: string;
  gradient: string;
  photoUrl: string;
  ringGradient: string;
  accentColor: string;
  defaultExcerpt?: string;
}

export const CATEGORY_THEMES: Record<string, CategoryThemeInfo> = {
  mandi: {
    key: 'mandi',
    label: 'कृषि व मंडी भाव',
    icon: '🌾',
    badgeBg: 'bg-emerald-950 text-emerald-300 border border-emerald-700',
    badgeText: 'कृषि • मंडी',
    gradient: 'linear-gradient(135deg, #064e3b 0%, #022c22 45%, #0f172a 100%)',
    photoUrl: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=1000&auto=format&fit=crop&q=80',
    ringGradient: 'from-emerald-400 via-teal-500 to-green-600',
    accentColor: '#10b981'
  },
  police: {
    key: 'police',
    label: 'पुलिस व सुरक्षा',
    icon: '🚔',
    badgeBg: 'bg-blue-950 text-blue-300 border border-blue-700',
    badgeText: 'सुरक्षा अलर्ट',
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 45%, #1e1b4b 100%)',
    photoUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1000&auto=format&fit=crop&q=80',
    ringGradient: 'from-blue-500 via-indigo-600 to-cyan-500',
    accentColor: '#3b82f6'
  },
  weather: {
    key: 'weather',
    label: 'मौसम व चिल्फी घाटी',
    icon: '🌦️',
    badgeBg: 'bg-teal-950 text-teal-300 border border-teal-700',
    badgeText: 'मौसम विशेष',
    gradient: 'linear-gradient(135deg, #134e4a 0%, #042f2e 45%, #0f172a 100%)',
    photoUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000&auto=format&fit=crop&q=80',
    ringGradient: 'from-teal-400 via-cyan-500 to-sky-600',
    accentColor: '#14b8a6'
  },
  heritage: {
    key: 'heritage',
    label: 'भोरमदेव व कवर्धा धरोहर',
    icon: '🛕',
    badgeBg: 'bg-amber-950 text-amber-300 border border-amber-700',
    badgeText: 'कवर्धा धरोहर',
    gradient: 'linear-gradient(135deg, #78350f 0%, #451a03 45%, #1c1917 100%)',
    photoUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1000&auto=format&fit=crop&q=80',
    ringGradient: 'from-amber-400 via-orange-500 to-red-600',
    accentColor: '#f59e0b'
  },
  infra: {
    key: 'infra',
    label: 'विकास व निर्माण',
    icon: '🏗️',
    badgeBg: 'bg-slate-800 text-orange-300 border border-orange-700/60',
    badgeText: 'विकास एक्सप्रेस',
    gradient: 'linear-gradient(135deg, #374151 0%, #1f2937 45%, #111827 100%)',
    photoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1000&auto=format&fit=crop&q=80',
    ringGradient: 'from-orange-400 via-amber-500 to-yellow-500',
    accentColor: '#f97316'
  },
  politics: {
    key: 'politics',
    label: 'शासन व राजनीति',
    icon: '🏛️',
    badgeBg: 'bg-rose-950 text-rose-300 border border-rose-700',
    badgeText: 'शासन निर्णय',
    gradient: 'linear-gradient(135deg, #881337 0%, #4c0519 45%, #0f172a 100%)',
    photoUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1000&auto=format&fit=crop&q=80',
    ringGradient: 'from-rose-500 via-red-600 to-amber-500',
    accentColor: '#f43f5e'
  },
  education: {
    key: 'education',
    label: 'शिक्षा व रोजगार',
    icon: '🎓',
    badgeBg: 'bg-purple-950 text-purple-300 border border-purple-700',
    badgeText: 'शिक्षा • करियर',
    gradient: 'linear-gradient(135deg, #581c87 0%, #3b0764 45%, #0f172a 100%)',
    photoUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1000&auto=format&fit=crop&q=80',
    ringGradient: 'from-purple-500 via-fuchsia-600 to-pink-500',
    accentColor: '#a855f7'
  },
  health: {
    key: 'health',
    label: 'स्वास्थ्य व चिकित्सा',
    icon: '🏥',
    badgeBg: 'bg-red-950 text-red-300 border border-red-700',
    badgeText: 'स्वास्थ्य सेवा',
    gradient: 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 45%, #0f172a 100%)',
    photoUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1000&auto=format&fit=crop&q=80',
    ringGradient: 'from-red-400 via-rose-500 to-pink-600',
    accentColor: '#ef4444'
  },
  sports: {
    key: 'sports',
    label: 'खेल व युवा',
    icon: '🏆',
    badgeBg: 'bg-cyan-950 text-cyan-300 border border-cyan-700',
    badgeText: 'खेल जगत',
    gradient: 'linear-gradient(135deg, #164e63 0%, #083344 45%, #0f172a 100%)',
    photoUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1000&auto=format&fit=crop&q=80',
    ringGradient: 'from-cyan-400 via-blue-500 to-teal-500',
    accentColor: '#06b6d4'
  },
  breaking: {
    key: 'breaking',
    label: 'ताज़ा ब्रेकिंग',
    icon: '⚡',
    badgeBg: 'bg-red-950 text-red-300 border border-red-700',
    badgeText: '🔴 ब्रेकिंग',
    gradient: 'linear-gradient(135deg, #991b1b 0%, #450a0a 45%, #000000 100%)',
    photoUrl: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=1000&auto=format&fit=crop&q=80',
    ringGradient: 'from-red-600 via-rose-600 to-amber-500',
    accentColor: '#dc2626'
  }
};

/**
 * Intelligently maps an article category, title, or district to its authentic visual theme
 */
export function getCategoryTheme(category?: string, title?: string, district?: string): CategoryThemeInfo {
  const query = `${category || ''} ${title || ''} ${district || ''}`.toLowerCase();

  if (query.includes('मंडी') || query.includes('कृषि') || query.includes('धान') || query.includes('गुड़') || query.includes('किसान') || query.includes('फसल')) {
    return CATEGORY_THEMES.mandi;
  }
  if (query.includes('पुलिस') || query.includes('अपराध') || query.includes('क्राइम') || query.includes('सुरक्षा') || query.includes('थाना') || query.includes('गिरफ्तार') || query.includes('एसपी')) {
    return CATEGORY_THEMES.police;
  }
  if (query.includes('मौसम') || query.includes('चिल्फी') || query.includes('कोहरा') || query.includes('बारिश') || query.includes('ठंड') || query.includes('तापमान') || query.includes('घाटी')) {
    return CATEGORY_THEMES.weather;
  }
  if (query.includes('भोरमदेव') || query.includes('धरोहर') || query.includes('मंदिर') || query.includes('पर्यटन') || query.includes('कवर्धा स्पेशल') || query.includes('कबीरधाम')) {
    return CATEGORY_THEMES.heritage;
  }
  if (query.includes('सड़क') || query.includes('विकास') || query.includes('हाईवे') || query.includes('पुल') || query.includes('निर्माण') || query.includes('फ्लाईओवर')) {
    return CATEGORY_THEMES.infra;
  }
  if (query.includes('शिक्षा') || query.includes('स्कूल') || query.includes('कॉलेज') || query.includes('परीक्षा') || query.includes('छात्र') || query.includes('रोजगार') || query.includes('युवा')) {
    return CATEGORY_THEMES.education;
  }
  if (query.includes('अस्पताल') || query.includes('स्वास्थ्य') || query.includes('डॉक्टर') || query.includes('चिकित्सा') || query.includes('मरीज') || query.includes('इलाज')) {
    return CATEGORY_THEMES.health;
  }
  if (query.includes('खेल') || query.includes('क्रिकेट') || query.includes('मैदान') || query.includes('खिलाड़ी') || query.includes('टूर्नामेंट')) {
    return CATEGORY_THEMES.sports;
  }
  if (query.includes('राजनीति') || query.includes('सरकार') || query.includes('मंत्रालय') || query.includes('कैबिनेट') || query.includes('विधायक') || query.includes('मुख्यमंत्री')) {
    return CATEGORY_THEMES.politics;
  }

  return CATEGORY_THEMES.breaking;
}

/**
 * Returns a high-res cover image URL for an article, falling back to a smart contextual category image
 * instead of repeating a static channel logo everywhere.
 */
export function getSmartCoverImage(coverImage?: string, category?: string, title?: string, district?: string): string {
  if (coverImage && coverImage.trim() && !coverImage.includes('photo-1585829365295') && !coverImage.includes('logo.png')) {
    return coverImage.trim();
  }
  const theme = getCategoryTheme(category, title, district);
  return theme.photoUrl;
}

