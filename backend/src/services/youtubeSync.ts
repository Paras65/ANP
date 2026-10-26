import https from 'https';

export interface SyncedYouTubeVideo {
  id: string;
  title: string;
  youtubeId: string;
  thumbnail: string;
  duration: string;
  views: string;
  timeAgo: string;
  category: string;
  youtubeUrl: string;
  publishedAt: string;
  isShort?: boolean;
}

// In-memory cache to prevent excessive requests
let cachedVideos: SyncedYouTubeVideo[] = [];
let lastCacheTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

// Helper to format ISO date into natural Hindi relative time
function formatHindiTimeAgo(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'अभी-अभी';
    if (diffMinutes < 60) return `${diffMinutes} मिनट पहले`;
    if (diffHours < 24) return `${diffHours} घंटे पहले`;
    if (diffDays === 1) return 'कल';
    if (diffDays < 30) return `${diffDays} दिन पहले`;
    return 'कुछ समय पहले';
  } catch {
    return 'ताज़ा';
  }
}

/**
 * Automatically fetches the latest videos from any YouTube Channel using official YouTube RSS Feed.
 * 100% Free, No API Key needed, Zero Quota limits.
 */
export async function fetchChannelVideos(channelId: string, forceRefresh = false): Promise<SyncedYouTubeVideo[]> {
  if (!channelId || !channelId.startsWith('UC')) {
    return cachedVideos;
  }

  // Return cache if valid
  if (!forceRefresh && cachedVideos.length > 0 && Date.now() - lastCacheTime < CACHE_TTL_MS) {
    return cachedVideos;
  }

  return new Promise((resolve) => {
    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        console.warn(`[YouTube Sync] Feed returned status code ${res.statusCode} for channel ${channelId}`);
        return resolve(cachedVideos);
      }

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const entries: SyncedYouTubeVideo[] = [];
          const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
          let match;

          while ((match = entryRegex.exec(data)) !== null) {
            const block = match[1];
            const idMatch = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
            const titleMatch = block.match(/<title>([^<]+)<\/title>/);
            const publishedMatch = block.match(/<published>([^<]+)<\/published>/);
            const thumbMatch = block.match(/<media:thumbnail[^>]+url="([^"]+)"/);

            if (idMatch && titleMatch) {
              const videoId = idMatch[1];
              const rawTitle = titleMatch[1]
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>');

              const publishedAt = publishedMatch ? publishedMatch[1] : new Date().toISOString();
              const isShort = rawTitle.toLowerCase().includes('#shorts') || rawTitle.toLowerCase().includes('#short');

              entries.push({
                id: 'yt_' + videoId,
                title: rawTitle,
                youtubeId: videoId,
                thumbnail: thumbMatch ? thumbMatch[1] : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                duration: isShort ? '0:59' : '10:00',
                views: 'ताज़ा कवरेज',
                timeAgo: formatHindiTimeAgo(publishedAt),
                category: isShort ? 'शॉर्ट्स / रील' : 'कवर्धा विशेष',
                youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
                publishedAt,
                isShort
              });
            }
          }

          if (entries.length > 0) {
            cachedVideos = entries;
            lastCacheTime = Date.now();
            console.log(`✅ [YouTube Auto-Sync] Successfully synced ${entries.length} latest videos for channel ${channelId}`);
          }

          resolve(cachedVideos);
        } catch (err) {
          console.error('[YouTube Sync] Error parsing XML feed:', err);
          resolve(cachedVideos);
        }
      });
    }).on('error', (err) => {
      console.error('[YouTube Sync] Network error fetching feed:', err.message);
      resolve(cachedVideos);
    });
  });
}
