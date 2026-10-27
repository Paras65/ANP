import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  ArrowLeft, 
  FileText, 
  Radio, 
  Users, 
  Trash2, 
  Eye, 
  EyeOff,
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
  HelpCircle,
  Wheat,
  TrendingUp,
  TrendingDown,
  Minus,
  Save,
  Edit3,
  PlusCircle,
  Lock,
  Unlock,
  Search,
  LogOut,
  ShieldCheck,
  Upload,
  MoreHorizontal,
  Mic,
  MessageCircle,
  Image as ImageIcon,
  Bell,
  Wand2
} from 'lucide-react';
import type { Article, DistrictItem, VideoBulletin, InstagramPost, MandiRate } from '../types';
import { parseYouTubeUrl, parseInstagramUrl, extractYouTubeChannelId, syncYouTubeChannelVideos } from '../utils/mediaUtils';
import { WhatsAppIcon } from './SocialIcons';
import api, { setAuthToken } from '../api/client';
import { SOCIAL_LINKS } from '../data/mockData';
import { WhatsAppBulletinModal } from './WhatsAppBulletinModal';
import { NewsCardGeneratorModal } from './NewsCardGeneratorModal';
import { generateHeadlinesAI, autoSummarizeAI, polishArticleAI, redactClientSecret, type AIHeadlineSuggestion } from '../utils/aiNewsAssistant';
import { sendBreakingPushNotification } from '../utils/pushNotification';
import { useVoiceTyping } from '../hooks/useVoiceTyping';

