import React from 'react';
import { ShieldCheck, Plus, Send, Trash2, Search, Mic, RefreshCw, RotateCcw, Check, Edit3, MessageCircle, ImageIcon } from 'lucide-react';
import { PaginationBar } from '../../common/PaginationBar';
import type { Article, DistrictItem } from '../../../types';

export interface ArticlesManagementDeskProps {
  isDark: boolean;
  articles: Article[];
  trashArticles: Article[];
  isLoadingTrash: boolean;
  articleStatusFilter: 'all' | 'PUBLISHED' | 'REVIEW' | 'TRASH';
  setArticleStatusFilter: (filter: 'all' | 'PUBLISHED' | 'REVIEW' | 'TRASH') => void;
  articleSearchQuery: string;
  setArticleSearchQuery: (val: string) => void;
  isVoiceSupported: boolean;
  toggleVoiceArticleSearch: () => void;
  isListeningArticleSearch: boolean;
  articleDistrictFilter: string;
  setArticleDistrictFilter: (val: string) => void;
  districts: DistrictItem[];
  adminArticlePage: number;
  setAdminArticlePage: (page: number) => void;
  setActiveTab: (tab: any) => void;
  handleRestoreTrashArticle: (id: string) => void;
  onUpdateArticle?: (id: string, updates: any) => void;
  handleStartEdit: (art: Article) => void;
  setWhatsAppArticle: (art: Article) => void;
  setCardArticle: (art: Article) => void;
  handleDeleteArticleConfirmed: (id: string, title: string) => void;
}

