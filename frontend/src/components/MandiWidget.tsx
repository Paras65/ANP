import React from 'react';
import { TrendingUp, TrendingDown, Minus, Wheat, ChevronRight } from 'lucide-react';
import type { MandiRate } from '../types';

interface MandiWidgetProps {
  rates: MandiRate[];
  isDark: boolean;
  compact?: boolean;
  onViewFull?: () => void;
}

export const MandiWidget: React.FC<MandiWidgetProps> = ({ 
  rates, 
  isDark, 
  compact = false, 
  onViewFull 
}) => {
  // Zero CLS Stabilization: maintain exact 44px height while rates are buffering
  if (!rates || rates.length === 0) {
    if (compact) {
      return (
        <div className={`h-11 rounded-2xl border p-2 sm:p-2.5 transition-colors animate-pulse flex items-center gap-2 ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <div className="w-20 h-6 rounded-lg bg-emerald-500/20 shrink-0"></div>
          <div className="w-32 h-6 rounded-lg bg-slate-700/20 shrink-0"></div>
          <div className="w-28 h-6 rounded-lg bg-slate-700/20 shrink-0 hidden sm:block"></div>
        </div>
      );
    }
    return null;
  }

  // 1. Compact 1-line horizontal momentum strip for Homepage
  if (compact) {
    return (
      <div className={`rounded-2xl border p-2 sm:p-2.5 transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-emerald-50/70 border-emerald-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between gap-2 overflow-hidden">
          
          {/* Left Live Badge */}
          <button 
            onClick={onViewFull}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-400 text-[11px] font-black shrink-0 transition cursor-pointer"
            title="सभी मंडी भाव देखें"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <Wheat size={12} className="shrink-0" />
            <span>मंडी भाव</span>
          </button>

          {/* Horizontal Scrolling Rate Chips */}
          <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-1.5 py-0.5 text-xs">
            {rates.map((item) => (
              <div 
                key={item.id}
                onClick={onViewFull}
                className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 shrink-0 cursor-pointer transition active:scale-95 ${
                  isDark 
                    ? 'bg-slate-950/80 border-slate-800 hover:border-emerald-500/50 text-white' 
                    : 'bg-white border-slate-200 shadow-sm hover:border-emerald-300 text-slate-900'
                }`}
                title={`${item.mandi} - ${item.crop}: ₹${item.rate}`}
              >
                <span className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {item.mandi}
                </span>
                <span className="font-bold text-[11px]">
                  {item.crop}
                </span>
                <span className="font-black text-emerald-400 text-[11px]">
                  ₹{item.rate.toLocaleString('en-IN')}
                </span>
                <span className={`text-[9px] font-bold flex items-center ${
                  item.change === 'up' 
                    ? 'text-emerald-400' 
                    : item.change === 'down' 
                      ? 'text-red-400' 
                      : 'text-slate-500'
                }`}>
                  {item.change === 'up' && <TrendingUp size={9} />}
                  {item.change === 'down' && <TrendingDown size={9} />}
                  {item.change === 'steady' && <Minus size={9} />}
                  {item.diff !== 0 && `${item.diff > 0 ? '+' : ''}${item.diff}`}
                </span>
              </div>
            ))}
          </div>

          {/* View Full Button */}
          {onViewFull && (
            <button 
              onClick={onViewFull}
              aria-label="कवर्धा व क्षेत्रीय कृषि मंडी भाव पूरा देखें"
              className="text-[10px] sm:text-[11px] font-bold text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded-xl bg-emerald-950/60 border border-emerald-800/60 shrink-0 flex items-center gap-0.5 transition whitespace-nowrap cursor-pointer active:scale-95"
            >
              <span>पूरा देखें</span>
              <ChevronRight size={12} />
            </button>
          )}

        </div>
      </div>
    );
  }

  // 2. Full 6-Card Grid for dedicated Mandi Tab view
  return (
    <div className={`rounded-2xl border p-4 transition-colors ${
      isDark ? 'bg-slate-900 border-slate-800' : 'bg-emerald-50/50 border-emerald-200 shadow-sm'
    }`}>
      
      {/* Title */}
      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-800/50">
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
          <Wheat size={14} />
          <span>🌾 आज के मंडी भाव (कवर्धा व क्षेत्रीय)</span>
        </div>
        <span className="text-[10px] bg-emerald-950 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-800 font-mono">
          Live Rates
        </span>
      </div>

      {/* Grid of Rates */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {rates.map((item) => (
          <div 
            key={item.id}
            className={`p-2 rounded-lg border flex flex-col justify-between ${
              isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div>
              <div className={`flex justify-between items-center text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <span>{item.mandi}</span>
                <span className={`px-1 rounded text-[9px] font-bold ${
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                }`}>{item.state}</span>
              </div>
              <div className={`text-xs font-bold mt-0.5 truncate ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {item.crop}
              </div>
            </div>

            <div className="mt-1.5 flex items-baseline justify-between">
              <span className={`text-xs font-black ${
                isDark ? 'text-emerald-400' : 'text-emerald-700'
              }`}>
                ₹{item.rate.toLocaleString('en-IN')}
              </span>
              <span className={`text-[10px] flex items-center gap-0.5 font-bold ${
                item.change === 'up' 
                  ? 'text-emerald-400' 
                  : item.change === 'down' 
                    ? 'text-red-400' 
                    : (isDark ? 'text-slate-400' : 'text-slate-600')
              }`}>
                {item.change === 'up' && <TrendingUp size={10} />}
                {item.change === 'down' && <TrendingDown size={10} />}
                {item.change === 'steady' && <Minus size={10} />}
                {item.diff !== 0 && `${item.diff > 0 ? '+' : ''}${item.diff}`}
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
