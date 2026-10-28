import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Share2, MessageCircle } from 'lucide-react';
import type { Article } from '../types';

interface WhatsAppBulletinModalProps {
  article: Article;
  whatsappLink?: string;
  isDark: boolean;
  onClose: () => void;
}

export const WhatsAppBulletinModal: React.FC<WhatsAppBulletinModalProps> = ({
  article,
  whatsappLink = '',
  isDark,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  const formattedDate = new Date().toLocaleDateString('hi-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const portalUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/#article-${article._id || (article as any).id || ''}`
    : 'https://ambitionnews.in';

  const groupInviteUrl = whatsappLink || 'https://chat.whatsapp.com/invite';

  const bulletinText = `🔴 *एम्बिशन न्यूज़ • ताज़ा ब्रेकिंग बुलेटिन* 🔴
📍 *${article.district || 'छत्तीसगढ़/म.प्र.'}* | ⏱️ ${formattedDate}

📢 *${article.title}*

📝 *खबर संक्षेप:*
${article.excerpt || article.content?.slice(0, 160) + '...'}

🔗 *पूरी खबर विस्तार से यहाँ पढ़ें:*
${portalUrl}

📲 *एम्बिशन न्यूज़ के आधिकारिक व्हाट्सएप ग्रुप से जुड़ें:*
${groupInviteUrl}
──────────────────
⚡ सबसे पहले, सबसे सटीक • Ambition News Network`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bulletinText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
      const textArea = document.createElement('textarea');
      textArea.value = bulletinText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(bulletinText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: bulletinText
        });
      } catch {
        // user cancelled
      }
    } else {
      handleSendWhatsApp();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div 
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-600 to-green-700 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
              <MessageCircle size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-wide leading-tight">
                📱 1-क्लिक WhatsApp बुलेटिन जनरेटर
              </h3>
              <p className="text-[10px] text-emerald-100">रेडी-टू-फॉरवर्ड फॉर्मेट (ग्रुप्स व ब्रॉडकास्ट के लिए)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center text-xs font-bold transition"
          >
            ✕
          </button>
        </div>

        {/* Formatted Text Preview Area */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          <div className={`flex items-center justify-between text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>व्हाट्सएप संदेश प्रिव्यू:</span>
            <span className={`text-[10px] px-2 py-0.5 rounded ${
              isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              ✓ लिंक व इमोजी शामिल
            </span>
          </div>

          <div className={`p-3.5 rounded-2xl border font-sans text-xs leading-relaxed whitespace-pre-wrap select-all font-medium ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            {bulletinText}
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`p-4 border-t flex flex-col sm:flex-row items-center gap-2.5 ${
          isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-slate-50'
        }`}>
          <button
            onClick={handleCopy}
            className={`flex-1 w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow active:scale-95 ${
              copied 
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
            }`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'कॉपी हो गया! ✓' : 'टेक्स्ट कॉपी करें'}</span>
          </button>

          <button
            onClick={handleSendWhatsApp}
            className="flex-1 w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <ExternalLink size={14} />
            <span>व्हाट्सएप खोलें & भेजें</span>
          </button>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full sm:w-auto p-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white transition active:scale-95 flex items-center justify-center"
              title="शेयर मेनू खोलें"
            >
              <Share2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
