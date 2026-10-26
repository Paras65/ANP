import type { VideoBulletin, InstagramPost } from '../types';

/**
 * Utility functions for actual YouTube & Instagram Reels integration
 */

export interface ParsedYouTube {
  id: string;
  isShort: boolean;
  embedUrl: string;
  thumbnailUrl: string;
  watchUrl: string;
}

export interface ParsedInstagram {
  shortcode: string;
  embedUrl: string;
  reelUrl: string;
}

/**
 * Parses any YouTube URL (Standard watch, short link, embed, or YouTube Short)
 */
export function parseYouTubeUrl(input: string): ParsedYouTube | null {
  if (!input) return null;
  const url = input.trim();

  // 1. YouTube Shorts: youtube.com/shorts/{id}
  const shortsMatch = url.match(/(?:youtube\.com|youtu\.be)\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch && shortsMatch[1]) {
    const id = shortsMatch[1];
    return {
      id,
      isShort: true,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&loop=1&playlist=${id}&rel=0`,
      thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      watchUrl: `https://www.youtube.com/shorts/${id}`
    };
  }

  // 2. Standard YouTube URL: watch?v=, youtu.be/, embed/
  const standardMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9_-]{11})/);
  if (standardMatch && standardMatch[1]) {
    const id = standardMatch[1];
    return {
      id,
      isShort: false,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
      thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      watchUrl: `https://www.youtube.com/watch?v=${id}`
    };
  }

  // 3. Raw 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return {
      id: url,
      isShort: false,
      embedUrl: `https://www.youtube-nocookie.com/embed/${url}?autoplay=1&rel=0`,
      thumbnailUrl: `https://img.youtube.com/vi/${url}/hqdefault.jpg`,
      watchUrl: `https://www.youtube.com/watch?v=${url}`
    };
  }

  return null;
}

/**
 * Parses any Instagram Reel or Post URL
 */
export function parseInstagramUrl(input: string): ParsedInstagram | null {
  if (!input) return null;
  const url = input.trim();

  // Match /reel/{code} or /p/{code}
  const match = url.match(/instagram\.com\/(?:reel|p)\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    const code = match[1];
    return {
      shortcode: code,
      embedUrl: `https://www.instagram.com/reel/${code}/embed`,
      reelUrl: `https://www.instagram.com/reel/${code}/`
    };
  }

  return null;
}

/**
 * Extracts a YouTube Channel ID from raw ID, full URL, or channel link
 */
export function extractYouTubeChannelId(input: string): string | null {
  if (!input) return null;
  const clean = input.trim();

  // If already UC... format
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(clean)) {
    return clean;
  }

  // From URL channel/UC...
  const match = clean.match(/\/channel\/(UC[a-zA-Z0-9_-]{22})/);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

/**
 * Formats ISO date string into natural Hindi relative time
 */
export function formatHindiTimeAgo(isoString: string): string {
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
 * Parses raw YouTube Atom RSS XML string into VideoBulletin and InstagramPost items
 */
export function parseYouTubeRssXml(xmlText: string): { videos: VideoBulletin[]; reels: InstagramPost[] } {
  const videos: VideoBulletin[] = [];
  const reels: InstagramPost[] = [];

  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xmlText)) !== null) {
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
      const timeAgo = formatHindiTimeAgo(publishedAt);
      const isShort = rawTitle.toLowerCase().includes('#shorts') || rawTitle.toLowerCase().includes('#short');
      const thumb = thumbMatch ? thumbMatch[1] : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      const videoItem: VideoBulletin = {
        id: 'yt_' + videoId,
        title: rawTitle,
        youtubeId: videoId,
        thumbnail: thumb,
        duration: isShort ? '0:59' : '10:00',
        views: 'ताज़ा बुलेटिन',
        timeAgo,
        category: isShort ? 'शॉर्ट्स बुलेटिन' : 'कवर्धा विशेष',
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`
      };
      videos.push(videoItem);

      // If it's a short, also automatically add to Reels tray
      if (isShort) {
        reels.push({
          id: 'reel_yt_' + videoId,
          caption: rawTitle,
          imageUrl: thumb,
          youtubeId: videoId,
          embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&rel=0`,
          postUrl: `https://www.youtube.com/shorts/${videoId}`,
          likes: '1.2K',
          commentsCount: '75',
          sharesCount: '38',
          district: 'कवर्धा',
          timeAgo,
          audioTrack: 'Ambition News Original'
        });
      }
    }
  }

  return { videos, reels };
}

/**
 * Auto-Sync Engine: Fetches latest videos from YouTube channel.
 * Uses Backend API endpoint first; falls back to public XML feed via CORS proxy if backend is unavailable.
 */
export async function syncYouTubeChannelVideos(
  channelId: string,
  backendApiUrl = import.meta.env.VITE_API_URL || 'https://anp-n2e6.onrender.com/api'
): Promise<{ success: boolean; videos: VideoBulletin[]; reels: InstagramPost[]; count: number; error?: string }> {
  const cleanId = extractYouTubeChannelId(channelId) || channelId.trim();
  if (!cleanId || !cleanId.startsWith('UC')) {
    return {
      success: false,
      videos: [],
      reels: [],
      count: 0,
      error: 'कृपया मान्य चैनल आईडी (UC से शुरू होने वाली) प्रदान करें'
    };
  }

  // 1. Try Backend API
  try {
    const res = await fetch(`${backendApiUrl}/youtube/sync?channelId=${cleanId}&force=true`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.videos)) {
        return {
          success: true,
          videos: data.videos,
          reels: data.reels || [],
          count: data.totalFetched || data.videos.length
        };
      }
    }
  } catch {
    // Backend offline or unreachable, fall through to direct proxy fetch
  }

  // 2. Fallback direct RSS feed through reliable open proxies
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${cleanId}`;
  const proxyEndpoints = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(rssUrl)}`
  ];

  for (const proxy of proxyEndpoints) {
    try {
      const response = await fetch(proxy, { headers: { 'Accept': 'application/xml, text/xml, */*' } });
      if (response.ok) {
        const xmlText = await response.text();
        const parsed = parseYouTubeRssXml(xmlText);
        if (parsed.videos.length > 0) {
          return {
            success: true,
            videos: parsed.videos,
            reels: parsed.reels,
            count: parsed.videos.length
          };
        }
      }
    } catch {
      // Try next proxy
    }
  }

  return {
    success: false,
    videos: [],
    reels: [],
    count: 0,
    error: 'यूट्यूब फीड लोड नहीं हो सकी। कृपया इंटरनेट कनेक्शन या चैनल आईडी जांचें।'
  };
}

