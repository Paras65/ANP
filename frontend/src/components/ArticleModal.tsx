import React, { useState, useEffect } from 'react';
import { X, Volume2, VolumeX, Eye, Calendar, UserCheck, MapPin, Heart, Bookmark } from 'lucide-react';
import type { Article } from '../types';
import { WhatsAppIcon } from './SocialIcons';
import { getSmartCoverImage } from '../utils/categoryTheme';

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

  // Stop any active speech synthesis
  const stopAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  // Prevent background page from rubber-banding / scrolling & cancel speech on modal unmount
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.classList.remove('modal-open');
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Real Hindi AI Audio Reader (Web Speech API)
  const toggleAudio = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('आपके ब्राउज़र में AI ऑडियो वाचक (Text-to-Speech) समर्थित नहीं है।');
      return;
    }

    if (isPlayingAudio) {
      stopAudio();
      return;
    }

    // Clean & normalize Hindi news text for speech
    const headline = article.title ? `${article.title}। ` : '';
    const excerpt = article.excerpt ? `${article.excerpt}। ` : '';
    const body = article.content || '';
    const fullRaw = `${headline}${excerpt}${body}`;
    const cleanText = fullRaw
      .replace(/<[^>]+>/g, '') // strip HTML tags
      .replace(/https?:\/\/\S+/g, '') // strip URLs
      .replace(/[*_#`~[\]()]/g, ' ') // strip markdown
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    // Reset previous utterances
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.95; // Natural Hindi news pace
    utterance.pitch = 1.0;

    // Pick a natural Hindi voice if available
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => 
      v.lang === 'hi-IN' || 
      v.lang === 'hi_IN' || 
      v.lang.startsWith('hi') || 
      v.name.toLowerCase().includes('hindi') ||
      v.name.toLowerCase().includes('swara') ||
      v.name.toLowerCase().includes('lekha')
    );
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }

    utterance.onstart = () => {
      setIsPlayingAudio(true);
    };

    utterance.onend = () => {
      setIsPlayingAudio(false);
    };

    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.warn('SpeechSynthesis error:', e);
      }
      setIsPlayingAudio(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  };

  const handleClose = () => {
    stopAudio();
    onClose();
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
      <div className="absolute inset-0" onClick={handleClose}></div>

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

            {/* Audio Listen Button */}
            <button 
              onClick={toggleAudio}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl transition active:scale-95 shadow cursor-pointer ${
                isPlayingAudio 
                  ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse' 
                  : isDark 
                    ? 'bg-slate-800 text-amber-400 hover:bg-slate-700 hover:text-white border border-slate-700' 
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300'
              }`}
              title={isPlayingAudio ? 'ऑडियो रोकें' : 'हिंदी AI वाचक (खबर सुनें)'}
            >
              {isPlayingAudio ? <VolumeX size={14} /> : <Volume2 size={14} />}
              <span>{isPlayingAudio ? 'रुकें' : '🎧 सुनें'}</span>
            </button>

            {/* Close Button */}
            <button 
              onClick={handleClose}
              className={`p-1 rounded-lg transition ml-1 ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
          
          {/* Audio Player notification banner if active */}
          {isPlayingAudio && (
            <div className="p-3 bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border border-amber-600/60 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-200 animate-in fade-in shadow-lg">
              <span className="flex items-center gap-2.5 min-w-0">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                <Volume2 size={16} className="text-amber-400 shrink-0 animate-pulse" />
                <span className="font-bold truncate">AI ऑडियो वाचक: समाचार का पाठ चल रहा है...</span>
              </span>
              <button 
                onClick={stopAudio} 
                className="shrink-0 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition active:scale-95 shadow cursor-pointer"
              >
                बंद करें
              </button>
            </div>
          )}

          {/* Headline */}
          <h1 className="text-lg sm:text-2xl font-black leading-snug">
            {article.title}
          </h1>

          {/* Byline & Metadata */}
          <div className={`flex flex-wrap items-center justify-between gap-2 pb-3 border-b text-xs ${
            isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
          }`}>
            <div className="flex items-center gap-3">
              <span className={`flex items-center gap-1 font-semibold ${
                isDark ? 'text-slate-200' : 'text-slate-800'
              }`}>
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
            <div className={`relative aspect-video w-full rounded-2xl overflow-hidden border shadow ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <img 
                src={article.coverImage || getSmartCoverImage('', article.category, article.title, article.district)} 
                alt={article.title}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getSmartCoverImage('', article.category, article.title, article.district);
                }}
                className={`w-full h-full ${article.coverImage?.includes('logo') ? 'object-contain p-8 bg-slate-950' : 'object-cover'}`} 
              />
              <div className="absolute bottom-2 right-2 bg-black/75 text-[10px] text-white px-2 py-0.5 rounded-md backdrop-blur">
                फोटो: Ambition News नेटवर्क
              </div>
            </div>
          )}

          {/* Article Excerpt Callout */}
          <div className={`p-3.5 border-l-4 border-red-600 rounded-r-xl font-semibold text-xs sm:text-sm italic leading-relaxed ${
            isDark ? 'bg-red-950/20 text-slate-300' : 'bg-red-50/80 text-slate-800 border-red-500'
          }`}>
            {article.excerpt}
          </div>

          {/* Full Content */}
          <div className={`space-y-3 font-normal whitespace-pre-line leading-relaxed ${
            isDark ? 'text-slate-200' : 'text-slate-800'
          } ${getFontSizeClass()}`}>
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
              className={`hidden sm:inline-block text-xs px-3.5 py-2 rounded-xl font-medium transition ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              बंद करें
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
