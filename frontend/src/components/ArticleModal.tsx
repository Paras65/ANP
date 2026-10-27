import React, { useState, useEffect } from 'react';
import { X, Volume2, VolumeX, Eye, Calendar, UserCheck, MapPin, Heart, Bookmark } from 'lucide-react';
import type { Article } from '../types';
import { WhatsAppIcon } from './SocialIcons';

interface ArticleModalProps {
  article: Article;
  onClose: () => void;
  onShareWhatsApp: (title: string, articleId?: string) => void;
  isDark: boolean;
  isBookmarked?: boolean;
  onToggleBookmark?: (article: Article) => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  article,
  onClose,
  onShareWhatsApp,
  isDark,
  isBookmarked = false,
  onToggleBookmark
}) => {
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xl'>('normal');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [likes, setLikes] = useState(() => Math.floor((article.views || 1000) / 12) + 42);
  const [isLiked, setIsLiked] = useState(false);

  // Prevent background page from rubber-banding / scrolling while modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.classList.remove('modal-open');
    };
  }, []);

  const toggleAudio = () => {
    setIsPlayingAudio(!isPlayingAudio);
  };

  const handleLike = () => {
    if (!isLiked) {
      setLikes(l => l + 1);
      setIsLiked(true);
    } else {
      setLikes(l => l - 1);
      setIsLiked(false);
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'large': return 'text-base sm:text-lg leading-relaxed';
      case 'xl': return 'text-lg sm:text-xl leading-loose';
      default: return 'text-sm sm:text-base leading-relaxed';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Sheet Container: Bottom Sheet on Mobile, Centered Modal on Tablet/Desktop */}
      <div className={`relative w-full max-w-2xl sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl border transition-all z-10 max-h-[92vh] sm:max-h-[85vh] flex flex-col ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
      }`}>
        
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1.5 bg-slate-600/70 rounded-full mx-auto my-2.5 sm:hidden shrink-0"></div>

        {/* Modal Top Controls Bar */}
        <div className={`px-4 py-2.5 sm:py-3 flex items-center justify-between border-b shrink-0 ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className="bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow">
              {article.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-red-400 font-bold">
              <MapPin size={12} /> {article.district}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Font Size Adjusters */}
            <div className={`flex rounded-lg border text-xs font-bold p-0.5 ${
              isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-300 bg-white'
            }`}>
              <button 
                onClick={() => setFontSize('normal')}
                className={`px-2 py-0.5 rounded ${fontSize === 'normal' ? 'bg-red-600 text-white' : 'text-slate-400'}`}
                title="Normal text"
              >
                अ
              </button>
              <button 
                onClick={() => setFontSize('large')}
                className={`px-2 py-0.5 rounded ${fontSize === 'large' ? 'bg-red-600 text-white' : 'text-slate-400'}`}
                title="Medium text"
              >
                अ+
              </button>
              <button 
                onClick={() => setFontSize('xl')}
                className={`px-2 py-0.5 rounded ${fontSize === 'xl' ? 'bg-red-600 text-white' : 'text-slate-400'}`}
                title="Large text"
              >
                अ++
              </button>
            </div>

            {/* Audio Listen Simulation */}
            <button 
              onClick={toggleAudio}
              className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg transition ${
                isPlayingAudio 
                  ? 'bg-amber-600 text-white animate-pulse' 
                  : isDark ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-slate-200 text-slate-700'
              }`}
              title="Listen to News (Hindi TTS)"
            >
              {isPlayingAudio ? <VolumeX size={13} /> : <Volume2 size={13} />}
              <span className="hidden sm:inline">{isPlayingAudio ? 'रुकें' : 'सुनें'}</span>
            </button>

            {/* Close Button */}
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition ml-1"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
          
          {/* Audio Player notification banner if active */}
          {isPlayingAudio && (
            <div className="p-3 bg-amber-950/50 border border-amber-800 rounded-2xl flex items-center justify-between text-xs text-amber-300 animate-in fade-in">
              <span className="flex items-center gap-2">
                <Volume2 size={15} className="animate-spin text-amber-400" />
                <span>AI ऑडियो वाचक: खबर का पाठ किया जा रहा है...</span>
              </span>
              <button onClick={() => setIsPlayingAudio(false)} className="text-amber-400 font-bold hover:underline">
                बंद करें
              </button>
            </div>
          )}

          {/* Headline */}
          <h1 className="text-lg sm:text-2xl font-black leading-snug">
            {article.title}
          </h1>

          {/* Byline & Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-semibold text-slate-200">
                <UserCheck size={13} className="text-red-500" />
                {article.author}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={13} />
                {new Date(article.publishedAt).toLocaleDateString('hi-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye size={13} /> {article.views || 1200} व्यूज
              </span>
            </div>
          </div>

          {/* Cover Image */}
          {article.coverImage && (
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow">
              <img 
                src={article.coverImage} 
                alt={article.title}
                className="w-full h-full object-cover" 
              />
              <div className="absolute bottom-2 right-2 bg-black/75 text-[10px] text-white px-2 py-0.5 rounded-md backdrop-blur">
                फोटो: Ambition News नेटवर्क
              </div>
            </div>
          )}

          {/* Article Excerpt Callout */}
          <div className="p-3.5 bg-red-950/20 border-l-4 border-red-600 rounded-r-xl font-semibold text-xs sm:text-sm text-slate-300 italic leading-relaxed">
            {article.excerpt}
          </div>

          {/* Full Content */}
          <div className={`space-y-3 font-normal whitespace-pre-line text-slate-200 ${getFontSizeClass()}`}>
            {article.content || article.excerpt}
          </div>

        </div>

        {/* Modal Sticky Bottom Action Bar */}
        <div className={`p-3 sm:p-4 flex items-center justify-between gap-3 border-t shrink-0 ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          
          {/* Like & Bookmark Quick Buttons */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition active:scale-95 ${
                isLiked 
                  ? 'bg-rose-600/20 text-rose-500 border border-rose-500/40' 
                  : isDark ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              <Heart size={15} className={isLiked ? 'fill-current' : ''} />
              <span>{likes}</span>
            </button>

            {onToggleBookmark && (
              <button 
                onClick={() => onToggleBookmark(article)}
                className={`p-2 rounded-xl text-xs font-bold transition active:scale-95 ${
                  isBookmarked 
                    ? 'bg-amber-600/20 text-amber-400 border border-amber-500/40' 
                    : isDark ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-slate-200 text-slate-700'
                }`}
                title="Bookmark article"
              >
                <Bookmark size={15} className={isBookmarked ? 'fill-current' : ''} />
              </button>
            )}
          </div>

          {/* Share on WhatsApp */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onShareWhatsApp(article.title, article._id)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition active:scale-95"
            >
              <WhatsAppIcon size={14} />
              <span>व्हाट्सएप शेयर</span>
            </button>

            <button 
              onClick={onClose}
              className="hidden sm:inline-block bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3.5 py-2 rounded-xl font-medium"
            >
              बंद करें
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
