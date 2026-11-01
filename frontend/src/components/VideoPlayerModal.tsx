import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  X, 
  RefreshCw,
  SkipBack, 
  SkipForward 
} from 'lucide-react';
import { YoutubeIcon, WhatsAppIcon } from './SocialIcons';
import type { VideoBulletin } from '../types';
import { isDirectVideoUrl, getVideoThumbnail } from '../utils/mediaUtils';

export interface VideoPlayerModalProps {
  video: VideoBulletin;
  bulletins: VideoBulletin[];
  onClose: () => void;
  onSelectVideo: (video: VideoBulletin) => void;
  onShareWhatsApp?: (title: string, videoUrl?: string) => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  video,
  bulletins = [],
  onClose,
  onSelectVideo,
  onShareWhatsApp
}) => {
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Close video modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Lock body scroll while video modal is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.classList.remove('modal-open');
    };
  }, []);

  // Find index of currently playing video in bulletins
  const currentIndex = bulletins.findIndex(v => v.youtubeId === video.youtubeId);
  const nextVideo = currentIndex >= 0 
    ? bulletins[(currentIndex + 1) % bulletins.length] 
    : (bulletins[0] || null);
  const prevVideo = currentIndex > 0 
    ? bulletins[currentIndex - 1] 
    : bulletins[bulletins.length - 1];

  // Navigate to Next Video
  const handleNext = useCallback(() => {
    if (!nextVideo) return;
    setCountdown(null);
    onSelectVideo(nextVideo);
  }, [nextVideo, onSelectVideo]);

  // Navigate to Previous Video
  const handlePrev = useCallback(() => {
    if (!prevVideo) return;
    setCountdown(null);
    onSelectVideo(prevVideo);
  }, [prevVideo, onSelectVideo]);

  // Countdown timer when video ends
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      handleNext();
      return;
    }
    const timer = setTimeout(() => {
      setCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, handleNext]);

  const handleShare = (v: VideoBulletin, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const url = v.youtubeUrl || `https://www.youtube.com/watch?v=${v.youtubeId}`;
    if (onShareWhatsApp) {
      onShareWhatsApp(v.title, url);
    } else {
      const text = `🔴 *Ambition TV • विशेष वीडियो बुलेटिन*:\n${v.title}\n\n▶️ तुरंत यहाँ देखें:\n${url}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 cursor-pointer"
      role="dialog"
      aria-modal="true"
      aria-label="वीडियो बुलेटिन प्लेयर"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0b0f19] border border-red-500/30 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh] cursor-default"
      >
        {/* Modal Header */}
        <div className="p-3 sm:p-4 bg-[#070a12] flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 text-red-500 font-bold text-sm">
            <YoutubeIcon size={18} />
            <span className="text-white font-black tracking-wide text-xs sm:text-sm">AMBITION TV</span>
            {currentIndex >= 0 && (
              <span className="bg-red-950/60 text-red-300 border border-red-600/40 text-[10px] font-mono px-2 py-0.5 rounded-full">
                बुलेटिन {currentIndex + 1} / {bulletins.length}
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
              aria-label="पिछला वीडियो बुलेटिन चलाएं"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-90 cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="पिछला बुलेटिन (Previous)"
            >
              <SkipBack size={14} />
              <span className="hidden md:inline">पिछला</span>
            </button>

            {/* Next Video Button */}
            <button
              onClick={handleNext}
              aria-label="अगला वीडियो बुलेटिन चलाएं"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-90 cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="अगला बुलेटिन (Next)"
            >
              <span className="hidden md:inline">अगला</span>
              <SkipForward size={14} />
            </button>

            {/* Close Button */}
            <button 
              onClick={onClose}
              aria-label="वीडियो प्लेयर विंडो बंद करें"
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer ml-1"
              title="बंद करें (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto no-scrollbar flex-1 overscroll-contain">
          
          {/* 16:9 Video Embed Player with Poster & Autoplay Countdown Overlay */}
          <div className="relative aspect-video w-full bg-black overflow-hidden">
            {video.thumbnail && (
              <img 
                src={getVideoThumbnail(video)} 
                alt="" 
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-40" 
              />
            )}
            {isDirectVideoUrl(video.youtubeUrl || video.youtubeId) ? (
              <video 
                src={video.youtubeUrl || video.youtubeId}
                poster={getVideoThumbnail(video)}
                preload="metadata"
                controls
                controlsList="nodownload"
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
                key={video.youtubeId}
                src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1&playsinline=1`}
                title={video.title}
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
                  {video.category || 'कवर्धा विशेष'}
                </span>
                <span className="text-xs text-slate-400">
                  {video.views} • {video.timeAgo}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShare(video)}
                  aria-label="यह वीडियो व्हाट्सएप पर शेयर करें"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow transition active:scale-95 cursor-pointer"
                >
                  <WhatsAppIcon size={15} />
                  <span>WhatsApp शेयर</span>
                </button>

                
              </div>
            </div>

            <h3 className="text-base sm:text-xl font-bold leading-snug">
              {video.title}
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
                bulletins.filter(b => b.youtubeId !== video.youtubeId).slice(0, 4).length >= 4 
                  ? 'lg:grid-cols-4' 
                  : bulletins.filter(b => b.youtubeId !== video.youtubeId).slice(0, 4).length === 3 
                    ? 'lg:grid-cols-3' 
                    : 'lg:grid-cols-2'
              } gap-3`}>
                {bulletins
                  .filter(b => b.youtubeId !== video.youtubeId)
                  .slice(0, 4)
                  .map(nextVid => (
                    <div
                      key={nextVid.id || nextVid.youtubeId}
                      onClick={() => {
                        setCountdown(null);
                        onSelectVideo(nextVid);
                      }}
                      className="group rounded-xl border border-white/10 overflow-hidden bg-slate-900/80 hover:border-red-500/60 cursor-pointer transition flex flex-col justify-between"
                    >
                      <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                        <img 
                          src={getVideoThumbnail(nextVid)} 
                          alt={nextVid.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 flex items-center justify-center transition">
                          <Play size={14} className="fill-white text-white group-hover:scale-110 transition" />
                        </div>
                        {nextVid.duration && (
                          <span className="absolute bottom-1 right-1 bg-black/80 font-mono text-[9px] text-white px-1 rounded">
                            {nextVid.duration}
                          </span>
                        )}
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
  );
};
export default VideoPlayerModal;
