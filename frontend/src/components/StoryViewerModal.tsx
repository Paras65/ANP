import React, { useState, useEffect } from 'react';
import { X, ChevronRight, MapPin } from 'lucide-react';
import type { StoryItem } from './StoriesTray';
import { DEMO_STORIES } from './StoriesTray';
import { WhatsAppIcon } from './SocialIcons';

interface StoryViewerModalProps {
  initialStory: StoryItem;
  onClose: () => void;
  onReadFullArticle: (title: string) => void;
  onShareWhatsApp: (title: string) => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  initialStory,
  onClose,
  onReadFullArticle,
  onShareWhatsApp
}) => {
  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = DEMO_STORIES.findIndex(s => s.id === initialStory.id);
    return idx >= 0 ? idx : 0;
  });
  const [progress, setProgress] = useState(0);

  const currentStory = DEMO_STORIES[currentIndex] || initialStory;

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

  // Auto-advance progress timer (5 seconds per story)
  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Go to next story if available
          if (currentIndex < DEMO_STORIES.length - 1) {
            setCurrentIndex(ci => ci + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + 2; // 50 ticks = 100% in 5000ms (100ms * 50)
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, onClose]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < DEMO_STORIES.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-0 sm:p-4">
      {/* Container simulating mobile story phone aspect ratio */}
      <div className="relative w-full h-full sm:h-[88vh] sm:max-w-md sm:rounded-3xl overflow-hidden shadow-2xl bg-slate-950 flex flex-col justify-between select-none">
        
        {/* Story Background Image */}
        <div className="absolute inset-0">
          <img 
            src={currentStory.image} 
            alt={currentStory.title}
            className="w-full h-full object-cover animate-in fade-in zoom-in-105 duration-700" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60"></div>
        </div>

        {/* Top Header & Multi-Story Progress Bars */}
        <div className="relative z-20 p-4 space-y-3">
          
          {/* Progress Bars */}
          <div className="flex items-center gap-1.5 w-full">
            {DEMO_STORIES.map((s, idx) => (
              <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-100 rounded-full"
                  style={{
                    width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%'
                  }}
                ></div>
              </div>
            ))}
          </div>

          {/* Publisher Identity & Close Button */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center shadow">
                ANP
              </div>
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>Ambition News</span>
                  <span className="text-[10px] bg-red-600 px-1 rounded font-bold">स्टोरी</span>
                </div>
                <div className="text-[10px] text-white/70 flex items-center gap-1">
                  <MapPin size={10} className="text-red-400" />
                  <span>{currentStory.district}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur transition"
            >
              <X size={18} />
            </button>
          </div>

        </div>

        {/* Tap areas for Prev & Next navigation */}
        <div className="absolute inset-0 z-10 flex">
          <div className="w-1/3 h-full cursor-pointer" onClick={handlePrev}></div>
          <div className="w-2/3 h-full cursor-pointer" onClick={handleNext}></div>
        </div>

        {/* Bottom Story Content & Actions */}
        <div className="relative z-20 p-5 space-y-3.5 bg-gradient-to-t from-black via-black/80 to-transparent">
          
          <div className="flex items-center gap-2">
            <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
              {currentStory.category}
            </span>
            <span className="text-[11px] text-white/80 font-medium">
              📍 {currentStory.district}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-white leading-snug">
            {currentStory.title}
          </h2>

          <p className="text-xs text-white/85 line-clamp-3 leading-relaxed">
            {currentStory.excerpt}
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button 
              onClick={() => onReadFullArticle(currentStory.title)}
              className="flex-1 bg-white hover:bg-slate-100 text-slate-900 font-black text-xs py-2.5 rounded-xl shadow-lg transition active:scale-95 text-center flex items-center justify-center gap-1.5"
            >
              <span>पूरी खबर पढ़ें</span>
              <ChevronRight size={14} />
            </button>

            <button 
              onClick={() => onShareWhatsApp(currentStory.title)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 rounded-xl shadow-lg transition active:scale-95"
              title="WhatsApp Share"
            >
              <WhatsAppIcon size={16} />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
