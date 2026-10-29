import React, { useMemo } from 'react';
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
  // Dynamically synthesize fresh stories from live articles & mandi rates
  const stories = useMemo<StoryItem[]>(() => {
    if (propStories && propStories.length > 0) return propStories;
    if (!articles || articles.length === 0) return [];
    return generateStoriesList(articles, latestVideo, topMandiRate);
  }, [propStories, articles, latestVideo, topMandiRate]);

  if (!stories || stories.length === 0) return null;

  return (
    <div className="w-full max-w-full overflow-x-auto no-scrollbar py-2 px-1">
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
  );
};


