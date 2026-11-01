import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Maximize2, ChevronDown, SkipForward, Scaling, GripHorizontal } from 'lucide-react';
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
  // Container DOM ref (for attaching non-passive event listeners that prevent browser whole-page pinch-zoom)
  const containerRef = useRef<HTMLDivElement>(null);

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
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Drag offset for multi-directional swipe-to-dismiss (in pixels)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDismissing, setIsDismissing] = useState<boolean>(false);

  // Drag and Resize tracking refs
  const dragStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const resizeStartRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const lastTapRef = useRef<number>(0);

  // 1. HARD PREVENT BROWSER WHOLE-PAGE PINCH ZOOM ON MINI PLAYER
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Non-passive listener strictly cancels multi-touch pinch so the browser viewport never zooms!
    const blockViewportPinch = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    el.addEventListener('touchstart', blockViewportPinch, { passive: false });
    el.addEventListener('touchmove', blockViewportPinch, { passive: false });

    return () => {
      el.removeEventListener('touchstart', blockViewportPinch);
      el.removeEventListener('touchmove', blockViewportPinch);
    };
  }, []);

  // 2. ENFORCE SCREEN BOUNDARY CLAMPS ON WINDOW RESIZE OR PHONE ROTATION
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
    if ((e.target as HTMLElement)?.closest('button, a, input, .no-drag')) return;

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

  // 3. UNIFIED POINTER-BASED ONE-THUMB CORNER RESIZE (TOP-LEFT GRIP)
  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsResizing(true);
    resizeStartRef.current = {
      startX: e.clientX,
      startWidth: playerWidth
    };
  };

  const handleResizePointerMove = (e: React.PointerEvent) => {
    if (!isResizing || !resizeStartRef.current) return;
    // Because player is docked on bottom-right, dragging LEFT increases width
    const deltaX = resizeStartRef.current.startX - e.clientX;
    const maxSafe = Math.min(window.innerWidth - 24, 460);
    const newWidth = Math.min(Math.max(resizeStartRef.current.startWidth + deltaX, 200), maxSafe);
    setPlayerWidth(newWidth);
  };

  const handleResizePointerUp = (e: React.PointerEvent) => {
    if (!isResizing) return;
    setIsResizing(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    saveWidth(playerWidth);
    resizeStartRef.current = null;
  };

  // 4. UNIFIED POINTER-BASED MULTI-DIRECTIONAL DRAG-TO-DISMISS (TOUCH & MOUSE)
  const handleDragPointerDown = (e: React.PointerEvent) => {
    // Never initiate drag when touching buttons or the resize grip
    if ((e.target as HTMLElement).closest('button, a, input, .no-drag')) return;

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    };
    setIsDragging(true);
  };

  const handleDragPointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    // Freely track movement in any direction
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleDragPointerUp = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    setIsDragging(false);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    const deltaTime = Date.now() - dragStartRef.current.time;
    const distance = Math.hypot(deltaX, deltaY);
    const speed = distance / Math.max(deltaTime, 1); // px per ms

    // DISMISS TRIGGER:
    // 1. Dragged > 60px in any direction (down, right, left, up)
    // 2. OR quick flick gesture (speed > 0.4 px/ms and distance > 25px)
    if (distance > 60 || (speed > 0.4 && distance > 25)) {
      setIsDismissing(true);
      // Animate smoothly out of the screen along the swipe vector
      const exitMultiplier = 350 / Math.max(distance, 1);
      setDragOffset({
        x: deltaX * exitMultiplier,
        y: deltaY * exitMultiplier
      });
      setTimeout(() => {
        onClose();
      }, 200);
    } else {
      // Snap back smoothly into bottom-right dock
      setDragOffset({ x: 0, y: 0 });
    }

    dragStartRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      style={{
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
        transition: (dragOffset.x === 0 && dragOffset.y === 0 && !isDragging && !isResizing)
          ? 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease-out'
          : isDismissing ? 'transform 0.2s ease-in, opacity 0.2s ease-in' : 'none',
        touchAction: 'none'
      }}
      className={`fixed bottom-16 sm:bottom-6 right-3 sm:right-6 z-40 select-none ${
        isDismissing ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'
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
            During active drag or resize, an overlay ensures YouTube never steals mouse/touch events!
          */}
          {(isResizing || isDragging) && (
            <div className="absolute inset-0 z-30 cursor-grabbing bg-transparent" />
          )}

          {/* ONE-THUMB CORNER RESIZE DRAG HANDLE (TOP-LEFT CORNER) */}
          <div
            onPointerDown={handleResizePointerDown}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            onPointerCancel={handleResizePointerUp}
            title="खींचकर छोटा या बड़ा करें (Resize handle)"
            aria-label="छोटा या बड़ा करें"
            className="no-drag absolute top-1.5 left-1.5 z-40 p-1.5 rounded-lg bg-black/85 hover:bg-red-600 border border-white/25 text-white/90 hover:text-white cursor-nwse-resize transition active:scale-95 shadow flex items-center justify-center pointer-events-auto touch-none"
          >
            <Scaling size={12} className="-rotate-90" />
          </div>

          {/* Top Controls & Drag Handle Bar */}
          <div 
            onPointerDown={handleDragPointerDown}
            onPointerMove={handleDragPointerMove}
            onPointerUp={handleDragPointerUp}
            onPointerCancel={handleDragPointerUp}
            onClick={handleCyclePresetSize}
            className="absolute top-0 left-8 right-0 h-10 px-2 flex items-center justify-between z-20 cursor-grab active:cursor-grabbing bg-gradient-to-b from-black/80 via-black/40 to-transparent"
            title="ड्रैग करके हटाएं (Swipe to dismiss) या डबल-टैप से साइज बदलें"
          >
            <div className="flex items-center gap-1.5 pointer-events-none">
              <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                LIVE TV
              </span>
              <div className="flex items-center text-white/40 group-hover:text-white/80 transition ml-0.5">
                <GripHorizontal size={14} />
              </div>
            </div>

            <div className="flex items-center gap-1.5 pointer-events-auto no-drag">
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
                title="वीडियो बंद करें (या किसी भी दिशा में स्वाइप करें)"
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

          {/* Bottom Mini Headline & Click to Scroll Up (Draggable surface + double tap) */}
          <div 
            onPointerDown={handleDragPointerDown}
            onPointerMove={handleDragPointerMove}
            onPointerUp={handleDragPointerUp}
            onPointerCancel={handleDragPointerUp}
            onClick={handleCyclePresetSize}
            className="p-2 bg-gradient-to-t from-black via-black/90 to-black/75 text-white cursor-grab active:cursor-grabbing hover:bg-slate-900 transition flex items-center justify-between gap-2 border-t border-white/10"
            title="खींचकर हटाएं (Swipe) या डबल-टैप से साइज बदलें"
          >
            <p className="text-[10.5px] font-bold truncate flex-1 leading-snug pointer-events-none">
              {video.title}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onExpand();
              }}
              className="no-drag text-[9px] text-red-400 font-bold shrink-0 hover:underline cursor-pointer"
            >
              बड़ा करें ⛶
            </button>
          </div>
        </div>
      </div>

      {/* 
        ULTRA-COMPACT FLOATING AUDIO PILL (COLLAPSED MODE)
        Can also be dragged to dismiss or tapped to restore.
      */}
      {isCollapsed && (
        <div 
          onPointerDown={handleDragPointerDown}
          onPointerMove={handleDragPointerMove}
          onPointerUp={handleDragPointerUp}
          onPointerCancel={handleDragPointerUp}
          className="flex items-center gap-2.5 px-3 py-2 bg-slate-950/95 backdrop-blur-md rounded-full border-2 border-red-600 shadow-2xl text-white w-[260px] sm:w-[290px] animate-in fade-in zoom-in-95 duration-200 cursor-grab active:cursor-grabbing"
          title="खींचकर हटाएं या वीडियो देखने के लिए टैप करें"
        >
          {/* Animated Equalizer Wave */}
          <div 
            onClick={() => setIsCollapsed(false)}
            className="no-drag flex items-end gap-0.5 h-3.5 px-1 shrink-0 cursor-pointer"
            title="वीडियो खोलें"
          >
            <span className="w-1 bg-red-500 rounded-full animate-bounce [animation-delay:0ms] h-full" />
            <span className="w-1 bg-red-500 rounded-full animate-bounce [animation-delay:150ms] h-2/3" />
            <span className="w-1 bg-red-500 rounded-full animate-bounce [animation-delay:300ms] h-4/5" />
          </div>

          {/* Title & Click to Restore */}
          <div 
            onClick={() => setIsCollapsed(false)}
            className="flex-1 min-w-0 cursor-pointer pointer-events-none"
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
          <div className="flex items-center gap-1 shrink-0 no-drag">
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
