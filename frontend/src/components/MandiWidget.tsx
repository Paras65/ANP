import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Wheat, ChevronRight, MapPin } from 'lucide-react';
import type { MandiRate } from '../types';

interface MandiWidgetProps {
  rates: MandiRate[];
  isDark: boolean;
  compact?: boolean;
  onViewFull?: () => void;
  currentDistrict?: string;
}

export const MandiWidget: React.FC<MandiWidgetProps> = ({ 
  rates, 
  isDark, 
  compact = false, 
  onViewFull,
  currentDistrict
}) => {
  // District-aware Sorting: Prioritizes crops from the currently selected district
  const { sortedRates, hasDistrictMatch, cleanDistrictName } = useMemo(() => {
    if (!rates || rates.length === 0) {
      return { sortedRates: [], hasDistrictMatch: false, cleanDistrictName: '' };
    }
    if (!currentDistrict || currentDistrict === 'सभी') {
      return { sortedRates: rates, hasDistrictMatch: false, cleanDistrictName: '' };
    }

    const cleanTokens = currentDistrict.replace(/[()]/g, ' ').split(/\s+/).filter(Boolean);
    const matchesDistrict = (item: MandiRate) => {
      return cleanTokens.some(token => 
        item.mandi.toLowerCase().includes(token.toLowerCase())
      );
    };

    const districtRates = rates.filter(matchesDistrict);
    const otherRates = rates.filter(r => !matchesDistrict(r));
    const cleanName = currentDistrict.replace(/ \(.*\)/, '').trim();

    return {
      sortedRates: districtRates.length > 0 ? [...districtRates, ...otherRates] : rates,
      hasDistrictMatch: districtRates.length > 0,
      cleanDistrictName: cleanName
    };
  }, [rates, currentDistrict]);

  // Zero CLS Stabilization: maintain exact height while rates are buffering
  if (!rates || rates.length === 0) {
    if (compact) {
      return (
        <div className={`h-11 rounded-2xl border p-2 sm:p-2.5 flex items-center gap-2 ${
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
      <div className={`rounded-2xl border p-1.5 sm:p-2.5 transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-emerald-50/70 border-emerald-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between gap-2 overflow-hidden">
          
          {/* Left Live Badge (Synced with selected district if matched) */}
          <button 
            onClick={onViewFull}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-black shrink-0 transition-transform active:scale-95 cursor-pointer border ${
              hasDistrictMatch
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-950/40'
                : 'bg-emerald-600/15 hover:bg-emerald-600/25 border-emerald-500/30 text-emerald-400'
            }`}
            title="सभी मंडी भाव देखें"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${hasDistrictMatch ? 'bg-white' : 'bg-emerald-500'} animate-pulse`}></span>
            {hasDistrictMatch ? <MapPin size={11} className="shrink-0" /> : <Wheat size={12} className="shrink-0" />}
            <span className="truncate max-w-[80px] sm:max-w-none">
              {hasDistrictMatch ? `${cleanDistrictName} मंडी` : 'मंडी भाव'}
            </span>
          </button>

          {/* Horizontal Scrolling Rate Chips */}
          <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-1.5 py-0.5 text-xs">
            {sortedRates.map((item) => {
              const isLocalCrop = hasDistrictMatch && currentDistrict && currentDistrict !== 'सभी' && (
                currentDistrict.replace(/[()]/g, ' ').split(/\s+/).filter(Boolean).some(token => 
                  item.mandi.toLowerCase().includes(token.toLowerCase())
                )
              );

              return (
                <div 
                  key={item.id}
                  onClick={onViewFull}
                  className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 shrink-0 cursor-pointer transition active:scale-95 ${
                    isLocalCrop
                      ? isDark
                        ? 'bg-emerald-950/40 border-emerald-500/60 text-white shadow-sm'
                        : 'bg-emerald-100/90 border-emerald-400 text-slate-900 shadow-sm'
                      : isDark 
                        ? 'bg-slate-950/80 border-slate-800 hover:border-emerald-500/50 text-white' 
                        : 'bg-white border-slate-200 shadow-sm hover:border-emerald-300 text-slate-900'
                  }`}
                  title={`${item.mandi} - ${item.crop}: ₹${item.rate}${isLocalCrop ? ' (स्थानीय भाव)' : ''}`}
                >
                  <span className={`text-[10px] font-medium flex items-center gap-0.5 ${
                    isLocalCrop 
                      ? isDark ? 'text-emerald-300 font-bold' : 'text-emerald-800 font-bold'
                      : isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {isLocalCrop && <span className="text-[9px]">📍</span>}
                    <span>{item.mandi}</span>
                  </span>
                  <span className="font-bold text-[11px]">
                    {item.crop}
                  </span>
                  <span className={`font-black text-[11px] ${
                    isDark ? 'text-emerald-400' : 'text-emerald-600'
                  }`}>
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
              );
            })}
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
    <div className={`rounded-2xl border p-4 ${
      isDark ? 'bg-slate-900 border-slate-800' : 'bg-emerald-50/50 border-emerald-200 shadow-sm'
    }`}>
      
      {/* Title */}
      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-800/50">
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
          <Wheat size={14} />
          <span>
            {hasDistrictMatch 
              ? `🌾 ${cleanDistrictName} व क्षेत्रीय आज के मंडी भाव` 
              : '🌾 आज के मंडी भाव (कवर्धा व क्षेत्रीय)'}
          </span>
        </div>
        <span className="text-[10px] bg-emerald-950 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-800 font-mono">
          Live Rates
        </span>
      </div>

      {/* Grid of Rates */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {sortedRates.map((item) => (
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
