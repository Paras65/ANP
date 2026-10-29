import { State } from '../models/State.model.js';
import { District } from '../models/District.model.js';
import { Category } from '../models/Category.model.js';
import { logger } from '../utils/logger.js';

/**
 * High-Performance In-Memory Master Cache:
 * Eliminates 3 redundant DB round-trips (State, District, Category) on EVERY reader request.
 * Automatically refreshed every 10 minutes or invalidated upon mutations.
 */
export interface MasterCache {
  states: Map<string, any>;
  districts: any[];
  districtLookup: Map<string, any>;
  categories: any[];
  categoryLookup: Map<string, any>;
  lastFetched: number;
}

const masterCache: MasterCache = {
  states: new Map(),
  districts: [],
  districtLookup: new Map(),
  categories: [],
  categoryLookup: new Map(),
  lastFetched: 0
};

const MASTER_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function getMasterData(): Promise<MasterCache> {
  const now = Date.now();
  if (masterCache.lastFetched && now - masterCache.lastFetched < MASTER_CACHE_TTL) {
    return masterCache;
  }

  try {
    const [states, districts, categories] = await Promise.all([
      State.find().lean(),
      District.find().populate('stateId').lean(),
      Category.find().lean()
    ]);

    masterCache.states.clear();
    states.forEach((s: any) => {
      masterCache.states.set(s.slug?.toLowerCase(), s);
      masterCache.states.set(s._id.toString(), s);
    });

    masterCache.districts = districts;
    masterCache.districtLookup.clear();
    districts.forEach((d: any) => {
      if (d.slug) masterCache.districtLookup.set(d.slug.toLowerCase(), d);
      if (d.name) masterCache.districtLookup.set(d.name.toLowerCase(), d);
      if (d.nameHindi) masterCache.districtLookup.set(d.nameHindi.toLowerCase(), d);
      masterCache.districtLookup.set(d._id.toString(), d);
    });

    masterCache.categories = categories;
    masterCache.categoryLookup.clear();
    categories.forEach((c: any) => {
      if (c.slug) masterCache.categoryLookup.set(c.slug.toLowerCase(), c);
      if (c.name) masterCache.categoryLookup.set(c.name.toLowerCase(), c);
      masterCache.categoryLookup.set(c._id.toString(), c);
    });

    masterCache.lastFetched = now;
  } catch (err: any) {
    logger.warn('Failed to refresh master data cache:', err.message);
  }

  return masterCache;
}

export function invalidateMasterCache(): void {
  masterCache.lastFetched = 0;
}
