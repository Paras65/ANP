import React, { useState, useEffect } from 'react';
import { Download, X, Sparkles, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // 1. Check if already installed in standalone mode
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      return; // Already installed, do not show
    }

    // 2. Check if user dismissed recently
    const dismissedAt = sessionStorage.getItem('pwa_prompt_dismissed');
    if (dismissedAt) {
      return;
    }

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    if (isIosDevice) {
      setIsIos(true);
      // Show prompt after a short delay for smooth experience
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }

    // 4. Capture native beforeinstallprompt on Android / Chrome / Edge
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show short & sweet prompt after 2 seconds
      setTimeout(() => setIsVisible(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Fallback: If event hasn't fired but not standalone, show prompt after 4 seconds
    const fallbackTimer = setTimeout(() => {
      if (!isStandalone && !sessionStorage.getItem('pwa_prompt_dismissed')) {
        setIsVisible(true);
      }
    }, 4000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsVisible(false);
          localStorage.setItem('pwa_installed', 'true');
        }
      } catch (err) {
        console.error('PWA install error:', err);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback instructions if browser native prompt not available
      alert('📲 ऐप इंस्टॉल करने के लिए अपने ब्राउज़र मेनू (⋮) में जाकर "Add to Home Screen" या "ऐप इंस्टॉल करें" चुनें।');
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-20 sm:bottom-6 sm:right-6 left-3 right-3 sm:left-auto sm:max-w-sm z-40 animate-in slide-in-from-bottom duration-300">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-red-500/40 rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-3 text-white ring-1 ring-white/10">
        
        {/* Left App Icon */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-red-500 to-orange-500 flex items-center justify-center font-black text-xs text-white shadow-md border border-white/20">
            ANP
          </div>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
        </div>

        {/* Center Text Info */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-black text-white truncate">
              Ambition News ऐप लगाएं
            </h4>
            <span className="text-[9px] bg-red-950 text-red-300 font-bold px-1 rounded border border-red-800">
              कवर्धा
            </span>
          </div>
          <p className="text-[10px] text-slate-300 truncate mt-0.5 flex items-center gap-1">
            <Sparkles size={10} className="text-amber-400 shrink-0" />
            <span>बिना प्ले स्टोर, तेज़ और 2G पर भी चालू</span>
          </p>
        </div>

        {/* Right Action & Close */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="bg-red-600 hover:bg-red-500 active:scale-95 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow flex items-center gap-1 transition"
          >
            <Download size={12} />
            <span>+ लगाएं</span>
          </button>
          
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition"
            title="हटाएं"
          >
            <X size={14} />
          </button>
        </div>

      </div>

      {/* iOS Safari Guide Tooltip */}
      {showIosGuide && (
        <div className="mt-2 bg-slate-950/95 border border-slate-700 rounded-xl p-3 text-[11px] text-slate-200 shadow-xl space-y-1.5 animate-in fade-in">
          <div className="font-bold text-white flex items-center gap-1">
            <Share size={12} className="text-blue-400" />
            <span>iPhone पर ऐप लगाने का तरीका:</span>
          </div>
          <p className="text-slate-300 text-[10px] leading-relaxed">
            1. नीचे सफारी बार में <span className="text-white font-bold">Share (शेयर)</span> आइकन दबाएं।<br/>
            2. नीचे स्क्रॉल करके <span className="text-white font-bold">'Add to Home Screen'</span> चुनें।
          </p>
          <button 
            onClick={() => setShowIosGuide(false)}
            className="text-[10px] text-red-400 font-bold underline pt-1 block"
          >
            समझ गया (Close)
          </button>
        </div>
      )}
    </div>
  );
};
