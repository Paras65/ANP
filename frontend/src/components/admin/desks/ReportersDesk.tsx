import React from 'react';
import { Users, Plus, CheckCircle2, FileText, MapPin, Search, Phone, Printer, Edit3, Trash2, Send, Check } from 'lucide-react';
import { PaginationBar } from '../../common/PaginationBar';
import type { Reporter, Article, DistrictItem } from '../../../types';

export interface ReportersDeskProps {
  isDark: boolean;
  reporters: Reporter[];
  articles: Article[];
  districts: DistrictItem[];
  reporterSearch: string;
  setReporterSearch: (val: string) => void;
  reporterDistrictFilter: string;
  setReporterDistrictFilter: (val: string) => void;
  adminReporterPage: number;
  setAdminReporterPage: (page: number) => void;
  REPORTERS_PER_PAGE: number;
  handleOpenAddReporter: () => void;
  handleOpenEditReporter: (rep: Reporter) => void;
  setIdCardReporter: (rep: Reporter) => void;
  onUpdateReporter?: (id: string, updates: Partial<Reporter>) => void;
  onDeleteReporter?: (id: string) => void;
  onUpdateArticle?: (id: string, updates: any) => void;
  handleStartEdit: (art: Article) => void;
  setActiveTab: (tab: any) => void;
  setArticleStatusFilter: (status: any) => void;
}

