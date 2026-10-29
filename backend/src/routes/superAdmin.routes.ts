import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Article } from '../models/Article.model.js';
import { Video } from '../models/Video.model.js';
import { Reel } from '../models/Reel.model.js';
import { MandiRate } from '../models/MandiRate.model.js';
import { User } from '../models/User.model.js';
import { SecurityLog } from '../models/SecurityLog.model.js';
import { Setting } from '../models/Setting.model.js';
import { BackupSnapshot } from '../models/BackupSnapshot.model.js';
import { authLimiter } from '../middleware/rateLimiter.middleware.js';
import { requireSuperAdminAuth } from '../middleware/auth.middleware.js';
import { 
  getSecurityDashboardStats, 
  clearSecurityLogs, 
  recordSecurityIncident 
} from '../services/securityAudit.service.js';
import { 
  generateBase32Secret, 
  generateTOTP, 
  verifyTOTP, 
  getOtpAuthUrl, 
  generateEmergencyBackupCodes, 
  verifyAndConsumeBackupCode 
} from '../utils/totp.js';
import { 
  generateFullDatabaseSnapshot, 
  createInternalSnapshot, 
  restoreDatabaseFromSnapshot 
} from '../services/backup.service.js';

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
      // Check if 2FA is active on Super Admin
      const twoFactorSetting = await Setting.findOne({ key: 'super_admin_2fa' }).lean();
      if (twoFactorSetting?.value?.enabled && twoFactorSetting.value.secret) {
        const tempToken = jwt.sign(
          { role: 'super_admin_temp_2fa', desk: 'security_governance' },
          PIN_SALT,
          { expiresIn: '5m' }
        );
        return res.json({
          success: true,
          require2FA: true,
          tempToken,
          message: 'मास्टर पिन सत्यापित। कृपया 6-अंकों का 2FA (Google Authenticator) कोड या आपातकालीन बैकअप कोड दर्ज करें।'
        });
      }

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

