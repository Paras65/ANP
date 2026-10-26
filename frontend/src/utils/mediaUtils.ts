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

