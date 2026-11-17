import type { Article, VideoBulletin, InstagramPost, MandiRate, DistrictItem, Advertisement } from '../types';

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

// Baseline Live Data Cache for Instant Frame-0 LCP (Sub-1.5s Core Web Vitals)
export const INITIAL_ARTICLES: Article[] = [
  {
    _id: "6ae1764f98e0a076137b5321",
    title: "कवर्धा के तरेगांव जंगल थाना क्षेत्र में सराफा व्यापारी से बड़ी लूट! दो बाइक पर सवार 6 बदमाशों ने डंडे से हमला कर बाइक रुकवाई और सोने-चांदी के जेवरात व नकदी से भरा थैला लूटकर फरार हो गए। लूट की अनुमानित कीमत करीब 50 लाख रुपये बताई जा रही है।",
    excerpt: "कवर्धा के तरेगांव जंगल थाना क्षेत्र में सराफा व्यापारी से बड़ी लूट! दो बाइक पर सवार 6 बदमाशों ने डंडे से हमला कर बाइक रुकवाई और सोने-चांदी के जेवरात व नकदी से भरा थैला लूटकर फरार हो गए। लूट की अनुमानित कीमत करीब 50 लाख रुपये बताई जा रही है।",
    content: "कबीरधाम: तरेगांव में सराफा व्यापारी पर हमला कर 50 लाख की सनसनीखेज लूट, 2 बाइकों पर आए 6 बदमाशों ने दी वारदात को अंजाम\n\n【एम्बिशन न्यूज़ • कबीरधाम (कवर्धा) डेस्क / रिपोर्ट: मुख्य संपादक डेस्क】\n\nकबीरधाम। छत्तीसगढ़ के कबीरधाम (कवर्धा) जिले के तरेगांव जंगल थाना क्षेत्र में बेखौफ बदमाशों ने एक बड़ी वारदात को अंजाम देते हुए सराफा व्यापारी से लगभग 50 लाख रुपये के सोने-चांदी के जेवरात और नकदी लूट ली।",
    coverImage: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1000&auto=format&fit=crop&q=80",
    district: "कबीरधाम (कवर्धा)",
    state: "chhattisgarh",
    category: "🏛️ राजनीति",
    author: "मुख्य संपादक डेस्क",
    isBreaking: true,
    isFeatured: true,
    views: 1250,
    status: "PUBLISHED",
    publishedAt: "2026-10-28T18:20:41.157Z"
  },
  {
    _id: "6adf7d260c392ff51b264e7c",
    title: "भोपाल मेट्रो विस्तार परियोजना: 5 नए स्टेशनों का कार्य अंतिम चरण में, अगले माह शुरू हो सकता है ट्रायल रन",
    excerpt: "राजधानी के मुख्य मार्गों पर यातायात को सुगम बनाने के लिए प्रशासन ने नया रूट चार्ट जारी किया। आगामी माह में ट्रायल रन शुरू होने की पूरी संभावना...",
    content: "मध्य प्रदेश की राजधानी भोपाल में मेट्रो रेल परियोजना के पहले चरण का कार्य तेजी से पूरा किया जा रहा है। सुभाष नगर से एम्स तक के रूट पर सिग्नलिंग और सेफ्टी ऑडिट की प्रक्रिया जारी है।",
    coverImage: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1000&auto=format&fit=crop&q=80",
    district: "भोपाल",
    state: "madhya-pradesh",
    category: "सामान्य",
    author: "मुख्य संपादक डेस्क",
    isBreaking: true,
    isFeatured: false,
    views: 1120,
    status: "PUBLISHED",
    publishedAt: "2026-10-26T14:17:42.407Z"
  },
  {
    _id: "6adf7d260c392ff51b264e7d",
    title: "एशिया की सबसे बड़ी कृषि मंडी में सोयाबीन व गेहूं की बंपर आवक, डिजिटल पर्ची से तुरंत भुगतान",
    excerpt: "इंदौर कृषि उपज मंडी में आज बंपर आवक दर्ज की गई। व्यापारियों ने ऑनलाइन पेमेंट से सीधे किसानों के खातों में राशि ट्रांसफर की...",
    content: "इंदौर कृषि मंडी में नए सीजन की फसलों की जबरदस्त आवक देखी जा रही है। मंडी प्रशासन द्वारा शुरू की गई डिजिटल तौल और आरटीजीएस भुगतान प्रणाली से किसानों को घंटों लाइन में खड़े रहने से मुक्ति मिली है।",
    coverImage: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=1000&auto=format&fit=crop&q=80",
    district: "इंदौर",
    state: "madhya-pradesh",
    category: "सामान्य",
    author: "मुख्य संपादक डेस्क",
    isBreaking: false,
    isFeatured: false,
    views: 840,
    status: "PUBLISHED",
    publishedAt: "2026-10-26T13:17:42.407Z"
  }
];

