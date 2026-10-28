import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { State } from '../models/State.model.js';
import { District } from '../models/District.model.js';
import { Category } from '../models/Category.model.js';
import { Article } from '../models/Article.model.js';
import { User } from '../models/User.model.js';
import { Video } from '../models/Video.model.js';
import { Reel } from '../models/Reel.model.js';
import { Setting } from '../models/Setting.model.js';
import { MandiRate } from '../models/MandiRate.model.js';
import { requireAdminAuth } from '../middleware/auth.middleware.js';
import { authLimiter, aiLimiter, contentCreationLimiter } from '../middleware/rateLimiter.middleware.js';
import { fetchChannelVideos, fetchChannelShorts, syncFromYouTubeDataAPI } from '../services/youtubeSync.js';
import { processGeminiNewsTask } from '../services/gemini.service.js';
import { 
  recordSecurityIncident, 
  getSecurityDashboardStats, 
  clearSecurityLogs 
} from '../services/securityAudit.service.js';
import { logger } from '../utils/logger.js';

const router = Router();
let activeYouTubeChannelId = process.env.YOUTUBE_CHANNEL_ID || 'UC8mIipC7suPuBJ_n8kUzkCg';

/**
 * ReDoS & Regex Injection Defense:
 * Escapes regex special metacharacters and caps string length before MongoDB evaluation.
 */
function escapeRegex(text: string): string {
  return String(text).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&').slice(0, 80);
}

/**
 * High-Performance In-Memory Master Cache:
 * Eliminates 3 redundant DB round-trips (State, District, Category) on EVERY reader request.
 * Automatically refreshed every 10 minutes or invalidated upon mutations.
 */
interface MasterCache {
  states: Map<string, any>;
  districts: any[];
  districtLookup: Map<string, any>;
  categories: any[];
  categoryLookup: Map<string, any>;
  lastFetched: number;
}

const masterCache: MasterCache = {
  states: new Map(),
  districts: [],
  districtLookup: new Map(),
  categories: [],
  categoryLookup: new Map(),
  lastFetched: 0
};

const MASTER_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function getMasterData() {
  const now = Date.now();
  if (masterCache.lastFetched && now - masterCache.lastFetched < MASTER_CACHE_TTL) {
    return masterCache;
  }

  try {
    const [states, districts, categories] = await Promise.all([
      State.find().lean(),
      District.find().populate('stateId').lean(),
      Category.find().lean()
    ]);

    masterCache.states.clear();
    states.forEach((s: any) => {
      masterCache.states.set(s.slug?.toLowerCase(), s);
      masterCache.states.set(s._id.toString(), s);
    });

    masterCache.districts = districts;
    masterCache.districtLookup.clear();
    districts.forEach((d: any) => {
      if (d.slug) masterCache.districtLookup.set(d.slug.toLowerCase(), d);
      if (d.name) masterCache.districtLookup.set(d.name.toLowerCase(), d);
      if (d.nameHindi) masterCache.districtLookup.set(d.nameHindi.toLowerCase(), d);
      masterCache.districtLookup.set(d._id.toString(), d);
    });

    masterCache.categories = categories;
    masterCache.categoryLookup.clear();
    categories.forEach((c: any) => {
      if (c.slug) masterCache.categoryLookup.set(c.slug.toLowerCase(), c);
      if (c.name) masterCache.categoryLookup.set(c.name.toLowerCase(), c);
      masterCache.categoryLookup.set(c._id.toString(), c);
    });

    masterCache.lastFetched = now;
  } catch (err: any) {
    logger.warn('Failed to refresh master data cache:', err.message);
  }

  return masterCache;
}

export function invalidateMasterCache() {
  masterCache.lastFetched = 0;
}

