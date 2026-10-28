import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, MapPin, Pause } from 'lucide-react';
import type { StoryItem } from './StoriesTray';
import { EDITORIAL_STORIES } from './StoriesTray';
import { WhatsAppIcon } from './SocialIcons';
import { getCategoryTheme } from '../utils/categoryTheme';

interface StoryViewerModalProps {
  initialStory: StoryItem;
  stories?: StoryItem[];
  onClose: () => void;
  onReadFullArticle: (story: StoryItem) => void;
  onShareWhatsApp: (story: StoryItem) => void;
  onOpenVideo?: () => void;
  onOpenMandi?: () => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  initialStory,
  stories,
  onClose,
  onReadFullArticle,
  onShareWhatsApp,
  onOpenVideo,
  onOpenMandi
}) => {
  const storyList = stories && stories.length > 0 ? stories : EDITORIAL_STORIES;

  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = storyList.findIndex(s => s.id === initialStory.id);
    return idx >= 0 ? idx : 0;
  });
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentStory = storyList[currentIndex] || initialStory;

  // Lock body scroll while story modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.classList.remove('modal-open');
    };
  }, []);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    } else {
      setProgress(0);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < storyList.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, storyList.length, onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, onClose]);

  // Auto-advance progress timer (5 seconds = 5000ms, ticks every 50ms = +1%)
  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (isPaused) return prev; // Do not advance while user presses and holds
        if (prev >= 100) {
          if (currentIndex < storyList.length - 1) {
            setCurrentIndex(ci => ci + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + 1; // 100 ticks of 50ms = 5000ms (5s)
      });
    }, 50);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, storyList.length, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-0 sm:p-4">
      {/* Container simulating mobile story aspect ratio */}
      <div 
        className="relative w-full h-full sm:h-[88vh] sm:max-w-md sm:rounded-3xl overflow-hidden shadow-2xl bg-slate-950 flex flex-col justify-between select-none"
        onPointerDown={() => setIsPaused(true)}
        onPointerUp={() => setIsPaused(false)}
        onPointerCancel={() => setIsPaused(false)}
      >
        
        {/* Story Background Image with Error Fallback */}
        <div className="absolute inset-0 bg-slate-950 flex items-center justify-center overflow-hidden">
          {currentStory.id === 's-live' ? (
            <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-br from-red-950 via-slate-950 to-black">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-600/30 via-transparent to-transparent"></div>
              <img 
                src="/logo.png" 
                alt="Ambition News"
                className="w-48 h-48 object-contain drop-shadow-[0_8px_32px_rgba(220,38,38,0.6)] animate-pulse"
              />
            </div>
          ) : (
            <img 
              src={currentStory.image || getCategoryTheme(currentStory.category, currentStory.title, currentStory.district).photoUrl} 
              alt={currentStory.title}
              onError={(e) => {
                (e.target as HTMLImageElement).src = getCategoryTheme(currentStory.category, currentStory.title, currentStory.district).photoUrl;
              }}
              className="w-full h-full object-cover animate-in fade-in zoom-in-105 duration-700 pointer-events-none" 
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60 pointer-events-none"></div>

          {/* Discreet Studio Corner Bug / Watermark */}
          <div className="absolute top-16 right-4 z-20 flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20 pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-[10px] font-black text-white tracking-widest uppercase">
              AMBITION NEWS
            </span>
          </div>
        </div>

        {/* Top Header & Multi-Story Progress Bars */}
        <div className="relative z-30 p-4 space-y-3">
          
          {/* Dynamic Progress Bars for all stories in the list */}
          <div className="flex items-center gap-1.5 w-full">
            {storyList.map((s, idx) => (
              <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-75 rounded-full"
                  style={{
                    width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%'
                  }}
                ></div>
              </div>
            ))}
          </div>

          {/* Publisher Identity, Pause Indicator & Close Button */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-rose-600 text-white font-black text-xs flex items-center justify-center shadow-md border border-white/20">
                ANP
              </div>
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>Ambition News</span>
                  <span className="text-[10px] bg-red-600 px-1 rounded font-bold">स्टोरी</span>
                  {currentStory.badge && (
                    <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1 rounded uppercase">
                      {currentStory.badge}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-white/80 flex items-center gap-1">
                  <MapPin size={10} className="text-red-400" />
                  <span>{currentStory.district}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isPaused && (
                <span className="bg-black/60 backdrop-blur border border-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <Pause size={10} /> रोक दिया
                </span>
              )}
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                aria-label="वेब स्टोरी विंडो बंद करें"
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur transition cursor-pointer"
                title="बंद करें"
              >
                <X size={18} />
              </button>
            </div>
          </div>

        </div>

        {/* Tap areas for Prev & Next navigation */}
        <div className="absolute inset-0 z-20 flex">
          <div 
            className="w-1/3 h-full cursor-pointer" 
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            title="पिछली स्टोरी"
          />
          <div 
            className="w-2/3 h-full cursor-pointer" 
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            title="अगली स्टोरी"
          />
        </div>

        {/* Bottom Story Content & Actions */}
        <div className="relative z-30 p-5 space-y-3.5 bg-gradient-to-t from-black via-black/85 to-transparent">
          
          <div className="flex items-center gap-2">
            <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow">
              {currentStory.category}
            </span>
            <span className="text-[11px] text-white/90 font-medium">
              📍 {currentStory.district}
            </span>
            <span className="text-[10px] text-white/60 ml-auto font-mono">
              {currentIndex + 1} / {storyList.length}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-white leading-snug drop-shadow-md">
            {currentStory.title}
          </h2>

          <p className="text-xs text-white/90 line-clamp-3 leading-relaxed drop-shadow-sm font-medium">
            {currentStory.excerpt}
          </p>

          {/* Action Buttons tailored to story type */}
          <div className="pt-2 flex items-center gap-2">
            {currentStory.id === 's-mandi' ? (
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                  if (onOpenMandi) {
                    onOpenMandi();
                  } else {
                    onReadFullArticle(currentStory);
                  }
                }}
                aria-label="कवर्धा कृषि उपज मंडी भाव देखें"
                className="flex-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs py-2.5 rounded-xl shadow-lg shadow-emerald-950/60 transition active:scale-95 text-center flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>🌾 आज के सभी मंडी भाव देखें</span>
                <ChevronRight size={14} />
              </button>
            ) : currentStory.id === 's-live' ? (
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                  if (onOpenVideo) {
                    onOpenVideo();
                  } else {
                    onReadFullArticle(currentStory);
                  }
                }}
                aria-label="लाइव टीवी और वीडियो बुलेटिन देखें"
                className="flex-1 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs py-2.5 rounded-xl shadow-lg shadow-red-950/60 transition active:scale-95 text-center flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>▶️ लाइव टीवी व वीडियो देखें</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                  onReadFullArticle(currentStory);
                }}
                aria-label="पूरी खबर पढ़ें"
                className="flex-1 bg-white hover:bg-slate-100 text-slate-950 font-black text-xs py-2.5 rounded-xl shadow-lg transition active:scale-95 text-center flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>📰 पूरी खबर पढ़ें</span>
                <ChevronRight size={14} />
              </button>
            )}

            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShareWhatsApp(currentStory);
              }}
              aria-label="यह वेब स्टोरी व्हाट्सएप पर शेयर करें"
              className="bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 rounded-xl shadow-lg transition active:scale-95 cursor-pointer shrink-0"
              title="WhatsApp पर स्टोरी शेयर करें"
            >
              <WhatsAppIcon size={16} />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
