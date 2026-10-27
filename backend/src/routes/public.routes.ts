import { Router, Request, Response, NextFunction } from 'express';
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
import { authLimiter, aiLimiter } from '../middleware/rateLimiter.middleware.js';
import { fetchChannelVideos, fetchChannelShorts, syncFromYouTubeDataAPI } from '../services/youtubeSync.js';
import { processGeminiNewsTask } from '../services/gemini.service.js';

const router = Router();
let activeYouTubeChannelId = process.env.YOUTUBE_CHANNEL_ID || 'UC8mIipC7suPuBJ_n8kUzkCg';

// 1. GET /api/districts - Fetch districts live from MongoDB Atlas
router.get('/districts', async (req: Request, res: Response) => {
  try {
    const { state } = req.query;
    let filter: any = {};

    if (state) {
      const stateDoc = await State.findOne({ slug: String(state).toLowerCase() });
      if (stateDoc) {
        filter.stateId = stateDoc._id;
      }
    }

    const docs = await District.find(filter).populate('stateId').sort({ nameHindi: 1 }).lean();
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

// 3. GET /api/articles - List published articles filtered live from MongoDB Atlas
router.get('/articles', async (req: Request, res: Response) => {
  try {
    const { district, state, category, search } = req.query;
    let filter: any = { deletedAt: null, status: 'PUBLISHED' };

    if (state) {
      const stateDoc = await State.findOne({ slug: String(state).toLowerCase() });
      if (stateDoc) filter.stateId = stateDoc._id;
    }

    if (district && district !== 'सभी') {
      const districtDoc = await District.findOne({
        $or: [
          { nameHindi: new RegExp(String(district), 'i') },
          { name: new RegExp(String(district), 'i') },
          { slug: String(district).toLowerCase() }
        ]
      });
      if (districtDoc) filter.districtId = districtDoc._id;
    }

    if (category && category !== 'सभी खबरें') {
      const catDoc = await Category.findOne({
        $or: [
          { name: new RegExp(String(category).replace(/[^\u0900-\u097F\w]/g, '').trim(), 'i') },
          { slug: String(category).toLowerCase() }
        ]
      });
      if (catDoc) filter.categoryId = catDoc._id;
    }

    if (search) {
      filter.$or = [
        { title: new RegExp(String(search), 'i') },
        { excerpt: new RegExp(String(search), 'i') }
      ];
    }

    const articles = await Article.find(filter)
      .populate('districtId')
      .populate('categoryId')
      .populate('stateId')
      .populate('authorId')
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(50)
      .lean();

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
      publishedAt: a.publishedAt ? new Date(a.publishedAt).toISOString() : new Date().toISOString()
    }));

    res.json({ success: true, count: data.length, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. POST /api/articles - Submit new article directly into MongoDB Atlas
router.post('/articles', requireAdminAuth, async (req: Request, res: Response) => {
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

// 4b. DELETE /api/articles/:id - Soft delete article from MongoDB Atlas
router.delete('/articles/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Article.findByIdAndUpdate(id, { deletedAt: new Date() });
    res.json({ success: true, message: 'आर्टिकल सफलतापूर्वक हटा दिया गया' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4c. PUT /api/articles/:id - Update existing article live in MongoDB Atlas
router.put('/articles/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, excerpt, content, district, category, author, state, isBreaking, isFeatured, coverImage } = req.body;
    const updated = await Article.findByIdAndUpdate(
      id,
      {
        ...(title && { title: title.trim() }),
        ...(excerpt && { excerpt: excerpt.trim() }),
        ...(content && { content }),
        ...(district && { district: district.trim() }),
        ...(category && { category: category.trim() }),
        ...(author && { author: author.trim() }),
        ...(state && { state }),
        ...(isBreaking !== undefined && { isBreaking }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(coverImage && { coverImage })
      },
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

// 5. GET /api/videos - List YouTube Bulletins live from MongoDB Atlas
router.get('/videos', async (req: Request, res: Response) => {
  try {
    const videos = await Video.find({ isShort: false }).sort({ publishedAt: -1, createdAt: -1 }).lean();
    res.json({
      success: true,
      count: videos.length,
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
        console.log(`[YouTube Sync] Executing official YouTube Data API v3 for channel ${channelId}`);
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
        console.warn('[YouTube Data API v3 Failed, Falling back to RSS/Scraper]:', apiErr?.message);
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
        console.warn('[Shorts Sync Error]:', shortErr);
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
router.post('/videos', requireAdminAuth, async (req: Request, res: Response) => {
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
router.delete('/videos/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Video.deleteOne({ $or: [{ _id: id }, { youtubeId: id }] });
    res.json({ success: true, message: 'वीडियो हटा दिया गया' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. GET /api/reels - List Reels / Shorts live from MongoDB Atlas
router.get('/reels', async (req: Request, res: Response) => {
  try {
    const reels = await Reel.find().sort({ createdAt: -1 }).lean();
    res.json({
      success: true,
      count: reels.length,
      data: reels.map((r: any) => ({
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
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. POST /api/reels - Add new Reel / Short directly into MongoDB Atlas
router.post('/reels', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { caption, postUrl, youtubeId, imageUrl, district, audioTrack, embedUrl } = req.body;
    if (!caption) {
      return res.status(400).json({ success: false, message: 'कैप्शन आवश्यक है' });
    }
    const newReel = await Reel.create({
      caption: caption.trim(),
      imageUrl: imageUrl || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800'),
      youtubeId: youtubeId || undefined,
      embedUrl: embedUrl || (youtubeId ? `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&loop=1&playlist=${youtubeId}&rel=0` : undefined),
      postUrl: postUrl || 'https://www.instagram.com/ambition_news/',
      likes: '1',
      commentsCount: '0',
      sharesCount: '0',
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
        youtubeId: newReel.youtubeId,
        embedUrl: newReel.embedUrl,
        postUrl: newReel.postUrl,
        likes: newReel.likes,
        commentsCount: newReel.commentsCount,
        sharesCount: newReel.sharesCount,
        district: newReel.district,
        timeAgo: newReel.timeAgo,
        audioTrack: newReel.audioTrack
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8b. DELETE /api/reels/:id - Delete Reel from MongoDB Atlas
router.delete('/reels/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Reel.deleteOne({ $or: [{ _id: id }, { youtubeId: id }] });
    res.json({ success: true, message: 'रील हटा दी गई' });
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
router.post('/mandi', requireAdminAuth, async (req: Request, res: Response) => {
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
router.put('/mandi/:id', requireAdminAuth, async (req: Request, res: Response) => {
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
router.delete('/mandi/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await MandiRate.findByIdAndDelete(id);
    res.json({ success: true, message: 'मंडी भाव हटा दिया गया' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- ADMIN SECURITY & CRYPTOGRAPHIC AUTHENTICATION ---
const PIN_SALT = process.env.JWT_SECRET || 'anp_editorial_desk_pin_hmac_salt_2026';

function hashPin(rawPin: string): string {
  return crypto.createHmac('sha256', PIN_SALT).update(String(rawPin).trim()).digest('hex');
}

function verifyPinMatch(inputPin: string, storedTarget: string): boolean {
  const hashedInput = hashPin(inputPin);
  
  // Constant-time comparison to defeat side-channel timing analysis attacks
  try {
    const bufA = Buffer.from(hashedInput);
    const bufB = Buffer.from(storedTarget);
    if (bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)) {
      return true;
    }
  } catch {
    // continue
  }

  // Safe constant-time fallback for legacy unhashed values
  try {
    const bufRaw = Buffer.from(String(inputPin).trim());
    const bufTarget = Buffer.from(String(storedTarget).trim());
    if (bufRaw.length === bufTarget.length && crypto.timingSafeEqual(bufRaw, bufTarget)) {
      return true;
    }
  } catch {
    // continue
  }

  return false;
}

function generateAdminJwt(): string {
  const secret = process.env.JWT_SECRET || 'anp_editorial_desk_pin_hmac_salt_2026';
  return jwt.sign(
    { role: 'admin', desk: 'editorial' },
    secret,
    { expiresIn: '7d' }
  );
}

// 10a. GET /api/auth/pin-status - Check if an admin PIN is configured (NEVER returns the PIN or hash)
router.get('/auth/pin-status', async (_req: Request, res: Response) => {
  try {
    const setting = await Setting.findOne({ key: 'admin_pin' });
    const isConfigured = Boolean((setting?.value && String(setting.value).trim()) || (process.env.ADMIN_PIN && process.env.ADMIN_PIN.trim()));
    res.json({ success: true, isConfigured });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10b. POST /api/auth/setup-pin - Initial First-Time Setup of Admin PIN (Stored as One-Way HMAC-SHA256 Hash)
router.post('/auth/setup-pin', authLimiter, async (req: Request, res: Response) => {
  try {
    const { newPin } = req.body;
    if (!newPin || String(newPin).trim().length < 4) {
      return res.status(400).json({ success: false, message: 'नया एडमिन पिन कम से कम 4 अंकों का होना चाहिए' });
    }

    const existingSetting = await Setting.findOne({ key: 'admin_pin' });
    const isConfigured = Boolean((existingSetting?.value && String(existingSetting.value).trim()) || (process.env.ADMIN_PIN && process.env.ADMIN_PIN.trim()));

    if (isConfigured) {
      return res.status(403).json({ 
        success: false, 
        message: 'एडमिन पिन पहले से कॉन्फ़िगर है। इसे बदलने के लिए पिन बदलें (Change PIN) का उपयोग करें।' 
      });
    }

    // Store strictly as a salted cryptographic hash
    const hashed = hashPin(newPin);
    await Setting.findOneAndUpdate(
      { key: 'admin_pin' },
      { value: hashed, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({ 
      success: true, 
      message: 'एडमिन पिन सुरक्षित रूप से सेट किया गया!',
      token: generateAdminJwt()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10c. POST /api/auth/verify-admin - Cryptographic Hash Verification & Signed JWT Issuance
router.post('/auth/verify-admin', authLimiter, async (req: Request, res: Response) => {
  try {
    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ success: false, message: 'पिन आवश्यक है' });
    }

    const setting = await Setting.findOne({ key: 'admin_pin' });
    const expectedPin = setting?.value || process.env.ADMIN_PIN;

    if (!expectedPin) {
      return res.status(400).json({ 
        success: false, 
        needsSetup: true,
        message: 'एडमिन सुरक्षा पिन अभी सेट नहीं किया गया है। कृपया पहले पिन सेटअप करें।' 
      });
    }

    if (verifyPinMatch(pin, String(expectedPin))) {
      // If previous entry was plain text, seamlessly upgrade to hash
      if (String(expectedPin) !== hashPin(pin)) {
        await Setting.findOneAndUpdate(
          { key: 'admin_pin' },
          { value: hashPin(pin), updatedAt: new Date() }
        );
      }

      return res.json({ 
        success: true, 
        message: 'प्रमाणीकरण सफल',
        token: generateAdminJwt()
      });
    } else {
      return res.status(401).json({ success: false, message: 'गलत एडमिन पिन दर्ज किया गया' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10d. POST /api/auth/change-pin - Securely Update PIN Hash (Requires Active Admin Token)
router.post('/auth/change-pin', requireAdminAuth, authLimiter, async (req: Request, res: Response) => {
  try {
    const { currentPin, newPin } = req.body;
    if (!currentPin || !newPin) {
      return res.status(400).json({ success: false, message: 'वर्तमान और नया पिन दोनों आवश्यक हैं' });
    }
    if (String(newPin).trim().length < 4) {
      return res.status(400).json({ success: false, message: 'नया पिन कम से कम 4 अंकों का होना चाहिए' });
    }

    const setting = await Setting.findOne({ key: 'admin_pin' });
    const expectedPin = setting?.value || process.env.ADMIN_PIN;

    if (!expectedPin) {
      return res.status(400).json({ 
        success: false, 
        needsSetup: true,
        message: 'एडमिन सुरक्षा पिन पहले से सेट नहीं है।' 
      });
    }

    if (!verifyPinMatch(currentPin, String(expectedPin))) {
      return res.status(401).json({ success: false, message: 'वर्तमान पिन गलत है' });
    }

    // Save as cryptographic hash
    const hashedNew = hashPin(newPin);
    await Setting.findOneAndUpdate(
      { key: 'admin_pin' },
      { value: hashedNew, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({ 
      success: true, 
      message: 'एडमिन पिन सफलतापूर्वक बदल दिया गया',
      token: generateAdminJwt()
    });
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

export default router;
