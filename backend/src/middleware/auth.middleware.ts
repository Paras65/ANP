import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AdminAuthRequest extends Request {
  adminUser?: {
    role: string;
    desk: string;
    iat?: number;
  };
}

export interface SuperAdminAuthRequest extends Request {
  superAdminUser?: {
    role: string;
    level: string;
    iat?: number;
  };
}

/**
 * Robust JWT Authentication Middleware for Editorial Desk
 * Validates HS256 signed tokens for admin or super_admin
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

    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as {
      role: string;
      desk?: string;
      iat?: number;
    };

    // Both 'admin' and 'super_admin' can access regular admin routes
    if (decoded.role !== 'admin' && decoded.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: इस कार्य हेतु एडमिन अधिकार आवश्यक हैं'
      });
    }

    (req as AdminAuthRequest).adminUser = {
      role: decoded.role,
      desk: decoded.desk || 'editorial',
      iat: decoded.iat
    };
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

/**
 * Strict Super Admin / Root Privilege Authorization Middleware
 * Disallows regular editorial admins from accessing security governance and telemetry.
 */
export async function requireSuperAdminAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: सुपर एडमिन प्रमाणीकरण टोकन (JWT) आवश्यक है'
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

    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as {
      role: string;
      level?: string;
      iat?: number;
    };

    if (decoded.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: इस कार्य हेतु सुपर एडमिन (Root) विशेषाधिकार आवश्यक हैं'
      });
    }

    (req as SuperAdminAuthRequest).superAdminUser = {
      role: decoded.role,
      level: decoded.level || 'root',
      iat: decoded.iat
    };
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        expired: true,
        error: 'Session Expired: सुपर एडमिन सत्र समाप्त हो गया है'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: अमान्य सुपर एडमिन टोकन'
    });
  }
}
