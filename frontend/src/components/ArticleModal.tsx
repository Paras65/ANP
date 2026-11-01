import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Volume2, 
  VolumeX, 
  Eye, 
  Calendar, 
  UserCheck, 
  MapPin, 
  Heart, 
  Bookmark,
  ChevronRight
} from 'lucide-react';
import type { Article, Advertisement } from '../types';
import { WhatsAppIcon } from './SocialIcons';
import { getSmartCoverImage } from '../utils/categoryTheme';
import { getOptimizedImageUrl } from '../utils/imageUtils';
import { AdBanner } from './AdBanner';

interface ArticleModalProps {
  article: Article;
  onClose: () => void;
  onShareWhatsApp: (title: string, articleId?: string) => void;
  isDark: boolean;
  isBookmarked?: boolean;
  onToggleBookmark?: (article: Article) => void;
  ad?: Advertisement | null;
  relatedArticles?: Article[];
  onSelectArticle?: (article: Article) => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  article,
  onClose,
  onShareWhatsApp,
  isDark,
  isBookmarked = false,
  onToggleBookmark,
  ad,
  relatedArticles = [],
  onSelectArticle
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

  // Cancel speech on unmount & scroll to top of article
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [article._id]);

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
    <article className={`w-full max-w-4xl mx-auto rounded-3xl border shadow-xl overflow-hidden transition-colors duration-200 ${
      isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      
      {/* 1. STICKY TOP ACTION & NAVIGATION BAR */}
      <div className={`sticky top-0 z-30 px-3 sm:px-6 py-3 flex items-center justify-between border-b backdrop-blur-md transition-colors ${
        isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-white/95 border-slate-200 shadow-sm'
      }`}>
        
        {/* Back to Home Feed Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="मुख्य समाचार पर लौटें"
          className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0"
        >
          <ArrowLeft size={16} />
          <span>मुख्य समाचार पर लौटें</span>
        </button>

        {/* Action Controls: Font size, Audio reader, Share */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* Font Size Adjusters */}
          <div className={`flex rounded-lg border text-xs font-bold p-0.5 ${
            isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-300 bg-slate-100'
          }`}>
            <button 
              type="button"
              onClick={() => setFontSize('normal')}
              className={`px-2 py-0.5 rounded cursor-pointer ${fontSize === 'normal' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              title="सामान्य फ़ॉन्ट आकार"
            >
              अ
            </button>
            <button 
              type="button"
              onClick={() => setFontSize('large')}
              className={`px-2 py-0.5 rounded cursor-pointer ${fontSize === 'large' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              title="मध्यम फ़ॉन्ट आकार"
            >
              अ+
            </button>
            <button 
              type="button"
              onClick={() => setFontSize('xl')}
              className={`px-2 py-0.5 rounded cursor-pointer ${fontSize === 'xl' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              title="बड़ा फ़ॉन्ट आकार"
            >
              अ++
            </button>
          </div>

          {/* Audio Listen Button */}
          <button 
            type="button"
            onClick={toggleAudio}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition active:scale-95 shadow cursor-pointer ${
              isPlayingAudio 
                ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse' 
                : isDark 
                  ? 'bg-slate-800 text-amber-400 hover:bg-slate-700 hover:text-white border border-slate-700' 
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300'
            }`}
            title={isPlayingAudio ? 'ऑडियो रोकें' : 'हिंदी AI वाचक (खबर सुनें)'}
          >
            {isPlayingAudio ? <VolumeX size={14} /> : <Volume2 size={14} />}
            <span className="hidden sm:inline">{isPlayingAudio ? 'रुकें' : 'सुनें'}</span>
          </button>

          {/* Quick WhatsApp Share */}
          <button
            type="button"
            onClick={() => onShareWhatsApp(article.title, article._id)}
            aria-label="व्हाट्सएप पर शेयर करें"
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold p-1.5 sm:px-3 sm:py-1.5 rounded-xl flex items-center gap-1 shadow transition active:scale-95 cursor-pointer"
            title="WhatsApp शेयर"
          >
            <WhatsAppIcon size={14} />
            <span className="hidden sm:inline">शेयर</span>
          </button>
        </div>
      </div>

      {/* 2. ARTICLE BODY CONTENT */}
      <div className="p-4 sm:p-8 space-y-6">
        
        {/* Breadcrumb Navigation */}
        <div className={`flex items-center gap-1.5 text-xs font-medium ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}>
          <span 
            onClick={handleClose} 
            className="hover:underline cursor-pointer hover:text-red-500"
          >
            होमपेज
          </span>
          <ChevronRight size={13} />
          <span className="font-bold text-red-500">{article.category}</span>
          <ChevronRight size={13} />
          <span className="flex items-center gap-1">
            <MapPin size={12} /> {article.district}
          </span>
        </div>

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
              type="button"
              onClick={stopAudio} 
              className="shrink-0 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition active:scale-95 shadow cursor-pointer"
            >
              बंद करें
            </button>
          </div>
        )}

        {/* Main Headline */}
        <h1 className="text-xl sm:text-3xl lg:text-4xl font-black leading-snug">
          {article.title}
        </h1>

        {/* Byline, Author, Date & Views */}
        <div className={`flex flex-wrap items-center justify-between gap-3 pb-4 border-b text-xs ${
          isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
        }`}>
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1.5 font-bold ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}>
              <UserCheck size={14} className="text-red-500" />
              <span>{article.author}</span>
            </span>
            <span>•</span>
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
            <span className="flex items-center gap-1 font-semibold">
              <Eye size={13} className="text-red-500" /> {article.views || 1200} व्यूज
            </span>
          </div>
        </div>

        {/* Cover Image */}
        {article.coverImage && (
          <div className={`relative aspect-video w-full rounded-2xl overflow-hidden border shadow-lg ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <img 
              src={getOptimizedImageUrl(article.coverImage, 'hero')} 
              alt={article.title}
              onError={(e) => {
                (e.target as HTMLImageElement).src = getSmartCoverImage('', article.category, article.title, article.district);
              }}
              className={`w-full h-full ${article.coverImage?.includes('logo') ? 'object-contain p-8 bg-slate-950' : 'object-cover'}`} 
            />
            <div className="absolute bottom-2.5 right-2.5 bg-black/80 text-[10px] text-white px-2.5 py-1 rounded-md backdrop-blur border border-white/10 shadow">
              फोटो: Ambition News नेटवर्क
            </div>
          </div>
        )}

        {/* Article Excerpt Callout */}
        {article.excerpt && (
          <div className={`p-4 border-l-4 border-red-600 rounded-r-2xl font-bold text-sm sm:text-base italic leading-relaxed ${
            isDark ? 'bg-red-950/20 text-slate-200 border-red-600' : 'bg-red-50 text-slate-800 border-red-500'
          }`}>
            {article.excerpt}
          </div>
        )}

        {/* Full Content */}
        <div className={`space-y-4 font-normal whitespace-pre-line leading-relaxed ${
          isDark ? 'text-slate-200' : 'text-slate-800'
        } ${getFontSizeClass()}`}>
          {article.content || article.excerpt}
        </div>

        {/* Article Bottom Sponsored Ad Placement */}
        <AdBanner 
          ad={ad} 
          placement="article_bottom" 
          isDark={isDark} 
          onContactWhatsApp={() => {
            window.open(`https://api.whatsapp.com/send?phone=917000139694&text=${encodeURIComponent(`नमस्ते Ambition News, मुझे अपने प्रतिष्ठान का विज्ञापन खबर के नीचे प्रकाशित करवाना है। (संदर्भ: ${article.title})`)}`, '_blank');
          }}
        />

        {/* Bottom Engagement Bar (Likes, Bookmarks, Share) */}
        <div className={`pt-5 pb-2 border-t flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <button 
              type="button"
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm ${
                isLiked 
                  ? 'bg-rose-600 text-white' 
                  : isDark ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Heart size={16} className={isLiked ? 'fill-current' : ''} />
              <span>पसंद आया ({likes})</span>
            </button>

            {onToggleBookmark && (
              <button 
                type="button"
                onClick={() => onToggleBookmark(article)}
                aria-label={isBookmarked ? "खबर सेव्ड लिस्ट से हटाएं" : "यह खबर बाद में पढ़ने के लिए सेव करें"}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm ${
                  isBookmarked 
                    ? 'bg-amber-600 text-white' 
                    : isDark ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                title="खबर सेव करें"
              >
                <Bookmark size={15} className={isBookmarked ? 'fill-current' : ''} />
                <span>{isBookmarked ? 'सेव्ड है' : 'सेव करें'}</span>
              </button>
            )}
          </div>

          <button 
            type="button"
            onClick={() => onShareWhatsApp(article.title, article._id)}
            aria-label="यह खबर व्हाट्सएप पर शेयर करें"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
          >
            <WhatsAppIcon size={16} />
            <span>व्हाट्सएप पर शेयर करें</span>
          </button>
        </div>

        {/* 3. RELATED NEWS SECTION (इन्हें भी पढ़ें) */}
        {relatedArticles.length > 0 && onSelectArticle && (
          <div className={`mt-8 pt-6 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <h3 className="text-base sm:text-lg font-black tracking-wide flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
              <span>इन्हें भी पढ़ें (संबंधित खबरें)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {relatedArticles.map((relArt) => (
                <div
                  key={relArt._id}
                  onClick={() => onSelectArticle(relArt)}
                  className={`p-3 rounded-2xl border cursor-pointer flex gap-3 transition-transform hover:-translate-y-0.5 shadow-sm ${
                    isDark ? 'bg-slate-950/80 border-slate-800 hover:border-red-600/50' : 'bg-slate-50 border-slate-200 hover:border-red-400'
                  }`}
                >
                  <img
                    src={getOptimizedImageUrl(relArt.coverImage, 'thumbnail')}
                    alt={relArt.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getSmartCoverImage('', relArt.category, relArt.title, relArt.district);
                    }}
                    className="w-20 h-20 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-red-500">{relArt.district}</span>
                    <h4 className="text-xs font-bold leading-snug line-clamp-2">{relArt.title}</h4>
                    <span className="text-[10px] text-slate-400">
                      {new Date(relArt.publishedAt).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. BOTTOM RETURN TO FEED BANNER */}
        <div className="pt-6">
          <button
            type="button"
            onClick={handleClose}
            className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-xl transition active:scale-98 cursor-pointer"
          >
            <ArrowLeft size={18} />
            <span>← अन्य सभी मुख्य खबरें देखें (होमपेज पर लौटें)</span>
          </button>
        </div>

      </div>

    </article>
  );
};
