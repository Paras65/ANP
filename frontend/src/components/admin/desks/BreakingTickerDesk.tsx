import React from 'react';
import { Radio, Mic, Plus, Trash2 } from 'lucide-react';
import type { Article } from '../../../types';

export interface BreakingTickerDeskProps {
  isDark: boolean;
  breakingHeadline: string;
  setBreakingHeadline: (val: string) => void;
  handleAddQuickBreaking: (e: React.FormEvent) => void;
  isVoiceSupported: boolean;
  isListeningBreaking: boolean;
  toggleVoiceBreaking: () => void;
  breakingInterim: string;
  breakingCount: number;
  articles: Article[];
  onDeleteArticle: (id: string) => void;
}

export const BreakingTickerDesk: React.FC<BreakingTickerDeskProps> = ({
  isDark,
  breakingHeadline,
  setBreakingHeadline,
  handleAddQuickBreaking,
  isVoiceSupported,
  isListeningBreaking,
  toggleVoiceBreaking,
  breakingInterim,
  breakingCount,
  articles,
  onDeleteArticle
}) => {
  return (
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
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow shrink-0 cursor-pointer"
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
                className={`p-1 transition cursor-pointer ${isDark ? 'text-red-400 hover:text-white' : 'text-red-500 hover:text-red-700'}`}
                title="हटाएं"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
