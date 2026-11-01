import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Play, 
  Eye, 
  Clock, 
  Tv, 
  RefreshCw,
  X,
  Maximize2
} from 'lucide-react';
import { YoutubeIcon, WhatsAppIcon } from './SocialIcons';
import type { VideoBulletin } from '../types';
import { SOCIAL_LINKS } from '../data/mockData';
import { sortMediaLatestFirst, getVideoThumbnail } from '../utils/mediaUtils';

interface VideoSectionProps {
  bulletins: VideoBulletin[];
  isDark: boolean;
  onShareWhatsApp?: (title: string, videoUrl?: string) => void;
  youtubeSubs?: string;
  autoPlayOnMount?: boolean;
  onOpenVideo?: (video: VideoBulletin) => void;
  playingVideo?: VideoBulletin | null;
  onSelectVideo?: (video: VideoBulletin | null) => void;
  onHeroInViewChange?: (inView: boolean) => void;
}

const PRESET_CATEGORIES = [
  { id: 'all', label: 'सभी वीडियो', icon: '📺' },
  { id: 'kawardha', label: 'कवर्धा विशेष', icon: '🔴', keywords: ['कवर्धा', 'कबीरधाम', 'भोरमदेव', 'कवर्धा स्पेशल', 'कवर्धा विशेष'] },
  { id: 'state', label: 'राज्य बुलेटिन', icon: '📢', keywords: ['राज्य', 'छत्तीसगढ़', 'रायपुर', 'बिलासपुर', 'महाबुलेटिन', 'राज्य बुलेटिन'] },
  { id: 'heritage', label: 'संस्कृति व धरोहर', icon: '🛕', keywords: ['संस्कृति', 'धरोहर', 'भोरमदेव', 'महोत्सव', 'मंदिर'] },
  { id: 'mandi', label: 'कृषि व मंडी', icon: '🌾', keywords: ['मंडी', 'गुड़', 'धान', 'किसान', 'भाव', 'मंडी भाव'] },
  { id: 'ground', label: 'ग्राउंड रिपोर्ट', icon: '🎙️', keywords: ['ग्राउंड', 'सड़क', 'पुलिया', 'बारिश', 'मुद्दों', 'सीधी बहस'] },
  { id: 'governance', label: 'शासन व राजनीति', keywords: ['सरकार', 'कलेक्टर', 'कैबिनेट', 'प्रशासन', 'नेता', 'बहस'], icon: '🏛️' }
];

