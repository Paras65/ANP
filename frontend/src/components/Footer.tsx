import React from 'react';
import { ShieldCheck, Mail, MapPin, Phone } from 'lucide-react';
import { YoutubeIcon, InstagramIcon, WhatsAppIcon, FacebookIcon } from './SocialIcons';
import { SOCIAL_LINKS } from '../data/mockData';

interface FooterProps {
  isDark: boolean;
  onOpenAdminPortal?: () => void;
  onOpenReporterModal?: () => void;
  onOpenCompliance?: (tab: 'editorial' | 'factcheck' | 'grievance' | 'privacy' | 'terms' | 'disclaimer') => void;
  whatsappLink?: string;
  youtubeSubs?: string;
}

export const Footer: React.FC<FooterProps> = ({ 
  isDark, 
  onOpenAdminPortal, 
  onOpenReporterModal,
  onOpenCompliance,
  whatsappLink,
  youtubeSubs
}) => {
  return (
    <footer className={`border-t pt-10 pb-32 sm:pb-16 transition-colors text-xs ${
      isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-600'
    }`}>
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        <h2 className="sr-only">एम्बिशन न्यूज़ पोर्टल पादलेख (Footer)</h2>
        
        {/* Row 1: Brand, Address & Socials */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Col 1: Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <img 
                src="/logo.png" 
                alt="एम्बिशन न्यूज़" 
                width="48"
                height="48"
                loading="lazy"
                decoding="async"
                className="w-12 h-12 rounded-full object-cover ring-2 ring-red-500/60 bg-white p-0.5 shadow-md shrink-0" 
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="bg-red-600 text-white font-black text-lg px-2 py-0.5 rounded shadow leading-none">
                    एम्बिशन
                  </span>
                  <span className="text-xs bg-slate-900 border border-red-500/40 text-red-400 font-bold px-1.5 py-0.5 rounded leading-none">
                    न्यूज़
                  </span>
                </div>
                <span className="text-[10px] text-red-400 font-semibold mt-1">ambitionnews.com</span>
              </div>
            </div>
            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
              कवर्धा (कबीरधाम) का अग्रणी डिजिटल न्यूज़ नेटवर्क। छत्तीसगढ़ के 33 और मध्यप्रदेश के 55 जिलों की निष्पक्ष, निर्भीक और सटीक जमीनी पत्रकारिता।
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <div className="text-red-500 font-semibold flex items-center gap-1">
                <MapPin size={12} />
                <span>कवर्धा (कबीरधाम), छत्तीसगढ़ — 491995</span>
              </div>
              <div className="text-emerald-500 font-semibold flex items-center gap-1">
                <Phone size={12} />
                <a href={`tel:${SOCIAL_LINKS.phoneFormatted}`} aria-label={`कॉल करें ${SOCIAL_LINKS.phoneFormatted}`} className="hover:underline">
                  {SOCIAL_LINKS.phoneFormatted}
                </a>
              </div>
            </div>
          </div>

          {/* Col 2: Social Links Hub */}
          <div className="space-y-2.5">
            <h3 className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              सोशल मीडिया नेटवर्क
            </h3>
            <div className="space-y-2 text-[11px]">
              
              <a 
                href={SOCIAL_LINKS.youtube}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="एम्बिशन न्यूज़ आधिकारिक यूट्यूब चैनल"
                className={`flex items-center gap-2 p-2 rounded-lg border transition group ${
                  isDark ? 'bg-red-950/40 border-red-900/60 hover:border-red-600 text-red-300 hover:text-white' : 'bg-white border-red-200 hover:border-red-400 text-slate-800 shadow-sm'
                }`}
              >
                <div className="p-1 rounded bg-red-600 text-white group-hover:scale-110 transition">
                  <YoutubeIcon size={14} />
                </div>
                <div>
                  <div className="font-bold">YouTube Official</div>
                  <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{SOCIAL_LINKS.youtubeHandle} • {youtubeSubs || SOCIAL_LINKS.youtubeSubs}</div>
                </div>
              </a>

              <a 
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="एम्बिशन न्यूज़ आधिकारिक इंस्टाग्राम पेज"
                className={`flex items-center gap-2 p-2 rounded-lg border transition group ${
                  isDark ? 'bg-pink-950/40 border-pink-900/60 hover:border-pink-500 text-pink-300 hover:text-white' : 'bg-white border-pink-200 hover:border-pink-400 text-slate-800 shadow-sm'
                }`}
              >
                <div className="p-1 rounded bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 text-white group-hover:scale-110 transition">
                  <InstagramIcon size={14} />
                </div>
                <div>
                  <div className="font-bold">Instagram Official</div>
                  <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Ambition news (कवर्धा)</div>
                </div>
              </a>

              <a 
                href={whatsappLink || SOCIAL_LINKS.whatsappChannel}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="एम्बिशन न्यूज़ आधिकारिक व्हाट्सएप ग्रुप व चैनल"
                className={`flex items-center gap-2 p-2 rounded-lg border transition group ${
                  isDark ? 'bg-emerald-950/40 border-emerald-900/60 hover:border-emerald-500 text-emerald-300 hover:text-white' : 'bg-white border-emerald-200 hover:border-emerald-400 text-slate-800 shadow-sm'
                }`}
              >
                <div className="p-1 rounded bg-emerald-600 text-white group-hover:scale-110 transition">
                  <WhatsAppIcon size={13} />
                </div>
                <div>
                  <div className="font-bold">WhatsApp ग्रुप / चैनल</div>
                  <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>कवर्धा व CG-MP 88 जिला न्यूज़</div>
                </div>
              </a>

              <a 
                href={SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="एम्बिशन न्यूज़ आधिकारिक फेसबुक पेज"
                className={`flex items-center gap-2 p-2 rounded-lg border transition group ${
                  isDark ? 'bg-blue-950/40 border-blue-900/60 hover:border-blue-500 text-blue-300 hover:text-white' : 'bg-white border-blue-200 hover:border-blue-400 text-slate-800 shadow-sm'
                }`}
              >
                <div className="p-1 rounded bg-blue-600 text-white group-hover:scale-110 transition">
                  <FacebookIcon size={14} />
                </div>
                <div>
                  <div className="font-bold">Facebook Page</div>
                  <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{SOCIAL_LINKS.facebookHandle}</div>
                </div>
              </a>

            </div>
          </div>

          {/* Col 3: Regional Bureaus & Helpline */}
          <div className="space-y-2">
            <h3 className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              प्रमुख ब्यूरो व संपर्क
            </h3>
            <ul className={`space-y-1.5 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
              <li>• <b className={isDark ? 'text-slate-200' : 'text-slate-900'}>कवर्धा (मुख्यालय):</b> राजमहल रोड, कबीरधाम</li>
              <li className="flex items-center gap-1.5 pt-1">
                <Phone size={12} className="text-emerald-500 shrink-0" />
                <span>हेल्पलाइन / फोन: </span>
                <a href={`tel:${SOCIAL_LINKS.phoneFormatted}`} aria-label={`हेल्पलाइन फोन करें ${SOCIAL_LINKS.phoneFormatted}`} className="font-bold text-emerald-500 hover:underline">
                  {SOCIAL_LINKS.phoneFormatted}
                </a>
              </li>
              <li className="flex items-center gap-1.5">
                <WhatsAppIcon size={12} className="shrink-0" />
                <span>WhatsApp: </span>
                <a 
                  href={SOCIAL_LINKS.whatsappDirect} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label={`व्हाट्सएप पर संपर्क करें ${SOCIAL_LINKS.phoneFormatted}`}
                  className="font-bold text-emerald-500 hover:underline"
                >
                  {SOCIAL_LINKS.phoneFormatted}
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: IT Rules 2021 Redressal */}
          <div className="space-y-2">
            <h3 className="sr-only">कानूनी अनुपालन</h3>
            <button
              type="button"
              onClick={() => onOpenCompliance?.('grievance')}
              className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 hover:underline text-left ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
              <span>IT Rules 2021 अनुपालन</span>
            </button>
            <div 
              onClick={() => onOpenCompliance?.('grievance')}
              className={`p-3 rounded-xl border text-[11px] space-y-1.5 cursor-pointer transition ${
                isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-300 shadow-sm hover:border-slate-400'
              }`}
            >
              <div className={isDark ? 'text-slate-300 font-semibold' : 'text-slate-700 font-semibold'}>
                शिकायत निवारण अधिकारी (Grievance Officer):
              </div>
              <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                श्री उत्तम चंद्रवंशी
              </div>
              <div className={`flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                <Mail size={11} /> grievance@ambitionnews.in
              </div>
              <div className={`text-[10px] pt-1 border-t ${isDark ? 'text-slate-500 border-slate-800' : 'text-slate-600 border-slate-200'}`}>
                24 घंटे में acknowledgment और 15 दिन में समाधान अनिवार्य। विवरण देखें ↗
              </div>
            </div>
          </div>

        </div>

        {/* Row 2: Bottom Copyright & Disclaimer */}
        <div className={`pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-center sm:text-left ${
          isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-300 text-slate-700'
        }`}>
          <div>
            © 2026 Ambition News Portal. सर्वाधिकार सुरक्षित • कवर्धा (कबीरधाम), छत्तीसगढ़।
          </div>
          <div className={`flex flex-wrap justify-center items-center gap-3 ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            <button
              type="button"
              onClick={() => onOpenCompliance?.('privacy')}
              className="hover:text-white hover:underline transition"
            >
              गोपनीयता नीति
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onOpenCompliance?.('terms')}
              className="hover:text-white hover:underline transition"
            >
              उपयोग की शर्तें
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onOpenCompliance?.('disclaimer')}
              className="hover:text-white hover:underline transition"
            >
              अस्वीकरण
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onOpenCompliance?.('editorial')}
              className="hover:text-white hover:underline transition"
            >
              संपादकीय नीति
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onOpenCompliance?.('factcheck')}
              className="hover:text-white hover:underline transition"
            >
              तथ्य जांच
            </button>
            <span>•</span>
            {onOpenReporterModal && (
              <>
                <button
                  type="button"
                  onClick={onOpenReporterModal}
                  className="text-red-400 hover:text-red-300 font-bold hover:underline transition flex items-center gap-1"
                >
                  📢 खबर भेजें (नागरिक रिपोर्टर)
                </button>
                <span>•</span>
              </>
            )}
            <button
              type="button"
              onClick={onOpenAdminPortal}
              className="text-amber-400 hover:text-amber-300 font-bold hover:underline transition"
            >
              🔐 रिपोर्टर व एडमिन डेस्क
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
