import React, { useState, useEffect } from 'react';
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
  ExternalLink,
  Tv,
  Film,
  RefreshCw,
  Zap,
  Check,
  HelpCircle
} from 'lucide-react';
import type { Article, DistrictItem, VideoBulletin, InstagramPost } from '../types';
import { parseYouTubeUrl, parseInstagramUrl, extractYouTubeChannelId, syncYouTubeChannelVideos } from '../utils/mediaUtils';

interface AdminPortalProps {
  articles: Article[];
  districts: DistrictItem[];
  selectedState: 'chhattisgarh' | 'madhya-pradesh';
  onPublishArticle: (article: Partial<Article>) => void;
  onDeleteArticle: (id: string) => void;
  onBackToPublic: () => void;
  isDark: boolean;
  videos?: VideoBulletin[];
  onAddVideo?: (video: VideoBulletin) => void;
  onDeleteVideo?: (id: string) => void;
  reels?: InstagramPost[];
  onAddReel?: (post: InstagramPost) => void;
  onDeleteReel?: (id: string) => void;
  youtubeChannelId?: string;
  hasYouTubeApiKey?: boolean;
  onSaveChannelId?: (channelId: string, apiKey?: string) => void | Promise<void>;
  onSyncChannel?: (channelId: string) => Promise<number>;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  articles,
  districts,
  selectedState,
  onPublishArticle,
  onDeleteArticle,
  onBackToPublic,
  isDark,
  videos = [],
  onAddVideo,
  onDeleteVideo,
  reels = [],
  onAddReel,
  onDeleteReel,
  youtubeChannelId = '',
  hasYouTubeApiKey = false,
  onSaveChannelId,
  onSyncChannel
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'articles' | 'breaking' | 'reporters' | 'media'>('create');
  
  // Media Tab state
  const [ytUrl, setYtUrl] = useState('');
  const [ytTitle, setYtTitle] = useState('');
  const [ytCategory, setYtCategory] = useState('कवर्धा स्पेशल');
  const [ytDuration, setYtDuration] = useState('10:00');
  const [parsedYt, setParsedYt] = useState<ReturnType<typeof parseYouTubeUrl>>(null);

  // Auto-Sync state
  const [channelIdInput, setChannelIdInput] = useState<string>(() => {
    return youtubeChannelId || localStorage.getItem('anp_yt_channel_id') || 'UC8mIipC7suPuBJ_n8kUzkCg';
  });
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(Boolean(hasYouTubeApiKey));
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [autoSyncOnLoad, setAutoSyncOnLoad] = useState<boolean>(() => {
    return localStorage.getItem('anp_auto_sync_enabled') !== 'false';
  });

  useEffect(() => {
    setHasApiKey(Boolean(hasYouTubeApiKey));
  }, [hasYouTubeApiKey]);