export const VideoSection: React.FC<VideoSectionProps> = ({ 
  bulletins = [], 
  isDark, 
  onShareWhatsApp,
  youtubeSubs,
  autoPlayOnMount = false,
  playingVideo,
  onSelectVideo,
  onHeroInViewChange
}) => {
  const [internalPlayingVideo, setInternalPlayingVideo] = useState<VideoBulletin | null>(null);
  const activePlayingVideo = playingVideo !== undefined ? playingVideo : internalPlayingVideo;

  const setVideo = useCallback((v: VideoBulletin | null) => {
    if (onSelectVideo) {
      onSelectVideo(v);
    } else {
      setInternalPlayingVideo(v);
    }
  }, [onSelectVideo]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [visibleVideoCount, setVisibleVideoCount] = useState<number>(8);
  const hasAutoPlayedRef = useRef<boolean>(false);
  const heroVideoRef = useRef<HTMLDivElement>(null);

  // In-Page Cinema Opener: Sets video to play right inside the Hero Spotlight screen
  const openVideo = useCallback((video: VideoBulletin) => {
    setVideo(video);
    setTimeout(() => {
      heroVideoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }, [setVideo]);

  // Track whether Hero screen is within viewport
  useEffect(() => {
    const target = heroVideoRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting && entry.intersectionRatio >= 0.2;
        onHeroInViewChange?.(inView);
      },
      { threshold: [0, 0.2, 0.5] }
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
      onHeroInViewChange?.(false);
    };
  }, [onHeroInViewChange]);

  // Filter bulletins based on selected category tag
  const filteredBulletins = useMemo(() => {
    if (selectedCategory === 'all') return bulletins;
    const cat = PRESET_CATEGORIES.find(c => c.id === selectedCategory);
    if (!cat || !cat.keywords) return bulletins;
    return bulletins.filter(b => {
      const text = `${b.title} ${b.category || ''}`.toLowerCase();
      return cat.keywords.some(k => text.includes(k.toLowerCase()));
    });
  }, [bulletins, selectedCategory]);

  const displayList = useMemo(() => {
    return sortMediaLatestFirst(filteredBulletins);
  }, [filteredBulletins]);

  const featuredVideo = displayList[0] || null;
  const currentHeroVideo = activePlayingVideo || featuredVideo;
  const remainingBulletins = useMemo(() => {
    if (!currentHeroVideo) return displayList;
    return displayList.filter(b => b.id !== currentHeroVideo.id && b.youtubeId !== currentHeroVideo.youtubeId);
  }, [displayList, currentHeroVideo]);
  const visibleRemaining = remainingBulletins.slice(0, visibleVideoCount);
  const hasMoreVideos = visibleVideoCount < remainingBulletins.length;

  // Auto-play latest video immediately when entering dedicated videos tab
  useEffect(() => {
    if (autoPlayOnMount && bulletins && bulletins.length > 0 && !hasAutoPlayedRef.current) {
      hasAutoPlayedRef.current = true;
      const topVideo = bulletins[0];
      if (topVideo && !playingVideo) {
        openVideo(topVideo);
      }
    }
  }, [autoPlayOnMount, bulletins, openVideo, playingVideo]);

  // Dynamic Categories calculation with real video counts
  const categoriesWithCounts = useMemo(() => {
    return PRESET_CATEGORIES.map(cat => {
      if (cat.id === 'all') return { ...cat, count: bulletins.length };
      const count = bulletins.filter(b => {
        if (!cat.keywords) return false;
        const text = `${b.title} ${b.category || ''}`.toLowerCase();
        return cat.keywords.some(k => text.includes(k.toLowerCase()));
      }).length;
      return { ...cat, count };
    }).filter(cat => cat.id === 'all' || cat.count > 0);
  }, [bulletins]);

  // Reset visible video count when category changes
  useEffect(() => {
    setVisibleVideoCount(8);
  }, [selectedCategory]);

  const handleShare = (video: VideoBulletin, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const url = video.youtubeUrl || `https://www.youtube.com/watch?v=${video.youtubeId}`;
    if (onShareWhatsApp) {
      onShareWhatsApp(video.title, url);
    } else {
      const text = `🔴 *Ambition TV • विशेष वीडियो बुलेटिन*:\n${video.title}\n\n▶️ तुरंत यहाँ देखें:\n${url}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  // Pure real data: do not render video section if no live bulletins exist
  if (!bulletins || bulletins.length === 0) return null;

  return (
    <section 
      id="video-bulletins-section"
      className={`rounded-3xl border p-3.5 sm:p-5 transition-colors ${
        isDark ? 'bg-[#080d19]/95 border-red-950/40 shadow-2xl' : 'bg-slate-50/90 border-slate-200 shadow-sm'
      }`}
    >
      
      {/* 1. ULTRA-SLEEK SECTION HEADER (COMPACT & MODERN) */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5 pb-3 border-b ${
        isDark ? 'border-red-950/40' : 'border-slate-200'
      }`}>
        <div className="flex items-center justify-between sm:justify-start gap-2.5 w-full sm:w-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-600 to-red-700 flex items-center justify-center text-white shadow-lg shadow-red-600/40 shrink-0">
              <Tv size={18} className="sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className={`text-sm sm:text-base font-black tracking-wide ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  AMBITION TV
                </h2>
                <span className="bg-red-600 text-white text-[8.5px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1 shadow">
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                  LIVE
                </span>
              </div>
              <p className={`text-[10.5px] mt-0.5 line-clamp-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                कवर्धा व CG-MP 88 जिला न्यूज़ • सीधे ग्राउंड से कवरेज
              </p>
            </div>
          </div>

          {/* Mobile Right: YouTube Subscribers Badge */}
          <div className="sm:hidden flex items-center gap-1 text-[10px] font-extrabold px-2 py-1 rounded-full bg-red-950/40 border border-red-800/40 text-red-300 shrink-0">
            <YoutubeIcon size={12} />
            <span>{youtubeSubs || SOCIAL_LINKS.youtubeSubs}</span>
          </div>
        </div>

        {/* Desktop / Tablet Actions Header */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {/* Continuous Non-Stop TV Mode Button */}
          <button
            type="button"
            onClick={() => {
              if (featuredVideo || displayList[0]) {
                openVideo(featuredVideo || displayList[0]);
              }
            }}
            className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-md shadow-red-600/30 transition active:scale-95 cursor-pointer shrink-0"
            title="सारे वीडियो बुलेटिन एक के बाद एक बिना रुके देखें"
          >
            <Tv size={13} className="text-white" />
            <span>लगातार चलाएं (TV Mode)</span>
          </button>

          {/* YouTube Subscribers Badge */}
          <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl shrink-0 ${
            isDark ? 'bg-red-950/40 text-red-300 border border-red-800/40' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <YoutubeIcon size={14} />
            <span>{youtubeSubs || SOCIAL_LINKS.youtubeSubs} दर्शक</span>
          </div>
        </div>
      </div>

      {/* 2. CATEGORY FILTER PILLS WITH LIVE COUNTS */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3 mb-3 text-xs w-full max-w-full">
        {categoriesWithCounts.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => {
              setSelectedCategory(cat.id);
              setVisibleVideoCount(8);
            }}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition whitespace-nowrap active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0 ${
              selectedCategory === cat.id
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30 font-extrabold'
                : isDark 
                  ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800/90' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
            <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-mono ${
              selectedCategory === cat.id 
                ? 'bg-white/25 text-white' 
                : isDark 
                  ? 'bg-slate-800 text-slate-400' 
                  : 'bg-slate-100 text-slate-500'
            }`}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* EMPTY CATEGORY STATE */}
      {displayList.length === 0 && (
        <div className={`p-8 text-center rounded-2xl border border-dashed my-4 space-y-2 ${
          isDark ? 'border-slate-800 bg-slate-950/40 text-slate-300' : 'border-slate-300 bg-slate-50 text-slate-700'
        }`}>
          <Tv size={32} className="mx-auto text-red-500 opacity-60" />
          <h3 className="text-sm font-bold">इस श्रेणी में अभी कोई वीडियो बुलेटिन नहीं है</h3>
          <p className="text-xs text-slate-400">अन्य श्रेणी चुनें या सभी वीडियो बुलेटिन देखें</p>
          <button 
            type="button"
            onClick={() => setSelectedCategory('all')}
            className="text-xs text-red-400 font-bold hover:underline cursor-pointer inline-flex items-center gap-1 mt-1"
          >
            <span>← सभी वीडियो देखें ({bulletins.length})</span>
          </button>
        </div>
      )}

      {/* 3. HERO SPOTLIGHT BROADCAST: CINEMATIC STUDIO PLAYER */}
      {currentHeroVideo && (
        <div 
          ref={heroVideoRef}
          className={`mb-5 rounded-2xl sm:rounded-3xl border overflow-hidden shadow-2xl transition-all duration-300 scroll-mt-24 ${
            isDark 
              ? 'bg-gradient-to-b from-[#0d1424] via-[#090e1a] to-black border-red-950/60 shadow-red-950/20' 
              : 'bg-white border-slate-200/90 shadow-xl'
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
            
            {/* 16:9 Cinema Screen (Active Spotlight or Live Poster Thumbnail) */}
            <div className="md:col-span-7 relative aspect-video w-full bg-black overflow-hidden select-none">
              {activePlayingVideo ? (
                /* ACTIVE PLAYING VIDEO SPOTLIGHT CARD (CONTROLLED VIA MASTER PLAYER) */
                <div className="relative w-full h-full bg-slate-950 flex flex-col items-center justify-center text-center p-6 border border-red-950 select-none overflow-hidden group">
                  {/* Blurred Backdrop of Current Playing Video */}
                  <img
                    src={getVideoThumbnail(activePlayingVideo)}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-35 blur-xs scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/60" />

                  <div className="relative z-10 flex flex-col items-center max-w-sm px-4">
                    {/* Live Equalizer Animation */}
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-red-600/90 text-white rounded-full text-[11px] font-black uppercase tracking-wider mb-2.5 shadow-lg shadow-red-600/40 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white"></span>
                      <span>अब लाइव चल रहा है</span>
                      <div className="flex items-end gap-0.5 h-3 ml-1">
                        <span className="w-0.5 bg-white rounded-full animate-bounce [animation-delay:0ms] h-full" />
                        <span className="w-0.5 bg-white rounded-full animate-bounce [animation-delay:150ms] h-2/3" />
                        <span className="w-0.5 bg-white rounded-full animate-bounce [animation-delay:300ms] h-4/5" />
                      </div>
                    </div>

                    <h3 className="text-white text-sm sm:text-base font-bold line-clamp-2 leading-snug drop-shadow-md">
                      {activePlayingVideo.title}
                    </h3>
                    <p className="text-red-400 text-xs font-semibold mt-1">
                      ● लाइव वीडियो फ़्लोटिंग प्लेयर में सक्रिय है
                    </p>

                    <div className="flex items-center gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-lg flex items-center gap-1.5"
                      >
                        <Maximize2 size={13} />
                        <span>बड़ी स्क्रीन / सिनेमा मोड</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setVideo(null)}
                        className="p-2 bg-black/60 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-white/20 transition active:scale-95 cursor-pointer"
                        title="वीडियो बंद करें"
                        aria-label="वीडियो बंद करें"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* POSTER THUMBNAIL WITH 1-CLICK CINEMATIC PLAY */
                <div 
                  onClick={() => openVideo(featuredVideo)}
                  className="relative w-full h-full cursor-pointer group overflow-hidden"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      openVideo(featuredVideo);
                    }
                  }}
                  aria-label="यहीं वीडियो चलाएं"
                >
                  <img 
                    src={getVideoThumbnail(featuredVideo)} 
                    alt={featuredVideo.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                  />
                  
                  {/* Subtle Dark Vignette Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/35 group-hover:from-black/95 transition-colors flex items-center justify-center">
                    {/* Center Big Glow Play Button */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-600/95 text-white flex items-center justify-center shadow-2xl shadow-red-600/50 group-hover:scale-115 group-hover:bg-red-500 transition-all duration-300 border-2 border-white/40 backdrop-blur-xs will-change-transform">
                      <Play size={24} className="fill-white ml-1 sm:w-7 sm:h-7" />
                    </div>
                  </div>

                  {/* Top Floating Badge */}
                  <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex items-center gap-2 pointer-events-none">
                    <span className="bg-red-600/95 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                      मुख्य वीडियो बुलेटिन
                    </span>
                  </div>

                  {/* Bottom Right Duration Badge */}
                  <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 bg-black/85 backdrop-blur-md font-mono text-white text-[10px] sm:text-xs px-2 py-0.5 rounded-md font-bold border border-white/10 shadow">
                    {featuredVideo.duration}
                  </div>
                </div>
              )}
            </div>

            {/* Featured Metadata & Action Controls */}
            <div className="md:col-span-5 p-4 sm:p-5 lg:p-6 flex flex-col justify-between">
              <div className="space-y-2 sm:space-y-2.5">
                
                {/* Category & Timestamp Row */}
                <div className="flex items-center gap-2 text-[11px]">
                  <span className={`text-[10px] sm:text-[11px] font-extrabold px-2.5 py-0.5 rounded-md border ${
                    isDark 
                      ? 'text-red-400 bg-red-950/50 border-red-800/60' 
                      : 'text-red-700 bg-red-50 border-red-200'
                  }`}>
                    {currentHeroVideo.category || 'कवर्धा विशेष'}
                  </span>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                    • {currentHeroVideo.timeAgo}
                  </span>
                  <span className={`flex items-center gap-1 font-semibold ml-auto text-[10.5px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <Eye size={12} className="text-red-500" /> {currentHeroVideo.views}
                  </span>
                </div>

                {/* Main Headline */}
                <h3 
                  onClick={() => openVideo(currentHeroVideo)}
                  className={`text-sm sm:text-lg font-black leading-snug line-clamp-2 sm:line-clamp-3 cursor-pointer transition-colors ${
                    isDark ? 'text-white hover:text-red-400' : 'text-slate-900 hover:text-red-600'
                  }`}
                >
                  {currentHeroVideo.title}
                </h3>

                {/* Verified Source Indicator */}
                <div className={`flex items-center justify-between text-[11px] pt-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    <span className="font-bold">Ambition News स्पेशल ग्राउंड रिपोर्ट</span>
                  </div>
                  <span className="text-[10px] text-sky-400 font-bold bg-sky-950/40 border border-sky-900/60 px-1.5 py-0.2 rounded">
                    ✓ VERIFIED
                  </span>
                </div>
              </div>

              {/* 
                ULTRA-BALANCED 1-ROW ACTION BAR:
                Strict 12-column grid that guarantees 100% horizontal alignment
                with ZERO text wrapping on all phone screens!
              */}
              <div className={`pt-3 mt-3 border-t grid grid-cols-12 gap-1.5 sm:gap-2 items-center ${
                isDark ? 'border-slate-800/80' : 'border-slate-200'
              }`}>
                {activePlayingVideo ? (
                  <button
                    type="button"
                    onClick={() => setVideo(null)}
                    className="col-span-6 h-10 sm:h-11 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3 rounded-xl shadow flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer truncate"
                  >
                    <X size={14} />
                    <span>रोकें (Stop)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openVideo(featuredVideo)}
                    className="col-span-6 h-10 sm:h-11 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs px-2.5 rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer truncate"
                  >
                    <Play size={14} className="fill-white shrink-0" />
                    <span>अभी देखें</span>
                  </button>
                )}

                {/* Next Video in Playlist */}
                <button
                  type="button"
                  onClick={() => {
                    const currId = currentHeroVideo.id;
                    const curIdx = displayList.findIndex(b => b.id === currId);
                    const nextVideo = displayList[(curIdx + 1) % displayList.length];
                    if (nextVideo) openVideo(nextVideo);
                  }}
                  className={`col-span-3 h-10 sm:h-11 font-bold text-xs px-2 rounded-xl border flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer truncate ${
                    isDark 
                      ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  }`}
                  title="अगला वीडियो चलाएं"
                >
                  <RefreshCw size={12} className="shrink-0" />
                  <span>अगला</span>
                </button>

                {/* WhatsApp Share */}
                <button
                  type="button"
                  onClick={(e) => handleShare(currentHeroVideo, e)}
                  aria-label="मुख्य वीडियो व्हाट्सएप पर शेयर करें"
                  className="col-span-3 h-10 sm:h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-2 rounded-xl shadow-md flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer truncate"
                  title="WhatsApp पर शेयर करें"
                >
                  <WhatsAppIcon size={14} className="shrink-0" />
                  <span>शेयर</span>
                </button>
              </div>

              {/* Mobile TV Mode Strip directly beneath Action Bar */}
              <div 
                onClick={() => {
                  if (featuredVideo || displayList[0]) {
                    openVideo(featuredVideo || displayList[0]);
                  }
                }}
                className={`sm:hidden mt-2.5 p-2 rounded-xl border flex items-center justify-between text-[10.5px] font-bold cursor-pointer transition active:scale-98 ${
                  isDark 
                    ? 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900' 
                    : 'bg-slate-100/80 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  <span>लगातार चलाएं (TV Mode)</span>
                </div>
                <span className="text-red-500 font-extrabold">प्ले ➔</span>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 4. SUBSEQUENT VIDEOS GRID (RESPONSIVE: 1 COL MOBILE, 2 COL PHONES, 3 COL TABLETS, 4 COL DESKTOP) */}
      {visibleRemaining.length > 0 && (
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${
          visibleRemaining.length >= 4 
            ? 'lg:grid-cols-4' 
            : visibleRemaining.length === 3 
              ? 'lg:grid-cols-3' 
              : 'lg:grid-cols-2'
        } gap-4 sm:gap-5`}>
          {visibleRemaining.map((video) => {
            const isCurrentlyPlaying = activePlayingVideo?.id === video.id;
            return (
              <div 
                key={video.id}
                onClick={() => openVideo(video)}
                className={`group rounded-2xl border overflow-hidden cursor-pointer flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 will-change-transform shadow-md ${
                  isCurrentlyPlaying
                    ? 'border-red-600 ring-2 ring-red-600/40 shadow-red-600/30'
                    : isDark ? 'bg-slate-950 border-slate-800/80 hover:border-red-600/60' : 'bg-slate-50 border-slate-200 hover:border-red-500 hover:shadow-lg'
                }`}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                  <img 
                    src={getVideoThumbnail(video)} 
                    alt={video.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className={`absolute inset-0 transition-colors flex items-center justify-center ${
                    isCurrentlyPlaying ? 'bg-red-950/60' : 'bg-black/35 group-hover:bg-black/15'
                  }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform ${
                      isCurrentlyPlaying 
                        ? 'bg-white text-red-600 scale-110 animate-pulse' 
                        : 'bg-red-600 text-white group-hover:scale-110'
                    }`}>
                      <Play size={18} className="fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Active Playing Badge or Info */}
                  <div className="absolute top-2 left-2 z-10">
                    {isCurrentlyPlaying && (
                      <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase shadow">
                        ▶ चल रहा है
                      </span>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center text-[10px] text-white">
                    <span className="bg-black/75 backdrop-blur px-2 py-0.5 rounded font-medium">
                      {video.category || 'कवर्धा विशेष'}
                    </span>
                    <span className="bg-black/85 font-mono px-1.5 py-0.5 rounded font-bold">
                      {video.duration}
                    </span>
                  </div>
                </div>

                {/* Title & Metadata */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <h3 className={`text-xs font-bold leading-snug line-clamp-2 transition-colors ${
                    isCurrentlyPlaying 
                      ? 'text-red-400 font-black' 
                      : isDark ? 'text-slate-100 group-hover:text-red-400' : 'text-slate-900 group-hover:text-red-600'
                  }`}>
                    {video.title}
                  </h3>

                  <div className={`mt-2.5 pt-2 border-t flex items-center justify-between text-[11px] ${
                    isDark ? 'border-slate-800/40 text-slate-400' : 'border-slate-200 text-slate-600'
                  }`}>
                    <span className="flex items-center gap-1 font-medium">
                      <Eye size={11} className="text-red-500" /> {video.views}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleShare(video, e)}
                        aria-label="WhatsApp पर वीडियो शेयर करें"
                        className="p-1 hover:text-emerald-400 transition cursor-pointer"
                        title="WhatsApp शेयर"
                      >
                        <WhatsAppIcon size={13} className="text-emerald-500" />
                      </button>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {video.timeAgo}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* If there are 3 videos and space for a 4th, render promo */}
          {visibleRemaining.length === 3 && (
            <div 
              onClick={() => {
                if (displayList[0]) openVideo(displayList[0]);
              }}
              className={`rounded-2xl border p-4 flex flex-col justify-between cursor-pointer group transition-transform duration-300 hover:-translate-y-1 will-change-transform shadow-md ${
                isDark 
                  ? 'bg-gradient-to-br from-red-950/40 via-slate-900 to-slate-950 border-red-900/40 hover:border-red-500/60' 
                  : 'bg-gradient-to-br from-red-50 via-white to-red-50 border-red-200 hover:border-red-400'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow">
                    <YoutubeIcon size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-red-400 bg-red-950/60 border border-red-800/60 px-2 py-0.5 rounded-full">
                    {youtubeSubs || SOCIAL_LINKS.youtubeSubs}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block">एम्बिशन टीवी</span>
                  <h3 className={`text-xs sm:text-sm font-bold leading-snug mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    500+ वीडियो बुलेटिन उपलब्ध
                  </h3>
                </div>
                <p className={`text-[11px] leading-relaxed line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  कवर्धा व CG-MP की ताज़ा खबरें, लाइव डिबेट व ग्राउंड रिपोर्ट्स सीधे यहीं देखें।
                </p>
              </div>

              <div className={`pt-3 border-t flex items-center justify-between text-xs font-bold text-red-500 group-hover:text-red-400 ${
                isDark ? 'border-red-900/30' : 'border-red-200'
              }`}>
                <span>पहला वीडियो चलाएं</span>
                <span>▶</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. PROGRESSIVE LOAD MORE / COLLAPSE CONTROLS */}
      {remainingBulletins.length > 8 && (
        <div className={`mt-5 pt-4 border-t flex flex-wrap items-center justify-center gap-3 ${
          isDark ? 'border-red-950/30' : 'border-slate-200'
        }`}>
          {hasMoreVideos ? (
            <button
              type="button"
              onClick={() => setVisibleVideoCount(prev => prev + 8)}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-lg cursor-pointer border ${
                isDark 
                  ? 'bg-gradient-to-r from-red-950/60 to-slate-900/80 hover:from-red-900/80 hover:to-slate-800 border-red-600/40 text-red-300' 
                  : 'bg-white hover:bg-red-50/50 border-red-200 text-red-700 shadow-sm'
              }`}
            >
              <span>▼ और वीडियो बुलेटिन लोड करें (+{Math.min(8, remainingBulletins.length - visibleVideoCount)} और देखें • {remainingBulletins.length - visibleVideoCount} शेष)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setVisibleVideoCount(8)}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer border ${
                isDark 
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300' 
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
              }`}
            >
              <span>▲ कम वीडियो दिखाएं (आरंभिक 8 वीडियो पर जाएं)</span>
            </button>
          )}
        </div>
      )}

    </section>
  );
};
