import { Router, Request, Response } from 'express';
import { User } from '../models/User.model.js';
import { Article } from '../models/Article.model.js';
import { District } from '../models/District.model.js';
import { requireAdminAuth } from '../middleware/auth.middleware.js';
import { contentCreationLimiter } from '../middleware/rateLimiter.middleware.js';
import { escapeRegex } from '../utils/sanitize.js';

const router = Router();

// GET /api/reporters - Fetch all Bureau Chiefs & Field Reporters live from MongoDB Atlas
router.get('/reporters', async (req: Request, res: Response) => {
  try {
    const reporters = await User.find({ role: { $in: ['REPORTER', 'EDITOR', 'ADMIN'] } })
      .populate('districtId')
      .sort({ createdAt: 1 })
      .lean();

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

// POST /api/reporters - Register new Reporter / Bureau Chief
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

// PUT /api/reporters/:id - Update Reporter Details or Status
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

// DELETE /api/reporters/:id - Remove Reporter
router.delete('/reporters/:id', requireAdminAuth, contentCreationLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ success: true, message: 'संवाददाता नेटवर्क से हटा दिए गए' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
