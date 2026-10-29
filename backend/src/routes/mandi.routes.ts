import { Router, Request, Response } from 'express';
import { MandiRate } from '../models/MandiRate.model.js';
import { requireAdminAuth } from '../middleware/auth.middleware.js';
import { contentCreationLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

// GET /api/mandi - Fetch all Mandi Rates live from MongoDB Atlas
router.get('/mandi', async (req: Request, res: Response) => {
  try {
    const rates = await MandiRate.find().sort({ createdAt: 1 }).lean();
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

// POST /api/mandi - Add new crop rate
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

// PUT /api/mandi/:id - Update existing Mandi Rate
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

// DELETE /api/mandi/:id - Delete Mandi Rate
router.delete('/mandi/:id', requireAdminAuth, contentCreationLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await MandiRate.findByIdAndDelete(id);
    res.json({ success: true, message: 'मंडी भाव हटा दिया गया' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
