import React, { useState } from 'react';
import { Play, ExternalLink, X, Eye, Clock, Tv } from 'lucide-react';
import { YoutubeIcon } from './SocialIcons';
import type { VideoBulletin } from '../types';
import { SOCIAL_LINKS } from '../data/mockData';

interface VideoSectionProps {
  bulletins: VideoBulletin[];
  isDark: boolean;
}

export const VideoSection: React.FC<VideoSectionProps> = ({ bulletins, isDark }) => {
  const [activeVideo, setActiveVideo] = useState<VideoBulletin | null>(null);

  return (
    <section className={`rounded-2xl border p-4 sm:p-5 transition-colors ${
      isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-md">
            <Tv size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                AMBITION TV • ताज़ा वीडियो बुलेटिन
              </h2>
              <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded animate-pulse">
                🔴 LIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              यूट्यूब चैनल ({SOCIAL_LINKS.youtubeHandle}) से सीधे प्रसारित ग्राउंड रिपोर्ट्स व खास इंटरव्यू
            </p>
          </div>
        </div>

        {/* Subscribe CTA Button */}
        <a 
          href={SOCIAL_LINKS.youtube} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md transition active:scale-95 shrink-0"
        >
          <YoutubeIcon size={16} />
          <span>सब्सक्राइब करें ({SOCIAL_LINKS.youtubeSubs})</span>
          <ExternalLink size={12} />
        </a>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {bulletins.map((video) => (
          <div 
            key={video.id}
            onClick={() => setActiveVideo(video)}
            className={`group rounded-xl border overflow-hidden cursor-pointer flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
              isDark ? 'bg-slate-950 border-slate-800 hover:border-red-600/60' : 'bg-slate-50 border-slate-200 hover:border-red-500 hover:shadow-md'
            }`}
          >
            {/* Thumbnail */}
            <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
              <img 
                src={video.thumbnail} 
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play size={18} className="fill-current ml-0.5" />
                </div>
              </div>

              {/* Badges */}
              <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center text-[10px] text-white">
                <span className="bg-black/70 backdrop-blur px-1.5 py-0.5 rounded font-medium">
                  {video.category}
                </span>
                <span className="bg-black/80 font-mono px-1.5 py-0.5 rounded font-bold">
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
                <span className="flex items-center gap-1">
                  <Eye size={11} /> {video.views} व्यूज
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={11} /> {video.timeAgo}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video Modal Player */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="p-3 sm:p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
                <YoutubeIcon size={18} />
                <span className="text-white">Ambition News Video Player</span>
              </div>
              <button 
                onClick={() => setActiveVideo(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Video Player Embed / Container */}
            <div className="relative aspect-video w-full bg-black">
              <iframe 
                src={`https://www.youtube-nocookie.com/embed/${activeVideo.youtubeId}?autoplay=1&rel=0`}
                title={activeVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>

            {/* Video Details & Actions */}
            <div className="p-4 sm:p-5 space-y-3 bg-slate-900 text-white">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-red-600 text-[11px] font-bold px-2 py-0.5 rounded">
                  {activeVideo.category}
                </span>
                <span className="text-xs text-slate-400">
                  {activeVideo.views} व्यूज • {activeVideo.timeAgo}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold leading-snug">
                {activeVideo.title}
              </h3>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span>प्रसारण:</span>
                  <span className="font-bold text-white">Ambition News (कवर्धा डेस्क)</span>
                </div>

                <div className="flex gap-2">
                  <a 
                    href={SOCIAL_LINKS.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow"
                  >
                    <YoutubeIcon size={14} />
                    <span>YouTube पर सब्सक्राइब करें</span>
                  </a>
                  <button 
                    onClick={() => setActiveVideo(null)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg font-medium"
                  >
                    बंद करें
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </section>
  );
};
