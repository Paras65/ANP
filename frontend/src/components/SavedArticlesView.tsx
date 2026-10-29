import React from 'react';
import { Bookmark, Trash2, Clock, Play } from 'lucide-react';
import { formatRelativeHindiTime } from '../utils/dateUtils';
import { getSmartCoverImage } from '../utils/categoryTheme';
import { getOptimizedImageUrl } from '../utils/imageUtils';
import { WhatsAppIcon } from './SocialIcons';
import type { Article, InstagramPost } from '../types';
import type { TabType } from './BottomNav';

export interface SavedArticlesViewProps {
  isDark: boolean;
  savedArticles: Article[];
  savedReelsList: InstagramPost[];
  totalSavedCount: number;
  savedTabFilter: 'all' | 'articles' | 'reels';
  setSavedTabFilter: (tab: 'all' | 'articles' | 'reels') => void;
  handleClearAllSaved: () => void;
  openArticleModal: (art: Article) => void;
  openReelModal: (id: string) => void;
  shareWhatsApp: (title: string, id: string) => void;
  toggleBookmark: (art: Article) => void;
  toggleReelBookmark: (id: string) => void;
  setActiveTab: (tab: TabType) => void;
}

export const SavedArticlesView: React.FC<SavedArticlesViewProps> = ({
  isDark,
  savedArticles,
  savedReelsList,
  totalSavedCount,
  savedTabFilter,
  setSavedTabFilter,
  handleClearAllSaved,
  openArticleModal,
  openReelModal,
  shareWhatsApp,
  toggleBookmark,
  toggleReelBookmark,
  setActiveTab
}) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header with Title and Clear All Button */}
      <div className={`p-4 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
            <Bookmark size={20} className="fill-amber-400" />
          </div>
          <div>
            <h2 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              सेव की गई सामग्री (बुकमार्क)
            </h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              ऑफलाइन व बाद में पढ़ने-देखने के लिए सुरक्षित
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs bg-amber-500/20 text-amber-500 border border-amber-500/30 px-2.5 py-1 rounded-full font-bold">
            कुल {totalSavedCount} सुरक्षित
          </span>

          {totalSavedCount > 0 && (
            <button
              onClick={handleClearAllSaved}
              aria-label="सभी सहेजी गई सामग्री हटाएं"
              className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-400 font-bold px-2.5 py-1 rounded-lg border border-rose-500/30 hover:bg-rose-500/10 transition active:scale-95 cursor-pointer"
              title="सभी सेव्ड आइटम्स हटाएं"
            >
              <Trash2 size={13} />
              <span>सभी हटाएं</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Filter Pills (All, Articles, Reels) */}
      {totalSavedCount > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
          <button
            onClick={() => setSavedTabFilter('all')}
            className={`px-3.5 py-1.5 rounded-full font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              savedTabFilter === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : isDark
                ? 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
            }`}
          >
            <span>सभी</span>
            <span className="text-[10px] bg-black/20 px-1.5 py-0.2 rounded-full font-mono">
              {totalSavedCount}
            </span>
          </button>

          <button
            onClick={() => setSavedTabFilter('articles')}
            className={`px-3.5 py-1.5 rounded-full font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              savedTabFilter === 'articles'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : isDark
                ? 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
            }`}
          >
            <span>📰 खबरें</span>
            <span className="text-[10px] bg-black/20 px-1.5 py-0.2 rounded-full font-mono">
              {savedArticles.length}
            </span>
          </button>

          <button
            onClick={() => setSavedTabFilter('reels')}
            className={`px-3.5 py-1.5 rounded-full font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              savedTabFilter === 'reels'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : isDark
                ? 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
            }`}
          >
            <span>🎬 रील्स व शॉर्ट्स</span>
            <span className="text-[10px] bg-black/20 px-1.5 py-0.2 rounded-full font-mono">
              {savedReelsList.length}
            </span>
          </button>
        </div>
      )}

      {/* EMPTY STATE */}
      {totalSavedCount === 0 ? (
        <div className={`p-8 sm:p-12 text-center rounded-3xl border border-dashed flex flex-col items-center justify-center space-y-3.5 ${
          isDark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-300 bg-slate-50'
        }`}>
          <div className="w-16 h-16 rounded-3xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-inner">
            <Bookmark size={32} className="stroke-[1.7]" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              आपने अभी तक कोई खबर या रील सेव नहीं की है
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} leading-relaxed`}>
              होमपेज पर खबर पढ़ते समय या रील देखते समय <strong>बुकमार्क (🔖)</strong> आइकन दबाकर उसे यहाँ सहेजें।
            </p>
          </div>
          <button
            onClick={() => setActiveTab('home')}
            className="mt-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-red-600/30 transition active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <span>🏠 ताज़ा खबरें पढ़ें</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. SAVED ARTICLES SECTION */}
          {(savedTabFilter === 'all' || savedTabFilter === 'articles') && savedArticles.length > 0 && (
            <div className="space-y-3">
              {savedTabFilter === 'all' && (
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-bold flex items-center gap-1.5 ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    <span>📰 सेव की गई खबरें</span>
                    <span className="text-xs text-amber-500 font-normal font-mono">({savedArticles.length})</span>
                  </h3>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {savedArticles.map((art) => {
                  const cover = getSmartCoverImage(art.coverImage, art.category, art.title, art.district);
                  return (
                    <div 
                      key={art._id}
                      onClick={() => openArticleModal(art)}
                      className={`p-3 sm:p-3.5 rounded-2xl border flex gap-3 cursor-pointer group transition-transform duration-200 hover:-translate-y-0.5 will-change-transform ${
                        isDark 
                          ? 'bg-slate-900 border-slate-800 hover:border-amber-500/50' 
                          : 'bg-white border-slate-200 shadow-sm hover:border-amber-500/60 hover:shadow-md'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="relative w-24 sm:w-28 h-22 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-slate-950">
                        <img 
                          src={cover} 
                          alt={art.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/logo-96.webp';
                          }}
                        />
                        <span className="absolute bottom-1 left-1 bg-black/75 backdrop-blur-xs text-[9px] font-bold text-amber-400 px-1 py-0.2 rounded">
                          {art.district || 'कवर्धा'}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-bold text-red-500 mb-1">
                            <span className="truncate">{art.category}</span>
                            <span className="text-slate-400 font-normal shrink-0 flex items-center gap-0.5">
                              <Clock size={10} />
                              {formatRelativeHindiTime(art.publishedAt)}
                            </span>
                          </div>
                          <h4 className={`text-xs sm:text-sm font-bold line-clamp-2 leading-snug group-hover:text-amber-400 transition-colors ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}>
                            {art.title}
                          </h4>
                        </div>

                        <div className={`mt-2 pt-1.5 border-t flex items-center justify-between text-[11px] ${
                          isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'
                        }`}>
                          <span className="text-[10px] truncate max-w-[100px]">✍️ {art.author || 'संपादक'}</span>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                shareWhatsApp(art.title, art._id);
                              }}
                              aria-label="सहेजी गई खबर व्हाट्सएप पर शेयर करें"
                              className="p-1 rounded hover:bg-emerald-500/20 text-emerald-500 transition cursor-pointer"
                              title="WhatsApp शेयर"
                            >
                              <WhatsAppIcon size={13} />
                            </button>

                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBookmark(art);
                              }}
                              aria-label="यह खबर सेव्ड सूची से हटाएं"
                              className="inline-flex items-center gap-0.5 text-rose-500 hover:text-rose-400 font-bold text-[11px] p-1 rounded hover:bg-rose-500/10 transition cursor-pointer"
                              title="सेव्ड लिस्ट से हटाएं"
                            >
                              <Trash2 size={12} />
                              <span>हटाएं</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. SAVED REELS SECTION */}
          {(savedTabFilter === 'all' || savedTabFilter === 'reels') && savedReelsList.length > 0 && (
            <div className="space-y-3 pt-2">
              {savedTabFilter === 'all' && (
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-bold flex items-center gap-1.5 ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    <span>🎬 सेव की गई रील्स व शॉर्ट्स</span>
                    <span className="text-xs text-amber-500 font-normal font-mono">({savedReelsList.length})</span>
                  </h3>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {savedReelsList.map((reel) => (
                  <div
                    key={reel.id}
                    onClick={() => openReelModal(reel.id)}
                    className="relative aspect-[9/16] rounded-2xl overflow-hidden cursor-pointer group shadow-md border border-slate-800 bg-slate-950 flex flex-col justify-between p-3"
                  >
                    {/* Background Image / Thumbnail */}
                    <img
                      src={getOptimizedImageUrl(reel.imageUrl, 'card')}
                      alt={reel.caption}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logo-96.webp';
                      }}
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60 group-hover:via-black/20 transition-colors" />

                    {/* Top Controls: District & Remove Button */}
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="text-[10px] font-bold bg-black/60 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
                        📍 {reel.district || 'कवर्धा'}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleReelBookmark(reel.id);
                        }}
                        aria-label="यह रील सेव्ड सूची से हटाएं"
                        className="p-1.5 rounded-full bg-black/70 text-slate-300 hover:text-rose-400 hover:bg-black transition active:scale-90 cursor-pointer"
                        title="रील हटाएं"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Center Play Button Overlay */}
                    <div className="relative z-10 self-center">
                      <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play size={16} className="fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* Bottom Caption & Views */}
                    <div className="relative z-10 space-y-1">
                      <p className="text-white text-xs font-bold line-clamp-2 leading-snug drop-shadow">
                        {reel.caption}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-300 font-medium">
                        <span>❤️ {reel.likes}</span>
                        <span className="text-amber-400 font-bold">चलाएं ▶</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty Sub-filter Notice */}
          {savedTabFilter === 'articles' && savedArticles.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              कोई सेव की गई खबर नहीं है।
            </div>
          )}
          {savedTabFilter === 'reels' && savedReelsList.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              कोई सेव की गई रील नहीं है।
            </div>
          )}
        </div>
      )}
    </div>
  );
};
