import React from 'react';
import { X, Maximize2 } from 'lucide-react';
import type { VideoBulletin } from '../types';
import { isDirectVideoUrl } from '../utils/mediaUtils';

interface FloatingMiniPlayerProps {
  video: VideoBulletin;
  onClose: () => void;
  onExpand: () => void;
}

export const FloatingMiniPlayer: React.FC<FloatingMiniPlayerProps> = ({
  video,
  onClose,
  onExpand
}) => {
  return (
    <div 
      className="fixed bottom-20 right-3 sm:right-6 z-40 w-[280px] sm:w-[320px] rounded-2xl overflow-hidden shadow-2xl border-2 border-red-600 bg-black animate-in slide-in-from-bottom-5 duration-300 select-none group"
    >
      {/* Top Controls Bar */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-30 pointer-events-none">
        <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
          LIVE TV
        </span>
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Expand to Large Screen */}
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
            title="वीडियो बंद करें"
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

      {/* Bottom Mini Headline & Click to Scroll Up */}
      <div 
        onClick={onExpand}
        className="p-2 bg-gradient-to-t from-black via-black/90 to-black/70 text-white cursor-pointer hover:bg-slate-900 transition flex items-center justify-between gap-2"
        title="क्लिक करके बड़ी स्क्रीन पर जाएं"
      >
        <p className="text-[10px] font-bold truncate flex-1">
          {video.title}
        </p>
        <span className="text-[9px] text-red-400 font-bold shrink-0">
          बड़ा करें ⛶
        </span>
      </div>
    </div>
  );
};
