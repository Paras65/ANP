import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Maximize2, Minimize2, ChevronDown, SkipForward, Scaling, GripHorizontal, Loader2, RotateCw, Play, Pause } from 'lucide-react';
import type { VideoBulletin } from '../types';
import { isDirectVideoUrl, getVideoThumbnail } from '../utils/mediaUtils';

interface FloatingMiniPlayerProps {
  video: VideoBulletin;
  onClose: () => void;
  onExpand?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  activeTab?: string;
  isPausedByModal?: boolean;
}

export const FloatingMiniPlayer: React.FC<FloatingMiniPlayerProps> = ({
  video,
  onClose,
  onExpand,
  onNext,
  hasNext = false,
  activeTab = 'home',
  isPausedByModal = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoElementRef = useRef<HTMLVideoElement>(null);
  const hasManuallyMinimizedRef = useRef<boolean>(false);

  // Ultra-compact audio-pill mode (ideal when reading articles)
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Full Cinema Theater Mode (smoothly expands without iframe reload)
  const [isCinemaMode, setIsCinemaMode] = useState<boolean>(false);
  // Fullscreen Landscape Rotate Mode
  const [isLandscapeRotated, setIsLandscapeRotated] = useState<boolean>(false);
  // Bottom dismiss drop-zone detection (users swipe down to dismiss)
  const [isOverBottomDismissZone, setIsOverBottomDismissZone] = useState<boolean>(false);

  // Dynamic Resizing State (Width clamped between 200px and 440px / screen width)
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

  // Persistent Free-Floating Position (Stays exactly where dropped, clamped safely within screen bounds)
  const getInitialPosition = (): { x: number; y: number } => {
    if (typeof window === 'undefined') return { x: 16, y: 100 };
    const width = 310;
    const height = Math.round(width * 0.5625) + 32;
    const defaultX = Math.max(12, window.innerWidth - width - 16);
    const defaultY = Math.max(76, window.innerHeight - height - 84);
    const saved = localStorage.getItem('anp_mini_player_pos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          const clampedX = Math.min(Math.max(parsed.x, 8), Math.max(8, window.innerWidth - width - 8));
          const clampedY = Math.min(Math.max(parsed.y, 68), Math.max(68, window.innerHeight - height - 76));
          return { x: clampedX, y: clampedY };
        }
      } catch {}
    }
    return { x: defaultX, y: defaultY };
  };

  const [position, setPosition] = useState<{ x: number; y: number }>(getInitialPosition);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showControls, setShowControls] = useState<boolean>(true);

  // Auto-hide HUD timer (3.5 seconds)
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetControlsTimer = useCallback(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3500);
  }, []);

  // Direct 1-Tap Play / Pause Controller
  const handleTogglePlayPause = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsPlaying(prev => {
      const next = !prev;
      if (next) {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        }
        if (videoElementRef.current) {
          videoElementRef.current.play().catch(() => {});
        }
        resetControlsTimer();
      } else {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        }
        if (videoElementRef.current) {
          videoElementRef.current.pause();
        }
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        setShowControls(true);
      }
      return next;
    });
  }, [resetControlsTimer]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Drag offset for real-time free-floating movement
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDismissing, setIsDismissing] = useState<boolean>(false);
  const [isPastDismissThreshold, setIsPastDismissThreshold] = useState<boolean>(false);

  // Tracking refs
  const dragStartRef = useRef<{ 
    startPointerX: number; 
    startPointerY: number; 
    startPosX: number; 
    startPosY: number; 
    time: number; 
    hasMoved: boolean 
  } | null>(null);
  const resizeStartRef = useRef<{ startX: number; startWidth: number; startPosX: number } | null>(null);

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

      setPosition(prev => {
        const currentWidth = isCollapsed ? 260 : playerWidth;
        const playerHeight = isCollapsed ? 44 : Math.round(playerWidth * 0.5625) + 32;
        const minX = 8;
        const maxX = Math.max(8, window.innerWidth - currentWidth - 8);
        const minY = 68;
        const maxY = Math.max(68, window.innerHeight - playerHeight - 76);
        return {
          x: Math.min(Math.max(prev.x, minX), maxX),
          y: Math.min(Math.max(prev.y, minY), maxY)
        };
      });
    };

    window.addEventListener('resize', handleWindowResize, { passive: true });
    window.addEventListener('orientationchange', handleWindowResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('orientationchange', handleWindowResize);
    };
  }, [playerWidth, isCollapsed]);

  // FULLSCREEN CHANGE LISTENER FOR ROTATE MODE
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        setIsLandscapeRotated(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 3. AUTO-CINEMA SCROLL FLOW ON VIDEOS TAB (Top = Cinema, Scrolled = Floating)
  useEffect(() => {
    hasManuallyMinimizedRef.current = false;
    if (activeTab === 'videos' && window.scrollY < 180 && !isCollapsed) {
      setIsCinemaMode(true);
    } else if (activeTab !== 'videos') {
      setIsCinemaMode(false);
    }
  }, [activeTab, video.id, video.youtubeId, isCollapsed]);

  // 4. SCROLL LISTENER: COLLAPSE TO FLOATING ON SCROLL DOWN, EXPAND BACK ON SCROLL TOP
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = Math.max(0, window.scrollY);
      if (isCinemaMode && scrollY > 260) {
        setIsCinemaMode(false); // smoothly shrink down to corner
      } else if (
        !isCinemaMode && 
        activeTab === 'videos' && 
        scrollY < 120 && 
        !isCollapsed && 
        !isDragging && 
        !hasManuallyMinimizedRef.current
      ) {
        setIsCinemaMode(true); // smoothly expand back to cinema view at top
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isCinemaMode, activeTab, isCollapsed, isDragging]);

  // 5. SMART PAUSE/RESUME ON REEL / STORY MODAL (WITHOUT UNMOUNTING IFRAME)
  useEffect(() => {
    if (isPausedByModal) {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      }
      if (videoElementRef.current) {
        videoElementRef.current.pause();
      }
    } else {
      if (isPlaying) {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        }
        if (videoElementRef.current) {
          videoElementRef.current.play().catch(() => {});
        }
      }
    }
  }, [isPausedByModal, isPlaying]);

  // Reset video loaded and play state when video changes
  useEffect(() => {
    setIsVideoLoaded(false);
    setIsPlaying(true);
    setShowControls(true);
    resetControlsTimer();
  }, [video.id, video.youtubeId, video.youtubeUrl, resetControlsTimer]);

  // Save preferred width to localStorage
  const saveWidth = useCallback((w: number) => {
    try {
      localStorage.setItem('anp_mini_player_width', Math.round(w).toString());
    } catch {}
  }, []);

  // Save position to localStorage
  const savePosition = useCallback((pos: { x: number; y: number }) => {
    try {
      localStorage.setItem('anp_mini_player_pos', JSON.stringify(pos));
    } catch {}
  }, []);



  // 3. ONE-THUMB CORNER RESIZE (TOP-LEFT GRIP)
  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsResizing(true);
    resizeStartRef.current = {
      startX: e.clientX,
      startWidth: playerWidth,
      startPosX: position.x
    };
  };

  const handleResizePointerMove = (e: React.PointerEvent) => {
    if (!isResizing || !resizeStartRef.current) return;
    const isRightSide = position.x > (window.innerWidth - playerWidth) / 2;
    const deltaX = isRightSide 
      ? resizeStartRef.current.startX - e.clientX
      : e.clientX - resizeStartRef.current.startX;
    const maxSafe = Math.min(window.innerWidth - 24, 440);
    const newWidth = Math.min(Math.max(resizeStartRef.current.startWidth + deltaX, 200), maxSafe);
    setPlayerWidth(newWidth);

    if (isRightSide) {
      const newX = Math.max(8, resizeStartRef.current.startPosX - (newWidth - resizeStartRef.current.startWidth));
      setPosition(prev => ({ ...prev, x: newX }));
    }
  };

  const handleResizePointerUp = (e: React.PointerEvent) => {
    if (!isResizing) return;
    setIsResizing(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    saveWidth(playerWidth);
    savePosition(position);
    resizeStartRef.current = null;
  };

  // 4. UNIFIED FULL-SURFACE DRAG, FREE-PLACEMENT & BOTTOM DISMISS SYSTEM
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input, .no-drag')) return;

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    dragStartRef.current = {
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
      time: Date.now(),
      hasMoved: false
    };
    setIsDragging(true);
    setIsOverBottomDismissZone(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.startPointerX;
    const deltaY = e.clientY - dragStartRef.current.startPointerY;
    const dist = Math.hypot(deltaX, deltaY);

    if (dist > 18) {
      dragStartRef.current.hasMoved = true;
    }

    setDragOffset({ x: deltaX, y: deltaY });

    // Dismiss check: pointer near bottom of screen OR dragged far down
    const inBottomZone = e.clientY > window.innerHeight - 110 || deltaY > 160;
    setIsOverBottomDismissZone(inBottomZone);
    setIsPastDismissThreshold(inBottomZone);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    setIsDragging(false);
    setIsPastDismissThreshold(false);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const deltaX = e.clientX - dragStartRef.current.startPointerX;
    const deltaY = e.clientY - dragStartRef.current.startPointerY;
    const deltaTime = Date.now() - dragStartRef.current.time;
    const distance = Math.hypot(deltaX, deltaY);
    const speed = distance / Math.max(deltaTime, 1);

    // CASE A: TAP (Not dragged) -> Toggle Controls HUD
    if (!dragStartRef.current.hasMoved && deltaTime < 350) {
      setShowControls(prev => {
        const next = !prev;
        if (next) resetControlsTimer();
        return next;
      });
      dragStartRef.current = null;
      setIsOverBottomDismissZone(false);
      return;
    }

    // CASE B: DISMISS ONLY IF DROPPED IN BOTTOM DISMISS ZONE OR FLICKED DOWNWARDS
    const isBottomDrop = isOverBottomDismissZone || e.clientY > window.innerHeight - 110;
    const isDownwardFlick = deltaY > 90 && speed > 0.45;
    if (isBottomDrop || isDownwardFlick) {
      setIsDismissing(true);
      setDragOffset({
        x: deltaX,
        y: deltaY + window.innerHeight
      });
      setTimeout(() => {
        onClose();
      }, 200);
      dragStartRef.current = null;
      setIsOverBottomDismissZone(false);
      return;
    }

    // CASE C: FREE POSITIONING (Stay exactly where released, clamped safely within screen bounds)
    const currentWidth = isCollapsed ? 260 : playerWidth;
    const playerHeight = isCollapsed ? 44 : Math.round(playerWidth * 0.5625) + 32;
    const minX = 8;
    const maxX = Math.max(8, window.innerWidth - currentWidth - 8);
    const minY = 68;
    const maxY = Math.max(68, window.innerHeight - playerHeight - 76);

    const targetX = dragStartRef.current.startPosX + deltaX;
    const targetY = dragStartRef.current.startPosY + deltaY;

    const finalX = Math.min(Math.max(targetX, minX), maxX);
    const finalY = Math.min(Math.max(targetY, minY), maxY);

    setPosition({ x: finalX, y: finalY });
    savePosition({ x: finalX, y: finalY });

    setDragOffset({ x: 0, y: 0 });
    dragStartRef.current = null;
    setIsOverBottomDismissZone(false);
  };

  const handleToggleCinema = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsCinemaMode(prev => {
      const next = !prev;
      hasManuallyMinimizedRef.current = !next;
      return next;
    });
    setIsLandscapeRotated(false);
    onExpand?.();
  };

  const handleToggleRotate = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isLandscapeRotated) {
      if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
        try {
          if (document.exitFullscreen) await document.exitFullscreen();
          else if ((document as any).webkitExitFullscreen) await (document as any).webkitExitFullscreen();
        } catch {}
      }
      try {
        await (screen.orientation as any)?.unlock?.();
      } catch {}
      setIsLandscapeRotated(false);
      return;
    }

    try {
      const target = containerRef.current || document.documentElement;
      if (target.requestFullscreen) {
        await target.requestFullscreen();
      } else if ((target as any).webkitRequestFullscreen) {
        await (target as any).webkitRequestFullscreen();
      }
      try {
        await (screen.orientation as any)?.lock?.('landscape');
      } catch {}
    } catch {}

    setIsLandscapeRotated(true);
    setIsCinemaMode(false);
    setIsCollapsed(false);
  };

  return (
    <>
      {/* 
        BOTTOM DISMISS DROP ZONE (TRIGGERED ON DRAG DOWN)
        Shows a bright red circle with white cross icon and clear dismiss guide
      */}
      {isDragging && !isCinemaMode && !isLandscapeRotated && (
        <div 
          className={`fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-200 flex items-center gap-2.5 px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-md border ${
            isOverBottomDismissZone
              ? 'bg-red-600 border-white text-white scale-110 shadow-red-600/70 ring-4 ring-red-500/50 animate-pulse'
              : 'bg-slate-950/95 border-red-500/60 text-white shadow-black/80'
          }`}
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
            isOverBottomDismissZone ? 'bg-white text-red-600' : 'bg-red-600 text-white shadow-md'
          }`}>
            <X size={16} className="stroke-[3]" />
          </div>
          <span className="text-xs font-black tracking-wide">
            {isOverBottomDismissZone ? 'छोड़ते ही बंद होगा!' : 'बंद करने के लिए नीचे छोड़ें'}
          </span>
        </div>
      )}

      {/* BACKDROP FOR CINEMA OR ROTATE MODE */}
      {(isCinemaMode || isLandscapeRotated) && !isCollapsed && (
        <div 
          onClick={() => {
            setIsCinemaMode(false);
            if (isLandscapeRotated) handleToggleRotate();
          }}
          className="fixed inset-0 z-45 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
        />
      )}

      <div
        ref={containerRef}
        style={
          isLandscapeRotated
            ? { transform: 'none', touchAction: 'auto' }
            : isCinemaMode
              ? { transform: 'none', touchAction: 'auto' }
              : {
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) scale(${isDragging ? 1.02 : 1})`,
                  transition: (dragOffset.x === 0 && dragOffset.y === 0 && !isDragging && !isResizing)
                    ? 'transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease-out'
                    : isDismissing ? 'transform 0.2s ease-in, opacity 0.2s ease-in' : 'none',
                  touchAction: 'none'
                }
        }
        className={isPausedByModal
          ? 'opacity-0 pointer-events-none absolute -z-50'
          : isLandscapeRotated
            ? 'fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden'
            : isCinemaMode
              ? 'fixed inset-x-3 sm:inset-x-6 top-16 sm:top-20 z-50 max-w-4xl mx-auto select-none animate-in zoom-in-95 duration-200'
              : `fixed z-40 select-none ${
                  isDismissing ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100'
                }`
        }
      >
        {/* 
          PERSISTENT VIDEO / AUDIO EMBED CONTAINER
          Kept mounted in both views so playback / audio NEVER pauses or reloads when collapsing/expanding.
        */}
        <div 
          style={
            isLandscapeRotated && (typeof window !== 'undefined' && window.innerWidth < window.innerHeight)
              ? {
                  width: `${window.innerHeight}px`,
                  height: `${window.innerWidth}px`,
                  transform: 'rotate(90deg)',
                  transformOrigin: 'center center'
                }
              : undefined
          }
          className={isCollapsed ? 'w-0 h-0 overflow-hidden opacity-0 pointer-events-none absolute' : 'w-full h-full flex flex-col justify-center'}
        >
          <div 
            style={{ width: (isCinemaMode || isLandscapeRotated) ? '100%' : `${playerWidth}px` }}
            className={`relative rounded-2xl overflow-hidden shadow-2xl bg-black border-2 transition-colors duration-200 group ${
              isCinemaMode || isLandscapeRotated
                ? 'border-red-600 shadow-red-600/40 ring-2 ring-red-600/30'
                : isPastDismissThreshold 
                  ? 'border-red-500 shadow-red-600/60 ring-4 ring-red-500/50' 
                  : 'border-red-600 ring-2 ring-red-600/30'
            }`}
          >
            {/* ONE-THUMB CORNER RESIZE DRAG HANDLE (TOP-LEFT CORNER) */}
            {!isCinemaMode && !isLandscapeRotated && (
              <div
                onPointerDown={handleResizePointerDown}
                onPointerMove={handleResizePointerMove}
                onPointerUp={handleResizePointerUp}
                onPointerCancel={handleResizePointerUp}
                title="खींचकर छोटा या बड़ा करें (Resize handle)"
                aria-label="छोटा या बड़ा करें"
                className="no-drag absolute top-1.5 left-1.5 z-40 w-6 h-6 rounded-md bg-black/85 hover:bg-red-600 border border-white/30 text-white/90 hover:text-white cursor-nwse-resize transition active:scale-90 shadow flex items-center justify-center pointer-events-auto touch-none"
              >
                <Scaling size={12} className="-rotate-90" />
              </div>
            )}

            {/* TOP CONTROLS BAR (RESPONSIVE & CLEAN) */}
            <div 
              className={`absolute top-0 left-0 right-0 h-9 px-2 flex items-center justify-between z-30 transition-opacity duration-200 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-none ${
                showControls || !isPlaying || isCinemaMode || isLandscapeRotated ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* Live TV Badge & Drag Grip */}
              <div className="flex items-center gap-1.5 ml-7">
                {(playerWidth >= 260 || isCinemaMode || isLandscapeRotated) && (
                  <span className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                    LIVE TV
                  </span>
                )}
                {!isCinemaMode && !isLandscapeRotated && (
                  <div className="flex items-center text-white/50" title="फ्लोटिंग प्लेयर">
                    <GripHorizontal size={13} />
                  </div>
                )}
              </div>

              {/* Action Buttons (Strictly No-Drag so clicks are 100% instantaneous) */}
              <div className="flex items-center gap-1 pointer-events-auto no-drag">
                {/* Skip to Next Bulletin */}
                {onNext && hasNext && (playerWidth >= 290 || isCinemaMode || isLandscapeRotated) && (
                  <button
                    type="button"
                    onClick={onNext}
                    aria-label="अगला बुलेटिन देखें"
                    title="अगला बुलेटिन देखें"
                    className="w-7 h-7 rounded-full bg-black/85 hover:bg-slate-700 text-white border border-white/20 transition active:scale-90 cursor-pointer shadow flex items-center justify-center"
                  >
                    <SkipForward size={12} />
                  </button>
                )}

                {/* Minimize to Audio Pill */}
                <button
                  type="button"
                  onClick={() => {
                    setIsCinemaMode(false);
                    setIsLandscapeRotated(false);
                    setIsCollapsed(true);
                  }}
                  aria-label="ऑडियो मोड (छोटा करें)"
                  title="ऑडियो मोड (छोटा करें)"
                  className="w-7 h-7 rounded-full bg-black/85 hover:bg-slate-700 text-white border border-white/20 transition active:scale-90 cursor-pointer shadow flex items-center justify-center"
                >
                  <ChevronDown size={12} />
                </button>

                {/* Rotate to Landscape Fullscreen Button */}
                {(playerWidth >= 280 || isCinemaMode || isLandscapeRotated) && (
                  <button
                    type="button"
                    onClick={handleToggleRotate}
                    aria-label={isLandscapeRotated ? "सीधा करें (Exit Rotate)" : "रोटेट मोड (Landscape Fullscreen)"}
                    title={isLandscapeRotated ? "सीधा करें (Exit Rotate)" : "रोटेट मोड (Landscape Fullscreen)"}
                    className={`w-7 h-7 rounded-full border transition active:scale-90 cursor-pointer shadow flex items-center justify-center ${
                      isLandscapeRotated 
                        ? 'bg-red-600 text-white border-white animate-pulse' 
                        : 'bg-black/85 hover:bg-slate-700 text-white border-white/20'
                    }`}
                  >
                    <RotateCw size={12} className={isLandscapeRotated ? "rotate-90 transition-transform" : ""} />
                  </button>
                )}

                {/* Cinema Mode Toggle (Expand / Shrink) */}
                <button
                  type="button"
                  onClick={handleToggleCinema}
                  aria-label={isCinemaMode ? "फ्लोटिंग मिनी-प्लेयर में बदलें" : "बड़ी स्क्रीन (सिनेमा मोड) में देखें"}
                  title={isCinemaMode ? "फ्लोटिंग मिनी-प्लेयर में बदलें" : "बड़ी स्क्रीन (सिनेमा मोड) में देखें"}
                  className="w-7 h-7 rounded-full bg-black/85 hover:bg-slate-700 text-white border border-white/20 transition active:scale-90 cursor-pointer shadow flex items-center justify-center"
                >
                  {isCinemaMode ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                </button>

                {/* Close Video button */}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="वीडियो बंद करें"
                  title="वीडियो बंद करें"
                  className="w-7 h-7 rounded-full bg-red-600/95 hover:bg-red-500 text-white border border-white/30 transition active:scale-90 cursor-pointer shadow flex items-center justify-center"
                >
                  <X size={13} className="stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* 16:9 VIDEO CONTAINER WITH ZERO BLACK VOID & FULL-SURFACE DRAG */}
            <div className={`relative ${isLandscapeRotated ? 'w-full h-full flex items-center justify-center' : 'aspect-video w-full'} bg-black overflow-hidden`}>
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
                  ref={videoElementRef}
                  src={video.youtubeUrl || video.youtubeId}
                  controls={isCinemaMode || isLandscapeRotated}
                  autoPlay
                  playsInline
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onLoadedData={() => setIsVideoLoaded(true)}
                  className="w-full h-full object-contain bg-black relative z-10"
                />
              ) : (
                <iframe
                  ref={iframeRef}
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
                Intercepts touches across 100% of the video box in Floating PiP mode!
                Tap toggles controls; Drag floats/flicks the player.
              */}
              {!isCinemaMode && !isLandscapeRotated && (
                <div
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  className="absolute inset-0 z-20 cursor-grab active:cursor-grabbing bg-transparent"
                  title="खींचकर कहीं भी रखें या नीचे ले जाकर बंद करें"
                />
              )}

              {/* 
                BIG CENTER PLAY / PAUSE BUTTON (PROPORTIONAL & RESPONSIVE)
                Sits at z-30 with pointer-events-auto, instantly clickable!
              */}
              {(showControls || !isPlaying) && !isCollapsed && (
                <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none bg-black/35 backdrop-blur-[1px] transition-opacity duration-200">
                  <button
                    type="button"
                    onClick={handleTogglePlayPause}
                    aria-label={isPlaying ? "वीडियो रोकें (Pause)" : "वीडियो चलाएं (Play)"}
                    title={isPlaying ? "वीडियो रोकें (Pause)" : "वीडियो चलाएं (Play)"}
                    className={`no-drag pointer-events-auto rounded-full bg-red-600/95 hover:bg-red-500 text-white shadow-2xl flex items-center justify-center transition-transform active:scale-90 border-2 border-white/40 cursor-pointer animate-in zoom-in-75 duration-150 ${
                      isCinemaMode || isLandscapeRotated 
                        ? 'w-14 h-14 sm:w-16 sm:h-16' 
                        : 'w-10 h-10 sm:w-11 sm:h-11 shadow-red-950/80'
                    }`}
                  >
                    {isPlaying ? (
                      <Pause size={isCinemaMode || isLandscapeRotated ? 24 : 18} className="fill-current text-white" />
                    ) : (
                      <Play size={isCinemaMode || isLandscapeRotated ? 24 : 18} className="fill-current text-white ml-0.5" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* BOTTOM TITLE BAR WITH DIRECT 1-TAP CONTROLS */}
            <div 
              className="p-1 px-2 bg-gradient-to-t from-black via-black/95 to-black/80 text-white flex items-center justify-between gap-1.5 border-t border-white/10 z-30 relative"
            >
              <p className="text-[10px] font-bold truncate flex-1 leading-tight select-none">
                {video.title}
              </p>
              <div className="flex items-center gap-1 shrink-0 no-drag">
                {/* 1-Tap Play / Pause Button */}
                <button
                  type="button"
                  onClick={handleTogglePlayPause}
                  className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[8.5px] font-bold flex items-center gap-1 cursor-pointer transition active:scale-95 border border-white/15"
                  title={isPlaying ? "रोकें (Pause)" : "चलाएं (Play)"}
                >
                  {isPlaying ? <Pause size={9} /> : <Play size={9} />}
                  <span>{isPlaying ? 'रोकें' : 'प्ले'}</span>
                </button>

                {/* Rotate Button */}
                <button
                  type="button"
                  onClick={handleToggleRotate}
                  className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-amber-300 hover:text-amber-200 text-[8.5px] font-bold flex items-center gap-1 cursor-pointer transition active:scale-95 border border-white/15"
                  title="रोटेट मोड (Landscape)"
                >
                  <RotateCw size={9} />
                  <span>रोटेट</span>
                </button>

                {/* Cinema / Expand Button */}
                <button
                  type="button"
                  onClick={handleToggleCinema}
                  className="px-1.5 py-0.5 rounded bg-red-600/30 hover:bg-red-600/50 text-red-300 hover:text-white text-[8.5px] font-bold flex items-center gap-1 cursor-pointer transition active:scale-95 border border-red-500/30"
                  title={isCinemaMode ? "छोटा करें" : "बड़ा करें"}
                >
                  <span>{isCinemaMode ? '↙ छोटा' : '⛶ बड़ा'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      {/* 
        ULTRA-COMPACT FLOATING AUDIO PILL (COLLAPSED MODE)
      */}
      {isCollapsed && (
        <div 
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`flex items-center gap-2 px-3 py-1.5 bg-slate-950/95 backdrop-blur-md rounded-full border-2 shadow-2xl text-white w-[260px] sm:w-[290px] animate-in fade-in zoom-in-95 duration-200 cursor-grab active:cursor-grabbing transition-colors ${
            isPastDismissThreshold 
              ? 'border-red-500 shadow-red-600/60 ring-2 ring-red-500' 
              : 'border-red-600'
          }`}
          title="खींचकर हटाएं या वीडियो देखने के लिए टैप करें"
        >
          {/* Animated Equalizer Wave / Play Pause */}
          <div 
            onClick={handleTogglePlayPause}
            className="no-drag flex items-end gap-0.5 h-3 px-1 shrink-0 cursor-pointer"
            title={isPlaying ? "ऑडियो रोकें" : "ऑडियो चलाएं"}
          >
            <span className={`w-0.5 bg-red-500 rounded-full ${isPlaying ? 'animate-bounce [animation-delay:0ms] h-full' : 'h-1.5'}`} />
            <span className={`w-0.5 bg-red-500 rounded-full ${isPlaying ? 'animate-bounce [animation-delay:150ms] h-2/3' : 'h-1'}`} />
            <span className={`w-0.5 bg-red-500 rounded-full ${isPlaying ? 'animate-bounce [animation-delay:300ms] h-4/5' : 'h-2'}`} />
          </div>

          {/* Title & Click to Restore */}
          <div 
            onClick={() => setIsCollapsed(false)}
            className="flex-1 min-w-0 cursor-pointer pointer-events-none"
          >
            <p className="text-[9.5px] font-bold text-white truncate leading-tight">
              {video.title}
            </p>
            <span className="text-[8px] text-red-400 font-medium">
              {isPlaying ? '● लाइव ऑडियो चालू' : '❚❚ ऑडियो रुका हुआ'}
            </span>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-1.5 shrink-0 no-drag">
            {/* Play/Pause in Audio Pill */}
            <button
              type="button"
              onClick={handleTogglePlayPause}
              aria-label={isPlaying ? "रोकें" : "चलाएं"}
              title={isPlaying ? "रोकें" : "चलाएं"}
              className="w-7 h-7 flex items-center justify-center hover:bg-slate-800 text-white rounded-full transition active:scale-95 cursor-pointer"
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
            </button>

            {onNext && hasNext && (
              <button
                type="button"
                onClick={onNext}
                aria-label="अगला बुलेटिन"
                title="अगला बुलेटिन"
                className="w-7 h-7 flex items-center justify-center hover:bg-slate-800 text-slate-200 hover:text-white rounded-full transition active:scale-95 cursor-pointer"
              >
                <SkipForward size={12} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              aria-label="वीडियो खोलें"
              title="वीडियो खोलें"
              className="w-7 h-7 flex items-center justify-center hover:bg-slate-800 text-slate-200 hover:text-white rounded-full transition active:scale-95 cursor-pointer"
            >
              <Maximize2 size={12} />
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="बंद करें"
              title="बंद करें"
              className="w-7 h-7 flex items-center justify-center hover:bg-red-600 text-slate-200 hover:text-white rounded-full transition active:scale-95 cursor-pointer"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}
      </div>
    </>
  );
};
