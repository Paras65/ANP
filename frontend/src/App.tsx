import React, { useState, useEffect } from 'react';
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
  TrendingUp
} from 'lucide-react';

import { Header } from './components/Header';
import { BreakingTicker } from './components/BreakingTicker';
import { MandiWidget } from './components/MandiWidget';
import { VideoSection } from './components/VideoSection';
import { InstagramSection } from './components/InstagramSection';
import { ArticleModal } from './components/ArticleModal';
import { AdminPortal } from './components/AdminPortal';
import { Footer } from './components/Footer';
import { StoriesTray } from './components/StoriesTray';
import { StoryViewerModal } from './components/StoryViewerModal';
import { ReelsViewerModal } from './components/ReelsViewerModal';
import { DistrictPickerModal } from './components/DistrictPickerModal';
import { BottomNav } from './components/BottomNav';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import type { TabType } from './components/BottomNav';
import { YoutubeIcon, InstagramIcon, WhatsAppIcon, FacebookIcon } from './components/SocialIcons';

import { 
  INITIAL_ARTICLES, 
  VIDEO_BULLETINS, 
  INSTAGRAM_POSTS, 
  MANDI_RATES, 
  ALL_DISTRICTS_DEMO, 
  POPULAR_DISTRICTS_CG, 
  POPULAR_DISTRICTS_MP, 
  SOCIAL_LINKS 
} from './data/mockData';
import type { StoryItem } from './components/StoriesTray';
import type { Article, DistrictItem, VideoBulletin, InstagramPost } from './types';
import api from './api/client';
import { syncYouTubeChannelVideos } from './utils/mediaUtils';

