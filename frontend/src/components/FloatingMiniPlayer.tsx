import React, { useState, useRef } from 'react';
import { X, Maximize2, ChevronDown, SkipForward } from 'lucide-react';
import type { VideoBulletin } from '../types';
import { isDirectVideoUrl } from '../utils/mediaUtils';

interface FloatingMiniPlayerProps {
  video: VideoBulletin;
  onClose: () => void;
  onExpand: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export const FloatingMiniPlayer: React.FC<FloatingMiniPlayerProps> = ({
  video,
  onClose,
  onExpand,
  onNext,
  hasNext = false
}) => {
  // Ultra-compact audio-pill mode (ideal when reading articles)
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Swipe-down/right to dismiss gesture state
  const [swipeOffset, setSwipeOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDismissing, setIsDismissing] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const deltaX = e.touches[0].clientX - touchStartRef.current.x;
    const deltaY = e.touches[0].clientY - touchStartRef.current.y;

    // Only allow swiping downwards or to the right for dismissal
    const nextX = deltaX > 0 ? deltaX : 0;
    const nextY = deltaY > 0 ? deltaY : 0;

    if (nextX > 5 || nextY > 5) {
      setSwipeOffset({ x: nextX, y: nextY });
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset.y > 60 || swipeOffset.x > 80) {
      setIsDismissing(true);
      setTimeout(() => {
        onClose();
      }, 200);
    } else {
      setSwipeOffset({ x: 0, y: 0 });
    }
    touchStartRef.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translate(${swipeOffset.x}px, ${swipeOffset.y}px)`,
        transition: swipeOffset.x === 0 && swipeOffset.y === 0 ? 'transform 0.2s ease-out' : 'none'
      }}
      className={`fixed bottom-16 sm:bottom-6 right-3 sm:right-6 z-40 transition-opacity duration-200 select-none ${
        isDismissing ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* 
        PERSISTENT VIDEO / AUDIO EMBED CONTAINER
        Kept mounted in both views so playback / audio NEVER pauses or reloads when collapsing/expanding.
      */}
      <div className={isCollapsed ? 'w-0 h-0 overflow-hidden opacity-0 pointer-events-none absolute' : 'w-full'}>
        <div className="w-[280px] sm:w-[325px] rounded-2xl overflow-hidden shadow-2xl border-2 border-red-600 bg-black animate-in fade-in slide-in-from-bottom-4 duration-300 group ring-2 ring-red-600/30">
          {/* Top Controls Bar */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-30 pointer-events-none">
            <div className="flex items-center gap-1.5">
              <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                LIVE TV
              </span>
              {video.category && (
                <span className="bg-black/75 backdrop-blur-sm text-slate-200 text-[8px] font-medium px-1.5 py-0.5 rounded-full border border-white/20">
                  {video.category}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 pointer-events-auto">
              {/* Skip to Next Bulletin */}
              {onNext && hasNext && (
                <button
                  type="button"
                  onClick={onNext}
                  aria-label="अगला बुलेटिन देखें"
                  title="अगला बुलेटिन देखें"
                  className="p-1 bg-black/80 hover:bg-slate-700 text-white rounded-full border border-white/20 transition active:scale-95 cursor-pointer shadow"
                >
                  <SkipForward size={12} />
                </button>
              )}

              {/* Minimize to Audio Pill (keeps playing, frees reading space) */}
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                aria-label="ऑडियो मोड (छोटा करें)"
                title="ऑडियो मोड (छोटा करें ताकि खबर पढ़ सकें)"
                className="p-1 bg-black/80 hover:bg-slate-700 text-white rounded-full border border-white/20 transition active:scale-95 cursor-pointer shadow"
              >
                <ChevronDown size={12} />
              </button>

              {/* Expand to Large Cinema Screen */}
              <button
                type="button"
                onClick={onExpand}
                aria-label="बड़ी स्क्रीन में देखें"
                title="बड़ी स्क्रीन में देखें"
                className="p-1 bg-black/80 hover:bg-slate-700 text-white rounded-full border border-white/20 transition active:scale-95 cursor-pointer shadow"
              >
                <Maximize2 size={12} />
              </button>

              {/* Close Video button */}
              <button
                type="button"
                onClick={onClose}
                aria-label="वीडियो बंद करें"
                title="वीडियो बंद करें (या नीचे स्वाइप करें)"
                className="p-1 bg-black/80 hover:bg-red-600 text-white rounded-full border border-white/20 transition active:scale-95 cursor-pointer shadow"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {/* 16:9 Video Embed */}
          <div className="relative aspect-video w-full bg-black">
            {isDirectVideoUrl(video.youtubeUrl || video.youtubeId) ? (
              <video
                src={video.youtubeUrl || video.youtubeId}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1&playsinline=1`}
                title={video.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            )}
          </div>

          {/* Bottom Mini Headline & Click to Scroll Up */}
          <div 
            onClick={onExpand}
            className="p-2 bg-gradient-to-t from-black via-black/90 to-black/75 text-white cursor-pointer hover:bg-slate-900 transition flex items-center justify-between gap-2 border-t border-white/10"
            title="क्लिक करके बड़ी स्क्रीन पर जाएं"
          >
            <p className="text-[10.5px] font-bold truncate flex-1 leading-snug">
              {video.title}
            </p>
            <span className="text-[9px] text-red-400 font-bold shrink-0 hover:underline">
              बड़ा करें ⛶
            </span>
          </div>
        </div>
      </div>

      {/* 
        ULTRA-COMPACT FLOATING AUDIO PILL (COLLAPSED MODE)
        Lets the user read full-page articles unobstructed while live bulletin audio streams.
      */}
      {isCollapsed && (
        <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-950/95 backdrop-blur-md rounded-full border-2 border-red-600 shadow-2xl text-white w-[260px] sm:w-[290px] animate-in fade-in zoom-in-95 duration-200">
          {/* Animated Equalizer Wave */}
          <div 
            onClick={() => setIsCollapsed(false)}
            className="flex items-end gap-0.5 h-3.5 px-1 shrink-0 cursor-pointer"
            title="वीडियो खोलें"
          >
            <span className="w-1 bg-red-500 rounded-full animate-bounce [animation-delay:0ms] h-full" />
            <span className="w-1 bg-red-500 rounded-full animate-bounce [animation-delay:150ms] h-2/3" />
            <span className="w-1 bg-red-500 rounded-full animate-bounce [animation-delay:300ms] h-4/5" />
          </div>

          {/* Title & Click to Restore */}
          <div 
            onClick={() => setIsCollapsed(false)}
            className="flex-1 min-w-0 cursor-pointer"
            title="वीडियो देखने के लिए टैप करें"
          >
            <p className="text-[10px] font-bold text-white truncate leading-tight">
              {video.title}
            </p>
            <span className="text-[8.5px] text-red-400 font-semibold flex items-center gap-1">
              <span>● लाइव ऑडियो</span>
              <span className="text-slate-400 font-normal">टैप करके देखें</span>
            </span>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-1 shrink-0">
            {onNext && hasNext && (
              <button
                type="button"
                onClick={onNext}
                aria-label="अगला बुलेटिन"
                title="अगला बुलेटिन"
                className="p-1 hover:bg-slate-800 text-slate-200 hover:text-white rounded-full transition active:scale-95 cursor-pointer"
              >
                <SkipForward size={12} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              aria-label="वीडियो खोलें"
              title="वीडियो खोलें"
              className="p-1 hover:bg-slate-800 text-slate-200 hover:text-white rounded-full transition active:scale-95 cursor-pointer"
            >
              <Maximize2 size={12} />
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="बंद करें"
              title="बंद करें"
              className="p-1 hover:bg-red-600 text-slate-200 hover:text-white rounded-full transition active:scale-95 cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