// 2b. POST /api/super-admin/auth/verify-2fa - Step 2 TOTP / Emergency Backup Code Verification
router.post('/auth/verify-2fa', authLimiter, async (req: Request, res: Response) => {
  try {
    const { tempToken, code } = req.body;
    if (!tempToken || !code) {
      return res.status(400).json({ success: false, message: 'टोकन और 2FA कोड आवश्यक हैं' });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, PIN_SALT);
      if (decoded.role !== 'super_admin_temp_2fa') throw new Error('Invalid token');
    } catch {
      return res.status(401).json({ success: false, message: '2FA सत्र समाप्त या अमान्य है। कृपया पुनः मास्टर पिन दर्ज करें।' });
    }

    const twoFactorSetting = await Setting.findOne({ key: 'super_admin_2fa' });
    if (!twoFactorSetting?.value?.enabled || !twoFactorSetting.value.secret) {
      return res.status(400).json({ success: false, message: '2FA सक्षम नहीं है' });
    }

    const inputCode = String(code).trim();

    // 1. Verify standard 6-digit TOTP (Google / Microsoft Authenticator)
    const isTotpValid = verifyTOTP(inputCode, twoFactorSetting.value.secret);
    if (isTotpValid) {
      return res.json({
        success: true,
        message: '2FA सत्यापन सफल! स्वागत है।',
        token: generateSuperAdminJwt()
      });
    }

    // 2. Check Emergency Single-Use Backup Recovery Code
    const hashedCodes = twoFactorSetting.value.hashedBackupCodes || [];
    const usedIndex = verifyAndConsumeBackupCode(inputCode, hashedCodes);
    if (usedIndex !== -1) {
      hashedCodes.splice(usedIndex, 1);
      twoFactorSetting.value.hashedBackupCodes = hashedCodes;
      twoFactorSetting.markModified('value');
      await twoFactorSetting.save();

      recordSecurityIncident({
        eventType: 'EMERGENCY_BACKUP_CODE_USED',
        severity: 'MEDIUM',
        ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown',
        message: `सुपर एडमिन द्वारा आपातकालीन बैकअप कोड का उपयोग किया गया। शेष कोड: ${hashedCodes.length}`
      });

      return res.json({
        success: true,
        message: `आपातकालीन बैकअप कोड स्वीकृत! शेष बैकअप कोड: ${hashedCodes.length}`,
        token: generateSuperAdminJwt(),
        backupCodeUsed: true,
        remainingBackupCodes: hashedCodes.length
      });
    }

    return res.status(401).json({ success: false, message: 'अमान्य 2FA कोड या समाप्त बैकअप कोड' });
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

// 7. GET /api/super-admin/2fa/status - Get current 2FA status & remaining recovery codes
router.get('/2fa/status', requireSuperAdminAuth, async (_req: Request, res: Response) => {
  try {
    const setting = await Setting.findOne({ key: 'super_admin_2fa' }).lean();
    res.json({
      success: true,
      data: {
        enabled: Boolean(setting?.value?.enabled),
        remainingBackupCodes: setting?.value?.hashedBackupCodes?.length || 0,
        enabledAt: setting?.value?.enabledAt || null
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. POST /api/super-admin/2fa/setup - Generate fresh Base32 TOTP secret & 5 Emergency Offline Recovery Codes
router.post('/2fa/setup', requireSuperAdminAuth, async (_req: Request, res: Response) => {
  try {
    const secret = generateBase32Secret(20);
    const otpAuthUrl = getOtpAuthUrl(secret, 'super_admin', 'AmbitionNews');
    const { rawCodes, hashedCodes } = generateEmergencyBackupCodes(5);

    // Save pending setup in setting
    await Setting.findOneAndUpdate(
      { key: 'super_admin_2fa_pending' },
      { 
        key: 'super_admin_2fa_pending', 
        value: { secret, hashedBackupCodes: hashedCodes, createdAt: new Date() } 
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: {
        secret,
        otpAuthUrl,
        emergencyBackupCodes: rawCodes
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. POST /api/super-admin/2fa/verify-and-enable - Verify test code & enable 2FA
router.post('/2fa/verify-and-enable', requireSuperAdminAuth, async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'सत्यापन कोड आवश्यक है' });
    }

    const pending = await Setting.findOne({ key: 'super_admin_2fa_pending' });
    if (!pending?.value?.secret) {
      return res.status(400).json({ success: false, message: 'कोई लंबित 2FA सेटअप नहीं मिला' });
    }

    const isValid = verifyTOTP(String(code), pending.value.secret);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'अमान्य 6-अंकों का कोड। कृपया Authenticator ऐप का ताज़ा कोड दर्ज करें।' });
    }

    // Activate 2FA permanently
    await Setting.findOneAndUpdate(
      { key: 'super_admin_2fa' },
      {
        key: 'super_admin_2fa',
        value: {
          enabled: true,
          secret: pending.value.secret,
          hashedBackupCodes: pending.value.hashedBackupCodes || [],
          enabledAt: new Date()
        }
      },
      { upsert: true }
    );

    await Setting.deleteOne({ key: 'super_admin_2fa_pending' });

    recordSecurityIncident({
      eventType: 'TWO_FACTOR_ENABLED',
      severity: 'CRITICAL',
      ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown',
      message: 'सुपर एडमिन द्वारा बैंक-ग्रेड 2FA प्रमाणीकरण सक्रिय किया गया (RFC 6238 TOTP)'
    });

    res.json({ success: true, message: '🎉 2-फैक्टर ऑथेंटिकेशन (2FA) सफलतापूर्वक सक्रिय हो गया!' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. POST /api/super-admin/2fa/disable - Disable 2FA
router.post('/2fa/disable', requireSuperAdminAuth, async (req: Request, res: Response) => {
  try {
    await Setting.findOneAndUpdate(
      { key: 'super_admin_2fa' },
      { key: 'super_admin_2fa', value: { enabled: false } },
      { upsert: true }
    );

    recordSecurityIncident({
      eventType: 'TWO_FACTOR_DISABLED',
      severity: 'CRITICAL',
      ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown',
      message: 'सुपर एडमिन द्वारा 2FA सुरक्षा निष्क्रिय की गई'
    });

    res.json({ success: true, message: '2FA सुरक्षा सफलतापूर्वक निष्क्रिय कर दी गई।' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. GET /api/super-admin/backup/export - Export Instant Full Database Snapshot JSON
router.get('/backup/export', requireSuperAdminAuth, async (_req: Request, res: Response) => {
  try {
    const snapshot = await generateFullDatabaseSnapshot();
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `anp-database-backup-${dateStr}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(snapshot, null, 2));
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. POST /api/super-admin/backup/restore - Restore Full Database Snapshot from JSON payload
router.post('/backup/restore', requireSuperAdminAuth, async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload || payload.app !== 'Ambition News Portal' || !payload.data) {
      return res.status(400).json({ 
        success: false, 
        message: 'अमान्य बैकअप फ़ाइल: यह Ambition News Portal का वैध स्नैपशॉट नहीं है।' 
      });
    }

    const stats = await restoreDatabaseFromSnapshot(payload);
    res.json({
      success: true,
      message: 'डेटाबेस सफलतापूर्वक स्नैपशॉट से पुनर्स्थापित (Restore) हो गया!',
      data: stats
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 13. GET /api/super-admin/backup/snapshots - List Automated & Manual Internal Snapshots
router.get('/backup/snapshots', requireSuperAdminAuth, async (_req: Request, res: Response) => {
  try {
    const snapshots = await BackupSnapshot.find()
      .select('name type counts totalRecords sizeBytes createdBy createdAt')
      .sort({ createdAt: -1 })
      .limit(14)
      .lean();

    res.json({ success: true, count: snapshots.length, data: snapshots });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 14. POST /api/super-admin/backup/snapshots/run - Trigger Instant Internal Snapshot Save
router.post('/backup/snapshots/run', requireSuperAdminAuth, async (_req: Request, res: Response) => {
  try {
    const today = new Date().toLocaleDateString('hi-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    const snapshot = await createInternalSnapshot(`मैन्युअल स्नैपशॉट (${today})`, 'MANUAL_ON_DEMAND', 'super_admin');

    res.json({
      success: true,
      message: 'डेटाबेस स्नैपशॉट सफलतापूर्वक आंतरिक रूप से संग्रहीत हो गया!',
      data: {
        _id: snapshot._id,
        name: snapshot.name,
        totalRecords: snapshot.totalRecords,
        counts: snapshot.counts,
        sizeBytes: snapshot.sizeBytes,
        createdAt: snapshot.createdAt
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 15. POST /api/super-admin/backup/snapshots/:id/restore - Restore specific internal snapshot by ID
router.post('/backup/snapshots/:id/restore', requireSuperAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await BackupSnapshot.findById(id);
    if (!doc || !doc.payloadJson) {
      return res.status(404).json({ success: false, message: 'स्नैपशॉट नहीं मिला' });
    }

    const payload = JSON.parse(doc.payloadJson);
    const stats = await restoreDatabaseFromSnapshot(payload);

    res.json({
      success: true,
      message: `स्नैपशॉट '${doc.name}' से डेटाबेस सफलतापूर्वक पुनर्स्थापित हो गया!`,
      data: stats
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
