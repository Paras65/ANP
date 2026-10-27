import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  ExternalLink, 
  X, 
  Eye, 
  Clock, 
  Tv, 
  Plus, 
  Check, 
  AlertCircle, 
  RefreshCw,
  SkipBack,
  SkipForward
} from 'lucide-react';
import { YoutubeIcon, WhatsAppIcon } from './SocialIcons';
import type { VideoBulletin } from '../types';
import { SOCIAL_LINKS } from '../data/mockData';
import { parseYouTubeUrl } from '../utils/mediaUtils';

interface VideoSectionProps {
  bulletins: VideoBulletin[];
  isDark: boolean;
  onAddVideo?: (video: VideoBulletin) => void;
  onSync?: () => void;
  isSyncing?: boolean;
  onShareWhatsApp?: (title: string, videoUrl?: string) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'सभी वीडियो' },
  { id: 'ground', label: 'ग्राउंड रिपोर्टिंग', keywords: ['ग्राउंड', 'सड़क', 'पुलिया', 'बारिश', 'नेवारीगुडा', 'चंदनपुर', 'सकरी'] },
  { id: 'kawardha', label: 'कवर्धा विशेष', keywords: ['कवर्धा', 'कबीरधाम', 'भोरमदेव'] },
  { id: 'governance', label: 'शासन व राजनीति', keywords: ['सरकार', 'भीम आर्मी', 'पटवारी', 'कलेक्टर', 'भाजपा', 'अकबर', 'विजय शर्मा', 'साव', 'कोटवार'] },
  { id: 'social', label: 'समाज व जनहित', keywords: ['नेत्र', 'अस्पताल', 'आयुष्मान', 'मूर्तिकार', 'दुकान', 'ऑफर', 'शोरूम', 'Ola', 'दुर्गा', 'नैला'] }
];

