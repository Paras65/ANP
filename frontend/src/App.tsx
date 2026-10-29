import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, 
  RefreshCw, 
  ChevronRight, 
  CheckCircle2, 
  Flame, 
  Download,
  Bookmark,
  Sparkles,
  Search,
  TrendingUp,
  Mic,
  Clock,
  Eye,
  ChevronDown,
  MapPinOff,
  Trash2,
  Play,
  Loader2
} from 'lucide-react';
import { formatRelativeHindiTime, estimateReadingTime, formatHindiViews } from './utils/dateUtils';

import { Header } from './components/Header';
import { BackToTop } from './components/BackToTop';
import { BreakingTicker } from './components/BreakingTicker';
import { MandiWidget } from './components/MandiWidget';
import { VideoSection } from './components/VideoSection';
import { InstagramSection } from './components/InstagramSection';
import { ArticleModal } from './components/ArticleModal';
const AdminPortal = React.lazy(() => import('./components/AdminPortal').then(m => ({ default: m.AdminPortal })));
const SuperAdminPortal = React.lazy(() => import('./components/SuperAdminPortal').then(m => ({ default: m.SuperAdminPortal })));
import { Footer } from './components/Footer';
import { StoriesTray } from './components/StoriesTray';
import { StoryViewerModal } from './components/StoryViewerModal';
import { ReelsViewerModal } from './components/ReelsViewerModal';
import { DistrictPickerModal } from './components/DistrictPickerModal';
import { ReporterModal } from './components/ReporterModal';
import { ComplianceModal, type ComplianceTab } from './components/ComplianceModal';
import { BottomNav } from './components/BottomNav';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import type { TabType } from './components/BottomNav';
import { useVoiceTyping } from './hooks/useVoiceTyping';
import { YoutubeIcon, InstagramIcon, WhatsAppIcon, FacebookIcon } from './components/SocialIcons';
import { getSmartCoverImage } from './utils/categoryTheme';
import { getOptimizedImageUrl } from './utils/imageUtils';

import { 
  ALL_DISTRICTS_DEMO, 
  POPULAR_DISTRICTS_CG, 
  POPULAR_DISTRICTS_MP, 
  SOCIAL_LINKS 
} from './data/mockData';
import { generateStoriesList } from './components/StoriesTray';
import type { StoryItem } from './components/StoriesTray';
import type { Article, DistrictItem, VideoBulletin, InstagramPost, MandiRate, Reporter, Advertisement } from './types';
import { AdBanner } from './components/AdBanner';
import api from './api/client';
import { syncYouTubeChannelVideos } from './utils/mediaUtils';

