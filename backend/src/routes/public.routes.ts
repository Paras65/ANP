import { Router, Request, Response } from 'express';
import { State } from '../models/State.model.js';
import { District } from '../models/District.model.js';
import { Category } from '../models/Category.model.js';
import { Article } from '../models/Article.model.js';
import { User } from '../models/User.model.js';

const router = Router();

// In-Memory Fallback Store if MongoDB is still syncing / connecting
let mockDistricts = [
  { _id: 'd1', name: 'Raipur', nameHindi: 'रायपुर', slug: 'raipur', state: 'chhattisgarh' },
  { _id: 'd2', name: 'Bilaspur', nameHindi: 'बिलासपुर', slug: 'bilaspur', state: 'chhattisgarh' },
  { _id: 'd3', name: 'Durg', nameHindi: 'दुर्ग/भिलाई', slug: 'durg', state: 'chhattisgarh' },
  { _id: 'd4', name: 'Bastar', nameHindi: 'बस्तर/जगदलपुर', slug: 'bastar', state: 'chhattisgarh' },
  { _id: 'd5', name: 'Korba', nameHindi: 'कोरबा', slug: 'korba', state: 'chhattisgarh' },
  { _id: 'd6', name: 'Surguja', nameHindi: 'सरगुजा/अंबिकापुर', slug: 'surguja', state: 'chhattisgarh' },
  { _id: 'd7', name: 'Bhopal', nameHindi: 'भोपाल', slug: 'bhopal', state: 'madhya-pradesh' },
  { _id: 'd8', name: 'Indore', nameHindi: 'इंदौर', slug: 'indore', state: 'madhya-pradesh' },
  { _id: 'd9', name: 'Jabalpur', nameHindi: 'जबलपुर', slug: 'jabalpur', state: 'madhya-pradesh' },
  { _id: 'd10', name: 'Gwalior', nameHindi: 'ग्वालियर', slug: 'gwalior', state: 'madhya-pradesh' },
  { _id: 'd11', name: 'Ujjain', nameHindi: 'उज्जैन', slug: 'ujjain', state: 'madhya-pradesh' },
  { _id: 'd12', name: 'Chhindwara', nameHindi: 'छिंदवाड़ा', slug: 'chhindwara', state: 'madhya-pradesh' },
];

let mockArticles: any[] = [
  {
    _id: 'a1',
    title: 'किसानों के खाते में धान बोनस की अगली किश्त जल्द: मुख्यमंत्री ने समीक्षा बैठक में दिए कड़े निर्देश',
    slug: 'dhan-bonus-next-installment-cm-review',
    excerpt: 'मंत्रालय महानदी भवन में आयोजित उच्चस्तरीय बैठक में कृषि विभाग को निर्देश दिए गए कि भुगतान प्रक्रिया में कोई बाधा न आए। सभी जिला कलेक्टरों को निगरानी के आदेश...',
    coverImage: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1000&auto=format&fit=crop&q=80',
    district: 'रायपुर',
    state: 'chhattisgarh',
    category: '🏛️ राजनीति व किसान',
    author: 'विशेष संवाददाता',
    isBreaking: true,
    isFeatured: true,
    publishedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    views: 1240
  },
  {
    _id: 'a2',
    title: 'कोयला चोरी के बड़े गिरोह का पर्दाफाश: 4 गिरफ्तार, 2 ट्रक और नकदी जब्त',
    slug: 'coal-theft-gang-busted-bilaspur',
    excerpt: 'पुलिस अधीक्षक के निर्देश पर बनी स्पेशल टीम ने देर रात छापा मारकर गिरोह के मुख्य सरगना को धर दबोचा। पूछताछ में कई सफेदपोशों के नाम सामने आए...',
    district: 'बिलासपुर',
    state: 'chhattisgarh',
    category: '🚔 अपराध',
    author: 'रमेश कश्यप (ब्यूरो)',
    isBreaking: true,
    publishedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    views: 890
  },
  {
    _id: 'a3',
    title: 'मेट्रो विस्तार परियोजना को मिली नई गति, 5 नए स्टेशनों का कार्य अंतिम चरण में',
    slug: 'bhopal-metro-expansion-new-speed',
    excerpt: 'राजधानी के मुख्य मार्गों पर यातायात को सुगम बनाने के लिए प्रशासन ने नया रूट चार्ट जारी किया। आगामी माह में ट्रायल रन शुरू होने की पूरी संभावना...',
    district: 'भोपाल',
    state: 'madhya-pradesh',
    category: '🏗️ विकास',
    author: 'नीलेश शर्मा (भोपाल ब्यूरो)',
    isBreaking: true,
    publishedAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    views: 650
  },
  {
    _id: 'a4',
    title: 'इंद्रावती नदी का जलस्तर खतरे के निशान के करीब, तटीय गांवों में प्रशासन का हाई अलर्ट',
    slug: 'indravati-river-water-level-alert-bastar',
    excerpt: 'पहाड़ी क्षेत्रों में लगातार हो रही मूसलाधार बारिश से बस्तर के कई नदी-नाले उफान पर। संवेदनशील गांवों में होमगार्ड और एसडीआरएफ की टीमें तैनात...',
    district: 'बस्तर/जगदलपुर',
    state: 'chhattisgarh',
    category: '🌦️ मौसम व आपदा',
    author: 'सुखदेव सलाम (ग्राउंड रिपोर्ट)',
    isBreaking: false,
    publishedAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    views: 1100
  },
  {
    _id: 'a5',
    title: 'सोयाबीन व गेहूं की नई आवक से मंडी गुलजार, किसानों को मिला उचित समर्थन मूल्य',
    slug: 'indore-mandi-soybean-wheat-arrival',
    excerpt: 'एशिया की प्रसिद्ध कृषि उपज मंडी में आज बंपर आवक दर्ज की गई। व्यापारियों ने ऑनलाइन पेमेंट से सीधे किसानों के खातों में राशि ट्रांसफर की...',
    district: 'इंदौर',
    state: 'madhya-pradesh',
    category: '🌾 कृषि व मंडी',
    author: 'विवेक पाटीदार',
    isBreaking: false,
    publishedAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    views: 740
  }
];