export const VIDEO_BULLETINS: VideoBulletin[] = [];
export const INSTAGRAM_POSTS: InstagramPost[] = [];

export const MANDI_RATES: MandiRate[] = [
  { id: "6ae073d7f168ce384c1d3051", crop: "गुड़ (देसी/सुपर)", mandi: "कवर्धा", state: "CG", rate: 3480, unit: "₹/क्विंटल", change: "up", diff: 80 },
  { id: "6ae073d7f168ce384c1d3052", crop: "चना (बड़ा)", mandi: "कवर्धा", state: "CG", rate: 5950, unit: "₹/क्विंटल", change: "up", diff: 120 },
  { id: "6ae073d7f168ce384c1d3053", crop: "धान (सरना)", mandi: "रायपुर/कवर्धा", state: "CG", rate: 3100, unit: "₹/क्विंटल", change: "steady", diff: 0 },
  { id: "6ae073d7f168ce384c1d3054", crop: "सोयाबीन (पीला)", mandi: "राजनांदगांव", state: "CG", rate: 4720, unit: "₹/क्विंटल", change: "down", diff: -40 },
  { id: "6ae073d7f168ce384c1d3055", crop: "गेहूं (शरबती)", mandi: "इंदौर/भोपाल", state: "MP", rate: 2780, unit: "₹/क्विंटल", change: "up", diff: 50 },
  { id: "6ae073d7f168ce384c1d3056", crop: "मक्का (हाइब्रिड)", mandi: "छिंदवाड़ा", state: "MP", rate: 2150, unit: "₹/क्विंटल", change: "steady", diff: 0 }
];

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

