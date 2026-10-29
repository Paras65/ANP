import type { Article, VideoBulletin, InstagramPost, MandiRate, DistrictItem } from '../types';

// Zero Code Policy: Dynamic Environment Variables & Runtime Resolution
const siteUrl = import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://ambitionnews.init65.co.in');
const siteDomain = import.meta.env.VITE_SITE_DOMAIN || (typeof window !== 'undefined' ? window.location.hostname : 'ambitionnews.init65.co.in');
const supportEmail = import.meta.env.VITE_GRIEVANCE_EMAIL || 'grievance@ambitionnews.in';
const contactPhone = import.meta.env.VITE_CONTACT_PHONE || '7000139694';
const contactPhoneFormatted = import.meta.env.VITE_CONTACT_PHONE_FORMATTED || '+91 70001 39694';

export const SOCIAL_LINKS = {
  website: siteUrl,
  domain: siteDomain,
  email: supportEmail,
  grievanceEmail: supportEmail,
  logo: '/logo-96.webp',
  phone: contactPhone,
  phoneFormatted: contactPhoneFormatted,
  whatsappDirect: `https://wa.me/91${contactPhone.replace(/\D/g, '')}`,
  instagram: 'https://www.instagram.com/ambition_news/',
  instagramHandle: '@ambition_news',
  instagramBio: 'Ambition news ( कवर्धा ) • निष्पक्ष एवं निर्भीक क्षेत्रीय पत्रकारिता',
  youtube: 'https://www.youtube.com/@ambition_news',
  youtubeHandle: '@ambition_news',
  youtubeSubs: '4.56K+',
  facebook: 'https://www.facebook.com/people/Ambitionnews-Kawardha/61585264107649/',
  facebookHandle: 'Ambitionnews Kawardha',
  whatsappShare: 'https://wa.me/?text=',
  whatsappChannel: 'https://chat.whatsapp.com/LlvVXPw56G9IRY7YmeDsj2?s=cl&p=a&mlu=4&ilr=4',
  whatsappGroup: 'https://chat.whatsapp.com/LlvVXPw56G9IRY7YmeDsj2?s=cl&p=a&mlu=4&ilr=4',
  headquarters: 'कवर्धा (कबीरधाम), छत्तीसगढ़'
};

// ZERO DUMMY DATA: All content is dynamically fetched live from MongoDB Atlas backend API
export const INITIAL_ARTICLES: Article[] = [];
export const VIDEO_BULLETINS: VideoBulletin[] = [];
export const INSTAGRAM_POSTS: InstagramPost[] = [];
export const MANDI_RATES: MandiRate[] = [];

export const POPULAR_DISTRICTS_CG = [
  'कबीरधाम (कवर्धा)',
  'रायपुर',
  'बिलासपुर',
  'दुर्ग',
  'राजनंदगांव',
  'बस्तर',
  'कोरबा',
  'रायगढ़',
  'सरगुजा'
];

export const POPULAR_DISTRICTS_MP = [
  'भोपाल',
  'इंदौर',
  'जबलपुर',
  'ग्वालियर',
  'उज्जैन',
  'सागर',
  'रीवा',
  'छिंदवाड़ा'
];

export const ALL_DISTRICTS_DEMO: DistrictItem[] = [
  { _id: 'd-kwd', name: 'Kabirdham', nameHindi: 'कबीरधाम (कवर्धा)', slug: 'kabirdham', state: 'chhattisgarh' },
  { _id: 'd-rpr', name: 'Raipur', nameHindi: 'रायपुर', slug: 'raipur', state: 'chhattisgarh' },
  { _id: 'd-bsp', name: 'Bilaspur', nameHindi: 'बिलासपुर', slug: 'bilaspur', state: 'chhattisgarh' },
  { _id: 'd-drg', name: 'Durg', nameHindi: 'दुर्ग', slug: 'durg', state: 'chhattisgarh' },
  { _id: 'd-rjn', name: 'Rajnandgaon', nameHindi: 'राजनंदगांव', slug: 'rajnandgaon', state: 'chhattisgarh' },
  { _id: 'd-bst', name: 'Bastar', nameHindi: 'बस्तर', slug: 'bastar', state: 'chhattisgarh' },
  { _id: 'd-krb', name: 'Korba', nameHindi: 'कोरबा', slug: 'korba', state: 'chhattisgarh' },
  { _id: 'd-rgh', name: 'Raigarh', nameHindi: 'रायगढ़', slug: 'raigarh', state: 'chhattisgarh' },
  { _id: 'd-sgj', name: 'Surguja', nameHindi: 'सरगुजा', slug: 'surguja', state: 'chhattisgarh' },
  { _id: 'd-dnt', name: 'Dantewada', nameHindi: 'दंतेवाड़ा', slug: 'dantewada', state: 'chhattisgarh' },
  { _id: 'd-bpl', name: 'Bhopal', nameHindi: 'भोपाल', slug: 'bhopal', state: 'madhya-pradesh' },
  { _id: 'd-idr', name: 'Indore', nameHindi: 'इंदौर', slug: 'indore', state: 'madhya-pradesh' },
  { _id: 'd-jbl', name: 'Jabalpur', nameHindi: 'जबलपुर', slug: 'jabalpur', state: 'madhya-pradesh' },
  { _id: 'd-gwl', name: 'Gwalior', nameHindi: 'ग्वालियर', slug: 'gwalior', state: 'madhya-pradesh' },
  { _id: 'd-ujn', name: 'Ujjain', nameHindi: 'उज्जैन', slug: 'ujjain', state: 'madhya-pradesh' },
  { _id: 'd-sgr', name: 'Sagar', nameHindi: 'सागर', slug: 'sagar', state: 'madhya-pradesh' },
  { _id: 'd-rew', name: 'Rewa', nameHindi: 'रीवा', slug: 'rewa', state: 'madhya-pradesh' },
  { _id: 'd-chw', name: 'Chhindwara', nameHindi: 'छिंदवाड़ा', slug: 'chhindwara', state: 'madhya-pradesh' }
];
