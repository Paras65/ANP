import React, { useState, useEffect } from 'react';
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
  onShareWhatsApp: (caption: string) => void;
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

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    posts.forEach(p => {
      map[p.id] = parseInt(p.likes.replace(/[^0-9]/g, '')) || 1200;
    });
    return map;
  });
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});
  const [isFollowing, setIsFollowing] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState<Comment[]>(INITIAL_COMMENTS);
  const [newComment, setNewComment] = useState('');
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const currentReel = posts[currentIndex] || posts[0];
  const isCurrentLiked = !!likedPosts[currentReel.id];
  const currentLikeCount = likeCounts[currentReel.id] || 1200;
  const isCurrentSaved = !!savedPosts[currentReel.id];

  // Navigate reels
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsCaptionExpanded(false);
      setShowComments(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < posts.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsCaptionExpanded(false);
      setShowComments(false);
    } else {
      // Loop back to start
      setCurrentIndex(0);
      setIsCaptionExpanded(false);
      setShowComments(false);
    }
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
  }, [currentIndex, isPlaying, onClose]);

  // Touch Swipe detection
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY - touchEndY;

    if (diff > 50) {
      // Swiped UP -> Next Reel
      handleNext();
    } else if (diff < -50) {
      // Swiped DOWN -> Previous Reel
      handlePrev();
    }
    setTouchStartY(null);
  };

  // Like Toggle
  const toggleLike = () => {
    const willLike = !isCurrentLiked;
    setLikedPosts(prev => ({ ...prev, [currentReel.id]: willLike }));
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

  // Toggle Bookmark
  const toggleSave = () => {
    setSavedPosts(prev => ({ ...prev, [currentReel.id]: !prev[currentReel.id] }));
  };

  // Add Comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const commentObj: Comment = {
      id: `comm-${Date.now()}`,
      user: 'आप (कवर्धा पाठक)',
      text: newComment,
      time: 'अभी',
      avatar: '👤'
    };
    setCommentsList(prev => [commentObj, ...prev]);
    setNewComment('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-0 select-none">
      
      {/* Click outside backdrop on desktop */}
      <div className="absolute inset-0 hidden sm:block" onClick={onClose}></div>

      {/* REEL PHONE CONTAINER */}
      <div 
        className="relative w-full h-full sm:h-[92vh] sm:max-w-[410px] sm:rounded-[36px] overflow-hidden shadow-2xl bg-slate-950 flex flex-col justify-between z-10 border border-slate-800"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        
        {/* REEL VIDEO / VISUAL BACKGROUND */}
        <div 
          className="absolute inset-0 bg-black overflow-hidden cursor-pointer"
          onClick={() => setIsPlaying(!isPlaying)}
          onDoubleClick={handleDoubleTap}
        >
          {/* Video or Image Background */}
          {currentReel.videoUrl ? (
            <video
              src={currentReel.videoUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="w-full h-full object-cover pointer-events-none"
            />
          ) : currentReel.youtubeId ? (
            <div className="w-full h-full relative pointer-events-none">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${currentReel.youtubeId}?autoplay=1&loop=1&playlist=${currentReel.youtubeId}&controls=0&modestbranding=1&rel=0&showinfo=0&mute=${isMuted ? '1' : '0'}`}
                title={currentReel.caption}
                className="w-[180%] h-[180%] -ml-[40%] -mt-[35%] object-cover"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              ></iframe>
            </div>
          ) : (
            <img 
              src={currentReel.imageUrl} 
              alt={currentReel.caption}
              className="w-full h-full object-cover animate-in fade-in duration-500" 
            />
          )}

          {/* Vignette Overlay Gradients */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none"></div>

          {/* Floating Tap-to-Unmute Pill when sound is muted */}
          {isMuted && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(false);
              }}
              className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-black/80 hover:bg-black backdrop-blur-md border border-pink-500/50 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xl transition active:scale-95 animate-pulse"
            >
              <VolumeX size={14} className="text-pink-400" />
              <span>🔊 टैप करके आवाज़ चालू करें</span>
            </button>
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
        </div>

        {/* 1. TOP CONTROLS BAR */}
        <div className="relative z-30 p-4 pt-5 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur text-white transition active:scale-90"
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
            {/* Audio Mute/Unmute */}
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur text-white transition active:scale-90"
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

          {/* Share on WhatsApp */}
          <button 
            onClick={() => onShareWhatsApp(currentReel.caption)}
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
              <div className="inline-block ticker-scroll text-[11px] font-medium">
                {currentReel.audioTrack || 'Ambition News • ओरिजिनल ऑडियो - कवर्धा'}
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