// 1. GET /api/districts - Fetch districts live from MongoDB Atlas (Cached & Edge Accelerated)
router.get('/districts', async (req: Request, res: Response) => {
  try {
    res.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    const { state } = req.query;
    const cache = await getMasterData();
    let docs = cache.districts;

    if (state) {
      const stateSlug = String(state).toLowerCase();
      docs = docs.filter((d: any) => d.stateId?.slug?.toLowerCase() === stateSlug);
    }

    const data = docs.map((d: any) => ({
      _id: d._id.toString(),
      name: d.name,
      nameHindi: d.nameHindi,
      slug: d.slug,
      state: d.stateId?.slug || (state || 'chhattisgarh')
    }));

    res.json({ success: true, count: data.length, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. GET /api/breaking - Live breaking ticker items from MongoDB Atlas
router.get('/breaking', async (req: Request, res: Response) => {
  try {
    res.set('Cache-Control', 'public, max-age=15, stale-while-revalidate=60');
    const breaking = await Article.find({ isBreaking: true, deletedAt: null, status: 'PUBLISHED' })
      .populate('districtId')
      .populate('categoryId')
      .populate('stateId')
      .populate('authorId')
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(10)
      .lean();

    const data = breaking.map((a: any) => ({
      _id: a._id.toString(),
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt,
      content: a.content,
      coverImage: a.coverImage,
      district: a.districtId?.nameHindi || 'कवर्धा',
      state: a.stateId?.slug || 'chhattisgarh',
      category: a.categoryId?.name ? `${a.categoryId.icon ? a.categoryId.icon + ' ' : ''}${a.categoryId.name}` : 'ताज़ा खबर',
      author: a.authorId?.nameHindi || a.authorId?.name || 'विशेष संवाददाता',
      isBreaking: a.isBreaking,
      isFeatured: a.isFeatured,
      views: a.views || 1,
      publishedAt: a.publishedAt ? new Date(a.publishedAt).toISOString() : new Date().toISOString()
    }));

    res.json({ success: true, count: data.length, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. GET /api/articles - List published articles filtered live from MongoDB Atlas (with In-Memory Master Cache & Edge Acceleration)
router.get('/articles', async (req: Request, res: Response) => {
  try {
    res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
    const { district, state, category, search, includeReview, page, limit, all } = req.query;
    let filter: any = { deletedAt: null };
    if (includeReview === 'true') {
      filter.status = { $in: ['PUBLISHED', 'REVIEW'] };
    } else {
      filter.status = 'PUBLISHED';
    }

    const cache = await getMasterData();

    if (state) {
      const stateDoc = cache.states.get(String(state).toLowerCase());
      if (stateDoc) filter.stateId = stateDoc._id;
    }

    if (district && district !== 'सभी') {
      const cleanDist = String(district).toLowerCase().trim();
      const districtDoc = cache.districtLookup.get(cleanDist) || 
        cache.districts.find((d: any) => 
          d.nameHindi?.toLowerCase().includes(cleanDist) || 
          d.name?.toLowerCase().includes(cleanDist) ||
          d.slug?.toLowerCase().includes(cleanDist)
        );
      if (districtDoc) filter.districtId = districtDoc._id;
    }

    if (category && category !== 'सभी खबरें') {
      const cleanCat = String(category).toLowerCase().trim();
      const catDoc = cache.categoryLookup.get(cleanCat) || 
        cache.categories.find((c: any) => 
          c.name?.toLowerCase().includes(cleanCat) || 
          c.slug?.toLowerCase().includes(cleanCat)
        );
      if (catDoc) filter.categoryId = catDoc._id;
    }

    if (search) {
      const safeSearch = escapeRegex(String(search));
      filter.$or = [
        { title: new RegExp(safeSearch, 'i') },
        { excerpt: new RegExp(safeSearch, 'i') }
      ];
    }

    // Pagination Parameters
    const pageNum = Math.max(1, parseInt(String(page || '1'), 10) || 1);
    const isAll = all === 'true';
    const defaultLimit = 12;
    const limitNum = isAll 
      ? 200 
      : Math.min(100, Math.max(1, parseInt(String(limit || defaultLimit), 10) || defaultLimit));
    const skip = (pageNum - 1) * limitNum;

    const [articles, totalArticles] = await Promise.all([
      Article.find(filter)
        .populate('districtId')
        .populate('categoryId')
        .populate('stateId')
        .populate('authorId')
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Article.countDocuments(filter)
    ]);

    const totalPages = Math.max(1, Math.ceil(totalArticles / limitNum));

    const data = articles.map((a: any) => ({
      _id: a._id.toString(),
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt,
      content: a.content,
      coverImage: a.coverImage,
      district: a.districtId?.nameHindi || 'कवर्धा',
      state: a.stateId?.slug || 'chhattisgarh',
      category: a.categoryId?.name ? `${a.categoryId.icon ? a.categoryId.icon + ' ' : ''}${a.categoryId.name}` : 'सामान्य',
      author: a.authorId?.nameHindi || a.authorId?.name || 'विशेष संवाददाता',
      isBreaking: a.isBreaking,
      isFeatured: a.isFeatured,
      views: a.views || 1,
      status: a.status || 'PUBLISHED',
      publishedAt: a.publishedAt ? new Date(a.publishedAt).toISOString() : new Date().toISOString()
    }));

    res.json({ 
      success: true, 
      count: data.length, 
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalArticles,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      data 
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. POST /api/articles - Submit new article directly into MongoDB Atlas
router.post('/articles', requireAdminAuth, contentCreationLimiter, async (req: Request, res: Response) => {
  try {
    const { title, excerpt, content, district, category, author, state, isBreaking, isFeatured, coverImage } = req.body;

    if (!title || !excerpt) {
      return res.status(400).json({ success: false, message: 'शीर्षक और विवरण आवश्यक है' });
    }

    // Resolve District
    let districtDoc = null;
    if (district) {
      districtDoc = await District.findOne({
        $or: [
          { nameHindi: new RegExp(String(district).replace(/[()]/g, ''), 'i') },
          { name: new RegExp(String(district), 'i') }
        ]
      });
    }
    if (!districtDoc) {
      districtDoc = await District.findOne({ slug: 'kabirdham' }) || await District.findOne();
    }

    // Resolve State
    let stateDoc = null;
    if (districtDoc?.stateId) {
      stateDoc = await State.findById(districtDoc.stateId);
    } else if (state) {
      stateDoc = await State.findOne({ slug: String(state).toLowerCase() });
    }
    if (!stateDoc) {
      stateDoc = await State.findOne({ slug: 'chhattisgarh' }) || await State.findOne();
    }

    // Resolve Category
    let catDoc = null;
    if (category) {
      catDoc = await Category.findOne({
        $or: [
          { nameHindi: new RegExp(String(category).replace(/[^\u0900-\u097F\w]/g, '').trim(), 'i') },
          { slug: String(category).toLowerCase() }
        ]
      });
    }
    if (!catDoc) {
      catDoc = await Category.findOne();
    }

    // Resolve Author
    let authorUser = await User.findOne({ role: 'ADMIN' });
    if (!authorUser) {
      authorUser = await User.create({
        phone: '9999999999',
        name: author || 'विशेष संवाददाता',
        nameHindi: author || 'विशेष संवाददाता',
        role: 'ADMIN',
        isActive: true
      });
    }

    const slug = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const createdArticle = await Article.create({
      title: title.trim(),
      slug,
      excerpt: excerpt.trim(),
      content: content || excerpt,
      coverImage: coverImage || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1000&auto=format&fit=crop&q=80',
      stateId: stateDoc?._id,
      districtId: districtDoc?._id,
      categoryId: catDoc?._id,
      authorId: authorUser._id,
      tags: [districtDoc?.nameHindi || 'कवर्धा', (catDoc as any)?.name || 'ताज़ा खबर'],
      status: 'PUBLISHED',
      isBreaking: Boolean(isBreaking),
      isFeatured: Boolean(isFeatured),
      views: 1,
      publishedAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'खबर सफलतापूर्वक MongoDB Atlas में सुरक्षित और प्रकाशित हो गई!',
      data: {
        _id: createdArticle._id.toString(),
        title: createdArticle.title,
        slug: createdArticle.slug,
        excerpt: createdArticle.excerpt,
        content: createdArticle.content,
        coverImage: createdArticle.coverImage,
        district: districtDoc?.nameHindi || 'कवर्धा',
        state: stateDoc?.slug || 'chhattisgarh',
        category: (catDoc as any)?.name || 'ताज़ा खबर',
        author: authorUser.nameHindi || authorUser.name,
        isBreaking: createdArticle.isBreaking,
        isFeatured: createdArticle.isFeatured,
        views: createdArticle.views,
        publishedAt: createdArticle.publishedAt?.toISOString()
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4b. POST /api/articles/scoop - Citizen Journalism & Field Reporter Scoop Submission (Rate-Limited, Zero-Auth Required, Anti-Bot Honeypot)
router.post('/articles/scoop', contentCreationLimiter, async (req: Request, res: Response) => {
  try {
    // Anti-Bot Honeypot Defense: Bots fill hidden inputs, silently accept & drop without DB write
    if (req.body.website || req.body._hp) {
      return res.status(200).json({ success: true, message: 'समाचार समीक्षा के लिए प्राप्त हुआ' });
    }

    const { title, excerpt, content, district, state, author, coverImage } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'समाचार का शीर्षक आवश्यक है' });
    }
    if (!excerpt && !content) {
      return res.status(400).json({ success: false, message: 'समाचार का विवरण आवश्यक है' });
    }

    // Resolve State
    let stateDoc = await State.findOne({ slug: (state || 'chhattisgarh').toLowerCase() });
    if (!stateDoc) {
      stateDoc = await State.findOne({ slug: 'chhattisgarh' });
    }

    // Resolve District
    let districtDoc = null;
    if (district) {
      const cleanDistrict = String(district).replace(/[()]/g, '').trim();
      const safeDistrict = escapeRegex(cleanDistrict);
      districtDoc = await District.findOne({
        $or: [
          { nameHindi: new RegExp(safeDistrict, 'i') },
          { name: new RegExp(safeDistrict, 'i') }
        ]
      });
    }
    if (!districtDoc && stateDoc) {
      districtDoc = await District.findOne({ stateId: stateDoc._id });
    }

    // Resolve Category
    const catDoc = await Category.findOne({ name: /कवर्धा स्पेशल|ताज़ा|नागरिक/i }) || await Category.findOne();

    // Resolve or Create Reporter User
    let authorUser = await User.findOne({ name: author }) || await User.findOne({ role: 'ADMIN' });
    if (!authorUser) {
      authorUser = await User.create({
        phone: '9888888888',
        name: author || 'नागरिक पत्रकार',
        nameHindi: author || 'नागरिक पत्रकार',
        role: 'REPORTER',
        isActive: true
      });
    }

    const slug = `scoop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const createdArticle = await Article.create({
      title: title.trim(),
      slug,
      excerpt: (excerpt || content || '').trim().slice(0, 500),
      content: content || excerpt,
      coverImage: coverImage || '/logo.png',
      stateId: stateDoc?._id,
      districtId: districtDoc?._id,
      categoryId: catDoc?._id,
      authorId: authorUser._id,
      tags: [districtDoc?.nameHindi || 'कवर्धा', 'नागरिक पत्रकारिता', 'ग्राउंड रिपोर्ट'],
      status: 'REVIEW',
      isBreaking: false,
      isFeatured: false,
      views: 0,
      publishedAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'आपकी खबर सफलतापूर्वक समीक्षा के लिए भेज दी गई है! संपादक द्वारा स्वीकृति मिलते ही यह पोर्टल पर प्रकाशित हो जाएगी।',
      data: {
        id: createdArticle._id.toString(),
        title: createdArticle.title,
        status: createdArticle.status
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4b. DELETE /api/articles/:id - Soft delete article from MongoDB Atlas
router.delete('/articles/:id', requireAdminAuth, contentCreationLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Article.findByIdAndUpdate(id, { deletedAt: new Date() });
    res.json({ success: true, message: 'आर्टिकल सफलतापूर्वक हटा दिया गया' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4c. PUT /api/articles/:id - Update existing article live in MongoDB Atlas
router.put('/articles/:id', requireAdminAuth, contentCreationLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, excerpt, content, district, category, author, state, isBreaking, isFeatured, coverImage, status } = req.body;
    const updatePayload: any = {
      ...(title && { title: title.trim() }),
      ...(excerpt && { excerpt: excerpt.trim() }),
      ...(content && { content }),
      ...(district && { district: district.trim() }),
      ...(category && { category: category.trim() }),
      ...(author && { author: author.trim() }),
      ...(state && { state }),
      ...(isBreaking !== undefined && { isBreaking }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(coverImage && { coverImage }),
      ...(status && { status })
    };

    if (status === 'PUBLISHED') {
      updatePayload.publishedAt = new Date();
    }

    const updated = await Article.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'खबर नहीं मिली' });
    }
    res.json({ success: true, message: 'खबर सफलतापूर्वक अपडेट हो गई', data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. GET /api/videos - List YouTube Bulletins live from MongoDB Atlas with Server-side Pagination
router.get('/videos', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const isAll = req.query.all === 'true';
    const limit = isAll 
      ? 200 
      : Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 12));
    const skip = (page - 1) * limit;

    const filter = { isShort: false };
    const [totalVideos, videos] = await Promise.all([
      Video.countDocuments(filter),
      Video.find(filter)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    const totalPages = Math.ceil(totalVideos / limit) || 1;

    res.json({
      success: true,
      count: videos.length,
      pagination: {
        currentPage: page,
        totalPages,
        totalVideos,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      data: videos.map((v: any) => ({
        id: v._id.toString(),
        title: v.title,
        youtubeId: v.youtubeId,
        thumbnail: v.thumbnail,
        duration: v.duration,
        views: v.views,
        timeAgo: v.timeAgo,
        category: v.category,
        youtubeUrl: v.youtubeUrl
      }))
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5b. GET /api/youtube/sync - Auto-fetch YouTube channel videos & persist into MongoDB Atlas
router.get('/youtube/sync', async (req: Request, res: Response) => {
  try {
    const channelId = String(req.query.channelId || activeYouTubeChannelId || process.env.YOUTUBE_CHANNEL_ID || '').trim();
    if (!channelId) {
      return res.status(400).json({
        success: false,
        message: 'चैनल आईडी (Channel ID UC...) प्रदान करें'
      });
    }

    // Strictly read from server environment variable (never hardcoded, never from DB or client)
    const apiKey = (process.env.YOUTUBE_API_KEY || '').trim();

    let newVideosAdded = 0;
    let newReelsAdded = 0;
    let syncEngine = 'rss_fallback';
    let totalFetched = 0;

    // 1. Try Official Google YouTube Data API v3 if API key is configured
    if (apiKey) {
      try {
        logger.debug(`[YouTube Sync] Executing official YouTube Data API v3 for channel ${channelId}`);
        const apiData = await syncFromYouTubeDataAPI(channelId, apiKey);
        syncEngine = 'youtube_data_api_v3';
        totalFetched = apiData.videos.length + apiData.reels.length;

        for (const v of apiData.videos) {
          const existing = await Video.findOne({ youtubeId: v.youtubeId });
          if (!existing) {
            await Video.create({
              title: v.title,
              youtubeId: v.youtubeId,
              thumbnail: v.thumbnail,
              duration: v.duration,
              views: v.views,
              timeAgo: v.timeAgo,
              category: v.category,
              youtubeUrl: v.youtubeUrl,
              isShort: false,
              publishedAt: v.publishedAt ? new Date(v.publishedAt) : new Date()
            });
            newVideosAdded++;
          } else {
            // Live update views count and stats from YouTube
            await Video.updateOne(
              { youtubeId: v.youtubeId },
              {
                $set: {
                  views: v.views,
                  duration: v.duration,
                  thumbnail: v.thumbnail,
                  title: v.title
                }
              }
            );
          }
        }

        for (const s of apiData.reels) {
          const existing = await Reel.findOne({ youtubeId: s.youtubeId });
          if (!existing) {
            await Reel.create(s);
            newReelsAdded++;
          } else {
            // Live update likes and view stats from YouTube
            await Reel.updateOne(
              { youtubeId: s.youtubeId },
              {
                $set: {
                  likes: s.likes,
                  commentsCount: s.commentsCount,
                  caption: s.caption,
                  imageUrl: s.imageUrl
                }
              }
            );
          }
        }
      } catch (apiErr: any) {
        logger.warn('[YouTube Data API v3 Failed, Falling back to RSS/Scraper]:', apiErr?.message);
      }
    }

    // 2. Fallback to RSS Feed + Direct Shorts scraper if API key is not present or failed
    if (syncEngine !== 'youtube_data_api_v3') {
      const force = req.query.force === 'true';
      const videos = await fetchChannelVideos(channelId, force);
      totalFetched = videos.length;

      for (const v of videos) {
        const existing = await Video.findOne({ youtubeId: v.youtubeId });
        if (!existing) {
          await Video.create({
            title: v.title,
            youtubeId: v.youtubeId,
            thumbnail: v.thumbnail,
            duration: v.duration,
            views: v.views,
            timeAgo: v.timeAgo,
            category: v.category,
            youtubeUrl: v.youtubeUrl,
            isShort: Boolean(v.isShort),
            publishedAt: v.publishedAt ? new Date(v.publishedAt) : new Date()
          });
          newVideosAdded++;
        }

        if (v.isShort) {
          const existingReel = await Reel.findOne({ youtubeId: v.youtubeId });
          if (!existingReel) {
            await Reel.create({
              caption: v.title,
              imageUrl: v.thumbnail,
              youtubeId: v.youtubeId,
              embedUrl: `https://www.youtube-nocookie.com/embed/${v.youtubeId}?autoplay=1&loop=1&playlist=${v.youtubeId}&rel=0`,
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

      // Auto-sync channel Shorts directly from YouTube Shorts feed
      try {
        const channelShorts = await fetchChannelShorts(channelId || 'ambition_news');
        for (const s of channelShorts) {
          const existing = await Reel.findOne({ youtubeId: s.youtubeId });
          if (!existing) {
            await Reel.create(s);
            newReelsAdded++;
          }
        }
      } catch (shortErr) {
        logger.warn('[Shorts Sync Error]:', shortErr);
      }
    }

    activeYouTubeChannelId = channelId;
    const allVideos = await Video.find({ isShort: false }).sort({ publishedAt: -1, createdAt: -1 }).lean();
    const allReels = await Reel.find().sort({ createdAt: -1 }).lean();

    return res.json({
      success: true,
      channelId,
      syncEngine,
      totalFetched,
      newVideosAdded,
      newReelsAdded,
      videos: allVideos.map((v: any) => ({
        id: v._id.toString(),
        title: v.title,
        youtubeId: v.youtubeId,
        thumbnail: v.thumbnail,
        duration: v.duration,
        views: v.views,
        timeAgo: v.timeAgo,
        category: v.category,
        youtubeUrl: v.youtubeUrl
      })),
      reels: allReels.map((r: any) => ({
        id: r._id.toString(),
        caption: r.caption,
        imageUrl: r.imageUrl,
        youtubeId: r.youtubeId,
        embedUrl: r.embedUrl,
        postUrl: r.postUrl,
        likes: r.likes,
        commentsCount: r.commentsCount,
        sharesCount: r.sharesCount,
        district: r.district,
        timeAgo: r.timeAgo,
        audioTrack: r.audioTrack
      }))
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 5c. GET & POST /api/youtube/config - Read channel ID from Atlas; check server ENV for API key status
router.get('/youtube/config', async (req: Request, res: Response) => {
  try {
    const doc = await Setting.findOne({ key: 'youtube_channel_id' });
    const channelId = doc?.value || activeYouTubeChannelId || process.env.YOUTUBE_CHANNEL_ID || '';
    const isConfiguredOnServer = Boolean(process.env.YOUTUBE_API_KEY);
    res.json({ success: true, channelId, isConfiguredOnServer });
  } catch {
    res.json({ success: true, channelId: activeYouTubeChannelId, isConfiguredOnServer: Boolean(process.env.YOUTUBE_API_KEY) });
  }
});

router.post('/youtube/config', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { channelId } = req.body;
    if (!channelId) {
      return res.status(400).json({ success: false, message: 'चैनल आईडी प्रदान करें' });
    }
    const clean = String(channelId).trim();
    activeYouTubeChannelId = clean;
    await Setting.findOneAndUpdate(
      { key: 'youtube_channel_id' },
      { key: 'youtube_channel_id', value: clean },
      { upsert: true, new: true }
    );
    res.json({
      success: true,
      message: 'यूट्यूब चैनल आईडी MongoDB Atlas में सफलतापूर्वक सुरक्षित हो गई!',
      channelId: clean,
      isConfiguredOnServer: Boolean(process.env.YOUTUBE_API_KEY)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. POST /api/videos - Add new YouTube Bulletin directly into MongoDB Atlas
router.post('/videos', requireAdminAuth, contentCreationLimiter, async (req: Request, res: Response) => {
  try {
    const { title, youtubeId, category, duration } = req.body;
    if (!title || !youtubeId) {
      return res.status(400).json({ success: false, message: 'शीर्षक और YouTube ID आवश्यक है' });
    }
    const newVid = await Video.findOneAndUpdate(
      { youtubeId },
      {
        title: title.trim(),
        youtubeId,
        thumbnail: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
        duration: duration || '10:00',
        views: '1',
        timeAgo: 'अभी-अभी',
        category: category || 'कवर्धा विशेष',
        youtubeUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
        isShort: false,
        publishedAt: new Date()
      },
      { upsert: true, new: true }
    );
    res.status(201).json({
      success: true,
      data: {
        id: newVid._id.toString(),
        title: newVid.title,
        youtubeId: newVid.youtubeId,
        thumbnail: newVid.thumbnail,
        duration: newVid.duration,
        views: newVid.views,
        timeAgo: newVid.timeAgo,
        category: newVid.category,
        youtubeUrl: newVid.youtubeUrl
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6b. DELETE /api/videos/:id - Delete YouTube Bulletin from MongoDB Atlas
router.delete('/videos/:id', requireAdminAuth, contentCreationLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Video.deleteOne({ $or: [{ _id: id }, { youtubeId: id }] });
    res.json({ success: true, message: 'वीडियो हटा दिया गया' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. GET /api/reels - List Reels / Shorts live from MongoDB Atlas with Server-side Pagination
router.get('/reels', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const isAll = req.query.all === 'true';
    const limit = isAll 
      ? 200 
      : Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const [totalReels, reels] = await Promise.all([
      Reel.countDocuments({}),
      Reel.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    const totalPages = Math.ceil(totalReels / limit) || 1;

    res.json({
      success: true,
      count: reels.length,
      pagination: {
        currentPage: page,
        totalPages,
        totalReels,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      data: reels.map((r: any) => ({
        id: r._id.toString(),
        caption: r.caption,
        imageUrl: r.imageUrl,
        videoUrl: r.videoUrl,
        youtubeId: r.youtubeId,
        embedUrl: r.embedUrl,
        postUrl: r.postUrl,
        likes: r.likes || `${r.likesCount || 0}`,
        likesCount: typeof r.likesCount === 'number' ? r.likesCount : (parseInt(String(r.likes).replace(/[^0-9]/g, '')) || 0),
        commentsCount: r.comments && r.comments.length > 0 ? String(r.comments.length) : (r.commentsCount || '0'),
        sharesCount: r.sharesCount || '0',
        comments: (r.comments || []).map((c: any) => ({
          id: c._id ? c._id.toString() : `comm-${Date.now()}`,
          user: c.user,
          text: c.text,
          time: c.timeAgo || 'अभी-अभी',
          avatar: c.avatar || '👤',
          createdAt: c.createdAt || new Date()
        })),
        district: r.district,
        timeAgo: r.timeAgo,
        audioTrack: r.audioTrack
      }))
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. POST /api/reels - Add new Reel / Short directly into MongoDB Atlas
router.post('/reels', requireAdminAuth, contentCreationLimiter, async (req: Request, res: Response) => {
  try {
    const { caption, postUrl, youtubeId, imageUrl, videoUrl, district, audioTrack, embedUrl } = req.body;
    if (!caption || !caption.trim()) {
      return res.status(400).json({ success: false, message: 'कैप्शन आवश्यक है' });
    }
    const newReel = await Reel.create({
      caption: caption.trim(),
      imageUrl: imageUrl || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : '/logo.png'),
      videoUrl: videoUrl ? videoUrl.trim() : undefined,
      youtubeId: youtubeId || undefined,
      embedUrl: embedUrl || (youtubeId ? `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&loop=1&playlist=${youtubeId}&rel=0` : undefined),
      postUrl: postUrl || 'https://www.instagram.com/ambition_news/',
      likes: '1',
      likesCount: 1,
      commentsCount: '0',
      sharesCount: '0',
      comments: [],
      district: district || 'कवर्धा',
      timeAgo: 'अभी-अभी',
      audioTrack: audioTrack || 'Ambition News Original'
    });
    res.status(201).json({
      success: true,
      data: {
        id: newReel._id.toString(),
        caption: newReel.caption,
        imageUrl: newReel.imageUrl,
        videoUrl: newReel.videoUrl,
        youtubeId: newReel.youtubeId,
        embedUrl: newReel.embedUrl,
        postUrl: newReel.postUrl,
        likes: newReel.likes,
        likesCount: newReel.likesCount,
        commentsCount: '0',
        sharesCount: newReel.sharesCount,
        comments: [],
        district: newReel.district,
        timeAgo: newReel.timeAgo,
        audioTrack: newReel.audioTrack
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8b. PUT /api/reels/:id - Edit / Update existing Reel in MongoDB Atlas
router.put('/reels/:id', requireAdminAuth, contentCreationLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { caption, postUrl, youtubeId, imageUrl, videoUrl, district, audioTrack, embedUrl } = req.body;
    if (!caption || !caption.trim()) {
      return res.status(400).json({ success: false, message: 'कैप्शन आवश्यक है' });
    }
    const query = mongoose.isValidObjectId(id) ? { $or: [{ _id: id }, { youtubeId: id }] } : { youtubeId: id };
    const updated = await Reel.findOneAndUpdate(
      query,
      {
        $set: {
          caption: caption.trim(),
          imageUrl: imageUrl || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : undefined),
          videoUrl: videoUrl !== undefined ? (videoUrl ? videoUrl.trim() : null) : undefined,
          youtubeId: youtubeId || undefined,
          embedUrl: embedUrl || (youtubeId ? `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&loop=1&playlist=${youtubeId}&rel=0` : undefined),
          postUrl: postUrl || 'https://www.instagram.com/ambition_news/',
          district: district || 'कवर्धा',
          audioTrack: audioTrack || 'Ambition News Original'
        }
      },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ success: false, message: 'संपादित करने के लिए रील नहीं मिली' });
    }

    res.json({
      success: true,
      message: 'रील सफलतापूर्वक अपडेट कर दी गई',
      data: {
        id: updated._id.toString(),
        caption: updated.caption,
        imageUrl: updated.imageUrl,
        videoUrl: updated.videoUrl,
        youtubeId: updated.youtubeId,
        embedUrl: updated.embedUrl,
        postUrl: updated.postUrl,
        likes: updated.likes,
        likesCount: updated.likesCount,
        commentsCount: updated.comments?.length ? String(updated.comments.length) : updated.commentsCount,
        sharesCount: updated.sharesCount,
        comments: (updated.comments || []).map((c: any) => ({
          id: c._id ? c._id.toString() : `comm-${Date.now()}`,
          user: c.user,
          text: c.text,
          time: c.timeAgo || 'अभी-अभी',
          avatar: c.avatar || '👤'
        })),
        district: updated.district,
        timeAgo: updated.timeAgo,
        audioTrack: updated.audioTrack
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8c. DELETE /api/reels/:id - Delete Reel from MongoDB Atlas
router.delete('/reels/:id', requireAdminAuth, contentCreationLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const query = mongoose.isValidObjectId(id) ? { $or: [{ _id: id }, { youtubeId: id }] } : { youtubeId: id };
    await Reel.deleteOne(query);
    res.json({ success: true, message: 'रील हटा दी गई' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8d. POST /api/reels/:id/like - Real-time Like/Unlike Reel in MongoDB Atlas
router.post('/reels/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'like' | 'unlike'
    const increment = action === 'unlike' ? -1 : 1;
    const query = mongoose.isValidObjectId(id) ? { $or: [{ _id: id }, { youtubeId: id }] } : { youtubeId: id };

    const reel = await Reel.findOne(query);
    if (!reel) {
      return res.status(404).json({ success: false, message: 'रील नहीं मिली' });
    }

    const currentLikes = typeof reel.likesCount === 'number' ? reel.likesCount : (parseInt(String(reel.likes).replace(/[^0-9]/g, '')) || 0);
    const newLikesCount = Math.max(0, currentLikes + increment);
    reel.likesCount = newLikesCount;
    reel.likes = newLikesCount >= 1000 ? `${(newLikesCount / 1000).toFixed(1)}K` : `${newLikesCount}`;
    await reel.save();

    res.json({
      success: true,
      data: {
        id: reel._id.toString(),
        likesCount: reel.likesCount,
        likes: reel.likes
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8e. POST /api/reels/:id/comments - Add Public Comment to Reel in MongoDB Atlas
router.post('/reels/:id/comments', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user, text, avatar } = req.body;

    const cleanUser = String(user || 'पाठक').trim().slice(0, 100);
    const cleanText = String(text || '').trim().slice(0, 500);

    if (!cleanText) {
      return res.status(400).json({ success: false, message: 'कमेंट सामग्री आवश्यक है' });
    }

    const query = mongoose.isValidObjectId(id) ? { $or: [{ _id: id }, { youtubeId: id }] } : { youtubeId: id };
    const reel = await Reel.findOne(query);
    if (!reel) {
      return res.status(404).json({ success: false, message: 'रील नहीं मिली' });
    }

    const newComment = {
      user: cleanUser,
      text: cleanText,
      timeAgo: 'अभी-अभी',
      avatar: avatar || '👤',
      createdAt: new Date()
    };

    reel.comments.unshift(newComment as any);
    // Anti-bloat: Cap comments at 100 recent entries to prevent MongoDB 16MB document exhaustion & slow API payloads
    if (reel.comments.length > 100) {
      reel.comments = reel.comments.slice(0, 100);
    }
    reel.commentsCount = String(reel.comments.length);
    await reel.save();

    const savedComment = reel.comments[0];
    res.status(201).json({
      success: true,
      message: 'कमेंट सफलतापूर्वक पोस्ट हो गया',
      data: {
        id: savedComment._id?.toString() || `comm-${Date.now()}`,
        user: savedComment.user,
        text: savedComment.text,
        time: savedComment.timeAgo,
        avatar: savedComment.avatar,
        commentsCount: reel.commentsCount
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8f. DELETE /api/reels/:id/comments/:commentId - Delete Comment (Moderation)
router.delete('/reels/:id/comments/:commentId', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id, commentId } = req.params;
    const query = mongoose.isValidObjectId(id) ? { $or: [{ _id: id }, { youtubeId: id }] } : { youtubeId: id };
    const reel = await Reel.findOne(query);
    if (!reel) {
      return res.status(404).json({ success: false, message: 'रील नहीं मिली' });
    }

    reel.comments = reel.comments.filter((c: any) => c._id?.toString() !== commentId);
    reel.commentsCount = String(reel.comments.length);
    await reel.save();

    res.json({
      success: true,
      message: 'कमेंट हटा दिया गया',
      data: {
        commentsCount: reel.commentsCount
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. GET /api/mandi - Fetch all Mandi Rates live from MongoDB Atlas (with initial seed fallback)
router.get('/mandi', async (req: Request, res: Response) => {
  try {
    let rates = await MandiRate.find().sort({ createdAt: 1 }).lean();
    if (!rates || rates.length === 0) {
      const initialRates = [
        { crop: 'गुड़ (देसी/सुपर)', mandi: 'कवर्धा', state: 'CG', rate: 3480, unit: '₹/क्विंटल', change: 'up', diff: 80 },
        { crop: 'चना (बड़ा)', mandi: 'कवर्धा', state: 'CG', rate: 5950, unit: '₹/क्विंटल', change: 'up', diff: 120 },
        { crop: 'धान (सरना)', mandi: 'रायपुर/कवर्धा', state: 'CG', rate: 3100, unit: '₹/क्विंटल', change: 'steady', diff: 0 },
        { crop: 'सोयाबीन (पीला)', mandi: 'राजनांदगांव', state: 'CG', rate: 4720, unit: '₹/क्विंटल', change: 'down', diff: -40 },
        { crop: 'गेहूं (शरबती)', mandi: 'इंदौर/भोपाल', state: 'MP', rate: 2780, unit: '₹/क्विंटल', change: 'up', diff: 50 },
        { crop: 'मक्का (हाइब्रिड)', mandi: 'छिंदवाड़ा', state: 'MP', rate: 2150, unit: '₹/क्विंटल', change: 'steady', diff: 0 }
      ];
      await MandiRate.insertMany(initialRates);
      rates = await MandiRate.find().sort({ createdAt: 1 }).lean();
    }
    const data = rates.map((r: any) => ({
      id: r._id.toString(),
      crop: r.crop,
      mandi: r.mandi,
      state: r.state,
      rate: r.rate,
      unit: r.unit,
      change: r.change,
      diff: r.diff,
      updatedAt: r.updatedAt
    }));
    res.json({ success: true, count: data.length, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9b. POST /api/mandi - Add new crop rate
router.post('/mandi', requireAdminAuth, contentCreationLimiter, async (req: Request, res: Response) => {
  try {
    const { crop, mandi, state, rate, unit, change, diff } = req.body;
    if (!crop || !rate) {
      return res.status(400).json({ success: false, message: 'फसल और भाव आवश्यक है' });
    }
    const newRate = await MandiRate.create({
      crop: crop.trim(),
      mandi: mandi ? mandi.trim() : 'कवर्धा',
      state: state || 'CG',
      rate: Number(rate),
      unit: unit || '₹/क्विंटल',
      change: change || 'steady',
      diff: Number(diff) || 0
    });
    res.status(201).json({
      success: true,
      data: {
        id: newRate._id.toString(),
        crop: newRate.crop,
        mandi: newRate.mandi,
        state: newRate.state,
        rate: newRate.rate,
        unit: newRate.unit,
        change: newRate.change,
        diff: newRate.diff
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9c. PUT /api/mandi/:id - Update existing Mandi Rate
router.put('/mandi/:id', requireAdminAuth, contentCreationLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { crop, mandi, state, rate, unit, change, diff } = req.body;
    const updated = await MandiRate.findByIdAndUpdate(
      id,
      {
        ...(crop && { crop: crop.trim() }),
        ...(mandi && { mandi: mandi.trim() }),
        ...(state && { state }),
        ...(rate !== undefined && { rate: Number(rate) }),
        ...(unit && { unit: unit.trim() }),
        ...(change && { change }),
        ...(diff !== undefined && { diff: Number(diff) })
      },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'मंडी भाव नहीं मिला' });
    }
    res.json({
      success: true,
      data: {
        id: updated._id.toString(),
        crop: updated.crop,
        mandi: updated.mandi,
        state: updated.state,
        rate: updated.rate,
        unit: updated.unit,
        change: updated.change,
        diff: updated.diff
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9d. DELETE /api/mandi/:id - Delete Mandi Rate
router.delete('/mandi/:id', requireAdminAuth, contentCreationLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await MandiRate.findByIdAndDelete(id);
    res.json({ success: true, message: 'मंडी भाव हटा दिया गया' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9e. GET /api/reporters - Fetch all Bureau Chiefs & Field Reporters (with initial seed fallback & dynamic article counts)
router.get('/reporters', async (req: Request, res: Response) => {
  try {
    let reporters = await User.find({ role: { $in: ['REPORTER', 'EDITOR', 'ADMIN'] } })
      .populate('districtId')
      .sort({ createdAt: 1 })
      .lean();

    if (!reporters || reporters.length === 0) {
      // Find default districts
      const kawardhaDistrict = await District.findOne({ $or: [{ nameHindi: /कवर्धा|कबीरधाम/i }, { name: /kawardha|kabirdham/i }] });
      const raipurDistrict = await District.findOne({ $or: [{ nameHindi: /रायपुर/i }, { name: /raipur/i }] });
      const bilaspurDistrict = await District.findOne({ $or: [{ nameHindi: /बिलासपुर/i }, { name: /bilaspur/i }] });
      const bhopalDistrict = await District.findOne({ $or: [{ nameHindi: /भोपाल/i }, { name: /bhopal/i }] });

      const initialReporters = [
        {
          name: 'अमित चंद्रवंशी',
          nameHindi: 'अमित चंद्रवंशी',
          phone: '9826011111',
          role: 'EDITOR',
          bureau: 'कवर्धा (कबीरधाम) ब्यूरो चीफ',
          districtId: kawardhaDistrict?._id,
          reporterIdCode: 'ANP-CG-KBR-01',
          photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
          isActive: true
        },
        {
          name: 'संजय वर्मा',
          nameHindi: 'संजय वर्मा',
          phone: '9826022222',
          role: 'REPORTER',
          bureau: 'कवर्धा कृषि व मंडी डेस्क',
          districtId: kawardhaDistrict?._id,
          reporterIdCode: 'ANP-CG-KBR-02',
          photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
          isActive: true
        },
        {
          name: 'मनीष यादव',
          nameHindi: 'मनीष यादव',
          phone: '9826033333',
          role: 'REPORTER',
          bureau: 'चिल्फी घाटी / बोड़ला वनांचल',
          districtId: kawardhaDistrict?._id,
          reporterIdCode: 'ANP-CG-KBR-03',
          photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
          isActive: true
        },
        {
          name: 'विशेष संवाददाता',
          nameHindi: 'विशेष संवाददाता',
          phone: '9826044444',
          role: 'REPORTER',
          bureau: 'रायपुर मंत्रालय डेस्क',
          districtId: raipurDistrict?._id,
          reporterIdCode: 'ANP-CG-RAI-01',
          photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80',
          isActive: true
        },
        {
          name: 'राजेश शुक्ला',
          nameHindi: 'राजेश शुक्ला',
          phone: '9826055555',
          role: 'REPORTER',
          bureau: 'बिलासपुर हाईकोर्ट डेस्क',
          districtId: bilaspurDistrict?._id,
          reporterIdCode: 'ANP-CG-BIL-01',
          photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
          isActive: true
        },
        {
          name: 'नीलेश शर्मा',
          nameHindi: 'नीलेश शर्मा',
          phone: '9826066666',
          role: 'REPORTER',
          bureau: 'भोपाल ब्यूरो (एमपी प्रभारी)',
          districtId: bhopalDistrict?._id,
          reporterIdCode: 'ANP-MP-BHO-01',
          photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
          isActive: true
        }
      ];

      for (const rep of initialReporters) {
        await User.findOneAndUpdate({ phone: rep.phone }, rep, { upsert: true, new: true });
      }

      reporters = await User.find({ role: { $in: ['REPORTER', 'EDITOR', 'ADMIN'] } })
        .populate('districtId')
        .sort({ createdAt: 1 })
        .lean();
    }

    // Dynamic Article Counts per Reporter
    const data = await Promise.all(
      reporters.map(async (r: any) => {
        const safeName = r.nameHindi || r.name;
        const count = await Article.countDocuments({
          $or: [
            { authorId: r._id },
            { author: new RegExp(escapeRegex(safeName), 'i') }
          ],
          deletedAt: null
        });

        return {
          _id: r._id.toString(),
          name: r.name,
          nameHindi: r.nameHindi || r.name,
          phone: r.phone,
          role: r.role,
          bureau: r.bureau || 'क्षेत्रीय संवाददाता',
          district: r.districtId?.nameHindi || r.districtId?.name || 'कवर्धा',
          districtId: r.districtId?._id?.toString(),
          reporterIdCode: r.reporterIdCode || `ANP-${r._id.toString().slice(-4).toUpperCase()}`,
          photoUrl: r.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
          articlesCount: count,
          isActive: r.isActive !== false,
          createdAt: r.createdAt
        };
      })
    );

    res.json({ success: true, count: data.length, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9f. POST /api/reporters - Register new Reporter / Bureau Chief
router.post('/reporters', requireAdminAuth, contentCreationLimiter, async (req: Request, res: Response) => {
  try {
    const { name, nameHindi, phone, bureau, district, role, reporterIdCode, photoUrl } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'संवाददाता का नाम और फोन नंबर आवश्यक है' });
    }

    let districtDoc = null;
    if (district) {
      const cleanDistrict = String(district).replace(/[()]/g, '').trim();
      districtDoc = await District.findOne({
        $or: [
          { nameHindi: new RegExp(escapeRegex(cleanDistrict), 'i') },
          { name: new RegExp(escapeRegex(cleanDistrict), 'i') }
        ]
      });
    }

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    const generatedCode = reporterIdCode?.trim() || `ANP-CG-${Math.floor(100 + Math.random() * 900)}`;

    const user = await User.findOneAndUpdate(
      { phone: cleanPhone },
      {
        name: name.trim(),
        nameHindi: (nameHindi || name).trim(),
        phone: cleanPhone,
        bureau: (bureau || 'क्षेत्रीय संवाददाता').trim(),
        districtId: districtDoc?._id,
        role: role === 'EDITOR' ? 'EDITOR' : 'REPORTER',
        reporterIdCode: generatedCode,
        photoUrl: photoUrl?.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        isActive: true
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      success: true,
      message: 'संवाददाता सफलतापूर्वक पंजीकृत हो गए',
      data: {
        _id: user._id.toString(),
        name: user.name,
        nameHindi: user.nameHindi,
        phone: user.phone,
        bureau: user.bureau,
        district: districtDoc?.nameHindi || district || 'कवर्धा',
        reporterIdCode: user.reporterIdCode,
        role: user.role,
        photoUrl: user.photoUrl,
        articlesCount: 0,
        isActive: user.isActive
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9g. PUT /api/reporters/:id - Update Reporter Details or Status
router.put('/reporters/:id', requireAdminAuth, contentCreationLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, nameHindi, phone, bureau, district, role, reporterIdCode, photoUrl, isActive } = req.body;

    let districtIdUpdate = undefined;
    if (district) {
      const cleanDistrict = String(district).replace(/[()]/g, '').trim();
      const districtDoc = await District.findOne({
        $or: [
          { nameHindi: new RegExp(escapeRegex(cleanDistrict), 'i') },
          { name: new RegExp(escapeRegex(cleanDistrict), 'i') }
        ]
      });
      if (districtDoc) districtIdUpdate = districtDoc._id;
    }

    const updated = await User.findByIdAndUpdate(
      id,
      {
        ...(name && { name: name.trim() }),
        ...(nameHindi && { nameHindi: nameHindi.trim() }),
        ...(phone && { phone: String(phone).replace(/\D/g, '').slice(-10) }),
        ...(bureau && { bureau: bureau.trim() }),
        ...(districtIdUpdate && { districtId: districtIdUpdate }),
        ...(role && { role }),
        ...(reporterIdCode && { reporterIdCode: reporterIdCode.trim() }),
        ...(photoUrl && { photoUrl: photoUrl.trim() }),
        ...(isActive !== undefined && { isActive })
      },
      { new: true }
    ).populate('districtId');

    if (!updated) {
      return res.status(404).json({ success: false, message: 'संवाददाता नहीं मिले' });
    }

    res.json({
      success: true,
      message: 'संवाददाता विवरण अपडेट हो गया',
      data: {
        _id: updated._id.toString(),
        name: updated.name,
        nameHindi: updated.nameHindi,
        phone: updated.phone,
        bureau: updated.bureau,
        district: (updated.districtId as any)?.nameHindi || district || 'कवर्धा',
        reporterIdCode: updated.reporterIdCode,
        role: updated.role,
        photoUrl: updated.photoUrl,
        isActive: updated.isActive
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9h. DELETE /api/reporters/:id - Remove Reporter
router.delete('/reporters/:id', requireAdminAuth, contentCreationLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ success: true, message: 'संवाददाता नेटवर्क से हटा दिए गए' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- ADMIN SECURITY & CRYPTOGRAPHIC AUTHENTICATION (STRICT ENV ONLY) ---
const PIN_SALT = process.env.JWT_SECRET || 'anp_editorial_desk_pin_hmac_salt_2026';

function generateAdminJwt(): string {
  const secret = process.env.JWT_SECRET || 'anp_editorial_desk_pin_hmac_salt_2026';
  return jwt.sign(
    { role: 'admin', desk: 'editorial' },
    secret,
    { expiresIn: '7d' }
  );
}

// 10a. GET /api/auth/pin-status - Check if ADMIN_PIN is present in server environment
router.get('/auth/pin-status', async (_req: Request, res: Response) => {
  const isConfigured = Boolean(process.env.ADMIN_PIN && process.env.ADMIN_PIN.trim());
  res.json({ success: true, isConfigured });
});

// 10b. POST /api/auth/verify-admin - Cryptographic Verification STRICTLY against process.env.ADMIN_PIN
router.post('/auth/verify-admin', authLimiter, async (req: Request, res: Response) => {
  try {
    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ success: false, message: 'पिन आवश्यक है' });
    }

    const expectedPin = process.env.ADMIN_PIN?.trim();

    if (!expectedPin) {
      return res.status(503).json({ 
        success: false, 
        message: 'सर्वर सुरक्षा अलर्ट: एडमिन पिन सर्वर एनवायरनमेंट (ADMIN_PIN) में सेट नहीं है।' 
      });
    }

    // Constant-time cryptographic comparison (Defeats timing attacks, validates ONLY from ENV)
    const bufInput = Buffer.from(crypto.createHmac('sha256', PIN_SALT).update(String(pin).trim()).digest('hex'));
    const bufExpected = Buffer.from(crypto.createHmac('sha256', PIN_SALT).update(expectedPin).digest('hex'));
    const isMatch = bufInput.length === bufExpected.length && crypto.timingSafeEqual(bufInput, bufExpected);

    if (isMatch) {
      return res.json({ 
        success: true, 
        message: 'प्रमाणीकरण सफल (ENV Validated)',
        token: generateAdminJwt()
      });
    } else {
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
      const userAgent = String(req.headers['user-agent'] || 'unknown').slice(0, 120);

      recordSecurityIncident({
        eventType: 'AUTH_PIN_FAILED',
        severity: 'HIGH',
        ip: clientIp,
        userAgent,
        method: 'POST',
        path: '/api/auth/verify-admin',
        statusCode: 401,
        message: 'गलत एडमिन पिन दर्ज किया गया (Invalid PIN attempt)'
      });

      return res.status(401).json({ success: false, message: 'गलत एडमिन पिन दर्ज किया गया' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. POST /api/ai/assistant - Secure Gemini AI News Assistant (Protected with requireAdminAuth & aiLimiter)
router.post('/ai/assistant', requireAdminAuth, aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { action, topic, content, district, author } = req.body;
    if (!action) {
      return res.status(400).json({ success: false, message: 'कार्य (action) आवश्यक है।' });
    }

    const result = await processGeminiNewsTask({
      action,
      topic,
      content,
      district,
      author
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    next(err);
  }
});

// 13a. GET /api/admin/security/stats - Super Admin Security Telemetry & Live Incidents
router.get('/admin/security/stats', requireAdminAuth, async (_req: Request, res: Response) => {
  try {
    const stats = await getSecurityDashboardStats();
    res.json({ success: true, data: stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 13b. DELETE /api/admin/security/logs - Super Admin Flush Security Incident Logs
router.delete('/admin/security/logs', requireAdminAuth, async (_req: Request, res: Response) => {
  try {
    const deletedCount = await clearSecurityLogs();
    res.json({ 
      success: true, 
      message: `सफलतापूर्वक ${deletedCount} सुरक्षा लॉग साफ़ कर दिए गए।`,
      deletedCount 
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 13c. POST /api/admin/security/test-probe - Super Admin Security Probe Simulation
router.post('/admin/security/test-probe', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    const userAgent = String(req.headers['user-agent'] || 'unknown').slice(0, 120);

    recordSecurityIncident({
      eventType: 'SECURITY_AUDIT_PROBE',
      severity: 'LOW',
      ip: clientIp,
      userAgent,
      method: 'POST',
      path: '/api/admin/security/test-probe',
      statusCode: 200,
      message: 'एडमिन द्वारा सुरक्षा मॉनिटर टेस्ट प्रोब सफलतापूर्वक निष्पादित (Admin Security Test Probe)'
    });

    res.json({ success: true, message: 'सुरक्षा टेस्ट प्रोब रिकॉर्ड हो गया! नीचे सूची रिफ्रेश करें।' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
