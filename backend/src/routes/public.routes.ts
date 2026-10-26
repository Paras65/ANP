import { Router, Request, Response } from 'express';
import { State } from '../models/State.model.js';
import { District } from '../models/District.model.js';
import { Category } from '../models/Category.model.js';
import { Article } from '../models/Article.model.js';
import { User } from '../models/User.model.js';
import { fetchChannelVideos } from '../services/youtubeSync.js';

const router = Router();
let activeYouTubeChannelId = process.env.YOUTUBE_CHANNEL_ID || '';

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

// Store for Live Synced Videos & Reels
let mockVideos: any[] = [
  {
    id: 'vid-1',
    title: 'Ambition News Special: कवर्धा शहर के प्रमुख मुद्दों पर नागरिकों और जनप्रतिनिधियों की सीधी बहस',
    youtubeId: 'b_oYfF8jO4M',
    thumbnail: 'https://img.youtube.com/vi/b_oYfF8jO4M/hqdefault.jpg',
    duration: '14:28',
    views: '8.4K',
    timeAgo: '2 घंटे पहले',
    category: 'कवर्धा स्पेशल',
    youtubeUrl: 'https://www.youtube.com/watch?v=b_oYfF8jO4M'
  },
  {
    id: 'vid-2',
    title: 'छत्तीसगढ़ आज शाम का महाबुलेटिन: धान खरीदी, कैबिनेट बैठक और बस्तर से ग्राउंड रिपोर्ट',
    youtubeId: 'L_LUpnjgPso',
    thumbnail: 'https://img.youtube.com/vi/L_LUpnjgPso/hqdefault.jpg',
    duration: '18:50',
    views: '12.1K',
    timeAgo: '5 घंटे पहले',
    category: 'राज्य बुलेटिन',
    youtubeUrl: 'https://www.youtube.com/watch?v=L_LUpnjgPso'
  }
];

let mockReels: any[] = [
  {
    id: 'reel-1',
    caption: 'कवर्धा चिल्फी घाटी का विहंगम दृश्य... मैकल की वादियों में कोहरे की चादर 📸 @ambition_news #Kawardha #ChilphiGhati',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    youtubeId: 'kJQP7kiw5Fk',
    postUrl: 'https://www.instagram.com/ambition_news/',
    likes: '1,420',
    commentsCount: '184',
    sharesCount: '92',
    district: 'कवर्धा',
    timeAgo: '3 घंटे पहले',
    audioTrack: 'Ambition News • चिल्फी घाटी मॉर्निंग स्पेशल'
  }
];

// 5. GET /api/videos - List YouTube Bulletins
router.get('/videos', (req: Request, res: Response) => {
  res.json({ success: true, data: mockVideos });
});

// 5b. GET /api/youtube/sync - Auto-fetch YouTube channel videos via Atom/RSS
router.get('/youtube/sync', async (req: Request, res: Response) => {
  try {
    const channelId = String(req.query.channelId || activeYouTubeChannelId || process.env.YOUTUBE_CHANNEL_ID || '').trim();
    if (!channelId) {
      return res.status(400).json({
        success: false,
        message: 'चैनल आईडी (Channel ID UC...) प्रदान करें'
      });
    }

    const force = req.query.force === 'true';
    const videos = await fetchChannelVideos(channelId, force);

    let newVideosAdded = 0;
    let newReelsAdded = 0;

    for (const v of videos) {
      const alreadyInVideos = mockVideos.some((mv) => mv.youtubeId === v.youtubeId);
      if (!alreadyInVideos) {
        mockVideos.unshift(v);
        newVideosAdded++;
      }
      if (v.isShort) {
        const alreadyInReels = mockReels.some((mr) => mr.youtubeId === v.youtubeId);
        if (!alreadyInReels) {
          mockReels.unshift({
            id: 'reel_' + v.youtubeId,
            caption: v.title,
            imageUrl: v.thumbnail,
            youtubeId: v.youtubeId,
            postUrl: v.youtubeUrl,
            likes: '1.2K',
            commentsCount: '80',
            sharesCount: '45',
            district: 'कवर्धा',
            timeAgo: v.timeAgo,
            audioTrack: 'Ambition News Original'
          });
          newReelsAdded++;
        }
      }
    }

    activeYouTubeChannelId = channelId;
    return res.json({
      success: true,
      channelId,
      totalFetched: videos.length,
      newVideosAdded,
      newReelsAdded,
      videos: mockVideos,
      reels: mockReels
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 5c. GET & POST /api/youtube/config - Read or update active channel ID
router.get('/youtube/config', (req: Request, res: Response) => {
  res.json({ success: true, channelId: activeYouTubeChannelId });
});

router.post('/youtube/config', (req: Request, res: Response) => {
  const { channelId } = req.body;
  if (!channelId) {
    return res.status(400).json({ success: false, message: 'चैनल आईडी प्रदान करें' });
  }
  activeYouTubeChannelId = channelId.trim();
  res.json({
    success: true,
    message: 'यूट्यूब चैनल आईडी सफलतापूर्वक सहेजी गई',
    channelId: activeYouTubeChannelId
  });
});

// 6. POST /api/videos - Add new YouTube Bulletin
router.post('/videos', (req: Request, res: Response) => {
  try {
    const { title, youtubeId, category, duration } = req.body;
    if (!title || !youtubeId) {
      return res.status(400).json({ success: false, message: 'शीर्षक और YouTube ID आवश्यक है' });
    }
    const newVid = {
      id: 'vid_' + Date.now(),
      title,
      youtubeId,
      thumbnail: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
      duration: duration || '10:00',
      views: '1',
      timeAgo: 'अभी-अभी',
      category: category || 'ताज़ा बुलेटिन',
      youtubeUrl: `https://www.youtube.com/watch?v=${youtubeId}`
    };
    mockVideos.unshift(newVid);
    res.status(201).json({ success: true, data: newVid });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. GET /api/reels - List Reels / Shorts
router.get('/reels', (req: Request, res: Response) => {
  res.json({ success: true, data: mockReels });
});

// 8. POST /api/reels - Add new Reel / Short
router.post('/reels', (req: Request, res: Response) => {
  try {
    const { caption, postUrl, youtubeId, imageUrl, district, audioTrack } = req.body;
    if (!caption) {
      return res.status(400).json({ success: false, message: 'कैप्शन आवश्यक है' });
    }
    const newReel = {
      id: 'reel_' + Date.now(),
      caption,
      imageUrl: imageUrl || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800'),
      youtubeId: youtubeId || undefined,
      postUrl: postUrl || 'https://www.instagram.com/ambition_news/',
      likes: '1',
      commentsCount: '0',
      sharesCount: '0',
      district: district || 'कवर्धा',
      timeAgo: 'अभी-अभी',
      audioTrack: audioTrack || 'Ambition News Live'
    };
    mockReels.unshift(newReel);
    res.status(201).json({ success: true, data: newReel });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