export const ArticlesManagementDesk: React.FC<ArticlesManagementDeskProps> = ({
  isDark,
  articles,
  trashArticles,
  isLoadingTrash,
  articleStatusFilter,
  setArticleStatusFilter,
  articleSearchQuery,
  setArticleSearchQuery,
  isVoiceSupported,
  toggleVoiceArticleSearch,
  isListeningArticleSearch,
  articleDistrictFilter,
  setArticleDistrictFilter,
  districts,
  adminArticlePage,
  setAdminArticlePage,
  setActiveTab,
  handleRestoreTrashArticle,
  onUpdateArticle,
  handleStartEdit,
  setWhatsAppArticle,
  setCardArticle,
  handleDeleteArticleConfirmed
}) => {
  const sourceArticles = articleStatusFilter === 'TRASH' ? trashArticles : articles;
  const pendingScoops = articles.filter(art => art.status === 'REVIEW');
  const publishedCount = articles.filter(art => art.status !== 'REVIEW').length;

  const filteredManagedArticles = sourceArticles.filter(art => {
    const matchesSearch = !articleSearchQuery.trim() || 
      art.title?.toLowerCase().includes(articleSearchQuery.toLowerCase()) || 
      art.author?.toLowerCase().includes(articleSearchQuery.toLowerCase());
    const matchesDistrict = articleDistrictFilter === 'सभी' || (art.district && art.district.includes(articleDistrictFilter));
    const matchesStatus = articleStatusFilter === 'TRASH'
      ? true
      : articleStatusFilter === 'all'
      ? true
      : articleStatusFilter === 'REVIEW'
        ? art.status === 'REVIEW'
        : art.status !== 'REVIEW';
    return matchesSearch && matchesDistrict && matchesStatus;
  });

  const adminPageSize = 10;
  const totalAdminPages = Math.max(1, Math.ceil(filteredManagedArticles.length / adminPageSize));
  const currentAdminPage = Math.min(adminArticlePage, totalAdminPages);
  const paginatedArticles = filteredManagedArticles.slice(
    (currentAdminPage - 1) * adminPageSize,
    currentAdminPage * adminPageSize
  );

  return (
    <div className={`p-5 rounded-3xl border ${
      isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
    }`}>
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div>
          <h2 className={`text-base font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <ShieldCheck size={18} className="text-emerald-500" />
            <span>पोर्टल पर प्रकाशित कुल खबरें ({articles.length})</span>
          </h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>सभी 88 जिलों की प्रकाशित खबरों की खोज, समीक्षा व नियंत्रण</p>
        </div>
        <button
          onClick={() => setActiveTab('create')}
          className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 w-fit shadow cursor-pointer"
        >
          <Plus size={14} />
          <span>+ नई खबर जोड़ें</span>
        </button>
      </div>

      {/* Citizen Scoop Review Alert Banner */}
      {pendingScoops.length > 0 && (
        <div 
          onClick={() => setArticleStatusFilter('REVIEW')}
          className={`mb-4 p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition group shadow-md ${
            isDark 
              ? 'bg-amber-950/40 border-amber-500/40 hover:bg-amber-950/60' 
              : 'bg-amber-50 border-amber-300 hover:bg-amber-100/80'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Send size={15} />
            </div>
            <div>
              <div className={`text-xs font-bold flex items-center gap-2 ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                <span>नागरिक पत्रकारिता डेस्क: {pendingScoops.length} नए स्कूप समीक्षा के लिए लंबित हैं</span>
                <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full">ACTION REQUIRED</span>
              </div>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                क्षेत्रीय नागरिकों व फ़ील्ड रिपोर्टर्स द्वारा भेजी गई खबरों को जांचकर तुरंत लाइव प्रकाशित करें।
              </p>
            </div>
          </div>
          <span className={`text-xs font-bold group-hover:underline whitespace-nowrap shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
            समीक्षा करें →
          </span>
        </div>
      )}

      {/* Status Filter Pills */}
      <div className="flex items-center gap-2 mb-3 overflow-x-auto no-scrollbar text-xs">
        <button
          type="button"
          onClick={() => setArticleStatusFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border cursor-pointer ${
            articleStatusFilter === 'all'
              ? 'bg-slate-700 text-white border-transparent shadow'
              : isDark ? 'bg-slate-950/60 text-slate-400 hover:text-white border-slate-800' : 'bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-300'
          }`}
        >
          <span>सभी खबरें</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>{articles.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setArticleStatusFilter('PUBLISHED')}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border cursor-pointer ${
            articleStatusFilter === 'PUBLISHED'
              ? 'bg-emerald-600 text-white border-transparent shadow'
              : isDark ? 'bg-slate-950/60 text-slate-400 hover:text-white border-slate-800' : 'bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-300'
          }`}
        >
          <ShieldCheck size={12} />
          <span>प्रकाशित (Live)</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>{publishedCount}</span>
        </button>

        <button
          type="button"
          onClick={() => setArticleStatusFilter('REVIEW')}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border cursor-pointer ${
            articleStatusFilter === 'REVIEW'
              ? 'bg-amber-600 text-white border-transparent shadow'
              : pendingScoops.length > 0
                ? isDark ? 'bg-amber-950/50 text-amber-400 border-amber-600/40 hover:bg-amber-900/60 animate-pulse' : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 animate-pulse'
                : isDark ? 'bg-slate-950/60 text-slate-400 hover:text-white border-slate-800' : 'bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-300'
          }`}
        >
          <Send size={12} />
          <span>समीक्षा लंबित (Scoops)</span>
          <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-md font-mono">
            {pendingScoops.length}
          </span>
        </button>

        {/* Edge Case: Trash & Soft-Delete Recovery Desk Pill */}
        <button
          type="button"
          onClick={() => setArticleStatusFilter('TRASH')}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border cursor-pointer ${
            articleStatusFilter === 'TRASH'
              ? 'bg-rose-600 text-white border-transparent shadow'
              : isDark ? 'bg-slate-950/60 text-slate-400 hover:text-white border-slate-800' : 'bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-300'
          }`}
        >
          <Trash2 size={12} />
          <span>🗑️ ट्रैश (Deleted)</span>
          {trashArticles.length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
              {trashArticles.length}
            </span>
          )}
        </button>
      </div>

      {/* Real-time Search and Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="sm:col-span-2 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            value={articleSearchQuery}
            onChange={(e) => setArticleSearchQuery(e.target.value)}
            placeholder="खबर के शीर्षक या रिपोर्टर के नाम से खोजें..."
            className={`w-full rounded-xl pl-9 pr-9 py-2 text-xs outline-none transition ${
              isDark ? 'bg-[#05070e] border border-white/15 text-white focus:border-red-500 placeholder:text-slate-500' : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-red-600 focus:bg-white placeholder:text-slate-400'
            }`}
          />
          {isVoiceSupported && (
            <button
              type="button"
              onClick={toggleVoiceArticleSearch}
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded flex items-center justify-center transition cursor-pointer ${
                isListeningArticleSearch ? 'text-red-500 animate-pulse' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="बोलकर खबर खोजें"
            >
              <Mic size={13} className={isListeningArticleSearch ? 'animate-bounce text-red-500' : ''} />
            </button>
          )}
        </div>

        <div>
          <select
            value={articleDistrictFilter}
            onChange={(e) => setArticleDistrictFilter(e.target.value)}
            className={`w-full rounded-xl px-3 py-2 text-xs outline-none transition ${
              isDark ? 'bg-[#05070e] border border-white/15 text-white focus:border-red-500' : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-red-600 focus:bg-white'
            }`}
          >
            <option value="सभी">सभी जिले ({articles.length})</option>
            <option value="कवर्धा">कवर्धा (कबीरधाम)</option>
            <option value="रायपुर">रायपुर</option>
            <option value="बिलासपुर">बिलासपुर</option>
            <option value="भोपाल">भोपाल</option>
            <option value="इंदौर">इंदौर</option>
            {districts
              .filter(d => !['कबीरधाम (कवर्धा)', 'कवर्धा', 'रायपुर', 'बिलासपुर', 'भोपाल', 'इंदौर'].includes(d.nameHindi || d.name))
              .map(d => (
                <option key={d._id} value={d.nameHindi || d.name}>
                  {d.nameHindi || d.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {isLoadingTrash && articleStatusFilter === 'TRASH' ? (
          <div className={`p-8 text-center text-xs border rounded-2xl flex items-center justify-center gap-2 ${
            isDark ? 'text-slate-400 border-dashed border-white/10' : 'text-slate-600 border-dashed border-slate-300'
          }`}>
            <RefreshCw size={14} className="animate-spin text-red-500" />
            <span>ट्रैश से हटाए गए समाचार लोड हो रहे हैं...</span>
          </div>
        ) : filteredManagedArticles.length === 0 ? (
          <div className={`p-8 text-center text-xs border rounded-2xl ${
            isDark ? 'text-slate-400 border-dashed border-white/10' : 'text-slate-600 border-dashed border-slate-300'
          }`}>
            {articleStatusFilter === 'TRASH' 
              ? '🎉 ट्रैश बिल्कुल खाली है! कोई भी हटाई गई खबर मौजूद नहीं है।' 
              : 'कोई खबर नहीं मिली। कृपया अलग कीवर्ड या जिला चुनें।'}
          </div>
        ) : paginatedArticles.map((art) => (
          <div
            key={art._id}
            className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition ${
              isDark ? 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700' : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 shadow-sm'
            }`}
          >
            <div className="flex items-start gap-3">
              {art.coverImage && (
                <img
                  src={art.coverImage}
                  alt=""
                  className="w-16 h-12 object-cover rounded-xl bg-slate-900 shrink-0"
                />
              )}
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold mb-0.5">
                  <span className="text-red-500">{art.category}</span>
                  <span className="text-slate-500">•</span>
                  <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>📍 {art.district}</span>
                  {articleStatusFilter === 'TRASH' ? (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold border bg-rose-950/80 text-rose-300 border-rose-800">
                      🗑️ हटाया गया (In Trash)
                    </span>
                  ) : art.status === 'REVIEW' ? (
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                      isDark ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      ⏳ नागरिक स्कूप (समीक्षा लंबित)
                    </span>
                  ) : (
                    art.isBreaking && (
                      <span className="bg-red-600 text-white px-1 rounded text-[9px]">ब्रेकिंग</span>
                    )
                  )}
                </div>
                <h3 className={`text-xs sm:text-sm font-bold line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {art.title}
                </h3>
                <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  ✍️ {art.author} • {art.views || 100} व्यूज
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-center">
              {articleStatusFilter === 'TRASH' ? (
                <button
                  onClick={() => handleRestoreTrashArticle(art._id)}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition active:scale-95 shrink-0 cursor-pointer"
                  title="खबर को ट्रैश से पुनः पोर्टल पर लाइव प्रकाशित करें"
                >
                  <RotateCcw size={13} />
                  <span>पुनर्स्थापित करें (Restore)</span>
                </button>
              ) : (
                <>
                  {art.status === 'REVIEW' && (
                    <button
                      onClick={() => {
                        if (onUpdateArticle) {
                          onUpdateArticle(art._id, { status: 'PUBLISHED' });
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition active:scale-95 shrink-0 cursor-pointer"
                      title="तुरंत स्वीकृत कर पोर्टल पर लाइव प्रकाशित करें"
                    >
                      <Check size={13} />
                      <span>स्वीकृत करें</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleStartEdit(art)}
                    className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 text-xs font-bold cursor-pointer ${
                      isDark 
                        ? 'bg-blue-950/50 hover:bg-blue-900 text-blue-300 border border-blue-800/60' 
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 shadow-sm'
                    }`}
                    title="खबर संपादित करें (Edit Article)"
                  >
                    <Edit3 size={13} />
                    <span>एडिट</span>
                  </button>

                  <button
                    onClick={() => setWhatsAppArticle(art)}
                    className={`p-1.5 rounded-xl transition border cursor-pointer ${
                      isDark ? 'text-emerald-400 hover:bg-emerald-950/60 border-emerald-800/40 hover:border-emerald-600' : 'text-emerald-700 hover:bg-emerald-50 border-emerald-300 hover:border-emerald-400'
                    }`}
                    title="1-क्लिक WhatsApp बुलेटिन"
                  >
                    <MessageCircle size={14} />
                  </button>

                  <button
                    onClick={() => setCardArticle(art)}
                    className={`p-1.5 rounded-xl transition border cursor-pointer ${
                      isDark ? 'text-rose-400 hover:bg-rose-950/60 border-rose-800/40 hover:border-rose-600' : 'text-rose-700 hover:bg-rose-50 border-rose-300 hover:border-rose-400'
                    }`}
                    title="सोशल मीडिया फोटो कार्ड बनाएं"
                  >
                    <ImageIcon size={14} />
                  </button>

                  <button
                    onClick={() => handleDeleteArticleConfirmed(art._id, art.title)}
                    className={`p-1.5 rounded-xl transition border cursor-pointer ${
                      isDark ? 'text-slate-500 hover:text-red-400 hover:bg-red-950/40 border-transparent hover:border-red-900/40' : 'text-slate-400 hover:text-red-600 hover:bg-red-50 border-transparent hover:border-red-200'
                    }`}
                    title="खबर हटाएं (Delete)"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Admin Pagination Controls */}
      <PaginationBar
        currentPage={currentAdminPage}
        totalPages={totalAdminPages}
        totalItems={filteredManagedArticles.length}
        pageSize={adminPageSize}
        onPageChange={setAdminArticlePage}
        isDark={isDark}
        itemLabel="खबरें"
        accentColor="red"
      />
    </div>
  );
};