export const App: React.FC = () => {
  const [isDark, setIsDark] = useState(true);
  const [currentView, setCurrentView] = useState<'public' | 'admin'>('public');
  const [selectedState, setSelectedState] = useState<'chhattisgarh' | 'madhya-pradesh'>('chhattisgarh');
  const [currentDistrict, setCurrentDistrict] = useState<string>('सभी');
  const [selectedCategory, setSelectedCategory] = useState<string>('सभी खबरें');
  const [districtsList, setDistrictsList] = useState<DistrictItem[]>(ALL_DISTRICTS_DEMO);
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
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
  const [savedArticles, setSavedArticles] = useState<Article[]>([INITIAL_ARTICLES[0]]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);

  // Auto-Sync YouTube Channel ID (Ambition News)
  const [youtubeChannelId, setYoutubeChannelId] = useState<string>(() => {
    return localStorage.getItem('anp_yt_channel_id') || 'UC8mIipC7suPuBJ_n8kUzkCg';
  });
  const [hasYouTubeApiKey, setHasYouTubeApiKey] = useState(false);
  const [isSyncingYouTube, setIsSyncingYouTube] = useState(false);

  // Dynamic Live YouTube Videos & Instagram Reels
  const [videoBulletins, setVideoBulletins] = useState<VideoBulletin[]>(() => {
    const saved = localStorage.getItem('anp_video_bulletins');
    return saved ? JSON.parse(saved) : VIDEO_BULLETINS;
  });

  const [instagramPosts, setInstagramPosts] = useState<InstagramPost[]>(() => {
    const saved = localStorage.getItem('anp_instagram_posts');
    return saved ? JSON.parse(saved) : INSTAGRAM_POSTS;
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

    setIsSyncingYouTube(true);
    try {
      const res = await syncYouTubeChannelVideos(targetId);
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
    } finally {
      setIsSyncingYouTube(false);
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

  const handleDeleteReel = async (id: string) => {
    const updated = instagramPosts.filter(r => r.id !== id);
    setInstagramPosts(updated);
    localStorage.setItem('anp_instagram_posts', JSON.stringify(updated));
    showToast('रील हटा दी गई');
    try {
      await api.delete(`/reels/${id}`);
    } catch {}
  };

  // Toggle Dark Mode
  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Show Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Toggle Bookmark
  const toggleBookmark = (article: Article) => {
    const isSaved = savedArticles.some(a => a._id === article._id);
    if (isSaved) {
      setSavedArticles(prev => prev.filter(a => a._id !== article._id));
      showToast('🔖 आर्टिकल सेव्ड लिस्ट से हटाया गया');
    } else {
      setSavedArticles(prev => [article, ...prev]);
      showToast('🔖 आर्टिकल ऑफलाइन पढ़ने के लिए सेव किया गया');
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

  // Load live articles
  const loadArticles = async () => {
    setIsLoading(true);
    try {
      const query = `/articles?state=${selectedState}${currentDistrict !== 'सभी' ? `&district=${encodeURIComponent(currentDistrict)}` : ''}`;
      const res = await api.get(query);
      if (res.data?.data && res.data.data.length > 0) {
        setArticles(res.data.data);
        setBackendSynced(true);
      } else {
        setBackendSynced(false);
      }
    } catch {
      setBackendSynced(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Load live media (videos & reels) from MongoDB Atlas
  const loadMediaFromBackend = async () => {
    try {
      const [vRes, rRes] = await Promise.allSettled([
        api.get('/videos'),
        api.get('/reels')
      ]);
      if (vRes.status === 'fulfilled' && vRes.value.data?.data && Array.isArray(vRes.value.data.data) && vRes.value.data.data.length > 0) {
        setVideoBulletins(vRes.value.data.data);
      }
      if (rRes.status === 'fulfilled' && rRes.value.data?.data && Array.isArray(rRes.value.data.data) && rRes.value.data.data.length > 0) {
        setInstagramPosts(rRes.value.data.data);
      }
    } catch {
      // Keep local state
    }
  };

  useEffect(() => {
    loadDistrictsFromBackend();
    loadArticles();
    loadMediaFromBackend();
  }, [selectedState, currentDistrict]);

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
      coverImage: newArticleData.coverImage || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1000&auto=format&fit=crop&q=80',
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
      if (path === '/admin' || hash === '#admin' || search.includes('portal=admin')) {
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

  const handleOpenAdmin = () => {
    setCurrentView('admin');
    window.history.pushState({ view: 'admin' }, '', '/admin');
  };

  const handleBackToPublic = () => {
    setCurrentView('public');
    window.history.pushState({ view: 'public' }, '', '/');
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

  // Open full article from Story viewer
  const handleOpenFromStory = (storyTitle: string) => {
    setActiveStory(null);
    const found = articles.find(a => a.title.includes(storyTitle.slice(0, 15)) || storyTitle.includes(a.title.slice(0, 15)));
    if (found) {
      openArticleModal(found);
    } else {
      openArticleModal(articles[0]);
    }
  };

  // Filtered Articles
  const filteredArticles = articles.filter(art => {
    const matchesState = art.state === selectedState || !art.state;
    const matchesDistrict = currentDistrict === 'सभी' || art.district.includes(currentDistrict) || currentDistrict.includes(art.district);
    const matchesCategory = selectedCategory === 'सभी खबरें' || art.category.includes(selectedCategory.replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '')) || selectedCategory.includes(art.category);
    const matchesSearch = !searchQuery.trim() || art.title.toLowerCase().includes(searchQuery.toLowerCase()) || art.excerpt.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesState && matchesDistrict && matchesCategory && matchesSearch;
  });

  const displayArticles = filteredArticles.length > 0 ? filteredArticles : articles.filter(a => a.state === selectedState);
  const heroArticle = displayArticles.length > 0 ? displayArticles[0] : INITIAL_ARTICLES[0];
  const gridArticles = displayArticles.slice(1);
  const breakingList = articles.filter(a => a.isBreaking);

  const popularDistricts = selectedState === 'chhattisgarh' ? POPULAR_DISTRICTS_CG : POPULAR_DISTRICTS_MP;

  if (currentView === 'admin') {
    return (
      <AdminPortal 
        articles={articles}
        districts={districtsList}
        selectedState={selectedState}
        onPublishArticle={handleNewArticleSubmit}
        onDeleteArticle={handleDeleteArticle}
        onBackToPublic={handleBackToPublic}
        isDark={isDark}
        videos={videoBulletins}
        onAddVideo={handleAddVideo}
        onDeleteVideo={handleDeleteVideo}
        reels={instagramPosts}
        onAddReel={handleAddReel}
        onDeleteReel={handleDeleteReel}
        youtubeChannelId={youtubeChannelId}
        hasYouTubeApiKey={hasYouTubeApiKey}
        onSaveChannelId={handleSaveChannelId}
        onSyncChannel={handleSyncYouTube}
        whatsappLink={whatsappLink}
        onSaveWhatsAppLink={handleSaveWhatsAppLink}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-devanagari w-full max-w-full overflow-x-hidden ${
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
          onToggleSearch={() => setIsSearching(prev => !prev)}
          onOpenDistrictPicker={openDistrictModal}
          whatsappLink={whatsappLink}
        />

        {/* 2. BREAKING NEWS TICKER */}
        <BreakingTicker 
          breakingArticles={breakingList.length > 0 ? breakingList : INITIAL_ARTICLES.slice(0, 3)}
          onSelectArticle={(art) => openArticleModal(art)}
        />

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
            <StoriesTray onSelectStory={(s) => openStoryModal(s)} isDark={isDark} />
          </div>
        </div>

        {/* 4. MAIN CONTENT CONTAINER (PADDED BOTTOM FOR NATIVE BOTTOM NAV) */}
        <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 flex-1 w-full max-w-full min-w-0 space-y-6 pb-28">

          {/* TAB: SAVED ARTICLES VIEW */}
          {activeTab === 'saved' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Bookmark size={16} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white">सेव की गई खबरें (बुकमार्क)</h2>
                    <p className="text-xs text-slate-400">ऑफलाइन व बाद में पढ़ने के लिए सुरक्षित</p>
                  </div>
                </div>
                <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                  {savedArticles.length} खबरें
                </span>
              </div>

              {savedArticles.length === 0 ? (
                <div className="p-8 text-center space-y-2 rounded-2xl border border-dashed border-slate-800">
                  <Bookmark size={32} className="mx-auto text-slate-600" />
                  <p className="text-xs text-slate-400">आपने अभी तक कोई खबर सेव नहीं की है।</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedArticles.map((art) => (
                    <div 
                      key={art._id}
                      onClick={() => openArticleModal(art)}
                      className={`p-3.5 rounded-2xl border flex flex-col justify-between cursor-pointer ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center text-[10px] text-red-400 font-bold mb-1.5">
                          <span>{art.category}</span>
                          <span>📍 {art.district}</span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2">
                          {art.title}
                        </h3>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
                        <span>✍️ {art.author}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(art);
                          }}
                          className="text-amber-400 font-bold text-xs"
                        >
                          हटाएं
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: VIDEOS ONLY VIEW */}
          {activeTab === 'videos' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <VideoSection 
                bulletins={videoBulletins} 
                isDark={isDark} 
                onAddVideo={handleAddVideo}
                onSync={() => handleSyncYouTube()}
                isSyncing={isSyncingYouTube}
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
                onAddReel={handleAddReel}
              />
            </div>
          )}

          {/* TAB: MANDI ONLY VIEW */}
          {activeTab === 'mandi' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 pb-2">
                <span className="text-emerald-500 font-black text-lg">🌾</span>
                <h2 className="text-base font-black text-white">कवर्धा व क्षेत्रीय कृषि मंडी भाव</h2>
              </div>
              <MandiWidget rates={MANDI_RATES} isDark={isDark} />
              
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <TrendingUp size={14} />
                  <span>कवर्धा गुड़ मंडी विशेष रिपोर्ट</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
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
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <span>जिला अनुसार ({selectedState === 'chhattisgarh' ? 'छ.ग.' : 'म.प्र.'})</span>
                          <span className="text-red-400 underline text-[9px]">बदलें</span>
                        </div>
                        <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1">
                          <span>{currentDistrict === 'सभी' ? 'सभी 88 जिले' : currentDistrict}</span>
                          {currentDistrict.includes('कवर्धा') && (
                            <span className="bg-amber-500/20 text-amber-400 text-[9px] font-black px-1.5 rounded border border-amber-500/30">
                              मुख्यालय
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Search Bar Toggle */}
                    <button 
                      onClick={() => setIsSearching(!isSearching)}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        isSearching ? 'bg-red-600 text-white border-red-500' : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                      title="Search articles"
                    >
                      <Search size={14} />
                    </button>
                  </div>

                  {/* Inline Search Input if open */}
                  {isSearching && (
                    <div className="w-full md:w-64 animate-in fade-in">
                      <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="खबरें खोजें (जैसे: कवर्धा, बोनस, मंडी)..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-red-500 font-medium placeholder:text-slate-500"
                        autoFocus
                      />
                    </div>
                  )}

                  {/* Quick District Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 text-xs max-w-full">
                    <button 
                      onClick={openDistrictModal}
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

              {/* MANDI BHAV COMPACT BAR */}
              <MandiWidget rates={MANDI_RATES} isDark={isDark} />

              {/* FEED HEADER */}
              <div id="news-feed-section" className="flex items-center justify-between pt-1 scroll-mt-28">
                <div className="flex items-center gap-2">
                  <span className="text-red-500 text-lg">⚡</span>
                  <h2 className="text-sm sm:text-base font-black text-white tracking-wide">
                    {currentDistrict === 'सभी' ? 'मुख्य समाचार फ़ीड' : `${currentDistrict} की खबरें`}
                  </h2>
                  <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded-full border border-slate-700">
                    {displayArticles.length}
                  </span>
                </div>

                <button 
                  onClick={loadArticles} 
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl transition"
                >
                  <RefreshCw size={11} className={isLoading ? 'animate-spin text-red-500' : ''} />
                  <span>अपडेट</span>
                </button>
              </div>

              {/* HERO LEAD ARTICLE & NATIVE FEED CARDS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                
                {/* Main Feed Column */}
                <div className="lg:col-span-2 space-y-4">
                  
                  {/* HERO ARTICLE (EDGE-TO-EDGE ON MOBILE) */}
                  {heroArticle && (
                    <div 
                      onClick={() => openArticleModal(heroArticle)}
                      className={`rounded-3xl border overflow-hidden cursor-pointer group shadow-xl transition-colors duration-150 active:scale-[0.99] ${
                        isDark ? 'bg-slate-900 border-slate-800 hover:border-red-600/70' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="relative h-64 sm:h-96 w-full overflow-hidden bg-slate-950">
                        <img 
                          src={heroArticle.coverImage || "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1000&auto=format&fit=crop&q=80"} 
                          alt={heroArticle.title} 
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
                          className="absolute top-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur text-white hover:text-amber-400 transition"
                        >
                          <Bookmark size={15} className={savedArticles.some(a => a._id === heroArticle._id) ? 'fill-amber-400 text-amber-400' : ''} />
                        </button>

                        {/* Bottom Gradient with Headline */}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent p-4 sm:p-6">
                          <span className="text-orange-400 text-[10px] sm:text-xs font-black uppercase tracking-wider">
                            {heroArticle.category}
                          </span>
                          <h1 className="text-base sm:text-xl font-black text-white mt-1 leading-snug group-hover:text-red-400 transition-colors">
                            {heroArticle.title}
                          </h1>
                          <p className="text-xs text-slate-300 mt-1.5 line-clamp-2 leading-relaxed hidden sm:block">
                            {heroArticle.excerpt}
                          </p>

                          {/* Action row */}
                          <div className="mt-3 pt-2.5 flex items-center justify-between text-xs text-slate-300 border-t border-slate-800/80">
                            <span className="text-[11px] font-medium text-slate-300">✍️ {heroArticle.author}</span>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  shareWhatsApp(heroArticle.title, heroArticle._id);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 text-[11px]"
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

                  {/* REST OF FEED CARDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {gridArticles.map((art) => (
                      <div 
                        key={art._id}
                        onClick={() => openArticleModal(art)}
                        className={`p-3.5 rounded-2xl border flex flex-col justify-between cursor-pointer group transition-colors duration-150 active:scale-[0.99] ${
                          isDark ? 'bg-slate-900 border-slate-800 hover:border-red-600/60' : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-center text-xs text-red-400 font-bold mb-1.5">
                            <span className="bg-red-950/40 border border-red-900/60 px-2 py-0.5 rounded text-[10px]">
                              {art.category}
                            </span>
                            <span className="text-slate-400 font-medium text-[10px] flex items-center gap-1">
                              <MapPin size={10} className="text-red-500" /> {art.district}
                            </span>
                          </div>

                          <h3 className={`text-xs sm:text-sm font-bold leading-snug line-clamp-2 transition-colors ${
                            isDark ? 'text-slate-100 group-hover:text-red-400' : 'text-slate-900 group-hover:text-red-600'
                          }`}>
                            {art.title}
                          </h3>

                          <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                            {art.excerpt}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                          <span className="text-[10px] truncate max-w-[130px]">
                            ✍️ {art.author}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBookmark(art);
                              }}
                              className="text-slate-400 hover:text-amber-400"
                            >
                              <Bookmark size={13} className={savedArticles.some(a => a._id === art._id) ? 'fill-amber-400 text-amber-400' : ''} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                shareWhatsApp(art.title, art._id);
                              }}
                              className="text-emerald-400 font-bold flex items-center gap-0.5 text-[11px]"
                            >
                              <WhatsAppIcon size={11} />
                              <span>शेयर</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

                {/* Sidebar Column */}
                <aside className="space-y-4">
                  
                  {/* YouTube Bulletin Card */}
                  <div className={`p-3.5 rounded-2xl border ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="p-1 rounded bg-red-600 text-white">
                          <YoutubeIcon size={13} />
                        </div>
                        <span className="text-xs font-bold text-white">
                          Ambition TV (यूट्यूब)
                        </span>
                      </div>
                      <span className="text-[9px] bg-red-950 text-red-300 font-bold px-1.5 py-0.5 rounded border border-red-800">
                        {SOCIAL_LINKS.youtubeSubs}
                      </span>
                    </div>

                    <div 
                      className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 cursor-pointer group"
                      onClick={() => window.open(SOCIAL_LINKS.youtube, '_blank')}
                    >
                      <img 
                        src="https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80" 
                        alt="YouTube Bulletin"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                      />
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-2 text-center">
                        <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                          <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-white ml-0.5"></div>
                        </div>
                        <span className="text-white text-[11px] font-bold mt-1.5">
                          कवर्धा व CG-MP का महाबुलेटिन
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5">
                      <a 
                        href={SOCIAL_LINKS.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
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
                        <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-[10px] font-black text-white">
                          ANP
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1">
                          <span>Ambition news</span>
                          <span className="text-[9px] bg-pink-950 text-pink-300 px-1 rounded border border-pink-800">कवर्धा</span>
                        </div>
                        <div className="text-[10px] text-pink-400 font-mono font-medium">
                          {SOCIAL_LINKS.instagramHandle}
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 mb-2.5 leading-relaxed">
                      कवर्धा की ताज़ा तस्वीरें, रील्स व त्वरित अपडेट सीधे इंस्टाग्राम पर देखें।
                    </p>

                    <div className="flex gap-2">
                      <a 
                        href={SOCIAL_LINKS.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 shadow"
                      >
                        <InstagramIcon size={13} />
                        <span>इंस्टाग्राम</span>
                      </a>
                      <a 
                        href={SOCIAL_LINKS.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 shadow transition"
                      >
                        <FacebookIcon size={13} />
                        <span>फेसबुक पेज</span>
                      </a>
                    </div>
                  </div>

                  {/* WhatsApp News Group & Community Join Card */}
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
                        <div className="text-xs font-black text-white flex items-center gap-1.5">
                          <span>व्हाट्सएप न्यूज़ ग्रुप</span>
                          <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/40">
                            लाइव
                          </span>
                        </div>
                        <div className="text-[10px] text-emerald-400 font-medium truncate">
                          कवर्धा व CG-MP 88 जिला बुलेटिन
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-300 mb-3 leading-relaxed">
                      कवर्धा, मंडी भाव, सरकारी योजनाएं और प्रदेश की बड़ी खबरें तुरंत अपने फोन पर पाने के लिए ग्रुप में शामिल हों।
                    </p>

                    <a 
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40 transition active:scale-95 cursor-pointer"
                    >
                      <WhatsAppIcon size={14} />
                      <span>ग्रुप से जुड़ें (Join Group)</span>
                    </a>
                  </div>

                  {/* PWA App Install Banner */}
                  <div className="p-3.5 rounded-2xl border border-red-800/60 bg-gradient-to-br from-red-950/40 via-slate-900 to-slate-900 text-center space-y-2">
                    <Download size={18} className="mx-auto text-red-400" />
                    <div className="text-xs font-bold text-white">Ambition PWA ऐप लगाएं</div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      बिना प्ले स्टोर के सीधे फोन में लगाएं। 2G पर भी चलेगा।
                    </p>
                    <div className="flex flex-col gap-1.5 pt-1">
                      <button 
                        onClick={() => showToast('📲 PWA इंस्टॉलेशन प्रॉम्प्ट सक्रिय हुआ (डेमो)')}
                        className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs py-1.5 rounded-xl shadow transition"
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

              {/* DEDICATED YOUTUBE BULLETINS SECTION */}
              <VideoSection 
                bulletins={videoBulletins} 
                isDark={isDark} 
                onAddVideo={handleAddVideo}
                onSync={() => handleSyncYouTube()}
                isSyncing={isSyncingYouTube}
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
                onAddReel={handleAddReel}
              />
            </>
          )}

        </main>

        {/* 5. FOOTER */}
        <Footer 
          isDark={isDark} 
          onOpenAdminPortal={handleOpenAdmin}
          whatsappLink={whatsappLink}
        />

        {/* 6. NATIVE BOTTOM NAVIGATION BAR */}
        <BottomNav 
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab === 'insta') {
              openReelModal(instagramPosts[0]?.id || '1');
            } else {
              setActiveTab(tab);
            }
          }}
          savedCount={savedArticles.length}
          isDark={isDark}
        />

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
          />
        )}

        {/* 8. INSTAGRAM / INSHORTS FULLSCREEN STORY VIEWER */}
        {activeStory && (
          <StoryViewerModal 
            initialStory={activeStory}
            onClose={closeStoryModal}
            onReadFullArticle={handleOpenFromStory}
            onShareWhatsApp={shareWhatsApp}
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

      </div>

    </div>
  );
};

export default App;
