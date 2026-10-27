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

export interface SyncedShort {
  youtubeId: string;
  caption: string;
  likes: string;
  commentsCount: string;
  sharesCount: string;
  district: string;
  timeAgo: string;
  audioTrack: string;
  imageUrl: string;
  embedUrl: string;
  postUrl: string;
}

// Helper to parse ISO 8601 duration string (e.g. PT1M15S, PT45S, PT1H2M30S)
function parseISO8601Duration(iso: string): { totalSeconds: number; formatted: string } {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return { totalSeconds: 0, formatted: '0:00' };
  const h = parseInt(match[1] || '0', 10);
  const m = parseInt(match[2] || '0', 10);
  const s = parseInt(match[3] || '0', 10);
  const totalSeconds = h * 3600 + m * 60 + s;

  if (h > 0) {
    return {
      totalSeconds,
      formatted: `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    };
  }
  return {
    totalSeconds,
    formatted: `${m}:${s.toString().padStart(2, '0')}`
  };
}

// Helper to format numeric view and like counts
function formatViews(countStr?: string): string {
  if (!countStr) return 'ताज़ा कवरेज';
  const num = parseInt(countStr, 10);
  if (isNaN(num)) return countStr;
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

/**
 * Automatically fetches the latest vertical Shorts directly from the YouTube channel page.
 */
export async function fetchChannelShorts(handleOrChannelId = 'ambition_news'): Promise<SyncedShort[]> {
  try {
    const handle = handleOrChannelId.replace(/^@/, '');
    const url = handle.startsWith('UC')
      ? `https://www.youtube.com/channel/${handle}/shorts`
      : `https://www.youtube.com/@${handle}/shorts`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const html = await res.text();
    const match = html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/);
    if (!match) return [];

    const data = JSON.parse(match[1]);
    const reels: SyncedShort[] = [];

    function walk(obj: any) {
      if (!obj || typeof obj !== 'object') return;
      if (obj.shortsLockupViewModel) {
        const item = obj.shortsLockupViewModel;
        const vid = item.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId;
        const caption = item.overlayMetadata?.primaryText?.content || item.accessibilityText?.split(',')[0] || 'Ambition News Reel';
        const views = item.overlayMetadata?.secondaryText?.content || '1.2K';
        const thumb = item.thumbnailViewModel?.thumbnailViewModel?.image?.sources?.[0]?.url || `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
        if (vid) {
          reels.push({
            youtubeId: vid,
            caption: caption.trim(),
            likes: views.replace(/ views/i, ''),
            commentsCount: '85',
            sharesCount: '42',
            district: caption.includes('रायपुर') ? 'रायपुर' : 'कवर्धा',
            timeAgo: 'ताज़ा रील',
            audioTrack: 'Ambition News Original',
            imageUrl: thumb,
            embedUrl: `https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&loop=1&playlist=${vid}&rel=0`,
            postUrl: `https://www.youtube.com/shorts/${vid}`
          });
        }
      }
      for (const k of Object.keys(obj)) {
        walk(obj[k]);
      }
    }
    walk(data);

    // Deduplicate
    const seen = new Set<string>();
    const unique: SyncedShort[] = [];
    for (const r of reels) {
      if (!seen.has(r.youtubeId)) {
        seen.add(r.youtubeId);
        unique.push(r);
      }
    }
    return unique;
  } catch (err) {
    console.error('[YouTube Shorts Sync] Error:', err);
    return [];
  }
}

/**
 * 100% Official Google YouTube Data API v3 Engine.
 * Fetches uploads, exact view/like counts, and categorizes into standard videos and vertical Shorts.
 */
export async function syncFromYouTubeDataAPI(channelId: string, apiKey: string): Promise<{
  videos: SyncedYouTubeVideo[];
  reels: SyncedShort[];
}> {
  try {
    const cleanId = channelId.trim();
    let uploadsPlaylistId = '';

    if (cleanId.startsWith('UC')) {
      uploadsPlaylistId = 'UU' + cleanId.slice(2);
    } else {
      const cleanHandle = cleanId.replace(/^@/, '');
      const chUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=${encodeURIComponent(cleanHandle)}&key=${apiKey}`;
      const chRes = await fetch(chUrl);
      const chData: any = await chRes.json();
      uploadsPlaylistId = chData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || '';
    }

    if (!uploadsPlaylistId) {
      throw new Error(`Uploads playlist not found for channel: ${channelId}`);
    }

    // 1. Fetch up to 50 items from the Uploads playlist
    const pUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${apiKey}`;
    const pRes = await fetch(pUrl);
    const pData: any = await pRes.json();

    if (!pData.items || !Array.isArray(pData.items)) {
      throw new Error(pData.error?.message || 'Failed to fetch playlist from YouTube API');
    }

    const videoIds: string[] = pData.items
      .map((item: any) => item.contentDetails?.videoId)
      .filter(Boolean);

    if (videoIds.length === 0) {
      return { videos: [], reels: [] };
    }

    // 2. Fetch detailed duration, content details & statistics
    const vUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}&key=${apiKey}`;
    const vRes = await fetch(vUrl);
    const vData: any = await vRes.json();

    if (!vData.items || !Array.isArray(vData.items)) {
      throw new Error(vData.error?.message || 'Failed to fetch video details from YouTube API');
    }

    const videos: SyncedYouTubeVideo[] = [];
    const reels: SyncedShort[] = [];

    for (const item of vData.items) {
      const vid = item.id;
      const snippet = item.snippet || {};
      const contentDetails = item.contentDetails || {};
      const statistics = item.statistics || {};

      const title = snippet.title || 'Ambition News';
      const publishedAt = snippet.publishedAt || new Date().toISOString();
      const thumb = snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
      const duration = parseISO8601Duration(contentDetails.duration || '');
      const isShort = (duration.totalSeconds > 0 && duration.totalSeconds <= 60) || title.toLowerCase().includes('#short');
      const views = formatViews(statistics.viewCount);
      const likes = formatViews(statistics.likeCount) || '1.2K';
      const commentsCount = statistics.commentCount || '45';

      const district = title.includes('रायपुर') ? 'रायपुर' : title.includes('बिलासपुर') ? 'बिलासपुर' : title.includes('राजनांदगांव') ? 'राजनांदगांव' : 'कवर्धा';

      if (isShort) {
        reels.push({
          youtubeId: vid,
          caption: title.trim(),
          likes,
          commentsCount: String(commentsCount),
          sharesCount: '35',
          district,
          timeAgo: formatHindiTimeAgo(publishedAt),
          audioTrack: 'Ambition News Original',
          imageUrl: thumb,
          embedUrl: `https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&loop=1&playlist=${vid}&rel=0`,
          postUrl: `https://www.youtube.com/shorts/${vid}`
        });
      } else {
        videos.push({
          id: 'yt_' + vid,
          title: title.trim(),
          youtubeId: vid,
          thumbnail: thumb,
          duration: duration.formatted,
          views: `${views} बार देखा गया`,
          timeAgo: formatHindiTimeAgo(publishedAt),
          category: 'कवर्धा विशेष',
          youtubeUrl: `https://www.youtube.com/watch?v=${vid}`,
          publishedAt,
          isShort: false
        });
      }
    }

    return { videos, reels };
  } catch (err: any) {
    console.error('[YouTube Data API v3 Engine Error]:', err.message);
    throw err;
  }
}
