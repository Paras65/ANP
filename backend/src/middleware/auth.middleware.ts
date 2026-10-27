import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Setting } from '../models/Setting.model.js';

export interface AdminAuthRequest extends Request {
  adminUser?: {
    role: string;
    desk: string;
    iat?: number;
  };
}

/**
 * Robust JWT Authentication Middleware for Editorial Desk
 * Defends against:
 * 1. None-algorithm bypass (strict HS256 enforcement)
 * 2. Signature forgery & tampering
 * 3. Expired tokens
 * 4. Stale tokens after PIN change (instant revocation check against DB)
 */
export async function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: एडमिन प्रमाणीकरण टोकन (JWT) आवश्यक है'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: अमान्य टोकन प्रारूप'
      });
    }

    const secret = process.env.JWT_SECRET || 'anp_editorial_desk_pin_hmac_salt_2026';

    // Strictly enforce HS256 algorithm to defeat 'none' algorithm and signature confusion attacks
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as {
      role: string;
      desk: string;
      iat?: number;
    };

    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: इस कार्य हेतु एडमिन अधिकार आवश्यक हैं'
      });
    }

    // Instant Token Revocation Check:
    // If the Admin PIN was changed after this token was issued, immediately invalidate it
    if (decoded.iat) {
      const pinSetting = await Setting.findOne({ key: 'admin_pin' });
      if (pinSetting && pinSetting.updatedAt) {
        const pinUpdatedAtSeconds = Math.floor(new Date(pinSetting.updatedAt).getTime() / 1000);
        // 2-second grace margin for server clock drift
        if (decoded.iat < pinUpdatedAtSeconds - 2) {
          return res.status(401).json({
            success: false,
            revoked: true,
            error: 'Session Expired: एडमिन पिन बदल दिया गया है, कृपया नए पिन से पुनः लॉगिन करें'
          });
        }
      }
    }

    (req as AdminAuthRequest).adminUser = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        expired: true,
        error: 'Session Expired: आपका एडमिन सत्र समाप्त हो गया है, कृपया पुनः लॉगिन करें'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: अमान्य या छेड़छाड़ किया गया टोकन'
    });
  }
}
