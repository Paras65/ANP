import React from 'react';
import { ShieldCheck, Sun, Moon, MapPin, Smartphone, Monitor, Search } from 'lucide-react';
import { YoutubeIcon, InstagramIcon, WhatsAppIcon } from './SocialIcons';
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
  onOpenDistrictPicker
}) => {
  const handleLogoClick = () => {
    if (setActiveTab) setActiveTab('home');
    setSelectedCategory('सभी खबरें');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    <header className={`w-full max-w-full sticky top-0 z-40 border-b backdrop-blur-md will-change-transform transition-colors ${
      isDark ? 'bg-[#080c14]/98 border-red-950/40 text-slate-100 shadow-xl shadow-black/50' : 'bg-white/98 border-red-100 text-slate-900 shadow-md'
    }`}>
      
      {/* Signature Red News Accent Stripe */}
      <div className="h-[3px] w-full bg-gradient-to-r from-red-700 via-red-500 to-rose-600 shadow-sm" />

      {/* 1. TOP UTILITY STRIP (COMPACT ON MOBILE) */}
      <div className={`border-b text-[11px] py-1 px-3 sm:px-4 transition-colors ${
        isDark ? 'bg-[#04060c] border-white/5 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          
          {/* Bureau Location & Date */}
          <div className="flex items-center gap-1.5 sm:gap-3 text-[10px] sm:text-[11px] min-w-0 shrink">
            <span 
              onClick={onOpenDistrictPicker}
              className={`flex items-center gap-1 font-bold text-red-500 shrink-0 ${onOpenDistrictPicker ? 'cursor-pointer hover:underline' : ''}`}
              title="सभी 88 जिले चुनें"
            >
              <MapPin size={11} className="shrink-0" />
              <span className="sm:hidden">कवर्धा</span>
              <span className="hidden sm:inline">मुख्यालय: कवर्धा (कबीरधाम)</span>
            </span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline">12 अक्टूबर 2026</span>
            <span className="hidden lg:inline text-slate-500">|</span>
            <span className="hidden lg:inline text-amber-500 font-medium">🌤️ 28°C</span>
          </div>

          {/* Social Links & Device View Switcher */}
          <div className="flex items-center gap-1 sm:gap-2 font-medium shrink-0">
            
            {/* Desktop Simulator Toggle */}
            {toggleDeviceView && (
              <button
                onClick={toggleDeviceView}
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

            {/* YouTube Link */}
            <a 
              href={SOCIAL_LINKS.youtube} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold shadow-sm transition active:scale-95 shrink-0"
              title="Ambition News YouTube Channel"
            >
              <YoutubeIcon size={12} />
              <span>YouTube</span>
              <span className="hidden sm:inline text-[9px]">({SOCIAL_LINKS.youtubeSubs})</span>
            </a>

            {/* Instagram Link */}
            <a 
              href={SOCIAL_LINKS.instagram} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:opacity-90 text-white px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold shadow-sm transition active:scale-95 shrink-0"
              title="Ambition News Kawardha Instagram"
            >
              <InstagramIcon size={12} />
              <span>Insta</span>
              <span className="hidden sm:inline text-[9px]">(@ambition_news)</span>
            </a>

            {/* WhatsApp Link */}
            <a 
              href={SOCIAL_LINKS.whatsappChannel} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold shadow-sm transition active:scale-95 shrink-0"
              title="Ambition News WhatsApp Channel"
            >
              <WhatsAppIcon size={12} />
              <span>WhatsApp</span>
            </a>

          </div>

        </div>
      </div>

      {/* 2. MAIN NATIVE APP BAR */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand Logo & Headquarters Tag */}
        <div 
          onClick={handleLogoClick}
          className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 shrink cursor-pointer group py-0.5"
          title="एम्बिशन न्यूज़ - होमपेज"
        >
          {/* Official 3D Round Logo - Highly Visible, Large & Sharp with Red Studio Glow */}
          <div className="relative shrink-0 flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="एम्बिशन न्यूज़ Logo" 
              className="w-12 h-12 sm:w-15 sm:h-15 md:w-16 md:h-16 object-contain filter drop-shadow-[0_4px_16px_rgba(220,38,38,0.55)] transition-transform duration-300 group-hover:scale-105" 
            />
            <span 
              className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#080c14] shadow-sm animate-pulse" 
              title={backendSynced ? "लाइव सर्वर कनेक्टेड" : "लाइव मोड"}
            />
          </div>

          <div className="flex flex-col justify-center">
            {/* Sleek Hindi Channel Title */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-black text-xl sm:text-2xl tracking-tight leading-none text-red-500 drop-shadow-sm">
                एम्बिशन
              </span>
              <span className={`font-black text-xl sm:text-2xl tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'} drop-shadow-sm`}>
                न्यूज़
              </span>
              <span className="flex items-center gap-1 bg-red-600 text-white text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm shadow-red-600/40 tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                LIVE
              </span>
            </div>

            {/* Subtitle: Bureau & Coverage */}
            <div className="text-[10px] sm:text-xs font-semibold text-slate-400 mt-1 flex items-center gap-1.5 leading-none">
              <span className="text-red-400 font-bold">कवर्धा (कबीरधाम)</span>
              <span className="text-slate-600">•</span>
              <span className="truncate max-w-[130px] sm:max-w-none text-slate-300 font-medium">CG-MP 88 जिला नेटवर्क</span>
            </div>
          </div>
        </div>

        {/* State Toggle & Quick Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* State Switcher (Styled with News Theme) */}
          <div className={`flex p-0.5 rounded-xl border text-[10px] sm:text-xs font-bold ${
            isDark ? 'bg-[#05070d] border-red-950/60' : 'bg-slate-100 border-slate-300'
          }`}>
            <button 
              onClick={() => setSelectedState('chhattisgarh')}
              className={`px-2 sm:px-3.5 py-1 rounded-lg text-[10px] sm:text-xs transition-all ${
                selectedState === 'chhattisgarh' ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-600/40 ring-1 ring-red-400/50' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="sm:hidden">छ.ग.</span>
              <span className="hidden sm:inline">छत्तीसगढ़ (33)</span>
            </button>
            <button 
              onClick={() => setSelectedState('madhya-pradesh')}
              className={`px-2 sm:px-3.5 py-1 rounded-lg text-[10px] sm:text-xs transition-all ${
                selectedState === 'madhya-pradesh' ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-600/40 ring-1 ring-red-400/50' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="sm:hidden">म.प्र.</span>
              <span className="hidden sm:inline">मध्यप्रदेश (55)</span>
            </button>
          </div>

          {/* Admin Desk Button */}
          <button 
            onClick={onOpenAdminPortal}
            className="flex bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-700/80 items-center gap-1 transition active:scale-95 shadow shrink-0"
            title="Open Editorial & Admin Desk"
          >
            <ShieldCheck size={14} className="text-amber-400 shrink-0" />
            <span className="hidden sm:inline text-xs">एडमिन</span>
          </button>

          {/* WhatsApp Share App Button */}
          {onShareAppWhatsApp && (
            <button 
              onClick={onShareAppWhatsApp}
              className="flex bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl items-center gap-1 transition active:scale-95 shadow shadow-emerald-950/40 shrink-0"
              title="व्हाट्सएप पर ऐप शेयर करें"
            >
              <WhatsAppIcon size={14} className="shrink-0" />
              <span className="hidden sm:inline text-xs">शेयर ऐप</span>
            </button>
          )}

          {/* Quick Search Button */}
          {onToggleSearch && (
            <button
              onClick={onToggleSearch}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-slate-700 bg-slate-800/90 text-slate-300 hover:text-white transition active:scale-95 shrink-0"
              title="खबरें खोजें (Search)"
            >
              <Search size={14} />
            </button>
          )}

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl border text-sm transition shrink-0 ${
              isDark ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
            title="Toggle theme"
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>

      </div>

      {/* 3. CATEGORIES HORIZONTAL MOMENTUM STRIP */}
      <div className={`w-full max-w-full overflow-x-auto no-scrollbar border-t transition-colors ${
        isDark ? 'bg-[#05070e] border-red-950/30' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-1.5 flex items-center gap-1.5 text-xs whitespace-nowrap">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button 
                key={cat} 
                onClick={() => handleCategoryClick(cat)}
                className={`px-3 py-1 rounded-full font-bold text-[11px] sm:text-xs transition-all active:scale-95 ${
                  isActive 
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-600/40 ring-1 ring-red-400/40' 
                    : isDark 
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700' 
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200'
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