  const handleTriggerSync = async () => {
    const cleanId = extractYouTubeChannelId(channelIdInput) || channelIdInput.trim();
    if (!cleanId) {
      setSyncFeedback('⚠️ कृपया एक वैध यूट्यूब चैनल आईडी दर्ज करें');
      setTimeout(() => setSyncFeedback(null), 3000);
      return;
    }

    setIsSyncing(true);
    setSyncFeedback('🔄 यूट्यूब से नवीनतम वीडियो व शॉर्ट्स फेच किए जा रहे हैं...');

    try {
      if (onSyncChannel) {
        const count = await onSyncChannel(cleanId);
        setSyncFeedback(`✅ सफलता! यूट्यूब चैनल से ${count} वीडियो व शॉर्ट्स स्वतः सिंक हो गए!`);
      } else {
        const res = await syncYouTubeChannelVideos(cleanId);
        if (res.success) {
          if (onAddVideo && res.videos.length > 0) {
            for (const v of res.videos) {
              onAddVideo(v);
            }
          }
          if (onAddReel && res.reels.length > 0) {
            for (const r of res.reels) {
              onAddReel(r);
            }
          }
          setSyncFeedback(`✅ सफलता! यूट्यूब से ${res.count} नवीनतम वीडियो व शॉर्ट्स जोड़े गए!`);
        } else {
          setSyncFeedback(`⚠️ ${res.error || 'सिंक नहीं हो सका'}`);
        }
      }
    } catch {
      setSyncFeedback('⚠️ नेटवर्क समस्या: यूट्यूब फीड से कनेक्ट नहीं हो सका');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  const [reelUrl, setReelUrl] = useState('');
  const [reelCaption, setReelCaption] = useState('');
  const [reelDistrict, setReelDistrict] = useState('कवर्धा');
  const [reelAudio, setReelAudio] = useState('Ambition News Original');
  const [parsedReel, setParsedReel] = useState<{ type: 'instagram' | 'youtube_short'; embedUrl: string; previewThumb?: string; rawId?: string } | null>(null);
  
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
              <img 
                src="/logo.png" 
                alt="एम्बिशन न्यूज़" 
                className="w-8 h-8 rounded-full object-cover ring-2 ring-red-500/60 bg-white p-0.5 shadow shrink-0" 
              />
              <span className="bg-red-600 text-white font-black text-xl px-2.5 py-0.5 rounded-lg shadow">
                एम्बिशन न्यूज़
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

          <button
            onClick={() => setActiveTab('media')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'media'
                ? 'border-red-600 text-red-500'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Tv size={14} className="text-red-500" />
            <span>📺 यूट्यूब वीडियो व रील्स हब ({videos.length + reels.length})</span>
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

        {/* TAB 5: YOUTUBE & REELS HUB */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            
            {/* 0. DEDICATED LIVE YOUTUBE AUTO-SYNC ENGINE */}
            <div className={`p-5 sm:p-6 rounded-3xl border transition-all ${
              isDark 
                ? 'bg-gradient-to-br from-red-950/40 via-[#0a0e1c] to-[#070b16] border-red-900/40 shadow-xl' 
                : 'bg-white border-slate-200 shadow-md'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-red-600/30 shrink-0">
                    <Zap size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black text-white">
                        ऑटोमैटिक यूट्यूब सिंक इंजन (Live Auto-Sync)
                      </h2>
                      <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        सक्रिय
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      यूट्यूब पर वीडियो या शॉर्ट्स अपलोड होते ही यहाँ अपने-आप दिखने लगेगा — बार-बार लिंक डालने की आवश्यकता नहीं!
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTriggerSync}
                  disabled={isSyncing}
                  className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:brightness-110 active:scale-95 text-white font-bold text-xs px-5 py-2.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/25 transition disabled:opacity-60 cursor-pointer"
                >
                  <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
                  <span>{isSyncing ? 'सिंक हो रहा है...' : '🔄 अभी सिंक करें (Sync Latest)'}</span>
                </button>
              </div>

              {/* Channel ID Input & Guidance */}
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      यूट्यूब चैनल आईडी (YouTube Channel ID / Channel URL)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={channelIdInput}
                        onChange={(e) => setChannelIdInput(e.target.value)}
                        placeholder="उदा. UC_x5XG1OV2P6uZZ5FSM9Ttw या https://youtube.com/channel/UC..."
                        className="flex-1 bg-[#05070e] border border-white/15 focus:border-red-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono outline-none"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const clean = extractYouTubeChannelId(channelIdInput) || channelIdInput.trim();
                          if (clean) {
                            setSyncFeedback('⏳ चैनल आईडी Atlas में सुरक्षित की जा रही है...');
                            localStorage.setItem('anp_yt_channel_id', clean);
                            if (onSaveChannelId) {
                              await onSaveChannelId(clean);
                            }
                            setSyncFeedback(`✅ चैनल आईडी "${clean}" MongoDB Atlas में सुरक्षित की गई!`);
                            setTimeout(() => setSyncFeedback(null), 3500);
                          }
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                      >
                        सेव करें
                      </button>
                    </div>
                  </div>

                  {/* YouTube Data API v3 Key (Official Google API) */}
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                        <span>YouTube Data API v3 Key (आधिकारिक Google API)</span>
                        {hasApiKey ? (
                          <span className="text-[10px] bg-emerald-950 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-800 flex items-center gap-1">
                            <Check size={10} className="text-emerald-400" /> एक्टिव
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-800 text-slate-400 font-medium px-2 py-0.5 rounded-full border border-slate-700">
                            वैकल्पिक (Fallback मोड एक्टिव)
                          </span>
                        )}
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder={hasApiKey ? "•••••••••••••••••••• (API Key सुरक्षित है)" : "AIzaSy... (Google Cloud Console से प्राप्त API Key)"}
                        className="flex-1 bg-[#05070e] border border-white/15 focus:border-red-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-2.5 py-2 rounded-xl transition"
                        title="Key देखें / छिपाएं"
                      >
                        {showApiKey ? "छिपाएं" : "देखें"}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (apiKeyInput.trim() && onSaveChannelId) {
                            setSyncFeedback('⏳ API Key MongoDB Atlas में सुरक्षित की जा रही है...');
                            const clean = extractYouTubeChannelId(channelIdInput) || channelIdInput.trim();
                            await onSaveChannelId(clean, apiKeyInput.trim());
                            setHasApiKey(true);
                            setApiKeyInput('');
                            setSyncFeedback('✅ YouTube Data API v3 Key सुरक्षित हो गई! अब Google Official API से सिंक होगा।');
                            setTimeout(() => setSyncFeedback(null), 4000);
                          }
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer"
                      >
                        Key सेव करें
                      </button>
                    </div>
                  </div>

                  {syncFeedback && (
                    <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                      <Check size={14} className="text-emerald-400 shrink-0" />
                      <span>{syncFeedback}</span>
                    </div>
                  )}

                  {/* Auto-sync on load toggle */}
                  <div className="flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                      <input
                        type="checkbox"
                        checked={autoSyncOnLoad}
                        onChange={(e) => {
                          setAutoSyncOnLoad(e.target.checked);
                          localStorage.setItem('anp_auto_sync_enabled', String(e.target.checked));
                        }}
                        className="w-4 h-4 rounded text-red-600 focus:ring-red-500 bg-slate-900 border-slate-700 cursor-pointer"
                      />
                      <span>वेबसाइट लोड होते ही बैकग्राउंड में नए वीडियो अपने-आप सिंक करें</span>
                    </label>
                  </div>
                </div>

                {/* Help box */}
                <div className="p-3.5 bg-black/40 border border-white/10 rounded-2xl text-[11px] space-y-1.5 text-slate-300">
                  <div className="font-bold text-white flex items-center gap-1">
                    <HelpCircle size={13} className="text-amber-400" />
                    <span>चैनल आईडी (UC...) कैसे प्राप्त करें?</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400 leading-relaxed">
                    <li><strong className="text-slate-200">YouTube Studio</strong> (studio.youtube.com) खोलें।</li>
                    <li>बाईं ओर <strong className="text-slate-200">Customization</strong> पर क्लिक करें।</li>
                    <li><strong className="text-slate-200">Basic Info</strong> में नीचे <strong className="text-red-400">Channel ID</strong> (UC से शुरू) कॉपी करके यहाँ पेस्ट करें।</li>
                  </ol>
                  <div className="text-[10px] text-amber-300/80 pt-1 border-t border-white/5">
                    💡 <strong>शॉर्ट्स (#shorts)</strong> स्वतः रील्स सेक्शन में और <strong>लंबे वीडियो</strong> बुलेटिन में लोड हो जाएंगे!
                  </div>
                </div>
              </div>
            </div>

            {/* 1. YOUTUBE BULLETINS SECTION */}
            <div className={`p-5 rounded-3xl border ${
              isDark ? 'bg-[#090d18]/95 border-red-950/40' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">
                    <Tv size={17} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white">यूट्यूब वीडियो बुलेटिन प्रबंधन</h2>
                    <p className="text-xs text-slate-400">पोर्टल पर लाइव दिखने वाले यूट्यूब वीडियो जोड़ें व हटाएं</p>
                  </div>
                </div>
                <span className="text-xs bg-red-950 text-red-300 font-bold px-2 py-0.5 rounded border border-red-800">
                  {videos.length} वीडियो सक्रिय
                </span>
              </div>

              {/* Add YouTube Video Form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!parsedYt || !ytTitle.trim()) return;
                  if (onAddVideo) {
                    onAddVideo({
                      id: 'vid_' + Date.now(),
                      title: ytTitle.trim(),
                      youtubeId: parsedYt.id,
                      thumbnail: parsedYt.thumbnailUrl,
                      duration: ytDuration || '10:00',
                      views: '1',
                      timeAgo: 'अभी-अभी',
                      category: ytCategory,
                      youtubeUrl: parsedYt.watchUrl
                    });
                  }
                  setYtUrl('');
                  setYtTitle('');
                  setParsedYt(null);
                }}
                className="bg-black/30 p-4 rounded-2xl border border-white/10 space-y-3 mb-6"
              >
                <div className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus size={14} />
                  <span>नया यूट्यूब वीडियो लिंक जोड़ें</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      YouTube URL (watch?v=, youtu.be, या ID)
                    </label>
                    <input 
                      type="text"
                      value={ytUrl}
                      onChange={(e) => {
                        setYtUrl(e.target.value);
                        setParsedYt(parseYouTubeUrl(e.target.value));
                      }}
                      placeholder="उदा. https://www.youtube.com/watch?v=..."
                      className="w-full bg-[#05070e] border border-white/15 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      वीडियो शीर्षक (Headline)
                    </label>
                    <input 
                      type="text"
                      value={ytTitle}
                      onChange={(e) => setYtTitle(e.target.value)}
                      placeholder="उदा. कवर्धा में किसानों की बड़ी रैली..."
                      className="w-full bg-[#05070e] border border-white/15 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      required
                    />
                  </div>
                </div>

                {parsedYt && (
                  <div className="flex items-center gap-3 p-2.5 bg-emerald-950/30 border border-emerald-500/40 rounded-xl">
                    <img src={parsedYt.thumbnailUrl} alt="Thumb" className="w-16 aspect-video rounded object-cover" />
                    <span className="text-xs text-emerald-400 font-bold">वैध वीडियो मिला! ID: {parsedYt.id}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={ytCategory}
                      onChange={(e) => setYtCategory(e.target.value)}
                      className="bg-[#05070e] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                    >
                      <option value="कवर्धा स्पेशल">कवर्धा स्पेशल</option>
                      <option value="राज्य बुलेटिन">राज्य बुलेटिन</option>
                      <option value="राजनीति">राजनीति</option>
                      <option value="अपराध">अपराध</option>
                      <option value="कृषि व मंडी">कृषि व मंडी</option>
                    </select>

                    <input 
                      type="text"
                      value={ytDuration}
                      onChange={(e) => setYtDuration(e.target.value)}
                      placeholder="12:30"
                      className="w-20 bg-[#05070e] border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!parsedYt || !ytTitle.trim()}
                    className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow active:scale-95"
                  >
                    + वीडियो प्रकाशित करें
                  </button>
                </div>
              </form>

              {/* Existing Videos List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  लाइव वीडियो सूची ({videos.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {videos.map((vid) => (
                    <div key={vid.id} className="p-3 bg-black/40 rounded-2xl border border-white/10 flex items-center gap-3">
                      <div className="w-20 aspect-video rounded-lg overflow-hidden relative shrink-0 bg-slate-900">
                        <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 bg-black/80 text-[9px] px-1 rounded text-white font-mono">
                          {vid.duration}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">{vid.title}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="text-red-400 font-medium">{vid.category}</span>
                          <span>•</span>
                          <span>{vid.timeAgo}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <a 
                          href={vid.youtubeUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-white"
                          title="Open on YouTube"
                        >
                          <ExternalLink size={14} />
                        </a>
                        {onDeleteVideo && (
                          <button
                            onClick={() => onDeleteVideo(vid.id)}
                            className="p-1.5 text-red-400 hover:text-red-300"
                            title="हटाएं"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* 2. REELS & SHORTS SECTION */}
            <div className={`p-5 rounded-3xl border ${
              isDark ? 'bg-[#090d18]/95 border-pink-950/40' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-600 via-purple-600 to-indigo-600 flex items-center justify-center text-white">
                    <Film size={17} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white">इंस्टाग्राम रील्स व यूट्यूब शॉर्ट्स प्रबंधन</h2>
                    <p className="text-xs text-slate-400">पोर्टल पर लाइव दिखने वाली रील्स जोड़ें व हटाएं</p>
                  </div>
                </div>
                <span className="text-xs bg-pink-950 text-pink-300 font-bold px-2 py-0.5 rounded border border-pink-800">
                  {reels.length} रील्स सक्रिय
                </span>
              </div>

              {/* Add Reel Form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!parsedReel || !reelCaption.trim()) return;
                  if (onAddReel) {
                    onAddReel({
                      id: 'reel_' + Date.now(),
                      caption: reelCaption.trim(),
                      imageUrl: parsedReel.previewThumb || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800',
                      youtubeId: parsedReel.type === 'youtube_short' ? parsedReel.rawId : undefined,
                      embedUrl: parsedReel.embedUrl,
                      postUrl: reelUrl.trim(),
                      likes: '1',
                      commentsCount: '0',
                      sharesCount: '0',
                      district: reelDistrict,
                      timeAgo: 'अभी-अभी',
                      audioTrack: reelAudio.trim() || 'Ambition News Original'
                    });
                  }
                  setReelUrl('');
                  setReelCaption('');
                  setParsedReel(null);
                }}
                className="bg-black/30 p-4 rounded-2xl border border-white/10 space-y-3 mb-6"
              >
                <div className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus size={14} />
                  <span>नई इंस्टाग्राम रील या यूट्यूब शॉर्ट जोड़ें</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Instagram Reel या YouTube Shorts URL
                    </label>
                    <input 
                      type="text"
                      value={reelUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        setReelUrl(val);
                        const ig = parseInstagramUrl(val);
                        if (ig) {
                          setParsedReel({ type: 'instagram', embedUrl: ig.embedUrl });
                          return;
                        }
                        const yt = parseYouTubeUrl(val);
                        if (yt) {
                          setParsedReel({ type: 'youtube_short', embedUrl: yt.embedUrl, previewThumb: yt.thumbnailUrl, rawId: yt.id });
                          return;
                        }
                        setParsedReel(null);
                      }}
                      placeholder="उदा. https://www.instagram.com/reel/... या shorts/..."
                      className="w-full bg-[#05070e] border border-white/15 focus:border-pink-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      कैप्शन (Caption)
                    </label>
                    <input 
                      type="text"
                      value={reelCaption}
                      onChange={(e) => setReelCaption(e.target.value)}
                      placeholder="उदा. कवर्धा भोरमदेव मंदिर की भव्य आरती..."
                      className="w-full bg-[#05070e] border border-white/15 focus:border-pink-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      required
                    />
                  </div>
                </div>

                {parsedReel && (
                  <div className="flex items-center gap-3 p-2.5 bg-emerald-950/30 border border-emerald-500/40 rounded-xl">
                    <span className="text-xs text-emerald-400 font-bold">
                      मान्य {parsedReel.type === 'instagram' ? 'इंस्टाग्राम रील' : 'यूट्यूब शॉर्ट'} लिंक मिला!
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <input 
                      type="text"
                      value={reelDistrict}
                      onChange={(e) => setReelDistrict(e.target.value)}
                      placeholder="जिला (कवर्धा)"
                      className="w-28 bg-[#05070e] border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
                    />
                    <input 
                      type="text"
                      value={reelAudio}
                      onChange={(e) => setReelAudio(e.target.value)}
                      placeholder="ऑडियो ट्रैक"
                      className="w-40 bg-[#05070e] border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!parsedReel || !reelCaption.trim()}
                    className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow active:scale-95"
                  >
                    + रील प्रकाशित करें
                  </button>
                </div>
              </form>

              {/* Existing Reels List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  लाइव रील्स सूची ({reels.length})
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {reels.map((reel) => (
                    <div key={reel.id} className="p-2.5 bg-black/40 rounded-2xl border border-white/10 flex flex-col justify-between">
                      <div className="aspect-[9/14] rounded-xl overflow-hidden relative bg-slate-900 mb-2">
                        <img src={reel.imageUrl} alt={reel.caption} className="w-full h-full object-cover" />
                        <span className="absolute top-1 left-1 bg-black/80 text-[9px] px-1.5 py-0.5 rounded text-pink-400 font-bold">
                          {reel.district}
                        </span>
                      </div>
                      <p className="text-[10px] text-white font-medium line-clamp-2 leading-snug">{reel.caption}</p>
                      <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/10">
                        <a 
                          href={reel.postUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[10px] text-pink-400 hover:underline flex items-center gap-0.5"
                        >
                          <span>लिंक</span>
                          <ExternalLink size={10} />
                        </a>
                        {onDeleteReel && (
                          <button
                            onClick={() => onDeleteReel(reel.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="हटाएं"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

    </div>
  );
};