export const App: React.FC = () => {
  // Theme state: defaults to false (White / Light mode)
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('anp_theme') === 'dark';
  });
  const [currentView, setCurrentView] = useState<'public' | 'admin' | 'super-admin'>('public');
  const [selectedState, setSelectedState] = useState<'chhattisgarh' | 'madhya-pradesh'>('chhattisgarh');
  const [currentDistrict, setCurrentDistrict] = useState<string>('सभी');
  const [selectedCategory, setSelectedCategory] = useState<string>('सभी खबरें');
  const [districtsList, setDistrictsList] = useState<DistrictItem[]>(ALL_DISTRICTS_DEMO);
  const [articles, setArticles] = useState<Article[]>([]);
  const [reporters, setReporters] = useState<Reporter[]>([]);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [youtubeSubs, setYoutubeSubs] = useState<string>(() => {
    return localStorage.getItem('anp_yt_subs') || SOCIAL_LINKS.youtubeSubs || '4.56K+';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [backendSynced, setBackendSynced] = useState(false);
  
  // Mobile Native navigation & tabs
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isMobileDeviceView, setIsMobileDeviceView] = useState(false);
  
  // Modals & Stories & Reels state
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [activeStory, setActiveStory] = useState<StoryItem | null>(null);
  const [activeReelId, setActiveReelId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [savedArticles, setSavedArticles] = useState<Article[]>(() => {
    try {
      const saved = localStorage.getItem('anp_saved_articles');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [savedReelIds, setSavedReelIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('anp_bookmarked_reels');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [savedTabFilter, setSavedTabFilter] = useState<'all' | 'articles' | 'reels'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showReporterModal, setShowReporterModal] = useState(false);
  const [complianceModalTab, setComplianceModalTab] = useState<ComplianceTab | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(7);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMoreBackend, setHasMoreBackend] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [totalArticlesCount, setTotalArticlesCount] = useState<number>(0);

  // Voice Search Hook for Public Portal
  const {
    isListening: isListeningSearch,
    isSupported: isVoiceSupported,
    toggleListening: toggleVoiceSearch
  } = useVoiceTyping({
    lang: 'hi-IN',
    onResult: (text) => {
      setSearchQuery(text.replace(/[.,]/g, '').trim());
      setIsSearching(true);
    }
  });

  // Auto-Sync YouTube Channel ID (Ambition News)
  const [youtubeChannelId, setYoutubeChannelId] = useState<string>(() => {
    return localStorage.getItem('anp_yt_channel_id') || 'UC8mIipC7suPuBJ_n8kUzkCg';
  });
  const [hasYouTubeApiKey, setHasYouTubeApiKey] = useState(false);

  // Dynamic Live YouTube Videos & Instagram Reels
  const [videoBulletins, setVideoBulletins] = useState<VideoBulletin[]>(() => {
    const saved = localStorage.getItem('anp_video_bulletins');
    return saved ? JSON.parse(saved) : [];
  });

  // Dynamic Live Mandi Rates
  const [mandiRates, setMandiRates] = useState<MandiRate[]>(() => {
    const saved = localStorage.getItem('anp_mandi_rates');
    return saved ? JSON.parse(saved) : [];
  });

  const handleUpdateMandiRate = async (updated: MandiRate) => {
    const next = mandiRates.map(r => r.id === updated.id ? updated : r);
    setMandiRates(next);
    localStorage.setItem('anp_mandi_rates', JSON.stringify(next));
    showToast(`✅ ${updated.crop} का भाव ₹${updated.rate.toLocaleString('en-IN')} अपडेट हुआ!`);
    try {
      await api.put(`/mandi/${updated.id}`, updated);
    } catch {}
  };

  const handleAddMandiRate = async (newRate: Omit<MandiRate, 'id'>) => {
    const tempId = `m-${Date.now()}`;
    const rateItem: MandiRate = { ...newRate, id: tempId };
    const next = [...mandiRates, rateItem];
    setMandiRates(next);
    localStorage.setItem('anp_mandi_rates', JSON.stringify(next));
    showToast(`✅ नया मंडी भाव (${newRate.crop}) जोड़ा गया!`);
    try {
      const res = await api.post('/mandi', newRate);
      if (res.data?.data?.id) {
        setMandiRates(prev => prev.map(r => r.id === tempId ? { ...r, id: res.data.data.id } : r));
      }
    } catch {}
  };

  const handleDeleteMandiRate = async (id: string) => {
    const next = mandiRates.filter(r => r.id !== id);
    setMandiRates(next);
    localStorage.setItem('anp_mandi_rates', JSON.stringify(next));
    showToast('मंडी भाव हटा दिया गया');
    try {
      await api.delete(`/mandi/${id}`);
    } catch {}
  };

  const handleAddReporter = async (repData: Partial<Reporter>) => {
    try {
      const res = await api.post('/reporters', repData);
      if (res.data?.data) {
        setReporters(prev => [res.data.data, ...prev]);
        showToast('✅ नया संवाददाता सफलतापूर्वक जोड़ा गया!');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'संवाददाता जोड़ने में विफल');
    }
  };

  const handleUpdateReporter = async (id: string, updatedData: Partial<Reporter>) => {
    setReporters(prev => prev.map(r => r._id === id ? { ...r, ...updatedData } : r));
    showToast('✅ संवाददाता विवरण अपडेट हो गया!');
    try {
      await api.put(`/reporters/${id}`, updatedData);
    } catch {}
  };

  const handleDeleteReporter = async (id: string) => {
    setReporters(prev => prev.filter(r => r._id !== id));
    showToast('🗑️ संवाददाता हटा दिए गए');
    try {
      await api.delete(`/reporters/${id}`);
    } catch {}
  };

  const [instagramPosts, setInstagramPosts] = useState<InstagramPost[]>(() => {
    const saved = localStorage.getItem('anp_instagram_posts');
    return saved ? JSON.parse(saved) : [];
  });

  // Dynamic WhatsApp Group / Channel Link
  const [whatsappLink, setWhatsappLink] = useState<string>(() => {
    return localStorage.getItem('anp_whatsapp_link') || SOCIAL_LINKS.whatsappChannel;
  });

  const handleSaveWhatsAppLink = (link: string) => {
    setWhatsappLink(link);
    localStorage.setItem('anp_whatsapp_link', link);
    showToast('✅ व्हाट्सएप ग्रुप लिंक सुरक्षित किया गया!');
  };

  // Master YouTube & Shorts/Reels Synchronizer
  const handleSyncYouTube = async (channelIdToSync?: string): Promise<number> => {
    const targetId = channelIdToSync || youtubeChannelId;
    if (!targetId) return 0;

    try {
      const res = await syncYouTubeChannelVideos(targetId);
      if (res.subscribers) {
        setYoutubeSubs(res.subscribers);
        localStorage.setItem('anp_yt_subs', res.subscribers);
        SOCIAL_LINKS.youtubeSubs = res.subscribers;
      }
      if (res.success && res.videos.length > 0) {
        let addedCount = 0;

        setVideoBulletins(prev => {
          const existingIds = new Set(prev.map(v => v.youtubeId));
          const newItems = res.videos.filter(v => !existingIds.has(v.youtubeId));
          addedCount += newItems.length;
          if (newItems.length > 0) {
            const merged = [...newItems, ...prev];
            localStorage.setItem('anp_video_bulletins', JSON.stringify(merged));
            return merged;
          }
          return prev;
        });

        if (res.reels.length > 0) {
          setInstagramPosts(prev => {
            const existingIds = new Set(prev.map(r => r.youtubeId || r.id));
            const newReels = res.reels.filter(r => !existingIds.has(r.youtubeId || r.id));
            if (newReels.length > 0) {
              const merged = [...newReels, ...prev];
              localStorage.setItem('anp_instagram_posts', JSON.stringify(merged));
              return merged;
            }
            return prev;
          });
        }

        if (addedCount > 0) {
          showToast(`⚡ यूट्यूब से ${addedCount} नए वीडियो व रील्स स्वतः लोड हुए!`);
        }
        return res.count;
      }
    } catch (err) {
      console.warn('YouTube auto-sync error:', err);
    }
    return 0;
  };

  // Save Channel ID to MongoDB Atlas & LocalStorage (API key is strictly in server ENV)
  const handleSaveChannelId = async (id: string) => {
    setYoutubeChannelId(id);
    localStorage.setItem('anp_yt_channel_id', id);
    try {
      const res = await api.post('/youtube/config', { channelId: id });
      if (res.data?.isConfiguredOnServer !== undefined) {
        setHasYouTubeApiKey(res.data.isConfiguredOnServer);
      }
      if (res.data?.subscribers || res.data?.stats?.subscriberCount) {
        const liveSubs = res.data.subscribers || res.data.stats.subscriberCount;
        setYoutubeSubs(liveSubs);
        localStorage.setItem('anp_yt_subs', liveSubs);
        SOCIAL_LINKS.youtubeSubs = liveSubs;
      }
      showToast('✅ यूट्यूब चैनल आईडी MongoDB Atlas में सुरक्षित हो गई!');
    } catch (err) {
      console.warn('Config save error:', err);
    }
  };

  // Load configured channel ID from Atlas on mount
  useEffect(() => {
    api.get('/youtube/config').then(res => {
      if (res.data?.channelId) {
        setYoutubeChannelId(res.data.channelId);
        localStorage.setItem('anp_yt_channel_id', res.data.channelId);
      }
      if (res.data?.isConfiguredOnServer !== undefined) {
        setHasYouTubeApiKey(res.data.isConfiguredOnServer);
      }
      if (res.data?.subscribers || res.data?.stats?.subscriberCount) {
        const liveSubs = res.data.subscribers || res.data.stats.subscriberCount;
        setYoutubeSubs(liveSubs);
        localStorage.setItem('anp_yt_subs', liveSubs);
        SOCIAL_LINKS.youtubeSubs = liveSubs;
      }
    }).catch(() => {});

    // Fetch active local advertiser campaigns
    api.get('/ads').then(res => {
      if (res.data?.success && Array.isArray(res.data.data)) {
        setAds(res.data.data);
      }
    }).catch(() => {});
  }, []);

  // Auto-sync on startup
  useEffect(() => {
    const isAutoSyncEnabled = localStorage.getItem('anp_auto_sync_enabled') !== 'false';
    if (isAutoSyncEnabled && youtubeChannelId) {
      handleSyncYouTube(youtubeChannelId).catch(() => {});
    }
  }, [youtubeChannelId]);

  const handleAddVideo = async (newVideo: VideoBulletin) => {
    const updated = [newVideo, ...videoBulletins];
    setVideoBulletins(updated);
    localStorage.setItem('anp_video_bulletins', JSON.stringify(updated));
    showToast('नया यूट्यूब वीडियो सफलतापूर्वक जोड़ा गया!');
    try {
      await api.post('/videos', newVideo);
    } catch {}
  };

  const handleDeleteVideo = async (id: string) => {
    const updated = videoBulletins.filter(v => v.id !== id);
    setVideoBulletins(updated);
    localStorage.setItem('anp_video_bulletins', JSON.stringify(updated));
    showToast('वीडियो हटा दिया गया');
    try {
      await api.delete(`/videos/${id}`);
    } catch {}
  };

  const handleAddReel = async (newReel: InstagramPost) => {
    const updated = [newReel, ...instagramPosts];
    setInstagramPosts(updated);
    localStorage.setItem('anp_instagram_posts', JSON.stringify(updated));
    showToast('नई रील सफलतापूर्वक जोड़ी गई!');
    try {
      await api.post('/reels', newReel);
    } catch {}
  };

  const handleEditReel = async (updatedReel: InstagramPost) => {
    const updated = instagramPosts.map(r => r.id === updatedReel.id ? updatedReel : r);
    setInstagramPosts(updated);
    localStorage.setItem('anp_instagram_posts', JSON.stringify(updated));
    showToast('रील विवरण अपडेट कर दिया गया!');
    try {
      await api.put(`/reels/${updatedReel.id}`, updatedReel);
    } catch (err) {
      console.error('Failed to sync reel edit with server:', err);
    }
  };

  const handleDeleteReel = async (id: string) => {
    const updated = instagramPosts.filter(r => r.id !== id);
    setInstagramPosts(updated);
    localStorage.setItem('anp_instagram_posts', JSON.stringify(updated));
    showToast('रील हटा दी गई');
    try {
      await api.delete(`/reels/${id}`);
    } catch {}
  };

  // Citizen Journalist Scoop / News Submission
  const handleScoopSubmit = async (scoopData: Partial<Article>) => {
    try {
      const res = await api.post('/articles/scoop', scoopData);
      showToast(res.data?.message || 'आपकी खबर सफलतापूर्वक समीक्षा के लिए भेज दी गई है!');
      setShowReporterModal(false);
      if (currentView === 'admin') {
        loadArticles(true);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'खबर भेजने में विफल, कृपया पुनः प्रयास करें';
      showToast(errMsg);
    }
  };

  // Toggle Dark / White (Light) Mode
  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('anp_theme', next ? 'dark' : 'light');
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  // Sync theme with HTML root class on change
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Show Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Toggle Bookmark with LocalStorage sync
  const toggleBookmark = (article: Article) => {
    const isSaved = savedArticles.some(a => a._id === article._id);
    let next: Article[];
    if (isSaved) {
      next = savedArticles.filter(a => a._id !== article._id);
      showToast('🔖 आर्टिकल सेव्ड लिस्ट से हटाया गया');
    } else {
      next = [article, ...savedArticles];
      showToast('🔖 आर्टिकल ऑफलाइन पढ़ने के लिए सेव किया गया');
    }
    setSavedArticles(next);
    try {
      localStorage.setItem('anp_saved_articles', JSON.stringify(next));
    } catch {}
  };

  // Toggle Reel Bookmark with LocalStorage sync
  const toggleReelBookmark = (reelId: string) => {
    const next = { ...savedReelIds, [reelId]: !savedReelIds[reelId] };
    if (!next[reelId]) {
      delete next[reelId];
    }
    setSavedReelIds(next);
    try {
      localStorage.setItem('anp_bookmarked_reels', JSON.stringify(next));
    } catch {}
    showToast(!savedReelIds[reelId] ? '🔖 रील सेव की गई' : '🔖 रील सेव्ड लिस्ट से हटाई गई');
  };

  // Clear All Saved Items (Articles + Reels)
  const handleClearAllSaved = () => {
    if (window.confirm('क्या आप सभी सेव की गई खबरें और रील्स हटाना चाहते हैं?')) {
      setSavedArticles([]);
      setSavedReelIds({});
      try {
        localStorage.removeItem('anp_saved_articles');
        localStorage.removeItem('anp_bookmarked_reels');
      } catch {}
      showToast('🗑️ सभी सेव्ड आइटम्स साफ़ कर दिए गए');
    }
  };

  // Load districts
  const loadDistrictsFromBackend = async () => {
    try {
      const res = await api.get(`/districts?state=${selectedState}`);
      if (res.data?.data && res.data.data.length > 0) {
        setDistrictsList(res.data.data);
      }
    } catch {
      setDistrictsList(ALL_DISTRICTS_DEMO);
    }
  };

  // Load live articles (with server-side Pagination & seamless append support)
  const loadArticles = async (isAdminView = currentView === 'admin', page = 1, append = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const includeReviewParam = isAdminView ? '&includeReview=true' : '';
      const allParam = isAdminView ? '&all=true' : '';
      const districtParam = (!isAdminView && currentDistrict !== 'सभी') ? `&district=${encodeURIComponent(currentDistrict)}` : '';
      const pageParam = isAdminView ? '' : `&page=${page}&limit=12`;

      const query = `/articles?state=${selectedState}${districtParam}${includeReviewParam}${allParam}${pageParam}`;
      const res = await api.get(query);

      if (res.data?.data && Array.isArray(res.data.data)) {
        const fetchedData: Article[] = res.data.data;
        if (append) {
          setArticles(prev => {
            const existingIds = new Set(prev.map(a => a._id));
            const freshItems = fetchedData.filter(a => !existingIds.has(a._id));
            return [...prev, ...freshItems];
          });
        } else {
          setArticles(fetchedData);
        }

        if (res.data.pagination) {
          setCurrentPage(res.data.pagination.currentPage);
          setHasMoreBackend(res.data.pagination.hasNextPage);
          setTotalArticlesCount(res.data.pagination.totalArticles);
        } else {
          setHasMoreBackend(fetchedData.length >= 12);
          setTotalArticlesCount(fetchedData.length);
        }

        setBackendSynced(true);
      } else {
        if (!append) setBackendSynced(false);
      }
    } catch {
      if (!append) setBackendSynced(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Load live media (videos & reels) & reporters from MongoDB Atlas
  const loadMediaFromBackend = async () => {
    try {
      const [vRes, rRes, mRes, repRes] = await Promise.allSettled([
        api.get('/videos'),
        api.get('/reels'),
        api.get('/mandi'),
        api.get('/reporters')
      ]);
      if (vRes.status === 'fulfilled' && vRes.value.data?.data && Array.isArray(vRes.value.data.data) && vRes.value.data.data.length > 0) {
        setVideoBulletins(vRes.value.data.data);
      }
      if (rRes.status === 'fulfilled' && rRes.value.data?.data && Array.isArray(rRes.value.data.data) && rRes.value.data.data.length > 0) {
        setInstagramPosts(rRes.value.data.data);
      }
      if (mRes.status === 'fulfilled' && mRes.value.data?.data && Array.isArray(mRes.value.data.data) && mRes.value.data.data.length > 0) {
        setMandiRates(mRes.value.data.data);
        localStorage.setItem('anp_mandi_rates', JSON.stringify(mRes.value.data.data));
      }
      if (repRes.status === 'fulfilled' && repRes.value.data?.data && Array.isArray(repRes.value.data.data) && repRes.value.data.data.length > 0) {
        setReporters(repRes.value.data.data);
      }
    } catch {
      // Keep local state
    }
  };

  useEffect(() => {
    loadDistrictsFromBackend();
    loadArticles(currentView === 'admin');
    loadMediaFromBackend();
  }, [selectedState, currentDistrict, currentView]);

  // Handle new article submitted from Reporter Modal
  const handleNewArticleSubmit = async (newArticleData: Partial<Article>) => {
    const createdArticle: Article = {
      _id: `art-${Date.now()}`,
      title: newArticleData.title || '',
      excerpt: newArticleData.excerpt || '',
      content: newArticleData.content,
      district: newArticleData.district || 'कबीरधाम (कवर्धा)',
      state: selectedState,
      category: newArticleData.category || '🔴 कवर्धा स्पेशल',
      author: newArticleData.author || 'फ़ील्ड रिपोर्टर',
      coverImage: getSmartCoverImage(newArticleData.coverImage, newArticleData.category, newArticleData.title, newArticleData.district),
      views: 1,
      isBreaking: true,
      isFeatured: false,
      shares: 0,
      publishedAt: new Date().toISOString()
    };

    setArticles(prev => [createdArticle, ...prev]);
    showToast('🎉 सफलता! खबर Ambition News पोर्टल पर प्रकाशित हो गई!');

    try {
      const res = await api.post('/articles', createdArticle);
      if (res.data?.data?._id) {
        setArticles(prev => prev.map(a => a._id === createdArticle._id ? res.data.data : a));
      }
      setBackendSynced(true);
    } catch {
      // Offline fallback maintained
    }
  };

  // Delete article live from MongoDB Atlas
  const handleDeleteArticle = async (id: string) => {
    setArticles(prev => prev.filter(a => a._id !== id));
    showToast('🗑️ खबर सफलतापूर्वक हटा दी गई');
    try {
      await api.delete(`/articles/${id}`);
    } catch {
      // Handled
    }
  };

  // Update existing article live in MongoDB Atlas
  const handleUpdateArticle = async (id: string, updatedData: Partial<Article>) => {
    setArticles(prev => prev.map(a => a._id === id ? { ...a, ...updatedData } : a));
    showToast(updatedData.status === 'PUBLISHED' ? '🎉 खबर स्वीकृत व लाइव प्रकाशित हो गई!' : '✅ खबर सफलतापूर्वक अपडेट हो गई!');
    try {
      await api.put(`/articles/${id}`, updatedData);
    } catch {
      // Handled
    }
  };

  // Offline Detection & Resilience
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      showToast('🟢 इंटरनेट कनेक्शन पुनः सक्रिय हुआ!');
    };
    const handleOffline = () => {
      setIsOffline(true);
      showToast('📡 आप ऑफलाइन मोड में हैं — सहेजी गई सामग्री लोड की गई है');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync view with URL pathname & hash (seamless reloads on /admin, #admin, or /)
  useEffect(() => {
    const syncViewFromLocation = () => {
      const path = window.location.pathname.replace(/\/$/, '');
      const hash = window.location.hash;
      const search = window.location.search;
      if (path === '/super-admin' || hash === '#super-admin' || search.includes('portal=super-admin')) {
        setCurrentView('super-admin');
      } else if (path === '/admin' || hash === '#admin' || search.includes('portal=admin')) {
        setCurrentView('admin');
      } else {
        setCurrentView('public');
      }
    };

    syncViewFromLocation();
    window.addEventListener('popstate', syncViewFromLocation);
    window.addEventListener('hashchange', syncViewFromLocation);
    return () => {
      window.removeEventListener('popstate', syncViewFromLocation);
      window.removeEventListener('hashchange', syncViewFromLocation);
    };
  }, []);

  // Content Copy Prevention & Right-Click Disabling (Immunity for Admin Portal and Form Controls)
  useEffect(() => {
    if (currentView === 'admin' || currentView === 'super-admin') {
      document.body.classList.add('admin-mode');
      return () => {
        document.body.classList.remove('admin-mode');
      };
    }
    document.body.classList.remove('admin-mode');

    let lastToastTime = 0;
    const notifyCopyProtected = (msg: string) => {
      const now = Date.now();
      if (now - lastToastTime > 1800) {
        lastToastTime = now;
        showToast(msg);
      }
    };

    const isEditable = (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof HTMLElement)) return false;
      return (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        Boolean(target.closest('input, textarea, [contenteditable="true"], .allow-select, .admin-portal'))
      );
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
      notifyCopyProtected('🔒 सामग्री कॉपीराइट सुरक्षित है — कृपया आधिकारिक शेयर बटन का उपयोग करें');
    };

    const handleCopy = (e: ClipboardEvent) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
      notifyCopyProtected('🔒 सामग्री कॉपीराइट सुरक्षित है — कॉपी करने की अनुमति नहीं है');
    };

    const handleCut = (e: ClipboardEvent) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return;
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      
      // Block Ctrl+C, Ctrl+A, Ctrl+U, Ctrl+S, Ctrl+P
      if (isCtrlOrCmd && ['c', 'C', 'a', 'A', 'u', 'U', 's', 'S', 'p', 'P'].includes(e.key)) {
        e.preventDefault();
        notifyCopyProtected('🔒 सामग्री कॉपीराइट सुरक्षित है — कॉपी करने की अनुमति नहीं है');
        return;
      }

      // Block F12 and Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (Inspect shortcuts)
      if (e.key === 'F12' || (isCtrlOrCmd && e.shiftKey && ['i', 'I', 'j', 'J', 'c', 'C'].includes(e.key))) {
        e.preventDefault();
      }
    };

    const handleDragStart = (e: DragEvent) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
    };

    const handleSelectStart = (e: Event) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('selectstart', handleSelectStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, [currentView]);

  // Dynamic SEO & Structured Data updater for Google Search & Social Media Cards
  useEffect(() => {
    const defaultTitle = "एम्बिशन न्यूज़ — कवर्धा (कबीरधाम) • छत्तीसगढ़ एवं मध्यप्रदेश का अग्रणी डिजिटल न्यूज़ नेटवर्क | Ambition News";
    const defaultDesc = "एम्बिशन न्यूज़ (Ambition News Kawardha) — कबीरधाम (कवर्धा), छत्तीसगढ़ के 33 और मध्यप्रदेश के 55 जिलों की ताज़ा ब्रेकिंग खबरें, भोरमदेव समाचार, मंडी भाव, राजनीति, अपराध और वीडियो बुलेटिन।";
    const defaultImage = "https://ambition-news-portal.vercel.app/logo-512.png";

    if (activeArticle) {
      document.title = `${activeArticle.title} | एम्बिशन न्यूज़ कवर्धा`;
      
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', activeArticle.excerpt || activeArticle.title);

      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', activeArticle.title);

      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', activeArticle.excerpt || activeArticle.title);

      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) ogImage.setAttribute('content', activeArticle.coverImage || defaultImage);

      const ogUrl = document.querySelector('meta[property="og:url"]');
      if (ogUrl) ogUrl.setAttribute('content', `https://ambition-news-portal.vercel.app/?article=${activeArticle._id}`);

      // Inject dynamic NewsArticle schema for Google News & Rich Snippets
      let script = document.getElementById('dynamic-article-schema') as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = 'dynamic-article-schema';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.text = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        'headline': activeArticle.title,
        'description': activeArticle.excerpt || activeArticle.title,
        'image': [activeArticle.coverImage || defaultImage],
        'datePublished': activeArticle.publishedAt || new Date().toISOString(),
        'dateModified': activeArticle.publishedAt || new Date().toISOString(),
        'author': [{
          '@type': 'Person',
          'name': activeArticle.author || 'एम्बिशन न्यूज़ रिपोर्टर'
        }],
        'publisher': {
          '@type': 'NewsMediaOrganization',
          'name': 'Ambition News Portal',
          'logo': {
            '@type': 'ImageObject',
            'url': defaultImage
          }
        },
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': `https://ambition-news-portal.vercel.app/?article=${activeArticle._id}`
        }
      });
    } else {
      document.title = defaultTitle;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', defaultDesc);

      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', defaultTitle);

      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', defaultDesc);

      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) ogImage.setAttribute('content', defaultImage);

      const ogUrl = document.querySelector('meta[property="og:url"]');
      if (ogUrl) ogUrl.setAttribute('content', 'https://ambition-news-portal.vercel.app/');

      const existingScript = document.getElementById('dynamic-article-schema');
      if (existingScript) existingScript.remove();
    }
  }, [activeArticle]);

  const handleOpenAdmin = () => {
    setCurrentView('admin');
    window.history.pushState({ view: 'admin' }, '', '/admin');
    loadArticles(true);
  };

  const handleBackToPublic = () => {
    setCurrentView('public');
    window.history.pushState({ view: 'public' }, '', '/');
    loadArticles(false);
  };

  // Switch state and reset district to 'सभी'
  const handleStateChange = (state: 'chhattisgarh' | 'madhya-pradesh') => {
    setSelectedState(state);
    setCurrentDistrict('सभी');
  };

  // Safe navigation & modal opener helpers with browser / Android back gesture integration
  const openArticleModal = (art: Article) => {
    setActiveArticle(art);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('article', art._id);
      window.history.pushState({ modal: 'article', id: art._id }, '', url.toString());
    } catch {}
  };

  const closeArticleModal = () => {
    setActiveArticle(null);
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('article')) {
        url.searchParams.delete('article');
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  };

  const openStoryModal = (s: StoryItem) => {
    setActiveStory(s);
    try {
      window.history.pushState({ modal: 'story', id: s.id }, '');
    } catch {}
  };

  const closeStoryModal = () => {
    setActiveStory(null);
  };

  const openReelModal = (id: string) => {
    setActiveReelId(id);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('reel', id);
      window.history.pushState({ modal: 'reel', id }, '', url.toString());
    } catch {}
  };

  const closeReelModal = () => {
    setActiveReelId(null);
    try {
      const saved = localStorage.getItem('anp_bookmarked_reels');
      if (saved) setSavedReelIds(JSON.parse(saved));
    } catch {}
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('reel')) {
        url.searchParams.delete('reel');
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  };

  const openDistrictModal = () => {
    setShowDistrictModal(true);
    try {
      window.history.pushState({ modal: 'district' }, '');
    } catch {}
  };

  const closeDistrictModal = () => {
    setShowDistrictModal(false);
  };

  // Mobile Hardware / Browser Back-Button Intercept: Dismiss topmost active modal instead of leaving site
  useEffect(() => {
    const handlePopState = () => {
      if (showDistrictModal) {
        setShowDistrictModal(false);
        return;
      }
      if (activeArticle) {
        setActiveArticle(null);
        return;
      }
      if (activeReelId) {
        setActiveReelId(null);
        return;
      }
      if (activeStory) {
        setActiveStory(null);
        return;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showDistrictModal, activeArticle, activeReelId, activeStory]);

  // Initial Deep-linking & horizontal scroll lock reset
  useEffect(() => {
    window.scrollTo({ left: 0, top: 0 });
    try {
      const params = new URLSearchParams(window.location.search);
      const artId = params.get('article');
      if (artId) {
        const found = articles.find(a => a._id === artId);
        if (found) {
          setActiveArticle(found);
        }
      }
      const reelId = params.get('reel');
      if (reelId) {
        setActiveReelId(reelId);
      }
      const tabParam = params.get('tab');
      if (tabParam && ['home', 'videos', 'insta', 'mandi', 'saved'].includes(tabParam)) {
        setActiveTab(tabParam as TabType);
      }
      const stateParam = params.get('state');
      if (stateParam === 'chhattisgarh' || stateParam === 'madhya-pradesh') {
        setSelectedState(stateParam);
      }
      const distParam = params.get('district');
      if (distParam) {
        setCurrentDistrict(distParam);
      }
    } catch {}
  }, [articles]);

  // WhatsApp Share Helper for single article with direct deep-link URL
  const shareWhatsApp = (title: string, articleId?: string) => {
    const url = articleId 
      ? `${window.location.origin}/?article=${encodeURIComponent(articleId)}`
      : window.location.origin;
    const text = `*📰 ${title}*\n\nपूरी खबर Ambition News पर तुरंत यहाँ पढ़ें 👇\n${url}\n\n_कवर्धा की सच्ची व निष्पक्ष आवाज़ — Ambition News_`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    showToast('📲 व्हाट्सएप शेयर लिंक खोला गया');
  };

  // WhatsApp Share Helper for Full App
  const handleShareAppWhatsApp = () => {
    const text = `*Ambition News (कवर्धा) — अब आपके मोबाइल पर!* 📲\n\nछत्तीसगढ़ और मध्यप्रदेश की निष्पक्ष खबरें, लाइव रील्स, वीडियो बुलेटिन और मंडी भाव सीधे फोन में देखें।\n\n👉 *यहाँ क्लिक करके ऐप खोलें:* \n${window.location.origin}\n\n_कवर्धा की सच्ची व निष्पक्ष आवाज़ — Ambition News_`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    showToast('📲 व्हाट्सएप पर ऐप शेयर लिंक खोला गया');
  };

  // Open full article or target feature from Story viewer
  const handleOpenFromStory = (story: StoryItem) => {
    setActiveStory(null);
    if (story.id === 's-mandi') {
      setActiveTab('mandi');
      const el = document.getElementById('mandi-section') || document.getElementById('mandi-rates-table');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (story.id === 's-live') {
      setActiveTab('videos');
      const el = document.getElementById('video-bulletins-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (story.articleId) {
      const art = articles.find(a => a._id === story.articleId);
      if (art) {
        openArticleModal(art);
        return;
      }
    }
    // Fallback: title search
    const found = articles.find(a => a.title.includes(story.title.slice(0, 15)) || story.title.includes(a.title.slice(0, 15)));
    if (found) {
      openArticleModal(found);
    } else if (articles.length > 0) {
      openArticleModal(articles[0]);
    }
  };

  // WhatsApp Share Helper for Web Stories
  const handleShareStoryWhatsApp = (story: StoryItem) => {
    const storyLink = story.articleId 
      ? `${window.location.origin}/?article=${encodeURIComponent(story.articleId)}`
      : window.location.origin;
    const text = `⚡ *Ambition News Web Story*:\n*${story.title}*\n📍 ${story.district} | ${story.category}\n\n👉 *पूरी स्टोरी यहाँ देखें:* \n${storyLink}\n\n_कवर्धा की सच्ची व निष्पक्ष आवाज़ — Ambition News_`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    showToast('📲 व्हाट्सएप पर वेब स्टोरी शेयर लिंक खोला गया');
  };

  // Filtered Articles
  const filteredArticles = articles.filter(art => {
    const matchesState = art.state === selectedState || !art.state;
    const matchesDistrict = currentDistrict === 'सभी' || art.district.includes(currentDistrict) || currentDistrict.includes(art.district);
    const matchesCategory = selectedCategory === 'सभी खबरें' || art.category.includes(selectedCategory.replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '')) || selectedCategory.includes(art.category);
    const matchesSearch = !searchQuery.trim() || art.title.toLowerCase().includes(searchQuery.toLowerCase()) || art.excerpt.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesState && matchesDistrict && matchesCategory && matchesSearch;
  });

  const displayArticles = filteredArticles;
  const heroArticle = displayArticles.length > 0 ? displayArticles[0] : null;
  const gridArticles = displayArticles.length > 1 ? displayArticles.slice(1) : [];
  const breakingList = articles.filter(a => a.isBreaking);

  // Active Monetization / Ad Placements
  const headerAd = ads.find(a => a.placement === 'header_top' && a.isActive);
  const inFeedAd = ads.find(a => a.placement === 'in_feed' && a.isActive);
  const articleAd = ads.find(a => a.placement === 'article_bottom' && a.isActive);

  // Progressive Disclosure: visible count & server-side pagination bridge
  const visibleGridArticles = gridArticles.slice(0, visibleCount - 1);
  const hasMoreArticles = gridArticles.length > visibleGridArticles.length || hasMoreBackend;
  const remainingCount = totalArticlesCount > (visibleGridArticles.length + (heroArticle ? 1 : 0))
    ? Math.max(0, totalArticlesCount - (visibleGridArticles.length + (heroArticle ? 1 : 0)))
    : Math.max(0, gridArticles.length - visibleGridArticles.length);

  // Handle Load More (Seamlessly reveals local buffered articles or fetches next page from MongoDB)
  const handleLoadMore = async () => {
    if (gridArticles.length > visibleGridArticles.length) {
      setVisibleCount(prev => prev + 6);
      return;
    }

    if (hasMoreBackend && !isLoadingMore) {
      const nextPage = currentPage + 1;
      await loadArticles(false, nextPage, true);
      setVisibleCount(prev => prev + 6);
    }
  };

  // Reset visibleCount & pagination when filters change
  useEffect(() => {
    setVisibleCount(7);
    setCurrentPage(1);
  }, [currentDistrict, selectedCategory, selectedState, searchQuery]);

  // Top 5 Trending stories for Sidebar & Mobile Quick Strip
  const trendingArticles = useMemo(() => {
    return [...articles]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);
  }, [articles]);

  // Dynamic Web Stories synthesized from live portal articles, video bulletins & mandi rates
  const currentStoriesList = useMemo(() => {
    return generateStoriesList(articles, videoBulletins[0], mandiRates[0]);
  }, [articles, videoBulletins, mandiRates]);

  // Saved Reels & Combined Total Saved Count
  const savedReelsList = useMemo(() => {
    return instagramPosts.filter(p => !!savedReelIds[p.id]);
  }, [instagramPosts, savedReelIds]);

  const totalSavedCount = savedArticles.length + savedReelsList.length;

  const popularDistricts = selectedState === 'chhattisgarh' ? POPULAR_DISTRICTS_CG : POPULAR_DISTRICTS_MP;

  const adminFallback = (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${
      isDark ? 'bg-[#060911] text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-base font-bold tracking-wide">प्रशासन पोर्टल लोड हो रहा है...</p>
      <p className="text-xs text-stone-500 mt-1">Ambition News Network • Secure Management Console</p>
    </div>
  );

  if (currentView === 'super-admin') {
    return (
      <React.Suspense fallback={adminFallback}>
        <SuperAdminPortal 
          onBackToPublic={handleBackToPublic}
          isDark={isDark}
        />
      </React.Suspense>
    );
  }

  if (currentView === 'admin') {
    return (
      <React.Suspense fallback={adminFallback}>
        <AdminPortal 
          articles={articles}
          districts={districtsList}
          selectedState={selectedState}
          onPublishArticle={handleNewArticleSubmit}
          onUpdateArticle={handleUpdateArticle}
          onDeleteArticle={handleDeleteArticle}
          onBackToPublic={handleBackToPublic}
          isDark={isDark}
          toggleTheme={toggleTheme}
          videos={videoBulletins}
          onAddVideo={handleAddVideo}
          onDeleteVideo={handleDeleteVideo}
          reels={instagramPosts}
          onAddReel={handleAddReel}
          onEditReel={handleEditReel}
          onDeleteReel={handleDeleteReel}
          youtubeChannelId={youtubeChannelId}
          hasYouTubeApiKey={hasYouTubeApiKey}
          onSaveChannelId={handleSaveChannelId}
          onSyncChannel={handleSyncYouTube}
          whatsappLink={whatsappLink}
          onSaveWhatsAppLink={handleSaveWhatsAppLink}
          mandiRates={mandiRates}
          onUpdateMandiRate={handleUpdateMandiRate}
          onAddMandiRate={handleAddMandiRate}
          onDeleteMandiRate={handleDeleteMandiRate}
          reporters={reporters}
          onAddReporter={handleAddReporter}
          onUpdateReporter={handleUpdateReporter}
          onDeleteReporter={handleDeleteReporter}
          youtubeSubs={youtubeSubs}
        />
      </React.Suspense>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-devanagari w-full max-w-full ${
      isDark ? 'bg-[#060911] text-slate-100' : 'bg-slate-50 text-slate-900'
    } ${isMobileDeviceView ? 'bg-[#04060c] py-6 px-2 flex items-center justify-center' : ''}`}>

      {/* Main Wrapper: If Mobile Device Preview Frame is enabled, wrap in iPhone 16 style shell */}
      <div className={`w-full max-w-full flex flex-col flex-1 min-w-0 ${
        isMobileDeviceView 
          ? 'max-w-[430px] rounded-[48px] border-[10px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden relative bg-slate-950 h-[92vh] overflow-y-auto no-scrollbar ring-1 ring-slate-700/50' 
          : ''
      }`}>

        {/* Dynamic Island on Mobile Device View */}
        {isMobileDeviceView && (
          <div className="sticky top-0 z-50 pt-2 pb-1 bg-slate-950/90 backdrop-blur-md flex items-center justify-between px-6 text-[10px] font-bold text-white border-b border-slate-800/40">
            <span>9:41</span>
            <div className="w-24 h-5 bg-black rounded-full flex items-center justify-end px-2 border border-slate-800/80 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span>5G</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Offline Banner Indicator */}
        {isOffline && (
          <div className="bg-amber-500 text-slate-950 font-black px-4 py-1.5 text-xs flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
            <span>📡 आप ऑफलाइन हैं</span>
            <span className="font-semibold text-slate-900">• कैश्ड व स्थानीय खबरें प्रदर्शित हो रही हैं</span>
          </div>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-16 sm:top-20 right-4 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-400 animate-in slide-in-from-top duration-300">
            <CheckCircle2 size={15} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 1. TOP HEADER */}
        <Header 
          isDark={isDark}
          toggleTheme={toggleTheme}
          selectedState={selectedState}
          setSelectedState={handleStateChange}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          onOpenAdminPortal={handleOpenAdmin}
          onShareAppWhatsApp={handleShareAppWhatsApp}
          backendSynced={backendSynced}
          isMobileDeviceView={isMobileDeviceView}
          toggleDeviceView={() => setIsMobileDeviceView(!isMobileDeviceView)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          savedCount={totalSavedCount}
          onToggleSearch={() => setIsSearching(prev => !prev)}
          onOpenDistrictPicker={openDistrictModal}
          onOpenReporterModal={() => setShowReporterModal(true)}
          whatsappLink={whatsappLink}
          youtubeSubs={youtubeSubs}
        />

        {/* 2. BREAKING NEWS & SURKHIYAN TICKER (NEVER DISAPPEARS) */}
        <BreakingTicker 
          breakingArticles={breakingList}
          topArticles={displayArticles}
          onSelectArticle={(art) => openArticleModal(art)}
        />

        {/* 2.1 TOP HEADER SPONSORED AD BANNER (IF ACTIVE) */}
        {headerAd && (
          <AdBanner 
            ad={headerAd} 
            placement="header_top" 
            isDark={isDark} 
            onContactWhatsApp={() => {
              window.open(`https://api.whatsapp.com/send?phone=917000139694&text=${encodeURIComponent('नमस्ते Ambition News, मुझे अपने प्रतिष्ठान का टॉप हेडर बैनर विज्ञापन पोर्टल पर लगवाना है।')}`, '_blank');
            }}
          />
        )}

        {/* 3. NATIVE STORIES TRAY (INSTAGRAM / INSHORTS STYLE WEB STORIES) */}
        <div className={`w-full max-w-full overflow-hidden px-3 sm:px-4 pt-3 pb-1 border-b transition-colors ${
          isDark ? 'bg-slate-950/60 border-slate-800/60' : 'bg-white border-slate-200'
        }`}>
          <div className="max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between px-1 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Sparkles size={11} className="text-amber-400" />
                <span>वेब स्टोरीज़ • कवर्धा व शीर्ष सुर्खियां</span>
              </span>
              <span className="text-[10px] text-red-500 font-bold">24h लाइव</span>
            </div>
            <StoriesTray 
              onSelectStory={(s) => openStoryModal(s)} 
              isDark={isDark} 
              stories={currentStoriesList}
              articles={articles} 
              latestVideo={videoBulletins[0]} 
              topMandiRate={mandiRates[0]} 
            />
          </div>
        </div>

        {/* 4. MAIN CONTENT CONTAINER (PADDED BOTTOM FOR NATIVE BOTTOM NAV) */}
        <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 flex-1 w-full max-w-full min-w-0 space-y-6 pb-28">

          {/* Semantic Top-Level H1 for WCAG & Agentic Browsing Heading Hierarchy */}
          <h1 className="sr-only">एम्बिशन न्यूज़ — कवर्धा (कबीरधाम) • छत्तीसगढ़ एवं मध्यप्रदेश डिजिटल न्यूज़ नेटवर्क</h1>

          {/* TAB: SAVED ARTICLES & REELS VIEW */}
          {activeTab === 'saved' && (
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
                      className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-400 font-bold px-2.5 py-1 rounded-lg border border-rose-500/30 hover:bg-rose-500/10 transition active:scale-95"
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
                    className={`px-3.5 py-1.5 rounded-full font-bold transition flex items-center gap-1.5 shrink-0 ${
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
                    className={`px-3.5 py-1.5 rounded-full font-bold transition flex items-center gap-1.5 shrink-0 ${
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
                    className={`px-3.5 py-1.5 rounded-full font-bold transition flex items-center gap-1.5 shrink-0 ${
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
                              className={`p-3 sm:p-3.5 rounded-2xl border flex gap-3 cursor-pointer group transition-all hover:-translate-y-0.5 ${
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
                                    (e.target as HTMLImageElement).src = '/logo.png';
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
                                      className="p-1 rounded hover:bg-emerald-500/20 text-emerald-500 transition"
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
                                      className="inline-flex items-center gap-0.5 text-rose-500 hover:text-rose-400 font-bold text-[11px] p-1 rounded hover:bg-rose-500/10 transition"
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
                              src={reel.imageUrl}
                              alt={reel.caption}
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/logo.png';
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
                                className="p-1.5 rounded-full bg-black/70 text-slate-300 hover:text-rose-400 hover:bg-black transition active:scale-90"
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
          )}

          {/* TAB: VIDEOS ONLY VIEW */}
          {activeTab === 'videos' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Broadcast Channel Header Banner */}
              <div className={`p-4 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                isDark 
                  ? 'bg-gradient-to-r from-red-950/60 via-slate-900 to-black border-red-900/40 shadow-lg' 
                  : 'bg-gradient-to-r from-red-50 via-white to-red-50 border-red-200 shadow-sm'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30 shrink-0">
                    <YoutubeIcon size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Ambition TV Digital
                      </h2>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                        LIVE
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      कवर्धा व मध्य प्रदेश-छत्तीसगढ़ का विश्वसनीय वीडियो न्यूज़ नेटवर्क • {SOCIAL_LINKS.youtubeSubs}
                    </p>
                  </div>
                </div>

                <a 
                  href={SOCIAL_LINKS.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="एम्बिशन न्यूज़ आधिकारिक यूट्यूब चैनल खोलें"
                  className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md transition active:scale-95 shrink-0"
                >
                  <YoutubeIcon size={16} />
                  <span>यूट्यूब चैनल खोलें</span>
                </a>
              </div>

              <VideoSection 
                bulletins={videoBulletins} 
                isDark={isDark} 
                youtubeSubs={youtubeSubs}
                onShareWhatsApp={(title, url) => {
                  const text = `🔴 *Ambition TV • विशेष वीडियो बुलेटिन*:\n${title}\n\n▶️ तुरंत यहाँ देखें:\n${url || window.location.origin}`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                }}
              />
            </div>
          )}

          {/* TAB: INSTAGRAM ONLY VIEW */}
          {activeTab === 'insta' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <InstagramSection 
                posts={instagramPosts} 
                onSelectReel={(id) => setActiveReelId(id)}
                isDark={isDark} 
              />
            </div>
          )}

          {/* TAB: MANDI ONLY VIEW */}
          {activeTab === 'mandi' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 pb-2">
                <span className="text-emerald-500 font-black text-lg">🌾</span>
                <h2 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  कवर्धा व क्षेत्रीय कृषि मंडी भाव
                </h2>
              </div>
              <MandiWidget rates={mandiRates} isDark={isDark} />
              
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <h3 className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                  <TrendingUp size={14} />
                  <span>कवर्धा गुड़ मंडी विशेष रिपोर्ट</span>
                </h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  कबीरधाम (कवर्धा) जिले की कृषि उपज मंडी में इस सप्ताह गन्ने के रस से तैयार नए देसी गुड़ की आवक में 30% की बढ़ोतरी दर्ज की गई। स्थानीय मिलों व बाहर से आए व्यापारियों ने ₹3,450 से ₹3,550/क्विंटल की औसत दर पर खरीद की। किसानों को समय पर भुगतान हेतु मंडी प्रशासन ने डिजिटल पर्ची प्रणाली अनिवार्य की है।
                </p>
              </div>
            </div>
          )}

          {/* TAB: HOME FEED VIEW (DEFAULT) */}
          {activeTab === 'home' && (
            <>
              {/* REGIONAL DISTRICT QUICK CHIPS BAR */}
              <div className={`p-3 sm:p-4 rounded-2xl border transition-colors ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                  
                  {/* Left: District & Quick Search */}
                  <div className="flex items-center justify-between gap-2">
                    <div 
                      onClick={openDistrictModal}
                      className="flex items-center gap-2 cursor-pointer group"
                      title="सभी 88 जिलों की सूची खोलें"
                    >
                      <div className="w-7 h-7 rounded-lg bg-red-600/10 text-red-500 flex items-center justify-center shrink-0 group-hover:bg-red-600 group-hover:text-white transition">
                        <MapPin size={16} />
                      </div>
                      <div>
                        <div className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          <span>जिला अनुसार ({selectedState === 'chhattisgarh' ? 'छ.ग.' : 'म.प्र.'})</span>
                          <span className="text-red-500 underline text-[9px]">बदलें</span>
                        </div>
                        <div className={`text-xs sm:text-sm font-black flex items-center gap-1 ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          <span>{currentDistrict === 'सभी' ? 'सभी 88 जिले' : currentDistrict}</span>
                          {currentDistrict.includes('कवर्धा') && (
                            <span className="bg-amber-500/20 text-amber-500 text-[9px] font-black px-1.5 rounded border border-amber-500/30">
                              मुख्यालय
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Search Bar Toggle */}
                    <button 
                      onClick={() => setIsSearching(!isSearching)}
                      aria-label={isSearching ? "समाचार खोज बंद करें" : "समाचार खोज बार खोलें"}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        isSearching 
                          ? 'bg-red-600 text-white border-red-500' 
                          : isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                      title="Search articles"
                    >
                      <Search size={14} />
                    </button>
                  </div>

                  {/* Inline Search Input if open */}
                  {isSearching && (
                    <div className="w-full md:w-64 animate-in fade-in relative">
                      <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="खबरें खोजें (जैसे: कवर्धा, बोनस)..."
                        aria-label="समाचार खोजें"
                        className={`w-full border rounded-xl pl-3 pr-8 py-1.5 text-xs outline-none focus:border-red-500 font-medium ${
                          isDark 
                            ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' 
                            : 'bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-400'
                        }`}
                        autoFocus
                      />
                      {isVoiceSupported && (
                        <button
                          type="button"
                          onClick={toggleVoiceSearch}
                          aria-label={isListeningSearch ? "बोलकर खोज बंद करें" : "बोलकर खबर खोजें"}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center transition ${
                            isListeningSearch 
                              ? 'text-red-500 animate-pulse' 
                              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                          }`}
                          title="बोलकर खबर खोजें (Voice Search)"
                        >
                          <Mic size={13} className={isListeningSearch ? 'animate-bounce text-red-500' : ''} />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Quick District Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 text-xs max-w-full">
                    <button 
                      onClick={openDistrictModal}
                      aria-label="छत्तीसगढ़ व मध्यप्रदेश के सभी 88 जिले चुनें"
                      className="px-2.5 py-1 rounded-xl text-[11px] font-black transition whitespace-nowrap flex items-center gap-1 bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30 active:scale-95 border border-red-400/40 shrink-0"
                      title="छत्तीसगढ़ व मध्यप्रदेश के सभी 88 जिले देखें"
                    >
                      <MapPin size={11} className="shrink-0" />
                      <span>सभी 88 जिले...</span>
                    </button>
                    <button 
                      onClick={() => setCurrentDistrict('सभी')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                        currentDistrict === 'सभी' 
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/30' 
                          : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      सभी
                    </button>
                    {popularDistricts.map((dName) => (
                      <button
                        key={dName}
                        onClick={() => setCurrentDistrict(dName)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition whitespace-nowrap flex items-center gap-1 ${
                          currentDistrict === dName 
                            ? 'bg-red-600 text-white shadow-md shadow-red-600/30' 
                            : dName.includes('कवर्धा')
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30'
                              : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {dName.includes('कवर्धा') && <span>📍</span>}
                        <span>{dName}</span>
                      </button>
                    ))}
                  </div>

                </div>
              </div>

              {/* MANDI BHAV COMPACT BAR (Streamlined for immediate Above-the-Fold news consumption) */}
              <MandiWidget 
                rates={mandiRates} 
                isDark={isDark} 
                compact 
                onViewFull={() => setActiveTab('mandi')} 
              />

              {/* FEED HEADER */}
              <div id="news-feed-section" className="flex items-center justify-between pt-1 scroll-mt-28">
                <div className="flex items-center gap-2">
                  <span className="text-red-500 text-lg">⚡</span>
                  <h2 className={`text-sm sm:text-base font-black tracking-wide ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {currentDistrict === 'सभी' ? 'मुख्य समाचार फ़ीड' : `${currentDistrict} की खबरें`}
                  </h2>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}>
                    {displayArticles.length}
                  </span>
                </div>

                <button 
                  onClick={() => loadArticles()} 
                  className={`text-[11px] flex items-center gap-1 border px-2.5 py-1 rounded-xl transition cursor-pointer active:scale-95 ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-white border-slate-300 text-slate-600 hover:text-slate-900 shadow-sm'
                  }`}
                  title="ताज़ा खबरें रीफ्रेश करें"
                >
                  <RefreshCw size={11} className={isLoading ? 'animate-spin text-red-500' : ''} />
                  <span>अपडेट</span>
                </button>
              </div>

              {/* ZERO ARTICLES EMPTY STATE (Edge Case: District or search has 0 results) */}
              {isLoading && displayArticles.length === 0 ? (
                <div className="space-y-4 animate-pulse my-2">
                  <div className={`h-64 sm:h-80 rounded-3xl ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-slate-200'}`}></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={`h-48 rounded-2xl ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-slate-200'}`}></div>
                    <div className={`h-48 rounded-2xl ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-slate-200'}`}></div>
                  </div>
                </div>
              ) : displayArticles.length === 0 ? (
                <div className={`p-8 sm:p-12 rounded-3xl border text-center space-y-4 my-2 animate-in fade-in duration-300 ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="w-16 h-16 rounded-3xl bg-red-600/10 text-red-500 mx-auto flex items-center justify-center shadow-inner">
                    <MapPinOff size={32} />
                  </div>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <h3 className={`text-base sm:text-lg font-black ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {searchQuery 
                        ? 'खोज परिणाम नहीं मिले' 
                        : currentDistrict === 'सभी' 
                          ? 'कोई खबर उपलब्ध नहीं है' 
                          : `${currentDistrict} में अभी कोई खबर प्रकाशित नहीं हुई`}
                    </h3>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {searchQuery 
                        ? `"${searchQuery}" से संबंधित कोई समाचार नहीं मिला। कृपया अन्य कीवर्ड लिखकर पुनः खोजें।`
                        : `हमारा क्षेत्रीय संवाददाता नेटवर्क ${currentDistrict === 'सभी' ? 'क्षेत्र' : currentDistrict} की ताज़ा खबरों को एकत्र कर रहा है। क्या आपके पास इस क्षेत्र की कोई सूचना, वीडियो या खबर है?`}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    {searchQuery ? (
                      <button
                        onClick={() => setSearchQuery('')}
                        aria-label="खोज रीसेट करें"
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                      >
                        खोज रीसेट करें
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setShowReporterModal(true)}
                          aria-label="फ़ील्ड रिपोर्टर पोर्टल खोलें और खबर भेजें"
                          className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>📢</span>
                          <span>{currentDistrict === 'सभी' ? 'खबर भेजें' : `${currentDistrict} से खबर भेजें`}</span>
                        </button>
                        <button
                          onClick={() => {
                            setCurrentDistrict('सभी');
                            setSelectedCategory('सभी खबरें');
                          }}
                          aria-label="सभी 88 जिलों की ताज़ा खबरें देखें"
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2 rounded-xl border border-slate-700 transition cursor-pointer"
                        >
                          सभी 88 जिलों की खबरें देखें
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                /* HERO LEAD ARTICLE & NATIVE FEED CARDS WITH STICKY SIDEBAR */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  
                  {/* Main Feed Column */}
                  <div className="lg:col-span-2 space-y-4">
                    
                    {/* HERO ARTICLE (EDGE-TO-EDGE ON MOBILE) */}
                    {heroArticle && (
                      <div 
                        onClick={() => openArticleModal(heroArticle)}
                        className={`rounded-3xl border overflow-hidden cursor-pointer group shadow-xl transition-colors duration-150 ${
                          isDark ? 'bg-slate-900 border-slate-800 hover:border-red-600/70' : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="relative h-64 sm:h-96 w-full overflow-hidden bg-slate-950">
                          <img 
                            src={getOptimizedImageUrl(heroArticle.coverImage, 'hero')} 
                            alt={heroArticle.title} 
                            // @ts-ignore
                            fetchpriority="high"
                            loading="eager"
                            decoding="async"
                            width="800"
                            height="450"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getSmartCoverImage('', heroArticle.category, heroArticle.title, heroArticle.district);
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                          />
                          
                          {/* Top Badges */}
                          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                            <span className="bg-red-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-lg shadow-lg flex items-center gap-1">
                              <Flame size={12} /> मुख्य समाचार
                            </span>
                            <span className="bg-black/75 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded-lg border border-white/20">
                              📍 {heroArticle.district}
                            </span>
                          </div>

                          {/* Bookmark Button on Hero */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(heroArticle);
                            }}
                            aria-label={savedArticles.some(a => a._id === heroArticle._id) ? "खबर सेव्ड लिस्ट से हटाएं" : "यह खबर बाद में पढ़ने के लिए सेव करें"}
                            className="absolute top-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur text-white hover:text-amber-400 transition"
                            title="खबर सेव करें"
                          >
                            <Bookmark size={15} className={savedArticles.some(a => a._id === heroArticle._id) ? 'fill-amber-400 text-amber-400' : ''} />
                          </button>

                          {/* Bottom Gradient with Headline */}
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent p-4 sm:p-6">
                            <div className="flex items-center gap-2 mb-1.5 text-[10px] sm:text-xs">
                              <span className="text-orange-400 font-black uppercase tracking-wider">
                                {heroArticle.category}
                              </span>
                              <span className="text-slate-300 flex items-center gap-1">
                                <Clock size={11} className="text-red-400" />
                                <span>{formatRelativeHindiTime(heroArticle.publishedAt)}</span>
                              </span>
                              <span className="text-slate-300 hidden sm:inline">
                                • {estimateReadingTime(heroArticle.content || heroArticle.excerpt)}
                              </span>
                            </div>

                            <h3 className="text-base sm:text-2xl font-black text-white leading-snug group-hover:text-red-400 transition-colors">
                              {heroArticle.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 line-clamp-2 leading-relaxed hidden sm:block">
                              {heroArticle.excerpt}
                            </p>

                            {/* Action row */}
                            <div className="mt-3 pt-2.5 flex items-center justify-between text-xs text-slate-300 border-t border-slate-800/80">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-medium text-slate-300">✍️ {heroArticle.author}</span>
                                {heroArticle.views && (
                                  <span className="text-[10px] text-slate-300 hidden sm:flex items-center gap-0.5">
                                    <Eye size={10} />
                                    <span>{formatHindiViews(heroArticle.views)}</span>
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    shareWhatsApp(heroArticle.title, heroArticle._id);
                                  }}
                                  aria-label="यह मुख्य खबर व्हाट्सएप पर शेयर करें"
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 text-[11px] transition active:scale-95 cursor-pointer"
                                  title="व्हाट्सएप पर शेयर करें"
                                >
                                  <WhatsAppIcon size={12} />
                                  <span>शेयर</span>
                                </button>
                                <span className="text-red-400 font-bold flex items-center gap-0.5 text-xs">
                                  <span>पढ़ें</span>
                                  <ChevronRight size={13} />
                                </span>
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>
                    )}

                    {/* MOBILE-ONLY QUICK TOP 5 SURKHIYAN HORIZONTAL SWIPEABLE STRIP */}
                    {trendingArticles.length > 0 && (
                      <div className={`lg:hidden p-3 rounded-2xl border transition-colors ${
                        isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5 text-xs font-black">
                            <Flame size={13} className="text-amber-400 animate-pulse" />
                            <span className={isDark ? 'text-white' : 'text-slate-900'}>🔥 आज की 5 बड़ी सुर्खियां</span>
                          </div>
                          <span className="text-[10px] text-red-500 font-bold bg-red-950/40 border border-red-900/40 px-1.5 py-0.5 rounded">
                            ट्रेंडिंग
                          </span>
                        </div>
                        <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
                          {trendingArticles.map((tArt, idx) => (
                            <div
                              key={tArt._id}
                              onClick={() => openArticleModal(tArt)}
                              className={`shrink-0 w-64 p-2.5 rounded-xl border flex items-start gap-2 cursor-pointer transition active:scale-95 ${
                                isDark ? 'bg-slate-950/90 border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                                idx === 0 
                                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950' 
                                  : idx === 1 
                                  ? 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-950' 
                                  : idx === 2 
                                  ? 'bg-gradient-to-r from-amber-700 to-amber-600 text-white' 
                                  : 'bg-slate-800 text-slate-300'
                              }`}>
                                #{idx + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <span className="text-[9px] text-red-500 font-bold block truncate">
                                  {tArt.district}
                                </span>
                                <h4 className={`text-[11px] font-bold line-clamp-2 leading-tight mt-0.5 ${
                                  isDark ? 'text-white' : 'text-slate-900'
                                }`}>
                                  {tArt.title}
                                </h4>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* REST OF FEED CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {visibleGridArticles.map((art, idx) => (
                        <React.Fragment key={art._id}>
                          <div 
                            onClick={() => openArticleModal(art)}
                            className={`p-3.5 rounded-2xl border flex flex-col justify-between cursor-pointer group transition-colors duration-150 ${
                              isDark ? 'bg-slate-900 border-slate-800 hover:border-red-600/60' : 'bg-white border-slate-200 shadow-sm'
                            }`}
                          >
                            <div>
                              <div className="flex justify-between items-center text-xs text-red-400 font-bold mb-1.5">
                                <span className="bg-red-950/40 border border-red-900/60 px-2 py-0.5 rounded text-[10px]">
                                  {art.category}
                                </span>
                                <div className={`flex items-center gap-1.5 text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                                  <span className={`flex items-center gap-0.5 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                                    <Clock size={10} className="text-red-500" />
                                    <span>{formatRelativeHindiTime(art.publishedAt)}</span>
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-0.5">
                                    <MapPin size={10} className="text-red-600" /> {art.district}
                                  </span>
                                </div>
                              </div>

                              <h3 className={`text-xs sm:text-sm font-bold leading-snug line-clamp-2 transition-colors ${
                                isDark ? 'text-slate-100 group-hover:text-red-400' : 'text-slate-900 group-hover:text-red-700'
                              }`}>
                                {art.title}
                              </h3>

                              <p className={`text-[11px] mt-1.5 line-clamp-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                                {art.excerpt}
                              </p>
                            </div>

                            <div className={`mt-3 pt-2 border-t flex items-center justify-between text-xs ${
                              isDark ? 'border-slate-800/60 text-slate-400' : 'border-slate-200 text-slate-700'
                            }`}>
                              <span className="text-[10px] truncate max-w-[120px]">
                                ✍️ {art.author}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] hidden sm:inline ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                                  {estimateReadingTime(art.content || art.excerpt)}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleBookmark(art);
                                  }}
                                  aria-label={savedArticles.some(a => a._id === art._id) ? "खबर सेव्ड लिस्ट से हटाएं" : "यह खबर बाद में पढ़ने के लिए सेव करें"}
                                  className={`${isDark ? 'text-slate-400' : 'text-slate-600'} hover:text-amber-500 transition cursor-pointer`}
                                  title="सेव करें"
                                >
                                  <Bookmark size={13} className={savedArticles.some(a => a._id === art._id) ? 'fill-amber-400 text-amber-400' : ''} />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    shareWhatsApp(art.title, art._id);
                                  }}
                                  aria-label="यह खबर व्हाट्सएप पर शेयर करें"
                                  className="text-emerald-400 font-bold flex items-center gap-0.5 text-[11px] transition active:scale-95 cursor-pointer"
                                  title="व्हाट्सएप पर शेयर करें"
                                >
                                  <WhatsAppIcon size={11} />
                                  <span>शेयर</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* DYNAMIC SPONSORED IN-FEED AD BANNER (LIVE OR FALLBACK INVITATION) */}
                          {idx === 3 && (
                            <div className="col-span-1 sm:col-span-2 my-1">
                              <AdBanner 
                                ad={inFeedAd} 
                                placement="in_feed" 
                                isDark={isDark} 
                                onContactWhatsApp={() => {
                                  window.open(`https://api.whatsapp.com/send?phone=917000139694&text=${encodeURIComponent('नमस्ते Ambition News, मुझे अपने प्रतिष्ठान / व्यवसाय का विज्ञापन व कवरेज पोर्टल पर प्रकाशित करवाना है।')}`, '_blank');
                                }}
                              />
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* PROGRESSIVE DISCLOSURE / LOAD MORE BUTTON */}
                    {hasMoreArticles && (
                      <div className="pt-2 text-center">
                        <button
                          onClick={handleLoadMore}
                          disabled={isLoadingMore}
                          className={`border font-bold text-xs px-5 py-2.5 rounded-2xl shadow-md transition active:scale-95 flex items-center gap-2 mx-auto cursor-pointer disabled:opacity-60 ${
                            isDark 
                              ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200 hover:text-white' 
                              : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 hover:text-slate-950'
                          }`}
                        >
                          {isLoadingMore ? (
                            <>
                              <Loader2 size={14} className="text-red-500 animate-spin" />
                              <span>अगला पेज लोड हो रहा है...</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown size={14} className="text-red-500 animate-bounce" />
                              <span>और खबरें देखें {remainingCount > 0 ? `(${remainingCount} और उपलब्ध)` : ''}</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {!hasMoreArticles && (displayArticles.length > 6 || totalArticlesCount > 6) && (
                      <div className="pt-4 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
                        <span>✓</span>
                        <span>आपने {totalArticlesCount || displayArticles.length} की सभी ताज़ा खबरें पढ़ ली हैं</span>
                      </div>
                    )}

                  </div>

                  {/* Sidebar Column (Sticky on Desktop) */}
                  <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
                    
                    {/* 1. TOP 5 TRENDING STORIES WIDGET */}
                    <div className={`p-3.5 rounded-2xl border ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                    }`}>
                      <div className={`flex items-center justify-between mb-3 pb-2 border-b ${
                        isDark ? 'border-slate-800' : 'border-slate-200'
                      }`}>
                        <div className={`flex items-center gap-1.5 text-xs font-black ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          <Flame size={14} className="text-amber-400 animate-pulse" />
                          <span>🔥 ट्रेंडिंग खबरें (टॉप 5)</span>
                        </div>
                        <span className="text-[10px] bg-red-950/60 text-red-400 font-bold px-1.5 py-0.5 rounded border border-red-800/60">
                          सबसे ज्यादा पढ़ी गई
                        </span>
                      </div>

                      <div className="space-y-3">
                        {trendingArticles.map((tArt, idx) => {
                          const badgeColors = [
                            'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950', // #1 Gold
                            'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-950',  // #2 Silver
                            'bg-gradient-to-r from-amber-700 to-amber-600 text-white',      // #3 Bronze
                            'bg-slate-800 text-slate-300 border border-slate-700',          // #4
                            'bg-slate-800 text-slate-300 border border-slate-700'           // #5
                          ];
                          return (
                            <div
                              key={tArt._id}
                              onClick={() => openArticleModal(tArt)}
                              className={`flex items-start gap-2.5 cursor-pointer group pb-2.5 border-b last:border-b-0 last:pb-0 ${
                                isDark ? 'border-slate-800/40' : 'border-slate-100'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm mt-0.5 ${badgeColors[idx] || badgeColors[3]}`}>
                                {idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`flex items-center gap-1.5 text-[10px] mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                  <span className="font-bold text-red-500">{tArt.district}</span>
                                  <span>•</span>
                                  <span>{formatRelativeHindiTime(tArt.publishedAt)}</span>
                                </div>
                                <h4 className={`text-xs font-bold transition-colors line-clamp-2 leading-snug ${
                                  isDark ? 'text-slate-200 group-hover:text-red-400' : 'text-slate-800 group-hover:text-red-600'
                                }`}>
                                  {tArt.title}
                                </h4>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. WhatsApp News Group & Community Join Card (High Conversion CTA) */}
                    <div className={`p-3.5 rounded-2xl border transition-all ${
                      isDark 
                        ? 'bg-gradient-to-br from-emerald-950/50 via-slate-900 to-slate-900 border-emerald-800/60 shadow-lg shadow-emerald-950/20' 
                        : 'bg-emerald-50/80 border-emerald-200 shadow-sm'
                    }`}>
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30 shrink-0">
                          <WhatsAppIcon size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={`text-xs font-black flex items-center gap-1.5 ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}>
                            <span>व्हाट्सएप न्यूज़ ग्रुप</span>
                            <span className="bg-emerald-500/20 text-emerald-500 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/40">
                              लाइव
                            </span>
                          </div>
                          <div className="text-[10px] text-emerald-500 font-medium truncate">
                            कवर्धा व CG-MP 88 जिला बुलेटिन
                          </div>
                        </div>
                      </div>

                      <p className={`text-[11px] mb-3 leading-relaxed ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        कवर्धा, मंडी भाव, सरकारी योजनाएं और प्रदेश की बड़ी खबरें तुरंत अपने फोन पर पाने के लिए ग्रुप में शामिल हों।
                      </p>

                      <a 
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="एम्बिशन न्यूज़ आधिकारिक व्हाट्सएप ग्रुप से जुड़ें"
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40 transition active:scale-95 cursor-pointer"
                      >
                        <WhatsAppIcon size={14} />
                        <span>ग्रुप से जुड़ें (Join Group)</span>
                      </a>
                    </div>
                  
                  {/* YouTube Bulletin Card */}
                  <div className={`p-3.5 rounded-2xl border ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="p-1 rounded bg-red-600 text-white">
                          <YoutubeIcon size={13} />
                        </div>
                        <span className={`text-xs font-bold ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          Ambition TV (यूट्यूब)
                        </span>
                      </div>
                      <span className="text-[9px] bg-red-950 text-red-300 font-bold px-1.5 py-0.5 rounded border border-red-800">
                        {SOCIAL_LINKS.youtubeSubs}
                      </span>
                    </div>

                    <div 
                      className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-red-950/90 border border-red-900/40 cursor-pointer group shadow-md"
                      onClick={() => window.open(SOCIAL_LINKS.youtube, '_blank')}
                    >
                      {/* Ambient Studio Lighting Glow */}
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-600/20 via-transparent to-transparent opacity-70 group-hover:opacity-100 transition duration-500"></div>

                      {/* Official Ambition Logo Center Backdrop */}
                      <div className="absolute inset-0 flex items-center justify-center p-3">
                        <img 
                          src="/logo.png" 
                          alt="Ambition TV Logo"
                          loading="lazy"
                          decoding="async"
                          width="96"
                          height="96"
                          className="w-24 h-24 object-contain drop-shadow-[0_4px_16px_rgba(220,38,38,0.5)] group-hover:scale-110 transition duration-500" 
                        />
                      </div>

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10 pointer-events-none">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-600 text-white shadow-lg animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                          LIVE TV
                        </span>
                        <span className="text-[9px] font-black tracking-widest text-amber-400 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded border border-amber-500/30">
                          HD 1080p
                        </span>
                      </div>

                      {/* Central Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        <div className="w-11 h-11 bg-red-600/95 group-hover:bg-red-500 rounded-full flex items-center justify-center shadow-xl shadow-red-600/50 group-hover:scale-110 transition duration-300 border-2 border-white/80">
                          <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[11px] border-l-white ml-0.5"></div>
                        </div>
                      </div>

                      {/* Bottom Title Banner */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent p-2.5 pt-6 text-center z-10">
                        <p className="text-white text-[11px] font-extrabold tracking-wide drop-shadow line-clamp-1">
                          कवर्धा व CG-MP का महाबुलेटिन
                        </p>
                        <p className="text-amber-400 text-[9px] font-medium tracking-wider flex items-center justify-center gap-1 mt-0.5">
                          <span>Ambition News</span> • <span>24x7 डिजिटल प्रसारण</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5">
                      <a 
                        href={SOCIAL_LINKS.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="एम्बिशन न्यूज़ आधिकारिक यूट्यूब चैनल खोलें"
                        className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 shadow transition"
                      >
                        <YoutubeIcon size={13} />
                        <span>चैनल खोलें (@ambition_news)</span>
                      </a>
                    </div>
                  </div>

                  {/* Instagram Follow Card */}
                  <div className={`p-3.5 rounded-2xl border ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 shrink-0">
                        <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden p-0.5">
                          <img src="/logo.png" alt="Ambition News Logo" loading="lazy" decoding="async" width="36" height="36" className="w-full h-full object-cover rounded-full" />
                        </div>
                      </div>
                      <div>
                        <div className={`text-xs font-bold flex items-center gap-1 ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          <span>Ambition news</span>
                          <span className="text-[9px] bg-pink-950/60 text-pink-400 px-1 rounded border border-pink-800/60">कवर्धा</span>
                        </div>
                        <div className="text-[10px] text-pink-400 font-mono font-medium">
                          {SOCIAL_LINKS.instagramHandle}
                        </div>
                      </div>
                    </div>

                    <p className={`text-[11px] mb-2.5 leading-relaxed ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      कवर्धा की ताज़ा तस्वीरें, रील्स व त्वरित अपडेट सीधे इंस्टाग्राम पर देखें।
                    </p>

                    <div className="flex gap-2">
                      <a 
                        href={SOCIAL_LINKS.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="एम्बिशन न्यूज़ आधिकारिक इंस्टाग्राम प्रोफाइल खोलें"
                        className="flex-1 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 shadow"
                      >
                        <InstagramIcon size={13} />
                        <span>इंस्टाग्राम</span>
                      </a>
                      <a 
                        href={SOCIAL_LINKS.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="एम्बिशन न्यूज़ आधिकारिक फेसबुक पेज खोलें"
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 shadow transition"
                      >
                        <FacebookIcon size={13} />
                        <span>फेसबुक पेज</span>
                      </a>
                    </div>
                  </div>

                  {/* PWA App Install Banner */}
                  <div className={`p-3.5 rounded-2xl border text-center space-y-2 ${
                    isDark 
                      ? 'border-red-800/60 bg-gradient-to-br from-red-950/40 via-slate-900 to-slate-900' 
                      : 'border-red-200 bg-gradient-to-br from-red-50 via-white to-rose-50 shadow-sm'
                  }`}>
                    <Download size={18} className="mx-auto text-red-500" />
                    <div className={`text-xs font-bold ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>Ambition PWA ऐप लगाएं</div>
                    <p className={`text-[10px] leading-relaxed ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      बिना प्ले स्टोर के सीधे फोन में लगाएं। 2G पर भी चलेगा।
                    </p>
                    <div className="flex flex-col gap-1.5 pt-1">
                      <button 
                        onClick={() => showToast('📲 PWA इंस्टॉलेशन प्रॉम्प्ट सक्रिय हुआ (डेमो)')}
                        aria-label="एम्बिशन न्यूज़ PWA ऐप होम स्क्रीन पर जोड़ें"
                        className={`w-full font-bold text-xs py-1.5 rounded-xl shadow transition ${
                          isDark 
                            ? 'bg-white text-slate-900 hover:bg-slate-100' 
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        + Home Screen पर जोड़ें
                      </button>
                      <button 
                        onClick={handleShareAppWhatsApp}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-1.5 rounded-xl shadow transition flex items-center justify-center gap-1.5"
                      >
                        <WhatsAppIcon size={12} />
                        <span>व्हाट्सएप पर ऐप शेयर करें</span>
                      </button>
                    </div>
                  </div>

                </aside>

              </div>
            )}

              {/* DEDICATED YOUTUBE BULLETINS SECTION */}
              <VideoSection 
                bulletins={videoBulletins} 
                isDark={isDark} 
                youtubeSubs={youtubeSubs}
                onShareWhatsApp={(title, url) => {
                  const text = `🔴 *Ambition TV • विशेष वीडियो बुलेटिन*:\n${title}\n\n▶️ तुरंत यहाँ देखें:\n${url || window.location.origin}`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                }}
              />

              {/* DEDICATED INSTAGRAM KAWARDHA SECTION */}
              <InstagramSection 
                posts={instagramPosts} 
                onSelectReel={(id) => openReelModal(id)}
                isDark={isDark} 
              />
            </>
          )}

        </main>

        {/* 5. FOOTER */}
        <Footer 
          isDark={isDark} 
          onOpenAdminPortal={handleOpenAdmin}
          onOpenReporterModal={() => setShowReporterModal(true)}
          onOpenCompliance={setComplianceModalTab}
          whatsappLink={whatsappLink}
          youtubeSubs={youtubeSubs}
        />

        {/* 6. NATIVE BOTTOM NAVIGATION BAR */}
        <BottomNav 
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'insta') {
              openReelModal(instagramPosts[0]?.id || '1');
            }
          }}
          savedCount={totalSavedCount}
          isDark={isDark}
        />

        {/* FLOATING BACK TO TOP BUTTON WITH CIRCULAR READING PROGRESS RING */}
        <BackToTop />

        {/* PWA INSTALL PROMPT (SHORT & SWEET IF NOT INSTALLED) */}
        <PwaInstallPrompt onShareWhatsApp={handleShareAppWhatsApp} />

        {/* 7. FULL ARTICLE READER BOTTOM SHEET / MODAL */}
        {activeArticle && (
          <ArticleModal 
            article={activeArticle}
            onClose={closeArticleModal}
            onShareWhatsApp={shareWhatsApp}
            isDark={isDark}
            isBookmarked={savedArticles.some(a => a._id === activeArticle._id)}
            onToggleBookmark={toggleBookmark}
            ad={articleAd}
          />
        )}

        {/* 8. INSTAGRAM / INSHORTS FULLSCREEN STORY VIEWER */}
        {activeStory && (
          <StoryViewerModal 
            initialStory={activeStory}
            stories={currentStoriesList}
            onClose={closeStoryModal}
            onReadFullArticle={handleOpenFromStory}
            onShareWhatsApp={handleShareStoryWhatsApp}
            onOpenVideo={() => {
              setActiveTab('videos');
              const el = document.getElementById('video-bulletins-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            onOpenMandi={() => {
              setActiveTab('mandi');
              const el = document.getElementById('mandi-section') || document.getElementById('mandi-rates-table');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        )}

        {/* 9. FULLSCREEN REELS VIEWER MODAL */}
        {activeReelId && (
          <ReelsViewerModal 
            initialPostId={activeReelId}
            posts={instagramPosts}
            onClose={closeReelModal}
            onShareWhatsApp={(caption, postUrl) => {
              const reelDeepLink = activeReelId ? `${window.location.origin}/?reel=${encodeURIComponent(activeReelId)}` : (postUrl || window.location.origin);
              const text = `🎬 *Ambition News Reel*:\n${caption}\n\n▶️ तुरंत यहाँ देखें:\n${reelDeepLink}`;
              window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
            }}
          />
        )}

        {/* 10. ALL 88 DISTRICTS SEARCHABLE SELECTOR MODAL */}
        {showDistrictModal && (
          <DistrictPickerModal 
            isOpen={showDistrictModal}
            onClose={closeDistrictModal}
            currentDistrict={currentDistrict}
            selectedState={selectedState}
            onSelectDistrict={(dist, state) => {
              if (state && state !== selectedState) {
                setSelectedState(state);
              }
              setCurrentDistrict(dist);
              closeDistrictModal();
            }}
            isDark={isDark}
          />
        )}

        {/* 11. CITIZEN JOURNALIST / FIELD REPORTER SCOOP SUBMISSION MODAL */}
        {showReporterModal && (
          <ReporterModal 
            districts={districtsList}
            selectedState={selectedState}
            onSubmit={handleScoopSubmit}
            onClose={() => setShowReporterModal(false)}
            isDark={isDark}
          />
        )}

        {/* 12. DIGITAL MEDIA COMPLIANCE & LEGAL DISCLOSURES MODAL */}
        {complianceModalTab && (
          <ComplianceModal 
            initialTab={complianceModalTab}
            isDark={isDark}
            onClose={() => setComplianceModalTab(null)}
          />
        )}

      </div>

    </div>
  );
};

export default App;
