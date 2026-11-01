import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Maximize2, Minimize2, ChevronDown, SkipForward, Scaling, GripHorizontal, Loader2 } from 'lucide-react';
import type { VideoBulletin } from '../types';
import { isDirectVideoUrl, getVideoThumbnail } from '../utils/mediaUtils';

type DockCorner = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

interface FloatingMiniPlayerProps {
  video: VideoBulletin;
  onClose: () => void;
  onExpand?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  activeTab?: string;
}

export const FloatingMiniPlayer: React.FC<FloatingMiniPlayerProps> = ({
  video,
  onClose,
  onExpand,
  onNext,
  hasNext = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Ultra-compact audio-pill mode (ideal when reading articles)
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Full Cinema Theater Mode (smoothly expands without iframe reload)
  const [isCinemaMode, setIsCinemaMode] = useState<boolean>(false);
  // Top header dismiss drop-zone detection
  const [isOverTopDismissZone, setIsOverTopDismissZone] = useState<boolean>(false);

  // Dynamic 4-Corner Dock Position
  const getInitialDock = (): DockCorner => {
    if (typeof window === 'undefined') return 'bottom-right';
    const saved = localStorage.getItem('anp_mini_player_dock') as DockCorner;
    if (saved && ['bottom-right', 'bottom-left', 'top-right', 'top-left'].includes(saved)) {
      return saved;
    }
    return 'bottom-right';
  };

  const [dockCorner, setDockCorner] = useState<DockCorner>(getInitialDock);

  // Dynamic Resizing State (Width clamped between 200px and 460px / screen width)
  const getInitialWidth = () => {
    if (typeof window === 'undefined') return 310;
    const maxSafe = Math.min(window.innerWidth - 24, 440);
    const saved = localStorage.getItem('anp_mini_player_width');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 200 && parsed <= maxSafe) {
        return parsed;
      }
    }
    return Math.min(310, maxSafe);
  };

  const [playerWidth, setPlayerWidth] = useState<number>(getInitialWidth);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);

  // Drag offset for real-time free-floating movement
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDismissing, setIsDismissing] = useState<boolean>(false);
  const [isPastDismissThreshold, setIsPastDismissThreshold] = useState<boolean>(false);

  // Tracking refs
  const dragStartRef = useRef<{ x: number; y: number; time: number; hasMoved: boolean } | null>(null);
  const resizeStartRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const lastTapRef = useRef<number>(0);

  // 1. HARD PREVENT BROWSER WHOLE-PAGE PINCH ZOOM ON MINI PLAYER
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

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
      const maxSafe = Math.min(window.innerWidth - 24, 440);
      setPlayerWidth(prev => Math.min(Math.max(prev, 200), maxSafe));
    };

    window.addEventListener('resize', handleWindowResize, { passive: true });
    window.addEventListener('orientationchange', handleWindowResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('orientationchange', handleWindowResize);
    };
  }, []);

  // 3. AUTO-COLLAPSE CINEMA MODE TO FLOATING PiP WHEN USER SCROLLS DOWN
  useEffect(() => {
    if (!isCinemaMode) return;
    const handleScroll = () => {
      if (window.scrollY > 250) {
        setIsCinemaMode(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isCinemaMode]);

  // Reset video loaded state when video changes
  useEffect(() => {
    setIsVideoLoaded(false);
  }, [video.youtubeId, video.youtubeUrl]);

  // Save preferred width to localStorage
  const saveWidth = useCallback((w: number) => {
    try {
      localStorage.setItem('anp_mini_player_width', Math.round(w).toString());
    } catch {}
  }, []);

  // Save dock position
  const saveDock = useCallback((dock: DockCorner) => {
    try {
      localStorage.setItem('anp_mini_player_dock', dock);
    } catch {}
  }, []);

  // Double-tap or double-click to cycle preset sizes: Small (240px) <-> Medium (310px) <-> Large (390px)
  const handleCyclePresetSize = (e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as HTMLElement)?.closest('button, a, input, .no-drag')) return;

    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      const maxSafe = Math.min(window.innerWidth - 24, 440);
      let nextWidth = 310;

      if (playerWidth < 270) {
        nextWidth = Math.min(320, maxSafe);
      } else if (playerWidth < 350 && maxSafe >= 370) {
        nextWidth = Math.min(390, maxSafe);
      } else {
        nextWidth = 230;
      }

      setPlayerWidth(nextWidth);
      saveWidth(nextWidth);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  // 3. ONE-THUMB CORNER RESIZE (TOP-LEFT GRIP)
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
    const isDockedLeft = dockCorner.includes('left');
    // If docked on left, dragging right increases width; if docked right, dragging left increases width
    const deltaX = isDockedLeft 
      ? e.clientX - resizeStartRef.current.startX
      : resizeStartRef.current.startX - e.clientX;
    const maxSafe = Math.min(window.innerWidth - 24, 440);
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

  // 4. UNIFIED FULL-SURFACE DRAG, DOCKING & DISMISS SYSTEM
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input, .no-drag')) return;

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
      hasMoved: false
    };
    setIsDragging(true);
    setIsOverTopDismissZone(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    const dist = Math.hypot(deltaX, deltaY);

    if (dist > 8) {
      dragStartRef.current.hasMoved = true;
    }

    setDragOffset({ x: deltaX, y: deltaY });

    // Dismiss check: Top header dismiss area (pointer near top: e.clientY < 110)
    const inTopZone = e.clientY < 110;
    setIsOverTopDismissZone(inTopZone);
    setIsPastDismissThreshold(inTopZone);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    setIsDragging(false);
    setIsPastDismissThreshold(false);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    const deltaTime = Date.now() - dragStartRef.current.time;
    const distance = Math.hypot(deltaX, deltaY);
    const speed = distance / Math.max(deltaTime, 1);

    // CASE A: TAP (Not dragged) -> Toggle Controls HUD
    if (!dragStartRef.current.hasMoved && deltaTime < 300) {
      setShowControls(prev => !prev);
      dragStartRef.current = null;
      setIsOverTopDismissZone(false);
      return;
    }

    // CASE B: DISMISS ONLY IF DROPPED IN TOP HEADER DISMISS ZONE OR FLICKED HARD UPWARDS
    const isTopDrop = isOverTopDismissZone || e.clientY < 110;
    const isUpwardFlick = deltaY < -130 && speed > 0.6;
    if (isTopDrop || isUpwardFlick) {
      setIsDismissing(true);
      setDragOffset({
        x: deltaX,
        y: -window.innerHeight
      });
      setTimeout(() => {
        onClose();
      }, 200);
      dragStartRef.current = null;
      setIsOverTopDismissZone(false);
      return;
    }

    // CASE C: 4-CORNER DOCKING (Any other normal drag snaps to nearest corner without closing!)
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const isLeft = centerX < window.innerWidth / 2;
      const isTop = centerY < window.innerHeight / 2;

      let newDock: DockCorner = 'bottom-right';
      if (isTop && isLeft) newDock = 'top-left';
      else if (isTop && !isLeft) newDock = 'top-right';
      else if (!isTop && isLeft) newDock = 'bottom-left';
      else newDock = 'bottom-right';

      setDockCorner(newDock);
      saveDock(newDock);
    }

    // Smoothly reset drag offset
    setDragOffset({ x: 0, y: 0 });
    dragStartRef.current = null;
    setIsOverTopDismissZone(false);
  };

  // Determine CSS positioning based on dockCorner
  const getDockClasses = (): string => {
    switch (dockCorner) {
      case 'bottom-left':
        return 'bottom-16 sm:bottom-6 left-3.5 sm:left-6';
      case 'top-right':
        return 'top-20 right-3 sm:right-6';
      case 'top-left':
        return 'top-20 left-3.5 sm:left-6';
      case 'bottom-right':
      default:
        return 'bottom-16 sm:bottom-6 right-3 sm:right-6';
    }
  };

  const handleToggleCinema = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsCinemaMode(prev => !prev);
    onExpand?.();
  };

  return (
    <>
      {/* 
        TOP HEADER DISMISS DROP ZONE (TRIGGERED ON DRAG)
        Shows a bright red circle with white cross icon and clear dismiss guide
      */}
      {isDragging && (
        <div 
          className={`fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-200 flex items-center gap-2.5 px-4 py-2 rounded-full shadow-2xl backdrop-blur-md border ${
            isOverTopDismissZone
              ? 'bg-red-600 border-white text-white scale-110 shadow-red-600/70 ring-4 ring-red-500/50 animate-pulse'
              : 'bg-slate-950/92 border-red-500/60 text-white shadow-black/80'
          }`}
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
            isOverTopDismissZone ? 'bg-white text-red-600' : 'bg-red-600 text-white shadow-md'
          }`}>
            <X size={16} className="stroke-[3]" />
          </div>
          <span className="text-xs font-black tracking-wide">
            {isOverTopDismissZone ? 'छोड़ते ही बंद होगा!' : 'बंद करने के लिए यहाँ छोड़ें'}
          </span>
        </div>
      )}

      {/* BACKDROP FOR CINEMA MODE */}
      {isCinemaMode && !isCollapsed && (
        <div 
          onClick={() => setIsCinemaMode(false)}
          className="fixed inset-0 z-45 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
        />
      )}

      <div
        ref={containerRef}
        style={{
          transform: isCinemaMode 
            ? 'none' 
            : `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) scale(${isDragging ? 1.02 : 1})`,
          transition: (dragOffset.x === 0 && dragOffset.y === 0 && !isDragging && !isResizing)
            ? 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease-out'
            : isDismissing ? 'transform 0.2s ease-in, opacity 0.2s ease-in' : 'none',
          touchAction: isCinemaMode ? 'auto' : 'none'
        }}
        className={isCinemaMode
          ? 'fixed inset-x-3 sm:inset-x-6 top-16 sm:top-20 z-50 max-w-4xl mx-auto select-none animate-in zoom-in-95 duration-200'
          : `fixed z-40 select-none ${getDockClasses()} ${
              isDismissing ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100'
            }`
        }
      >
        {/* 
          PERSISTENT VIDEO / AUDIO EMBED CONTAINER
          Kept mounted in both views so playback / audio NEVER pauses or reloads when collapsing/expanding.
        */}
        <div className={isCollapsed ? 'w-0 h-0 overflow-hidden opacity-0 pointer-events-none absolute' : 'w-full'}>
          <div 
            style={{ width: isCinemaMode ? '100%' : `${playerWidth}px` }}
            className={`relative rounded-2xl overflow-hidden shadow-2xl bg-black border-2 transition-colors duration-200 group ${
              isCinemaMode
                ? 'border-red-600 shadow-red-600/40 ring-2 ring-red-600/30'
                : isPastDismissThreshold 
                  ? 'border-red-500 shadow-red-600/60 ring-4 ring-red-500/50' 
                  : 'border-red-600 ring-2 ring-red-600/30'
            }`}
          >
            {/* ONE-THUMB CORNER RESIZE DRAG HANDLE (TOP-LEFT CORNER) */}
            {!isCinemaMode && (
              <div
                onPointerDown={handleResizePointerDown}
                onPointerMove={handleResizePointerMove}
                onPointerUp={handleResizePointerUp}
                onPointerCancel={handleResizePointerUp}
                title="खींचकर छोटा या बड़ा करें (Resize handle)"
                aria-label="छोटा या बड़ा करें"
                className="no-drag absolute top-1.5 left-1.5 z-40 p-1.5 rounded-lg bg-black/85 hover:bg-red-600 border border-white/25 text-white/90 hover:text-white cursor-nwse-resize transition active:scale-95 shadow flex items-center justify-center pointer-events-auto touch-none"
              >
                <Scaling size={11} className="-rotate-90" />
              </div>
            )}

            {/* TOP CONTROLS BAR (RESPONSIVE & CLEAN) */}
            <div 
              onClick={handleCyclePresetSize}
              className={`absolute top-0 left-0 right-0 h-9 px-2 flex items-center justify-between z-30 transition-opacity duration-200 bg-gradient-to-b from-black/85 via-black/45 to-transparent pointer-events-none ${
                showControls || isCinemaMode ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* Live TV Badge & Drag Grip */}
              <div className="flex items-center gap-1.5 ml-7">
                {(playerWidth >= 250 || isCinemaMode) && (
                  <span className="bg-red-600 text-white text-[8.5px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                    LIVE TV
                  </span>
                )}
                {!isCinemaMode && (
                  <div className="flex items-center text-white/50">
                    <GripHorizontal size={13} />
                  </div>
                )}
              </div>

              {/* Action Buttons (Strictly No-Drag so clicks are 100% instantaneous) */}
              <div className="flex items-center gap-1 pointer-events-auto no-drag">
                {/* Skip to Next Bulletin */}
                {onNext && hasNext && (playerWidth >= 280 || isCinemaMode) && (
                  <button
                    type="button"
                    onClick={onNext}
                    aria-label="अगला बुलेटिन देखें"
                    title="अगला बुलेटिन देखें"
                    className="p-1 bg-black/80 hover:bg-slate-700 text-white rounded-full border border-white/20 transition active:scale-95 cursor-pointer shadow"
                  >
                    <SkipForward size={11} />
                  </button>
                )}

                {/* Minimize to Audio Pill */}
                <button
                  type="button"
                  onClick={() => {
                    setIsCinemaMode(false);
                    setIsCollapsed(true);
                  }}
                  aria-label="ऑडियो मोड (छोटा करें)"
                  title="ऑडियो मोड (छोटा करें)"
                  className="p-1 bg-black/80 hover:bg-slate-700 text-white rounded-full border border-white/20 transition active:scale-95 cursor-pointer shadow"
                >
                  <ChevronDown size={11} />
                </button>

                {/* Cinema Mode Toggle (Expand / Shrink) */}
                <button
                  type="button"
                  onClick={handleToggleCinema}
                  aria-label={isCinemaMode ? "फ्लोटिंग मिनी-प्लेयर में बदलें" : "बड़ी स्क्रीन (सिनेमा मोड) में देखें"}
                  title={isCinemaMode ? "फ्लोटिंग मिनी-प्लेयर में बदलें" : "बड़ी स्क्रीन (सिनेमा मोड) में देखें"}
                  className="p-1 bg-black/80 hover:bg-slate-700 text-white rounded-full border border-white/20 transition active:scale-95 cursor-pointer shadow"
                >
                  {isCinemaMode ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
                </button>

                {/* Close Video button */}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="वीडियो बंद करें"
                  title="वीडियो बंद करें"
                  className="p-1 bg-black/80 hover:bg-red-600 text-white rounded-full border border-white/20 transition active:scale-95 cursor-pointer shadow"
                >
                  <X size={11} />
                </button>
              </div>
            </div>

            {/* 16:9 VIDEO CONTAINER WITH ZERO BLACK VOID & FULL-SURFACE DRAG */}
            <div className="relative aspect-video w-full bg-black overflow-hidden">
              {/* Poster Thumbnail + Spinner (Visible until iframe is fully active) */}
              {!isVideoLoaded && (
                <div className="absolute inset-0 z-0 bg-slate-950 flex items-center justify-center">
                  <img
                    src={getVideoThumbnail(video)}
                    alt=""
                    className="w-full h-full object-cover opacity-60 blur-xs"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
                  </div>
                </div>
              )}

              {/* Video Player */}
              {isDirectVideoUrl(video.youtubeUrl || video.youtubeId) ? (
                <video
                  src={video.youtubeUrl || video.youtubeId}
                  controls
                  autoPlay
                  playsInline
                  onLoadedData={() => setIsVideoLoaded(true)}
                  className="w-full h-full object-contain bg-black relative z-10"
                />
              ) : (
                <iframe
                  onLoad={() => setIsVideoLoaded(true)}
                  src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1&playsinline=1`}
                  title={video.title}
                  className="w-full h-full border-0 relative z-10"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              )}

              {/* 
                FULL-SURFACE TOUCH & DRAG TRANSPARENT OVERLAY:
                Intercepts touches across 100% of the video box!
                Tap toggles controls; Drag floats/flicks the player.
                Only active when in floating PiP mode (not in Cinema mode).
              */}
              {!isCinemaMode && (
                <div
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  className="absolute inset-0 z-20 cursor-grab active:cursor-grabbing bg-transparent"
                  title="खींचकर किसी भी कोने में ले जाएं या ऊपर ले जाकर बंद करें"
                />
              )}
            </div>

            {/* BOTTOM TITLE BAR & CLICK TO EXPAND */}
            <div 
              onClick={handleCyclePresetSize}
              className="p-1.5 px-2 bg-gradient-to-t from-black via-black/95 to-black/80 text-white flex items-center justify-between gap-1.5 border-t border-white/10"
              title="क्लिक करके बड़ा करें या डबल-टैप से साइज बदलें"
            >
              <p className="text-[10px] font-bold truncate flex-1 leading-tight pointer-events-none">
                {video.title}
              </p>
              <button
                type="button"
                onClick={handleToggleCinema}
                className="no-drag text-[8.5px] text-red-400 font-bold shrink-0 hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <span>{isCinemaMode ? 'छोटा करें' : 'बड़ा करें'}</span>
                <span>{isCinemaMode ? '↙' : '⛶'}</span>
              </button>
            </div>
          </div>
        </div>

      {/* 
        ULTRA-COMPACT FLOATING AUDIO PILL (COLLAPSED MODE)
        Can also be dragged across the 4 corners or dismissed.
      */}
      {isCollapsed && (
        <div 
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`flex items-center gap-2 px-3 py-1.5 bg-slate-950/95 backdrop-blur-md rounded-full border-2 shadow-2xl text-white w-[250px] sm:w-[280px] animate-in fade-in zoom-in-95 duration-200 cursor-grab active:cursor-grabbing transition-colors ${
            isPastDismissThreshold 
              ? 'border-red-500 shadow-red-600/60 ring-2 ring-red-500' 
              : 'border-red-600'
          }`}
          title="खींचकर हटाएं या वीडियो देखने के लिए टैप करें"
        >
          {/* Animated Equalizer Wave */}
          <div 
            onClick={() => setIsCollapsed(false)}
            className="no-drag flex items-end gap-0.5 h-3 px-1 shrink-0 cursor-pointer"
            title="वीडियो खोलें"
          >
            <span className="w-0.5 bg-red-500 rounded-full animate-bounce [animation-delay:0ms] h-full" />
            <span className="w-0.5 bg-red-500 rounded-full animate-bounce [animation-delay:150ms] h-2/3" />
            <span className="w-0.5 bg-red-500 rounded-full animate-bounce [animation-delay:300ms] h-4/5" />
          </div>

          {/* Title & Click to Restore */}
          <div 
            onClick={() => setIsCollapsed(false)}
            className="flex-1 min-w-0 cursor-pointer pointer-events-none"
          >
            <p className="text-[9.5px] font-bold text-white truncate leading-tight">
              {video.title}
            </p>
            <span className="text-[8px] text-red-400 font-medium">● लाइव ऑडियो चालू</span>
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
                <SkipForward size={11} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              aria-label="वीडियो खोलें"
              title="वीडियो खोलें"
              className="p-1 hover:bg-slate-800 text-slate-200 hover:text-white rounded-full transition active:scale-95 cursor-pointer"
            >
              <Maximize2 size={11} />
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="बंद करें"
              title="बंद करें"
              className="p-1 hover:bg-red-600 text-slate-200 hover:text-white rounded-full transition active:scale-95 cursor-pointer"
            >
              <X size={11} />
            </button>
          </div>
        </div>
      )}
      </div>
    </>
  );
};