export const ReportersDesk: React.FC<ReportersDeskProps> = ({
  isDark,
  reporters,
  articles,
  districts,
  reporterSearch,
  setReporterSearch,
  reporterDistrictFilter,
  setReporterDistrictFilter,
  adminReporterPage,
  setAdminReporterPage,
  REPORTERS_PER_PAGE,
  handleOpenAddReporter,
  handleOpenEditReporter,
  setIdCardReporter,
  onUpdateReporter,
  onDeleteReporter,
  onUpdateArticle,
  handleStartEdit,
  setActiveTab,
  setArticleStatusFilter
}) => {
  const filteredReporters = reporters.filter(rep => {
    const matchesSearch = !reporterSearch.trim() || 
      rep.name?.toLowerCase().includes(reporterSearch.toLowerCase()) || 
      rep.nameHindi?.toLowerCase().includes(reporterSearch.toLowerCase()) || 
      rep.bureau?.toLowerCase().includes(reporterSearch.toLowerCase()) || 
      rep.phone?.includes(reporterSearch) || 
      rep.reporterIdCode?.toLowerCase().includes(reporterSearch.toLowerCase());
    const matchesDistrict = reporterDistrictFilter === 'सभी' || (rep.district && rep.district.includes(reporterDistrictFilter));
    return matchesSearch && matchesDistrict;
  });

  const totalReporterPages = Math.ceil(filteredReporters.length / REPORTERS_PER_PAGE) || 1;
  const currentRepPage = Math.min(adminReporterPage, totalReporterPages);
  const paginatedReporters = filteredReporters.slice(
    (currentRepPage - 1) * REPORTERS_PER_PAGE,
    currentRepPage * REPORTERS_PER_PAGE
  );

  const activeCount = reporters.filter(r => r.isActive).length;
  const totalPublishedNews = reporters.reduce((sum, r) => sum + (r.articlesCount || 0), 0);
  const distinctDistricts = new Set(reporters.map(r => r.district).filter(Boolean)).size;

  return (
    <div className={`p-5 rounded-3xl border ${
      isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
    }`}>
      {/* Header & Add Reporter Action */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <Users size={20} className="text-blue-500" />
            <h2 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              क्षेत्रीय ब्यूरो व संवाददाता नेटवर्क (CG & MP)
            </h2>
          </div>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            सभी 88 जिलों के ब्यूरो प्रमुखों, फील्ड रिपोर्टर्स, लाइव खबरों व डिजिटल प्रेस कार्ड का नियंत्रण
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddReporter}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition active:scale-95 shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Plus size={14} />
          <span>+ नया संवाददाता जोड़ें</span>
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        <div className={`p-3 rounded-2xl flex items-center gap-3 border ${
          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'
        }`}>
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
          <div>
            <span className={`text-[10px] block font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>कुल संवाददाता</span>
            <span className={`text-sm font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{reporters.length}</span>
          </div>
        </div>

        <div className={`p-3 rounded-2xl flex items-center gap-3 border ${
          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'
        }`}>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span className={`text-[10px] block font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>सक्रिय ब्यूरो</span>
            <span className="text-sm font-black text-emerald-500 font-mono">{activeCount}</span>
          </div>
        </div>

        <div className={`p-3 rounded-2xl flex items-center gap-3 border ${
          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'
        }`}>
          <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center shrink-0">
            <FileText size={18} />
          </div>
          <div>
            <span className={`text-[10px] block font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>कवर की गई खबरें</span>
            <span className="text-sm font-black text-red-500 font-mono">{totalPublishedNews}</span>
          </div>
        </div>

        <div className={`p-3 rounded-2xl flex items-center gap-3 border ${
          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'
        }`}>
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
            <MapPin size={18} />
          </div>
          <div>
            <span className={`text-[10px] block font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>जिले कवर</span>
            <span className="text-sm font-black text-amber-500 font-mono">{distinctDistricts}</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="sm:col-span-2 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            value={reporterSearch}
            onChange={(e) => setReporterSearch(e.target.value)}
            placeholder="संवाददाता का नाम, फोन, प्रेस कोड या ब्यूरो से खोजें..."
            className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs outline-none transition ${
              isDark ? 'bg-[#05070e] border border-white/15 text-white focus:border-blue-500 placeholder:text-slate-500' : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-blue-600 focus:bg-white placeholder:text-slate-400'
            }`}
          />
        </div>

        <div>
          <select
            value={reporterDistrictFilter}
            onChange={(e) => setReporterDistrictFilter(e.target.value)}
            className={`w-full rounded-xl px-3 py-2 text-xs outline-none transition ${
              isDark ? 'bg-[#05070e] border border-white/15 text-white focus:border-blue-500' : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-blue-600 focus:bg-white'
            }`}
          >
            <option value="सभी">सभी जिले ({reporters.length})</option>
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

      {/* Grid of Reporters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredReporters.length === 0 ? (
          <div className={`col-span-full p-8 text-center text-xs border rounded-2xl ${
            isDark ? 'text-slate-400 border-dashed border-white/10' : 'text-slate-600 border-dashed border-slate-300'
          }`}>
            कोई संवाददाता नहीं मिला। कृपया अलग खोज शब्द दर्ज करें या नया जोड़ें।
          </div>
        ) : (
          paginatedReporters.map((rep) => (
            <div 
              key={rep._id} 
              className={`p-4 rounded-2xl border transition-colors flex flex-col justify-between space-y-3 ${
                isDark 
                  ? 'bg-slate-950 border-slate-800/80 hover:border-blue-500/40 shadow-md' 
                  : 'bg-slate-50 border-slate-200 hover:border-blue-400 shadow-sm'
              }`}
            >
              <div>
                {/* Top: Avatar, Name, Status Badge */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      <img 
                        src={rep.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'} 
                        alt={rep.name}
                        className={`w-11 h-11 rounded-xl object-cover border ${
                          isDark ? 'bg-slate-900 border-white/10' : 'bg-slate-200 border-slate-300'
                        }`}
                      />
                      <span 
                        className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 ${
                          isDark ? 'border-slate-950' : 'border-white'
                        } ${rep.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} 
                        title={rep.isActive ? 'सक्रिय' : 'निष्क्रिय'}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className={`font-bold text-xs truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {rep.nameHindi || rep.name}
                      </div>
                      <div className="text-[11px] text-red-500 font-semibold truncate mt-0.5">
                        {rep.bureau}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 border ${
                    rep.isActive 
                      ? isDark ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-200 text-slate-600 border-slate-300'
                  }`}>
                    {rep.isActive ? 'सक्रिय' : 'बंद'}
                  </span>
                </div>

                {/* Mid Meta: District & Press Code */}
                <div className={`flex items-center justify-between gap-1 mt-3 pt-2.5 border-t text-[10px] ${
                  isDark ? 'border-slate-800/80' : 'border-slate-200'
                }`}>
                  <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>📍 {rep.district}</span>
                  <span className={`font-mono border px-1.5 py-0.5 rounded font-bold ${
                    isDark ? 'bg-amber-950/60 text-amber-300 border-amber-800/50' : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    🪪 {rep.reporterIdCode}
                  </span>
                </div>

                {/* Live Article Count & Contact */}
                <div className="flex items-center justify-between gap-1 mt-2 text-[10px]">
                  <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    📰 {rep.articlesCount || 0} खबरें
                  </span>
                  <a 
                    href={`https://wa.me/91${rep.phone}?text=नमस्ते ${encodeURIComponent(rep.nameHindi || rep.name)} जी, एम्बिशन न्यूज़ डेस्क से...`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-500 hover:underline font-mono font-medium flex items-center gap-1"
                    title="सीधे WhatsApp करें"
                  >
                    <Phone size={10} />
                    <span>+91 {rep.phone}</span>
                  </a>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className={`pt-2.5 border-t flex items-center justify-between gap-1.5 text-xs ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setIdCardReporter(rep)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer ${
                    isDark 
                      ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30' 
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                  title="डिजिटल प्रेस कार्ड देखें व प्रिंट करें"
                >
                  <Printer size={12} />
                  <span>प्रेस कार्ड</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditReporter(rep)}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                    title="संपादित करें"
                  >
                    <Edit3 size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdateReporter) {
                        onUpdateReporter(rep._id, { isActive: !rep.isActive });
                      }
                    }}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      rep.isActive 
                        ? 'text-emerald-500 hover:text-emerald-400' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title={rep.isActive ? 'डिएक्टिवेट करें' : 'एक्टिवेट करें'}
                  >
                    <CheckCircle2 size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`क्या आप सच में संवाददाता "${rep.nameHindi || rep.name}" को हटाना चाहते हैं?`)) {
                        if (onDeleteReporter) onDeleteReporter(rep._id);
                      }
                    }}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      isDark ? 'text-slate-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
                    }`}
                    title="हटाएं"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* REPORTER PAGINATION TOOLBAR */}
      <PaginationBar
        currentPage={currentRepPage}
        totalPages={totalReporterPages}
        totalItems={filteredReporters.length}
        pageSize={REPORTERS_PER_PAGE}
        onPageChange={setAdminReporterPage}
        isDark={isDark}
        itemLabel="संवाददाता"
        accentColor="blue"
      />

      {/* Citizen Journalism / Scoop Inbox */}
      <div className={`mt-6 pt-5 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/30">
              <Send size={14} />
            </div>
            <div>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <span>नागरिक पत्रकारिता व फ़ील्ड स्कूप डेस्क</span>
                {articles.filter(a => a.status === 'REVIEW').length > 0 && (
                  <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full">
                    {articles.filter(a => a.status === 'REVIEW').length} नई समीक्षाएं
                  </span>
                )}
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>पोर्टल के "📢 खबर भेजें" डेस्क से नागरिकों एवं संवाददाताओं द्वारा भेजी गई खबरें</p>
            </div>
          </div>
          {articles.filter(a => a.status === 'REVIEW').length > 0 && (
            <button
              onClick={() => {
                setActiveTab('articles');
                setArticleStatusFilter('REVIEW');
              }}
              className="text-xs text-amber-500 hover:text-amber-600 font-bold underline self-start sm:self-auto cursor-pointer"
            >
              सभी समीक्षा करें →
            </button>
          )}
        </div>

        {articles.filter(a => a.status === 'REVIEW').length === 0 ? (
          <div className={`p-4 rounded-2xl border border-dashed text-center text-xs ${
            isDark ? 'bg-slate-950/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-300 text-slate-600'
          }`}>
            फिलहाल कोई लंबित नागरिक स्कूप नहीं है। सभी खबरें स्वीकृत व प्रकाशित हैं।
          </div>
        ) : (
          <div className="space-y-2.5">
            {articles.filter(a => a.status === 'REVIEW').slice(0, 5).map(art => (
              <div key={art._id} className={`p-3 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                isDark ? 'bg-slate-950 border-amber-900/40' : 'bg-slate-50 border-amber-200'
              }`}>
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-bold mb-0.5">
                    <span className={isDark ? 'text-amber-400' : 'text-amber-700'}>📍 {art.district}</span>
                    <span className="text-slate-500">•</span>
                    <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>✍️ {art.author}</span>
                    <span className={`px-1.5 rounded border ${
                      isDark ? 'bg-amber-950 text-amber-300 border-amber-800/60' : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>समीक्षा लंबित</span>
                  </div>
                  <h4 className={`text-xs font-bold line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{art.title}</h4>
                </div>
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => {
                      if (onUpdateArticle) {
                        onUpdateArticle(art._id, { status: 'PUBLISHED' });
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow transition active:scale-95 cursor-pointer"
                    title="तुरंत स्वीकृत कर पोर्टल पर लाइव प्रकाशित करें"
                  >
                    <Check size={12} />
                    <span>स्वीकृत करें</span>
                  </button>
                  <button
                    onClick={() => handleStartEdit(art)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition active:scale-95 border cursor-pointer ${
                      isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    }`}
                  >
                    <Edit3 size={12} />
                    <span>संपादित करें</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
