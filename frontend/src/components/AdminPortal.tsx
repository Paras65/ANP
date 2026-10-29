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
  Wand2,
  Phone,
  Printer,
  BadgeCheck,
  BadgeDollarSign,
  BarChart3,
  MousePointerClick,
  Building2,
  X,
  Sun,
  Moon
} from 'lucide-react';
import type { Article, DistrictItem, VideoBulletin, InstagramPost, MandiRate, Reporter, Advertisement, AdPlacement, MonetizationSettings } from '../types';
import { parseYouTubeUrl, extractYouTubeChannelId, syncYouTubeChannelVideos, parseReelMedia } from '../utils/mediaUtils';
import { WhatsAppIcon } from './SocialIcons';
import api, { setAuthToken } from '../api/client';
import { SOCIAL_LINKS } from '../data/mockData';
import { WhatsAppBulletinModal } from './WhatsAppBulletinModal';
import { NewsCardGeneratorModal } from './NewsCardGeneratorModal';
import { PaginationBar } from './common/PaginationBar';
import { generateHeadlinesAI, autoSummarizeAI, polishArticleAI, redactClientSecret, type AIHeadlineSuggestion } from '../utils/aiNewsAssistant';
import { sendBreakingPushNotification } from '../utils/pushNotification';
import { useVoiceTyping } from '../hooks/useVoiceTyping';

interface AdminPortalProps {
  articles: Article[];
  districts: DistrictItem[];
  selectedState: 'chhattisgarh' | 'madhya-pradesh';
  onPublishArticle: (article: Partial<Article>) => void | Promise<any>;
  onUpdateArticle?: (id: string, article: Partial<Article>) => void | Promise<any>;
  onDeleteArticle: (id: string) => void;
  onBackToPublic: () => void;
  isDark: boolean;
  toggleTheme?: () => void;
  videos?: VideoBulletin[];
  onAddVideo?: (video: VideoBulletin) => void;
  onDeleteVideo?: (id: string) => void;
  reels?: InstagramPost[];
  onAddReel?: (post: InstagramPost) => void;
  onEditReel?: (post: InstagramPost) => void;
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
  reporters?: Reporter[];
  onAddReporter?: (reporter: Partial<Reporter>) => void | Promise<void>;
  onUpdateReporter?: (id: string, reporter: Partial<Reporter>) => void | Promise<void>;
  onDeleteReporter?: (id: string) => void | Promise<void>;
  youtubeSubs?: string;
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
  toggleTheme,
  videos = [],
  onAddVideo,
  onDeleteVideo,
  reels = [],
  onAddReel,
  onEditReel,
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
  onDeleteMandiRate,
  reporters = [],
  onAddReporter,
  onUpdateReporter,
  onDeleteReporter,
  youtubeSubs
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'articles' | 'breaking' | 'reporters' | 'media' | 'mandi' | 'ads'>('create');
  
  // Ad & Monetization Management States
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [isLoadingAds, setIsLoadingAds] = useState(false);
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [adForm, setAdForm] = useState<{
    title: string;
    clientName: string;
    clientPhone: string;
    imageUrl: string;
    linkUrl: string;
    placement: AdPlacement;
    targetDistrict: string;
    expiryDate: string;
    priority: number;
    isActive: boolean;
  }>({
    title: '',
    clientName: '',
    clientPhone: '',
    imageUrl: '',
    linkUrl: '',
    placement: 'in_feed',
    targetDistrict: 'सभी 88 जिले',
    expiryDate: '',
    priority: 0,
    isActive: true
  });
  const [monetizationSettings, setMonetizationSettings] = useState<MonetizationSettings>({
    adsenseEnabled: false,
    adsensePublisherId: '',
    headerSlotId: '',
    inFeedSlotId: '',
    articleSlotId: '',
    whatsappSponsorLine: 'डिजिटल विज्ञापन व कवरेज हेतु संपर्क करें: 7000139694',
    monthlyRevenueGoal: 50000
  });
  const [isSavingMonetization, setIsSavingMonetization] = useState(false);
  const [adSuccessMsg, setAdSuccessMsg] = useState<string | null>(null);
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

  // Articles Search, Filter & Pagination State (Tab 2)
  const [articleSearchQuery, setArticleSearchQuery] = useState('');
  const [articleDistrictFilter, setArticleDistrictFilter] = useState('सभी');
  const [articleStatusFilter, setArticleStatusFilter] = useState<'all' | 'PUBLISHED' | 'REVIEW'>('all');
  const [adminArticlePage, setAdminArticlePage] = useState(1);

  // Reset pagination to page 1 on filter/search change
  useEffect(() => {
    setAdminArticlePage(1);
  }, [articleSearchQuery, articleDistrictFilter, articleStatusFilter]);

  // Reporters Management States (Tab 4)
  const [reporterSearch, setReporterSearch] = useState('');
  const [reporterDistrictFilter, setReporterDistrictFilter] = useState('सभी');
  const [adminReporterPage, setAdminReporterPage] = useState<number>(1);
  const REPORTERS_PER_PAGE = 12;

  useEffect(() => {
    setAdminReporterPage(1);
  }, [reporterSearch, reporterDistrictFilter]);
  const [showReporterModal, setShowReporterModal] = useState(false);
  const [editingReporter, setEditingReporter] = useState<Reporter | null>(null);
  const [idCardReporter, setIdCardReporter] = useState<Reporter | null>(null);

  // Form Inputs for Add/Edit Reporter
  const [repName, setRepName] = useState('');
  const [repNameHindi, setRepNameHindi] = useState('');
  const [repPhone, setRepPhone] = useState('');
  const [repBureau, setRepBureau] = useState('कवर्धा ब्यूरो प्रतिनिधि');
  const [repDistrict, setRepDistrict] = useState('कवर्धा');
  const [repRole, setRepRole] = useState<'REPORTER' | 'EDITOR'>('REPORTER');
  const [repCode, setRepCode] = useState('');
  const [repPhoto, setRepPhoto] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80');

  const handleOpenAddReporter = () => {
    setEditingReporter(null);
    setRepName('');
    setRepNameHindi('');
    setRepPhone('');
    setRepBureau('कवर्धा ब्यूरो प्रतिनिधि');
    setRepDistrict('कवर्धा');
    setRepRole('REPORTER');
    setRepCode(`ANP-CG-${Math.floor(100 + Math.random() * 900)}`);
    setRepPhoto('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80');
    setShowReporterModal(true);
  };

  const handleOpenEditReporter = (rep: Reporter) => {
    setEditingReporter(rep);
    setRepName(rep.name);
    setRepNameHindi(rep.nameHindi || rep.name);
    setRepPhone(rep.phone);
    setRepBureau(rep.bureau);
    setRepDistrict(rep.district || 'कवर्धा');
    setRepRole(rep.role === 'EDITOR' ? 'EDITOR' : 'REPORTER');
    setRepCode(rep.reporterIdCode || '');
    setRepPhoto(rep.photoUrl || '');
    setShowReporterModal(true);
  };

