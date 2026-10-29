/**
 * Ambition News Portal - High-Efficiency Image Optimization Helper
 * Optimizes external and internal image URLs for modern formats (AVIF/WebP),
 * responsive dimensions, and optimal compression to maximize Core Web Vitals.
 */

export type ImageSizePreset = 'hero' | 'card' | 'thumbnail' | 'avatar';

const PRESET_DIMS: Record<ImageSizePreset, { width: number; quality: number }> = {
  hero: { width: 640, quality: 70 },
  card: { width: 380, quality: 65 },
  thumbnail: { width: 240, quality: 60 },
  avatar: { width: 100, quality: 60 }
};

export function getOptimizedImageUrl(
  url?: string | null,
  preset: ImageSizePreset = 'card',
  fallback?: string
): string {
  if (!url || typeof url !== 'string') {
    return fallback || '/logo.png';
  }

  const { width, quality } = PRESET_DIMS[preset] || PRESET_DIMS.card;

  // Unsplash images: append or update parameters
  if (url.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set('w', width.toString());
      parsed.searchParams.set('q', quality.toString());
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fit', 'crop');
      return parsed.toString();
    } catch {
      // Fallback for relative or malformed URLs
      return `${url.split('?')[0]}?w=${width}&auto=format&fit=crop&q=${quality}`;
    }
  }

  // Cloudinary images: inject w_...,q_auto,f_auto
  if (url.includes('res.cloudinary.com')) {
    return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto,c_fill/`);
  }

  // YouTube thumbnail optimization: route to fast Google edge CDN
  if (url.includes('img.youtube.com')) {
    return url.replace('img.youtube.com', 'i.ytimg.com');
  }

  return url;
}
