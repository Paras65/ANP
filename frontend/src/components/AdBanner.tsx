import React from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';
import type { Advertisement, AdPlacement } from '../types';
import { WhatsAppIcon } from './SocialIcons';
import api from '../api/client';

interface AdBannerProps {
  ad?: Advertisement | null;
  placement: AdPlacement;
  isDark: boolean;
  onContactWhatsApp?: () => void;
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  ad,
  placement,
  isDark,
  onContactWhatsApp,
  className = ''
}) => {
  const handleClick = () => {
    if (ad?._id) {
      // Record click asynchronously
      api.post(`/ads/${ad._id}/click`).catch(() => {});
      if (ad.linkUrl) {
        window.open(ad.linkUrl, '_blank', 'noopener,noreferrer');
      }
    } else if (onContactWhatsApp) {
      onContactWhatsApp();
    }
  };

  // If live active ad exists
  if (ad && ad.isActive) {
    if (placement === 'header_top') {
      return (
        <div className={`w-full max-w-7xl mx-auto px-2.5 sm:px-4 py-1.5 ${className}`}>
          <div 
            onClick={handleClick}
            className={`relative rounded-2xl overflow-hidden border cursor-pointer group shadow-sm transition hover:shadow-md ${
              isDark ? 'bg-slate-900 border-amber-500/30' : 'bg-amber-50/60 border-amber-200'
            }`}
          >
            <div className="absolute top-1.5 right-2 z-10">
              <span className="text-[9px] font-black uppercase tracking-wider bg-black/75 text-amber-300 px-1.5 py-0.5 rounded backdrop-blur border border-amber-500/30">
                प्रायोजित • AD
              </span>
            </div>
            
            <img 
              src={ad.imageUrl} 
              alt={ad.title} 
              loading="lazy"
              decoding="async"
              className="w-full h-16 sm:h-24 md:h-28 object-cover group-hover:scale-[1.01] transition-transform duration-300"
            />
          </div>
        </div>
      );
    }

    if (placement === 'article_bottom') {
      return (
        <div className={`my-4 p-3.5 rounded-2xl border ${
          isDark ? 'bg-gradient-to-r from-amber-950/30 to-slate-900 border-amber-500/40' : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
        } ${className}`}>
          <div className="flex items-center justify-between text-[10px] font-bold text-amber-500 mb-2">
            <span className="flex items-center gap-1">
              <Sparkles size={11} /> विशेष प्रायोजक (Sponsored Partner)
            </span>
            <span className="bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded text-[9px]">AD</span>
          </div>

          <div 
            onClick={handleClick}
            className="cursor-pointer group space-y-2"
          >
            <div className="relative rounded-xl overflow-hidden border border-amber-500/20 aspect-[21/9] sm:aspect-[3/1] max-h-36">
              <img 
                src={ad.imageUrl} 
                alt={ad.title} 
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <h4 className={`text-xs font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'} group-hover:text-amber-400 transition`}>
                  {ad.title}
                </h4>
                <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {ad.clientName} {ad.clientPhone ? `• 📞 ${ad.clientPhone}` : ''}
                </p>
              </div>

              <span className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] px-3 py-1.5 rounded-xl shadow flex items-center gap-1 shrink-0 transition">
                <span>देखें</span>
                <ExternalLink size={12} />
              </span>
            </div>
          </div>
        </div>
      );
    }

    // Default: in_feed
    return (
      <div 
        onClick={handleClick}
        className={`p-4 rounded-3xl border shadow-md cursor-pointer group transition hover:border-amber-500/60 ${
          isDark ? 'bg-gradient-to-br from-slate-900 via-[#0c1220] to-amber-950/20 border-amber-500/30' : 'bg-gradient-to-br from-white via-amber-50/40 to-orange-50/40 border-amber-200'
        } ${className}`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
            <Sparkles size={10} /> स्थानीय व्यापार विज्ञापन • AD
          </span>
          <span className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            📍 {ad.targetDistrict}
          </span>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-amber-500/20 aspect-[16/8] sm:aspect-[21/9] max-h-48 mb-3">
          <img 
            src={ad.imageUrl} 
            alt={ad.title} 
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h4 className={`text-sm sm:text-base font-black leading-snug ${isDark ? 'text-white' : 'text-slate-900'} group-hover:text-amber-400 transition`}>
              {ad.title}
            </h4>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {ad.clientName} {ad.clientPhone ? `• 📞 ${ad.clientPhone}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {ad.clientPhone && (
              <a
                href={`https://api.whatsapp.com/send?phone=91${ad.clientPhone.replace(/\D/g, '')}&text=${encodeURIComponent(`नमस्ते ${ad.clientName}, मैंने Ambition News Portal पर आपका विज्ञापन देखा:`)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label={`${ad.clientName} से व्हाट्सएप पर संपर्क करें`}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow transition"
              >
                <WhatsAppIcon size={13} />
                <span>WhatsApp</span>
              </a>
            )}
            <span className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-xl shadow flex items-center gap-1 transition">
              <span>विस्तार से जानें</span>
              <ExternalLink size={12} />
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Fallback: If no ad is placed, display invitation to local advertisers
  const defaultWhatsAppPhone = '7000139694';
  const defaultWhatsAppText = encodeURIComponent('नमस्ते Ambition News, मुझे अपने व्यापार / दुकान / संस्थान का विज्ञापन आपके पोर्टल पर प्रकाशित करवाना है। कृपया विज्ञापन दरें व विवरण साझा करें।');

  return (
    <div className={`p-4 sm:p-5 rounded-3xl border ${
      isDark ? 'bg-gradient-to-br from-slate-900 via-[#0e1628] to-slate-900 border-slate-800' : 'bg-gradient-to-br from-amber-50/70 via-orange-50/50 to-white border-amber-200 shadow-sm'
    } ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-black shrink-0 shadow-md">
            📢
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                व्यापार संवर्धन
              </span>
              <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                कवर्धा व 88 जिला नेटवर्क
              </span>
            </div>
            <h4 className={`text-xs sm:text-sm font-black mt-1 leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
              क्या आप अपने व्यापार, दुकान, हॉस्पिटल या स्कूल का विज्ञापन पोर्टल पर देना चाहते हैं?
            </h4>
            <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              हज़ारों स्थानीय पाठकों तक सीधे पहुंचें। बहुत ही किफायती मासिक दरों पर बैनर व वीडियो कवरेज उपलब्ध।
            </p>
          </div>
        </div>

        <a 
          href={`https://api.whatsapp.com/send?phone=91${defaultWhatsAppPhone}&text=${defaultWhatsAppText}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="विज्ञापन व कवरेज के लिए संपादकीय डेस्क से व्हाट्सएप पर संपर्क करें"
          className="shrink-0 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md transition active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <WhatsAppIcon size={15} />
          <span>विज्ञापन दें (WhatsApp)</span>
        </a>
      </div>
    </div>
  );
};
