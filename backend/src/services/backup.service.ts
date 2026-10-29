import { Article } from '../models/Article.model.js';
import { MandiRate } from '../models/MandiRate.model.js';
import { User } from '../models/User.model.js';
import { Video } from '../models/Video.model.js';
import { Reel } from '../models/Reel.model.js';
import { Advertisement } from '../models/Advertisement.model.js';
import { Setting } from '../models/Setting.model.js';
import { Category } from '../models/Category.model.js';
import { District } from '../models/District.model.js';
import { State } from '../models/State.model.js';
import { BackupSnapshot } from '../models/BackupSnapshot.model.js';
import { logger } from '../utils/logger.js';
import { recordSecurityIncident } from './securityAudit.service.js';

export interface DatabaseSnapshotPayload {
  app: string;
  version: string;
  exportedAt: string;
  counts: {
    articles: number;
    mandiRates: number;
    reporters: number;
    videos: number;
    reels: number;
    advertisements: number;
    settings: number;
  };
  data: {
    articles: any[];
    mandiRates: any[];
    reporters: any[];
    videos: any[];
    reels: any[];
    advertisements: any[];
    settings: any[];
  };
}

/**
 * Creates a full in-memory snapshot of all core database collections
 */
export async function generateFullDatabaseSnapshot(): Promise<DatabaseSnapshotPayload> {
  const [
    articles,
    mandiRates,
    reporters,
    videos,
    reels,
    advertisements,
    settings
  ] = await Promise.all([
    Article.find().lean(),
    MandiRate.find().lean(),
    User.find().lean(),
    Video.find().lean(),
    Reel.find().lean(),
    Advertisement.find().lean(),
    Setting.find().lean()
  ]);

  const snapshot: DatabaseSnapshotPayload = {
    app: 'Ambition News Portal',
    version: '2.0',
    exportedAt: new Date().toISOString(),
    counts: {
      articles: articles.length,
      mandiRates: mandiRates.length,
      reporters: reporters.length,
      videos: videos.length,
      reels: reels.length,
      advertisements: advertisements.length,
      settings: settings.length
    },
    data: {
      articles,
      mandiRates,
      reporters,
      videos,
      reels,
      advertisements,
      settings
    }
  };

  return snapshot;
}

/**
 * Creates and stores an internal backup snapshot document in MongoDB Atlas
 */
export async function createInternalSnapshot(
  name: string,
  type: 'AUTOMATED_DAILY' | 'MANUAL_ON_DEMAND' | 'PRE_MIGRATION' = 'MANUAL_ON_DEMAND',
  createdBy: string = 'super_admin'
) {
  const snapshot = await generateFullDatabaseSnapshot();
  const serialized = JSON.stringify(snapshot);
  const sizeBytes = Buffer.byteLength(serialized, 'utf8');

  const totalRecords = 
    snapshot.counts.articles +
    snapshot.counts.mandiRates +
    snapshot.counts.reporters +
    snapshot.counts.videos +
    snapshot.counts.reels +
    snapshot.counts.advertisements;

  const doc = await BackupSnapshot.create({
    name,
    type,
    counts: {
      articles: snapshot.counts.articles,
      mandiRates: snapshot.counts.mandiRates,
      reporters: snapshot.counts.reporters,
      videos: snapshot.counts.videos,
      reels: snapshot.counts.reels,
      advertisements: snapshot.counts.advertisements
    },
    totalRecords,
    payloadJson: serialized,
    sizeBytes,
    createdBy,
    createdAt: new Date()
  });

  return doc;
}

/**
 * Restores a snapshot into MongoDB Atlas safely (Upsert without dropping indexes)
 */
