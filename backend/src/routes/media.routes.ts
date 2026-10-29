import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Video } from '../models/Video.model.js';
import { Reel } from '../models/Reel.model.js';
import { Setting } from '../models/Setting.model.js';
import { requireAdminAuth } from '../middleware/auth.middleware.js';
import { contentCreationLimiter } from '../middleware/rateLimiter.middleware.js';
import { syncFromYouTubeDataAPI, getLiveChannelStats } from '../services/youtubeSync.js';
import { logger } from '../utils/logger.js';

const router = Router();
let activeYouTubeChannelId = process.env.YOUTUBE_CHANNEL_ID || 'UC8mIipC7suPuBJ_n8kUzkCg';

// GET /api/videos - List YouTube Bulletins live from MongoDB Atlas with Server-side Pagination
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
        thumbnail: (v.thumbnail || `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`)
          .replace('maxresdefault.jpg', 'hqdefault.jpg')
          .replace('sddefault.jpg', 'hqdefault.jpg')
          .replace('img.youtube.com', 'i.ytimg.com'),
        duration: v.duration,
        views: v.views,
        timeAgo: v.timeAgo,
        category: v.category,
        youtubeUrl: v.youtubeUrl,
        publishedAt: v.publishedAt || v.createdAt,
        createdAt: v.createdAt
      }))
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/youtube/sync - Auto-fetch YouTube channel videos using 100% Official Google YouTube Data API v3
router.get('/youtube/sync', async (req: Request, res: Response) => {
  try {
    const channelId = String(req.query.channelId || activeYouTubeChannelId || process.env.YOUTUBE_CHANNEL_ID || 'UC8mIipC7suPuBJ_n8kUzkCg').trim();
    if (!channelId) {
      return res.status(400).json({
        success: false,
        message: 'चैनल आईडी (Channel ID UC...) प्रदान करें'
      });
    }

    // Strictly read API Key from server environment variable
    const apiKey = (process.env.YOUTUBE_API_KEY || '').trim();

    // 100% Official API Enforcement: If API key is not configured, inform admin cleanly without scraping
    if (!apiKey) {
      const stats = await getLiveChannelStats(channelId);
      const allVideos = await Video.find({ isShort: false }).sort({ publishedAt: -1, createdAt: -1 }).lean();
      const allReels = await Reel.find().sort({ publishedAt: -1, createdAt: -1 }).lean();

      return res.status(200).json({
        success: false,
        isConfigured: false,
        isOfficialApiOnly: true,
        message: 'यूट्यूब सेवा सक्रिय की जा रही है।',
        channelId,
        syncEngine: 'youtube_data_api_v3_pending',
        subscribers: stats.subscriberCount,
        stats,
        totalFetched: allVideos.length + allReels.length,
        videos: allVideos.map((v: any) => ({
          id: v._id.toString(),
          title: v.title,
          youtubeId: v.youtubeId,
          thumbnail: (v.thumbnail || `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`)
            .replace('maxresdefault.jpg', 'hqdefault.jpg')
            .replace('sddefault.jpg', 'hqdefault.jpg')
            .replace('img.youtube.com', 'i.ytimg.com'),
          duration: v.duration,
          views: v.views,
          timeAgo: v.timeAgo,
          category: v.category,
          youtubeUrl: v.youtubeUrl
        })),
        reels: allReels.map((r: any) => ({
          id: r._id.toString(),
          caption: r.caption,
          imageUrl: (r.imageUrl || (r.youtubeId ? `https://i.ytimg.com/vi/${r.youtubeId}/hqdefault.jpg` : '/logo.png'))
            .replace('maxresdefault.jpg', 'hqdefault.jpg')
            .replace('sddefault.jpg', 'hqdefault.jpg')
            .replace('img.youtube.com', 'i.ytimg.com'),
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
    }

    let newVideosAdded = 0;
    let newReelsAdded = 0;

    logger.info(`[YouTube Sync] Executing 100% Official Google YouTube Data API v3 for channel ${channelId}`);
    const apiData = await syncFromYouTubeDataAPI(channelId, apiKey);
    const totalFetched = apiData.videos.length + apiData.reels.length;

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
        await Reel.create({
          ...s,
          publishedAt: s.publishedAt ? new Date(s.publishedAt) : new Date()
        });
        newReelsAdded++;
      } else {
        await Reel.updateOne(
          { youtubeId: s.youtubeId },
          {
            $set: {
              likes: s.likes,
              commentsCount: s.commentsCount,
              caption: s.caption,
              imageUrl: s.imageUrl,
              ...(s.publishedAt ? { publishedAt: new Date(s.publishedAt) } : {})
            }
          }
        );
      }
    }

    activeYouTubeChannelId = channelId;
    const allVideos = await Video.find({ isShort: false }).sort({ publishedAt: -1, createdAt: -1 }).lean();
    const allReels = await Reel.find().sort({ publishedAt: -1, createdAt: -1 }).lean();
    const stats = await getLiveChannelStats(channelId, true);

    return res.json({
      success: true,
      channelId,
      syncEngine: 'youtube_data_api_v3',
      isOfficialApi: true,
      totalFetched,
      newVideosAdded,
      newReelsAdded,
      subscribers: stats.subscriberCount,
      stats,
      videos: allVideos.map((v: any) => ({
        id: v._id.toString(),
        title: v.title,
        youtubeId: v.youtubeId,
        thumbnail: v.thumbnail,
        duration: v.duration,
        views: v.views,
        timeAgo: v.timeAgo,
        category: v.category,
        youtubeUrl: v.youtubeUrl,
        publishedAt: v.publishedAt || v.createdAt,
        createdAt: v.createdAt
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
        audioTrack: r.audioTrack,
        publishedAt: r.publishedAt || r.createdAt,
        createdAt: r.createdAt
      }))
    });
  } catch (err: any) {
    logger.error('[YouTube Sync Error]:', err?.message || err);
    return res.status(500).json({ success: false, message: 'यूट्यूब वीडियो सिंक करने में समस्या आई।' });
  }
});

// GET & POST /api/youtube/config - Read channel ID; check server configuration status
router.get('/youtube/config', async (req: Request, res: Response) => {
  try {
    const doc = await Setting.findOne({ key: 'youtube_channel_id' });
    const channelId = doc?.value || activeYouTubeChannelId || process.env.YOUTUBE_CHANNEL_ID || 'UC8mIipC7suPuBJ_n8kUzkCg';
    const isConfiguredOnServer = Boolean(process.env.YOUTUBE_API_KEY);
    const stats = await getLiveChannelStats(channelId);
    res.json({ success: true, channelId, isConfiguredOnServer, stats, subscribers: stats.subscriberCount });
  } catch {
    const stats = await getLiveChannelStats(activeYouTubeChannelId);
    res.json({ success: true, channelId: activeYouTubeChannelId, isConfiguredOnServer: Boolean(process.env.YOUTUBE_API_KEY), stats, subscribers: stats.subscriberCount });
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
    const stats = await getLiveChannelStats(clean, true);
    res.json({
      success: true,
      message: 'यूट्यूब चैनल आईडी सफलतापूर्वक सुरक्षित हो गई!',
      channelId: clean,
      isConfiguredOnServer: Boolean(process.env.YOUTUBE_API_KEY),
      stats,
      subscribers: stats.subscriberCount
    });
  } catch (err: any) {
    logger.error('[Save YouTube Config Error]:', err?.message || err);
    res.status(500).json({ success: false, message: 'चैनल आईडी सुरक्षित करने में त्रुटि आई।' });
  }
});

// GET /api/youtube/stats - Read real-time YouTube subscribers and statistics
router.get('/youtube/stats', async (req: Request, res: Response) => {
  try {
    const channelId = String(req.query.channelId || activeYouTubeChannelId || 'UC8mIipC7suPuBJ_n8kUzkCg').trim();
    const force = req.query.force === 'true';
    const stats = await getLiveChannelStats(channelId, force);
    res.json({ success: true, stats, subscribers: stats.subscriberCount });
  } catch (err: any) {
    res.json({ success: true, subscribers: '4.56K+', stats: { subscriberCount: '4.56K+' } });
  }
});

// POST /api/videos - Add new YouTube Bulletin directly into MongoDB Atlas
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

// DELETE /api/videos/:id - Delete YouTube Bulletin from MongoDB Atlas
router.delete('/videos/:id', requireAdminAuth, contentCreationLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Video.deleteOne({ $or: [{ _id: id }, { youtubeId: id }] });
    res.json({ success: true, message: 'वीडियो हटा दिया गया' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/reels - List Reels / Shorts live from MongoDB Atlas with Server-side Pagination
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
        .sort({ publishedAt: -1, createdAt: -1 })
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
        imageUrl: (r.imageUrl || (r.youtubeId ? `https://i.ytimg.com/vi/${r.youtubeId}/hqdefault.jpg` : '/logo.png'))
          .replace('maxresdefault.jpg', 'hqdefault.jpg')
          .replace('sddefault.jpg', 'hqdefault.jpg')
          .replace('img.youtube.com', 'i.ytimg.com'),
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
        audioTrack: r.audioTrack,
        publishedAt: r.publishedAt || r.createdAt,
        createdAt: r.createdAt
      }))
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/reels - Add new Reel / Short directly into MongoDB Atlas
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

// PUT /api/reels/:id - Edit / Update existing Reel in MongoDB Atlas
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

// DELETE /api/reels/:id - Delete Reel from MongoDB Atlas
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

// POST /api/reels/:id/like - Real-time Like/Unlike Reel in MongoDB Atlas
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

// POST /api/reels/:id/comments - Add Public Comment to Reel in MongoDB Atlas
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

// DELETE /api/reels/:id/comments/:commentId - Delete Comment (Moderation)
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

export default router;
