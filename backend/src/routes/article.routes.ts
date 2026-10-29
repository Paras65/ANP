import { Router, Request, Response } from 'express';
import { Article } from '../models/Article.model.js';
import { District } from '../models/District.model.js';
import { State } from '../models/State.model.js';
import { Category } from '../models/Category.model.js';
import { User } from '../models/User.model.js';
import { requireAdminAuth } from '../middleware/auth.middleware.js';
import { contentCreationLimiter } from '../middleware/rateLimiter.middleware.js';
import { getMasterData } from '../services/masterCache.service.js';
import { escapeRegex } from '../utils/sanitize.js';

const router = Router();

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

    const cleanTitle = title.trim();

    // Edge Case: Double-Click / Duplicate Submission Guard (Anti-Replay)
    const recentDuplicate = await Article.findOne({
      title: cleanTitle,
      deletedAt: null,
      createdAt: { $gte: new Date(Date.now() - 60 * 1000) }
    }).select('_id title publishedAt').lean();

    if (recentDuplicate) {
      return res.status(409).json({
        success: false,
        duplicate: true,
        message: 'यह समाचार हाल ही में (पिछले 60 सेकंड में) प्रकाशित किया जा चुका है। दोहराव (डबल-क्लिक) से सुरक्षा हेतु अनुरोध अस्वीकृत किया गया।',
        data: recentDuplicate
      });
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
      coverImage: coverImage || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&auto=format&fit=crop&q=65',
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

// 5. POST /api/articles/scoop - Citizen Journalism Scoop Submission
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

// 6. DELETE /api/articles/:id - Soft delete article from MongoDB Atlas
router.delete('/articles/:id', requireAdminAuth, contentCreationLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Article.findByIdAndUpdate(id, { deletedAt: new Date() });
    res.json({ success: true, message: 'आर्टिकल सफलतापूर्वक ट्रैश (हटा दिया) में भेज दिया गया' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. POST /api/articles/:id/restore - Restore soft-deleted article from Trash
router.post('/articles/:id/restore', requireAdminAuth, contentCreationLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const restored = await Article.findByIdAndUpdate(id, { deletedAt: null }, { new: true });
    if (!restored) {
      return res.status(404).json({ success: false, message: 'ट्रैश में खबर नहीं मिली' });
    }
    res.json({ success: true, message: 'खबर सफलतापूर्वक ट्रैश से पुनः सक्रिय कर दी गई', data: restored });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. GET /api/articles/trash - List soft-deleted articles for Trash & Recovery Desk
router.get('/articles/trash', requireAdminAuth, async (_req: Request, res: Response) => {
  try {
    const deletedArticles = await Article.find({ deletedAt: { $ne: null } })
      .sort({ deletedAt: -1 })
      .limit(50)
      .lean();
    res.json({ success: true, count: deletedArticles.length, data: deletedArticles });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. PUT /api/articles/:id - Update existing article live in MongoDB Atlas with Concurrency Conflict Detection
router.put('/articles/:id', requireAdminAuth, contentCreationLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, excerpt, content, district, category, author, state, isBreaking, isFeatured, coverImage, status, clientUpdatedAt } = req.body;

    // Edge Case: Concurrency Conflict Detection
    if (clientUpdatedAt) {
      const existing = await Article.findById(id).select('updatedAt title').lean();
      if (existing && existing.updatedAt) {
        const serverTime = new Date(existing.updatedAt).getTime();
        const clientTime = new Date(clientUpdatedAt).getTime();
        if (serverTime - clientTime > 3000) {
          return res.status(409).json({
            success: false,
            conflict: true,
            message: 'संपादन टकराव (Concurrency Conflict): किसी अन्य संपादक ने हाल ही में यह खबर अपडेट की है। आपका पुराना ड्राफ्ट नए बदलावों को ओवरराइट करने से रोका गया है। कृपया पेज रिफ्रेश करें।',
            serverUpdatedAt: existing.updatedAt
          });
        }
      }
    }

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

export default router;
