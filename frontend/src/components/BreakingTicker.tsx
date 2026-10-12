import React, { useState } from 'react';
import { Radio, Pause, Play, ChevronRight } from 'lucide-react';
import type { Article } from '../types';

interface BreakingTickerProps {
  breakingArticles: Article[];
  onSelectArticle: (article: Article) => void;
}

export const BreakingTicker: React.FC<BreakingTickerProps> = ({
  breakingArticles,
  onSelectArticle
}) => {
  const [isPaused, setIsPaused] = useState(false);

  if (!breakingArticles || breakingArticles.length === 0) return null;

  return (
    <div className="bg-red-600 text-white text-xs font-medium flex items-center overflow-hidden border-t border-b border-red-700 shadow-sm relative z-20">
      
      {/* Static Label Badge */}
      <div className="bg-red-800 px-3 py-1.5 font-bold flex items-center gap-1.5 shrink-0 shadow-md">
        <Radio size={13} className="animate-pulse" />
        <span className="tracking-wide">ब्रेकिंग न्यूज़</span>
      </div>

      {/* Marquee Container */}
      <div 
        className="overflow-hidden flex-1 py-1 relative cursor-pointer"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div 
          className="whitespace-nowrap inline-flex items-center gap-8 ticker-scroll"
          style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
        >
          {breakingArticles.map((art) => (
            <button
              key={art._id}
              onClick={() => onSelectArticle(art)}
              className="inline-flex items-center gap-1.5 hover:underline text-left text-white/95 hover:text-white font-medium group transition"
            >
              <span className="bg-black/30 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                {art.district}
              </span>
              <span>⚡ {art.title}</span>
              <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition inline" />
            </button>
          ))}
        </div>
      </div>

      {/* Pause/Play control */}
      <button 
        onClick={() => setIsPaused(!isPaused)}
        className="px-2 py-1 bg-red-700 hover:bg-red-800 text-white/80 hover:text-white transition shrink-0"
        title={isPaused ? "Play ticker" : "Pause ticker"}
      >
        {isPaused ? <Play size={11} /> : <Pause size={11} />}
      </button>

    </div>
  );
};