// 1. GET /api/districts - Fetch districts
router.get('/districts', async (req: Request, res: Response) => {
  try {
    const { state } = req.query;
    let docs = await District.find().populate('stateId').lean();
    if (!docs || docs.length === 0) {
      let filtered = mockDistricts;
      if (state) {
        filtered = mockDistricts.filter(d => d.state === String(state).toLowerCase());
      }
      return res.json({ success: true, count: filtered.length, data: filtered });
    }
    res.json({ success: true, count: docs.length, data: docs });
  } catch (err) {
    res.json({ success: true, count: mockDistricts.length, data: mockDistricts });
  }
});

// 2. GET /api/breaking - Live breaking ticker items
router.get('/breaking', async (req: Request, res: Response) => {
  try {
    const breaking = await Article.find({ isBreaking: true, status: 'PUBLISHED' }).limit(10).lean();
    if (!breaking || breaking.length === 0) {
      const fallback = mockArticles.filter(a => a.isBreaking);
      return res.json({ success: true, data: fallback });
    }
    res.json({ success: true, data: breaking });
  } catch (err) {
    const fallback = mockArticles.filter(a => a.isBreaking);
    res.json({ success: true, data: fallback });
  }
});

// 3. GET /api/articles - List published articles
router.get('/articles', async (req: Request, res: Response) => {
  try {
    const { district, state } = req.query;
    let list = [...mockArticles];

    if (state) {
      list = list.filter(a => a.state.toLowerCase() === String(state).toLowerCase());
    }

    if (district && district !== 'सभी') {
      list = list.filter(a => a.district.includes(String(district)) || String(district).includes(a.district));
    }

    res.json({
      success: true,
      data: list,
      total: list.length
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. POST /api/articles - Reporter submits an article (Live Synced!)
router.post('/articles', async (req: Request, res: Response) => {
  try {
    const { title, excerpt, content, district, category, author } = req.body;

    if (!title || !excerpt) {
      return res.status(400).json({ success: false, message: 'शीर्षक और विवरण आवश्यक है' });
    }

    const newArticle = {
      _id: 'art_' + Date.now(),
      title,
      slug: 'news-' + Date.now(),
      excerpt,
      district: district || 'रायपुर',
      state: ['भोपाल', 'इंदौर', 'जबलपुर', 'ग्वालियर', 'उज्जैन', 'छिंदवाड़ा'].some(d => (district || '').includes(d)) ? 'madhya-pradesh' : 'chhattisgarh',
      category: category || 'सामान्य',
      author: author || 'फील्ड रिपोर्टर (लाइव)',
      isBreaking: true,
      publishedAt: new Date().toISOString(),
      views: 1
    };

    // Prepend to live list so it immediately appears on frontend!
    mockArticles.unshift(newArticle);

    console.log(`📢 [New Live Article Submitted]: "${title}" (${newArticle.district})`);

    res.status(201).json({
      success: true,
      message: 'खबर सफलतापूर्वक सबमिट हो गई और लाइव पोर्टल पर जुड़ गई!',
      data: newArticle
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
