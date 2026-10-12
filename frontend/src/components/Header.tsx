import React from 'react';
import { ShieldCheck, Sun, Moon, MapPin, Smartphone, Monitor } from 'lucide-react';
import { YoutubeIcon, InstagramIcon, WhatsAppIcon } from './SocialIcons';
import { SOCIAL_LINKS } from '../data/mockData';

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
  toggleDeviceView
}) => {
  return (
    <header className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-colors ${
      isDark ? 'bg-slate-950/95 border-slate-800 text-slate-100' : 'bg-white/95 border-slate-200 text-slate-900 shadow-sm'
    }`}>
      
      {/* 1. TOP UTILITY STRIP (COMPACT ON MOBILE) */}
      <div className={`border-b text-[11px] py-1 px-3 sm:px-4 transition-colors ${
        isDark ? 'bg-slate-900/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          
          {/* Bureau Location & Date */}
          <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px]">
            <span className="flex items-center gap-1 font-bold text-red-500">
              <MapPin size={11} />
              <span>मुख्यालय: कवर्धा (कबीरधाम)</span>
            </span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline">12 अक्टूबर 2026</span>
            <span className="hidden lg:inline text-slate-500">|</span>
            <span className="hidden lg:inline text-amber-500 font-medium">🌤️ 28°C</span>
          </div>

          {/* Social Links & Device View Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2 font-medium">
            
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
              className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold shadow-sm transition active:scale-95"
              title="Ambition News YouTube Channel"
            >
              <YoutubeIcon size={12} />
              <span className="hidden sm:inline">YouTube</span>
              <span className="text-[9px]">({SOCIAL_LINKS.youtubeSubs})</span>
            </a>

            {/* Instagram Link */}
            <a 
              href={SOCIAL_LINKS.instagram} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:opacity-90 text-white px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold shadow-sm transition active:scale-95"
              title="Ambition News Kawardha Instagram"
            >
              <InstagramIcon size={12} />
              <span className="hidden sm:inline">Insta</span>
              <span className="text-[9px]">(@ambition_news)</span>
            </a>

            {/* WhatsApp Link */}
            <a 
              href={SOCIAL_LINKS.whatsappChannel} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold shadow-sm transition active:scale-95"
              title="Ambition News WhatsApp Channel"
            >
              <WhatsAppIcon size={12} />
              <span>WhatsApp</span>
            </a>

          </div>

        </div>
      </div>

      {/* 2. MAIN NATIVE APP BAR */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand Logo & Headquarters Tag */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <div className="bg-red-600 text-white font-black text-xl sm:text-2xl px-2.5 py-0.5 rounded-lg shadow-md flex items-center tracking-wider">
                AMBITION
              </div>
              <span className="text-[10px] sm:text-xs bg-black/80 text-white font-bold px-1.5 py-0.5 rounded">
                न्यूज़
              </span>
              <span 
                className={`w-2 h-2 rounded-full ${backendSynced ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-500'}`} 
                title={backendSynced ? "Backend Synced" : "Live Demo Mode"}
              ></span>
            </div>
            <div className="text-[9px] sm:text-[10px] font-semibold text-slate-400 mt-0.5 flex items-center gap-1">
              <span className="text-red-500 font-bold">कवर्धा</span>
              <span>•</span>
              <span className="truncate max-w-[150px] sm:max-w-none">CG-MP का 88 जिला नेटवर्क</span>
            </div>
          </div>
        </div>

        {/* State Toggle & Quick Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          
          {/* State Switcher (Compact on mobile) */}
          <div className={`flex p-0.5 rounded-xl border text-xs font-bold ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-300'
          }`}>
            <button 
              onClick={() => setSelectedState('chhattisgarh')}
              className={`px-2 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs transition ${
                selectedState === 'chhattisgarh' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="sm:hidden">छ.ग.</span>
              <span className="hidden sm:inline">छत्तीसगढ़ (33)</span>
            </button>
            <button 
              onClick={() => setSelectedState('madhya-pradesh')}
              className={`px-2 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs transition ${
                selectedState === 'madhya-pradesh' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="sm:hidden">म.प्र.</span>
              <span className="hidden sm:inline">मध्यप्रदेश (55)</span>
            </button>
          </div>

          {/* Admin Desk Button */}
          <button 
            onClick={onOpenAdminPortal}
            className="flex bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-700 items-center gap-1.5 transition active:scale-95 shadow"
            title="Open Editorial & Admin Desk"
          >
            <ShieldCheck size={13} className="text-amber-400" />
            <span className="hidden sm:inline">एडमिन डेस्क</span>
            <span className="sm:hidden text-[10px]">एडमिन</span>
          </button>

          {/* WhatsApp Share App Button */}
          {onShareAppWhatsApp && (
            <button 
              onClick={onShareAppWhatsApp}
              className="flex bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-xl items-center gap-1.5 transition active:scale-95 shadow shadow-emerald-950/40"
              title="व्हाट्सएप पर ऐप शेयर करें"
            >
              <WhatsAppIcon size={13} />
              <span className="hidden sm:inline">ऐप शेयर करें</span>
              <span className="sm:hidden text-[10px]">शेयर</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-xl border text-sm transition ${
              isDark ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
            title="Toggle theme"
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>

      </div>

      {/* 3. CATEGORIES HORIZONTAL MOMENTUM STRIP */}
      <div className={`overflow-x-auto no-scrollbar border-t transition-colors ${
        isDark ? 'bg-slate-950 border-slate-900' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-1.5 flex items-center gap-1.5 text-xs whitespace-nowrap">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button 
                key={cat} 
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full font-bold text-[11px] sm:text-xs transition-all active:scale-95 ${
                  isActive 
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30' 
                    : isDark 
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800/80' 
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
