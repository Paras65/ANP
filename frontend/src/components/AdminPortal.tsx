import React, { useState } from 'react';
import { 
  Send, 
  ArrowLeft, 
  FileText, 
  Radio, 
  Users, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  Flame, 
  MapPin, 
  Tag, 
  User, 
  Camera, 
  Plus,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import type { Article, DistrictItem } from '../types';

interface AdminPortalProps {
  articles: Article[];
  districts: DistrictItem[];
  selectedState: 'chhattisgarh' | 'madhya-pradesh';
  onPublishArticle: (article: Partial<Article>) => void;
  onDeleteArticle: (id: string) => void;
  onBackToPublic: () => void;
  isDark: boolean;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  articles,
  districts,
  selectedState,
  onPublishArticle,
  onDeleteArticle,
  onBackToPublic,
  isDark
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'articles' | 'breaking' | 'reporters'>('create');
  
  // Form states for creating news
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [district, setDistrict] = useState('कबीरधाम (कवर्धा)');
  const [category, setCategory] = useState('🔴 कवर्धा स्पेशल');
  const [author, setAuthor] = useState('कवर्धा डेस्क प्रभारी (मुख्य संपादक)');
  const [coverImage, setCoverImage] = useState(
    'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1000&auto=format&fit=crop&q=80'
  );
  const [isBreaking, setIsBreaking] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);

  // Breaking flash quick input
  const [breakingHeadline, setBreakingHeadline] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !excerpt.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onPublishArticle({
        title,
        excerpt,
        content: content.trim() ? content : `${excerpt}\n\n[ग्राउंड रिपोर्ट: ${district} से विशेष संवाददाता द्वारा प्रेषित]\nस्थानीय नागरिकों एवं प्रशासन के अनुसार स्थिति पर लगातार नजर रखी जा रही है। अधिक जानकारी की प्रतीक्षा है।`,
        district,
        state: selectedState,
        category,
        author,
        coverImage,
        isBreaking,
        isFeatured,
        views: 1,
        publishedAt: new Date().toISOString()
      });

      setIsSubmitting(false);
      setPublishedSuccess(true);
      // Reset form
      setTitle('');
      setExcerpt('');
      setContent('');
      setTimeout(() => setPublishedSuccess(false), 4000);
    }, 400);
  };

  const handleAddQuickBreaking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!breakingHeadline.trim()) return;

    onPublishArticle({
      title: breakingHeadline,
      excerpt: breakingHeadline,
      district: 'कबीरधाम (कवर्धा)',
      state: selectedState,
      category: '⚡ ब्रेकिंग न्यूज़',
      author: 'न्यूज़ डेस्क (लाइव फ्लैश)',
      isBreaking: true,
      publishedAt: new Date().toISOString()
    });

    setBreakingHeadline('');
  };

  const totalViews = articles.reduce((acc, a) => acc + (a.views || 0), 0);
  const breakingCount = articles.filter(a => a.isBreaking).length;

  return (
    <div className={`min-h-screen font-devanagari flex flex-col transition-colors ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* 1. ADMIN DESK TOP BAR */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-xl ${
        isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="bg-red-600 text-white font-black text-xl px-2.5 py-0.5 rounded-lg shadow">
                AMBITION
              </span>
              <span className="text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded">
                एडमिन व रिपोर्टर डेस्क
              </span>
            </div>
            <span className="hidden sm:inline text-slate-500">|</span>
            <span className="hidden sm:inline text-xs text-slate-400">
              कवर्धा (कबीरधाम) मुख्य डेस्क
            </span>
          </div>

          {/* Action: Switch Back to Public Reader Portal */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToPublic}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 transition active:scale-95 shadow"
            >
              <ArrowLeft size={14} />
              <span>पाठक पोर्टल देखें (Live Site)</span>
              <ExternalLink size={12} className="text-slate-400" />
            </button>
          </div>

        </div>
      </header>

      {/* 2. ADMIN DASHBOARD STATS */}
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-2 w-full">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          <div className={`p-3.5 rounded-2xl border ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>कुल प्रकाशित खबरें</span>
              <FileText size={16} className="text-red-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">
              {articles.length}
            </div>
          </div>

          <div className={`p-3.5 rounded-2xl border ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>सक्रिय ब्रेकिंग न्यूज़</span>
              <Radio size={16} className="text-amber-500 animate-pulse" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1">
              {breakingCount}
            </div>
          </div>

          <div className={`p-3.5 rounded-2xl border ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>कुल पाठक व्यूज</span>
              <Eye size={16} className="text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
              {totalViews.toLocaleString('en-IN')}
            </div>
          </div>

          <div className={`p-3.5 rounded-2xl border ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>सक्रिय रिपोर्टर नेटवर्क</span>
              <Users size={16} className="text-blue-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-blue-400 mt-1">
              88 जिले (CG-MP)
            </div>
          </div>

        </div>
      </div>

      {/* 3. ADMIN TABS NAVIGATION */}
      <div className="max-w-7xl mx-auto px-4 pt-4 w-full">
        <div className={`flex border-b text-xs font-bold overflow-x-auto no-scrollbar gap-2 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'create'
                ? 'border-red-600 text-red-500'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Send size={14} />
            <span>✍️ नई खबर प्रकाशित करें ("खबर भेजें")</span>
          </button>

          <button
            onClick={() => setActiveTab('articles')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'articles'
                ? 'border-red-600 text-red-500'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText size={14} />
            <span>📰 सभी प्रकाशित खबरें ({articles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('breaking')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'breaking'
                ? 'border-red-600 text-red-500'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Radio size={14} />
            <span>⚡ ब्रेकिंग न्यूज़ टिकर मैनेजर</span>
          </button>

          <button
            onClick={() => setActiveTab('reporters')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'reporters'
                ? 'border-red-600 text-red-500'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users size={14} />
            <span>👥 क्षेत्रीय ब्यूरो नेटवर्क</span>
          </button>
        </div>
      </div>

      {/* 4. TAB CONTENTS */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        
        {/* SUCCESS NOTIFICATION */}
        {publishedSuccess && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-xs flex items-center justify-between shadow-xl animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span>सफलता! खबर सफलतापूर्वक प्रकाशित होकर लाइव पोर्टल पर जुड़ गई!</span>
            </div>
            <button
              onClick={onBackToPublic}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg transition"
            >
              लाइव देखें
            </button>
          </div>
        )}

        {/* TAB 1: CREATE / PUBLISH ARTICLE ("खबर भेजें" PORTAL) */}
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form Column (2 Cols) */}
            <div className={`lg:col-span-2 p-5 sm:p-6 rounded-3xl border shadow-xl ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="mb-4 pb-3 border-b border-slate-800">
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Send size={16} className="text-red-500" />
                  <span>संपादकीय समाचार प्रकाशन फॉर्म</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  यह फॉर्म केवल अधिकृत रिपोर्टर्स और संपादकों के लिए है। सबमिट करते ही खबर लाइव हो जाएगी।
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                
                {/* District & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
                      <MapPin size={13} className="text-red-500" /> जिला चुनें *
                    </label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-red-500 font-medium"
                    >
                      <option value="कबीरधाम (कवर्धा)">कबीरधाम (कवर्धा) 👑 (मुख्यालय)</option>
                      {districts
                        .filter(d => d.nameHindi !== 'कबीरधाम (कवर्धा)')
                        .map(d => (
                          <option key={d._id} value={d.nameHindi || d.name}>
                            {d.nameHindi || d.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
                      <Tag size={13} className="text-orange-500" /> श्रेणी (Category) *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-red-500 font-medium"
                    >
                      <option value="🔴 कवर्धा स्पेशल">🔴 कवर्धा स्पेशल</option>
                      <option value="🏛️ राजनीति व किसान">🏛️ राजनीति व किसान</option>
                      <option value="🚔 अपराध व कानून">🚔 अपराध व कानून</option>
                      <option value="🌾 कृषि व मंडी भाव">🌾 कृषि व मंडी भाव</option>
                      <option value="🏗️ विकास कार्य">🏗️ विकास कार्य</option>
                      <option value="📚 शिक्षा व रोजगार">📚 शिक्षा व रोजगार</option>
                      <option value="⚖️ हाई कोर्ट व कानून">⚖️ हाई कोर्ट व कानून</option>
                      <option value="🌦️ मौसम व पर्यटन">🌦️ मौसम व पर्यटन</option>
                    </select>
                  </div>
                </div>

                {/* Headline */}
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    समाचार शीर्षक (Headline) *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="मुख्य शीर्षक हिंदी में लिखें (जैसे: कवर्धा में नए रिंग रोड परियोजना को मंजूरी...)"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-red-500 text-xs font-semibold placeholder:text-slate-500"
                  />
                </div>

                {/* Author Byline */}
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
                    <User size={13} className="text-blue-500" /> रिपोर्टर / संवाददाता का नाम *
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="जैसे: अमित चंद्रवंशी (कवर्धा ब्यूरो चीफ)"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-red-500 text-xs font-medium"
                  />
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    संक्षिप्त सारांश (Excerpt) *
                  </label>
                  <textarea
                    rows={2}
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="2-3 पंक्तियों में खबर का मुख्य बिंदु..."
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-red-500 text-xs placeholder:text-slate-500 leading-relaxed"
                  ></textarea>
                </div>

                {/* Full Article Content */}
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    विस्तृत समाचार सामग्री (Full Article Text)
                  </label>
                  <textarea
                    rows={5}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="पूरी घटना, गवाहों के बयान, सरकारी आदेश, पृष्ठभूमि और तथ्य विस्तार से लिखें..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-red-500 text-xs placeholder:text-slate-500 leading-relaxed"
                  ></textarea>
                </div>

                {/* Photo Presets & Custom URL */}
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
                    <Camera size={13} className="text-emerald-500" /> फोटो का चयन या URL
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {[
                      { label: '🏛️ कवर्धा/भोरमदेव', url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1000&auto=format&fit=crop&q=80' },
                      { label: '🌾 कृषि/मंडी', url: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=1000&auto=format&fit=crop&q=80' },
                      { label: '🏛️ मंत्रालय/सरकार', url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1000&auto=format&fit=crop&q=80' },
                      { label: '🚔 पुलिस/कानून', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1000&auto=format&fit=crop&q=80' },
                      { label: '🌦️ चिल्फी/मौसम', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000&auto=format&fit=crop&q=80' }
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCoverImage(p.url)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium transition ${
                          coverImage === p.url
                            ? 'bg-red-600 text-white border-red-500 shadow'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="url"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none focus:border-red-500 text-xs font-mono"
                  />
                </div>

                {/* Flags: Breaking & Featured */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isBreaking}
                      onChange={(e) => setIsBreaking(e.target.checked)}
                      className="w-4 h-4 rounded text-red-600 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-white font-bold text-xs flex items-center gap-1">
                      <Radio size={13} className="text-red-500" />
                      <span>⚡ ब्रेकिंग न्यूज़ टिकर में दिखाएं</span>
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-4 h-4 rounded text-red-600 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-white font-bold text-xs flex items-center gap-1">
                      <Flame size={13} className="text-orange-500" />
                      <span>🔥 होमपेज का मुख्य समाचार (Hero) बनाएं</span>
                    </span>
                  </label>
                </div>

                {/* Submit Action */}
                <div className="pt-3 border-t border-slate-800">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition active:scale-98 disabled:opacity-50"
                  >
                    <Send size={16} />
                    <span>{isSubmitting ? 'प्रकाशित कर रहे हैं...' : 'सीधे लाइव पोर्टल पर प्रकाशित करें'}</span>
                  </button>
                </div>

              </form>
            </div>

            {/* Preview Column (1 Col) */}
            <div className="space-y-4">
              <div className={`p-4 rounded-3xl border ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-1">
                  <Eye size={13} />
                  <span>लाइव कार्ड पूर्वावलोकन (Preview)</span>
                </div>

                <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
                  <div className="relative aspect-video w-full bg-slate-900">
                    <img
                      src={coverImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 flex gap-1">
                      {isBreaking && (
                        <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded">
                          ⚡ ब्रेकिंग
                        </span>
                      )}
                      <span className="bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                        {district}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 space-y-1.5">
                    <span className="text-orange-400 text-[10px] font-black uppercase">
                      {category}
                    </span>
                    <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                      {title || 'समाचार की हेडलाइन यहां दिखेगी...'}
                    </h3>
                    <p className="text-[10px] text-slate-400 line-clamp-2">
                      {excerpt || 'समाचार का संक्षिप्त विवरण यहां दिखेगा...'}
                    </p>
                    <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
                      <span>✍️ {author}</span>
                      <span>अब प्रकाशित</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Help Callout */}
              <div className="p-4 rounded-3xl border border-blue-900/40 bg-blue-950/20 text-xs space-y-2 text-slate-300">
                <div className="font-bold text-blue-400 flex items-center gap-1.5">
                  <Sparkles size={14} />
                  <span>संपादकीय दिशानिर्देश:</span>
                </div>
                <ul className="space-y-1 text-[11px] text-slate-400">
                  <li>• कवर्धा व स्थानीय खबरों को प्राथमिकता दें।</li>
                  <li>• संवेदनशीलता व IT Rules 2021 का पालन सुनिश्चित करें।</li>
                  <li>• प्रकाशित खबर तुरंत पब्लिक साइट पर दिखाई देगी।</li>
                </ul>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: MANAGE PUBLISHED ARTICLES */}
        {activeTab === 'articles' && (
          <div className={`p-5 rounded-3xl border ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h2 className="text-base font-black text-white">
                पोर्टल पर प्रकाशित कुल खबरें ({articles.length})
              </h2>
              <button
                onClick={() => setActiveTab('create')}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1"
              >
                <Plus size={14} />
                <span>नई खबर जोड़ें</span>
              </button>
            </div>

            <div className="space-y-3">
              {articles.map((art) => (
                <div
                  key={art._id}
                  className="p-3.5 rounded-2xl border border-slate-800/80 bg-slate-950/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-700 transition"
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
                        <span className="text-red-400">{art.category}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-300">📍 {art.district}</span>
                        {art.isBreaking && (
                          <span className="bg-red-600 text-white px-1 rounded text-[9px]">ब्रेकिंग</span>
                        )}
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                        {art.title}
                      </h3>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        ✍️ {art.author} • {art.views || 100} व्यूज
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => onDeleteArticle(art._id)}
                      className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900 text-red-400 hover:text-white transition"
                      title="Delete Article"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: BREAKING NEWS MANAGER */}
        {activeTab === 'breaking' && (
          <div className="space-y-6">
            
            {/* Quick Add Breaking News Flash */}
            <div className={`p-5 rounded-3xl border ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <h2 className="text-base font-black text-white flex items-center gap-2 mb-3">
                <Radio size={16} className="text-red-500 animate-pulse" />
                <span>तुरंत ब्रेकिंग फ्लैश जोड़ें (Live Ticker)</span>
              </h2>

              <form onSubmit={handleAddQuickBreaking} className="flex gap-2 text-xs">
                <input
                  type="text"
                  value={breakingHeadline}
                  onChange={(e) => setBreakingHeadline(e.target.value)}
                  placeholder="जैसे: कवर्धा में भारी बारिश के बाद प्रशासन ने कलेक्टोरेट में कंट्रोल रूम बनाया..."
                  required
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Plus size={14} />
                  <span>टिकर में जोड़ें</span>
                </button>
              </form>
            </div>

            {/* Current Active Breaking Ticker Items */}
            <div className={`p-5 rounded-3xl border ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                वर्तमान में सक्रिय ब्रेकिंग न्यूज़ ({breakingCount})
              </h3>

              <div className="space-y-2">
                {articles.filter(a => a.isBreaking).map((b) => (
                  <div
                    key={b._id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      <span className="bg-red-950 text-red-300 font-bold px-1.5 py-0.5 rounded text-[10px]">
                        {b.district}
                      </span>
                      <span className="text-white font-medium">{b.title}</span>
                    </div>
                    <button
                      onClick={() => onDeleteArticle(b._id)}
                      className="text-red-400 hover:text-white p-1"
                      title="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: REPORTERS NETWORK */}
        {activeTab === 'reporters' && (
          <div className={`p-5 rounded-3xl border ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h2 className="text-base font-black text-white mb-4 pb-3 border-b border-slate-800">
              क्षेत्रीय ब्यूरो व संवाददाता नेटवर्क (CG & MP)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { name: 'अमित चंद्रवंशी', bureau: 'कवर्धा (कबीरधाम) ब्यूरो चीफ', role: 'HQ डेस्क प्रमुख', count: 18 },
                { name: 'संजय वर्मा', bureau: 'कवर्धा कृषि व मंडी डेस्क', role: 'मंडी संवाददाता', count: 12 },
                { name: 'मनीष यादव', bureau: 'चिल्फी घाटी / बोड़ला', role: 'वनांचल रिपोर्टर', count: 9 },
                { name: 'विशेष संवाददाता', bureau: 'रायपुर मंत्रालय डेस्क', role: 'राज्य संवाददाता', count: 15 },
                { name: 'राजेश शुक्ला', bureau: 'बिलासपुर हाईकोर्ट डेस्क', role: 'विधि संवाददाता', count: 8 },
                { name: 'नीलेश शर्मा', bureau: 'भोपाल ब्यूरो', role: 'एमपी प्रभारी', count: 11 }
              ].map((rep, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-white font-bold text-sm">{rep.name}</div>
                  <div className="text-xs text-red-400 font-medium">{rep.bureau}</div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-800">
                    <span>{rep.role}</span>
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono font-bold">
                      {rep.count} खबरें
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

    </div>
  );
};
