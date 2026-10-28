import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Play, 
  ExternalLink, 
  X, 
  Eye, 
  Clock, 
  Tv, 
  RefreshCw,
  SkipBack, 
  SkipForward 
} from 'lucide-react';
import { YoutubeIcon, WhatsAppIcon } from './SocialIcons';
import type { VideoBulletin } from '../types';
import { SOCIAL_LINKS } from '../data/mockData';
import { isDirectVideoUrl } from '../utils/mediaUtils';

interface VideoSectionProps {
  bulletins: VideoBulletin[];
  isDark: boolean;
  onShareWhatsApp?: (title: string, videoUrl?: string) => void;
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
  bulletins, 
  isDark, 
  onShareWhatsApp
}) => {
  // Pure real data: do not render video section if no live bulletins exist
  if (!bulletins || bulletins.length === 0) return null;

  const [activeVideo, setActiveVideo] = useState<VideoBulletin | null>(null);

  // Filters & Progressive Load More
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [visibleVideoCount, setVisibleVideoCount] = useState<number>(8);

  // Autoplay & Playlist Continuous Playback State
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Helper to resolve realistic video thumbnail (Real YouTube frame instead of generic logo)
  const getVideoThumbnail = (video: VideoBulletin): string => {
    if (video.thumbnail && !video.thumbnail.includes('photo-1585829365295') && !video.thumbnail.includes('logo.png')) {
      return video.thumbnail;
    }
    if (video.youtubeId) {
      return `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
    }
    return '/logo.png';
  };

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

  // Lock body scroll while video modal is active to prevent background rubber-band jerks
  useEffect(() => {
    if (activeVideo) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.classList.remove('modal-open');
      };
    }
  }, [activeVideo]);

  // Reset visible video count when category changes
  useEffect(() => {
    setVisibleVideoCount(8);
  }, [selectedCategory]);

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

  const displayList = filteredBulletins;
  const featuredVideo = displayList[0] || null;
  const remainingBulletins = displayList.slice(1);
  const visibleRemaining = remainingBulletins.slice(0, visibleVideoCount);
  const hasMoreVideos = visibleVideoCount < remainingBulletins.length;

  // Find index of currently playing video in displayList
  const currentIndex = activeVideo ? displayList.findIndex(v => v.youtubeId === activeVideo.youtubeId) : -1;
  const nextVideo = currentIndex >= 0 ? displayList[(currentIndex + 1) % displayList.length] : (displayList[0] || null);
  const prevVideo = currentIndex > 0 ? displayList[currentIndex - 1] : displayList[displayList.length - 1];

  // Navigate to Next Video
  const handleNext = useCallback(() => {
    if (!nextVideo) return;
    setCountdown(null);
    setActiveVideo(nextVideo);
  }, [nextVideo]);

  // Navigate to Previous Video
  const handlePrev = useCallback(() => {
    if (!prevVideo) return;
    setCountdown(null);
    setActiveVideo(prevVideo);
  }, [prevVideo]);

  // YouTube IFrame postMessage Handshake
  const onIframeLoad = () => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'listening' }),
        '*'
      );
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onStateChange'] }),
        '*'
      );
    } catch {
      // Ignore cross-origin postMessage warnings
    }
  };

  // Listen for YouTube video ended (State 0) for automatic continuous playback
  useEffect(() => {
    if (!activeVideo) return;

    const handleMessage = (e: MessageEvent) => {
      try {
        let data = e.data;
        if (typeof data === 'string') {
          data = JSON.parse(data);
        }
        if (!data) return;

        // YouTube State 0 represents YT.PlayerState.ENDED
        const isEnded = 
          (data.event === 'onStateChange' && data.info === 0) ||
          (data.event === 'infoDelivery' && data.info?.playerState === 0) ||
          (data.info && data.info.playerState === 0);

        if (isEnded) {
          if (isAutoPlay) {
            // Trigger 3s countdown before advancing to next video
            setCountdown(3);
          }
        }
      } catch {
        // Not a JSON message or unrelated message
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeVideo, isAutoPlay]);

  // Countdown timer effect
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      handleNext();
      return;
    }
    const timer = setTimeout(() => {
      setCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, handleNext]);

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

  return (
    <section className={`rounded-3xl border p-4 sm:p-5 transition-colors ${
      isDark ? 'bg-[#090d18]/95 border-red-950/40 shadow-xl' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      
      {/* 1. SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-red-950/30">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-600 to-red-700 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
            <Tv size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-2">
                <span>AMBITION TV</span>
                <span className="text-xs text-red-500 font-bold">•</span>
                <span className="text-sm sm:text-base font-bold text-slate-200">वीडियो बुलेटिन</span>
              </h2>
              <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                LIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              यूट्यूब चैनल ({SOCIAL_LINKS.youtubeHandle}) से सीधे ग्राउंड रिपोर्ट्स, जनआंदोलन व खास इंटरव्यू
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          
          {/* Continuous Non-Stop TV Mode Button */}
          <button
            onClick={() => {
              setIsAutoPlay(true);
              setCountdown(null);
              setActiveVideo(featuredVideo || displayList[0]);
            }}
            className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-md shadow-red-600/30 transition active:scale-95 cursor-pointer shrink-0"
            title="सारे वीडियो बुलेटिन एक के बाद एक बिना रुके देखें"
          >
            <Tv size={14} className="text-white" />
            <span>📺 लगातार चलाएं (TV Mode)</span>
          </button>

          {/* Subscribe CTA Button */}
          <a 
            href={SOCIAL_LINKS.youtube} 
            target="_blank" 
            rel="noopener noreferrer"
            aria-label="एम्बिशन टीवी यूट्यूब चैनल सब्सक्राइब करें"
            className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition active:scale-95 shrink-0"
          >
            <YoutubeIcon size={15} />
            <span className="hidden sm:inline">सब्सक्राइब</span>
            <ExternalLink size={11} className="text-slate-400" />
          </a>
        </div>
      </div>

      {/* 2. CATEGORY FILTER PILLS WITH LIVE COUNTS */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3 mb-4 text-xs w-full max-w-full">
        {categoriesWithCounts.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
              setVisibleVideoCount(8);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap active:scale-95 cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === cat.id
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30'
                : isDark 
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
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
            onClick={() => setSelectedCategory('all')}
            className="text-xs text-red-400 font-bold hover:underline cursor-pointer inline-flex items-center gap-1 mt-1"
          >
            <span>← सभी वीडियो देखें ({bulletins.length})</span>
          </button>
        </div>
      )}

      {/* 3. HERO SPOTLIGHT BROADCAST (Lead Featured Video) */}
      {featuredVideo && (
        <div className={`mb-6 rounded-2xl sm:rounded-3xl border overflow-hidden transition-all shadow-xl ${
          isDark ? 'bg-gradient-to-br from-slate-900/90 via-slate-950 to-red-950/20 border-red-950/60' : 'bg-gradient-to-br from-red-50/50 via-white to-slate-50 border-red-200'
        }`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            
            {/* 16:9 Cinema Thumbnail with 1-click play */}
            <div 
              onClick={() => {
                setCountdown(null);
                setActiveVideo(featuredVideo);
              }}
              className="lg:col-span-7 relative aspect-video w-full bg-slate-950 cursor-pointer overflow-hidden group select-none"
            >
              <img 
                src={getVideoThumbnail(featuredVideo)} 
                alt={featuredVideo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent group-hover:from-black/90 transition-colors flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:bg-red-500 transition-all border-2 border-white/30 backdrop-blur-sm">
                  <Play size={28} className="fill-white ml-1" />
                </div>
              </div>

              {/* Badges */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-lg animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  मुख्य वीडियो बुलेटिन
                </span>
              </div>
              <div className="absolute bottom-3 right-3 bg-black/85 font-mono text-white text-xs px-2 py-0.5 rounded font-bold backdrop-blur border border-white/10">
                {featuredVideo.duration}
              </div>
            </div>

            {/* Featured Metadata & Action Controls */}
            <div className="lg:col-span-5 p-4 sm:p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-red-500 bg-red-950/40 border border-red-800/60 px-2.5 py-0.5 rounded-full">
                    {featuredVideo.category || 'कवर्धा विशेष'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {featuredVideo.timeAgo}
                  </span>
                </div>

                <h3 
                  onClick={() => {
                    setCountdown(null);
                    setActiveVideo(featuredVideo);
                  }}
                  className={`text-base sm:text-xl font-black leading-snug line-clamp-3 cursor-pointer transition-colors ${
                    isDark ? 'text-white hover:text-red-400' : 'text-slate-900 hover:text-red-600'
                  }`}
                >
                  {featuredVideo.title}
                </h3>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-slate-300 font-semibold">
                    <Eye size={13} className="text-red-500" /> {featuredVideo.views}
                  </span>
                  <span>•</span>
                  <span>Ambition News स्पेशल ग्राउंड रिपोर्ट</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-4 mt-3 border-t border-red-950/30">
                <button
                  onClick={() => {
                    setCountdown(null);
                    setActiveVideo(featuredVideo);
                  }}
                  className="flex-1 sm:flex-initial bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  <Play size={15} className="fill-white" />
                  <span>तुरंत चलाएं (Play)</span>
                </button>

                <button
                  onClick={() => {
                    setIsAutoPlay(true);
                    setCountdown(null);
                    setActiveVideo(featuredVideo);
                  }}
                  className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  title="एक के बाद एक लगातार ऑटो-प्ले चलाएं"
                >
                  <RefreshCw size={13} className="animate-spin text-white" />
                  <span>ऑटो-प्ले टीवी</span>
                </button>

                <button
                  onClick={(e) => handleShare(featuredVideo, e)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  title="WhatsApp पर शेयर करें"
                >
                  <WhatsAppIcon size={15} />
                  <span>शेयर</span>
                </button>

                <a
                  href={featuredVideo.youtubeUrl || `https://www.youtube.com/watch?v=${featuredVideo.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="यूट्यूब पर वीडियो देखें"
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs p-2.5 rounded-xl transition cursor-pointer"
                  title="YouTube पर देखें"
                >
                  <ExternalLink size={15} />
                </a>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 4. SUBSEQUENT VIDEOS GRID */}
      {visibleRemaining.length > 0 && (
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${
          visibleRemaining.length >= 4 
            ? 'lg:grid-cols-4' 
            : visibleRemaining.length === 3 
              ? 'lg:grid-cols-3' 
              : 'lg:grid-cols-2'
        } gap-4`}>
          {visibleRemaining.map((video) => (
            <div 
              key={video.id}
              onClick={() => {
                setCountdown(null);
                setActiveVideo(video);
              }}
              className={`group rounded-2xl border overflow-hidden cursor-pointer flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-md ${
                isDark ? 'bg-slate-950 border-slate-800/80 hover:border-red-600/60' : 'bg-slate-50 border-slate-200 hover:border-red-500 hover:shadow-lg'
              }`}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                <img 
                  src={getVideoThumbnail(video)} 
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-black/35 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play size={18} className="fill-current ml-0.5" />
                  </div>
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
                  isDark ? 'text-slate-100 group-hover:text-red-400' : 'text-slate-900 group-hover:text-red-600'
                }`}>
                  {video.title}
                </h3>

                <div className="mt-2.5 pt-2 border-t border-slate-800/40 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 font-medium">
                    <Eye size={11} className="text-red-500" /> {video.views}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleShare(video, e)}
                      aria-label="WhatsApp पर वीडियो शेयर करें"
                      className="p-1 hover:text-emerald-400 transition"
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
          ))}

          {/* If there are 3 videos and space for a 4th, render engaging Ambition TV YouTube Promo Card */}
          {visibleRemaining.length === 3 && (
            <div 
              onClick={() => window.open(SOCIAL_LINKS.youtube, '_blank')}
              className={`rounded-2xl border p-4 flex flex-col justify-between cursor-pointer group transition-all duration-300 hover:-translate-y-1 shadow-md ${
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
                    {SOCIAL_LINKS.youtubeSubs}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block">यूट्यूब चैनल</span>
                  <h3 className={`text-xs sm:text-sm font-bold leading-snug mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Ambition TV पर 500+ वीडियो बुलेटिन उपलब्ध
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                  कवर्धा व CG-MP की ताज़ा खबरें, लाइव डिबेट व ग्राउंड रिपोर्ट्स सीधे यूट्यूब पर देखें।
                </p>
              </div>

              <div className="pt-3 border-t border-red-900/30 flex items-center justify-between text-xs font-bold text-red-500 group-hover:text-red-400">
                <span>चैनल सब्सक्राइब करें</span>
                <span>➔</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. PROGRESSIVE LOAD MORE / COLLAPSE CONTROLS */}
      {remainingBulletins.length > 8 && (
        <div className="mt-5 pt-4 border-t border-red-950/30 flex flex-wrap items-center justify-center gap-3">
          {hasMoreVideos ? (
            <button
              onClick={() => setVisibleVideoCount(prev => prev + 8)}
              className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-gradient-to-r from-red-950/60 to-slate-900/80 hover:from-red-900/80 hover:to-slate-800 border border-red-600/40 text-red-300 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-lg cursor-pointer"
            >
              <span>▼ और वीडियो बुलेटिन लोड करें (+{Math.min(8, remainingBulletins.length - visibleVideoCount)} और देखें • {remainingBulletins.length - visibleVideoCount} शेष)</span>
            </button>
          ) : (
            <button
              onClick={() => setVisibleVideoCount(8)}
              className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <span>▲ कम वीडियो दिखाएं (आरंभिक 8 वीडियो पर जाएं)</span>
            </button>
          )}
        </div>
      )}

      {/* 6. INTERACTIVE VIDEO PLAYER MODAL WITH CONTINUOUS AUTOPLAY & 'UP NEXT' */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#0b0f19] border border-red-500/30 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
            
            {/* Modal Header */}
            <div className="p-3 sm:p-4 bg-[#070a12] flex items-center justify-between border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 text-red-500 font-bold text-sm">
                <YoutubeIcon size={18} />
                <span className="text-white font-black tracking-wide text-xs sm:text-sm">AMBITION TV</span>
                {currentIndex >= 0 && (
                  <span className="bg-red-950/60 text-red-300 border border-red-600/40 text-[10px] font-mono px-2 py-0.5 rounded-full">
                    बुलेटिन {currentIndex + 1} / {displayList.length}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Autoplay Toggle Switch */}
                <button
                  onClick={() => setIsAutoPlay(!isAutoPlay)}
                  className={`text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                    isAutoPlay 
                      ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-sm' 
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                  title={isAutoPlay ? 'ऑटो-प्ले चालू है: एक के बाद एक लगातार चलेगा' : 'ऑटो-प्ले बंद है: वीडियो खत्म होने पर रुकेगा'}
                >
                  <RefreshCw size={12} className={isAutoPlay ? 'animate-spin text-emerald-400' : ''} />
                  <span className="hidden sm:inline">{isAutoPlay ? 'ऑटो-प्ले चालू' : 'ऑटो-प्ले बंद'}</span>
                  <span className="sm:hidden">{isAutoPlay ? 'Auto ON' : 'Auto OFF'}</span>
                </button>

                {/* Previous Video Button */}
                <button
                  onClick={handlePrev}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-90 cursor-pointer flex items-center gap-1 text-xs font-bold"
                  title="पिछला बुलेटिन (Previous)"
                >
                  <SkipBack size={14} />
                  <span className="hidden md:inline">पिछला</span>
                </button>

                {/* Next Video Button */}
                <button
                  onClick={handleNext}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-90 cursor-pointer flex items-center gap-1 text-xs font-bold"
                  title="अगला बुलेटिन (Next)"
                >
                  <span className="hidden md:inline">अगला</span>
                  <SkipForward size={14} />
                </button>

                <button 
                  onClick={() => {
                    setCountdown(null);
                    setActiveVideo(null);
                  }}
                  className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer ml-1"
                  title="बंद करें"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto no-scrollbar flex-1 overscroll-contain">
              
              {/* 16:9 Video Embed Player with Poster & Autoplay Countdown Overlay */}
              <div className="relative aspect-video w-full bg-black overflow-hidden">
                {activeVideo.thumbnail && (
                  <img 
                    src={getVideoThumbnail(activeVideo)} 
                    alt="" 
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-40" 
                  />
                )}
                {isDirectVideoUrl(activeVideo.youtubeUrl || activeVideo.youtubeId) ? (
                  <video 
                    src={activeVideo.youtubeUrl || activeVideo.youtubeId}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain relative z-10 bg-black"
                    onEnded={() => {
                      if (isAutoPlay) setCountdown(3);
                    }}
                  />
                ) : (
                  <iframe 
                    ref={iframeRef}
                    key={activeVideo.youtubeId}
                    src={`https://www.youtube-nocookie.com/embed/${activeVideo.youtubeId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1&playsinline=1`}
                    title={activeVideo.title}
                    onLoad={onIframeLoad}
                    className="w-full h-full border-0 relative z-10"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                )}

                {/* Countdown Overlay when current video ends & next is loading */}
                {countdown !== null && nextVideo && (
                  <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                    <div className="relative flex items-center justify-center mb-4">
                      <div className="w-16 h-16 rounded-full border-4 border-red-500/30 border-t-red-500 animate-spin"></div>
                      <span className="absolute font-mono text-white text-xl font-black">{countdown}</span>
                    </div>
                    <p className="text-red-400 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                      अगला बुलेटिन {countdown} सेकंड में शुरू हो रहा है...
                    </p>
                    <h3 className="text-white font-black text-sm sm:text-base max-w-lg line-clamp-2 mb-4">
                      {nextVideo.title}
                    </h3>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleNext}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-red-600/40 flex items-center gap-2 cursor-pointer transition active:scale-95"
                      >
                        <Play size={14} className="fill-white" />
                        <span>तुरंत चलाएं (Play Now)</span>
                      </button>
                      <button
                        onClick={() => setCountdown(null)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition"
                      >
                        रद्द करें (Cancel)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Video Details & Actions */}
              <div className="p-4 sm:p-6 space-y-4 text-white">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-red-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      {activeVideo.category || 'कवर्धा विशेष'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {activeVideo.views} • {activeVideo.timeAgo}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleShare(activeVideo)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow transition active:scale-95 cursor-pointer"
                    >
                      <WhatsAppIcon size={15} />
                      <span>WhatsApp शेयर</span>
                    </button>

                    <a 
                      href={activeVideo.youtubeUrl || `https://www.youtube.com/watch?v=${activeVideo.youtubeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow transition active:scale-95"
                    >
                      <YoutubeIcon size={15} />
                      <span>YouTube पर देखें</span>
                    </a>
                  </div>
                </div>

                <h3 className="text-base sm:text-xl font-bold leading-snug">
                  {activeVideo.title}
                </h3>

                {/* UP NEXT PLAYLIST RECOMMENDATIONS */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      अगला वीडियो (Up Next Playlist)
                    </h4>
                    <span className="text-[11px] text-slate-400">क्लिक करके तुरंत चलाएं</span>
                  </div>

                  <div className={`grid grid-cols-1 sm:grid-cols-2 ${
                    bulletins.filter(b => b.youtubeId !== activeVideo.youtubeId).slice(0, 4).length >= 4 
                      ? 'lg:grid-cols-4' 
                      : bulletins.filter(b => b.youtubeId !== activeVideo.youtubeId).slice(0, 4).length === 3 
                        ? 'lg:grid-cols-3' 
                        : 'lg:grid-cols-2'
                  } gap-3`}>
                    {bulletins
                      .filter(b => b.youtubeId !== activeVideo.youtubeId)
                      .slice(0, 4)
                      .map(nextVid => (
                        <div
                          key={nextVid.id}
                          onClick={() => {
                            setCountdown(null);
                            setActiveVideo(nextVid);
                          }}
                          className="group rounded-xl border border-white/10 overflow-hidden bg-slate-900/80 hover:border-red-500/60 cursor-pointer transition flex flex-col justify-between"
                        >
                          <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                            <img 
                              src={getVideoThumbnail(nextVid)} 
                              alt={nextVid.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                            />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 flex items-center justify-center transition">
                              <Play size={14} className="fill-white text-white group-hover:scale-110 transition" />
                            </div>
                            <span className="absolute bottom-1 right-1 bg-black/80 font-mono text-[9px] text-white px-1 rounded">
                              {nextVid.duration}
                            </span>
                          </div>
                          <div className="p-2">
                            <h5 className="text-[11px] font-bold text-slate-200 line-clamp-2 leading-tight group-hover:text-red-400 transition">
                              {nextVid.title}
                            </h5>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </section>
  );
};