export const VideoSection: React.FC<VideoSectionProps> = ({ 
  bulletins, 
  isDark, 
  onAddVideo, 
  onSync, 
  isSyncing = false,
  onShareWhatsApp
}) => {
  const [activeVideo, setActiveVideo] = useState<VideoBulletin | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoCategory, setVideoCategory] = useState('कवर्धा स्पेशल');
  const [videoDuration, setVideoDuration] = useState('10:00');
  const [parsedInfo, setParsedInfo] = useState<ReturnType<typeof parseYouTubeUrl>>(null);

  // Filters & Expansion
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Autoplay & Playlist Continuous Playback State
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  const handleUrlChange = (val: string) => {
    setInputUrl(val);
    const parsed = parseYouTubeUrl(val);
    setParsedInfo(parsed);
  };

  const handleSaveVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedInfo || !videoTitle.trim()) return;

    const newVid: VideoBulletin = {
      id: 'vid_' + Date.now(),
      title: videoTitle.trim(),
      youtubeId: parsedInfo.id,
      thumbnail: parsedInfo.thumbnailUrl,
      duration: videoDuration || '10:00',
      views: 'ताज़ा',
      timeAgo: 'अभी-अभी',
      category: videoCategory,
      youtubeUrl: parsedInfo.watchUrl
    };

    if (onAddVideo) {
      onAddVideo(newVid);
    }
    setShowAddModal(false);
    setInputUrl('');
    setVideoTitle('');
    setParsedInfo(null);
  };

  // Filter bulletins based on selected category
  const filteredBulletins = bulletins.filter(b => {
    if (selectedCategory === 'all') return true;
    const cat = CATEGORIES.find(c => c.id === selectedCategory);
    if (!cat || !cat.keywords) return true;
    const title = (b.title + ' ' + (b.category || '')).toLowerCase();
    return cat.keywords.some(k => title.includes(k.toLowerCase()));
  });

  const displayList = filteredBulletins.length > 0 ? filteredBulletins : bulletins;
  const featuredVideo = displayList[0] || null;
  const remainingBulletins = displayList.slice(1);
  const visibleRemaining = isExpanded ? remainingBulletins : remainingBulletins.slice(0, 8);

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

          {onSync && (
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 transition active:scale-95 shadow cursor-pointer disabled:opacity-50"
              title="यूट्यूब से ताज़ा वीडियो स्वतः सिंक करें"
            >
              <RefreshCw size={13} className={`text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'सिंक हो रहा है...' : '🔄 ऑटो-सिंक'}</span>
            </button>
          )}

          {onAddVideo && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 transition active:scale-95 shadow cursor-pointer"
              title="नया यूट्यूब वीडियो लिंक जोड़ें"
            >
              <Plus size={14} className="text-red-400" />
              <span>+ जोड़ें</span>
            </button>
          )}

          {/* Subscribe CTA Button */}
          <a 
            href={SOCIAL_LINKS.youtube} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition active:scale-95 shrink-0"
          >
            <YoutubeIcon size={15} />
            <span className="hidden sm:inline">सब्सक्राइब</span>
            <ExternalLink size={11} className="text-slate-400" />
          </a>
        </div>
      </div>

      {/* 2. CATEGORY FILTER PILLS */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3 mb-4 text-xs">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
              setIsExpanded(false);
            }}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition whitespace-nowrap active:scale-95 cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30'
                : isDark 
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

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
                src={featuredVideo.thumbnail} 
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                src={video.thumbnail} 
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
      </div>

      {/* 5. EXPAND / COLLAPSE CONTROLS */}
      {remainingBulletins.length > 8 && (
        <div className="mt-5 pt-4 border-t border-red-950/30 flex items-center justify-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-gradient-to-r from-red-950/60 to-slate-900/80 hover:from-red-900/80 hover:to-slate-800 border border-red-600/40 text-red-300 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-lg cursor-pointer"
          >
            {isExpanded ? (
              <span>▲ कम वीडियो बुलेटिन दिखाएं (कम करें)</span>
            ) : (
              <span>▼ और {remainingBulletins.length - 8} वीडियो बुलेटिन देखें (कुल {displayList.length} वीडियो)</span>
            )}
          </button>
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
                    src={activeVideo.thumbnail} 
                    alt="" 
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
                  />
                )}
                <iframe 
                  ref={iframeRef}
                  key={activeVideo.youtubeId}
                  src={`https://www.youtube-nocookie.com/embed/${activeVideo.youtubeId}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}&rel=0&modestbranding=1&playsinline=1`}
                  title={activeVideo.title}
                  onLoad={onIframeLoad}
                  className="w-full h-full border-0 relative z-10"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>

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
                    <h4 className="text-white font-black text-sm sm:text-base max-w-lg line-clamp-2 mb-4">
                      {nextVideo.title}
                    </h4>
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

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                              src={nextVid.thumbnail} 
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

      {/* 7. ADD NEW YOUTUBE VIDEO MODAL (Admin & Manual) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-red-500/30 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            
            <div className="p-4 bg-[#070a12] flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
                <YoutubeIcon size={18} />
                <span className="text-white font-bold">नया यूट्यूब वीडियो बुलेटिन जोड़ें</span>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveVideo} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>यूट्यूब वीडियो लिंक (YouTube Video URL)</span>
                  <span className="text-[10px] text-red-400 font-normal">youtube.com/watch?v=... या youtu.be/...</span>
                </label>
                <input 
                  type="text"
                  value={inputUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="उदा. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  className="w-full bg-[#05070e] border border-white/15 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none transition"
                  required
                />
              </div>

              {parsedInfo && (
                <div className="p-3 rounded-2xl bg-black/40 border border-emerald-500/40 flex items-center gap-3">
                  <div className="w-20 aspect-video rounded-lg overflow-hidden relative shrink-0 bg-slate-900 border border-white/10">
                    <img src={parsedInfo.thumbnailUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                      <Check size={12} />
                      <span>मान्य यूट्यूब वीडियो आईडी: {parsedInfo.id}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                      थंबनेल व HD प्लेयर तैयार है
                    </span>
                  </div>
                </div>
              )}

              {inputUrl && !parsedInfo && (
                <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-500/30 flex items-center gap-2 text-[11px] text-red-400">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>कृपया मान्य यूट्यूब वीडियो लिंक दर्ज करें।</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">वीडियो शीर्षक (Title)</label>
                <input 
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="उदा. कवर्धा में किसानों की बड़ी रैली, प्रशासन से मांग..."
                  className="w-full bg-[#05070e] border border-white/15 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">श्रेणी (Category)</label>
                  <select
                    value={videoCategory}
                    onChange={(e) => setVideoCategory(e.target.value)}
                    className="w-full bg-[#05070e] border border-white/15 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="कवर्धा विशेष">कवर्धा विशेष</option>
                    <option value="ग्राउंड रिपोर्ट">ग्राउंड रिपोर्ट</option>
                    <option value="राजनीति">राजनीति</option>
                    <option value="क्राइम">क्राइम</option>
                    <option value="विकास कार्य">विकास कार्य</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">अवधि (Duration)</label>
                  <input 
                    type="text"
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(e.target.value)}
                    placeholder="10:00"
                    className="w-full bg-[#05070e] border border-white/15 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={!parsedInfo || !videoTitle.trim()}
                  className="bg-gradient-to-r from-red-600 to-rose-600 hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-red-600/30 transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check size={14} />
                  <span>वीडियो प्रकाशित करें</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </section>
  );
};
