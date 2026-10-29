import React from 'react';
import { 
  BadgeDollarSign, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  Tag, 
  Eye, 
  MousePointerClick, 
  BarChart3, 
  Edit3, 
  PlusCircle, 
  Save, 
  Building2, 
  EyeOff, 
  Trash2, 
  ExternalLink, 
  Sparkles, 
  MapPin 
} from 'lucide-react';
import { WhatsAppIcon } from '../../SocialIcons';
import type { Advertisement, DistrictItem, AdPlacement } from '../../../types';

export interface MonetizationDeskProps {
  isDark: boolean;
  ads: Advertisement[];
  isLoadingAds: boolean;
  adSuccessMsg: string | null;
  editingAdId: string | null;
  adForm: {
    title: string;
    clientName: string;
    clientPhone: string;
    imageUrl: string;
    linkUrl: string;
    placement: AdPlacement;
    targetDistrict: string;
    expiryDate: string;
    priority: number;
    isActive: boolean;
  };
  setAdForm: React.Dispatch<React.SetStateAction<{
    title: string;
    clientName: string;
    clientPhone: string;
    imageUrl: string;
    linkUrl: string;
    placement: AdPlacement;
    targetDistrict: string;
    expiryDate: string;
    priority: number;
    isActive: boolean;
  }>>;
  monetizationSettings: {
    adsenseEnabled?: boolean;
    adsensePublisherId?: string;
    headerSlotId?: string;
    inFeedSlotId?: string;
    articleSlotId?: string;
    whatsappSponsorLine?: string;
    monthlyRevenueGoal?: number;
  };
  setMonetizationSettings: React.Dispatch<React.SetStateAction<any>>;
  isSavingMonetization: boolean;
  districts: DistrictItem[];
  fetchAds: () => void;
  handleResetAdForm: () => void;
  handleSaveAd: (e: React.FormEvent) => void;
  handleEditAd: (ad: Advertisement) => void;
  handleToggleAdStatus: (ad: Advertisement) => void;
  handleDeleteAd: (id: string, title: string) => void;
  handleSendClientReport: (ad: Advertisement) => void;
  handleSaveMonetization: (e: React.FormEvent) => void;
}

