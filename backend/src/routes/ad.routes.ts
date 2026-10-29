import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Advertisement } from '../models/Advertisement.model.js';
import { Setting } from '../models/Setting.model.js';
import { requireAdminAuth } from '../middleware/auth.middleware.js';
import { contentCreationLimiter } from '../middleware/rateLimiter.middleware.js';
import { logger } from '../utils/logger.js';

const router = Router();

// GET /api/ads - Get advertisements (Public gets active, Admin can pass ?all=true)
router.get('/ads', async (req: Request, res: Response) => {
  try {
    const { placement, district, all } = req.query;
    const query: any = {};

    if (all !== 'true') {
      query.isActive = true;
      query.$or = [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gte: new Date() } }
      ];
    }

    if (placement) {
      query.placement = String(placement);
    }

    if (district && district !== 'सभी' && district !== 'all') {
      query.$or = [
        ...(query.$or || []),
        { targetDistrict: 'सभी 88 जिले' },
        { targetDistrict: String(district) }
      ];
    }

    const ads = await Advertisement.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    // Increment impressions in background for active ads returned publicly
    if (all !== 'true' && ads.length > 0) {
      const adIds = ads.map(a => a._id);
      Advertisement.updateMany(
        { _id: { $in: adIds } },
        { $inc: { impressions: 1 } }
      ).exec().catch(() => {});
    }

    res.json({
      success: true,
      count: ads.length,
      data: ads
    });
  } catch (err: any) {
    logger.error('Error fetching advertisements:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/ads/:id/click - Increment click count when user taps an ad banner
router.post('/ads/:id/click', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'अमान्य विज्ञापन आईडी' });
    }

    const ad = await Advertisement.findByIdAndUpdate(
      id,
      { $inc: { clicks: 1 } },
      { new: true }
    );

    if (!ad) {
      return res.status(404).json({ success: false, error: 'विज्ञापन नहीं मिला' });
    }

    res.json({ success: true, clicks: ad.clicks });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/ads - Create new advertisement (Admin only)
router.post('/ads', requireAdminAuth, contentCreationLimiter, async (req: Request, res: Response) => {
  try {
    const {
      title,
      clientName,
      clientPhone,
      imageUrl,
      linkUrl,
      placement,
      targetDistrict,
      expiryDate,
      priority,
      isActive
    } = req.body;

    if (!title || !clientName || !imageUrl || !linkUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'कृपया सभी आवश्यक फ़ील्ड्स (शीर्षक, ग्राहक का नाम, बैनर इमेज URL, रीडायरेक्ट लिंक) भरें।' 
      });
    }

    const newAd = new Advertisement({
      title: String(title).trim(),
      clientName: String(clientName).trim(),
      clientPhone: clientPhone ? String(clientPhone).trim() : '',
      imageUrl: String(imageUrl).trim(),
      linkUrl: String(linkUrl).trim(),
      placement: placement || 'in_feed',
      targetDistrict: targetDistrict || 'सभी 88 जिले',
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      priority: Number(priority) || 0,
      isActive: isActive !== false,
      impressions: 0,
      clicks: 0
    });

    await newAd.save();

    logger.info(`New Advertisement created: ${newAd.title} for ${newAd.clientName}`);
    res.status(201).json({
      success: true,
      message: 'नया विज्ञापन बैनर सफलतापूर्वक दर्ज किया गया!',
      data: newAd
    });
  } catch (err: any) {
    logger.error('Error creating advertisement:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/ads/:id - Update advertisement / toggle active state (Admin only)
router.put('/ads/:id', requireAdminAuth, contentCreationLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'अमान्य विज्ञापन आईडी' });
    }

    const updated = await Advertisement.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'विज्ञापन नहीं मिला' });
    }

    res.json({
      success: true,
      message: 'विज्ञापन का विवरण सफलतापूर्वक अपडेट हुआ!',
      data: updated
    });
  } catch (err: any) {
    logger.error('Error updating advertisement:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/ads/:id - Delete advertisement (Admin only)
router.delete('/ads/:id', requireAdminAuth, contentCreationLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'अमान्य विज्ञापन आईडी' });
    }

    const deleted = await Advertisement.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'विज्ञापन नहीं मिला' });
    }

    res.json({
      success: true,
      message: 'विज्ञापन सफलतापूर्वक हटा दिया गया।'
    });
  } catch (err: any) {
    logger.error('Error deleting advertisement:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/settings/monetization - Get Google AdSense and global sponsor settings
router.get('/settings/monetization', async (_req: Request, res: Response) => {
  try {
    const setting = await Setting.findOne({ key: 'monetization' }).lean();
    const defaults = {
      adsenseEnabled: false,
      adsensePublisherId: '',
      headerSlotId: '',
      inFeedSlotId: '',
      articleSlotId: '',
      whatsappSponsorLine: 'डिजिटल विज्ञापन व कवरेज हेतु संपर्क करें: 7000139694',
      monthlyRevenueGoal: 50000
    };

    res.json({
      success: true,
      data: setting ? { ...defaults, ...setting.value } : defaults
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/settings/monetization - Update Google AdSense and global sponsor settings
router.put('/settings/monetization', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const setting = await Setting.findOneAndUpdate(
      { key: 'monetization' },
      { key: 'monetization', value: req.body },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'मोनेटाइजेशन एवं विज्ञापन सेटिंग्स सफलतापूर्वक सहेजी गईं!',
      data: setting.value
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
