import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Maximize2, ChevronDown, SkipForward, Scaling } from 'lucide-react';
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

  // Dynamic Resizing State (Width clamped between 200px and 460px / screen width)
  const getInitialWidth = () => {
    if (typeof window === 'undefined') return 320;
    const maxSafe = Math.min(window.innerWidth - 24, 460);
    const saved = localStorage.getItem('anp_mini_player_width');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 200 && parsed <= maxSafe) {
        return parsed;
      }
    }
    return Math.min(320, maxSafe);
  };

  const [playerWidth, setPlayerWidth] = useState<number>(getInitialWidth);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  // Swipe-down/right to dismiss gesture state
  const [swipeOffset, setSwipeOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDismissing, setIsDismissing] = useState<boolean>(false);

  // Touch tracking refs
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const pinchStartRef = useRef<{ distance: number; initialWidth: number } | null>(null);
  const resizeStartRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const lastTapRef = useRef<number>(0);

  // Enforce screen boundary clamps on resize or phone rotation (Portrait <-> Landscape)
  useEffect(() => {
    const handleWindowResize = () => {
      const maxSafe = Math.min(window.innerWidth - 24, 460);
      setPlayerWidth(prev => Math.min(Math.max(prev, 200), maxSafe));
    };

    window.addEventListener('resize', handleWindowResize, { passive: true });
    window.addEventListener('orientationchange', handleWindowResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('orientationchange', handleWindowResize);
    };
  }, []);

  // Save preferred width to localStorage
  const saveWidth = useCallback((w: number) => {
    try {
      localStorage.setItem('anp_mini_player_width', Math.round(w).toString());
    } catch {}
  }, []);

  // Double-tap or double-click to cycle preset sizes: Small (240px) <-> Medium (320px) <-> Large (390px)
  const handleCyclePresetSize = (e: React.MouseEvent | React.TouchEvent) => {
    // Ignore double-taps on interactive buttons
    if ((e.target as HTMLElement)?.closest('button, a, input')) return;

    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      // Double-tap recognized!
      const maxSafe = Math.min(window.innerWidth - 24, 460);
      let nextWidth = 320;

      if (playerWidth < 280) {
        nextWidth = Math.min(330, maxSafe);
      } else if (playerWidth < 360 && maxSafe >= 380) {
        nextWidth = Math.min(410, maxSafe);
      } else {
        nextWidth = 240;
      }

      setPlayerWidth(nextWidth);
      saveWidth(nextWidth);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  // ONE-THUMB CORNER RESIZE HANDLER (Top-Left Grip)
  const handleCornerResizeStart = (clientX: number) => {
    setIsResizing(true);
    resizeStartRef.current = {
      startX: clientX,
      startWidth: playerWidth
    };
  };

  const handlePointerDownResize = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    handleCornerResizeStart(e.clientX);

    const onPointerMove = (ev: PointerEvent) => {
      if (!resizeStartRef.current) return;
      // Because player is docked on bottom-right, dragging LEFT increases width
      const deltaX = resizeStartRef.current.startX - ev.clientX;
      const maxSafe = Math.min(window.innerWidth - 24, 460);
      const newWidth = Math.min(Math.max(resizeStartRef.current.startWidth + deltaX, 200), maxSafe);
      setPlayerWidth(newWidth);
    };

    const onPointerUp = () => {
      setIsResizing(false);
      if (resizeStartRef.current) {
        saveWidth(playerWidth);
      }
      resizeStartRef.current = null;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // TWO-FINGER PINCH & ONE-FINGER SWIPE TOUCH EVENTS
  const handleTouchStart = (e: React.TouchEvent) => {
    // Never trigger swipe/pinch when tapping buttons
    if ((e.target as HTMLElement)?.closest('button, a, input')) {
      touchStartRef.current = null;
      pinchStartRef.current = null;
      return;
    }

    if (e.touches.length === 2) {
      // TWO-FINGER PINCH DETECTED
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      pinchStartRef.current = {
        distance,
        initialWidth: playerWidth
      };
      setIsResizing(true);
      touchStartRef.current = null;
    } else if (e.touches.length === 1) {
      // ONE-FINGER DRAG / SWIPE
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (pinchStartRef.current && e.touches.length === 2) {
      // PINCH-TO-RESIZE MOVEMENT
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      const delta = (distance - pinchStartRef.current.distance) * 1.25;
      const maxSafe = Math.min(window.innerWidth - 24, 460);
      const newWidth = Math.min(Math.max(pinchStartRef.current.initialWidth + delta, 200), maxSafe);
      setPlayerWidth(newWidth);
      return;
    }

    if (!touchStartRef.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - touchStartRef.current.x;
    const deltaY = e.touches[0].clientY - touchStartRef.current.y;

    // Only allow swiping downwards or to the right for dismissal (with 12px deadzone)
    const nextX = deltaX > 12 ? deltaX - 12 : 0;
    const nextY = deltaY > 12 ? deltaY - 12 : 0;

    if (nextX > 0 || nextY > 0) {
      setSwipeOffset({ x: nextX, y: nextY });
    }
  };

  const handleTouchEnd = () => {
    if (pinchStartRef.current) {
      setIsResizing(false);
      saveWidth(playerWidth);
      pinchStartRef.current = null;
    }

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
        transition: (swipeOffset.x === 0 && swipeOffset.y === 0 && !isResizing) ? 'transform 0.2s ease-out, width 0.2s ease-out' : 'none'
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
        <div 
          style={{ width: `${playerWidth}px` }}
          className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-red-600 bg-black animate-in fade-in slide-in-from-bottom-4 duration-300 group ring-2 ring-red-600/30"
        >
          {/* 
            IFRAME POINTER-EVENTS TRAP GUARD:
            During active drag or pinch-to-resize, a transparent layer prevents YouTube from stealing pointer events!
          */}
          {isResizing && (
            <div className="absolute inset-0 z-30 cursor-nwse-resize bg-transparent" />
          )}

          {/* ONE-THUMB CORNER RESIZE DRAG HANDLE (TOP-LEFT CORNER) */}
          <div
            onPointerDown={handlePointerDownResize}
            title="खींचकर छोटा या बड़ा करें (Resize handle)"
            aria-label="छोटा या बड़ा करें"
            className="absolute top-1.5 left-1.5 z-40 p-1.5 rounded-lg bg-black/80 hover:bg-red-600 border border-white/25 text-white/90 hover:text-white cursor-nwse-resize transition active:scale-95 shadow flex items-center justify-center pointer-events-auto touch-none"
          >
            <Scaling size={12} className="-rotate-90" />
          </div>

          {/* Top Controls Bar (Supports double-tap to cycle preset sizes) */}
          <div 
            onClick={handleCyclePresetSize}
            className="absolute top-2 left-8 right-2 flex items-center justify-between z-20 pointer-events-none cursor-pointer"
            title="डबल टैप करके साइज बदलें (Small/Medium/Wide)"
          >
            <div className="flex items-center gap-1.5">
              <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                LIVE TV
              </span>
              {video.category && (
                <span className="hidden sm:inline-block bg-black/75 backdrop-blur-sm text-slate-200 text-[8px] font-medium px-1.5 py-0.5 rounded-full border border-white/20">
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

          {/* Bottom Mini Headline & Click to Scroll Up (Supports double-tap to cycle preset sizes) */}
          <div 
            onClick={handleCyclePresetSize}
            className="p-2 bg-gradient-to-t from-black via-black/90 to-black/75 text-white cursor-pointer hover:bg-slate-900 transition flex items-center justify-between gap-2 border-t border-white/10"
            title="क्लिक करके बड़ा करें या डबल-टैप से साइज बदलें"
          >
            <p className="text-[10.5px] font-bold truncate flex-1 leading-snug">
              {video.title}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onExpand();
              }}
              className="text-[9px] text-red-400 font-bold shrink-0 hover:underline cursor-pointer"
            >
              बड़ा करें ⛶
            </button>
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
