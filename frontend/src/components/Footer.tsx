import React from 'react';
import { ShieldCheck, Mail, MapPin } from 'lucide-react';
import { YoutubeIcon, InstagramIcon, WhatsAppIcon } from './SocialIcons';
import { SOCIAL_LINKS } from '../data/mockData';

interface FooterProps {
  isDark: boolean;
  onOpenAdminPortal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ isDark, onOpenAdminPortal }) => {
  return (
    <footer className={`border-t py-10 transition-colors text-xs ${
      isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-600'
    }`}>
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        
        {/* Row 1: Brand, Address & Socials */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Col 1: Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-1.5">
              <span className="bg-red-600 text-white font-black text-xl px-2.5 py-0.5 rounded shadow">
                AMBITION
              </span>
              <span className="text-xs bg-black/80 text-white font-bold px-1.5 py-0.5 rounded">
                न्यूज़
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              कवर्धा (कबीरधाम) का अग्रणी डिजिटल न्यूज़ नेटवर्क। छत्तीसगढ़ के 33 और मध्यप्रदेश के 55 जिलों की निष्पक्ष, निर्भीक और सटीक जमीनी पत्रकारिता।
            </p>
            <div className="text-[11px] text-red-500 font-semibold flex items-center gap-1">
              <MapPin size={12} />
              <span>कवर्धा (कबीरधाम), छत्तीसगढ़ — 491995</span>
            </div>
          </div>

          {/* Col 2: Social Links Hub */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              सोशल मीडिया नेटवर्क
            </h4>
            <div className="space-y-2 text-[11px]">
              
              <a 
                href={SOCIAL_LINKS.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg bg-red-950/40 border border-red-900/60 hover:border-red-600 text-red-300 hover:text-white transition group"
              >
                <div className="p-1 rounded bg-red-600 text-white group-hover:scale-110 transition">
                  <YoutubeIcon size={14} />
                </div>
                <div>
                  <div className="font-bold">YouTube Official</div>
                  <div className="text-[10px] text-slate-400">{SOCIAL_LINKS.youtubeHandle} • {SOCIAL_LINKS.youtubeSubs}</div>
                </div>
              </a>

              <a 
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg bg-pink-950/40 border border-pink-900/60 hover:border-pink-500 text-pink-300 hover:text-white transition group"
              >
                <div className="p-1 rounded bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 text-white group-hover:scale-110 transition">
                  <InstagramIcon size={14} />
                </div>
                <div>
                  <div className="font-bold">Instagram Official</div>
                  <div className="text-[10px] text-slate-400">Ambition news (कवर्धा)</div>
                </div>
              </a>

              <a 
                href={SOCIAL_LINKS.whatsappChannel}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg bg-emerald-950/40 border border-emerald-900/60 hover:border-emerald-500 text-emerald-300 hover:text-white transition group"
              >
                <div className="p-1 rounded bg-emerald-600 text-white group-hover:scale-110 transition">
                  <WhatsAppIcon size={13} />
                </div>
                <div>
                  <div className="font-bold">WhatsApp Channel</div>
                  <div className="text-[10px] text-slate-400">सीधे फोन पर ब्रेकिंग न्यूज़</div>
                </div>
              </a>

            </div>
          </div>

          {/* Col 3: Regional Bureaus */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              प्रमुख ब्यूरो कार्यालय
            </h4>
            <ul className="space-y-1.5 text-[11px] text-slate-400">
              <li>• <b className="text-slate-200">कवर्धा (मुख्यालय):</b> राजमहल रोड, कबीरधाम</li>
              <li>• <b className="text-slate-200">रायपुर ब्यूरो:</b> प्रेस कॉम्प्लेक्स, जेल रोड</li>
              <li>• <b className="text-slate-200">बिलासपुर ब्यूरो:</b> लिंक रोड, हाईकोर्ट मार्ग</li>
              <li>• <b className="text-slate-200">भोपाल ब्यूरो:</b> एमपी नगर, ज़ोन 1</li>
              <li>• <b className="text-slate-200">इंदौर ब्यूरो:</b> प्रेस क्लब, एबी रोड</li>
            </ul>
          </div>

          {/* Col 4: IT Rules 2021 Redressal */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>IT Rules 2021 अनुपालन</span>
            </h4>
            <div className={`p-3 rounded-xl border text-[11px] space-y-1.5 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
            }`}>
              <div className="text-slate-300 font-semibold">शिकायत निवारण अधिकारी (Grievance Officer):</div>
              <div className="text-white font-bold">श्री आर. के. वर्मा</div>
              <div className="text-slate-400 flex items-center gap-1">
                <Mail size={11} /> grievance@ambition.news
              </div>
              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                24 घंटे में acknowledgment और 15 दिन में समाधान अनिवार्य।
              </div>
            </div>
          </div>

        </div>

        {/* Row 2: Bottom Copyright & Disclaimer */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-slate-500 text-center sm:text-left">
          <div>
            © 2026 Ambition News Portal. सर्वाधिकार सुरक्षित • कवर्धा (कबीरधाम), छत्तीसगढ़।
          </div>
          <div className="flex flex-wrap justify-center items-center gap-3 text-slate-400">
            <span className="hover:text-white cursor-pointer">संपादकीय नीति</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer">तथ्य जांच</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer">गोपनीयता नीति</span>
            <span>•</span>
            <button
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
