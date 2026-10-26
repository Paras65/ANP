import React, { useState } from 'react';
import { Play, ExternalLink, X, Eye, Clock, Tv, Plus, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { YoutubeIcon } from './SocialIcons';
import type { VideoBulletin } from '../types';
import { SOCIAL_LINKS } from '../data/mockData';
import { parseYouTubeUrl } from '../utils/mediaUtils';

interface VideoSectionProps {
  bulletins: VideoBulletin[];
  isDark: boolean;
  onAddVideo?: (video: VideoBulletin) => void;
  onSync?: () => void;
  isSyncing?: boolean;
}

export const VideoSection: React.FC<VideoSectionProps> = ({ bulletins, isDark, onAddVideo, onSync, isSyncing = false }) => {
  const [activeVideo, setActiveVideo] = useState<VideoBulletin | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoCategory, setVideoCategory] = useState('कवर्धा स्पेशल');
  const [videoDuration, setVideoDuration] = useState('10:00');
  const [parsedInfo, setParsedInfo] = useState<ReturnType<typeof parseYouTubeUrl>>(null);

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
      views: '1',
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

  return (
    <section className={`rounded-3xl border p-4 sm:p-5 transition-colors ${
      isDark ? 'bg-[#090d18]/95 border-red-950/40 shadow-xl' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-red-950/30">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-white shadow-md shadow-red-600/30">
            <Tv size={19} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                AMBITION TV • लाइव यूट्यूब वीडियो बुलेटिन
              </h2>
              <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                🔴 LIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              यूट्यूब चैनल ({SOCIAL_LINKS.youtubeHandle}) से सीधे प्रसारित ग्राउंड रिपोर्ट्स व खास इंटरव्यू
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {onSync && (
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 transition active:scale-95 shadow cursor-pointer disabled:opacity-50"
              title="यूट्यूब से ताज़ा वीडियो स्वतः सिंक करें"
            >
              <RefreshCw size={13} className={`text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'सिंक हो रहा है...' : '🔄 ऑटो-सिंक'}</span>
            </button>
          )}

          {onAddVideo && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 transition active:scale-95 shadow"
              title="नया यूट्यूब वीडियो लिंक जोड़ें"
            >
              <Plus size={14} className="text-red-400" />
              <span>+ वीडियो जोड़ें</span>
            </button>
          )}

          {/* Subscribe CTA Button */}
          <a 
            href={SOCIAL_LINKS.youtube} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md shadow-red-600/30 transition active:scale-95 shrink-0"
          >
            <YoutubeIcon size={16} />
            <span>सब्सक्राइब करें ({SOCIAL_LINKS.youtubeSubs})</span>
            <ExternalLink size={12} />
          </a>
        </div>
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
                    href={activeVideo.youtubeUrl || SOCIAL_LINKS.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow"
                  >
                    <YoutubeIcon size={14} />
                    <span>YouTube पर देखें</span>
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

      {/* Add New YouTube Video Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-red-500/30 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            
            <div className="p-4 bg-[#070a12] flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
                <YoutubeIcon size={18} />
                <span className="text-white">नया यूट्यूब वीडियो बुलेटिन जोड़ें</span>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveVideo} className="p-5 space-y-4">
              {/* URL Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>यूट्यूब वीडियो लिंक (YouTube URL)</span>
                  <span className="text-[10px] text-red-400 font-normal">watch?v=, youtu.be, या Shorts</span>
                </label>
                <input 
                  type="text"
                  value={inputUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="उदा. https://www.youtube.com/watch?v=..."
                  className="w-full bg-[#05070e] border border-white/15 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none transition"
                  required
                />
              </div>

              {/* Live Preview if parsed */}
              {parsedInfo && (
                <div className="p-3 rounded-2xl bg-black/40 border border-emerald-500/40 flex items-center gap-3">
                  <div className="w-24 aspect-video rounded-lg overflow-hidden relative shrink-0 bg-slate-900 border border-white/10">
                    <img 
                      src={parsedInfo.thumbnailUrl} 
                      alt="Thumbnail Preview" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Play size={12} className="text-white fill-current" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                      <Check size={12} />
                      <span>मान्य यूट्यूब वीडियो मिला!</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">
                      ID: {parsedInfo.id} {parsedInfo.isShort ? '(Shorts)' : ''}
                    </span>
                  </div>
                </div>
              )}

              {inputUrl && !parsedInfo && (
                <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-500/30 flex items-center gap-2 text-[11px] text-red-400">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>कृपया वैध यूट्यूब लिंक दर्ज करें।</span>
                </div>
              )}

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">वीडियो शीर्षक (Title)</label>
                <input 
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="उदा. कवर्धा में नई सड़क परियोजना का भूमिपूजन..."
                  className="w-full bg-[#05070e] border border-white/15 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none transition"
                  required
                />
              </div>

              {/* Category & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">श्रेणी (Category)</label>
                  <select
                    value={videoCategory}
                    onChange={(e) => setVideoCategory(e.target.value)}
                    className="w-full bg-[#05070e] border border-white/15 focus:border-red-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                  >
                    <option value="कवर्धा स्पेशल">कवर्धा स्पेशल</option>
                    <option value="राज्य बुलेटिन">राज्य बुलेटिन</option>
                    <option value="राजनीति">राजनीति</option>
                    <option value="अपराध">अपराध</option>
                    <option value="कृषि व मंडी">कृषि व मंडी</option>
                    <option value="संस्कृति व धरोहर">संस्कृति व धरोहर</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">अवधि (Duration)</label>
                  <input 
                    type="text"
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(e.target.value)}
                    placeholder="उदा. 12:45"
                    className="w-full bg-[#05070e] border border-white/15 focus:border-red-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={!parsedInfo || !videoTitle.trim()}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-red-600/30 transition active:scale-95 flex items-center gap-1.5"
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