export const MonetizationDesk: React.FC<MonetizationDeskProps> = ({
  isDark,
  ads,
  isLoadingAds,
  adSuccessMsg,
  editingAdId,
  adForm,
  setAdForm,
  monetizationSettings,
  setMonetizationSettings,
  isSavingMonetization,
  districts,
  fetchAds,
  handleResetAdForm,
  handleSaveAd,
  handleEditAd,
  handleToggleAdStatus,
  handleDeleteAd,
  handleSendClientReport,
  handleSaveMonetization
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header / Intro Card */}
      <div className={`p-6 rounded-3xl border shadow-xl relative overflow-hidden backdrop-blur-xl ${
        isDark 
          ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/30' 
          : 'bg-gradient-to-r from-amber-50/80 via-white to-amber-50/50 border-amber-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20 font-black">
              <BadgeDollarSign size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className={`text-xl md:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  विज्ञापन व मोनेटाइजेशन नियंत्रण केंद्र
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  स्थानीय प्रायोजक + AdSense
                </span>
              </div>
              <p className={`text-xs md:text-sm mt-1 max-w-2xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                स्थानीय व्यापारियों के विज्ञापन स्लॉट्स (Header, Feed, Article, Sidebar) लाइव लगाएं, वास्तविक पाठक इम्प्रेशन्स और WhatsApp लीड्स ट्रैक करें, और 1-क्लिक में क्लाइंट को रिपोर्ट भेजें।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={() => {
                handleResetAdForm();
                const formEl = document.getElementById('ad-campaign-form');
                if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={16} />
              नया विज्ञापन जोड़ें
            </button>
            <button
              onClick={fetchAds}
              disabled={isLoadingAds}
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
                isDark ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300' : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
              }`}
              title="रिफ्रेश करें"
            >
              <RefreshCw size={16} className={isLoadingAds ? 'animate-spin text-amber-400' : ''} />
            </button>
          </div>
        </div>

        {/* Success Notification Alert */}
        {adSuccessMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{adSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Performance KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>सक्रिय कैंपेन</span>
            <Tag size={16} className="text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {ads.filter(a => a.isActive).length}
            </span>
            <span className="text-xs text-slate-400">/ {ads.length} कुल</span>
          </div>
          <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            लाइव स्लॉट्स कार्यरत
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>कुल पाठक इम्प्रेशन्स</span>
            <Eye size={16} className="text-blue-400" />
          </div>
          <div className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {ads.reduce((acc, a) => acc + (a.impressions || 0), 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">पोर्टल पर लाइव दृश्य (Views)</div>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>क्लिक्स व लीड्स</span>
            <MousePointerClick size={16} className="text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {ads.reduce((acc, a) => acc + (a.clicks || 0), 0).toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-bold text-amber-400">
              CTR: {ads.reduce((acc, a) => acc + (a.impressions || 0), 0) > 0 ? ((ads.reduce((acc, a) => acc + (a.clicks || 0), 0) / ads.reduce((acc, a) => acc + (a.impressions || 0), 0)) * 100).toFixed(1) : '0.0'}%
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">व्यापारी WhatsApp व वेबसाइट पर गए</div>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>मासिक कमाई लक्ष्य</span>
            <BarChart3 size={16} className="text-emerald-400" />
          </div>
          <div className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            ₹{(monetizationSettings.monthlyRevenueGoal || 50000).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-emerald-400 mt-1">स्थानीय विज्ञापन + स्पॉन्सरशिप्स</div>
        </div>
      </div>

      {/* Form & List Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Form: Add / Edit Ad Campaign (5 cols) */}
        <div 
          id="ad-campaign-form"
          className={`lg:col-span-5 p-6 rounded-3xl border shadow-xl ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-700/40 mb-5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                {editingAdId ? <Edit3 size={18} /> : <PlusCircle size={18} />}
              </span>
              <div>
                <h3 className={`font-black text-sm md:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {editingAdId ? 'विज्ञापन कैंपेन संपादित करें' : 'नया विज्ञापन कैंपेन जोड़ें'}
                </h3>
                <p className="text-[11px] text-slate-400">क्लाइंट विवरण व बैनर सेट करें</p>
              </div>
            </div>
            {editingAdId && (
              <button
                onClick={handleResetAdForm}
                className="text-xs text-rose-400 hover:text-rose-300 font-bold px-2 py-1 rounded-lg bg-rose-500/10 cursor-pointer"
              >
                रद्द करें
              </button>
            )}
          </div>

          <form onSubmit={handleSaveAd} className="space-y-4">
            {/* Title */}
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                अभियान / ऑफर का शीर्षक *
              </label>
              <input
                type="text"
                required
                placeholder="उदा: राजस्थानी स्वीट्स कवर्धा - 20% की छूट"
                value={adForm.title}
                onChange={e => setAdForm({ ...adForm, title: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium outline-none transition ${
                  isDark ? 'bg-slate-800/80 border-slate-700 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                }`}
              />
            </div>

            {/* Client Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  क्लाइंट / फर्म का नाम *
                </label>
                <input
                  type="text"
                  required
                  placeholder="उदा: अग्रवाल ज्वेलर्स"
                  value={adForm.clientName}
                  onChange={e => setAdForm({ ...adForm, clientName: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium outline-none transition ${
                    isDark ? 'bg-slate-800/80 border-slate-700 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  क्लाइंट WhatsApp नंबर
                </label>
                <input
                  type="tel"
                  placeholder="उदा: 98261XXXXX"
                  value={adForm.clientPhone}
                  onChange={e => setAdForm({ ...adForm, clientPhone: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium outline-none transition ${
                    isDark ? 'bg-slate-800/80 border-slate-700 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                  }`}
                />
              </div>
            </div>

            {/* Placement & Target District */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  विज्ञापन स्लॉट (Placement) *
                </label>
                <select
                  value={adForm.placement}
                  onChange={e => setAdForm({ ...adForm, placement: e.target.value as AdPlacement })}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium outline-none transition ${
                    isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="in_feed">📰 समाचार फ़ीड बैनर (In-Feed)</option>
                  <option value="header_top">🔝 शीर्ष हेडर बैनर (Header Top)</option>
                  <option value="article_bottom">📄 पूरी खबर के नीचे (Article Bottom)</option>
                  <option value="sidebar">📌 साइडबार / डेस्कटॉप (Sidebar)</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  लक्षित जिला (Target Area)
                </label>
                <select
                  value={adForm.targetDistrict}
                  onChange={e => setAdForm({ ...adForm, targetDistrict: e.target.value })}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium outline-none transition ${
                    isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="सभी 88 जिले">सभी 88 जिले (छ.ग. + म.प्र.)</option>
                  <option value="कवर्धा">कवर्धा (कबीरधाम)</option>
                  <option value="रायपुर">रायपुर</option>
                  <option value="बिलासपुर">बिलासपुर</option>
                  <option value="दुर्ग">दुर्ग</option>
                  <option value="राजनांदगांव">राजनांदगांव</option>
                  <option value="भोपाल">भोपाल</option>
                  <option value="इंदौर">इंदौर</option>
                  <option value="जबलपुर">जबलपुर</option>
                  {districts
                    .filter(d => !['कबीरधाम (कवर्धा)', 'कवर्धा', 'रायपुर', 'बिलासपुर', 'दुर्ग', 'राजनांदगांव', 'भोपाल', 'इंदौर', 'जबलपुर'].includes(d.nameHindi || d.name))
                    .map(d => (
                      <option key={d._id || d.name} value={d.nameHindi || d.name}>
                        {d.nameHindi || d.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Banner Image URL */}
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                बैनर इमेज URL *
              </label>
              <input
                type="url"
                required
                placeholder="https://images.unsplash.com/... या CDN लिंक"
                value={adForm.imageUrl}
                onChange={e => setAdForm({ ...adForm, imageUrl: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium outline-none transition ${
                  isDark ? 'bg-slate-800/80 border-slate-700 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                }`}
              />
              {adForm.imageUrl && (
                <div className="mt-2 p-2 rounded-xl border border-dashed border-slate-700 bg-slate-950/40">
                  <div className="text-[10px] text-slate-400 mb-1">लाइव बैनर प्रीव्यू:</div>
                  <img 
                    src={adForm.imageUrl} 
                    alt="Banner Preview" 
                    className="w-full max-h-28 object-cover rounded-lg"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>

            {/* Destination Link */}
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                क्लिक पर रीडायरेक्ट लिंक (WhatsApp या वेबसाइट) *
              </label>
              <input
                type="url"
                required
                placeholder="https://wa.me/9198261XXXXX?text=नमस्ते या वेबसाइट लिंक"
                value={adForm.linkUrl}
                onChange={e => setAdForm({ ...adForm, linkUrl: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium outline-none transition ${
                  isDark ? 'bg-slate-800/80 border-slate-700 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                }`}
              />
            </div>

            {/* Expiry Date, Priority & Active */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  समाप्ति तिथि
                </label>
                <input
                  type="date"
                  value={adForm.expiryDate}
                  onChange={e => setAdForm({ ...adForm, expiryDate: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-medium outline-none transition ${
                    isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  प्राथमिकता (0-10)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={adForm.priority}
                  onChange={e => setAdForm({ ...adForm, priority: parseInt(e.target.value) || 0 })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-medium outline-none transition ${
                    isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adForm.isActive}
                    onChange={e => setAdForm({ ...adForm, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                  />
                  <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    तुरंत लाइव रखें
                  </span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-lg transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save size={16} />
                {editingAdId ? 'विज्ञापन अपडेट करें' : 'विज्ञापन लाइव प्रकाशित करें'}
              </button>
              {editingAdId && (
                <button
                  type="button"
                  onClick={handleResetAdForm}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    isDark ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-slate-300 bg-slate-100 text-slate-700'
                  }`}
                >
                  रद्द करें
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List of Ads / Campaigns (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/40">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-amber-400" />
              <h3 className={`font-black text-sm md:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                लाइव विज्ञापन कैंपेन सूची ({ads.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              {ads.filter(a => a.isActive).length} सक्रिय
            </span>
          </div>

          {isLoadingAds ? (
            <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw size={16} className="animate-spin text-amber-400" />
              विज्ञापन डेटा लोड हो रहा है...
            </div>
          ) : ads.length === 0 ? (
            <div className={`p-8 rounded-3xl border text-center ${
              isDark ? 'bg-slate-900/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <BadgeDollarSign size={40} className="mx-auto text-amber-400 mb-2 opacity-60" />
              <p className="font-bold text-sm">अभी कोई विज्ञापन कैंपेन दर्ज नहीं है</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                बाईं ओर दिए गए फॉर्म से स्थानीय दुकानों, कोचिंग, डॉक्टरों या इवेंट्स के लिए पहला पेड बैनर जोड़ें।
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {ads.map((ad) => {
                const ctr = (ad.impressions && ad.impressions > 0)
                  ? (((ad.clicks || 0) / ad.impressions) * 100).toFixed(1)
                  : '0.0';

                return (
                  <div
                    key={ad._id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isDark 
                        ? ad.isActive ? 'bg-slate-900/90 border-slate-800 hover:border-amber-500/50' : 'bg-slate-950/40 border-slate-800/50 opacity-60'
                        : ad.isActive ? 'bg-white border-slate-200 shadow-sm hover:border-amber-300' : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Thumbnail & Details */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <img
                          src={ad.imageUrl}
                          alt={ad.title}
                          className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-700/60 bg-slate-950"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              ad.placement === 'header_top' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                              ad.placement === 'article_bottom' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                              'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {ad.placement === 'header_top' ? 'शीर्ष हेडर' : ad.placement === 'article_bottom' ? 'खबर के नीचे' : 'समाचार फ़ीड'}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <MapPin size={10} />
                              {ad.targetDistrict}
                            </span>
                            {(ad.priority ?? 0) > 0 && (
                              <span className="text-[9px] text-yellow-400 font-mono font-bold">
                                ★ P{ad.priority}
                              </span>
                            )}
                          </div>

                          <h4 className={`text-xs md:text-sm font-bold truncate mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {ad.title}
                          </h4>

                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="font-semibold text-slate-300">{ad.clientName}</span>
                            {ad.clientPhone && <span>• 📞 {ad.clientPhone}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Center: Live Metrics */}
                      <div className="flex items-center gap-3 shrink-0 px-3 py-1.5 rounded-xl bg-slate-950/40 border border-slate-800">
                        <div className="text-center">
                          <div className="text-[10px] text-slate-400">व्यूज़</div>
                          <div className="text-xs font-black font-mono text-blue-400">
                            {(ad.impressions || 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                        <div className="h-6 w-px bg-slate-800" />
                        <div className="text-center">
                          <div className="text-[10px] text-slate-400">क्लिक्स</div>
                          <div className="text-xs font-black font-mono text-purple-400">
                            {(ad.clicks || 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                        <div className="h-6 w-px bg-slate-800" />
                        <div className="text-center">
                          <div className="text-[10px] text-slate-400">CTR</div>
                          <div className="text-xs font-black font-mono text-amber-400">
                            {ctr}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      {/* Left: Active Toggle */}
                      <button
                        onClick={() => handleToggleAdStatus(ad)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                          ad.isActive
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {ad.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                        {ad.isActive ? 'सक्रिय (Live)' : 'रोकी गई (Paused)'}
                      </button>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5">
                        {/* 1-Click WhatsApp Client Report */}
                        <button
                          onClick={() => handleSendClientReport(ad)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                          title="क्लाइंट को WhatsApp पर प्रदर्शन रिपोर्ट भेजें"
                        >
                          <WhatsAppIcon size={12} />
                          <span>1-Click रिपोर्ट</span>
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleEditAd(ad)}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                          }`}
                          title="संपादित करें"
                        >
                          <Edit3 size={13} />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteAd(ad._id, ad.title)}
                          className="p-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                          title="हटाएं"
                        >
                          <Trash2 size={13} />
                        </button>

                        {/* Open Link */}
                        <a
                          href={ad.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-1.5 rounded-lg border transition ${
                            isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-400' : 'border-slate-300 hover:bg-slate-100 text-slate-600'
                          }`}
                          title="रीडायरेक्ट लिंक खोलें"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Google AdSense & Global Monetization Settings */}
      <div className={`p-6 rounded-3xl border shadow-xl ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3 pb-4 border-b border-slate-700/40 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className={`font-black text-sm md:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Google AdSense एवं वैश्विक मोनेटाइजेशन सेटिंग्स
            </h3>
            <p className="text-[11px] text-slate-400">
              जब कोई स्थानीय विज्ञापन न हो, तो Google AdSense स्वतः बैकफिल होगा
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveMonetization} className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-800 bg-slate-950/40">
            <div>
              <div className="text-xs font-bold text-white">Google AdSense नेटवर्क सक्षम करें</div>
              <div className="text-[10px] text-slate-400">रिक्त स्लॉट्स में Google Ads प्रदर्शित होंगे</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={monetizationSettings.adsenseEnabled}
                onChange={e => setMonetizationSettings({ ...monetizationSettings, adsenseEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                AdSense Publisher ID
              </label>
              <input
                type="text"
                placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                value={monetizationSettings.adsensePublisherId || ''}
                onChange={e => setMonetizationSettings({ ...monetizationSettings, adsensePublisherId: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono outline-none transition ${
                  isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Header Ad Slot ID
              </label>
              <input
                type="text"
                placeholder="उदा: 1234567890"
                value={monetizationSettings.headerSlotId || ''}
                onChange={e => setMonetizationSettings({ ...monetizationSettings, headerSlotId: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono outline-none transition ${
                  isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Feed Ad Slot ID
              </label>
              <input
                type="text"
                placeholder="उदा: 2345678901"
                value={monetizationSettings.inFeedSlotId || ''}
                onChange={e => setMonetizationSettings({ ...monetizationSettings, inFeedSlotId: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono outline-none transition ${
                  isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Article Ad Slot ID
              </label>
              <input
                type="text"
                placeholder="उदा: 3456789012"
                value={monetizationSettings.articleSlotId || ''}
                onChange={e => setMonetizationSettings({ ...monetizationSettings, articleSlotId: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono outline-none transition ${
                  isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                WhatsApp बुलेटिन प्रायोजक लाइन (Daily Bulletin Sponsor Footer)
              </label>
              <input
                type="text"
                value={monetizationSettings.whatsappSponsorLine || ''}
                onChange={e => setMonetizationSettings({ ...monetizationSettings, whatsappSponsorLine: e.target.value })}
                placeholder="डिजिटल विज्ञापन व कवरेज हेतु संपर्क करें: 7000139694"
                className={`w-full px-3 py-2 rounded-xl border text-xs font-medium outline-none transition ${
                  isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                मासिक विज्ञापन आय लक्ष्य (₹)
              </label>
              <input
                type="number"
                value={monetizationSettings.monthlyRevenueGoal || 50000}
                onChange={e => setMonetizationSettings({ ...monetizationSettings, monthlyRevenueGoal: parseInt(e.target.value) || 0 })}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono outline-none transition ${
                  isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSavingMonetization}
              className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Save size={15} />
              <span>{isSavingMonetization ? 'सहेजा जा रहा है...' : 'मोनेटाइजेशन सेटिंग्स सुरक्षित करें'}</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};