interface AdminPortalProps {
  articles: Article[];
  districts: DistrictItem[];
  selectedState: 'chhattisgarh' | 'madhya-pradesh';
  onPublishArticle: (article: Partial<Article>) => void;
  onUpdateArticle?: (id: string, article: Partial<Article>) => void;
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
  onSaveChannelId?: (channelId: string) => void | Promise<void>;
  onSyncChannel?: (channelId: string) => Promise<number>;
  whatsappLink?: string;
  onSaveWhatsAppLink?: (link: string) => void;
  mandiRates?: MandiRate[];
  onUpdateMandiRate?: (rate: MandiRate) => void | Promise<void>;
  onAddMandiRate?: (rate: Omit<MandiRate, 'id'>) => void | Promise<void>;
  onDeleteMandiRate?: (id: string) => void | Promise<void>;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  articles,
  districts,
  selectedState,
  onPublishArticle,
  onUpdateArticle,
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
  onSyncChannel,
  whatsappLink = '',
  onSaveWhatsAppLink,
  mandiRates = [],
  onUpdateMandiRate,
  onAddMandiRate,
  onDeleteMandiRate
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'articles' | 'breaking' | 'reporters' | 'media' | 'mandi'>('create');
  // Security & Authentication State (Strict Token-Based State)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = sessionStorage.getItem('anp_admin_token') || localStorage.getItem('anp_admin_token');
    return Boolean(token);
  });
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Articles Search & Filter State (Tab 2)
  const [articleSearchQuery, setArticleSearchQuery] = useState('');
  const [articleDistrictFilter, setArticleDistrictFilter] = useState('सभी');

  // Mobile UX States
  const [tab1MobileView, setTab1MobileView] = useState<'form' | 'preview'>('form');
  const [showBackToTop, setShowBackToTop] = useState(false);
  // Power Features State: WhatsApp, Photo Card, AI, Voice & Push
  const [sendPushAlert, setSendPushAlert] = useState(false);
  const [showAiTools, setShowAiTools] = useState(false);
  const [whatsAppArticle, setWhatsAppArticle] = useState<Article | null>(null);
  const [cardArticle, setCardArticle] = useState<Article | null>(null);
  const [aiHeadlineSuggestions, setAiHeadlineSuggestions] = useState<AIHeadlineSuggestion[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  // Voice Typing Hooks (Web Speech API with live feedback & continuous laptop dictation)
  const [headlineInterim, setHeadlineInterim] = useState('');
  const {
    isListening: isListeningHeadline,
    isSupported: isVoiceSupported,
    toggleListening: toggleVoiceHeadline
  } = useVoiceTyping({
    lang: 'hi-IN',
    onResult: (text) => {
      setTitle((prev) => (prev ? prev + ' ' + text : text));
    },
    onInterim: (text) => {
      setHeadlineInterim(text);
    },
    onError: (err) => {
      setAiFeedback(`⚠️ शीर्षक वॉइस टाइपिंग: ${err}`);
    }
  });

  const [excerptInterim, setExcerptInterim] = useState('');
  const {
    isListening: isListeningExcerpt,
    toggleListening: toggleVoiceExcerpt
  } = useVoiceTyping({
    lang: 'hi-IN',
    onResult: (text) => {
      setExcerpt((prev) => (prev ? prev + ' ' + text : text));
    },
    onInterim: (text) => {
      setExcerptInterim(text);
    },
    onError: (err) => {
      setAiFeedback(`⚠️ सारांश वॉइस टाइपिंग: ${err}`);
    }
  });

  const [contentInterim, setContentInterim] = useState('');
  const {
    isListening: isListeningContent,
    toggleListening: toggleVoiceContent
  } = useVoiceTyping({
    lang: 'hi-IN',
    onResult: (text) => {
      setContent((prev) => (prev ? prev + ' ' + text : text));
    },
    onInterim: (text) => {
      setContentInterim(text);
    },
    onError: (err) => {
      setAiFeedback(`⚠️ खबर सामग्री वॉइस टाइपिंग: ${err}`);
    }
  });

  // Voice Typing for Quick Breaking Ticker
  const [breakingInterim, setBreakingInterim] = useState('');
  const {
    isListening: isListeningBreaking,
    toggleListening: toggleVoiceBreaking
  } = useVoiceTyping({
    lang: 'hi-IN',
    onResult: (text) => {
      setBreakingHeadline((prev) => (prev ? prev + ' ' + text : text));
    },
    onInterim: (text) => {
      setBreakingInterim(text);
    }
  });

  // Voice Typing for YouTube Video Headline
  const [ytTitleInterim, setYtTitleInterim] = useState('');
  const {
    isListening: isListeningYtTitle,
    toggleListening: toggleVoiceYtTitle
  } = useVoiceTyping({
    lang: 'hi-IN',
    onResult: (text) => {
      setYtTitle((prev) => (prev ? prev + ' ' + text : text));
    },
    onInterim: (text) => {
      setYtTitleInterim(text);
    }
  });

  // Voice Typing for Reel Caption
  const [reelCaptionInterim, setReelCaptionInterim] = useState('');
  const {
    isListening: isListeningReelCaption,
    toggleListening: toggleVoiceReelCaption
  } = useVoiceTyping({
    lang: 'hi-IN',
    onResult: (text) => {
      setReelCaption((prev) => (prev ? prev + ' ' + text : text));
    },
    onInterim: (text) => {
      setReelCaptionInterim(text);
    }
  });

  // Voice Typing for Admin Article Search
  const {
    isListening: isListeningArticleSearch,
    toggleListening: toggleVoiceArticleSearch
  } = useVoiceTyping({
    lang: 'hi-IN',
    onResult: (text) => {
      setArticleSearchQuery(text);
    }
  });

  // AI Assistant Handlers (Dynamic Google Gemini Backend)
  const handleGenerateHeadlines = async () => {
    setIsGeneratingAI(true);
    setAiFeedback(null);
    try {
      const suggestions = await generateHeadlinesAI(title || excerpt || content, district);
      setAiHeadlineSuggestions(suggestions);
      setAiFeedback('✨ Gemini AI: 3 नए शीर्षक तैयार हैं! नीचे से मनपसंद शीर्षक चुनें:');
    } catch (err: any) {
      const msg = redactClientSecret(err.response?.data?.message || err.message || 'Gemini AI सेवा से संपर्क नहीं हो सका');
      setAiFeedback(`⚠️ ${msg} — आप बोलकर (🎙️) लिख सकते हैं।`);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleAutoSummarize = async () => {
    setIsGeneratingAI(true);
    setAiFeedback(null);
    try {
      const sum = await autoSummarizeAI(content, district);
      setExcerpt(sum);
      setAiFeedback('✨ Gemini AI: समाचार का संक्षिप्त सारांश तैयार हो गया!');
      setTimeout(() => setAiFeedback(null), 4000);
    } catch (err: any) {
      const msg = redactClientSecret(err.response?.data?.message || err.message || 'Gemini AI सेवा से संपर्क नहीं हो सका');
      setAiFeedback(`⚠️ ${msg} — आप बोलकर (🎙️) लिख सकते हैं।`);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handlePolishArticle = async () => {
    setIsGeneratingAI(true);
    setAiFeedback(null);
    try {
      const polished = await polishArticleAI(content, title, district, author);
      setContent(polished);
      setAiFeedback('✨ Gemini AI: समाचार को पत्रकारिता शैली में पॉलिश कर दिया गया!');
      setTimeout(() => setAiFeedback(null), 4000);
    } catch (err: any) {
      const msg = redactClientSecret(err.response?.data?.message || err.message || 'Gemini AI सेवा से संपर्क नहीं हो सका');
      setAiFeedback(`⚠️ ${msg} — आप बोलकर (🎙️) लिख सकते हैं।`);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const [showMobileMoreDrawer, setShowMobileMoreDrawer] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 280);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Restore session token if available
  useEffect(() => {
    const token = sessionStorage.getItem('anp_admin_token') || localStorage.getItem('anp_admin_token');
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  // Verify Password strictly with backend (Validated exclusively via process.env.ADMIN_PIN)
  const handleVerifyPassword = async (passCandidate?: string) => {
    const pin = (passCandidate !== undefined ? passCandidate : adminPassword).trim();
    if (!pin) {
      setPasswordError('कृपया एडमिन पासवर्ड दर्ज करें');
      return;
    }

    setIsVerifying(true);
    setPasswordError(null);

    try {
      const res = await api.post('/auth/verify-admin', { pin });
      if (res.data?.success) {
        if (res.data?.token) {
          setAuthToken(res.data.token);
          if (rememberMe) {
            localStorage.setItem('anp_admin_token', res.data.token);
            localStorage.setItem('anp_admin_auth', 'true');
          } else {
            sessionStorage.setItem('anp_admin_token', res.data.token);
            sessionStorage.setItem('anp_admin_auth', 'true');
          }
        }
        setIsAuthenticated(true);
        setAdminPassword('');
        return;
      }
    } catch (err: any) {
      setPasswordError(err?.response?.data?.message || 'अमान्य एडमिन पासवर्ड — कृपया सही पासवर्ड दर्ज करें');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    localStorage.removeItem('anp_admin_auth');
    sessionStorage.removeItem('anp_admin_auth');
    localStorage.removeItem('anp_admin_token');
    sessionStorage.removeItem('anp_admin_token');
    setIsAuthenticated(false);
    setAdminPassword('');
  };


  // Mandi Desk State
  const [editingMandiId, setEditingMandiId] = useState<string | null>(null);
  const [editRateVal, setEditRateVal] = useState<number>(0);
  const [editChangeVal, setEditChangeVal] = useState<'up' | 'down' | 'steady'>('steady');
  const [editDiffVal, setEditDiffVal] = useState<number>(0);

  // Add New Crop Rate State
  const [showAddCropModal, setShowAddCropModal] = useState(false);
  const [newCropName, setNewCropName] = useState('');
  const [newCropMandi, setNewCropMandi] = useState('कवर्धा');
  const [newCropState, setNewCropState] = useState('CG');
  const [newCropRate, setNewCropRate] = useState<number>(3500);
  const [newCropUnit, setNewCropUnit] = useState('₹/क्विंटल');
  const [newCropChange, setNewCropChange] = useState<'up' | 'down' | 'steady'>('steady');
  const [newCropDiff, setNewCropDiff] = useState<number>(0);
  
  // WhatsApp Link Management
  const [whatsappInput, setWhatsappInput] = useState<string>(() => {
    return whatsappLink || localStorage.getItem('anp_whatsapp_link') || SOCIAL_LINKS.whatsappGroup;
  });
  const [whatsappFeedback, setWhatsappFeedback] = useState<string | null>(null);
  
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
  
  // Editing Article State
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Start editing existing article
  const handleStartEdit = (art: Article) => {
    setEditingArticleId(art._id);
    setTitle(art.title || '');
    setExcerpt(art.excerpt || '');
    setContent(art.content || '');
    setDistrict(art.district || 'कबीरधाम (कवर्धा)');
    setCategory(art.category || '🔴 कवर्धा स्पेशल');
    setAuthor(art.author || 'एम्बिशन ब्यूरो प्रतिनिधि');
    setCoverImage(art.coverImage || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1000&auto=format&fit=crop&q=80');
    setIsBreaking(Boolean(art.isBreaking));
    setIsFeatured(Boolean(art.isFeatured));
    setActiveTab('create');
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingArticleId(null);
    setTitle('');
    setExcerpt('');
    setContent('');
    setDistrict('कबीरधाम (कवर्धा)');
    setCategory('🔴 कवर्धा स्पेशल');
    setAuthor('कवर्धा डेस्क प्रभारी (मुख्य संपादक)');
    setCoverImage('https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1000&auto=format&fit=crop&q=80');
    setIsBreaking(false);
    setIsFeatured(false);
  };

  // Local File Upload Handler
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('कृपया 5 MB से छोटी फोटो चुनें');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setCoverImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Delete Confirmation Handler
  const handleDeleteArticleConfirmed = (id: string, artTitle?: string) => {
    const msg = artTitle 
      ? `क्या आप सच में इस खबर को हटाना चाहते हैं?\n"${artTitle}"` 
      : 'क्या आप सच में इस खबर को पोर्टल से हटाना चाहते हैं?';
    if (window.confirm(msg)) {
      onDeleteArticle(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !excerpt.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const payload = {
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
      };

      if (editingArticleId && onUpdateArticle) {
        onUpdateArticle(editingArticleId, payload);
        setEditingArticleId(null);
      } else {
        onPublishArticle(payload);
        if (sendPushAlert || isBreaking) {
          sendBreakingPushNotification(title, excerpt || content, district);
        }
      }

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


  // SECURITY GATE: Render login screen if unauthenticated (Strict ENV validation)
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen font-devanagari flex flex-col items-center justify-center p-4 transition-colors ${
        isDark ? 'bg-[#060911] text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}>
        <div className={`w-full max-w-md p-6 sm:p-8 rounded-3xl border shadow-2xl space-y-6 text-center ${
          isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          {/* Logo & Header */}
          <div className="flex flex-col items-center gap-2.5">
            <div className="relative">
              <img 
                src="/logo.png" 
                alt="Ambition News" 
                className="w-16 h-16 rounded-full object-cover ring-4 ring-red-500/80 bg-white p-1 shadow-xl"
              />
              <span className="absolute -bottom-1 -right-1 bg-red-600 text-white p-1 rounded-full shadow">
                <Lock size={12} />
              </span>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className="bg-red-600 text-white font-black text-xl px-2.5 py-0.5 rounded-lg shadow">
                  एम्बिशन न्यूज़
                </span>
                <span className="text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded">
                  संपादकीय डेस्क
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                🔒 अधिकृत संपादकीय नियंत्रण कक्ष (Restricted Access)
              </p>
              <p className="text-[11px] text-amber-400/90 bg-amber-950/40 border border-amber-800/40 px-3 py-1 rounded-xl mt-2 inline-block">
                🔐 प्रमाणीकरण केवल सर्वर एनवायरनमेंट (ADMIN_PIN) से मान्य है
              </p>
            </div>
          </div>

          {/* Secure Admin Password Input Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleVerifyPassword();
            }}
            className="space-y-4 text-left"
          >
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1.5">
                एडमिन पासवर्ड (Admin Password / Master Passkey)
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder="अपना गुप्त एडमिन पासवर्ड दर्ज करें"
                  className="w-full bg-[#05070e] border border-white/20 focus:border-red-500 rounded-2xl py-3.5 pl-4 pr-11 text-white text-sm font-mono tracking-wider outline-none shadow-inner transition"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg transition"
                  title={showPassword ? 'पासवर्ड छुपाएं' : 'पासवर्ड देखें'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {passwordError && (
                <div className="mt-2 text-xs font-bold text-rose-400 bg-rose-950/50 border border-rose-800/60 p-2.5 rounded-xl animate-in fade-in flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>{passwordError}</span>
                </div>
              )}
            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded accent-red-600 w-4 h-4 cursor-pointer"
                />
                <span>इस डिवाइस पर लॉगिन याद रखें</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isVerifying || !adminPassword.trim()}
              className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-sm py-3.5 rounded-2xl transition shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <Unlock size={16} />
              <span>{isVerifying ? 'प्रमाणीकरण हो रहा है...' : 'सुरक्षित एडमिन प्रवेश (Login to Desk)'}</span>
            </button>
          </form>

          {/* Bottom Back Button & Hint */}
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
            <button
              onClick={onBackToPublic}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition py-1"
            >
              <ArrowLeft size={13} />
              <span>पाठक पोर्टल</span>
            </button>
            <span className="text-[10px] text-slate-500">
              HMAC-SHA256 • Timing-Safe
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-devanagari flex flex-col transition-colors ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* 1. ADMIN DESK TOP BAR */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-xl ${
        isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2">
          
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-2">
            <img 
              src="/logo.png" 
              alt="एम्बिशन न्यूज़" 
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-2 ring-red-500/60 bg-white p-0.5 shadow shrink-0" 
            />
            <div className="flex items-center gap-1.5">
              <span className="bg-red-600 text-white font-black text-sm sm:text-xl px-2 py-0.5 rounded-lg shadow leading-tight">
                एम्बिशन
              </span>
              <span className="text-[10px] sm:text-xs font-bold bg-amber-500/20 text-amber-500 border border-amber-500/40 px-1.5 py-0.5 rounded">
                एडमिन
              </span>
            </div>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline text-xs text-slate-400">
              कवर्धा (कबीरधाम) मुख्य डेस्क
            </span>
          </div>

          {/* Actions: Compact on mobile, detailed on desktop */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="hidden xl:flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-[11px] font-bold px-2 py-1 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>सत्र सक्रिय</span>
            </span>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold p-2 sm:px-2.5 sm:py-1.5 rounded-xl border border-rose-800/60 transition active:scale-95"
              title="सुरक्षित लॉगआउट"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">लॉगआउट</span>
            </button>

            <button
              onClick={onBackToPublic}
              className="flex items-center gap-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl transition active:scale-95 shadow"
              title="लाइव पाठक पोर्टल"
            >
              <ArrowLeft size={13} />
              <span className="hidden sm:inline">पाठक पोर्टल</span>
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
            <div className={`text-xl sm:text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
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
            <div className={`text-xl sm:text-2xl font-black mt-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
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
            <div className={`text-xl sm:text-2xl font-black mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
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
            <div className={`text-xl sm:text-2xl font-black mt-1 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
              88 जिले (CG-MP)
            </div>
          </div>

        </div>
      </div>



      {/* 2b. QUICK ACTIONS BAR FOR BUSY EDITORS (DESKTOP) */}
      <div className="max-w-7xl mx-auto px-4 pt-3 pb-1 w-full hidden md:block">
        <div className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 overflow-x-auto no-scrollbar ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="text-[11px] font-bold text-slate-400 whitespace-nowrap px-2 flex items-center gap-1">
            <Zap size={13} className="text-amber-400" />
            <span>त्वरित शॉर्टकट:</span>
          </div>

          <div className="flex items-center gap-2 whitespace-nowrap">
            <button
              onClick={() => setActiveTab('create')}
              className="flex items-center gap-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 text-xs font-bold px-3 py-1.5 rounded-xl transition active:scale-95"
            >
              <Send size={12} />
              <span>✍️ नई खबर लिखें</span>
            </button>

            <button
              onClick={() => setActiveTab('mandi')}
              className="flex items-center gap-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/40 text-xs font-bold px-3 py-1.5 rounded-xl transition active:scale-95"
            >
              <Wheat size={12} />
              <span>🌾 मंडी भाव बदलें</span>
            </button>

            <button
              onClick={() => setActiveTab('breaking')}
              className="flex items-center gap-1 bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/40 text-xs font-bold px-3 py-1.5 rounded-xl transition active:scale-95"
            >
              <Radio size={12} />
              <span>⚡ ब्रेकिंग टिकर</span>
            </button>

            <button
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="flex items-center gap-1 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/40 text-xs font-bold px-3 py-1.5 rounded-xl transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'सिंक हो रहा...' : '📺 यूट्यूब सिंक'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. ADMIN TABS NAVIGATION (DESKTOP) */}
      <div className="max-w-7xl mx-auto px-4 pt-4 w-full hidden md:block">
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

          <button
            onClick={() => setActiveTab('mandi')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'mandi'
                ? 'border-emerald-600 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Wheat size={14} className="text-emerald-500" />
            <span>🌾 दैनिक मंडी भाव ({mandiRates.length})</span>
          </button>
        </div>
      </div>

      {/* 4. TAB CONTENTS */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full pb-28 md:pb-6">
        
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
          <div>
            {/* Mobile Form vs Preview Switcher */}
            <div className="flex lg:hidden bg-slate-800/40 p-1 rounded-2xl mb-4 border border-white/10 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTab1MobileView('form')}
                className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  tab1MobileView === 'form'
                    ? 'bg-red-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Edit3 size={13} />
                <span>✍️ समाचार लिखें</span>
              </button>
              <button
                type="button"
                onClick={() => setTab1MobileView('preview')}
                className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  tab1MobileView === 'preview'
                    ? 'bg-red-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye size={13} />
                <span>👁️ लाइव प्रीव्यू</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Form Column (2 Cols) */}
              <div className={`lg:col-span-2 p-4 sm:p-6 rounded-3xl border shadow-xl ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
              } ${tab1MobileView === 'preview' ? 'hidden lg:block' : 'block'}`}>
              <div className={`mb-4 pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between gap-2">
                  <h2 className={`text-base font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {editingArticleId ? (
                      <>
                        <Edit3 size={18} className="text-amber-500" />
                        <span>समाचार संपादन व संशोधन</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} className="text-red-500" />
                        <span>संपादकीय समाचार प्रकाशन फॉर्म</span>
                      </>
                    )}
                  </h2>
                  {editingArticleId && (
                    <span className="bg-amber-500/20 text-amber-500 border border-amber-500/40 text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                      ✏️ संशोधन मोड
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {editingArticleId 
                    ? 'आप इस समय चयनित समाचार के शीर्षक, विवरण या फोटो में संशोधन कर रहे हैं।' 
                    : 'यह फॉर्म केवल अधिकृत रिपोर्टर्स और संपादकों के लिए है। सबमिट करते ही खबर लाइव हो जाएगी।'}
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
                      className={`w-full rounded-xl p-2.5 text-xs font-semibold outline-none transition ${
    isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-red-500' : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-red-600 focus:bg-white'
  }`}
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

                                {/* 0. MINIMALIST COLLAPSIBLE AI ASSISTANT STRIP */}
                <div className="rounded-2xl border border-dashed border-red-500/30 overflow-hidden bg-red-500/5 transition-all">
                  <button
                    type="button"
                    onClick={() => setShowAiTools(prev => !prev)}
                    className="w-full px-3 py-2 flex items-center justify-between text-xs font-bold text-red-500 hover:bg-red-500/10 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={13} className="text-amber-400" />
                      <span>स्मार्ट AI न्यूज़ असिस्टेंट</span>
                      <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">(हेडलाइन्स, सारांश, प्रूफरीडिंग)</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-mono">
                      {showAiTools ? '▲ छुपाएं' : '▼ खोलें'}
                    </span>
                  </button>

                  {showAiTools && (
                    <div className="p-3 border-t border-red-500/20 space-y-2.5 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleGenerateHeadlines}
                          disabled={isGeneratingAI}
                          className="px-2.5 py-1 rounded-xl bg-red-600 text-white text-xs font-bold transition flex items-center gap-1 active:scale-95 disabled:opacity-50 shadow-sm"
                        >
                          <Wand2 size={12} />
                          <span>{isGeneratingAI ? 'जनरेट हो रहा...' : '✨ 3 आकर्षक हेडलाइन्स'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleAutoSummarize}
                          className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1 active:scale-95 border border-slate-700"
                        >
                          <span>📝 1-क्लिक सारांश</span>
                        </button>

                        <button
                          type="button"
                          onClick={handlePolishArticle}
                          className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1 active:scale-95 border border-slate-700"
                        >
                          <span>✍️ प्रेस फॉर्मेट में पॉलिश करें</span>
                        </button>
                      </div>

                      {aiFeedback && (
                        <div className="text-[11px] font-bold text-amber-400 animate-in fade-in">
                          {aiFeedback}
                        </div>
                      )}

                      {aiHeadlineSuggestions.length > 0 && (
                        <div className="space-y-1 pt-1 border-t border-white/10 animate-in fade-in">
                          <div className="text-[10px] text-slate-400 font-bold">हेडलाइन चुनने के लिए क्लिक करें:</div>
                          {aiHeadlineSuggestions.map((s, idx) => (
                            <div
                              key={idx}
                              onClick={() => {
                                setTitle(s.headline);
                                setAiHeadlineSuggestions([]);
                                setAiFeedback('✓ हेडलाइन लागू कर दी गई!');
                                setTimeout(() => setAiFeedback(null), 2500);
                              }}
                              className="p-2 rounded-xl bg-black/40 hover:bg-red-600/20 border border-slate-700 hover:border-red-500/50 text-xs font-bold text-slate-200 hover:text-white cursor-pointer transition flex items-center justify-between"
                            >
                              <span>{s.headline}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-600/30 text-red-300 font-mono">
                                चुनें ↵
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Headline Input with Inline Integrated Mic */}
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold text-xs">
                    समाचार शीर्षक (Headline) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="मुख्य शीर्षक हिंदी में लिखें (जैसे: कवर्धा में नए रिंग रोड परियोजना को मंजूरी...)"
                      required
                      className={`w-full rounded-xl py-2.5 pl-3 pr-10 text-xs font-semibold outline-none transition ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-red-500 placeholder:text-slate-500' : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-red-600 focus:bg-white placeholder:text-slate-400'
                      }`}
                    />
                    {isVoiceSupported && (
                      <button
                        type="button"
                        onClick={toggleVoiceHeadline}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center transition active:scale-90 ${
                          isListeningHeadline
                            ? 'bg-red-600 text-white animate-pulse shadow-md shadow-red-600/40 ring-2 ring-red-400'
                            : 'text-slate-400 hover:text-red-400 hover:bg-slate-700/50'
                        }`}
                        title={isListeningHeadline ? 'सुन रहा हूँ... बोलना समाप्त होने पर क्लिक करें' : 'बोलकर शीर्षक लिखें (Voice Typing)'}
                      >
                        <Mic size={14} className={isListeningHeadline ? 'animate-bounce text-white' : ''} />
                      </button>
                    )}
                  </div>
                  {isListeningHeadline && (
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      <span className="font-bold">🎙️ शीर्षक बोलिए:</span>
                      <span className="text-slate-200 italic truncate max-w-sm">{headlineInterim || 'बोलना शुरू करें...'}</span>
                    </div>
                  )}
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
                    className={`w-full rounded-xl p-2.5 text-xs font-medium outline-none transition ${
    isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-red-500' : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-red-600 focus:bg-white'
  }`}
                  />
                </div>

                {/* Excerpt */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={`block font-semibold text-xs ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                      संक्षिप्त सारांश (Excerpt) *
                    </label>
                    <span className="text-[10px] text-slate-400">
                      अक्षर: {excerpt.length}
                    </span>
                  </div>
                  <div className="relative">
                    <textarea
                      rows={2}
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      placeholder="2-3 पंक्तियों में खबर का मुख्य बिंदु..."
                      required
                      className={`w-full rounded-xl p-2.5 pr-32 text-xs outline-none transition leading-relaxed ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-red-500 placeholder:text-slate-500' : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-red-600 focus:bg-white placeholder:text-slate-400'
                      }`}
                    ></textarea>
                    {isVoiceSupported && (
                      <button
                        type="button"
                        onClick={toggleVoiceExcerpt}
                        className={`absolute right-2 bottom-2 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition active:scale-95 shadow-sm ${
                          isListeningExcerpt
                            ? 'bg-red-600 text-white animate-pulse shadow-md shadow-red-600/40 ring-2 ring-red-400 ring-offset-1 ring-offset-slate-900'
                            : isDark ? 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-700' : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
                        }`}
                        title="बोलकर संक्षिप्त सारांश लिखें (Voice Typing)"
                      >
                        <Mic size={12} className={isListeningExcerpt ? 'animate-bounce text-white' : 'text-red-400'} />
                        <span>{isListeningExcerpt ? 'बोलना बंद करें ⏹️' : '🎙️ बोलकर सारांश'}</span>
                      </button>
                    )}
                  </div>
                  {isListeningExcerpt && (
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      <span className="font-bold">🎙️ सारांश बोलिए:</span>
                      <span className="text-slate-200 italic truncate max-w-sm">{excerptInterim || 'बोलना शुरू करें...'}</span>
                    </div>
                  )}
                </div>

                {/* Full Article Content */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={`block font-semibold text-xs ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                      विस्तृत समाचार सामग्री (Full Article Text)
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      शब्द: {content.trim() ? content.trim().split(/\s+/).length : 0} • अक्षर: {content.length}
                    </span>
                  </div>
                  <div className="relative">
                    <textarea
                      rows={6}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="पूरी घटना, गवाहों के बयान, सरकारी आदेश, पृष्ठभूमि और तथ्य विस्तार से लिखें..."
                      className={`w-full rounded-xl p-2.5 pb-9 text-xs leading-relaxed outline-none transition ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-red-500 placeholder:text-slate-500' : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-red-600 focus:bg-white placeholder:text-slate-400'
                      }`}
                    />
                    {isVoiceSupported && (
                      <button
                        type="button"
                        onClick={toggleVoiceContent}
                        className={`absolute right-2.5 bottom-2.5 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-md ${
                          isListeningContent
                            ? 'bg-red-600 text-white animate-pulse shadow-md shadow-red-600/40 ring-2 ring-red-400 ring-offset-1 ring-offset-slate-900'
                            : isDark ? 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-700' : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200 shadow-sm'
                        }`}
                        title="बोलकर पूरी खबर लिखें (Voice Typing)"
                      >
                        <Mic size={12} className={isListeningContent ? 'animate-bounce text-white' : 'text-red-400'} />
                        <span>{isListeningContent ? 'बोलना बंद करें ⏹️' : '🎙️ बोलकर लिखें'}</span>
                      </button>
                    )}
                  </div>
                  {isListeningContent && (
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1.5 rounded-lg">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      <span className="font-bold">🎙️ माइक्रोफ़ोन सक्रिय:</span>
                      <span className="text-slate-200 italic truncate max-w-md">{contentInterim || 'बोलिए, समाचार टाइप हो रहा है...'}</span>
                    </div>
                  )}
                </div>

                {/* Photo Presets & Local File Upload */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={`block font-semibold flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                      <Camera size={13} className="text-emerald-500" /> समाचार फोटो (Upload or Preset)
                    </label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm transition active:scale-95"
                    >
                      <Upload size={12} />
                      <span>गैलरी / कैमरा से चुनें</span>
                    </button>
                    <input 
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageFileSelect}
                      className="hidden"
                    />
                  </div>

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
                    className={`w-full rounded-xl p-2 text-xs font-mono outline-none transition ${
    isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-red-500' : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-red-600 focus:bg-white'
  }`}
                  />
                </div>

                {/* Compact Publishing Options Row (Toggle Chips) */}
                <div className="pt-1">
                  <label className="block text-[11px] font-bold text-slate-400 mb-1.5">प्रकाशन विकल्प (टैप करके चुनें):</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setIsBreaking(prev => !prev)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 ${
                        isBreaking
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                          : isDark ? 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200' : 'bg-slate-100 text-slate-600 border border-slate-200 hover:text-slate-900'
                      }`}
                    >
                      <Radio size={13} className={isBreaking ? 'text-white' : 'text-slate-400'} />
                      <span>⚡ ब्रेकिंग टिकर</span>
                      {isBreaking && <span className="text-[10px] ml-0.5 font-bold">✓</span>}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsFeatured(prev => !prev)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 ${
                        isFeatured
                          ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                          : isDark ? 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200' : 'bg-slate-100 text-slate-600 border border-slate-200 hover:text-slate-900'
                      }`}
                    >
                      <Flame size={13} className={isFeatured ? 'text-white' : 'text-slate-400'} />
                      <span>🔥 मुख्य खबर (Hero)</span>
                      {isFeatured && <span className="text-[10px] ml-0.5 font-bold">✓</span>}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSendPushAlert(prev => !prev)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 ${
                        sendPushAlert
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : isDark ? 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200' : 'bg-slate-100 text-slate-600 border border-slate-200 hover:text-slate-900'
                      }`}
                    >
                      <Bell size={13} className={sendPushAlert ? 'text-white' : 'text-slate-400'} />
                      <span>🔔 पुश अलर्ट सायरन</span>
                      {sendPushAlert && <span className="text-[10px] ml-0.5 font-bold">✓</span>}
                    </button>
                  </div>
                </div>

                {/* Submit Action with Edit Mode Handling */}
                <div className={`pt-3 border-t flex flex-col sm:flex-row gap-2.5 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  {editingArticleId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className={`sm:w-1/3 py-3 rounded-2xl font-bold text-xs border transition active:scale-98 ${
                        isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      ✕ संशोधन रद्द करें
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 font-bold text-sm py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition active:scale-98 disabled:opacity-50 text-white ${
                      editingArticleId 
                        ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30' 
                        : 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
                    }`}
                  >
                    {editingArticleId ? (
                      <>
                        <Save size={16} />
                        <span>{isSubmitting ? 'अपडेट हो रहा है...' : '💾 संशोधन सुरक्षित करें (Update Live)'}</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>{isSubmitting ? 'प्रकाशित कर रहे हैं...' : 'सीधे लाइव पोर्टल पर प्रकाशित करें'}</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>

            {/* Preview Column (1 Col) */}
            <div className={`space-y-4 ${tab1MobileView === 'form' ? 'hidden lg:block' : 'block'}`}>
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
        </div>
      )}

        {/* TAB 2: MANAGE PUBLISHED ARTICLES */}
        {activeTab === 'articles' && (() => {
          const filteredManagedArticles = articles.filter(art => {
            const matchesSearch = !articleSearchQuery.trim() || 
              art.title?.toLowerCase().includes(articleSearchQuery.toLowerCase()) || 
              art.author?.toLowerCase().includes(articleSearchQuery.toLowerCase());
            const matchesDistrict = articleDistrictFilter === 'सभी' || (art.district && art.district.includes(articleDistrictFilter));
            return matchesSearch && matchesDistrict;
          });

          return (
            <div className={`p-5 rounded-3xl border ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
                <div>
                  <h2 className={`text-base font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <ShieldCheck size={18} className="text-emerald-500" />
                    <span>पोर्टल पर प्रकाशित कुल खबरें ({articles.length})</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">सभी 88 जिलों की प्रकाशित खबरों की खोज, समीक्षा व नियंत्रण</p>
                </div>
                <button
                  onClick={() => setActiveTab('create')}
                  className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 w-fit shadow"
                >
                  <Plus size={14} />
                  <span>+ नई खबर जोड़ें</span>
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
                      className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded flex items-center justify-center transition ${
                        isListeningArticleSearch ? 'text-red-500 animate-pulse' : 'text-slate-400 hover:text-white'
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
                {filteredManagedArticles.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-white/10 rounded-2xl">
                    कोई खबर नहीं मिली। कृपया अलग कीवर्ड या जिला चुनें।
                  </div>
                ) : filteredManagedArticles.map((art) => (
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
                          <span className="text-red-400">{art.category}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-300">📍 {art.district}</span>
                          {art.isBreaking && (
                            <span className="bg-red-600 text-white px-1 rounded text-[9px]">ब्रेकिंग</span>
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
                      <button
                        onClick={() => handleStartEdit(art)}
                        className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 text-xs font-bold ${
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
                        className="p-1.5 rounded-xl text-emerald-400 hover:bg-emerald-950/60 border border-emerald-800/40 hover:border-emerald-600 transition"
                        title="1-क्लिक WhatsApp बुलेटिन"
                      >
                        <MessageCircle size={14} />
                      </button>

                      <button
                        onClick={() => setCardArticle(art)}
                        className="p-1.5 rounded-xl text-rose-400 hover:bg-rose-950/60 border border-rose-800/40 hover:border-rose-600 transition"
                        title="सोशल मीडिया फोटो कार्ड बनाएं"
                      >
                        <ImageIcon size={14} />
                      </button>

                      <button
                        onClick={() => handleDeleteArticleConfirmed(art._id, art.title)}
                        className="p-1.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-900/40 transition"
                        title="खबर हटाएं (Delete)"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* TAB 3: BREAKING NEWS MANAGER */}
        {activeTab === 'breaking' && (
          <div className="space-y-6">
            
            {/* Quick Add Breaking News Flash */}
            <div className={`p-5 rounded-3xl border ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <h2 className={`text-base font-black flex items-center gap-2 mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Radio size={16} className="text-red-500 animate-pulse" />
                <span>तुरंत ब्रेकिंग फ्लैश जोड़ें (Live Ticker)</span>
              </h2>

              <form onSubmit={handleAddQuickBreaking} className="space-y-2 text-xs">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={breakingHeadline}
                      onChange={(e) => setBreakingHeadline(e.target.value)}
                      placeholder="जैसे: कवर्धा में भारी बारिश के बाद प्रशासन ने कलेक्टोरेट में कंट्रोल रूम बनाया..."
                      required
                      className={`w-full rounded-xl pl-3 pr-9 py-2.5 text-xs font-semibold outline-none transition ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-red-500 placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-red-600 focus:bg-white placeholder:text-slate-400'
                      }`}
                    />
                    {isVoiceSupported && (
                      <button
                        type="button"
                        onClick={toggleVoiceBreaking}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center transition active:scale-90 ${
                          isListeningBreaking
                            ? 'bg-red-600 text-white animate-pulse shadow-md shadow-red-600/40 ring-2 ring-red-400'
                            : 'text-slate-400 hover:text-red-400 hover:bg-slate-700/50'
                        }`}
                        title={isListeningBreaking ? 'सुन रहा हूँ... बोलिए' : 'बोलकर ब्रेकिंग न्यूज़ लिखें'}
                      >
                        <Mic size={14} className={isListeningBreaking ? 'animate-bounce text-white' : ''} />
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow shrink-0"
                  >
                    <Plus size={14} />
                    <span>टिकर में जोड़ें</span>
                  </button>
                </div>
                {isListeningBreaking && (
                  <div className="flex items-center gap-1.5 text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span className="font-bold">🎙️ ब्रेकिंग बोलिए:</span>
                    <span className="text-slate-200 italic truncate">{breakingInterim || 'बोलना शुरू करें...'}</span>
                  </div>
                )}
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
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
  }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      <span className="bg-red-950 text-red-300 font-bold px-1.5 py-0.5 rounded text-[10px]">
                        {b.district}
                      </span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{b.title}</span>
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

                  {/* YouTube Data API v3 Status (Server Environment Variable - 100% Secure) */}
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/10">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">Google YouTube Data API v3</span>
                          {hasApiKey ? (
                            <span className="text-[10px] bg-emerald-950 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-800 flex items-center gap-1">
                              <Check size={10} className="text-emerald-400" /> सर्वर पर सक्रिय (Server ENV Secured)
                            </span>
                          ) : (
                            <span className="text-[10px] bg-amber-950 text-amber-300 font-medium px-2 py-0.5 rounded-full border border-amber-800 flex items-center gap-1">
                              Fallback RSS मोड
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {hasApiKey 
                            ? '🔒 आपकी API Key सर्वर एनवायरनमेंट में सुरक्षित है। यह ब्राउज़र या नेटवर्क टैब में कभी दिखाई नहीं देती।'
                            : 'ℹ️ Render Environment में YOUTUBE_API_KEY सेट करें। ब्राउज़र में कोई भी API Key स्टोर या ट्रांसमिट नहीं की जाती।'}
                        </p>
                      </div>
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

            {/* 0.1 OFFICIAL WHATSAPP GROUP & CHANNEL MANAGEMENT */}
            <div className={`p-5 sm:p-6 rounded-3xl border transition-all ${
              isDark 
                ? 'bg-gradient-to-br from-emerald-950/40 via-[#0a1411] to-[#07110e] border-emerald-900/40 shadow-xl' 
                : 'bg-emerald-50/70 border-emerald-200 shadow-md'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 shrink-0">
                    <WhatsAppIcon size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black text-white">
                        व्हाट्सएप ग्रुप व चैनल लिंक प्रबंधन (Official WhatsApp Group)
                      </h2>
                      <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        लाइव लिंक
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      यहाँ अपने व्हाट्सएप ग्रुप (Invite Link) या चैनल का लिंक डालें। यह तुरंत पोर्टल के हेडर, साइडबार व फुटर में अपडेट हो जाएगा।
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={whatsappInput}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition active:scale-95"
                  >
                    <span>टेस्ट लिंक</span>
                    <ExternalLink size={13} />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      if (!whatsappInput.trim()) return;
                      if (onSaveWhatsAppLink) onSaveWhatsAppLink(whatsappInput.trim());
                      localStorage.setItem('anp_whatsapp_link', whatsappInput.trim());
                      setWhatsappFeedback('✅ व्हाट्सएप ग्रुप लिंक सफलतापूर्वक सहेजा गया!');
                      setTimeout(() => setWhatsappFeedback(null), 3500);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-900/40 transition active:scale-95 cursor-pointer"
                  >
                    <Check size={14} />
                    <span>सहेजें (Save Link)</span>
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  व्हाट्सएप ग्रुप / चैनल इनवाइट लिंक (WhatsApp Group URL)
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input 
                    type="url"
                    value={whatsappInput}
                    onChange={(e) => setWhatsappInput(e.target.value)}
                    placeholder="https://chat.whatsapp.com/..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!whatsappInput.trim()) return;
                      if (onSaveWhatsAppLink) onSaveWhatsAppLink(whatsappInput.trim());
                      localStorage.setItem('anp_whatsapp_link', whatsappInput.trim());
                      setWhatsappFeedback('✅ व्हाट्सएप ग्रुप लिंक सफलतापूर्वक सहेजा गया!');
                      setTimeout(() => setWhatsappFeedback(null), 3500);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                  >
                    अपडेट करें
                  </button>
                </div>
                {whatsappFeedback && (
                  <p className="text-xs text-emerald-400 font-bold mt-2 animate-in fade-in">
                    {whatsappFeedback}
                  </p>
                )}
                <p className="text-[10px] text-slate-400 mt-2">
                  उदाहरण: <code className="text-emerald-400">https://chat.whatsapp.com/InviteCode</code> या <code className="text-emerald-400">https://whatsapp.com/channel/ChannelId</code>
                </p>
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-300">
                        वीडियो शीर्षक (Headline)
                      </label>
                      {isVoiceSupported && (
                        <button
                          type="button"
                          onClick={toggleVoiceYtTitle}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                            isListeningYtTitle ? 'bg-red-600 text-white animate-pulse' : 'text-slate-400 hover:text-red-400'
                          }`}
                        >
                          <Mic size={11} className={isListeningYtTitle ? 'animate-bounce text-white' : ''} />
                          <span>{isListeningYtTitle ? 'बोलना बंद करें ⏹️' : '🎙️ बोलकर लिखें'}</span>
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input 
                        type="text"
                        value={ytTitle}
                        onChange={(e) => setYtTitle(e.target.value)}
                        placeholder="उदा. कवर्धा में किसानों की बड़ी रैली..."
                        className="w-full bg-[#05070e] border border-white/15 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                        required
                      />
                    </div>
                    {isListeningYtTitle && (
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                        <span>🎙️ सुन रहा हूँ: {ytTitleInterim || 'बोलिए...'}</span>
                      </div>
                    )}
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-300">
                        कैप्शन (Caption)
                      </label>
                      {isVoiceSupported && (
                        <button
                          type="button"
                          onClick={toggleVoiceReelCaption}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                            isListeningReelCaption ? 'bg-pink-600 text-white animate-pulse' : 'text-slate-400 hover:text-pink-400'
                          }`}
                        >
                          <Mic size={11} className={isListeningReelCaption ? 'animate-bounce text-white' : ''} />
                          <span>{isListeningReelCaption ? 'बोलना बंद करें ⏹️' : '🎙️ बोलकर लिखें'}</span>
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input 
                        type="text"
                        value={reelCaption}
                        onChange={(e) => setReelCaption(e.target.value)}
                        placeholder="उदा. कवर्धा भोरमदेव मंदिर की भव्य आरती..."
                        className="w-full bg-[#05070e] border border-white/15 focus:border-pink-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                        required
                      />
                    </div>
                    {isListeningReelCaption && (
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping" />
                        <span>🎙️ सुन रहा हूँ: {reelCaptionInterim || 'बोलिए...'}</span>
                      </div>
                    )}
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

        {/* TAB 6: DAILY MANDI RATES DESK */}
        {activeTab === 'mandi' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div>
                <h3 className={`text-base sm:text-lg font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Wheat className="text-emerald-500" size={20} />
                  <span>दैनिक कृषि उपज मंडी भाव प्रबंधन (Live Mandi Desk)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  कवर्धा, रायपुर, राजनांदगांव, इंदौर आदि मंडियों के भाव सीधे यहाँ से अपडेट करें — पूरे पोर्टल पर तुरंत लाइव होगा।
                </p>
              </div>

              <button
                onClick={() => setShowAddCropModal(!showAddCropModal)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow active:scale-95 shrink-0"
              >
                <PlusCircle size={15} />
                <span>+ नई फसल का भाव जोड़ें</span>
              </button>
            </div>

            {showAddCropModal && (
              <div className={`p-5 rounded-2xl border ${
                isDark ? 'bg-slate-900 border-emerald-500/50' : 'bg-emerald-50/50 border-emerald-300'
              } animate-in fade-in duration-200`}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
                  <PlusCircle size={14} />
                  <span>नया मंडी भाव दर्ज करें</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">फसल का नाम *</label>
                    <input 
                      type="text" 
                      value={newCropName}
                      onChange={(e) => setNewCropName(e.target.value)}
                      placeholder="उदा. गुड़ (देसी/सुपर)"
                      className="w-full bg-[#05070e] border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">मंडी / जिला *</label>
                    <input 
                      type="text" 
                      value={newCropMandi}
                      onChange={(e) => setNewCropMandi(e.target.value)}
                      placeholder="उदा. कवर्धा"
                      className="w-full bg-[#05070e] border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">राज्य</label>
                    <select
                      value={newCropState}
                      onChange={(e) => setNewCropState(e.target.value)}
                      className="w-full bg-[#05070e] border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                    >
                      <option value="CG">छत्तीसगढ़ (CG)</option>
                      <option value="MP">मध्य प्रदेश (MP)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">भाव (₹ में) *</label>
                    <input 
                      type="number" 
                      value={newCropRate}
                      onChange={(e) => setNewCropRate(Number(e.target.value))}
                      placeholder="3500"
                      className="w-full bg-[#05070e] border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">इकाई (Unit)</label>
                    <input 
                      type="text" 
                      value={newCropUnit}
                      onChange={(e) => setNewCropUnit(e.target.value)}
                      placeholder="₹/क्विंटल"
                      className="w-full bg-[#05070e] border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">बाज़ार का रुख (Trend) व अंतर (Diff)</label>
                    <div className="flex gap-2">
                      <select
                        value={newCropChange}
                        onChange={(e) => setNewCropChange(e.target.value as 'up' | 'down' | 'steady')}
                        className="bg-[#05070e] border border-white/15 rounded-xl px-2 py-2 text-xs text-white outline-none"
                      >
                        <option value="up">🔼 तेजी</option>
                        <option value="down">🔽 मंदी</option>
                        <option value="steady">➖ स्थिर</option>
                      </select>
                      <input 
                        type="number"
                        value={newCropDiff}
                        onChange={(e) => setNewCropDiff(Number(e.target.value))}
                        placeholder="± अंतर"
                        className="w-full bg-[#05070e] border border-white/15 rounded-xl px-2 py-2 text-xs text-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-white/10">
                  <button
                    onClick={() => setShowAddCropModal(false)}
                    className="px-3.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
                  >
                    रद्द करें
                  </button>
                  <button
                    onClick={() => {
                      if (!newCropName.trim() || !newCropRate) return;
                      if (onAddMandiRate) {
                        onAddMandiRate({
                          crop: newCropName.trim(),
                          mandi: newCropMandi.trim() || 'कवर्धा',
                          state: newCropState,
                          rate: newCropRate,
                          unit: newCropUnit.trim() || '₹/क्विंटल',
                          change: newCropChange,
                          diff: newCropDiff
                        });
                      }
                      setNewCropName('');
                      setShowAddCropModal(false);
                    }}
                    disabled={!newCropName.trim() || !newCropRate}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow active:scale-95"
                  >
                    सहेजें (Save Rate)
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {mandiRates.map((item) => {
                const isEditing = editingMandiId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isEditing 
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-950/20' 
                        : isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                            <Edit3 size={13} /> {item.crop}
                          </span>
                          <span className="text-[10px] text-slate-400">{item.mandi} ({item.state})</span>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">नया भाव (₹)</label>
                          <input 
                            type="number"
                            value={editRateVal}
                            onChange={(e) => setEditRateVal(Number(e.target.value))}
                            className="w-full bg-[#05070e] border border-emerald-500/50 rounded-xl px-2.5 py-1.5 text-sm font-bold text-white outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">रुख (Trend)</label>
                            <select
                              value={editChangeVal}
                              onChange={(e) => setEditChangeVal(e.target.value as 'up' | 'down' | 'steady')}
                              className="w-full bg-[#05070e] border border-white/15 rounded-xl px-2 py-1.5 text-xs text-white outline-none"
                            >
                              <option value="up">🔼 तेजी</option>
                              <option value="down">🔽 मंदी</option>
                              <option value="steady">➖ स्थिर</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">अंतर (± Diff)</label>
                            <input 
                              type="number"
                              value={editDiffVal}
                              onChange={(e) => setEditDiffVal(Number(e.target.value))}
                              className="w-full bg-[#05070e] border border-white/15 rounded-xl px-2 py-1.5 text-xs text-white outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                          <button
                            onClick={() => setEditingMandiId(null)}
                            className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                          >
                            रद्द करें
                          </button>
                          <button
                            onClick={() => {
                              if (onUpdateMandiRate) {
                                onUpdateMandiRate({
                                  ...item,
                                  rate: editRateVal,
                                  change: editChangeVal,
                                  diff: editDiffVal
                                });
                              }
                              setEditingMandiId(null);
                            }}
                            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow active:scale-95"
                          >
                            <Save size={12} />
                            <span>अपडेट करें</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                              📍 {item.mandi} ({item.state})
                            </span>
                            <h4 className={`text-sm font-black mt-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {item.crop}
                            </h4>
                          </div>

                          <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                            item.change === 'up' 
                              ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/50' 
                              : item.change === 'down' 
                              ? 'text-rose-400 bg-rose-950/60 border border-rose-800/50' 
                              : 'text-slate-400 bg-slate-800/60 border border-slate-700/50'
                          }`}>
                            {item.change === 'up' && (
                              <>
                                <TrendingUp size={11} />
                                <span>+{item.diff}</span>
                              </>
                            )}
                            {item.change === 'down' && (
                              <>
                                <TrendingDown size={11} />
                                <span>-{item.diff}</span>
                              </>
                            )}
                            {item.change === 'steady' && (
                              <>
                                <Minus size={11} />
                                <span>स्थिर</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-white/5">
                          <div className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            ₹{item.rate.toLocaleString('en-IN')}{' '}
                            <span className="text-[10px] text-slate-400 font-normal">{item.unit}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingMandiId(item.id);
                                setEditRateVal(item.rate);
                                setEditChangeVal(item.change);
                                setEditDiffVal(item.diff);
                              }}
                              className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 px-2.5 py-1 rounded-lg border border-emerald-800/50 transition active:scale-95 cursor-pointer"
                              title="भाव बदलें"
                            >
                              <Edit3 size={11} />
                              <span>भाव बदलें</span>
                            </button>

                            {onDeleteMandiRate && (
                              <button
                                onClick={() => { if (window.confirm(`क्या आप ${item.crop} का मंडी भाव हटाना चाहते हैं?`)) onDeleteMandiRate(item.id); }}
                                className="text-slate-500 hover:text-red-400 p-1 rounded transition"
                                title="हटाएं"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* FLOATING BACK TO TOP BUTTON FOR MOBILE & DESKTOP */}
        {showBackToTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-24 right-4 md:bottom-6 md:right-5 z-30 bg-red-600 hover:bg-red-500 text-white p-3 rounded-full shadow-2xl transition active:scale-90 flex items-center justify-center border border-white/20 animate-in fade-in"
            title="पेज के ऊपर जाएं"
          >
            <ArrowLeft size={16} className="rotate-90" />
          </button>
        )}

      </main>

      {/* 5. MOBILE FLOATING ISLAND DOCK (md:hidden) */}
      <nav 
        aria-label="Mobile Admin Navigation"
        className={`fixed bottom-3 inset-x-3 max-w-md mx-auto h-16 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-center justify-between px-2 z-40 md:hidden transition-all ${
          isDark
            ? 'bg-slate-900/95 border-slate-700/80 shadow-black/80 text-slate-200'
            : 'bg-white/95 border-slate-200 shadow-slate-400/50 text-slate-800'
        }`}
      >
        {/* SLOT 1: ARTICLES */}
        <button
          onClick={() => {
            setActiveTab('articles');
            setShowMobileMoreDrawer(false);
          }}
          className="flex-1 flex flex-col items-center justify-center py-1 transition relative group"
        >
          <div className="relative">
            <FileText size={18} className={activeTab === 'articles' ? 'text-red-500' : 'text-slate-400'} />
            <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full bg-red-600 text-[8px] font-bold text-white font-mono shadow-sm">
              {articles.length}
            </span>
          </div>
          <span className={`text-[10px] font-bold mt-0.5 transition ${
            activeTab === 'articles' ? 'text-red-500 font-black' : 'text-slate-400'
          }`}>
            खबरें
          </span>
        </button>

        {/* SLOT 2: YOUTUBE & REELS (MEDIA) */}
        <button
          onClick={() => {
            setActiveTab('media');
            setShowMobileMoreDrawer(false);
          }}
          className="flex-1 flex flex-col items-center justify-center py-1 transition relative group"
        >
          <div className="relative">
            <Tv size={18} className={activeTab === 'media' ? 'text-red-500' : 'text-slate-400'} />
            <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full bg-red-600 text-[8px] font-bold text-white font-mono shadow-sm">
              {videos.length + reels.length}
            </span>
          </div>
          <span className={`text-[10px] font-bold mt-0.5 transition ${
            activeTab === 'media' ? 'text-red-500 font-black' : 'text-slate-400'
          }`}>
            वीडियो
          </span>
        </button>

        {/* SLOT 3: RAISED CENTER ACTION BUTTON (+ नई खबर FAB) */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={() => {
              setActiveTab('create');
              setShowMobileMoreDrawer(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`w-13 h-13 rounded-full bg-gradient-to-tr from-red-600 via-red-500 to-rose-600 p-0.5 shadow-xl shadow-red-600/40 hover:scale-105 active:scale-95 transition-transform duration-200 flex items-center justify-center ${
              activeTab === 'create' ? 'ring-2 ring-red-400 ring-offset-2 ring-offset-slate-900' : ''
            }`}
            title="नई खबर लिखें"
          >
            <div className={`w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center text-white ${
              isDark ? 'border-slate-900 bg-red-600' : 'border-white bg-red-600'
            }`}>
              <Plus size={18} className="font-black leading-none" />
              <span className="text-[8px] font-black tracking-tight leading-none">नई खबर</span>
            </div>
          </button>
        </div>

        {/* SLOT 4: TICKER */}
        <button
          onClick={() => {
            setActiveTab('breaking');
            setShowMobileMoreDrawer(false);
          }}
          className="flex-1 flex flex-col items-center justify-center py-1 transition relative group"
        >
          <div className="relative">
            <Radio size={18} className={activeTab === 'breaking' ? 'text-red-500' : 'text-slate-400'} />
            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          </div>
          <span className={`text-[10px] font-bold mt-0.5 transition ${
            activeTab === 'breaking' ? 'text-red-500 font-black' : 'text-slate-400'
          }`}>
            टिकर
          </span>
        </button>

        {/* SLOT 5: MORE OPTIONS */}
        <button
          onClick={() => setShowMobileMoreDrawer(prev => !prev)}
          className="flex-1 flex flex-col items-center justify-center py-1 transition relative group"
        >
          <MoreHorizontal size={18} className={
            showMobileMoreDrawer || activeTab === 'reporters' || activeTab === 'mandi'
              ? 'text-amber-400 font-bold'
              : 'text-slate-400'
          } />
          <span className={`text-[10px] font-bold mt-0.5 transition ${
            showMobileMoreDrawer || activeTab === 'reporters' || activeTab === 'mandi'
              ? 'text-amber-400 font-black'
              : 'text-slate-400'
          }`}>
            अधिक
          </span>
        </button>
      </nav>

      {/* 6. SLIDE-UP BOTTOM SHEET FOR "⋯ अधिक" */}
      {showMobileMoreDrawer && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop Overlay */}
          <div 
            onClick={() => setShowMobileMoreDrawer(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in transition-opacity"
          />

          {/* Drawer Panel */}
          <div className={`relative z-10 w-full rounded-t-3xl border-t p-4 shadow-2xl animate-in slide-in-from-bottom duration-300 ${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Drag Handle */}
            <div className="w-10 h-1.5 bg-slate-500/40 rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="text-xs font-black tracking-wide flex items-center gap-2">
                <span>📂</span> अन्य प्रशासनिक डेस्क व विकल्प
              </div>
              <button 
                onClick={() => setShowMobileMoreDrawer(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-800/40 font-bold"
              >
                ✕ बंद करें
              </button>
            </div>

            {/* 2x2 Grid of Secondary Desks */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              
              <button
                onClick={() => {
                  setActiveTab('mandi');
                  setShowMobileMoreDrawer(false);
                }}
                className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                  activeTab === 'mandi'
                    ? 'border-emerald-600 bg-emerald-500/10 text-emerald-400'
                    : isDark ? 'border-slate-800 bg-slate-800/60 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-800'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-500 flex items-center justify-center shrink-0">
                  <Wheat size={16} />
                </div>
                <div>
                  <div className="font-bold text-[11px] leading-tight">दैनिक मंडी भाव</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">({mandiRates.length} फसलें)</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('reporters');
                  setShowMobileMoreDrawer(false);
                }}
                className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                  activeTab === 'reporters'
                    ? 'border-blue-600 bg-blue-500/10 text-blue-400'
                    : isDark ? 'border-slate-800 bg-slate-800/60 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-800'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-500 flex items-center justify-center shrink-0">
                  <Users size={16} />
                </div>
                <div>
                  <div className="font-bold text-[11px] leading-tight">ब्यूरो नेटवर्क</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">88 जिले (CG-MP)</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowMobileMoreDrawer(false);
                  onBackToPublic();
                }}
                className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                  isDark ? 'border-slate-800 bg-slate-800/60 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-800'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-500 flex items-center justify-center shrink-0">
                  <ArrowLeft size={16} />
                </div>
                <div>
                  <div className="font-bold text-[11px] leading-tight">पाठक पोर्टल</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">लाइव साइट देखें</div>
                </div>
              </button>

            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                setShowMobileMoreDrawer(false);
                handleLogout();
              }}
              className="w-full mt-3 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow"
            >
              <LogOut size={14} />
              <span>सुरक्षित लॉगआउट करें (सत्र समाप्त)</span>
            </button>
          </div>
        </div>
      )}



      
      {/* WHATSAPP BULLETIN MODAL */}
      {whatsAppArticle && (
        <WhatsAppBulletinModal
          article={whatsAppArticle}
          whatsappLink={whatsappInput}
          isDark={isDark}
          onClose={() => setWhatsAppArticle(null)}
        />
      )}

      {/* SOCIAL MEDIA NEWS CARD GENERATOR MODAL */}
      {cardArticle && (
        <NewsCardGeneratorModal
          article={cardArticle}
          isDark={isDark}
          onClose={() => setCardArticle(null)}
        />
      )}

    </div>
  );
};
