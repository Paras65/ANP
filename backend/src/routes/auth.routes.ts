import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { requireAdminAuth } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimiter.middleware.js';
import { TwoFactorService } from '../services/twoFactor.service.js';
import { 
  recordSecurityIncident, 
  getSecurityDashboardStats, 
  clearSecurityLogs 
} from '../services/securityAudit.service.js';

const router = Router();
const PIN_SALT = process.env.JWT_SECRET || 'anp_editorial_desk_pin_hmac_salt_2026';

function generateAdminJwt(): string {
  const secret = process.env.JWT_SECRET || 'anp_editorial_desk_pin_hmac_salt_2026';
  return jwt.sign(
    { role: 'admin', desk: 'editorial' },
    secret,
    { expiresIn: '7d' }
  );
}

// 1. GET /api/auth/pin-status - Check if ADMIN_PIN is present in server environment
router.get('/auth/pin-status', async (_req: Request, res: Response) => {
  const isConfigured = Boolean(process.env.ADMIN_PIN && process.env.ADMIN_PIN.trim());
  res.json({ success: true, isConfigured });
});

// 2. POST /api/auth/verify-admin - Cryptographic Verification STRICTLY against process.env.ADMIN_PIN
router.post('/auth/verify-admin', authLimiter, async (req: Request, res: Response) => {
  try {
    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ success: false, message: 'पिन आवश्यक है' });
    }

    const expectedPin = process.env.ADMIN_PIN?.trim();

    if (!expectedPin) {
      return res.status(503).json({ 
        success: false, 
        message: 'सर्वर सुरक्षा अलर्ट: एडमिन पिन सर्वर एनवायरनमेंट (ADMIN_PIN) में सेट नहीं है।' 
      });
    }

    // Constant-time cryptographic comparison (Defeats timing attacks, validates ONLY from ENV)
    const bufInput = Buffer.from(crypto.createHmac('sha256', PIN_SALT).update(String(pin).trim()).digest('hex'));
    const bufExpected = Buffer.from(crypto.createHmac('sha256', PIN_SALT).update(expectedPin).digest('hex'));
    const isMatch = bufInput.length === bufExpected.length && crypto.timingSafeEqual(bufInput, bufExpected);

    if (isMatch) {
      // Check if 2FA is active on Editorial Admin (DRY TwoFactorService)
      const twoFactorStatus = await TwoFactorService.getStatus('admin_2fa');
      if (twoFactorStatus.enabled) {
        const tempToken = jwt.sign(
          { role: 'admin_temp_2fa', desk: 'editorial' },
          PIN_SALT,
          { expiresIn: '5m' }
        );
        return res.json({
          success: true,
          require2FA: true,
          tempToken,
          message: 'पिन सत्यापित। कृपया 6-अंकों का 2FA या बैकअप कोड दर्ज करें।'
        });
      }

      return res.json({ 
        success: true, 
        message: 'प्रमाणीकरण सफल (ENV Validated)',
        token: generateAdminJwt()
      });
    } else {
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
      const userAgent = String(req.headers['user-agent'] || 'unknown').slice(0, 120);

      recordSecurityIncident({
        eventType: 'AUTH_PIN_FAILED',
        severity: 'HIGH',
        ip: clientIp,
        userAgent,
        method: 'POST',
        path: '/api/auth/verify-admin',
        statusCode: 401,
        message: 'गलत एडमिन पिन दर्ज किया गया (Invalid PIN attempt)'
      });

      return res.status(401).json({ success: false, message: 'गलत एडमिन पिन दर्ज किया गया' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. POST /api/auth/verify-2fa - Admin Desk 2FA Verification (TOTP or Single-Use Emergency Code)
router.post('/auth/verify-2fa', authLimiter, async (req: Request, res: Response) => {
  try {
    const { tempToken, code } = req.body;
    if (!tempToken || !code) {
      return res.status(400).json({ success: false, message: 'टोकन और 2FA कोड आवश्यक हैं' });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, PIN_SALT);
      if (decoded.role !== 'admin_temp_2fa') throw new Error('Invalid token');
    } catch {
      return res.status(401).json({ success: false, message: '2FA सत्र समाप्त या अमान्य है। कृपया पुनः पिन दर्ज करें।' });
    }

    const verifyResult = await TwoFactorService.verifyCodeOrBackup('admin_2fa', code);
    if (!verifyResult.valid) {
      return res.status(401).json({ success: false, message: verifyResult.message || 'अमान्य 2FA कोड या समाप्त बैकअप कोड' });
    }

    if (verifyResult.isBackupCode) {
      recordSecurityIncident({
        eventType: 'EMERGENCY_BACKUP_CODE_USED',
        severity: 'MEDIUM',
        ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown',
        message: `एडमिन द्वारा आपातकालीन बैकअप कोड का उपयोग किया गया। शेष कोड: ${verifyResult.remainingBackupCodes}`
      });

      return res.json({
        success: true,
        message: `आपातकालीन बैकअप कोड स्वीकृत! शेष बैकअप कोड: ${verifyResult.remainingBackupCodes}`,
        token: generateAdminJwt(),
        backupCodeUsed: true,
        remainingBackupCodes: verifyResult.remainingBackupCodes
      });
    }

    return res.json({
      success: true,
      message: '2FA सत्यापन सफल! स्वागत है।',
      token: generateAdminJwt()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. GET /api/admin/2fa/status - Get current 2FA status for Editorial Admin
router.get('/admin/2fa/status', requireAdminAuth, async (_req: Request, res: Response) => {
  try {
    const status = await TwoFactorService.getStatus('admin_2fa');
    res.json({
      success: true,
      data: status
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. POST /api/admin/2fa/setup - Generate fresh Base32 TOTP secret & 5 Emergency Offline Recovery Codes for Editorial Admin
router.post('/admin/2fa/setup', requireAdminAuth, async (_req: Request, res: Response) => {
  try {
    const data = await TwoFactorService.startSetup('admin_2fa_pending', 'admin_editorial');
    res.json({
      success: true,
      data
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. POST /api/admin/2fa/verify-and-enable - Verify test code & enable 2FA for Editorial Admin
router.post('/admin/2fa/verify-and-enable', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'सत्यापन कोड आवश्यक है' });
    }

    const isValid = await TwoFactorService.verifyAndEnable('admin_2fa', 'admin_2fa_pending', code);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'अमान्य 6-अंकों का कोड। कृपया Authenticator ऐप का ताज़ा कोड दर्ज करें।' });
    }

    recordSecurityIncident({
      eventType: 'TWO_FACTOR_ENABLED',
      severity: 'HIGH',
      ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown',
      message: 'एडमिन द्वारा न्यूज़ पोर्टल खाते के लिए 2FA प्रमाणीकरण सक्रिय किया गया (RFC 6238 TOTP)'
    });

    res.json({ success: true, message: '🎉 2-फैक्टर ऑथेंटिकेशन (2FA) एडमिन खाते के लिए सफलतापूर्वक सक्रिय हो गया!' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 7. POST /api/admin/2fa/disable - Disable 2FA for Editorial Admin
router.post('/admin/2fa/disable', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    await TwoFactorService.disable('admin_2fa');

    recordSecurityIncident({
      eventType: 'TWO_FACTOR_DISABLED',
      severity: 'HIGH',
      ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown',
      message: 'एडमिन द्वारा 2FA प्रमाणीकरण निष्क्रिय किया गया'
    });

    res.json({ success: true, message: 'एडमिन 2FA सुरक्षा सफलतापूर्वक निष्क्रिय कर दी गई।' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. GET /api/admin/security/stats - Super Admin Security Telemetry & Live Incidents
router.get('/admin/security/stats', requireAdminAuth, async (_req: Request, res: Response) => {
  try {
    const stats = await getSecurityDashboardStats();
    res.json({ success: true, data: stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. DELETE /api/admin/security/logs - Super Admin Flush Security Incident Logs
router.delete('/admin/security/logs', requireAdminAuth, async (_req: Request, res: Response) => {
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

// 10. POST /api/admin/security/test-probe - Super Admin Security Probe Simulation
router.post('/admin/security/test-probe', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    const userAgent = String(req.headers['user-agent'] || 'unknown').slice(0, 120);

    recordSecurityIncident({
      eventType: 'SECURITY_AUDIT_PROBE',
      severity: 'LOW',
      ip: clientIp,
      userAgent,
      method: 'POST',
      path: '/api/admin/security/test-probe',
      statusCode: 200,
      message: 'एडमिन द्वारा सुरक्षा मॉनिटर टेस्ट प्रोब सफलतापूर्वक निष्पादित (Admin Security Test Probe)'
    });

    res.json({ success: true, message: 'सुरक्षा टेस्ट प्रोब रिकॉर्ड हो गया! नीचे सूची रिफ्रेश करें।' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
