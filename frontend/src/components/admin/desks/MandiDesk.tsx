import React from 'react';
import { Wheat, PlusCircle, Edit3, Save, TrendingUp, TrendingDown, Minus, Trash2 } from 'lucide-react';
import type { MandiRate } from '../../../types';

export interface MandiDeskProps {
  isDark: boolean;
  mandiRates: MandiRate[];
  showAddCropModal: boolean;
  setShowAddCropModal: (val: boolean) => void;
  newCropName: string;
  setNewCropName: (val: string) => void;
  newCropMandi: string;
  setNewCropMandi: (val: string) => void;
  newCropState: 'CG' | 'MP';
  setNewCropState: (val: 'CG' | 'MP') => void;
  newCropRate: number;
  setNewCropRate: (val: number) => void;
  newCropUnit: string;
  setNewCropUnit: (val: string) => void;
  newCropChange: 'up' | 'down' | 'steady';
  setNewCropChange: (val: 'up' | 'down' | 'steady') => void;
  newCropDiff: number;
  setNewCropDiff: (val: number) => void;
  editingMandiId: string | null;
  setEditingMandiId: (id: string | null) => void;
  editRateVal: number;
  setEditRateVal: (val: number) => void;
  editChangeVal: 'up' | 'down' | 'steady';
  setEditChangeVal: (val: 'up' | 'down' | 'steady') => void;
  editDiffVal: number;
  setEditDiffVal: (val: number) => void;
  onAddMandiRate?: (rate: any) => void;
  onUpdateMandiRate?: (rate: any) => void;
  onDeleteMandiRate?: (id: string) => void;
}

