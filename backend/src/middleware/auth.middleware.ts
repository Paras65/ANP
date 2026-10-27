import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { recordSecurityIncident } from '../services/securityAudit.service.js';

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
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  const userAgent = String(req.headers['user-agent'] || 'unknown').slice(0, 120);

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      recordSecurityIncident({
        eventType: 'UNAUTHORIZED_ACCESS',
        severity: 'MEDIUM',
        ip: clientIp,
        userAgent,
        method: req.method,
        path: req.originalUrl,
        statusCode: 401,
        message: 'एडमिन एंडपॉइंट पर बिना टोकन के अनधिकृत अनुरोध',
        blocked: true
      });
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: एडमिन प्रमाणीकरण टोकन (JWT) आवश्यक है'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      recordSecurityIncident({
        eventType: 'UNAUTHORIZED_ACCESS',
        severity: 'MEDIUM',
        ip: clientIp,
        userAgent,
        method: req.method,
        path: req.originalUrl,
        statusCode: 401,
        message: 'अमान्य टोकन प्रारूप (Empty Bearer token)',
        blocked: true
      });
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
      recordSecurityIncident({
        eventType: 'FORBIDDEN_ROLE_ACCESS',
        severity: 'HIGH',
        ip: clientIp,
        userAgent,
        method: req.method,
        path: req.originalUrl,
        statusCode: 403,
        message: `अपर्याप्त अधिकार: '${decoded.role}' एडमिन रूट एक्सेस करने का प्रयास कर रहा है`,
        blocked: true
      });
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
      recordSecurityIncident({
        eventType: 'TOKEN_EXPIRED_OR_INVALID',
        severity: 'LOW',
        ip: clientIp,
        userAgent,
        method: req.method,
        path: req.originalUrl,
        statusCode: 401,
        message: 'एडमिन सत्र समाप्त हो गया (TokenExpiredError)',
        blocked: true
      });
      return res.status(401).json({
        success: false,
        expired: true,
        error: 'Session Expired: आपका एडमिन सत्र समाप्त हो गया है, कृपया पुनः लॉगिन करें'
      });
    }

    recordSecurityIncident({
      eventType: 'UNAUTHORIZED_ACCESS',
      severity: 'HIGH',
      ip: clientIp,
      userAgent,
      method: req.method,
      path: req.originalUrl,
      statusCode: 401,
      message: 'अमान्य या छेड़छाड़ किया गया एडमिन JWT टोकन',
      blocked: true
    });
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
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  const userAgent = String(req.headers['user-agent'] || 'unknown').slice(0, 120);

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      recordSecurityIncident({
        eventType: 'SUPER_ADMIN_UNAUTHORIZED',
        severity: 'HIGH',
        ip: clientIp,
        userAgent,
        method: req.method,
        path: req.originalUrl,
        statusCode: 401,
        message: 'सुपर एडमिन एंडपॉइंट पर बिना मास्टर टोकन के अनधिकृत अनुरोध',
        blocked: true
      });
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: सुपर एडमिन प्रमाणीकरण टोकन (JWT) आवश्यक है'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      recordSecurityIncident({
        eventType: 'SUPER_ADMIN_UNAUTHORIZED',
        severity: 'HIGH',
        ip: clientIp,
        userAgent,
        method: req.method,
        path: req.originalUrl,
        statusCode: 401,
        message: 'अमान्य सुपर एडमिन टोकन प्रारूप (Empty Bearer)',
        blocked: true
      });
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
      recordSecurityIncident({
        eventType: 'SUPER_ADMIN_PRIVILEGE_VIOLATION',
        severity: 'CRITICAL',
        ip: clientIp,
        userAgent,
        method: req.method,
        path: req.originalUrl,
        statusCode: 403,
        message: `गैर-रूट उपयोगकर्ता '${decoded.role}' द्वारा सुपर एडमिन रूट पर अनाधिकृत प्रयास`,
        blocked: true
      });
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
      recordSecurityIncident({
        eventType: 'TOKEN_EXPIRED_OR_INVALID',
        severity: 'LOW',
        ip: clientIp,
        userAgent,
        method: req.method,
        path: req.originalUrl,
        statusCode: 401,
        message: 'सुपर एडमिन सत्र समाप्त हो गया (Session Expired)',
        blocked: true
      });
      return res.status(401).json({
        success: false,
        expired: true,
        error: 'Session Expired: सुपर एडमिन सत्र समाप्त हो गया है'
      });
    }

    recordSecurityIncident({
      eventType: 'SUPER_ADMIN_UNAUTHORIZED',
      severity: 'CRITICAL',
      ip: clientIp,
      userAgent,
      method: req.method,
      path: req.originalUrl,
      statusCode: 401,
      message: 'अमान्य या छेड़छाड़ किया गया सुपर एडमिन मास्टर टोकन',
      blocked: true
    });
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: अमान्य सुपर एडमिन टोकन'
    });
  }
}
