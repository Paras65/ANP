import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Volume2, 
  VolumeX, 
  ChevronUp, 
  ChevronDown, 
  Play, 
  Send, 
  Music, 
  Disc 
} from 'lucide-react';
import type { InstagramPost } from '../types';
import { InstagramIcon, WhatsAppIcon } from './SocialIcons';
import { SOCIAL_LINKS } from '../data/mockData';

interface ReelsViewerModalProps {
  initialPostId: string;
  posts: InstagramPost[];
  onClose: () => void;
  onShareWhatsApp: (caption: string, postUrl?: string) => void;
}

interface Comment {
  id: string;
  user: string;
  text: string;
  time: string;
  avatar: string;
}

const INITIAL_COMMENTS: Comment[] = [
  { id: 'c1', user: 'राकेश साहू (कवर्धा)', text: 'कवर्धा की सच्ची व निष्पक्ष आवाज! जय भोरमदेव बाबा 🙏', time: '1h', avatar: '👨‍🌾' },
  { id: 'c2', user: 'सुनील चंद्रवंशी', text: 'चिल्फी घाटी का दृश्य सच में बहुत मनमोहक है। बेहतरीन कवरेज!', time: '2h', avatar: '🏔️' },
  { id: 'c3', user: 'मंडी व्यापारी संघ', text: 'गुड़ मंडी के सही भाव बताने के लिए धन्यवाद अंबिशन न्यूज़।', time: '3h', avatar: '🌾' },
  { id: 'c4', user: 'दीपक वर्मा', text: 'ग्राउंड रिपोर्टिंग हमेशा नंबर 1 रहती है आप लोगों की!', time: '5h', avatar: '📱' }
];