export const MandiDesk: React.FC<MandiDeskProps> = ({
  isDark,
  mandiRates,
  showAddCropModal,
  setShowAddCropModal,
  newCropName,
  setNewCropName,
  newCropMandi,
  setNewCropMandi,
  newCropState,
  setNewCropState,
  newCropRate,
  setNewCropRate,
  newCropUnit,
  setNewCropUnit,
  newCropChange,
  setNewCropChange,
  newCropDiff,
  setNewCropDiff,
  editingMandiId,
  setEditingMandiId,
  editRateVal,
  setEditRateVal,
  editChangeVal,
  setEditChangeVal,
  editDiffVal,
  setEditDiffVal,
  onAddMandiRate,
  onUpdateMandiRate,
  onDeleteMandiRate
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div>
          <h3 className={`text-base sm:text-lg font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Wheat className="text-emerald-500" size={20} />
            <span>दैनिक कृषि उपज मंडी भाव प्रबंधन (Live Mandi Desk)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            कवर्धा, रायपुर, राजनांदगांव, इंदौर आदि मंडियों के भाव सीधे यहाँ से अपडेट करें — पूरे पोर्टल पर तुरंत लाइव होगा।
          </p>
        </div>

        <button
          onClick={() => setShowAddCropModal(!showAddCropModal)}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow active:scale-95 shrink-0 cursor-pointer"
        >
          <PlusCircle size={15} />
          <span>+ नई फसल का भाव जोड़ें</span>
        </button>
      </div>

      {showAddCropModal && (
        <div className={`p-5 rounded-2xl border ${
          isDark ? 'bg-slate-900 border-emerald-500/50' : 'bg-white border-emerald-300 shadow-sm'
        } animate-in fade-in duration-200`}>
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-3 flex items-center gap-1.5">
            <PlusCircle size={14} />
            <span>नया मंडी भाव दर्ज करें</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={`text-[11px] block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>फसल का नाम *</label>
              <input 
                type="text" 
                value={newCropName}
                onChange={(e) => setNewCropName(e.target.value)}
                placeholder="उदा. गुड़ (देसी/सुपर)"
                className={`w-full border rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500 ${
                  isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900 focus:bg-white'
                }`}
              />
            </div>

            <div>
              <label className={`text-[11px] block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>मंडी / जिला *</label>
              <input 
                type="text" 
                value={newCropMandi}
                onChange={(e) => setNewCropMandi(e.target.value)}
                placeholder="उदा. कवर्धा"
                className={`w-full border rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500 ${
                  isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900 focus:bg-white'
                }`}
              />
            </div>

            <div>
              <label className={`text-[11px] block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>राज्य</label>
              <select
                value={newCropState}
                onChange={(e) => setNewCropState(e.target.value as 'CG' | 'MP')}
                className={`w-full border rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500 ${
                  isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="CG">छत्तीसगढ़ (CG)</option>
                <option value="MP">मध्य प्रदेश (MP)</option>
              </select>
            </div>

            <div>
              <label className={`text-[11px] block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>भाव (₹ में) *</label>
              <input 
                type="number" 
                value={newCropRate}
                onChange={(e) => setNewCropRate(Number(e.target.value))}
                placeholder="3500"
                className={`w-full border rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500 font-bold ${
                  isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900 focus:bg-white'
                }`}
              />
            </div>

            <div>
              <label className={`text-[11px] block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>इकाई (Unit)</label>
              <input 
                type="text" 
                value={newCropUnit}
                onChange={(e) => setNewCropUnit(e.target.value)}
                placeholder="₹/क्विंटल"
                className={`w-full border rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500 ${
                  isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900 focus:bg-white'
                }`}
              />
            </div>

            <div>
              <label className={`text-[11px] block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>बाज़ार का रुख (Trend) व अंतर (Diff)</label>
              <div className="flex gap-2">
                <select
                  value={newCropChange}
                  onChange={(e) => setNewCropChange(e.target.value as 'up' | 'down' | 'steady')}
                  className={`border rounded-xl px-2 py-2 text-xs outline-none ${
                    isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="up">🔼 तेजी</option>
                  <option value="down">🔽 मंदी</option>
                  <option value="steady">➖ स्थिर</option>
                </select>
                <input 
                  type="number"
                  value={newCropDiff}
                  onChange={(e) => setNewCropDiff(Number(e.target.value))}
                  placeholder="± अंतर"
                  className={`w-full border rounded-xl px-2 py-2 text-xs outline-none ${
                    isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900 focus:bg-white'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className={`flex justify-end gap-2 mt-4 pt-3 border-t ${
            isDark ? 'border-white/10' : 'border-slate-200'
          }`}>
            <button
              onClick={() => setShowAddCropModal(false)}
              className={`px-3.5 py-1.5 rounded-xl text-xs transition cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              रद्द करें
            </button>
            <button
              onClick={() => {
                if (!newCropName.trim() || !newCropRate) return;
                if (onAddMandiRate) {
                  onAddMandiRate({
                    crop: newCropName.trim(),
                    mandi: newCropMandi.trim() || 'कवर्धा',
                    state: newCropState,
                    rate: newCropRate,
                    unit: newCropUnit.trim() || '₹/क्विंटल',
                    change: newCropChange,
                    diff: newCropDiff
                  });
                }
                setNewCropName('');
                setShowAddCropModal(false);
              }}
              disabled={!newCropName.trim() || !newCropRate}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow active:scale-95 cursor-pointer"
            >
              सहेजें (Save Rate)
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {mandiRates.map((item) => {
          const isEditing = editingMandiId === item.id;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-colors duration-200 ${
                isEditing 
                  ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-950/20' 
                  : isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              {isEditing ? (
                <div className="space-y-3">
                  <div className={`flex items-center justify-between border-b pb-2 ${
                    isDark ? 'border-white/10' : 'border-slate-200'
                  }`}>
                    <span className="text-xs font-black text-emerald-500 flex items-center gap-1">
                      <Edit3 size={13} /> {item.crop}
                    </span>
                    <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.mandi} ({item.state})</span>
                  </div>

                  <div>
                    <label className={`text-[10px] block mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>नया भाव (₹)</label>
                    <input 
                      type="number"
                      value={editRateVal}
                      onChange={(e) => setEditRateVal(Number(e.target.value))}
                      className={`w-full border rounded-xl px-2.5 py-1.5 text-sm font-bold outline-none ${
                        isDark ? 'bg-[#05070e] border-emerald-500/50 text-white' : 'bg-white border-emerald-500 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={`text-[10px] block mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>रुख (Trend)</label>
                      <select
                        value={editChangeVal}
                        onChange={(e) => setEditChangeVal(e.target.value as 'up' | 'down' | 'steady')}
                        className={`w-full border rounded-xl px-2 py-1.5 text-xs outline-none ${
                          isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      >
                        <option value="up">🔼 तेजी</option>
                        <option value="down">🔽 मंदी</option>
                        <option value="steady">➖ स्थिर</option>
                      </select>
                    </div>
                    <div>
                      <label className={`text-[10px] block mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>अंतर (± Diff)</label>
                      <input 
                        type="number"
                        value={editDiffVal}
                        onChange={(e) => setEditDiffVal(Number(e.target.value))}
                        className={`w-full border rounded-xl px-2 py-1.5 text-xs outline-none ${
                          isDark ? 'bg-[#05070e] border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900 focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  <div className={`flex justify-end gap-2 pt-2 border-t ${
                    isDark ? 'border-white/10' : 'border-slate-200'
                  }`}>
                    <button
                      onClick={() => setEditingMandiId(null)}
                      className={`px-2.5 py-1 text-xs transition cursor-pointer ${
                        isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      रद्द करें
                    </button>
                    <button
                      onClick={() => {
                        if (onUpdateMandiRate) {
                          onUpdateMandiRate({
                            ...item,
                            rate: editRateVal,
                            change: editChangeVal,
                            diff: editDiffVal
                          });
                        }
                        setEditingMandiId(null);
                      }}
                      className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow active:scale-95 cursor-pointer"
                    >
                      <Save size={12} />
                      <span>अपडेट करें</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-md ${
                        isDark ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60' : 'text-emerald-800 bg-emerald-50 border-emerald-200'
                      }`}>
                        📍 {item.mandi} ({item.state})
                      </span>
                      <h4 className={`text-sm font-black mt-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {item.crop}
                      </h4>
                    </div>

                    <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                      item.change === 'up' 
                        ? isDark ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/50' : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                        : item.change === 'down' 
                        ? isDark ? 'text-rose-400 bg-rose-950/60 border border-rose-800/50' : 'text-rose-700 bg-rose-50 border border-rose-200'
                        : isDark ? 'text-slate-400 bg-slate-800/60 border border-slate-700/50' : 'text-slate-700 bg-slate-100 border border-slate-200'
                    }`}>
                      {item.change === 'up' && (
                        <>
                          <TrendingUp size={11} />
                          <span>+{item.diff}</span>
                        </>
                      )}
                      {item.change === 'down' && (
                        <>
                          <TrendingDown size={11} />
                          <span>-{item.diff}</span>
                        </>
                      )}
                      {item.change === 'steady' && (
                        <>
                          <Minus size={11} />
                          <span>स्थिर</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className={`mt-3 flex items-baseline justify-between pt-2 border-t ${
                    isDark ? 'border-white/5' : 'border-slate-100'
                  }`}>
                    <div className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      ₹{item.rate.toLocaleString('en-IN')}{' '}
                      <span className={`text-[10px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.unit}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingMandiId(item.id);
                          setEditRateVal(item.rate);
                          setEditChangeVal(item.change);
                          setEditDiffVal(item.diff);
                        }}
                        className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition active:scale-95 cursor-pointer ${
                          isDark 
                            ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-800/50'
                            : 'text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                        }`}
                        title="भाव बदलें"
                      >
                        <Edit3 size={11} />
                        <span>भाव बदलें</span>
                      </button>

                      {onDeleteMandiRate && (
                        <button
                          onClick={() => { if (window.confirm(`क्या आप ${item.crop} का मंडी भाव हटाना चाहते हैं?`)) onDeleteMandiRate(item.id); }}
                          className="text-slate-400 hover:text-red-500 p-1 rounded transition cursor-pointer"
                          title="हटाएं"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
