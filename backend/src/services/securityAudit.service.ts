import { SecurityLog, SecuritySeverity } from '../models/SecurityLog.model.js';
import { logger } from '../utils/logger.js';
import { redactSecretKeys } from '../utils/sanitize.js';
import mongoose from 'mongoose';

interface SecurityIncidentInput {
  eventType: string;
  severity?: SecuritySeverity;
  ip: string;
  userAgent?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  message: string;
  details?: string;
  blocked?: boolean;
}

// In-memory sliding window deduplication to prevent DB exhaustion attacks on SecurityLog itself!
const deduplicationCache = new Map<string, { timestamp: number; logId?: string; count: number }>();

// Cleanup deduplication cache every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of deduplicationCache.entries()) {
    if (now - val.timestamp > 5 * 60 * 1000) {
      deduplicationCache.delete(key);
    }
  }
}, 10 * 60 * 1000);

// Background Database Auto-Cleanup Routine:
// 1. Purges records older than 7 days
// 2. Hard caps total logs at 1,500 entries (prunes oldest overflow)
async function autoPruneOldLogs(): Promise<void> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await SecurityLog.deleteMany({ createdAt: { $lt: sevenDaysAgo } });

    const totalCount = await SecurityLog.countDocuments();
    if (totalCount > 1500) {
      const overflow = totalCount - 1500;
      const oldestDocs = await SecurityLog.find()
        .sort({ createdAt: 1 })
        .limit(overflow)
        .select('_id')
        .lean();
      if (oldestDocs.length > 0) {
        await SecurityLog.deleteMany({ _id: { $in: oldestDocs.map((d: any) => d._id) } });
      }
    }
  } catch (_err) {
    // Silent fail-safe: background cleanup never interrupts server execution
  }
}

// Initial prune 30 seconds after server boot, then every 1 hour
setTimeout(autoPruneOldLogs, 30 * 1000);
setInterval(autoPruneOldLogs, 60 * 60 * 1000);

/**
 * Asynchronously records security incidents in MongoDB Atlas.
 * Includes in-memory deduplication so rapid Burp/Postman flood loops
 * do NOT bloat the SecurityLog collection.
 */
export function recordSecurityIncident(input: SecurityIncidentInput): void {
  // Fire and forget via setImmediate so it NEVER blocks the main HTTP response thread
  setImmediate(async () => {
    try {
      const ip = (input.ip || 'unknown').slice(0, 64);
      const userAgent = (input.userAgent || 'unknown').slice(0, 150);
      const method = (input.method || 'GET').slice(0, 10);
      const path = (input.path || '/').slice(0, 200);
      const statusCode = input.statusCode || 400;
      const message = redactSecretKeys(input.message || 'Security alert').slice(0, 500);
      const details = input.details ? redactSecretKeys(input.details).slice(0, 200) : undefined;
      const severity: SecuritySeverity = input.severity || 'MEDIUM';
      const blocked = input.blocked !== undefined ? input.blocked : statusCode < 500;

      const dedupKey = `${ip}:${input.eventType}:${path}`;
      const now = Date.now();
      const existing = deduplicationCache.get(dedupKey);

      // If same threat from same IP happened within 60 seconds, increment repeatCount instead of creating new document
      if (existing && (now - existing.timestamp < 60 * 1000) && existing.logId) {
        existing.count++;
        existing.timestamp = now;
        await SecurityLog.findByIdAndUpdate(existing.logId, {
          $inc: { repeatCount: 1 },
          $set: { 
            message, 
            statusCode,
            ...(details ? { details } : {}) 
          }
        }).catch(() => {});
        return;
      }

      // Create new incident document in MongoDB Atlas
      const created = await SecurityLog.create({
        eventType: input.eventType,
        severity,
        ip,
        userAgent,
        method,
        path,
        statusCode,
        message,
        details,
        repeatCount: 1,
        blocked,
        createdAt: new Date()
      });

      deduplicationCache.set(dedupKey, {
        timestamp: now,
        logId: created._id.toString(),
        count: 1
      });
    } catch (err: any) {
      logger.error('Failed to persist security incident to MongoDB:', err?.message);
    }
  });
}

/**
 * Fetches comprehensive security analytics and telemetry for the Super Admin portal.
 */
export async function getSecurityDashboardStats() {
  const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    totalBlocked,
    last24hCount,
    topAttackerIPs,
    threatBreakdown,
    recentLogs
  ] = await Promise.all([
    // 1. Total incidents in DB
    SecurityLog.countDocuments(),

    // 2. Incidents in past 24 hours
    SecurityLog.countDocuments({ createdAt: { $gte: past24h } }),

    // 3. Top 5 attacking IPs
    SecurityLog.aggregate([
      { $group: { _id: '$ip', count: { $sum: '$repeatCount' }, lastSeen: { $max: '$createdAt' } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]),

    // 4. Breakdown by event type
    SecurityLog.aggregate([
      { $group: { _id: '$eventType', count: { $sum: '$repeatCount' } } },
      { $sort: { count: -1 } }
    ]),

    // 5. Recent 50 incidents
    SecurityLog.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
  ]);

  // System Health Telemetry
  const mem = process.memoryUsage();
  const systemStatus = {
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsageMB: {
      rss: Math.round(mem.rss / 1024 / 1024),
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024)
    },
    dbStatus: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
    nodeEnv: process.env.NODE_ENV || 'development',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
  };

  return {
    totalBlocked,
    last24hCount,
    topAttackerIPs: topAttackerIPs.map(item => ({ ip: item._id, count: item.count, lastSeen: item.lastSeen })),
    threatBreakdown: threatBreakdown.map(item => ({ eventType: item._id, count: item.count })),
    recentLogs: recentLogs.map((log: any) => ({
      _id: log._id.toString(),
      eventType: log.eventType,
      severity: log.severity,
      ip: log.ip,
      userAgent: log.userAgent,
      method: log.method,
      path: log.path,
      statusCode: log.statusCode,
      message: log.message,
      details: log.details,
      repeatCount: log.repeatCount || 1,
      blocked: log.blocked,
      createdAt: log.createdAt
    })),
    systemStatus
  };
}

/**
 * Super Admin action: Clears all security incident logs from MongoDB Atlas.
 */
export async function clearSecurityLogs(): Promise<number> {
  const result = await SecurityLog.deleteMany({});
  deduplicationCache.clear();
  return result.deletedCount || 0;
}