export async function restoreDatabaseFromSnapshot(payload: DatabaseSnapshotPayload): Promise<{
  restoredArticles: number;
  restoredMandi: number;
  restoredReporters: number;
  restoredVideos: number;
  restoredReels: number;
  restoredAds: number;
}> {
  if (payload.app !== 'Ambition News Portal' || !payload.data) {
    throw new Error('अमान्य बैकअप फ़ाइल: यह Ambition News Portal का वैध स्नैपशॉट नहीं है।');
  }

  let restoredArticles = 0;
  let restoredMandi = 0;
  let restoredReporters = 0;
  let restoredVideos = 0;
  let restoredReels = 0;
  let restoredAds = 0;

  // 1. Restore Articles
  if (Array.isArray(payload.data.articles) && payload.data.articles.length > 0) {
    for (const art of payload.data.articles) {
      if (!art._id || !art.title) continue;
      await Article.findByIdAndUpdate(art._id, art, { upsert: true });
      restoredArticles++;
    }
  }

  // 2. Restore Mandi Rates
  if (Array.isArray(payload.data.mandiRates) && payload.data.mandiRates.length > 0) {
    for (const m of payload.data.mandiRates) {
      if (!m._id || !m.cropName) continue;
      await MandiRate.findByIdAndUpdate(m._id, m, { upsert: true });
      restoredMandi++;
    }
  }

  // 3. Restore Reporters
  if (Array.isArray(payload.data.reporters) && payload.data.reporters.length > 0) {
    for (const r of payload.data.reporters) {
      if (!r._id || !r.name) continue;
      await User.findByIdAndUpdate(r._id, r, { upsert: true });
      restoredReporters++;
    }
  }

  // 4. Restore Videos
  if (Array.isArray(payload.data.videos) && payload.data.videos.length > 0) {
    for (const v of payload.data.videos) {
      if (!v._id || !v.title) continue;
      await Video.findByIdAndUpdate(v._id, v, { upsert: true });
      restoredVideos++;
    }
  }

  // 5. Restore Reels
  if (Array.isArray(payload.data.reels) && payload.data.reels.length > 0) {
    for (const r of payload.data.reels) {
      if (!r._id || !r.caption) continue;
      await Reel.findByIdAndUpdate(r._id, r, { upsert: true });
      restoredReels++;
    }
  }

  // 6. Restore Ads
  if (Array.isArray(payload.data.advertisements) && payload.data.advertisements.length > 0) {
    for (const ad of payload.data.advertisements) {
      if (!ad._id || !ad.title) continue;
      await Advertisement.findByIdAndUpdate(ad._id, ad, { upsert: true });
      restoredAds++;
    }
  }

  // Record forensic security log
  recordSecurityIncident({
    eventType: 'DATABASE_RESTORE_EXECUTED',
    severity: 'CRITICAL',
    ip: '127.0.0.1',
    message: `डेटाबेस स्नैपशॉट सफलतापूर्वक पुनर्स्थापित किया गया: ${restoredArticles} खबरें, ${restoredMandi} मंडी भाव, ${restoredReporters} रिपोर्टर्स`
  });

  return {
    restoredArticles,
    restoredMandi,
    restoredReporters,
    restoredVideos,
    restoredReels,
    restoredAds
  };
}

/**
 * Daily Automated Background Snapshot Routine
 * Runs daily at midnight / 24 hour interval, keeps rolling 7 days.
 */
export function initAutomatedDailyBackupScheduler(): void {
  // First run after 2 minutes of boot, then every 24 hours
  setTimeout(async () => {
    try {
      const todayDate = new Date().toLocaleDateString('hi-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      await createInternalSnapshot(`दैनिक ऑटो-स्नैपशॉट (${todayDate})`, 'AUTOMATED_DAILY', 'system_scheduler');
      logger.info('🛡️ [BACKUP_SYSTEM] Daily automated database snapshot created successfully.');
    } catch (err: any) {
      logger.warn('⚠️ [BACKUP_SYSTEM] Auto backup failed:', err?.message);
    }
  }, 2 * 60 * 1000);

  // Every 24 hours
  setInterval(async () => {
    try {
      const todayDate = new Date().toLocaleDateString('hi-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      await createInternalSnapshot(`दैनिक ऑटो-स्नैपशॉट (${todayDate})`, 'AUTOMATED_DAILY', 'system_scheduler');
      logger.info('🛡️ [BACKUP_SYSTEM] Daily automated database snapshot created successfully.');
    } catch (err: any) {
      logger.warn('⚠️ [BACKUP_SYSTEM] Auto backup failed:', err?.message);
    }
  }, 24 * 60 * 60 * 1000);
}
