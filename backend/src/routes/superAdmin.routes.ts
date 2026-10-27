import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Article } from '../models/Article.model.js';
import { Video } from '../models/Video.model.js';
import { Reel } from '../models/Reel.model.js';
import { MandiRate } from '../models/MandiRate.model.js';
import { User } from '../models/User.model.js';
import { SecurityLog } from '../models/SecurityLog.model.js';
import { authLimiter } from '../middleware/rateLimiter.middleware.js';
import { requireSuperAdminAuth } from '../middleware/auth.middleware.js';
import { 
  getSecurityDashboardStats, 
  clearSecurityLogs, 
  recordSecurityIncident 
} from '../services/securityAudit.service.js';

const router = Router();
const PIN_SALT = process.env.JWT_SECRET || 'anp_super_admin_master_salt_2026';

function generateSuperAdminJwt(): string {
  const secret = process.env.JWT_SECRET || 'anp_editorial_desk_pin_hmac_salt_2026';
  return jwt.sign(
    { role: 'super_admin', level: 'root', desk: 'security_governance' },
    secret,
    { expiresIn: '24h' }
  );
}

// 1. GET /api/super-admin/auth/status - Check if SUPER_ADMIN_PIN is configured in ENV
router.get('/auth/status', async (_req: Request, res: Response) => {
  const isConfigured = Boolean(process.env.SUPER_ADMIN_PIN && process.env.SUPER_ADMIN_PIN.trim());
  res.json({ success: true, isConfigured });
});

// 2. POST /api/super-admin/auth/login - Super Admin Authentication (STRICTLY against process.env.SUPER_ADMIN_PIN)
router.post('/auth/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ success: false, message: 'मास्टर पिन आवश्यक है' });
    }

    const expectedMasterPin = process.env.SUPER_ADMIN_PIN?.trim();

    if (!expectedMasterPin) {
      return res.status(503).json({ 
        success: false, 
        message: 'सर्वर सुरक्षा अलर्ट: सुपर एडमिन पिन सर्वर एनवायरनमेंट (SUPER_ADMIN_PIN) में सेट नहीं है।' 
      });
    }

    // Cryptographic constant-time comparison against environment variable
    const bufInput = Buffer.from(crypto.createHmac('sha256', PIN_SALT).update(`super_admin:${String(pin).trim()}`).digest('hex'));
    const bufExpected = Buffer.from(crypto.createHmac('sha256', PIN_SALT).update(`super_admin:${expectedMasterPin}`).digest('hex'));
    const isMatch = bufInput.length === bufExpected.length && crypto.timingSafeEqual(bufInput, bufExpected);

    if (isMatch) {
      return res.json({ 
        success: true, 
        message: 'सुपर एडमिन प्रमाणीकरण सफल (Root Access Granted via ENV)',
        token: generateSuperAdminJwt()
      });
    } else {
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
      const userAgent = String(req.headers['user-agent'] || 'unknown').slice(0, 120);

      recordSecurityIncident({
        eventType: 'SUPER_ADMIN_PIN_FAILED',
        severity: 'CRITICAL',
        ip: clientIp,
        userAgent,
        method: 'POST',
        path: '/api/super-admin/auth/login',
        statusCode: 401,
        message: 'सुपर एडमिन लॉगिन पर गलत मास्टर पिन का प्रयास दर्ज किया गया'
      });

      return res.status(401).json({ success: false, message: 'गलत सुपर एडमिन मास्टर पिन दर्ज किया गया' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. GET /api/super-admin/security/stats - Live Security Telemetry & Incidents (Protected by requireSuperAdminAuth)
router.get('/security/stats', requireSuperAdminAuth, async (_req: Request, res: Response) => {
  try {
    const stats = await getSecurityDashboardStats();
    res.json({ success: true, data: stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. DELETE /api/super-admin/security/logs - Super Admin Flush Security Incident Logs
router.delete('/security/logs', requireSuperAdminAuth, async (_req: Request, res: Response) => {
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

// 5. POST /api/super-admin/security/test-probe - Test Security Incident Probe
router.post('/security/test-probe', requireSuperAdminAuth, async (req: Request, res: Response) => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    const userAgent = String(req.headers['user-agent'] || 'unknown').slice(0, 120);

    recordSecurityIncident({
      eventType: 'SECURITY_AUDIT_PROBE',
      severity: 'LOW',
      ip: clientIp,
      userAgent,
      method: 'POST',
      path: '/api/super-admin/security/test-probe',
      statusCode: 200,
      message: 'सुपर एडमिन द्वारा सुरक्षा मॉनिटर टेस्ट प्रोब निष्पादित किया गया (Super Admin Root Probe)'
    });

    res.json({ success: true, message: 'सुरक्षा टेस्ट प्रोब सफलतापूर्वक रिकॉर्ड किया गया!' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. GET /api/super-admin/database/overview - Storage & Document Counts Across MongoDB Atlas
router.get('/database/overview', requireSuperAdminAuth, async (_req: Request, res: Response) => {
  try {
    const [
      articlesCount,
      videosCount,
      reelsCount,
      mandiCount,
      usersCount,
      securityLogsCount
    ] = await Promise.all([
      Article.countDocuments({ deletedAt: null }),
      Video.countDocuments(),
      Reel.countDocuments(),
      MandiRate.countDocuments(),
      User.countDocuments(),
      SecurityLog.countDocuments()
    ]);

    // Approximate storage estimation
    const estimatedDocBytes = (articlesCount * 2500) + (videosCount * 800) + (reelsCount * 600) + (mandiCount * 200) + (securityLogsCount * 400);
    const estimatedMB = Number((estimatedDocBytes / 1024 / 1024).toFixed(2));

    res.json({
      success: true,
      data: {
        collections: {
          articles: articlesCount,
          videos: videosCount,
          reels: reelsCount,
          mandiRates: mandiCount,
          users: usersCount,
          securityLogs: securityLogsCount
        },
        storage: {
          tier: 'MongoDB Atlas M0 (Free)',
          totalLimitMB: 512,
          estimatedUsedMB: estimatedMB,
          safeCapacityPercent: Math.min(100, Math.round((estimatedMB / 512) * 100))
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