  const handleSaveReporter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repName.trim() || !repPhone.trim()) return;

    const payload: Partial<Reporter> = {
      name: repName.trim(),
      nameHindi: (repNameHindi || repName).trim(),
      phone: repPhone.trim(),
      bureau: repBureau.trim(),
      district: repDistrict.trim(),
      role: repRole,
      reporterIdCode: repCode.trim() || `ANP-CG-${Math.floor(100 + Math.random() * 900)}`,
      photoUrl: repPhoto.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      isActive: true
    };

    if (editingReporter && onUpdateReporter) {
      await onUpdateReporter(editingReporter._id, payload);
    } else if (onAddReporter) {
      await onAddReporter(payload);
    }
    setShowReporterModal(false);
  };

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

  // Voice Typing for Edit Reel Caption
  const [editReelCaptionInterim, setEditReelCaptionInterim] = useState('');
  const {
    isListening: isListeningEditReelCaption,
    toggleListening: toggleVoiceEditReelCaption
  } = useVoiceTyping({
    lang: 'hi-IN',
    onResult: (text) => {
      setEditReelCaption((prev) => (prev ? prev + ' ' + text : text));
    },
    onInterim: (text) => {
      setEditReelCaptionInterim(text);
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

  // Ad & Monetization Handlers
  const fetchAds = async () => {
    try {
      setIsLoadingAds(true);
      const res = await api.get('/ads?all=true');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setAds(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching ads:', err);
    } finally {
      setIsLoadingAds(false);
    }
  };

  const fetchMonetizationSettings = async () => {
    try {
      const res = await api.get('/settings/monetization');
      if (res.data?.success && res.data.data) {
        setMonetizationSettings(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching monetization settings:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAds();
      fetchMonetizationSettings();
    }
  }, [isAuthenticated]);

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adForm.title.trim() || !adForm.clientName.trim() || !adForm.imageUrl.trim() || !adForm.linkUrl.trim()) {
      alert('कृपया शीर्षक, क्लाइंट का नाम, बैनर इमेज URL और रीडायरेक्ट लिंक भरें।');
      return;
    }

    try {
      if (editingAdId) {
        const res = await api.put(`/ads/${editingAdId}`, adForm);
        if (res.data?.success) {
          setAdSuccessMsg('विज्ञापन अभियान सफलतापूर्वक अपडेट किया गया!');
          fetchAds();
          handleResetAdForm();
        }
      } else {
        const res = await api.post('/ads', adForm);
        if (res.data?.success) {
          setAdSuccessMsg('नया विज्ञापन अभियान लाइव दर्ज हो गया!');
          fetchAds();
          handleResetAdForm();
        }
      }
      setTimeout(() => setAdSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'विज्ञापन सहेजने में त्रुटि आई');
    }
  };

  const handleToggleAdStatus = async (ad: Advertisement) => {
    try {
      await api.put(`/ads/${ad._id}`, { isActive: !ad.isActive });
      fetchAds();
    } catch (err: any) {
      alert(err.response?.data?.error || 'स्थिति बदलने में त्रुटि आई');
    }
  };

  const handleDeleteAd = async (id: string, title: string) => {
    if (!window.confirm(`क्या आप सचमुच "${title}" विज्ञापन हटाना चाहते हैं?`)) return;
    try {
      await api.delete(`/ads/${id}`);
      fetchAds();
    } catch (err: any) {
      alert(err.response?.data?.error || 'विज्ञापन हटाने में त्रुटि आई');
    }
  };

  const handleEditAd = (ad: Advertisement) => {
    setEditingAdId(ad._id);
    setAdForm({
      title: ad.title,
      clientName: ad.clientName,
      clientPhone: ad.clientPhone || '',
      imageUrl: ad.imageUrl,
      linkUrl: ad.linkUrl,
      placement: ad.placement,
      targetDistrict: ad.targetDistrict || 'सभी 88 जिले',
      expiryDate: ad.expiryDate ? ad.expiryDate.split('T')[0] : '',
      priority: ad.priority || 0,
      isActive: ad.isActive
    });
    const formEl = document.getElementById('ad-campaign-form');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
  };

  const handleResetAdForm = () => {
    setEditingAdId(null);
    setAdForm({
      title: '',
      clientName: '',
      clientPhone: '',
      imageUrl: '',
      linkUrl: '',
      placement: 'in_feed',
      targetDistrict: 'सभी 88 जिले',
      expiryDate: '',
      priority: 0,
      isActive: true
    });
  };

  const handleSaveMonetization = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingMonetization(true);
      const res = await api.put('/settings/monetization', monetizationSettings);
      if (res.data?.success) {
        setAdSuccessMsg('Google AdSense एवं मोनेटाइजेशन सेटिंग्स सुरक्षित हो गईं!');
        setTimeout(() => setAdSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'सेटिंग्स सहेजने में विफल');
    } finally {
      setIsSavingMonetization(false);
    }
  };

  const handleSendClientReport = (ad: Advertisement) => {
    const slotLabel = ad.placement === 'header_top' ? 'टॉप हेडर बैनर' : ad.placement === 'article_bottom' ? 'खबर के नीचे' : 'समाचार फ़ीड बैनर';
    const reportText = `📢 *Ambition News • विज्ञापन प्रदर्शन रिपोर्ट*\n\nप्रिय *${ad.clientName}*,\nAmbition News Portal पर आपके विज्ञापन अभियान का ताज़ा प्रदर्शन विवरण:\n\n📌 *अभियान*: ${ad.title}\n📍 *स्थान*: ${slotLabel}\n🎯 *लक्षित क्षेत्र*: ${ad.targetDistrict}\n\n👁️ *कुल पाठक व्यूज़ (इम्प्रेशन्स)*: ${(ad.impressions || 0).toLocaleString('en-IN')}\n📲 *सीधे WhatsApp/क्लिक्स*: ${(ad.clicks || 0).toLocaleString('en-IN')}\n🟢 *स्थिति*: ${ad.isActive ? 'सक्रिय (Live)' : 'रोकी गई / समाप्त'}\n\nधन्यवाद!\n*Ambition News Portal — कवर्धा (कबीरधाम)*\n🌐 https://ambitionnews.init65.co.in`;
    const phone = ad.clientPhone ? ad.clientPhone.replace(/\D/g, '') : '';
    window.open(`https://api.whatsapp.com/send?phone=91${phone}&text=${encodeURIComponent(reportText)}`, '_blank');
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
  const [parsedReel, setParsedReel] = useState<ReturnType<typeof parseReelMedia>>(null);

  // Reels Pagination State
  const [adminReelsPage, setAdminReelsPage] = useState<number>(1);
  const REELS_PER_PAGE = 8;

  // Videos Pagination & Filter States
  const VIDEOS_PER_PAGE = 8;
  const [adminVideosPage, setAdminVideosPage] = useState<number>(1);
  const [adminVideoSearch, setAdminVideoSearch] = useState<string>('');
  const [adminVideoCategoryFilter, setAdminVideoCategoryFilter] = useState<string>('सभी');

  useEffect(() => {
    setAdminVideosPage(1);
  }, [adminVideoSearch, adminVideoCategoryFilter]);

  // Edit Reel States
  const [editingReel, setEditingReel] = useState<InstagramPost | null>(null);
  const [editReelCaption, setEditReelCaption] = useState('');
  const [editReelUrl, setEditReelUrl] = useState('');
  const [editReelDistrict, setEditReelDistrict] = useState('कवर्धा');
  const [editReelAudio, setEditReelAudio] = useState('Ambition News Original');
  const [editParsedReel, setEditParsedReel] = useState<ReturnType<typeof parseReelMedia>>(null);

  const handleStartEditReel = (reel: InstagramPost) => {
    setEditingReel(reel);
    setEditReelCaption(reel.caption || '');
    setEditReelUrl(reel.postUrl || (reel.youtubeId ? `https://youtube.com/shorts/${reel.youtubeId}` : reel.videoUrl || ''));
    setEditReelDistrict(reel.district || 'कवर्धा');
    setEditReelAudio(reel.audioTrack || 'Ambition News Original');
    const parsed = parseReelMedia(reel.postUrl || (reel.youtubeId ? `https://youtube.com/shorts/${reel.youtubeId}` : reel.videoUrl || ''));
    setEditParsedReel(parsed);
  };

  const handleSaveEditReel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReel || !editReelCaption.trim()) return;
    const media = editParsedReel || parseReelMedia(editReelUrl.trim());
    const updated: InstagramPost = {
      ...editingReel,
      caption: editReelCaption.trim(),
      district: editReelDistrict,
      audioTrack: editReelAudio.trim() || 'Ambition News Original',
      postUrl: editReelUrl.trim() || editingReel.postUrl,
      imageUrl: media?.previewThumb || editingReel.imageUrl,
      videoUrl: media?.videoUrl || editingReel.videoUrl,
      youtubeId: media?.type === 'youtube_short' ? media.rawId : (media?.type === 'direct_video' ? undefined : editingReel.youtubeId),
      embedUrl: media?.embedUrl || editingReel.embedUrl
    };
    if (onEditReel) {
      onEditReel(updated);
    }
    setEditingReel(null);
  };
  
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

  // Edge Case 1.1: Draft Auto-Preservation (Offline & Session Expiration Guard)
  const DRAFT_KEY = 'anp_editorial_article_draft';
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);

  // Check on load if an unsaved draft exists
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title?.trim() || parsed.content?.trim()) {
          setHasSavedDraft(true);
          setDraftSavedTime(parsed.savedAt || null);
        }
      }
    } catch {
      // LocalStorage error handled
    }
  }, []);

  // Auto-save draft every time editor makes changes (unless editing an existing published article)
  useEffect(() => {
    if (editingArticleId) return; // Do not overwrite new draft when modifying existing article
    if (!title.trim() && !content.trim() && !excerpt.trim()) return;

    const timer = setTimeout(() => {
      try {
        const now = new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' });
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          title,
          excerpt,
          content,
          district,
          category,
          author,
          coverImage,
          isBreaking,
          isFeatured,
          savedAt: now
        }));
        setHasSavedDraft(true);
        setDraftSavedTime(now);
      } catch {
        // LocalStorage quota error safe
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [title, excerpt, content, district, category, author, coverImage, isBreaking, isFeatured, editingArticleId]);

  const handleRestoreDraft = () => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.excerpt) setExcerpt(parsed.excerpt);
        if (parsed.content) setContent(parsed.content);
        if (parsed.district) setDistrict(parsed.district);
        if (parsed.category) setCategory(parsed.category);
        if (parsed.author) setAuthor(parsed.author);
        if (parsed.coverImage) setCoverImage(parsed.coverImage);
        if (parsed.isBreaking !== undefined) setIsBreaking(parsed.isBreaking);
        if (parsed.isFeatured !== undefined) setIsFeatured(parsed.isFeatured);
        setHasSavedDraft(false);
      }
    } catch {
      // Handled
    }
  };

  const handleDismissDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setHasSavedDraft(false);
  };

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

  // Local File Upload Handler with Storage & Base64 Bloat Protection (Edge Case 5.1)
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('कृपया 5 MB से छोटी फोटो चुनें');
      return;
    }
    // Inform editor about web URL standard to protect 512MB MongoDB Atlas storage
    alert('📌 डेटाबेस स्टोरेज सुरक्षा नोट:\nMongoDB Atlas में 512MB स्टोरेज सीमा बनाए रखने के लिए बेस64 छवियां डेटाबेस में ब्लॉक हैं।\n\nकृपया नीचे दिए गए विषय-वार त्वरित प्रीसेट्स में से एक चुनें या किसी ऑनलाइन तस्वीर का वैध वेब लिंक (URL) दर्ज करें।');
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

  // Edge-Case Hardened Article Submission (Anti-Duplicate & Safe Draft Preservation)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !excerpt.trim()) return;
    if (isSubmitting) return; // Prevent double-clicks

    setIsSubmitting(true);

    // Edge Case 5.1: If coverImage is a base64 string, sanitize it
    let safeCover = coverImage;
    if (safeCover && (safeCover.startsWith('data:image/') || safeCover.startsWith('data:application/'))) {
      safeCover = 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1000&auto=format&fit=crop&q=80';
      setCoverImage(safeCover);
    }

    const payload = {
      title: title.trim(),
      excerpt: excerpt.trim(),
      content: content.trim() ? content : `${excerpt}\n\n[ग्राउंड रिपोर्ट: ${district} से विशेष संवाददाता द्वारा प्रेषित]\nस्थानीय नागरिकों एवं प्रशासन के अनुसार स्थिति पर लगातार नजर रखी जा रही है। अधिक जानकारी की प्रतीक्षा है।`,
      district,
      state: selectedState,
      category,
      author,
      coverImage: safeCover,
      isBreaking,
      isFeatured,
      views: 1,
      status: 'PUBLISHED' as const,
      publishedAt: new Date().toISOString()
    };

    try {
      let result: any = null;
      if (editingArticleId && onUpdateArticle) {
        result = await onUpdateArticle(editingArticleId, payload);
        if (result && result.success === false) {
          setIsSubmitting(false);
          // Keep the draft safely on screen if conflict or error occurred!
          return;
        }
        setEditingArticleId(null);
      } else {
        result = await onPublishArticle(payload);
        if (result && result.success === false) {
          setIsSubmitting(false);
          // Keep the draft safely on screen so author never loses typed story!
          return;
        }
        if (sendPushAlert || isBreaking) {
          sendBreakingPushNotification(title, excerpt || content, district);
        }
      }

      // Success: Clear the auto-saved draft from storage and reset form
      localStorage.removeItem(DRAFT_KEY);
      setHasSavedDraft(false);
      setTitle('');
      setExcerpt('');
      setContent('');
      setIsSubmitting(false);
      setPublishedSuccess(true);
      setTimeout(() => setPublishedSuccess(false), 4000);
    } catch {
      setIsSubmitting(false);
      // Even if network fails completely, draft remains safely preserved in form & storage!
    }
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
      <div className={`min-h-screen font-devanagari flex flex-col items-center justify-center p-4 transition-colors relative ${
        isDark ? 'bg-[#060911] text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}>
        {/* Top Right Theme Toggle & Back Button */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {toggleTheme && (
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-2xl border transition active:scale-95 flex items-center gap-1.5 text-xs font-semibold shadow-sm ${
                isDark 
                  ? 'bg-slate-900/90 hover:bg-slate-800 text-amber-400 border-slate-700' 
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
              title={isDark ? 'लाइट मोड में बदलें' : 'डार्क मोड में बदलें'}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          )}
        </div>

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
                <span className="text-xs font-bold bg-amber-500/20 text-amber-500 border border-amber-500/40 px-2 py-0.5 rounded">
                  संपादकीय डेस्क
                </span>
              </div>
              <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                🔒 अधिकृत संपादकीय नियंत्रण कक्ष (Restricted Access)
              </p>
              <p className={`text-[11px] px-3 py-1 rounded-xl mt-2 inline-block border ${
                isDark 
                  ? 'text-amber-400/90 bg-amber-950/40 border-amber-800/40' 
                  : 'text-amber-800 bg-amber-50 border-amber-300'
              }`}>
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
              <label className={`text-xs font-bold block mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
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
                  className={`w-full rounded-2xl py-3.5 pl-4 pr-11 text-sm font-mono tracking-wider outline-none shadow-inner transition border ${
                    isDark 
                      ? 'bg-[#05070e] border-white/20 text-white focus:border-red-500' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-red-600 focus:bg-white'
                  }`}
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition ${
                    isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title={showPassword ? 'पासवर्ड छुपाएं' : 'पासवर्ड देखें'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {passwordError && (
                <div className={`mt-2 text-xs font-bold p-2.5 rounded-xl animate-in fade-in flex items-center gap-1.5 border ${
                  isDark 
                    ? 'text-rose-400 bg-rose-950/50 border-rose-800/60' 
                    : 'text-rose-700 bg-rose-50 border-rose-200'
                }`}>
                  <span>⚠️</span>
                  <span>{passwordError}</span>
                </div>
              )}
            </div>

            {/* Remember Me Toggle */}
            <div className={`flex items-center justify-between text-xs pt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
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
          <div className={`pt-2 border-t flex items-center justify-between text-xs ${
            isDark ? 'border-slate-800/60 text-slate-500' : 'border-slate-200 text-slate-500'
          }`}>
            <button
              onClick={onBackToPublic}
              className={`text-xs flex items-center gap-1.5 transition py-1 ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowLeft size={13} />
              <span>पाठक पोर्टल</span>
            </button>
            <span className="text-[10px] text-slate-500">
              सुरक्षित पोर्टल
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
            <span className={`hidden md:inline text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              कवर्धा (कबीरधाम) मुख्य डेस्क
            </span>
          </div>

          {/* Actions: Compact on mobile, detailed on desktop */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className={`hidden xl:flex items-center gap-1.5 border text-[11px] font-bold px-2 py-1 rounded-xl ${
              isDark ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-700'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>सत्र सक्रिय</span>
            </span>

            {toggleTheme && (
              <button
                onClick={toggleTheme}
                className={`flex items-center gap-1 text-xs font-semibold p-2 sm:px-2.5 sm:py-1.5 rounded-xl border transition active:scale-95 ${
                  isDark 
                    ? 'bg-slate-800/80 hover:bg-slate-800 text-amber-400 border-slate-700' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
                title={isDark ? 'लाइट मोड में बदलें' : 'डार्क मोड में बदलें'}
              >
                {isDark ? <Sun size={13} /> : <Moon size={13} />}
                <span className="hidden sm:inline">{isDark ? 'लाइट' : 'डार्क'}</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className={`flex items-center gap-1 text-xs font-semibold p-2 sm:px-2.5 sm:py-1.5 rounded-xl border transition active:scale-95 ${
                isDark 
                  ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-800/60' 
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
              }`}
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
                : isDark ? 'border-transparent text-slate-400 hover:text-white' : 'border-transparent text-slate-600 hover:text-slate-950'
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
                : isDark ? 'border-transparent text-slate-400 hover:text-white' : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <FileText size={14} />
            <span>📰 सभी खबरें ({articles.length})</span>
            {articles.filter(a => a.status === 'REVIEW').length > 0 && (
              <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full animate-pulse ml-0.5">
                {articles.filter(a => a.status === 'REVIEW').length} स्कूप
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('breaking')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'breaking'
                ? 'border-red-600 text-red-500'
                : isDark ? 'border-transparent text-slate-400 hover:text-white' : 'border-transparent text-slate-600 hover:text-slate-950'
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
                : isDark ? 'border-transparent text-slate-400 hover:text-white' : 'border-transparent text-slate-600 hover:text-slate-950'
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
                : isDark ? 'border-transparent text-slate-400 hover:text-white' : 'border-transparent text-slate-600 hover:text-slate-950'
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
                : isDark ? 'border-transparent text-slate-400 hover:text-white' : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <Wheat size={14} className="text-emerald-500" />
            <span>🌾 दैनिक मंडी भाव ({mandiRates.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ads')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'ads'
                ? 'border-amber-500 text-amber-400 font-bold'
                : isDark ? 'border-transparent text-slate-400 hover:text-white' : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <BadgeDollarSign size={14} className="text-amber-400" />
            <span>💰 विज्ञापन व मोनेटाइजेशन ({ads.length})</span>
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
            <div className={`flex lg:hidden p-1 rounded-2xl mb-4 border text-xs font-bold ${
              isDark ? 'bg-slate-800/40 border-white/10' : 'bg-slate-100 border-slate-300'
            }`}>
              <button
                type="button"
                onClick={() => setTab1MobileView('form')}
                className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  tab1MobileView === 'form'
                    ? 'bg-red-600 text-white shadow'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'
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
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'
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

              {/* Edge Case 1.1: Unsaved Draft Restore Banner */}
              {hasSavedDraft && !editingArticleId && (
                <div className="mb-4 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2 text-amber-500 font-semibold">
                    <span className="text-base">📝</span>
                    <span>आपका पिछला अप्रकाशित ड्राफ्ट सुरक्षित है{draftSavedTime ? ` (${draftSavedTime})` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRestoreDraft}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-sm transition active:scale-95"
                    >
                      पुनर्प्राप्त करें (Restore)
                    </button>
                    <button
                      type="button"
                      onClick={handleDismissDraft}
                      className={`px-2.5 py-1 rounded-xl transition ${
                        isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      हटाएं (Dismiss)
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                
                {/* District & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block mb-1 font-semibold flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
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
                    <label className={`block mb-1 font-semibold flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                      <Tag size={13} className="text-orange-500" /> श्रेणी (Category) *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={`w-full rounded-xl p-2.5 text-xs font-medium outline-none transition ${
                        isDark ? 'bg-slate-800 border border-slate-700 text-white focus:border-red-500' : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-red-600 focus:bg-white'
                      }`}
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
                      <span className={`text-[10px] font-normal hidden sm:inline ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>(हेडलाइन्स, सारांश, प्रूफरीडिंग)</span>
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
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95 border ${
                            isDark 
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                          }`}
                        >
                          <span>📝 1-क्लिक सारांश</span>
                        </button>

                        <button
                          type="button"
                          onClick={handlePolishArticle}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95 border ${
                            isDark 
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                          }`}
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
                        <div className={`space-y-1 pt-1 border-t animate-in fade-in ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                          <div className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>हेडलाइन चुनने के लिए क्लिक करें:</div>
                          {aiHeadlineSuggestions.map((s, idx) => (
                            <div
                              key={idx}
                              onClick={() => {
                                setTitle(s.headline);
                                setAiHeadlineSuggestions([]);
                                setAiFeedback('✓ हेडलाइन लागू कर दी गई!');
                                setTimeout(() => setAiFeedback(null), 2500);
                              }}
                              className={`p-2 rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-between border ${
                                isDark 
                                  ? 'bg-black/40 hover:bg-red-600/20 border-slate-700 hover:border-red-500/50 text-slate-200 hover:text-white' 
                                  : 'bg-slate-50 hover:bg-red-50 border-slate-200 hover:border-red-300 text-slate-800 hover:text-red-700 shadow-sm'
                              }`}
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
                  <label className={`block mb-1 font-semibold text-xs ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
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
                  <div className="flex items-center justify-between mb-1">
                    <label className={`font-semibold flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                      <User size={13} className="text-blue-500" /> रिपोर्टर / संवाददाता का नाम *
                    </label>
                    {reporters.length > 0 && (
                      <span className="text-[10px] text-red-400 font-medium">
                        या पंजीकृत ब्यूरो से चुनें
                      </span>
                    )}
                  </div>

                  {reporters.length > 0 && (
                    <select
                      onChange={(e) => {
                        const rep = reporters.find(r => r._id === e.target.value);
                        if (rep) {
                          setAuthor(`${rep.nameHindi || rep.name} (${rep.bureau})`);
                          if (rep.district && rep.district !== 'सभी') {
                            setDistrict(rep.district);
                          }
                        }
                      }}
                      defaultValue=""
                      className={`w-full rounded-xl p-2 text-xs font-medium outline-none transition mb-2 ${
                        isDark ? 'bg-slate-900 border border-slate-700 text-slate-300' : 'bg-slate-100 border border-slate-300 text-slate-700'
                      }`}
                    >
                      <option value="" disabled>-- 👥 पंजीकृत ब्यूरो संवाददाता चुनें --</option>
                      {reporters.filter(r => r.isActive).map(r => (
                        <option key={r._id} value={r._id}>
                          {r.nameHindi || r.name} — {r.bureau} ({r.district})
                        </option>
                      ))}
                    </select>
                  )}

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
                      { label: '🌾 कृषि/मंडी', url: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=1000&auto=format&fit=crop&q=80' },
                      { label: '🚔 पुलिस/सुरक्षा', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1000&auto=format&fit=crop&q=80' },
                      { label: '🚗 सड़क दुर्घटना', url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1000&auto=format&fit=crop&q=80' },
                      { label: '🌦️ मौसम/चिल्फी', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000&auto=format&fit=crop&q=80' },
                      { label: '🛕 भोरमदेव/धरोहर', url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1000&auto=format&fit=crop&q=80' },
                      { label: '🏗️ विकास/सड़क', url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1000&auto=format&fit=crop&q=80' },
                      { label: '🏛️ शासन/मंत्रालय', url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1000&auto=format&fit=crop&q=80' },
                      { label: '🏥 स्वास्थ्य/अस्पताल', url: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1000&auto=format&fit=crop&q=80' },
                      { label: '🎓 शिक्षा/युवा', url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1000&auto=format&fit=crop&q=80' },
                      { label: '⚖️ न्यायालय/प्रशासन', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1000&auto=format&fit=crop&q=80' },
                      { label: '🏆 खेलकूद', url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1000&auto=format&fit=crop&q=80' },
                      { label: '🔴 Ambition लोगो', url: '/logo.png' }
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCoverImage(p.url)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium transition ${
                          coverImage === p.url
                            ? 'bg-red-600 text-white border-red-500 shadow'
                            : isDark ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
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
                  <label className={`block text-[11px] font-bold mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>प्रकाशन विकल्प (टैप करके चुनें):</label>
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

                <div className={`rounded-2xl border overflow-hidden ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
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
                    <h3 className={`text-xs font-bold line-clamp-2 leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {title || 'समाचार की हेडलाइन यहां दिखेगी...'}
                    </h3>
                    <p className={`text-[10px] line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {excerpt || 'समाचार का संक्षिप्त विवरण यहां दिखेगा...'}
                    </p>
                    <div className={`pt-2 border-t text-[10px] flex justify-between ${
                      isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-600'
                    }`}>
                      <span>✍️ {author}</span>
                      <span>अब प्रकाशित</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Help Callout */}
              <div className={`p-4 rounded-3xl border text-xs space-y-2 ${
                isDark ? 'border-blue-900/40 bg-blue-950/20 text-slate-300' : 'border-blue-200 bg-blue-50/70 text-slate-700'
              }`}>
                <div className="font-bold text-blue-500 flex items-center gap-1.5">
                  <Sparkles size={14} />
                  <span>संपादकीय दिशानिर्देश:</span>
                </div>
                <ul className={`space-y-1 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
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
          const pendingScoops = articles.filter(art => art.status === 'REVIEW');
          const publishedCount = articles.filter(art => art.status !== 'REVIEW').length;

          const filteredManagedArticles = articles.filter(art => {
            const matchesSearch = !articleSearchQuery.trim() || 
              art.title?.toLowerCase().includes(articleSearchQuery.toLowerCase()) || 
              art.author?.toLowerCase().includes(articleSearchQuery.toLowerCase());
            const matchesDistrict = articleDistrictFilter === 'सभी' || (art.district && art.district.includes(articleDistrictFilter));
            const matchesStatus = articleStatusFilter === 'all'
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
                  className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 w-fit shadow"
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
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border ${
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
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border ${
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
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border ${
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
                {filteredManagedArticles.length === 0 ? (
                  <div className={`p-8 text-center text-xs border rounded-2xl ${
                    isDark ? 'text-slate-400 border-dashed border-white/10' : 'text-slate-600 border-dashed border-slate-300'
                  }`}>
                    कोई खबर नहीं मिली। कृपया अलग कीवर्ड या जिला चुनें।
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
                          {art.status === 'REVIEW' ? (
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
                      {art.status === 'REVIEW' && (
                        <button
                          onClick={() => {
                            if (onUpdateArticle) {
                              onUpdateArticle(art._id, { status: 'PUBLISHED' });
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition active:scale-95 shrink-0"
                          title="तुरंत स्वीकृत कर पोर्टल पर लाइव प्रकाशित करें"
                        >
                          <Check size={13} />
                          <span>स्वीकृत करें</span>
                        </button>
                      )}

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
                        className={`p-1.5 rounded-xl transition border ${
                          isDark ? 'text-emerald-400 hover:bg-emerald-950/60 border-emerald-800/40 hover:border-emerald-600' : 'text-emerald-700 hover:bg-emerald-50 border-emerald-300 hover:border-emerald-400'
                        }`}
                        title="1-क्लिक WhatsApp बुलेटिन"
                      >
                        <MessageCircle size={14} />
                      </button>

                      <button
                        onClick={() => setCardArticle(art)}
                        className={`p-1.5 rounded-xl transition border ${
                          isDark ? 'text-rose-400 hover:bg-rose-950/60 border-rose-800/40 hover:border-rose-600' : 'text-rose-700 hover:bg-rose-50 border-rose-300 hover:border-rose-400'
                        }`}
                        title="सोशल मीडिया फोटो कार्ड बनाएं"
                      >
                        <ImageIcon size={14} />
                      </button>

                      <button
                        onClick={() => handleDeleteArticleConfirmed(art._id, art.title)}
                        className={`p-1.5 rounded-xl transition border ${
                          isDark ? 'text-slate-500 hover:text-red-400 hover:bg-red-950/40 border-transparent hover:border-red-900/40' : 'text-slate-400 hover:text-red-600 hover:bg-red-50 border-transparent hover:border-red-200'
                        }`}
                        title="खबर हटाएं (Delete)"
                      >
                        <Trash2 size={14} />
                      </button>
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
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
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
                      <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                        isDark ? 'bg-red-950 text-red-300' : 'bg-red-100 text-red-700'
                      }`}>
                        {b.district}
                      </span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{b.title}</span>
                    </div>
                    <button
                      onClick={() => onDeleteArticle(b._id)}
                      className={`p-1 transition ${isDark ? 'text-red-400 hover:text-white' : 'text-red-500 hover:text-red-700'}`}
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
        {activeTab === 'reporters' && (() => {
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
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition active:scale-95 shrink-0 self-start sm:self-auto"
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
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition active:scale-95 ${
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
                            className={`p-1.5 rounded-lg transition ${
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
                            className={`p-1.5 rounded-lg transition ${
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
                            className={`p-1.5 rounded-lg transition ${
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
                      className="text-xs text-amber-500 hover:text-amber-600 font-bold underline self-start sm:self-auto"
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
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow transition active:scale-95"
                            title="तुरंत स्वीकृत कर पोर्टल पर लाइव प्रकाशित करें"
                          >
                            <Check size={12} />
                            <span>स्वीकृत करें</span>
                          </button>
                          <button
                            onClick={() => handleStartEdit(art)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition active:scale-95 border ${
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
        })()}

        {/* TAB 5: YOUTUBE & REELS HUB */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            
            {/* 0. DEDICATED LIVE YOUTUBE AUTO-SYNC ENGINE */}
            <div className={`p-5 sm:p-6 rounded-3xl border transition-all ${
              isDark 
                ? 'bg-gradient-to-br from-red-950/40 via-[#0a0e1c] to-[#070b16] border-red-900/40 shadow-xl' 
                : 'bg-white border-slate-200 shadow-md'
            }`}>
              <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b ${
                isDark ? 'border-white/10' : 'border-slate-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-red-600/30 shrink-0">
                    <Zap size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        ऑटोमैटिक यूट्यूब सिंक इंजन (Live Auto-Sync)
                      </h2>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                        isDark ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        सक्रिय
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 flex items-center gap-1 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                        🔴 लाइव सब्सक्राइबर्स: {youtubeSubs || '4.56K+'}
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
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
                    <label className={`text-[11px] font-bold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      यूट्यूब चैनल आईडी (YouTube Channel ID / Channel URL)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={channelIdInput}
                        onChange={(e) => setChannelIdInput(e.target.value)}
                        placeholder="उदा. UC_x5XG1OV2P6uZZ5FSM9Ttw या https://youtube.com/channel/UC..."
                        className={`flex-1 rounded-xl px-3.5 py-2 text-xs font-mono outline-none transition ${
                          isDark 
                            ? 'bg-[#05070e] border border-white/15 text-white focus:border-red-500' 
                            : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-red-600 focus:bg-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const clean = extractYouTubeChannelId(channelIdInput) || channelIdInput.trim();
                          if (clean) {
                            setSyncFeedback('⏳ चैनल आईडी सुरक्षित की जा रही है...');
                            localStorage.setItem('anp_yt_channel_id', clean);
                            if (onSaveChannelId) {
                              await onSaveChannelId(clean);
                            }
                            setSyncFeedback('✅ चैनल आईडी सफलतापूर्वक सुरक्षित कर दी गई!');
                            setTimeout(() => setSyncFeedback(null), 3500);
                          }
                        }}
                        className={`font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer ${
                          isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        सेव करें
                      </button>
                    </div>
                  </div>

                  {/* YouTube Connection Status */}
                  <div className={`pt-2 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                    <div className={`flex items-center justify-between p-3 rounded-2xl border ${
                      isDark ? 'bg-black/40 border-white/10' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>यूट्यूब वीडियो सिंक</span>
                          {hasApiKey ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                              <Check size={10} className="text-emerald-500" /> कनेक्टेड
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 flex items-center gap-1">
                              कॉन्फ़िगरेशन प्रतीक्षित
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {hasApiKey 
                            ? 'आधिकारिक यूट्यूब चैनल सफलतापूर्वक जुड़ा हुआ है।'
                            : 'यूट्यूब सेवा सक्रिय करने के लिए व्यवस्थापक से संपर्क करें।'}
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
                    <label className={`flex items-center gap-2 cursor-pointer text-xs select-none ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
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
                <div className={`p-3.5 rounded-2xl text-[11px] space-y-1.5 border ${
                  isDark ? 'bg-black/40 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <div className={`font-bold flex items-center gap-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <HelpCircle size={13} className="text-amber-500" />
                    <span>चैनल आईडी (UC...) कैसे प्राप्त करें?</span>
                  </div>
                  <ol className={`list-decimal list-inside space-y-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <li><strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>YouTube Studio</strong> (studio.youtube.com) खोलें।</li>
                    <li>बाईं ओर <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>Customization</strong> पर क्लिक करें।</li>
                    <li><strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>Basic Info</strong> में नीचे <strong className="text-red-500">Channel ID</strong> (UC से शुरू) कॉपी करके यहाँ पेस्ट करें।</li>
                  </ol>
                  <div className={`text-[10px] pt-1 border-t ${
                    isDark ? 'text-amber-300/80 border-white/5' : 'text-amber-800 border-slate-200'
                  }`}>
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
              <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b ${
                isDark ? 'border-white/10' : 'border-emerald-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 shrink-0">
                    <WhatsAppIcon size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        व्हाट्सएप ग्रुप व चैनल लिंक प्रबंधन (Official WhatsApp Group)
                      </h2>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                        isDark ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        लाइव लिंक
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      यहाँ अपने व्हाट्सएप ग्रुप (Invite Link) या चैनल का लिंक डालें। यह तुरंत पोर्टल के हेडर, साइडबार व फुटर में अपडेट हो जाएगा।
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={whatsappInput}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`font-bold text-xs px-3.5 py-2.5 rounded-xl border flex items-center gap-1.5 transition active:scale-95 ${
                      isDark 
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-emerald-200 shadow-sm'
                    }`}
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
                <label className={`text-[11px] font-bold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  व्हाट्सएप ग्रुप / चैनल इनवाइट लिंक (WhatsApp Group URL)
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input 
                    type="url"
                    value={whatsappInput}
                    onChange={(e) => setWhatsappInput(e.target.value)}
                    placeholder="https://chat.whatsapp.com/..."
                    className={`flex-1 rounded-xl px-3.5 py-2 text-xs font-mono outline-none focus:border-emerald-500 transition border ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-300 text-slate-900 focus:bg-white'
                    }`}
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
                  <p className="text-xs text-emerald-500 font-bold mt-2 animate-in fade-in">
                    {whatsappFeedback}
                  </p>
                )}
                <p className={`text-[10px] mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  उदाहरण: <code className="text-emerald-500 font-semibold">https://chat.whatsapp.com/InviteCode</code> या <code className="text-emerald-500 font-semibold">https://whatsapp.com/channel/ChannelId</code>
                </p>
              </div>
            </div>

            {/* 1. YOUTUBE BULLETINS SECTION */}
            <div className={`p-5 rounded-3xl border ${
              isDark ? 'bg-[#090d18]/95 border-red-950/40' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className={`flex items-center justify-between pb-3 mb-4 border-b ${
                isDark ? 'border-white/10' : 'border-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">
                    <Tv size={17} />
                  </div>
                  <div>
                    <h2 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>यूट्यूब वीडियो बुलेटिन प्रबंधन</h2>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>पोर्टल पर लाइव दिखने वाले यूट्यूब वीडियो जोड़ें व हटाएं</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                  isDark ? 'bg-red-950 text-red-300 border-red-800' : 'bg-red-50 text-red-700 border-red-200'
                }`}>
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
                className={`p-4 rounded-2xl border space-y-3 mb-6 ${
                  isDark ? 'bg-black/30 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus size={14} />
                  <span>नया यूट्यूब वीडियो लिंक जोड़ें</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={`text-[11px] font-semibold block mb-1 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
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
                      className={`w-full border focus:border-red-500 rounded-xl px-3 py-2 text-xs outline-none ${
                        isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900 focus:bg-white'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={`text-[11px] font-semibold ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}>
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
                        className={`w-full border focus:border-red-500 rounded-xl px-3 py-2 text-xs outline-none ${
                          isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900 focus:bg-white'
                        }`}
                        required
                      />
                    </div>
                    {isListeningYtTitle && (
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-red-500 bg-red-500/10 px-2 py-0.5 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                        <span>🎙️ सुन रहा हूँ: {ytTitleInterim || 'बोलिए...'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {parsedYt && (
                  <div className={`flex items-center gap-3 p-2.5 rounded-xl border ${
                    isDark ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  }`}>
                    <img src={parsedYt.thumbnailUrl} alt="Thumb" className="w-16 aspect-video rounded object-cover" />
                    <span className="text-xs font-bold">वैध वीडियो मिला! ID: {parsedYt.id}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={ytCategory}
                      onChange={(e) => setYtCategory(e.target.value)}
                      className={`border rounded-xl px-3 py-1.5 text-xs outline-none ${
                        isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
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
                      className={`w-20 border rounded-xl px-2.5 py-1.5 text-xs outline-none ${
                        isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
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

              {/* Existing Videos List with Search & Pagination */}
              {(() => {
                const filteredVideos = videos.filter(v => {
                  const matchesSearch = !adminVideoSearch.trim() || 
                    v.title?.toLowerCase().includes(adminVideoSearch.toLowerCase()) || 
                    v.youtubeId?.toLowerCase().includes(adminVideoSearch.toLowerCase());
                  const matchesCategory = adminVideoCategoryFilter === 'सभी' || v.category === adminVideoCategoryFilter;
                  return matchesSearch && matchesCategory;
                });

                const totalVideoPages = Math.ceil(filteredVideos.length / VIDEOS_PER_PAGE) || 1;
                const currentVideoPage = Math.min(adminVideosPage, totalVideoPages);
                const paginatedVideos = filteredVideos.slice(
                  (currentVideoPage - 1) * VIDEOS_PER_PAGE,
                  currentVideoPage * VIDEOS_PER_PAGE
                );

                const existingCategories = Array.from(new Set(videos.map(v => v.category).filter(Boolean)));

                return (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className={`text-xs font-bold uppercase tracking-wider ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        लाइव वीडियो सूची ({filteredVideos.length})
                      </div>

                      {/* Video Search & Category Filter */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={adminVideoSearch}
                            onChange={(e) => setAdminVideoSearch(e.target.value)}
                            placeholder="वीडियो खोजें..."
                            className={`pl-7 pr-3 py-1 rounded-xl text-xs outline-none border transition w-36 sm:w-48 ${
                              isDark 
                                ? 'bg-[#05070e] border-white/15 text-white placeholder:text-slate-500 focus:border-red-500' 
                                : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-red-500'
                            }`}
                          />
                        </div>

                        <select
                          value={adminVideoCategoryFilter}
                          onChange={(e) => setAdminVideoCategoryFilter(e.target.value)}
                          className={`px-2.5 py-1 rounded-xl text-xs outline-none border transition ${
                            isDark 
                              ? 'bg-[#05070e] border-white/15 text-slate-200' 
                              : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        >
                          <option value="सभी">सभी श्रेणियां</option>
                          {existingCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {filteredVideos.length === 0 ? (
                      <div className={`p-8 text-center text-xs border rounded-2xl ${
                        isDark ? 'text-slate-400 border-dashed border-white/10' : 'text-slate-600 border-dashed border-slate-300'
                      }`}>
                        कोई वीडियो नहीं मिला।
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {paginatedVideos.map((vid) => (
                          <div key={vid.id} className={`p-3 rounded-2xl border flex items-center gap-3 ${
                            isDark ? 'bg-black/40 border-white/10' : 'bg-slate-50 border-slate-200 shadow-sm'
                          }`}>
                            <div className="w-20 aspect-video rounded-lg overflow-hidden relative shrink-0 bg-slate-900">
                              <img 
                                src={vid.thumbnail} 
                                alt={vid.title} 
                                loading="lazy" 
                                decoding="async" 
                                className="w-full h-full object-cover" 
                              />
                              <span className="absolute bottom-1 right-1 bg-black/80 text-[9px] px-1 rounded text-white font-mono">
                                {vid.duration}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className={`text-xs font-bold truncate ${
                                isDark ? 'text-white' : 'text-slate-900'
                              }`}>{vid.title}</div>
                              <div className={`text-[10px] flex items-center gap-2 mt-0.5 ${
                                isDark ? 'text-slate-400' : 'text-slate-600'
                              }`}>
                                <span className="text-red-500 font-semibold">{vid.category}</span>
                                <span>•</span>
                                <span>{vid.timeAgo}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <a 
                                href={vid.youtubeUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className={`p-1.5 transition ${
                                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                                }`}
                                title="Open on YouTube"
                                aria-label="यूट्यूब पर वीडियो खोलें"
                              >
                                <ExternalLink size={14} />
                              </a>
                              {onDeleteVideo && (
                                <button
                                  onClick={() => onDeleteVideo(vid.id)}
                                  className="p-1.5 text-red-500 hover:text-red-600 transition"
                                  title="हटाएं"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Video Pagination Bar */}
                    <PaginationBar
                      currentPage={currentVideoPage}
                      totalPages={totalVideoPages}
                      totalItems={filteredVideos.length}
                      pageSize={VIDEOS_PER_PAGE}
                      onPageChange={setAdminVideosPage}
                      isDark={isDark}
                      itemLabel="वीडियो"
                      accentColor="red"
                    />
                  </div>
                );
              })()}
            </div>

            {/* 2. REELS & SHORTS SECTION */}
            <div className={`p-5 rounded-3xl border ${
              isDark ? 'bg-[#090d18]/95 border-pink-950/40' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className={`flex items-center justify-between pb-3 mb-4 border-b ${
                isDark ? 'border-white/10' : 'border-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-600 via-purple-600 to-indigo-600 flex items-center justify-center text-white">
                    <Film size={17} />
                  </div>
                  <div>
                    <h2 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>इंस्टाग्राम रील्स व यूट्यूब शॉर्ट्स प्रबंधन</h2>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>पोर्टल पर लाइव दिखने वाली रील्स जोड़ें व हटाएं</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                  isDark ? 'bg-pink-950 text-pink-300 border-pink-800' : 'bg-pink-50 text-pink-700 border-pink-200'
                }`}>
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
                      imageUrl: parsedReel.previewThumb || '/logo.png',
                      videoUrl: parsedReel.videoUrl,
                      youtubeId: parsedReel.type === 'youtube_short' ? parsedReel.rawId : undefined,
                      embedUrl: parsedReel.embedUrl,
                      postUrl: parsedReel.postUrl || reelUrl.trim(),
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
                className={`p-4 rounded-2xl border space-y-3 mb-6 ${
                  isDark ? 'bg-black/30 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus size={14} />
                  <span>नई इंस्टाग्राम रील, यूट्यूब शॉर्ट या डायरेक्ट MP4 वीडियो जोड़ें</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={`text-[11px] font-semibold block mb-1 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Instagram Reel, YouTube Short या Direct MP4 URL
                    </label>
                    <input 
                      type="text"
                      value={reelUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        setReelUrl(val);
                        setParsedReel(parseReelMedia(val));
                      }}
                      placeholder="उदा. https://www.instagram.com/reel/..., shorts/... या https://.../video.mp4"
                      className={`w-full border focus:border-pink-500 rounded-xl px-3 py-2 text-xs outline-none ${
                        isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900 focus:bg-white'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={`text-[11px] font-semibold ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}>
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
                        className={`w-full border focus:border-pink-500 rounded-xl px-3 py-2 text-xs outline-none ${
                          isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900 focus:bg-white'
                        }`}
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
                  <div className={`flex items-center gap-3 p-2.5 rounded-xl border ${
                    isDark ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  }`}>
                    <span className="text-xs font-bold">
                      मान्य {parsedReel.type === 'instagram' ? 'इंस्टाग्राम रील' : (parsedReel.type === 'youtube_short' ? 'यूट्यूब शॉर्ट' : 'डायरेक्ट MP4 वीडियो')} लिंक मिला!
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
                      className={`w-28 border rounded-xl px-2.5 py-1.5 text-xs outline-none ${
                        isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <input 
                      type="text"
                      value={reelAudio}
                      onChange={(e) => setReelAudio(e.target.value)}
                      placeholder="ऑडियो ट्रैक"
                      className={`w-40 border rounded-xl px-2.5 py-1.5 text-xs outline-none ${
                        isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
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
                <div className={`text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  लाइव रील्स सूची ({reels.length})
                </div>
                {(() => {
                  const totalReelsPages = Math.ceil(reels.length / REELS_PER_PAGE) || 1;
                  const currentReelPage = Math.min(adminReelsPage, totalReelsPages);
                  const paginatedReels = reels.slice(
                    (currentReelPage - 1) * REELS_PER_PAGE,
                    currentReelPage * REELS_PER_PAGE
                  );

                  return (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {paginatedReels.map((reel) => (
                          <div key={reel.id} className={`p-2.5 rounded-2xl border flex flex-col justify-between ${
                            isDark ? 'bg-black/40 border-white/10' : 'bg-slate-50 border-slate-200 shadow-sm'
                          }`}>
                            <div className="aspect-[9/14] rounded-xl overflow-hidden relative bg-slate-900 mb-2">
                              <img src={reel.imageUrl} alt={reel.caption} className="w-full h-full object-cover" />
                              <span className="absolute top-1 left-1 bg-black/80 text-[9px] px-1.5 py-0.5 rounded text-pink-400 font-bold">
                                {reel.district}
                              </span>
                            </div>
                            <p className={`text-[10px] font-medium line-clamp-2 leading-snug ${
                              isDark ? 'text-white' : 'text-slate-900'
                            }`}>{reel.caption}</p>
                            <div className={`flex items-center justify-between pt-2 mt-1 border-t ${
                              isDark ? 'border-white/10' : 'border-slate-200'
                            }`}>
                              <a 
                                href={reel.postUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-[10px] text-pink-500 hover:underline flex items-center gap-0.5"
                              >
                                <span>लिंक</span>
                                <ExternalLink size={10} />
                              </a>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditReel(reel)}
                                  className="text-amber-500 hover:text-amber-600 p-1 rounded hover:bg-amber-500/10 transition"
                                  title="संपादित करें (Edit Reel)"
                                >
                                  <Edit3 size={13} />
                                </button>
                                {onDeleteReel && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteReel(reel.id)}
                                    className="text-red-500 hover:text-red-600 p-1 rounded hover:bg-red-500/10 transition"
                                    title="हटाएं"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Reels Pagination Bar */}
                      <PaginationBar
                        currentPage={currentReelPage}
                        totalPages={totalReelsPages}
                        totalItems={reels.length}
                        pageSize={REELS_PER_PAGE}
                        onPageChange={setAdminReelsPage}
                        isDark={isDark}
                        itemLabel="रील्स"
                        accentColor="pink"
                      />
                    </>
                  );
                })()}
              </div>

              {/* Edit Reel Modal Popup */}
              {editingReel && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                  <div className={`w-full max-w-lg rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 border ${
                    isDark ? 'bg-[#0c101c] border-pink-500/40 text-white' : 'bg-white border-pink-400 text-slate-900'
                  }`}>
                    <div className={`flex items-center justify-between border-b pb-3 ${
                      isDark ? 'border-white/10' : 'border-slate-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-pink-600 flex items-center justify-center text-white">
                          <Edit3 size={15} />
                        </div>
                        <h3 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>रील विवरण संपादित करें (Edit Reel)</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingReel(null)}
                        className={`p-1 rounded-full ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleSaveEditReel} className="space-y-3">
                      <div>
                        <label className={`text-[11px] font-semibold block mb-1 ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          Reel URL (Instagram / YouTube Shorts / Direct MP4)
                        </label>
                        <input
                          type="text"
                          value={editReelUrl}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditReelUrl(val);
                            setEditParsedReel(parseReelMedia(val));
                          }}
                          className={`w-full border focus:border-pink-500 rounded-xl px-3 py-2 text-xs outline-none ${
                            isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                          }`}
                          required
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className={`text-[11px] font-semibold ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            कैप्शन (Caption)
                          </label>
                          {isVoiceSupported && (
                            <button
                              type="button"
                              onClick={toggleVoiceEditReelCaption}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                                isListeningEditReelCaption ? 'bg-pink-600 text-white animate-pulse' : 'text-slate-400 hover:text-pink-400'
                              }`}
                            >
                              <Mic size={11} className={isListeningEditReelCaption ? 'animate-bounce text-white' : ''} />
                              <span>{isListeningEditReelCaption ? 'बोलना बंद करें ⏹️' : '🎙️ बोलकर संपादित करें'}</span>
                            </button>
                          )}
                        </div>
                        <textarea
                          rows={3}
                          value={editReelCaption}
                          onChange={(e) => setEditReelCaption(e.target.value)}
                          className={`w-full border focus:border-pink-500 rounded-xl px-3 py-2 text-xs outline-none resize-none ${
                            isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                          }`}
                          required
                        />
                        {isListeningEditReelCaption && (
                          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-pink-500 bg-pink-500/10 px-2 py-0.5 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping" />
                            <span>🎙️ सुन रहा हूँ: {editReelCaptionInterim || 'बोलिए...'}</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={`text-[11px] font-semibold block mb-1 ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            जिला
                          </label>
                          <input
                            type="text"
                            value={editReelDistrict}
                            onChange={(e) => setEditReelDistrict(e.target.value)}
                            className={`w-full border rounded-xl px-2.5 py-1.5 text-xs outline-none ${
                              isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`text-[11px] font-semibold block mb-1 ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            ऑडियो ट्रैक
                          </label>
                          <input
                            type="text"
                            value={editReelAudio}
                            onChange={(e) => setEditReelAudio(e.target.value)}
                            className={`w-full border rounded-xl px-2.5 py-1.5 text-xs outline-none ${
                              isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                            }`}
                          />
                        </div>
                      </div>

                      <div className={`flex items-center justify-end gap-2 pt-3 border-t ${
                        isDark ? 'border-white/10' : 'border-slate-200'
                      }`}>
                        <button
                          type="button"
                          onClick={() => setEditingReel(null)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                            isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          रद्द करें
                        </button>
                        <button
                          type="submit"
                          disabled={!editReelCaption.trim()}
                          className="bg-gradient-to-r from-pink-600 to-indigo-600 hover:opacity-95 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow active:scale-95"
                        >
                          ✓ बदलाव सुरक्षित करें
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

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
                isDark ? 'bg-slate-900 border-emerald-500/50' : 'bg-white border-emerald-300 shadow-sm'
              } animate-in fade-in duration-200`}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-3 flex items-center gap-1.5">
                  <PlusCircle size={14} />
                  <span>नया मंडी भाव दर्ज करें</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={`text-[11px] block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>फसल का नाम *</label>
                    <input 
                      type="text" 
                      value={newCropName}
                      onChange={(e) => setNewCropName(e.target.value)}
                      placeholder="उदा. गुड़ (देसी/सुपर)"
                      className={`w-full border rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500 ${
                        isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900 focus:bg-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`text-[11px] block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>मंडी / जिला *</label>
                    <input 
                      type="text" 
                      value={newCropMandi}
                      onChange={(e) => setNewCropMandi(e.target.value)}
                      placeholder="उदा. कवर्धा"
                      className={`w-full border rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500 ${
                        isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900 focus:bg-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`text-[11px] block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>राज्य</label>
                    <select
                      value={newCropState}
                      onChange={(e) => setNewCropState(e.target.value)}
                      className={`w-full border rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500 ${
                        isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="CG">छत्तीसगढ़ (CG)</option>
                      <option value="MP">मध्य प्रदेश (MP)</option>
                    </select>
                  </div>

                  <div>
                    <label className={`text-[11px] block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>भाव (₹ में) *</label>
                    <input 
                      type="number" 
                      value={newCropRate}
                      onChange={(e) => setNewCropRate(Number(e.target.value))}
                      placeholder="3500"
                      className={`w-full border rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500 font-bold ${
                        isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900 focus:bg-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`text-[11px] block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>इकाई (Unit)</label>
                    <input 
                      type="text" 
                      value={newCropUnit}
                      onChange={(e) => setNewCropUnit(e.target.value)}
                      placeholder="₹/क्विंटल"
                      className={`w-full border rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500 ${
                        isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900 focus:bg-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`text-[11px] block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>बाज़ार का रुख (Trend) व अंतर (Diff)</label>
                    <div className="flex gap-2">
                      <select
                        value={newCropChange}
                        onChange={(e) => setNewCropChange(e.target.value as 'up' | 'down' | 'steady')}
                        className={`border rounded-xl px-2 py-2 text-xs outline-none ${
                          isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
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
                        className={`w-full border rounded-xl px-2 py-2 text-xs outline-none ${
                          isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900 focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div className={`flex justify-end gap-2 mt-4 pt-3 border-t ${
                  isDark ? 'border-white/10' : 'border-slate-200'
                }`}>
                  <button
                    onClick={() => setShowAddCropModal(false)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs transition ${
                      isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
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
                        <div className={`flex items-center justify-between border-b pb-2 ${
                          isDark ? 'border-white/10' : 'border-slate-200'
                        }`}>
                          <span className="text-xs font-black text-emerald-500 flex items-center gap-1">
                            <Edit3 size={13} /> {item.crop}
                          </span>
                          <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.mandi} ({item.state})</span>
                        </div>

                        <div>
                          <label className={`text-[10px] block mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>नया भाव (₹)</label>
                          <input 
                            type="number"
                            value={editRateVal}
                            onChange={(e) => setEditRateVal(Number(e.target.value))}
                            className={`w-full border rounded-xl px-2.5 py-1.5 text-sm font-bold outline-none ${
                              isDark ? 'bg-[#05070e] border-emerald-500/50 text-white' : 'bg-white border-emerald-500 text-slate-900'
                            }`}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className={`text-[10px] block mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>रुख (Trend)</label>
                            <select
                              value={editChangeVal}
                              onChange={(e) => setEditChangeVal(e.target.value as 'up' | 'down' | 'steady')}
                              className={`w-full border rounded-xl px-2 py-1.5 text-xs outline-none ${
                                isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            >
                              <option value="up">🔼 तेजी</option>
                              <option value="down">🔽 मंदी</option>
                              <option value="steady">➖ स्थिर</option>
                            </select>
                          </div>
                          <div>
                            <label className={`text-[10px] block mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>अंतर (± Diff)</label>
                            <input 
                              type="number"
                              value={editDiffVal}
                              onChange={(e) => setEditDiffVal(Number(e.target.value))}
                              className={`w-full border rounded-xl px-2 py-1.5 text-xs outline-none ${
                                isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            />
                          </div>
                        </div>

                        <div className={`flex justify-end gap-2 pt-2 border-t ${
                          isDark ? 'border-white/10' : 'border-slate-200'
                        }`}>
                          <button
                            onClick={() => setEditingMandiId(null)}
                            className={`px-2.5 py-1 text-xs transition ${
                              isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                            }`}
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
                            <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-md ${
                              isDark ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60' : 'text-emerald-800 bg-emerald-50 border-emerald-200'
                            }`}>
                              📍 {item.mandi} ({item.state})
                            </span>
                            <h4 className={`text-sm font-black mt-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {item.crop}
                            </h4>
                          </div>

                          <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                            item.change === 'up' 
                              ? isDark ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/50' : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                              : item.change === 'down' 
                              ? isDark ? 'text-rose-400 bg-rose-950/60 border border-rose-800/50' : 'text-rose-700 bg-rose-50 border border-rose-200'
                              : isDark ? 'text-slate-400 bg-slate-800/60 border border-slate-700/50' : 'text-slate-700 bg-slate-100 border border-slate-200'
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

                        <div className={`mt-3 flex items-baseline justify-between pt-2 border-t ${
                          isDark ? 'border-white/5' : 'border-slate-100'
                        }`}>
                          <div className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            ₹{item.rate.toLocaleString('en-IN')}{' '}
                            <span className={`text-[10px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.unit}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingMandiId(item.id);
                                setEditRateVal(item.rate);
                                setEditChangeVal(item.change);
                                setEditDiffVal(item.diff);
                              }}
                              className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition active:scale-95 cursor-pointer ${
                                isDark 
                                  ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-800/50'
                                  : 'text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                              }`}
                              title="भाव बदलें"
                            >
                              <Edit3 size={11} />
                              <span>भाव बदलें</span>
                            </button>

                            {onDeleteMandiRate && (
                              <button
                                onClick={() => { if (window.confirm(`क्या आप ${item.crop} का मंडी भाव हटाना चाहते हैं?`)) onDeleteMandiRate(item.id); }}
                                className="text-slate-400 hover:text-red-500 p-1 rounded transition"
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

        {/* ========================================================
            TAB 7: ADS & MONETIZATION DESK (विज्ञापन व कमाई नियंत्रण केंद्र)
            ======================================================== */}
        {activeTab === 'ads' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header / Intro Card */}
            <div className={`p-6 rounded-3xl border shadow-xl relative overflow-hidden backdrop-blur-xl ${
              isDark 
                ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/30' 
                : 'bg-gradient-to-r from-amber-50/80 via-white to-amber-50/50 border-amber-200'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20 font-black">
                    <BadgeDollarSign size={32} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className={`text-xl md:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        विज्ञापन व मोनेटाइजेशन नियंत्रण केंद्र
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        स्थानीय प्रायोजक + AdSense
                      </span>
                    </div>
                    <p className={`text-xs md:text-sm mt-1 max-w-2xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      स्थानीय व्यापारियों के विज्ञापन स्लॉट्स (Header, Feed, Article, Sidebar) लाइव लगाएं, वास्तविक पाठक इम्प्रेशन्स और WhatsApp लीड्स ट्रैक करें, और 1-क्लिक में क्लाइंट को रिपोर्ट भेजें।
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                  <button
                    onClick={() => {
                      handleResetAdForm();
                      const formEl = document.getElementById('ad-campaign-form');
                      if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-1.5"
                  >
                    <Plus size={16} />
                    नया विज्ञापन जोड़ें
                  </button>
                  <button
                    onClick={fetchAds}
                    disabled={isLoadingAds}
                    className={`p-2.5 rounded-xl border transition ${
                      isDark ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300' : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                    }`}
                    title="रिफ्रेश करें"
                  >
                    <RefreshCw size={16} className={isLoadingAds ? 'animate-spin text-amber-400' : ''} />
                  </button>
                </div>
              </div>

              {/* Success Notification Alert */}
              {adSuccessMsg && (
                <div className="mt-4 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{adSuccessMsg}</span>
                </div>
              )}
            </div>

            {/* Performance KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>सक्रिय कैंपेन</span>
                  <Tag size={16} className="text-amber-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {ads.filter(a => a.isActive).length}
                  </span>
                  <span className="text-xs text-slate-400">/ {ads.length} कुल</span>
                </div>
                <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  लाइव स्लॉट्स कार्यरत
                </div>
              </div>

              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>कुल पाठक इम्प्रेशन्स</span>
                  <Eye size={16} className="text-blue-400" />
                </div>
                <div className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {ads.reduce((acc, a) => acc + (a.impressions || 0), 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">पोर्टल पर लाइव दृश्य (Views)</div>
              </div>

              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>क्लिक्स व लीड्स</span>
                  <MousePointerClick size={16} className="text-purple-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {ads.reduce((acc, a) => acc + (a.clicks || 0), 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-bold text-amber-400">
                    CTR: {ads.reduce((acc, a) => acc + (a.impressions || 0), 0) > 0 ? ((ads.reduce((acc, a) => acc + (a.clicks || 0), 0) / ads.reduce((acc, a) => acc + (a.impressions || 0), 0)) * 100).toFixed(1) : '0.0'}%
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">व्यापारी WhatsApp व वेबसाइट पर गए</div>
              </div>

              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>मासिक कमाई लक्ष्य</span>
                  <BarChart3 size={16} className="text-emerald-400" />
                </div>
                <div className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  ₹{(monetizationSettings.monthlyRevenueGoal || 50000).toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-emerald-400 mt-1">स्थानीय विज्ञापन + स्पॉन्सरशिप्स</div>
              </div>
            </div>

            {/* Form & List Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Form: Add / Edit Ad Campaign (5 cols) */}
              <div 
                id="ad-campaign-form"
                className={`lg:col-span-5 p-6 rounded-3xl border shadow-xl ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-700/40 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                      {editingAdId ? <Edit3 size={18} /> : <PlusCircle size={18} />}
                    </span>
                    <div>
                      <h3 className={`font-black text-sm md:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {editingAdId ? 'विज्ञापन कैंपेन संपादित करें' : 'नया विज्ञापन कैंपेन जोड़ें'}
                      </h3>
                      <p className="text-[11px] text-slate-400">क्लाइंट विवरण व बैनर सेट करें</p>
                    </div>
                  </div>
                  {editingAdId && (
                    <button
                      onClick={handleResetAdForm}
                      className="text-xs text-rose-400 hover:text-rose-300 font-bold px-2 py-1 rounded-lg bg-rose-500/10"
                    >
                      रद्द करें
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveAd} className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      अभियान / ऑफर का शीर्षक *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="उदा: राजस्थानी स्वीट्स कवर्धा - 20% की छूट"
                      value={adForm.title}
                      onChange={e => setAdForm({ ...adForm, title: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium outline-none transition ${
                        isDark ? 'bg-slate-800/80 border-slate-700 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                      }`}
                    />
                  </div>

                  {/* Client Name & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        क्लाइंट / फर्म का नाम *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="उदा: अग्रवाल ज्वेलर्स"
                        value={adForm.clientName}
                        onChange={e => setAdForm({ ...adForm, clientName: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium outline-none transition ${
                          isDark ? 'bg-slate-800/80 border-slate-700 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        क्लाइंट WhatsApp नंबर
                      </label>
                      <input
                        type="tel"
                        placeholder="उदा: 98261XXXXX"
                        value={adForm.clientPhone}
                        onChange={e => setAdForm({ ...adForm, clientPhone: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium outline-none transition ${
                          isDark ? 'bg-slate-800/80 border-slate-700 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Placement & Target District */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        विज्ञापन स्लॉट (Placement) *
                      </label>
                      <select
                        value={adForm.placement}
                        onChange={e => setAdForm({ ...adForm, placement: e.target.value as AdPlacement })}
                        className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium outline-none transition ${
                          isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      >
                        <option value="in_feed">📰 समाचार फ़ीड बैनर (In-Feed)</option>
                        <option value="header_top">🔝 शीर्ष हेडर बैनर (Header Top)</option>
                        <option value="article_bottom">📄 पूरी खबर के नीचे (Article Bottom)</option>
                        <option value="sidebar">📌 साइडबार / डेस्कटॉप (Sidebar)</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        लक्षित जिला (Target Area)
                      </label>
                      <select
                        value={adForm.targetDistrict}
                        onChange={e => setAdForm({ ...adForm, targetDistrict: e.target.value })}
                        className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium outline-none transition ${
                          isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      >
                        <option value="सभी 88 जिले">सभी 88 जिले (छ.ग. + म.प्र.)</option>
                        <option value="कवर्धा">कवर्धा (कबीरधाम)</option>
                        <option value="रायपुर">रायपुर</option>
                        <option value="बिलासपुर">बिलासपुर</option>
                        <option value="दुर्ग">दुर्ग</option>
                        <option value="राजनांदगांव">राजनांदगांव</option>
                        <option value="भोपाल">भोपाल</option>
                        <option value="इंदौर">इंदौर</option>
                        <option value="जबलपुर">जबलपुर</option>
                        {districts
                          .filter(d => !['कबीरधाम (कवर्धा)', 'कवर्धा', 'रायपुर', 'बिलासपुर', 'दुर्ग', 'राजनांदगांव', 'भोपाल', 'इंदौर', 'जबलपुर'].includes(d.nameHindi || d.name))
                          .map(d => (
                            <option key={d._id || d.name} value={d.nameHindi || d.name}>
                              {d.nameHindi || d.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Banner Image URL */}
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      बैनर इमेज URL *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://images.unsplash.com/... या CDN लिंक"
                      value={adForm.imageUrl}
                      onChange={e => setAdForm({ ...adForm, imageUrl: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium outline-none transition ${
                        isDark ? 'bg-slate-800/80 border-slate-700 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                      }`}
                    />
                    {adForm.imageUrl && (
                      <div className="mt-2 p-2 rounded-xl border border-dashed border-slate-700 bg-slate-950/40">
                        <div className="text-[10px] text-slate-400 mb-1">लाइव बैनर प्रीव्यू:</div>
                        <img 
                          src={adForm.imageUrl} 
                          alt="Banner Preview" 
                          className="w-full max-h-28 object-cover rounded-lg"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Destination Link */}
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      क्लिक पर रीडायरेक्ट लिंक (WhatsApp या वेबसाइट) *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://wa.me/9198261XXXXX?text=नमस्ते या वेबसाइट लिंक"
                      value={adForm.linkUrl}
                      onChange={e => setAdForm({ ...adForm, linkUrl: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium outline-none transition ${
                        isDark ? 'bg-slate-800/80 border-slate-700 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                      }`}
                    />
                  </div>

                  {/* Expiry Date, Priority & Active */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        समाप्ति तिथि
                      </label>
                      <input
                        type="date"
                        value={adForm.expiryDate}
                        onChange={e => setAdForm({ ...adForm, expiryDate: e.target.value })}
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-medium outline-none transition ${
                          isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        प्राथमिकता (0-10)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={adForm.priority}
                        onChange={e => setAdForm({ ...adForm, priority: parseInt(e.target.value) || 0 })}
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-medium outline-none transition ${
                          isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    <div className="pt-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={adForm.isActive}
                          onChange={e => setAdForm({ ...adForm, isActive: e.target.checked })}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                        />
                        <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          तुरंत लाइव रखें
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="submit"
                      className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-lg transition active:scale-98 flex items-center justify-center gap-2"
                    >
                      <Save size={16} />
                      {editingAdId ? 'विज्ञापन अपडेट करें' : 'विज्ञापन लाइव प्रकाशित करें'}
                    </button>
                    {editingAdId && (
                      <button
                        type="button"
                        onClick={handleResetAdForm}
                        className={`py-3 px-4 rounded-xl border text-xs font-bold transition ${
                          isDark ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-slate-300 bg-slate-100 text-slate-700'
                        }`}
                      >
                        रद्द करें
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* List of Ads / Campaigns (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-700/40">
                  <div className="flex items-center gap-2">
                    <Building2 size={18} className="text-amber-400" />
                    <h3 className={`font-black text-sm md:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      लाइव विज्ञापन कैंपेन सूची ({ads.length})
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {ads.filter(a => a.isActive).length} सक्रिय
                  </span>
                </div>

                {isLoadingAds ? (
                  <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                    <RefreshCw size={16} className="animate-spin text-amber-400" />
                    विज्ञापन डेटा लोड हो रहा है...
                  </div>
                ) : ads.length === 0 ? (
                  <div className={`p-8 rounded-3xl border text-center ${
                    isDark ? 'bg-slate-900/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <BadgeDollarSign size={40} className="mx-auto text-amber-400 mb-2 opacity-60" />
                    <p className="font-bold text-sm">अभी कोई विज्ञापन कैंपेन दर्ज नहीं है</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      बाईं ओर दिए गए फॉर्म से स्थानीय दुकानों, कोचिंग, डॉक्टरों या इवेंट्स के लिए पहला पेड बैनर जोड़ें।
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ads.map((ad) => {
                      const ctr = (ad.impressions && ad.impressions > 0)
                        ? (((ad.clicks || 0) / ad.impressions) * 100).toFixed(1)
                        : '0.0';

                      return (
                        <div
                          key={ad._id}
                          className={`p-4 rounded-2xl border transition-all ${
                            isDark 
                              ? ad.isActive ? 'bg-slate-900/90 border-slate-800 hover:border-amber-500/50' : 'bg-slate-950/40 border-slate-800/50 opacity-60'
                              : ad.isActive ? 'bg-white border-slate-200 shadow-sm hover:border-amber-300' : 'bg-slate-50 border-slate-200 opacity-60'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            {/* Left: Thumbnail & Details */}
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <img
                                src={ad.imageUrl}
                                alt={ad.title}
                                className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-700/60 bg-slate-950"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    ad.placement === 'header_top' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                    ad.placement === 'article_bottom' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                    'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  }`}>
                                    {ad.placement === 'header_top' ? 'शीर्ष हेडर' : ad.placement === 'article_bottom' ? 'खबर के नीचे' : 'समाचार फ़ीड'}
                                  </span>
                                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <MapPin size={10} />
                                    {ad.targetDistrict}
                                  </span>
                                  {(ad.priority ?? 0) > 0 && (
                                    <span className="text-[9px] text-yellow-400 font-mono font-bold">
                                      ★ P{ad.priority}
                                    </span>
                                  )}
                                </div>

                                <h4 className={`text-xs md:text-sm font-bold truncate mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                  {ad.title}
                                </h4>

                                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                  <span className="font-semibold text-slate-300">{ad.clientName}</span>
                                  {ad.clientPhone && <span>• 📞 {ad.clientPhone}</span>}
                                </div>
                              </div>
                            </div>

                            {/* Center: Live Metrics */}
                            <div className="flex items-center gap-3 shrink-0 px-3 py-1.5 rounded-xl bg-slate-950/40 border border-slate-800">
                              <div className="text-center">
                                <div className="text-[10px] text-slate-400">व्यूज़</div>
                                <div className="text-xs font-black font-mono text-blue-400">
                                  {(ad.impressions || 0).toLocaleString('en-IN')}
                                </div>
                              </div>
                              <div className="h-6 w-px bg-slate-800" />
                              <div className="text-center">
                                <div className="text-[10px] text-slate-400">क्लिक्स</div>
                                <div className="text-xs font-black font-mono text-purple-400">
                                  {(ad.clicks || 0).toLocaleString('en-IN')}
                                </div>
                              </div>
                              <div className="h-6 w-px bg-slate-800" />
                              <div className="text-center">
                                <div className="text-[10px] text-slate-400">CTR</div>
                                <div className="text-xs font-black font-mono text-amber-400">
                                  {ctr}%
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                            {/* Left: Active Toggle */}
                            <button
                              onClick={() => handleToggleAdStatus(ad)}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition ${
                                ad.isActive
                                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                              }`}
                            >
                              {ad.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                              {ad.isActive ? 'सक्रिय (Live)' : 'रोकी गई (Paused)'}
                            </button>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-1.5">
                              {/* 1-Click WhatsApp Client Report */}
                              <button
                                onClick={() => handleSendClientReport(ad)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1.5 transition shadow-sm"
                                title="क्लाइंट को WhatsApp पर प्रदर्शन रिपोर्ट भेजें"
                              >
                                <WhatsAppIcon className="w-3 h-3 fill-current" />
                                1-Click रिपोर्ट
                              </button>

                              {/* Edit Button */}
                              <button
                                onClick={() => handleEditAd(ad)}
                                className={`p-1.5 rounded-lg border transition ${
                                  isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                                }`}
                                title="संपादित करें"
                              >
                                <Edit3 size={13} />
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteAd(ad._id, ad.title)}
                                className="p-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition"
                                title="हटाएं"
                              >
                                <Trash2 size={13} />
                              </button>

                              {/* Open Link */}
                              <a
                                href={ad.linkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`p-1.5 rounded-lg border transition ${
                                  isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-400' : 'border-slate-300 hover:bg-slate-100 text-slate-600'
                                }`}
                                title="रीडायरेक्ट लिंक खोलें"
                              >
                                <ExternalLink size={13} />
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Google AdSense & Global Monetization Settings */}
            <div className={`p-6 rounded-3xl border shadow-xl ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center gap-3 pb-4 border-b border-slate-700/40 mb-5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className={`font-black text-sm md:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Google AdSense एवं वैश्विक मोनेटाइजेशन सेटिंग्स
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    जब कोई स्थानीय विज्ञापन न हो, तो Google AdSense स्वतः बैकफिल होगा
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveMonetization} className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-800 bg-slate-950/40">
                  <div>
                    <div className="text-xs font-bold text-white">Google AdSense नेटवर्क सक्षम करें</div>
                    <div className="text-[10px] text-slate-400">रिक्त स्लॉट्स में Google Ads प्रदर्शित होंगे</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={monetizationSettings.adsenseEnabled}
                      onChange={e => setMonetizationSettings({ ...monetizationSettings, adsenseEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      AdSense Publisher ID
                    </label>
                    <input
                      type="text"
                      placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                      value={monetizationSettings.adsensePublisherId || ''}
                      onChange={e => setMonetizationSettings({ ...monetizationSettings, adsensePublisherId: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-mono outline-none transition ${
                        isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Header Ad Slot ID
                    </label>
                    <input
                      type="text"
                      placeholder="उदा: 1234567890"
                      value={monetizationSettings.headerSlotId || ''}
                      onChange={e => setMonetizationSettings({ ...monetizationSettings, headerSlotId: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-mono outline-none transition ${
                        isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Feed Ad Slot ID
                    </label>
                    <input
                      type="text"
                      placeholder="उदा: 2345678901"
                      value={monetizationSettings.inFeedSlotId || ''}
                      onChange={e => setMonetizationSettings({ ...monetizationSettings, inFeedSlotId: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-mono outline-none transition ${
                        isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Article Ad Slot ID
                    </label>
                    <input
                      type="text"
                      placeholder="उदा: 3456789012"
                      value={monetizationSettings.articleSlotId || ''}
                      onChange={e => setMonetizationSettings({ ...monetizationSettings, articleSlotId: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-mono outline-none transition ${
                        isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      WhatsApp बुलेटिन प्रायोजक लाइन (Daily Bulletin Sponsor Footer)
                    </label>
                    <input
                      type="text"
                      value={monetizationSettings.whatsappSponsorLine || ''}
                      onChange={e => setMonetizationSettings({ ...monetizationSettings, whatsappSponsorLine: e.target.value })}
                      placeholder="डिजिटल विज्ञापन व कवरेज हेतु संपर्क करें: 7000139694"
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-medium outline-none transition ${
                        isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      मासिक विज्ञापन आय लक्ष्य (₹)
                    </label>
                    <input
                      type="number"
                      value={monetizationSettings.monthlyRevenueGoal || 50000}
                      onChange={e => setMonetizationSettings({ ...monetizationSettings, monthlyRevenueGoal: parseInt(e.target.value) || 0 })}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-mono outline-none transition ${
                        isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingMonetization}
                    className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
                  >
                    <Save size={15} />
                    {isSavingMonetization ? 'सहेजा जा रहा है...' : 'मोनेटाइजेशन सेटिंग्स सुरक्षित करें'}
                  </button>
                </div>
              </form>
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
            showMobileMoreDrawer || activeTab === 'reporters' || activeTab === 'mandi' || activeTab === 'ads'
              ? 'text-amber-400 font-bold'
              : 'text-slate-400'
          } />
          <span className={`text-[10px] font-bold mt-0.5 transition ${
            showMobileMoreDrawer || activeTab === 'reporters' || activeTab === 'mandi' || activeTab === 'ads'
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

            <div className={`flex items-center justify-between pb-3 border-b mb-3 ${
              isDark ? 'border-white/10' : 'border-slate-200'
            }`}>
              <div className="text-xs font-black tracking-wide flex items-center gap-2">
                <span>📂</span> अन्य प्रशासनिक डेस्क व विकल्प
              </div>
              <button 
                onClick={() => setShowMobileMoreDrawer(false)}
                className={`text-xs px-2 py-1 rounded-lg font-bold transition ${
                  isDark ? 'text-slate-400 hover:text-white bg-slate-800/40' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                }`}
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
                  setActiveTab('ads');
                  setShowMobileMoreDrawer(false);
                }}
                className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                  activeTab === 'ads'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                    : isDark ? 'border-slate-800 bg-slate-800/60 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-800'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <BadgeDollarSign size={16} />
                </div>
                <div>
                  <div className="font-bold text-[11px] leading-tight">विज्ञापन व कमाई</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">({ads.length} कैंपेन)</div>
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
              className={`w-full mt-3 py-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow ${
                isDark 
                  ? 'bg-rose-950/60 hover:bg-rose-900 border-rose-800/80 text-rose-300' 
                  : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
              }`}
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

      {/* ADD / EDIT REPORTER MODAL */}
      {showReporterModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`border w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 ${
            isDark ? 'bg-[#0b0f19] border-blue-500/30 text-white' : 'bg-white border-blue-200 text-slate-900'
          }`}>
            <div className={`p-4 flex items-center justify-between border-b ${
              isDark ? 'bg-[#070a12] border-white/10' : 'bg-blue-50/60 border-blue-100'
            }`}>
              <div className="flex items-center gap-2 text-blue-500 font-bold text-sm">
                <Users size={18} />
                <span className={isDark ? 'text-white' : 'text-slate-900'}>
                  {editingReporter ? 'संवाददाता विवरण संपादित करें' : 'नया क्षेत्रीय संवाददाता / ब्यूरो प्रमुख जोड़ें'}
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setShowReporterModal(false)}
                className={`p-1 rounded-lg transition ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveReporter} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>नाम (हिंदी में) *</label>
                  <input 
                    type="text"
                    value={repNameHindi}
                    onChange={(e) => {
                      setRepNameHindi(e.target.value);
                      if (!repName) setRepName(e.target.value);
                    }}
                    placeholder="उदा. अमित चंद्रवंशी"
                    className={`w-full border focus:border-blue-500 rounded-xl px-3 py-2 outline-none ${
                      isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                    }`}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>नाम (अंग्रेजी / ID में) *</label>
                  <input 
                    type="text"
                    value={repName}
                    onChange={(e) => setRepName(e.target.value)}
                    placeholder="Amit Chandrawanshi"
                    className={`w-full border focus:border-blue-500 rounded-xl px-3 py-2 outline-none ${
                      isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                    }`}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>मोबाइल नंबर (WhatsApp) *</label>
                  <input 
                    type="tel"
                    value={repPhone}
                    onChange={(e) => setRepPhone(e.target.value)}
                    placeholder="98260XXXXX"
                    maxLength={10}
                    className={`w-full border focus:border-blue-500 rounded-xl px-3 py-2 outline-none font-mono ${
                      isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                    }`}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>पद / ब्यूरो (Designation) *</label>
                  <input 
                    type="text"
                    value={repBureau}
                    onChange={(e) => setRepBureau(e.target.value)}
                    placeholder="उदा. कवर्धा ब्यूरो चीफ / ग्राउंड रिपोर्टर"
                    className={`w-full border focus:border-blue-500 rounded-xl px-3 py-2 outline-none ${
                      isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                    }`}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>जिला (District) *</label>
                  <select
                    value={repDistrict}
                    onChange={(e) => setRepDistrict(e.target.value)}
                    className={`w-full border focus:border-blue-500 rounded-xl px-3 py-2 outline-none ${
                      isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
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

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>प्रेस आईडी कोड (Press ID)</label>
                    <button
                      type="button"
                      onClick={() => setRepCode(`ANP-CG-${Math.floor(100 + Math.random() * 900)}`)}
                      className="text-[10px] text-blue-500 hover:underline"
                    >
                      नया कोड
                    </button>
                  </div>
                  <input 
                    type="text"
                    value={repCode}
                    onChange={(e) => setRepCode(e.target.value)}
                    placeholder="ANP-CG-KBR-01"
                    className={`w-full border focus:border-blue-500 rounded-xl px-3 py-2 outline-none font-mono font-bold ${
                      isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>फोटो लिंक (Photo URL)</label>
                <input 
                  type="url"
                  value={repPhoto}
                  onChange={(e) => setRepPhoto(e.target.value)}
                  placeholder="https://..."
                  className={`w-full border focus:border-blue-500 rounded-xl px-3 py-2 outline-none ${
                    isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                  }`}
                />
              </div>

              <div className={`flex items-center justify-end gap-2.5 pt-3 border-t ${
                isDark ? 'border-white/10' : 'border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setShowReporterModal(false)}
                  className={`px-4 py-2 rounded-xl transition ${
                    isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-xl shadow-lg shadow-blue-600/30 transition active:scale-95 flex items-center gap-1.5"
                >
                  <Save size={14} />
                  <span>{editingReporter ? 'अपडेट सहेजें' : 'संवाददाता जोड़ें'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIGITAL PRESS ID CARD MODAL */}
      {idCardReporter && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-sm flex flex-col items-center animate-in zoom-in-95 duration-200">
            
            {/* The Badge Container (Printable) */}
            <div 
              id="press-id-card-render"
              className="w-full rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/60 bg-gradient-to-b from-[#0e1628] via-[#090e1a] to-[#04060c] text-white relative flex flex-col p-5"
            >
              {/* Lanyard Punch Hole Marker */}
              <div className="w-12 h-2.5 bg-black/60 rounded-full mx-auto -mt-2 mb-3 border border-white/20"></div>

              {/* Card Header */}
              <div className="text-center pb-3 border-b border-amber-500/40 relative">
                <div className="inline-flex items-center justify-center gap-1.5 bg-red-600 text-white px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow">
                  <span>PRESS / मीडिया प्रतिनिधि</span>
                </div>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-white p-0.5 shadow shrink-0">
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-cover rounded-full" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-sm font-black text-white tracking-wide leading-none">AMBITION NEWS</h2>
                    <span className="text-[9px] text-amber-400 font-bold block mt-0.5">राष्ट्रीय डिजिटल समाचार नेटवर्क</span>
                  </div>
                </div>
              </div>

              {/* Photo & Identity Section */}
              <div className="flex flex-col items-center text-center py-4 relative">
                <div className="w-24 h-24 rounded-2xl overflow-hidden p-1 bg-gradient-to-tr from-amber-500 to-red-600 shadow-xl relative">
                  <img 
                    src={idCardReporter.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'} 
                    alt={idCardReporter.name}
                    className="w-full h-full object-cover rounded-xl bg-slate-900" 
                  />
                  {idCardReporter.isActive && (
                    <div className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950"></div>
                  )}
                </div>

                <h3 className="text-base font-black text-white mt-3 leading-tight">
                  {idCardReporter.nameHindi || idCardReporter.name}
                </h3>
                <span className="text-xs text-slate-300 font-medium">
                  {idCardReporter.name}
                </span>

                <div className="mt-2 bg-gradient-to-r from-red-950/80 to-amber-950/80 border border-amber-500/40 px-3 py-1 rounded-xl text-amber-300 font-bold text-xs shadow-sm">
                  {idCardReporter.bureau}
                </div>

                <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-300">
                  <span>📍 {idCardReporter.district}</span>
                  <span>•</span>
                  <span>CG / MP</span>
                </div>
              </div>

              {/* Credentials Details Box */}
              <div className="bg-slate-950/80 rounded-2xl border border-white/10 p-3 space-y-2 text-xs">
                <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                  <span className="text-slate-400 text-[10px]">प्रेस कोड (ID No.)</span>
                  <span className="font-mono font-black text-amber-400 text-xs tracking-wider">
                    {idCardReporter.reporterIdCode}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                  <span className="text-slate-400 text-[10px]">मोबाइल नंबर</span>
                  <span className="font-mono text-white text-[11px]">
                    +91 {idCardReporter.phone}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                  <span className="text-slate-400 text-[10px]">प्रकाशन रिपोर्ट</span>
                  <span className="font-bold text-emerald-400 text-[11px]">
                    {idCardReporter.articlesCount || 0} खबरें प्रकाशित
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[10px]">सत्र वैधता (Validity)</span>
                  <span className="font-bold text-slate-200 text-[11px]">
                    2026 – 2027 (सत्यापित)
                  </span>
                </div>
              </div>

              {/* Security Seal & Signatory Footer */}
              <div className="pt-3.5 mt-3 border-t border-amber-500/30 flex items-center justify-between text-[9px] text-slate-400">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <BadgeCheck size={18} className="text-amber-400 shrink-0" />
                  <div className="leading-tight">
                    <span className="font-bold block text-white">डिजिटल सत्यापित</span>
                    <span>पोर्टल आईडी कार्ड</span>
                  </div>
                </div>

                <div className="text-right leading-tight">
                  <span className="text-[10px] text-amber-300 block italic font-bold">
                    Paras Chandra
                  </span>
                  <span className="text-[8px] text-slate-400 uppercase font-semibold">
                    प्रधान संपादक (Editor-in-Chief)
                  </span>
                </div>
              </div>

              {/* Bottom Police & Admin Advisory */}
              <div className="mt-2.5 pt-2 border-t border-white/5 text-center text-[8px] text-slate-500 leading-tight">
                यह कार्ड अधिकृत समाचार कवरेज हेतु जारी किया गया है। समस्त पुलिस व प्रशासनिक सहयोग अपेक्षित है।
              </div>
            </div>

            {/* Actions Bar outside card */}
            <div className="flex items-center gap-2.5 mt-4 w-full">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black py-2.5 rounded-2xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 text-xs transition active:scale-95 cursor-pointer"
              >
                <Printer size={15} />
                <span>🖨️ कार्ड प्रिंट / सेव करें</span>
              </button>
              <button
                type="button"
                onClick={() => setIdCardReporter(null)}
                className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition active:scale-95 cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                }`}
              >
                बंद करें
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