export const DEFAULT_SPONSOR_ADS: Advertisement[] = [
  {
    _id: "6ae9a01b79e2f4a100000001",
    title: "HostGator India • वेब होस्टिंग पर 60% तक भारी छूट + मुफ़्त .IN/.COM डोमेन",
    clientName: "HostGator India (Official Partner)",
    clientPhone: "",
    imageUrl: "/banners/hostgator-header.svg",
    linkUrl: "https://hostgator-india.sjv.io/yXnR2",
    placement: "header_top",
    targetDistrict: "सभी 88 जिले",
    isActive: true,
    priority: 30,
    impressions: 4850,
    clicks: 210,
    createdAt: "2026-11-17T00:00:00.000Z"
  },
  {
    _id: "6ae9a01b79e2f4a100000002",
    title: "Namecheap • अपना पसंदीदा डोमेन (.COM / .IN) रजिस्टर करें मात्र ₹499 से + मुफ़्त Privacy Protection",
    clientName: "Namecheap (Official Partner)",
    clientPhone: "",
    imageUrl: "/banners/namecheap-feed.svg",
    linkUrl: "https://namecheap.pxf.io/JPbWq",
    placement: "in_feed",
    targetDistrict: "सभी 88 जिले",
    isActive: true,
    priority: 35,
    impressions: 5920,
    clicks: 275,
    createdAt: "2026-11-17T00:00:00.000Z"
  },
  {
    _id: "6ae9a01b79e2f4a100000003",
    title: "Lenovo India • लैपटॉप, टैबलेट व पीसी पर भारी छूट — 50% तक OFF! (IdeaPad, ThinkPad & Yoga)",
    clientName: "Lenovo India (Official Store)",
    clientPhone: "",
    imageUrl: "/banners/lenovo-feed.svg",
    linkUrl: "https://lenovo-in.zlvv.net/je2xVM",
    placement: "in_feed",
    targetDistrict: "सभी 88 जिले",
    isActive: true,
    priority: 25,
    impressions: 7450,
    clicks: 380,
    createdAt: "2026-11-17T00:00:00.000Z"
  },
  {
    _id: "6ae9a01b79e2f4a100000004",
    title: "HostGator India • मात्र ₹79/माह में अपनी खुद की वेबसाइट या ब्लॉग शुरू करें",
    clientName: "HostGator Web Solutions",
    clientPhone: "",
    imageUrl: "/banners/hostgator-feed.svg",
    linkUrl: "https://hostgator-india.sjv.io/yXnR2",
    placement: "in_feed",
    targetDistrict: "सभी 88 जिले",
    isActive: true,
    priority: 15,
    impressions: 6120,
    clicks: 295,
    createdAt: "2026-11-17T00:00:00.000Z"
  },
  {
    _id: "6ae9a01b79e2f4a100000005",
    title: "Namecheap • अपने ब्रांड के लिए सुरक्षित डोमेन व फ्री WhoisGuard प्राप्त करें",
    clientName: "Namecheap",
    clientPhone: "",
    imageUrl: "/banners/namecheap-article.svg",
    linkUrl: "https://namecheap.pxf.io/JPbWq",
    placement: "article_bottom",
    targetDistrict: "सभी 88 जिले",
    isActive: true,
    priority: 35,
    impressions: 3800,
    clicks: 180,
    createdAt: "2026-11-17T00:00:00.000Z"
  },
  {
    _id: "6ae9a01b79e2f4a100000006",
    title: "Lenovo India • नया लैपटॉप खरीदने की सोच रहे हैं? नो-कॉस्ट EMI + स्टूडेंट डिस्काउंट",
    clientName: "Lenovo India",
    clientPhone: "",
    imageUrl: "/banners/lenovo-article.svg",
    linkUrl: "https://lenovo-in.zlvv.net/je2xVM",
    placement: "article_bottom",
    targetDistrict: "सभी 88 जिले",
    isActive: true,
    priority: 25,
    impressions: 4900,
    clicks: 260,
    createdAt: "2026-11-17T00:00:00.000Z"
  },
  {
    _id: "6ae9a01b79e2f4a100000007",
    title: "व्यापार या पर्सनल ब्लॉग के लिए बेस्ट होस्टिंग व SSL • HostGator India",
    clientName: "HostGator India",
    clientPhone: "",
    imageUrl: "/banners/hostgator-article.svg",
    linkUrl: "https://hostgator-india.sjv.io/yXnR2",
    placement: "article_bottom",
    targetDistrict: "सभी 88 जिले",
    isActive: true,
    priority: 15,
    impressions: 3400,
    clicks: 160,
    createdAt: "2026-11-17T00:00:00.000Z"
  },
  {
    _id: "6ae9a01b79e2f4a100000008",
    title: "Namecheap • अपना पसंदीदा .COM या .IN डोमेन बुक करें मात्र ₹499 से + फ्री Privacy",
    clientName: "Namecheap Domains",
    clientPhone: "",
    imageUrl: "/banners/namecheap-header.svg",
    linkUrl: "https://namecheap.pxf.io/JPbWq",
    placement: "header_top",
    targetDistrict: "सभी 88 जिले",
    isActive: true,
    priority: 20,
    impressions: 4100,
    clicks: 195,
    createdAt: "2026-11-17T00:00:00.000Z"
  },
  {
    _id: "6ae9a01b79e2f4a100000009",
    title: "Lenovo Laptops & Tablets • भारी छूट — No-Cost EMI + फ्री डिलीवरी",
    clientName: "Lenovo India",
    clientPhone: "",
    imageUrl: "/banners/lenovo-header.svg",
    linkUrl: "https://lenovo-in.zlvv.net/je2xVM",
    placement: "header_top",
    targetDistrict: "सभी 88 जिले",
    isActive: true,
    priority: 15,
    impressions: 4300,
    clicks: 215,
    createdAt: "2026-11-17T00:00:00.000Z"
  },
  {
    _id: "6ae9a01b79e2f4a100000010",
    title: "BigRock India • .IN व .COM डोमेन और वेब होस्टिंग पर 70% तक की भारी छूट!",
    clientName: "BigRock India (Official Partner)",
    clientPhone: "",
    imageUrl: "/banners/bigrock-feed.svg",
    linkUrl: "https://bigrock-in.sjv.io/gRdGNv",
    placement: "in_feed",
    targetDistrict: "सभी 88 जिले",
    isActive: true,
    priority: 28,
    impressions: 5200,
    clicks: 245,
    createdAt: "2026-11-17T00:00:00.000Z"
  },
  {
    _id: "6ae9a01b79e2f4a100000011",
    title: "BigRock India • भारत का नंबर 1 डोमेन व होस्टिंग प्रोवाइडर — 70% छूट",
    clientName: "BigRock India",
    clientPhone: "",
    imageUrl: "/banners/bigrock-header.svg",
    linkUrl: "https://bigrock-in.sjv.io/gRdGNv",
    placement: "header_top",
    targetDistrict: "सभी 88 जिले",
    isActive: true,
    priority: 22,
    impressions: 4600,
    clicks: 205,
    createdAt: "2026-11-17T00:00:00.000Z"
  },
  {
    _id: "6ae9a01b79e2f4a100000012",
    title: "BigRock India • अपनी वेबसाइट के लिए .IN डोमेन बुक करें — 70% तक की छूट",
    clientName: "BigRock India",
    clientPhone: "",
    imageUrl: "/banners/bigrock-article.svg",
    linkUrl: "https://bigrock-in.sjv.io/gRdGNv",
    placement: "article_bottom",
    targetDistrict: "सभी 88 जिले",
    isActive: true,
    priority: 30,
    impressions: 3950,
    clicks: 190,
    createdAt: "2026-11-17T00:00:00.000Z"
  }
];
