import React from 'react';
import { Newspaper, Tv, Camera, Wheat, Bookmark } from 'lucide-react';

export type TabType = 'home' | 'videos' | 'insta' | 'mandi' | 'saved';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  savedCount: number;
  isDark: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  savedCount,
  isDark
}) => {
  return (
    <nav className={`fixed bottom-0 inset-x-0 z-40 border-t glass-nav transition-colors ${
      isDark ? 'bg-slate-950/95 border-slate-800 text-slate-400' : 'bg-white/95 border-slate-200 text-slate-600 shadow-xl'
    } pb-safe`}>
      
      <div className="max-w-md mx-auto px-2 py-1.5 flex items-center justify-between">
        
        {/* 1. Home Tab */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 ${
            activeTab === 'home' 
              ? 'text-red-500 font-bold' 
              : 'hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Newspaper size={20} className={activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            {activeTab === 'home' && (
              <span className="absolute -bottom-1 inset-x-0 mx-auto w-1.5 h-1.5 rounded-full bg-red-500"></span>
            )}
          </div>
          <span className="text-[10px] mt-1 font-semibold">होम</span>
        </button>

        {/* 2. Video Tab (YouTube Ambition TV) */}
        <button
          onClick={() => setActiveTab('videos')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 ${
            activeTab === 'videos' 
              ? 'text-red-500 font-bold' 
              : 'hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Tv size={20} className={activeTab === 'videos' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            {activeTab === 'videos' && (
              <span className="absolute -bottom-1 inset-x-0 mx-auto w-1.5 h-1.5 rounded-full bg-red-500"></span>
            )}
          </div>
          <span className="text-[10px] mt-1 font-semibold">वीडियो TV</span>
        </button>

        {/* 3. Instagram / Reels Tab */}
        <button
          onClick={() => setActiveTab('insta')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 ${
            activeTab === 'insta' 
              ? 'text-pink-500 font-bold' 
              : 'hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Camera size={20} className={activeTab === 'insta' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            {activeTab === 'insta' && (
              <span className="absolute -bottom-1 inset-x-0 mx-auto w-1.5 h-1.5 rounded-full bg-pink-500"></span>
            )}
          </div>
          <span className="text-[10px] mt-1 font-semibold">रील्स</span>
        </button>

        {/* 4. Mandi Tab */}
        <button
          onClick={() => setActiveTab('mandi')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 ${
            activeTab === 'mandi' 
              ? 'text-emerald-500 font-bold' 
              : 'hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Wheat size={20} className={activeTab === 'mandi' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            {activeTab === 'mandi' && (
              <span className="absolute -bottom-1 inset-x-0 mx-auto w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            )}
          </div>
          <span className="text-[10px] mt-1 font-semibold">मंडी</span>
        </button>

        {/* 5. Saved / Bookmarks Tab */}
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 ${
            activeTab === 'saved' 
              ? 'text-amber-400 font-bold' 
              : 'hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Bookmark size={20} className={activeTab === 'saved' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            {savedCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-amber-500 text-slate-950 font-black text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center shadow">
                {savedCount}
              </span>
            )}
            {activeTab === 'saved' && (
              <span className="absolute -bottom-1 inset-x-0 mx-auto w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            )}
          </div>
          <span className="text-[10px] mt-1 font-semibold">सेव्ड</span>
        </button>

      </div>

    </nav>
  );
};
