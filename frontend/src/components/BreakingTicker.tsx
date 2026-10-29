import React, { useState, useMemo } from 'react';
import { Radio, Pause, Play, ChevronRight, Zap } from 'lucide-react';
import type { Article } from '../types';

interface BreakingTickerProps {
  breakingArticles?: Article[];
  topArticles?: Article[];
  onSelectArticle: (article: Article) => void;
}

export const BreakingTicker: React.FC<BreakingTickerProps> = ({
  breakingArticles = [],
  topArticles = [],
  onSelectArticle
}) => {
  const [isPaused, setIsPaused] = useState(false);

  // Edge case 1: If no breaking news exists, seamlessly fall back to latest top headlines (सुरखियां)
  const isBreakingActive = breakingArticles && breakingArticles.length > 0;
  const activeList = useMemo(() => {
    if (isBreakingActive) {
      return breakingArticles;
    }
    if (topArticles && topArticles.length > 0) {
      return topArticles.slice(0, 8);
    }
    return [];
  }, [isBreakingActive, breakingArticles, topArticles]);

  // Edge case 2: Guarantee seamless marquee flow without blank gap (must have >= 8 items)
  const marqueeItems = useMemo(() => {
    if (activeList.length === 0) return [];
    const repeatCount = Math.max(2, Math.ceil(8 / activeList.length));
    return Array.from({ length: repeatCount }, () => activeList).flat();
  }, [activeList]);

  if (activeList.length === 0) {
    return (
      <div 
        className="text-white text-xs font-medium flex items-center overflow-hidden border-t border-b shadow-sm relative z-20 w-full max-w-full select-none h-[34px] bg-gradient-to-r from-red-700 via-rose-700 to-red-800 border-red-800/80 px-3"
      >
        <div className="flex items-center gap-1.5 shrink-0">
          <Zap size={13} className="animate-pulse text-amber-400" />
          <span className="font-bold text-[11px] text-amber-300">लाइव अपडेट:</span>
        </div>
        <span className="text-[11px] text-red-100 truncate ml-2">
          एम्बिशन डिजिटल न्यूज़ नेटवर्क • कवर्धा (कबीरधाम) एवं 88 जिला लाइव बुलेटिन
        </span>
      </div>
    );
  }

  return (
    <div 
      className={`text-white text-xs font-medium flex items-center overflow-hidden border-t border-b shadow-sm relative z-20 w-full max-w-full select-none ${
        isBreakingActive 
          ? 'bg-red-600 border-red-700' 
          : 'bg-gradient-to-r from-red-700 via-rose-700 to-red-800 border-red-800/80'
      }`}
    >
      
      {/* Static Label Badge */}
      <div className={`px-2.5 sm:px-3.5 py-1.5 font-black flex items-center gap-1.5 shrink-0 shadow-md ${
        isBreakingActive ? 'bg-red-900 text-white' : 'bg-rose-950 text-amber-300 border-r border-rose-800/60'
      }`}>
        {isBreakingActive ? (
          <>
            <Radio size={13} className="animate-pulse text-white shrink-0" />
            <span className="tracking-wide hidden sm:inline">ब्रेकिंग न्यूज़</span>
            <span className="tracking-wide sm:hidden">ब्रेकिंग</span>
          </>
        ) : (
          <>
            <Zap size={13} className="animate-bounce text-amber-400 shrink-0" />
            <span className="tracking-wide hidden sm:inline">ताज़ा सुर्खियां</span>
            <span className="tracking-wide sm:hidden">सुर्खियां</span>
          </>
        )}
      </div>

      {/* Marquee Container with desktop hover & mobile touch pause */}
      <div 
        className="overflow-hidden flex-1 min-w-0 py-1 relative cursor-pointer"
        style={{ contain: 'paint' }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        title={isPaused ? "टिकर रोका गया" : "टिकर चल रहा है (रोकने के लिए दबाएं)"}
      >
        <div 
          className="whitespace-nowrap inline-flex items-center gap-6 sm:gap-8 ticker-seamless"
          style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
        >
          {marqueeItems.map((art, idx) => (
            <button
              type="button"
              key={`${art._id}-${idx}`}
              onClick={() => onSelectArticle(art)}
              className="inline-flex items-center gap-1.5 hover:underline text-left text-white/95 hover:text-white font-medium group transition shrink-0 cursor-pointer"
            >
              <span className="bg-black/35 text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-red-200 border border-white/10">
                {art.district}
              </span>
              <span className="text-[11px] sm:text-xs">
                {isBreakingActive ? '⚡' : '🔥'} {art.title}
              </span>
              <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition inline text-white/80" />
            </button>
          ))}
        </div>
      </div>

      {/* Pause/Play control button */}
      <button 
        type="button"
        onClick={() => setIsPaused(!isPaused)}
        className="px-2.5 py-1.5 bg-black/25 hover:bg-black/40 text-white/90 hover:text-white transition shrink-0 cursor-pointer border-l border-white/10"
        title={isPaused ? "टिकर चालू करें" : "टिकर रोकें"}
      >
        {isPaused ? <Play size={11} className="fill-current" /> : <Pause size={11} className="fill-current" />}
      </button>

    </div>
  );
};
