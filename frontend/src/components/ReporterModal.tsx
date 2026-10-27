import React, { useState } from 'react';
import { Send, X, Camera, MapPin, Tag, User, Mic } from 'lucide-react';
import type { Article, DistrictItem } from '../types';
import { useVoiceTyping } from '../hooks/useVoiceTyping';

interface ReporterModalProps {
  districts: DistrictItem[];
  selectedState: 'chhattisgarh' | 'madhya-pradesh';
  onSubmit: (article: Partial<Article>) => void;
  onClose: () => void;
  isDark: boolean;
}

export const ReporterModal: React.FC<ReporterModalProps> = ({
  districts,
  selectedState,
  onSubmit,
  onClose,
  isDark
}) => {
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [district, setDistrict] = useState('कबीरधाम (कवर्धा)');
  const [category, setCategory] = useState('🔴 कवर्धा स्पेशल');
  const [author, setAuthor] = useState('फ़ील्ड रिपोर्टर (कवर्धा)');
  const [coverImage, setCoverImage] = useState(
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1000&auto=format&fit=crop&q=80'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Voice Typing Hooks
  const [headlineInterim, setHeadlineInterim] = useState('');
  const {
    isListening: isListeningHeadline,
    isSupported: isVoiceSupported,
    toggleListening: toggleVoiceHeadline
  } = useVoiceTyping({
    lang: 'hi-IN',
    onResult: (text) => {
      setTitle((prev) => (prev ? prev + ' ' + text : text));
    },
    onInterim: (text) => {
      setHeadlineInterim(text);
    }
  });

  const [excerptInterim, setExcerptInterim] = useState('');
  const {
    isListening: isListeningExcerpt,
    toggleListening: toggleVoiceExcerpt
  } = useVoiceTyping({
    lang: 'hi-IN',
    onResult: (text) => {
      setExcerpt((prev) => (prev ? prev + ' ' + text : text));
    },
    onInterim: (text) => {
      setExcerptInterim(text);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !excerpt.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit({
        title,
        excerpt,
        content: `${excerpt}\n\n[ग्राउंड रिपोर्ट: ${district} से विशेष संवाददाता द्वारा प्रेषित]\nस्थानीय नागरिकों एवं प्रशासन के अनुसार स्थिति पर लगातार नजर रखी जा रही है। अधिक जानकारी की प्रतीक्षा है।`,
        district,
        state: selectedState,
        category,
        author,
        coverImage,
        isBreaking: true,
        views: 1,
        publishedAt: new Date().toISOString()
      });
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className={`relative w-full max-w-lg sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl border p-5 space-y-4 my-0 sm:my-auto max-h-[92vh] overflow-y-auto z-10 ${
        isDark ? 'bg-slate-900 text-slate-100 border-slate-700' : 'bg-white text-slate-900 border-slate-300'
      }`}>
        
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1.5 bg-slate-600/70 rounded-full mx-auto -mt-1 mb-2 sm:hidden"></div>

        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center shadow">
              <Send size={16} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                फ़ील्ड रिपोर्टर पोर्टल • तुरंत खबर भेजें
              </h3>
              <p className="text-[11px] text-slate-400">
                सीधे Ambition News लाइव पोर्टल और सोशल डेस्क पर प्रकाशित होगी
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          
          {/* Row 1: District & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
                <MapPin size={12} className="text-red-500" /> जिला चुनें *
              </label>
              <select 
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-red-500 font-medium"
              >
                <option value="कबीरधाम (कवर्धा)">कबीरधाम (कवर्धा) 👑</option>
                {districts
                  .filter(d => d.nameHindi !== 'कबीरधाम (कवर्धा)')
                  .map(d => (
                    <option key={d._id} value={d.nameHindi || d.name}>
                      {d.nameHindi || d.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
                <Tag size={12} className="text-orange-500" /> श्रेणी / Category *
              </label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-red-500 font-medium"
              >
                <option value="🔴 कवर्धा स्पेशल">🔴 कवर्धा स्पेशल</option>
                <option value="🏛️ राजनीति">🏛️ राजनीति</option>
                <option value="🚔 अपराध व कानून">🚔 अपराध व कानून</option>
                <option value="🌾 कृषि व मंडी">🌾 कृषि व मंडी</option>
                <option value="🏗️ विकास कार्य">🏗️ विकास कार्य</option>
                <option value="📚 शिक्षा व रोजगार">📚 शिक्षा व रोजगार</option>
                <option value="🌦️ मौसम">🌦️ मौसम</option>
              </select>
            </div>
          </div>

          {/* Row 2: Headline */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-400 font-semibold text-xs">
                खबर की मुख्य हेडलाइन (Title) *
              </label>
              {isVoiceSupported && (
                <button
                  type="button"
                  onClick={toggleVoiceHeadline}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                    isListeningHeadline ? 'bg-red-600 text-white animate-pulse' : 'text-slate-400 hover:text-red-400'
                  }`}
                  title="बोलकर हेडलाइन लिखें"
                >
                  <Mic size={11} className={isListeningHeadline ? 'animate-bounce text-white' : ''} />
                  <span>{isListeningHeadline ? 'बोलना बंद करें ⏹️' : '🎙️ बोलकर लिखें'}</span>
                </button>
              )}
            </div>
            <div className="relative">
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="जैसे: कवर्धा में नए बस स्टैंड के निर्माण का टेंडर जारी..." 
                required 
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-red-500 text-xs font-medium placeholder:text-slate-500" 
              />
            </div>
            {isListeningHeadline && (
              <div className="mt-1 flex items-center gap-1.5 text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                <span>🎙️ सुन रहा हूँ: {headlineInterim || 'बोलिए...'}</span>
              </div>
            )}
          </div>

          {/* Row 3: Reporter Byline */}
          <div>
            <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
              <User size={12} className="text-blue-500" /> रिपोर्टर / संवाददाता का नाम *
            </label>
            <input 
              type="text" 
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="आपका नाम व ब्यूरो" 
              required 
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none focus:border-red-500 text-xs font-medium" 
            />
          </div>

          {/* Row 4: Excerpt */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-400 font-semibold text-xs">
                घटना का विवरण (News Content) *
              </label>
              {isVoiceSupported && (
                <button
                  type="button"
                  onClick={toggleVoiceExcerpt}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                    isListeningExcerpt ? 'bg-red-600 text-white animate-pulse' : 'text-slate-400 hover:text-red-400'
                  }`}
                  title="बोलकर विवरण लिखें"
                >
                  <Mic size={11} className={isListeningExcerpt ? 'animate-bounce text-white' : ''} />
                  <span>{isListeningExcerpt ? 'बोलना बंद करें ⏹️' : '🎙️ बोलकर लिखें'}</span>
                </button>
              )}
            </div>
            <div className="relative">
              <textarea 
                rows={3} 
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="घटना की पूरी जानकारी, समय, स्थान और प्रत्यक्षदर्शियों का बयान लिखें..." 
                required 
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-red-500 text-xs placeholder:text-slate-500 leading-relaxed"
              ></textarea>
            </div>
            {isListeningExcerpt && (
              <div className="mt-1 flex items-center gap-1.5 text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                <span>🎙️ सुन रहा हूँ: {excerptInterim || 'बोलिए, विवरण टाइप हो रहा है...'}</span>
              </div>
            )}
          </div>

          {/* Row 5: Photo Preset selector */}
          <div>
            <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
              <Camera size={12} className="text-emerald-500" /> फोटो चुनें
            </label>
            <div className="flex gap-2">
              {[
                { label: '🏛️ विकास/सड़क', url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80' },
                { label: '🌾 कृषि/मंडी', url: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&auto=format&fit=crop&q=80' },
                { label: '🚔 पुलिस/कानून', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80' },
                { label: '📢 प्रेस वार्ता', url: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&auto=format&fit=crop&q=80' }
              ].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCoverImage(p.url)}
                  className={`text-[10px] px-2 py-1 rounded-lg border font-medium transition ${
                    coverImage === p.url 
                      ? 'bg-red-600 text-white border-red-500' 
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-slate-800">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl text-slate-300 font-semibold transition"
            >
              रद्द करें
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 bg-red-600 hover:bg-red-500 py-2.5 rounded-xl text-white font-bold flex items-center justify-center gap-1.5 shadow-lg transition active:scale-95 disabled:opacity-50"
            >
              <Send size={13} />
              <span>{isSubmitting ? 'प्रकाशित कर रहे हैं...' : 'लाइव सबमिट करें'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
