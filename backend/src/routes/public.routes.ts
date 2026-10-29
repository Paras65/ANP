import { Router } from 'express';
import feedRoutes from './feed.routes.js';
import articleRoutes from './article.routes.js';
import mediaRoutes from './media.routes.js';
import mandiRoutes from './mandi.routes.js';
import reporterRoutes from './reporter.routes.js';
import adRoutes from './ad.routes.js';
import authRoutes from './auth.routes.js';
import aiRoutes from './ai.routes.js';

export { getMasterData, invalidateMasterCache } from '../services/masterCache.service.js';

const router = Router();

// Sub-routers mounted cleanly under root /api
router.use(feedRoutes);
router.use(articleRoutes);
router.use(mediaRoutes);
router.use(mandiRoutes);
router.use(reporterRoutes);
router.use(adRoutes);
router.use(authRoutes);
router.use(aiRoutes);

export default router;
