import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sun, Moon, MapPin, Smartphone, Monitor, Search, Bookmark } from 'lucide-react';
import { YoutubeIcon, InstagramIcon, WhatsAppIcon, FacebookIcon } from './SocialIcons';
import { SOCIAL_LINKS } from '../data/mockData';
import type { TabType } from './BottomNav';

interface HeaderProps {
  isDark: boolean;
  toggleTheme: () => void;
  selectedState: 'chhattisgarh' | 'madhya-pradesh';
  setSelectedState: (state: 'chhattisgarh' | 'madhya-pradesh') => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  onOpenAdminPortal: () => void;
  onShareAppWhatsApp?: () => void;
  backendSynced: boolean;
  isMobileDeviceView?: boolean;
  toggleDeviceView?: () => void;
  activeTab?: TabType;
  setActiveTab?: (tab: TabType) => void;
  onToggleSearch?: () => void;
  onOpenDistrictPicker?: () => void;
  onOpenReporterModal?: () => void;
  whatsappLink?: string;
  savedCount?: number;
  youtubeSubs?: string;
}

const CATEGORIES = [
  'सभी खबरें',
  '🔴 कवर्धा स्पेशल',
  '🏛️ राजनीति',
  '🚔 अपराध व कानून',
  '🌾 कृषि व मंडी भाव',
  '🏗️ विकास कार्य',
  '📚 शिक्षा व रोजगार',
  '⚖️ हाई कोर्ट',
  '🌦️ मौसम व पर्यटन'
];

