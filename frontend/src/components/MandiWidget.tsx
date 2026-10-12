import React from 'react';
import { TrendingUp, TrendingDown, Minus, Wheat } from 'lucide-react';
import type { MandiRate } from '../types';

interface MandiWidgetProps {
  rates: MandiRate[];
  isDark: boolean;
}

export const MandiWidget: React.FC<MandiWidgetProps> = ({ rates, isDark }) => {
  return (
    <div className={`rounded-xl border p-3.5 transition-colors ${
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
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                <span>{item.mandi}</span>
                <span className="bg-slate-800 text-slate-300 px-1 rounded text-[9px]">{item.state}</span>
              </div>
              <div className="text-xs font-bold text-white mt-0.5 truncate">
                {item.crop}
              </div>
            </div>

            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-xs font-black text-emerald-400">
                ₹{item.rate.toLocaleString('en-IN')}
              </span>
              <span className={`text-[10px] flex items-center gap-0.5 font-bold ${
                item.change === 'up' 
                  ? 'text-emerald-400' 
                  : item.change === 'down' 
                    ? 'text-red-400' 
                    : 'text-slate-400'
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
