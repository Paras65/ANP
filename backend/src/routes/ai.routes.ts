import { Router, Request, Response, NextFunction } from 'express';
import { requireAdminAuth } from '../middleware/auth.middleware.js';
import { aiLimiter } from '../middleware/rateLimiter.middleware.js';
import { processGeminiNewsTask } from '../services/gemini.service.js';

const router = Router();

// POST /api/ai/assistant - Secure Gemini AI News Assistant (Protected with requireAdminAuth & aiLimiter)
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
