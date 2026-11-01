import React, { useMemo, useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Article, VideoBulletin, MandiRate } from '../types';
import { type StoryItem, generateStoriesList } from '../data/storiesData';

export type { StoryItem };

export interface StoriesTrayProps {
  onSelectStory: (story: StoryItem) => void;
  isDark: boolean;
  stories?: StoryItem[];
  articles?: Article[];
  latestVideo?: VideoBulletin;
  topMandiRate?: MandiRate;
}

export const StoriesTray: React.FC<StoriesTrayProps> = ({ 
  onSelectStory, 
  isDark,
  stories: propStories,
  articles = [],
  latestVideo,
  topMandiRate
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Dynamically synthesize fresh stories from live articles & mandi rates
  const stories = useMemo<StoryItem[]>(() => {
    if (propStories && propStories.length > 0) return propStories;
    if (!articles || articles.length === 0) return [];
    return generateStoriesList(articles, latestVideo, topMandiRate);
  }, [propStories, articles, latestVideo, topMandiRate]);

  // Check scroll bounds for desktop chevron indicators
  const checkScrollBounds = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    checkScrollBounds();
    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScrollBounds, { passive: true });
    window.addEventListener('resize', checkScrollBounds);
    return () => {
      el.removeEventListener('scroll', checkScrollBounds);
      window.removeEventListener('resize', checkScrollBounds);
    };
  }, [stories]);

  const handleScrollBy = (offset: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Translate vertical mouse wheel to horizontal tray scroll on desktop
  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY !== 0 && scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  if (!stories || stories.length === 0) return null;

  return (
    <div className="relative group/tray w-full max-w-full">
      {/* Desktop Left Scroll Button */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScrollBy(-240)}
          aria-label="पिछली स्टोरीज़ देखें"
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-900/90 text-white hover:bg-red-600 shadow-xl items-center justify-center border border-white/20 transition-all active:scale-95 cursor-pointer backdrop-blur-sm -ml-2"
        >
          <ChevronLeft size={18} />
        </button>
      )}

      {/* Stories Scroll Container */}
      <div 
        ref={scrollContainerRef}
        onWheel={handleWheel}
        className="w-full max-w-full overflow-x-auto no-scrollbar py-2 px-1 scroll-smooth"
      >
        <div className="flex items-center gap-3.5 sm:gap-4 w-max">
          {stories.map((story) => (
            <button
              key={story.id}
              onClick={() => onSelectStory(story)}
              aria-label={`वेब स्टोरी देखें: ${story.label} - ${story.title}`}
              className="flex flex-col items-center gap-1.5 focus:outline-none group active:scale-95 transition-transform cursor-pointer"
            >
              {/* Story Avatar Circle with Gradient Ring */}
              <div className={`relative w-[66px] h-[66px] sm:w-[72px] sm:h-[72px] rounded-full p-[2.5px] bg-gradient-to-tr ${story.ringGradient} shadow-md group-hover:scale-105 transition-transform`}>
                <div className={`w-full h-full rounded-full overflow-hidden p-[2px] ${
                  isDark ? 'bg-slate-950' : 'bg-white'
                }`}>
                  <img 
                    src={story.image} 
                    alt={story.label}
                    loading="lazy"
                    decoding="async"
                    width="66"
                    height="66"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/logo-96.webp';
                    }}
                    className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300" 
                  />
                </div>

                {/* Optional Badge */}
                {story.badge && (
                  <span className="absolute -bottom-1 inset-x-0 mx-auto w-max bg-red-600 text-white font-black text-[9px] px-1.5 py-0.2 rounded-full uppercase tracking-tighter shadow border border-slate-950">
                    {story.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className={`text-[11px] font-bold tracking-tight max-w-[68px] truncate transition-colors ${
                isDark ? 'text-slate-200 group-hover:text-red-400' : 'text-slate-800 group-hover:text-red-600'
              }`}>
                {story.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Right Scroll Button */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScrollBy(240)}
          aria-label="अगली स्टोरीज़ देखें"
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-900/90 text-white hover:bg-red-600 shadow-xl items-center justify-center border border-white/20 transition-all active:scale-95 cursor-pointer backdrop-blur-sm -mr-2"
        >
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
};