export const ReelsViewerModal: React.FC<ReelsViewerModalProps> = ({
  initialPostId,
  posts,
  onClose,
  onShareWhatsApp
}) => {
  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = posts.findIndex(p => p.id === initialPostId);
    return idx >= 0 ? idx : 0;
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('anp_liked_reels');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    posts.forEach(p => {
      map[p.id] = parseInt(p.likes.replace(/[^0-9]/g, '')) || 1200;
    });
    return map;
  });
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('anp_bookmarked_reels');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [isFollowing, setIsFollowing] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState<Comment[]>(() => {
    try {
      const saved = localStorage.getItem('anp_reel_comments');
      return saved ? JSON.parse(saved) : INITIAL_COMMENTS;
    } catch {
      return INITIAL_COMMENTS;
    }
  });
  const [newComment, setNewComment] = useState('');
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [isAutoScroll, setIsAutoScroll] = useState<boolean>(true);
  const isTouchRef = useRef(false);
  const lastWheelRef = useRef(0);

  // Lock body scroll while modal is active to prevent background rubber-band jerks
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.classList.remove('modal-open');
    };
  }, []);

  // Send control commands directly into YouTube IFrame without reload/restart
  const sendYouTubeCommand = (func: string, args: any[] = []) => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    } catch (err) {
      console.warn('YouTube postMessage error:', err);
    }
  };

  // Toggle Mute without restarting the video
  const toggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    // Direct property change for HTML5 video (prevents video reload/restart)
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }

    if (nextMuted) {
      sendYouTubeCommand('mute');
    } else {
      sendYouTubeCommand('unMute');
      sendYouTubeCommand('setVolume', [100]);
      sendYouTubeCommand('playVideo');
    }
  };

  // Toggle Play / Pause without restarting
  const togglePlay = () => {
    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);
    if (videoRef.current) {
      if (nextPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
    if (nextPlaying) {
      sendYouTubeCommand('playVideo');
    } else {
      sendYouTubeCommand('pauseVideo');
    }
  };

  const currentReel = posts[currentIndex] || posts[0];
  const isCurrentLiked = !!likedPosts[currentReel.id];
  const currentLikeCount = likeCounts[currentReel.id] || 1200;
  const isCurrentSaved = !!savedPosts[currentReel.id];

  // Auto-hide swipe hint after 3.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowSwipeHint(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  // Navigate reels (smooth, functional updater)
  const handlePrev = () => {
    setShowSwipeHint(false);
    setCurrentIndex(ci => (ci > 0 ? ci - 1 : ci));
    setIsCaptionExpanded(false);
    setShowComments(false);
  };

  const handleNext = () => {
    setShowSwipeHint(false);
    setCurrentIndex(ci => (ci < posts.length - 1 ? ci + 1 : 0));
    setIsCaptionExpanded(false);
    setShowComments(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') handlePrev();
      if (e.key === 'ArrowDown') handleNext();
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, onClose]);

  // Wheel / Trackpad scroll navigation with proper ref debouncing
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastWheelRef.current < 600) return;
      if (e.deltaY > 30) {
        lastWheelRef.current = now;
        handleNext();
      } else if (e.deltaY < -30) {
        lastWheelRef.current = now;
        handlePrev();
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // Continuous Auto-advance when video ends
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      try {
        let data = e.data;
        if (typeof data === 'string') data = JSON.parse(data);
        if (!data) return;

        const isEnded =
          (data.event === 'onStateChange' && data.info === 0) ||
          (data.event === 'infoDelivery' && data.info?.playerState === 0) ||
          (data.info && data.info.playerState === 0);

        if (isEnded && isAutoScroll) {
          handleNext();
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isAutoScroll]);

  // Touch Swipe & Tap detection (Cleanly distinguishes swipe from tap to prevent duplicate triggers)
  const handleTouchStart = (e: React.TouchEvent) => {
    isTouchRef.current = true;
    const touch = e.touches[0];
    setTouchStartY(touch.clientY);
    setTouchStartX(touch.clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY === null || touchStartX === null) return;
    const touch = e.changedTouches[0];
    const diffY = touchStartY - touch.clientY;
    const diffX = touchStartX - touch.clientX;

    // Detect vertical swipe (threshold: 35px, vertical dominance over horizontal)
    if (Math.abs(diffY) > 35 && Math.abs(diffY) > Math.abs(diffX) * 0.7) {
      if (diffY > 0) {
        // Swiped UP -> Next Reel
        handleNext();
      } else {
        // Swiped DOWN -> Previous Reel
        handlePrev();
      }
    } else if (Math.abs(diffY) < 12 && Math.abs(diffX) < 12) {
      // Clean Tap -> Toggle Play/Pause
      togglePlay();
    }
    setTouchStartY(null);
    setTouchStartX(null);
  };

  const handleDesktopClick = () => {
    if (isTouchRef.current) {
      isTouchRef.current = false;
      return;
    }
    togglePlay();
  };

  // Like Toggle with LocalStorage persistence
  const toggleLike = () => {
    const willLike = !isCurrentLiked;
    const updated = { ...likedPosts, [currentReel.id]: willLike };
    setLikedPosts(updated);
    try {
      localStorage.setItem('anp_liked_reels', JSON.stringify(updated));
    } catch {}
    setLikeCounts(prev => ({
      ...prev,
      [currentReel.id]: willLike ? (prev[currentReel.id] || 1200) + 1 : (prev[currentReel.id] || 1200) - 1
    }));
    if (willLike) {
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 900);
    }
  };

  // Double tap to like
  const handleDoubleTap = () => {
    if (!isCurrentLiked) {
      toggleLike();
    } else {
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 900);
    }
  };

  // Toggle Bookmark with LocalStorage persistence
  const toggleSave = () => {
    const willSave = !isCurrentSaved;
    const updated = { ...savedPosts, [currentReel.id]: willSave };
    setSavedPosts(updated);
    try {
      localStorage.setItem('anp_bookmarked_reels', JSON.stringify(updated));
    } catch {}
  };

  // Add Comment with LocalStorage persistence
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const commentObj: Comment = {
      id: `comm-${Date.now()}`,
      user: 'आप (कवर्धा पाठक)',
      text: newComment.trim(),
      time: 'अभी-अभी',
      avatar: '👤'
    };
    const updatedList = [commentObj, ...commentsList];
    setCommentsList(updatedList);
    try {
      localStorage.setItem('anp_reel_comments', JSON.stringify(updatedList));
    } catch {}
    setNewComment('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-0 select-none">
      
      {/* Click outside backdrop on desktop */}
      <div className="absolute inset-0 hidden sm:block" onClick={onClose}></div>

      {/* REEL PHONE CONTAINER */}
      <div 
        className="relative w-full h-full sm:h-[92vh] sm:max-w-[410px] sm:rounded-[36px] overflow-hidden shadow-2xl bg-slate-950 flex flex-col justify-between z-10 border border-slate-800 overscroll-contain"
      >
        
        {/* 1. REEL VIDEO / VISUAL BACKGROUND (Z-0, POINTER-EVENTS-NONE) */}
        <div className="absolute inset-0 bg-black overflow-hidden pointer-events-none select-none z-0">
          {/* Video, YouTube Shorts, Instagram Embed, or Image Background */}
          {(() => {
            const ytId = currentReel.youtubeId || (currentReel.embedUrl?.includes('/embed/') ? currentReel.embedUrl.split('/embed/')[1]?.split('?')[0] : null);
            if (ytId) {
              return (
                <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center pointer-events-none">
                  {/* Poster Thumbnail behind IFrame eliminates black flash during buffer/transition */}
                  {currentReel.imageUrl && (
                    <img 
                      src={currentReel.imageUrl} 
                      alt="" 
                      className="absolute inset-0 w-full h-full object-cover" 
                    />
                  )}
                  <iframe
                    ref={iframeRef}
                    key={ytId}
                    src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&controls=0&loop=${isAutoScroll ? '0' : '1'}&playlist=${ytId}&playsinline=1&enablejsapi=1&rel=0&modestbranding=1&iv_load_policy=3&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                    title={currentReel.caption}
                    onLoad={() => {
                      iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening' }), '*');
                      sendYouTubeCommand('addEventListener', ['onStateChange']);
                      if (!isMuted) {
                        setTimeout(() => {
                          sendYouTubeCommand('unMute');
                          sendYouTubeCommand('setVolume', [100]);
                        }, 150);
                      }
                    }}
                    className="w-[170%] h-[120%] -ml-[35%] -mt-[10%] object-cover border-0 pointer-events-none relative z-10"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              );
            }
            if (currentReel.postUrl && currentReel.postUrl.includes('instagram.com/reel/')) {
              return (
                <div className="w-full h-full flex items-center justify-center bg-black pointer-events-none">
                  <iframe
                    src={`${currentReel.postUrl.replace(/\/$/, '')}/embed`}
                    title={currentReel.caption}
                    className="w-full h-full border-0 pointer-events-none"
                    allowFullScreen
                    scrolling="no"
                    allow="autoplay; encrypted-media"
                  ></iframe>
                </div>
              );
            }
            if (currentReel.videoUrl) {
              return (
                <video
                  ref={videoRef}
                  src={currentReel.videoUrl}
                  autoPlay
                  loop={!isAutoScroll}
                  onEnded={() => {
                    if (isAutoScroll) handleNext();
                  }}
                  muted={isMuted}
                  playsInline
                  className="w-full h-full object-cover pointer-events-none"
                />
              );
            }
            return (
              <img 
                src={currentReel.imageUrl} 
                alt={currentReel.caption}
                className="w-full h-full object-cover animate-in fade-in duration-500 pointer-events-none" 
              />
            );
          })()}

          {/* Vignette Overlay Gradients */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none"></div>
        </div>

        {/* 2. FULLSCREEN GESTURE LAYER FOR TOUCH SWIPES & TAPS (Z-20) */}
        <div 
          className="absolute inset-0 z-20 cursor-pointer"
          style={{ touchAction: 'none' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={handleDesktopClick}
          onDoubleClick={handleDoubleTap}
        />

        {/* 3. FLOATING HUD NOTIFICATIONS & BADGES (Z-30) */}
        {/* Floating Tap-to-Unmute Pill when sound is muted */}
        {isMuted && (
          <button
            onClick={toggleMute}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-black/85 hover:bg-black backdrop-blur-md border border-pink-500/50 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xl transition active:scale-95 animate-pulse cursor-pointer pointer-events-auto"
          >
            <VolumeX size={14} className="text-pink-400" />
            <span>🔊 टैप करके आवाज़ चालू करें</span>
          </button>
        )}

        {/* Floating Swipe Up Hint Badge */}
        {showSwipeHint && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-bounce bg-black/80 backdrop-blur-md border border-pink-500/50 text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xl">
            <ChevronUp size={14} className="text-pink-400 animate-pulse" />
            <span>ऊपर स्वाइप करें अगली रील के लिए</span>
          </div>
        )}

        {/* Big Center Heart Burst Animation on Like */}
        {showHeartBurst && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <Heart size={90} className="fill-red-500 text-red-500 animate-ping opacity-90 filter drop-shadow-lg" />
          </div>
        )}

        {/* Play / Pause Indicator on Tap */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur text-white flex items-center justify-center shadow-2xl">
              <Play size={28} className="fill-white ml-1" />
            </div>
          </div>
        )}

        {/* 4. TOP CONTROLS BAR (Z-30) */}
        <div className="relative z-30 p-4 pt-5 flex items-center justify-between text-white pointer-events-auto">
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur text-white transition active:scale-90 cursor-pointer"
              title="Close Reels"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-1.5 font-bold text-sm bg-black/40 backdrop-blur px-2.5 py-1 rounded-full border border-white/10">
              <span className="text-pink-500 font-black">⚡ रील्स</span>
              <span className="text-white/60">•</span>
              <span className="text-xs text-white/90">कवर्धा</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-scroll continuous toggle */}
            <button
              onClick={() => setIsAutoScroll(!isAutoScroll)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 backdrop-blur transition active:scale-90 cursor-pointer ${
                isAutoScroll
                  ? 'bg-pink-950/70 border-pink-500/50 text-pink-300'
                  : 'bg-black/40 border-white/20 text-white/60'
              }`}
              title={isAutoScroll ? 'ऑटो-नेक्स्ट चालू: रील खत्म होने पर अपने आप अगली रील चलेगी' : 'ऑटो-नेक्स्ट बंद: यही रील रिपीट होगी'}
            >
              <span>{isAutoScroll ? '🔄 ऑटो ON' : '🔄 ऑटो OFF'}</span>
            </button>

            {/* Audio Mute/Unmute */}
            <button 
              onClick={toggleMute}
              className="p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur text-white transition active:scale-90 cursor-pointer"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        </div>

        {/* 2. DESKTOP UP/DOWN NAVIGATION ARROWS */}
        <div className="hidden sm:flex absolute right-[-54px] top-1/2 -translate-y-1/2 flex-col gap-3 z-40">
          <button 
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="w-10 h-10 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white flex items-center justify-center shadow-xl transition disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous Reel (Up Arrow)"
          >
            <ChevronUp size={22} />
          </button>
          <button 
            onClick={handleNext}
            className="w-10 h-10 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white flex items-center justify-center shadow-xl transition"
            title="Next Reel (Down Arrow)"
          >
            <ChevronDown size={22} />
          </button>
        </div>

        {/* 3. RIGHT SIDE ACTIONS COLUMN (INSTAGRAM STYLE) */}
        <div className="absolute right-3 bottom-24 z-30 flex flex-col items-center gap-5 text-white">
          
          {/* Like Button */}
          <button 
            onClick={toggleLike}
            className="flex flex-col items-center gap-1 group active:scale-75 transition-transform"
          >
            <div className={`p-2.5 rounded-full transition-all ${
              isCurrentLiked 
                ? 'bg-red-600/30 text-red-500 scale-110' 
                : 'bg-black/40 group-hover:bg-black/60'
            }`}>
              <Heart size={24} className={isCurrentLiked ? 'fill-red-500 text-red-500' : 'text-white'} />
            </div>
            <span className="text-[11px] font-bold shadow-black drop-shadow">
              {currentLikeCount.toLocaleString('en-IN')}
            </span>
          </button>

          {/* Comments Button */}
          <button 
            onClick={() => setShowComments(true)}
            className="flex flex-col items-center gap-1 group active:scale-75 transition-transform"
          >
            <div className="p-2.5 rounded-full bg-black/40 group-hover:bg-black/60 transition">
              <MessageCircle size={24} className="text-white" />
            </div>
            <span className="text-[11px] font-bold shadow-black drop-shadow">
              {currentReel.commentsCount || '214'}
            </span>
          </button>

          {/* Share on WhatsApp with direct reel URL */}
          <button 
            onClick={() => {
              const reelLink = currentReel.postUrl || (currentReel.youtubeId ? `https://youtube.com/shorts/${currentReel.youtubeId}` : window.location.href);
              onShareWhatsApp(currentReel.caption, reelLink);
            }}
            className="flex flex-col items-center gap-1 group active:scale-75 transition-transform"
            title="Share Reel on WhatsApp"
          >
            <div className="p-2.5 rounded-full bg-emerald-600/80 group-hover:bg-emerald-500 shadow transition">
              <WhatsAppIcon size={20} className="text-white" />
            </div>
            <span className="text-[11px] font-bold shadow-black drop-shadow">
              शेयर
            </span>
          </button>

          {/* Bookmark / Save */}
          <button 
            onClick={toggleSave}
            className="flex flex-col items-center gap-1 group active:scale-75 transition-transform"
            title="Save Reel"
          >
            <div className={`p-2.5 rounded-full transition ${
              isCurrentSaved 
                ? 'bg-amber-500 text-slate-950' 
                : 'bg-black/40 group-hover:bg-black/60 text-white'
            }`}>
              <Bookmark size={22} className={isCurrentSaved ? 'fill-current' : ''} />
            </div>
            <span className="text-[11px] font-bold shadow-black drop-shadow">
              {isCurrentSaved ? 'सेव्ड' : 'सेव'}
            </span>
          </button>

          {/* Instagram External Link */}
          <a 
            href={currentReel.postUrl || SOCIAL_LINKS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 text-white shadow-lg active:scale-75 transition"
            title="Open on Instagram"
          >
            <InstagramIcon size={18} />
          </a>

        </div>

        {/* 4. BOTTOM INFO OVERLAY (CAPTION, PROFILE, SOUND) */}
        <div className="relative z-30 p-4 pb-6 space-y-2.5 bg-gradient-to-t from-black via-black/80 to-transparent pr-16 text-white">
          
          {/* Profile Bar */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 shrink-0">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-[10px] font-black text-white">
                ANP
              </div>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white drop-shadow">
                  Ambition news
                </span>
                <span className="text-[10px] bg-pink-950 text-pink-300 font-bold px-1.5 rounded border border-pink-800">
                  {currentReel.district}
                </span>
              </div>
              <span className="text-[10px] text-pink-400 font-mono">
                {SOCIAL_LINKS.instagramHandle}
              </span>
            </div>

            {/* Follow Button */}
            <button 
              onClick={() => setIsFollowing(!isFollowing)}
              className={`ml-1 text-[11px] font-bold px-3 py-1 rounded-full transition shadow-md ${
                isFollowing 
                  ? 'bg-slate-800 text-slate-300 border border-slate-700' 
                  : 'bg-white text-slate-950 hover:bg-slate-200'
              }`}
            >
              {isFollowing ? 'फॉलो किया ✓' : 'फॉलो करें'}
            </button>
          </div>

          {/* Caption */}
          <div>
            <p className={`text-xs leading-relaxed text-slate-100 ${
              isCaptionExpanded ? '' : 'line-clamp-2'
            }`}>
              {currentReel.caption}
            </p>
            {currentReel.caption.length > 80 && (
              <button 
                onClick={() => setIsCaptionExpanded(!isCaptionExpanded)}
                className="text-[11px] text-slate-400 font-bold hover:underline mt-0.5"
              >
                {isCaptionExpanded ? 'कम दिखाएं' : '...और पढ़ें'}
              </button>
            )}
          </div>

          {/* Audio Music Marquee Track */}
          <div className="flex items-center gap-2 text-[11px] text-slate-300 overflow-hidden">
            <Music size={12} className="text-pink-400 shrink-0" />
            <div className="overflow-hidden whitespace-nowrap flex-1">
              <div className="audio-ticker text-[11px] font-medium gap-8">
                <span>{currentReel.audioTrack || 'Ambition News • ओरिजिनल ऑडियो - कवर्धा'}</span>
                <span>{currentReel.audioTrack || 'Ambition News • ओरिजिनल ऑडियो - कवर्धा'}</span>
              </div>
            </div>
            <Disc size={13} className="text-pink-400 animate-spin shrink-0" />
          </div>

        </div>

        {/* 5. SLIDE-UP COMMENTS DRAWER */}
        {showComments && (
          <div className="absolute inset-x-0 bottom-0 top-1/3 z-40 bg-slate-900 border-t border-slate-700 rounded-t-3xl p-4 flex flex-col justify-between shadow-2xl animate-in slide-in-from-bottom duration-300">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto absolute top-2 inset-x-0"></div>
              <div className="flex items-center gap-2 text-xs font-bold text-white pt-2">
                <MessageCircle size={15} />
                <span>कमेंट्स ({commentsList.length})</span>
              </div>
              <button 
                onClick={() => setShowComments(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 text-xs">
              {commentsList.map(c => (
                <div key={c.id} className="flex items-start gap-2.5">
                  <span className="text-base">{c.avatar}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-[11px]">{c.user}</span>
                      <span className="text-[10px] text-slate-500">{c.time}</span>
                    </div>
                    <p className="text-slate-300 text-[11px] mt-0.5 leading-snug">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment Input */}
            <form onSubmit={handleAddComment} className="pt-2 border-t border-slate-800 flex gap-2 shrink-0">
              <input 
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="कवर्धा की इस रील पर कमेंट लिखें..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-pink-500 font-medium placeholder:text-slate-500"
              />
              <button 
                type="submit"
                className="bg-pink-600 hover:bg-pink-500 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center transition active:scale-95"
              >
                <Send size={13} />
              </button>
            </form>

          </div>
        )}

      </div>

    </div>
  );
};