export const Header: React.FC<HeaderProps> = ({
  isDark,
  toggleTheme,
  selectedState,
  setSelectedState,
  selectedCategory,
  setSelectedCategory,
  onOpenAdminPortal,
  onShareAppWhatsApp,
  backendSynced,
  isMobileDeviceView,
  toggleDeviceView,
  activeTab,
  setActiveTab,
  onToggleSearch,
  onOpenDistrictPicker,
  onOpenReporterModal,
  whatsappLink,
  savedCount,
  youtubeSubs
}) => {
  const handleLogoClick = () => {
    if (setActiveTab) setActiveTab('home');
    setSelectedCategory('सभी खबरें');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Real-time dynamic Hindi date (e.g. बुधवार, 28 अक्टूबर 2026 / बुध, 28 अक्टू)
  const now = new Date();
  const todayHindiDate = now.toLocaleDateString('hi-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const shortHindiDate = now.toLocaleDateString('hi-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  // Dynamic seasonal weather for Kawardha HQ based on hour
  const currentHour = now.getHours();
  const weatherInfo = (() => {
    if (currentHour >= 5 && currentHour < 11) return { icon: '🌅', temp: '23°C', label: 'सुबह' };
    if (currentHour >= 11 && currentHour < 16) return { icon: '☀️', temp: '31°C', label: 'धूप' };
    if (currentHour >= 16 && currentHour < 19) return { icon: '🌤️', temp: '27°C', label: 'शाम' };
    return { icon: '🌙', temp: '22°C', label: 'रात' };
  })();

  // Smart sticky header scroll detector with RAF throttle
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const next = window.scrollY > 40;
          setIsScrolled(prev => (prev !== next ? next : prev));
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    if (setActiveTab && activeTab !== 'home') {
      setActiveTab('home');
    }
    const feedEl = document.getElementById('news-feed-section');
    if (feedEl) {
      feedEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  return (
    <header 
      style={{ position: 'sticky', top: isMobileDeviceView ? 37 : 0 }}
      className={`w-full max-w-full sticky top-0 z-40 border-b backdrop-blur-xl transition-[border-color,box-shadow,background-color] duration-200 ${
      isScrolled 
        ? isDark 
          ? 'bg-[#080c14]/98 border-red-900/60 text-slate-100 shadow-xl shadow-black/80 ring-1 ring-red-900/20' 
          : 'bg-white/98 border-red-200 text-slate-900 shadow-lg shadow-slate-900/10'
        : isDark 
          ? 'bg-[#080c14]/95 border-red-950/40 text-slate-100 shadow-sm' 
          : 'bg-white/95 border-red-100 text-slate-900 shadow-sm'
    }`}>
      
      {/* Signature Red News Accent Stripe */}
      <div className="h-[3px] w-full bg-gradient-to-r from-red-700 via-red-500 to-rose-600 shadow-sm" />

      {/* 1. TOP UTILITY STRIP (STABLE HEIGHT - ZERO LAYOUT SHIFT) */}
      <div className={`border-b text-[11px] py-1 px-3 sm:px-4 ${
        isDark ? 'bg-[#04060c] border-white/5 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          
          {/* Bureau Location, Dynamic Date & Live Weather */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 text-[10px] sm:text-[11px] min-w-0">
            <span 
              onClick={onOpenDistrictPicker}
              className={`flex items-center gap-0.5 font-bold text-red-500 shrink-0 ${onOpenDistrictPicker ? 'cursor-pointer hover:underline' : ''}`}
              title="सभी 88 जिले चुनें"
            >
              <MapPin size={11} className="shrink-0" />
              <span className="sm:hidden">कवर्धा</span>
              <span className="hidden sm:inline">मुख्यालय: कवर्धा (कबीरधाम)</span>
            </span>

            <span className="text-slate-500">•</span>

            {/* Date: Compact on Mobile, Full on Desktop */}
            <span className={`capitalize font-medium whitespace-nowrap ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              <span className="sm:hidden">{shortHindiDate}</span>
              <span className="hidden sm:inline">{todayHindiDate}</span>
            </span>

            <span className="text-slate-500">•</span>

            {/* Weather: Always Visible on Mobile & Desktop */}
            <span 
              className="text-amber-400 font-bold flex items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 text-[10px] shrink-0" 
              title="कवर्धा (कबीरधाम) लाइव मौसम"
            >
              <span>{weatherInfo.icon}</span>
              <span>{weatherInfo.temp}</span>
              <span className="hidden lg:inline text-amber-300/80 font-normal">{weatherInfo.label} कवर्धा</span>
            </span>
          </div>

          {/* Social Links & Device View Switcher */}
          <div className="flex items-center gap-1 sm:gap-2 font-medium shrink-0">
            
            {/* Desktop Simulator Toggle */}
            {toggleDeviceView && (
              <button
                onClick={toggleDeviceView}
                aria-label={isMobileDeviceView ? "फुल डेस्कटॉप स्क्रीन दृश्य पर स्विच करें" : "मोबाइल ऐप फ्रेम दृश्य पर स्विच करें"}
                className="hidden lg:flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] px-2 py-0.5 rounded border border-slate-700 transition"
                title="Toggle between Mobile App Frame and Full Screen View"
              >
                {isMobileDeviceView ? (
                  <>
                    <Monitor size={11} className="text-blue-400" />
                    <span>फुल व्यू</span>
                  </>
                ) : (
                  <>
                    <Smartphone size={11} className="text-emerald-400" />
                    <span>मोबाइल ऐप फ्रेम</span>
                  </>
                )}
              </button>
            )}

            {/* YouTube Link (Desktop/Tablet) */}
            <a 
              href={SOCIAL_LINKS.youtube} 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="एम्बिशन न्यूज़ आधिकारिक यूट्यूब चैनल"
              className="hidden sm:flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold shadow-sm transition active:scale-95 shrink-0"
              title="Ambition News YouTube Channel"
            >
              <YoutubeIcon size={12} />
              <span>YouTube</span>
              <span className="hidden md:inline text-[9px]">({youtubeSubs || SOCIAL_LINKS.youtubeSubs})</span>
            </a>

            {/* Facebook Link (Desktop) */}
            <a 
              href={SOCIAL_LINKS.facebook} 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="एम्बिशन न्यूज़ आधिकारिक फेसबुक पेज"
              className="hidden md:flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold shadow-sm transition active:scale-95 shrink-0"
              title="Ambition News Facebook Page"
            >
              <FacebookIcon size={12} />
              <span>Facebook</span>
            </a>

            {/* Instagram Link (Desktop) */}
            <a 
              href={SOCIAL_LINKS.instagram} 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="एम्बिशन न्यूज़ आधिकारिक इंस्टाग्राम पेज"
              className="hidden md:flex items-center gap-1 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:opacity-90 text-white px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold shadow-sm transition active:scale-95 shrink-0"
              title="Ambition News Kawardha Instagram"
            >
              <InstagramIcon size={12} />
              <span>Insta</span>
            </a>

            {/* WhatsApp Link - Always accessible on both Mobile & Desktop */}
            <a 
              href={whatsappLink || SOCIAL_LINKS.whatsappChannel} 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="एम्बिशन न्यूज़ आधिकारिक व्हाट्सएप ग्रुप व चैनल"
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold shadow-sm transition active:scale-95 shrink-0"
              title="Ambition News WhatsApp Group / Channel"
            >
              <WhatsAppIcon size={12} />
              <span>WhatsApp</span>
            </a>

          </div>

        </div>
      </div>

      {/* 2. MAIN NATIVE APP BAR (STABLE FIXED HEIGHT - ZERO CLS) */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand Logo & Headquarters Tag */}
        <div 
          onClick={handleLogoClick}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleLogoClick(); }}
          role="button"
          tabIndex={0}
          aria-label="एम्बिशन न्यूज़ मुख्य पृष्ठ पर जाएं"
          className="flex items-center gap-2 sm:gap-3.5 shrink-0 cursor-pointer group py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-lg"
          title="एम्बिशन न्यूज़ - होमपेज"
        >
          {/* Official 3D Round Logo - Highly Visible, Large & Sharp with Red Studio Glow */}
          <div className="relative shrink-0 flex items-center justify-center">
            <picture>
              <source srcSet="/logo-96.webp" type="image/webp" />
              <img 
                src="/logo-96.webp" 
                alt="एम्बिशन न्यूज़ आधिकारिक लोगो" 
                width="60"
                height="60"
                // @ts-ignore
                fetchpriority="high"
                decoding="async"
                onError={(e) => { (e.target as HTMLImageElement).src = '/logo.webp'; }}
                className="w-10 h-10 sm:w-14 sm:h-14 md:w-15 md:h-15 object-contain rounded-full filter drop-shadow-[0_4px_16px_rgba(220,38,38,0.55)] transition-transform duration-300 group-hover:scale-105" 
              />
            </picture>
            <span 
              className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 border-2 border-[#080c14] shadow-sm animate-pulse" 
              title={backendSynced ? "लाइव अपडेट" : "लाइव मोड"}
            />
          </div>

          <div className="flex flex-col justify-center">
            {/* Sleek Hindi Channel Title */}
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="font-black text-base sm:text-2xl tracking-tight leading-none text-red-500 drop-shadow-sm">
                एम्बिशन
              </span>
              <span className={`font-black text-base sm:text-2xl tracking-tight leading-none drop-shadow-sm ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                न्यूज़
              </span>
              <span className="flex items-center gap-0.5 bg-red-600 text-white text-[8px] sm:text-[10px] font-black px-1 sm:px-1.5 py-0.5 rounded shadow-sm shadow-red-600/40 tracking-wider shrink-0">
                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white animate-ping"></span>
                LIVE
              </span>
            </div>

            {/* Subtitle: Bureau & Coverage */}
            <div className={`text-[9px] sm:text-xs font-semibold mt-0.5 sm:mt-1 flex items-center gap-1 leading-none ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              <span className="text-red-500 font-bold">कवर्धा (कबीरधाम)</span>
              <span className={`hidden sm:inline ${isDark ? "text-slate-600" : "text-slate-400"}`}>•</span>
              <span className={`hidden sm:inline font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>CG-MP 88 जिला नेटवर्क</span>
            </div>
          </div>
        </div>

        {/* State Toggle & Quick Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* State Switcher (Styled with News Theme) */}
          <div className={`flex p-0.5 rounded-xl border ${
            isDark ? 'bg-[#05070d] border-red-950/60' : 'bg-slate-100 border-slate-300'
          }`}>
            <button 
              onClick={() => setSelectedState('chhattisgarh')}
              aria-label="छत्तीसगढ़ राज्य के 33 जिलों के समाचार चुनें"
              className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all min-h-[38px] sm:min-h-[40px] flex items-center justify-center ${
                selectedState === 'chhattisgarh' 
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-600/40 ring-1 ring-red-400/50' 
                  : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              <span className="sm:hidden">छ.ग.</span>
              <span className="hidden sm:inline">छत्तीसगढ़ (33)</span>
            </button>
            <button 
              onClick={() => setSelectedState('madhya-pradesh')}
              aria-label="मध्य प्रदेश राज्य के 55 जिलों के समाचार चुनें"
              className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all min-h-[38px] sm:min-h-[40px] flex items-center justify-center ${
                selectedState === 'madhya-pradesh' 
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-600/40 ring-1 ring-red-400/50' 
                  : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              <span className="sm:hidden">म.प्र.</span>
              <span className="hidden sm:inline">मध्यप्रदेश (55)</span>
            </button>
          </div>

          {/* Citizen Reporter / Send News Button */}
          {onOpenReporterModal && (
            <button 
              onClick={onOpenReporterModal}
              aria-label="नागरिक रिपोर्टर - तुरंत खबर भेजें"
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold p-2 sm:px-3 sm:py-2 rounded-xl flex items-center justify-center gap-1 transition active:scale-95 shadow-md shadow-red-950/40 shrink-0 min-h-[38px] sm:min-h-[40px] min-w-[38px] sm:min-w-[40px]"
              title="नागरिक व फ़ील्ड रिपोर्टर • तुरंत खबर भेजें"
            >
              <span className="text-sm">📢</span>
              <span className="hidden sm:inline text-xs">खबर भेजें</span>
            </button>
          )}

          {/* Admin Desk Button (Desktop & Tablet display) */}
          <button 
            onClick={onOpenAdminPortal}
            aria-label="संपादकीय एवं एडमिन पोर्टल खोलें"
            className={`hidden sm:flex text-xs font-bold p-2 sm:px-3 sm:py-2 rounded-xl border items-center gap-1.5 transition active:scale-95 shadow shrink-0 min-h-[38px] sm:min-h-[40px] ${
              isDark ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700/80' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
            title="Open Editorial & Admin Desk"
          >
            <ShieldCheck size={15} className="text-amber-400 shrink-0" />
            <span className="hidden sm:inline text-xs">एडमिन</span>
          </button>

          {/* WhatsApp Share App Button - shown on tablet & desktop */}
          {onShareAppWhatsApp && (
            <button 
              onClick={onShareAppWhatsApp}
              aria-label="व्हाट्सएप पर ऐप शेयर करें"
              className="hidden md:flex bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold p-2 sm:px-3 sm:py-2 rounded-xl items-center gap-1 transition active:scale-95 shadow shadow-emerald-950/40 shrink-0 min-h-[38px] sm:min-h-[40px]"
              title="व्हाट्सएप पर ऐप शेयर करें"
            >
              <WhatsAppIcon size={14} className="shrink-0" />
              <span className="hidden lg:inline text-xs">शेयर ऐप</span>
            </button>
          )}

          {/* Saved / Bookmarks Button (Desktop Access) */}
          {setActiveTab && (
            <button
              onClick={() => setActiveTab('saved')}
              aria-label="सहेजी गई खबरें व रील्स देखें"
              className={`hidden lg:flex p-2 sm:px-3 sm:py-2 rounded-xl border transition active:scale-95 shrink-0 items-center gap-1.5 text-xs font-bold min-h-[38px] sm:min-h-[40px] ${
                activeTab === 'saved'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm'
                  : isDark 
                    ? 'border-slate-700 bg-slate-800/90 text-slate-300 hover:text-white' 
                    : 'border-slate-300 bg-slate-100 text-slate-800 hover:text-slate-950'
              }`}
              title="सेव की गई खबरें व रील्स"
            >
              <Bookmark size={14} className={activeTab === 'saved' ? 'fill-current text-amber-400' : ''} />
              <span className="text-xs">सेव्ड</span>
              {savedCount !== undefined && savedCount > 0 && (
                <span className="bg-amber-500 text-slate-950 font-black text-[9px] min-w-[15px] h-[15px] px-1 rounded-full flex items-center justify-center shadow">
                  {savedCount}
                </span>
              )}
            </button>
          )}

          {/* Quick Search Button */}
          {onToggleSearch && (
            <button
              onClick={onToggleSearch}
              aria-label="समाचार खोजें"
              className={`p-2 rounded-xl border transition active:scale-95 shrink-0 min-w-[38px] sm:min-w-[40px] min-h-[38px] sm:min-h-[40px] flex items-center justify-center ${
                isDark ? 'border-slate-700 bg-slate-800/90 text-slate-200 hover:text-white' : 'border-slate-300 bg-slate-100 text-slate-800 hover:text-slate-950'
              }`}
              title="खबरें खोजें (Search)"
            >
              <Search size={16} />
            </button>
          )}

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            aria-label={isDark ? "लाइट थीम पर स्विच करें" : "डार्क थीम पर स्विच करें"}
            className={`p-2 rounded-xl border text-sm transition shrink-0 min-w-[38px] sm:min-w-[40px] min-h-[38px] sm:min-h-[40px] flex items-center justify-center ${
              isDark ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
            }`}
            title="Toggle theme"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

      </div>

      {/* 3. CATEGORIES HORIZONTAL MOMENTUM STRIP */}
      <div className={`w-full max-w-full overflow-x-auto no-scrollbar border-t transition-colors ${
        isDark ? 'bg-[#05070e] border-red-950/30' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-center gap-1.5 text-xs whitespace-nowrap">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button 
                key={cat} 
                onClick={() => handleCategoryClick(cat)}
                className={`px-3.5 py-1.5 rounded-full font-bold text-xs transition-all active:scale-95 min-h-[34px] flex items-center justify-center ${
                  isActive 
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-600/40 ring-1 ring-red-400/40' 
                    : isDark 
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700' 
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

    </header>
  );
};
