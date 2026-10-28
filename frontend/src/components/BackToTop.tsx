import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export const BackToTop: React.FC = () => {
  const [show, setShow] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          // Only show when scrolled past 300px
          setShow(scrollY > 300);

          const winHeight = window.innerHeight;
          const docHeight = document.documentElement.scrollHeight;
          const totalScroll = docHeight - winHeight;
          if (totalScroll > 0) {
            setScrollProgress(Math.min(100, Math.round((scrollY / totalScroll) * 100)));
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-20 sm:bottom-6 right-3.5 sm:right-6 z-40 group w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white shadow-2xl shadow-red-950/80 border border-white/20 transition-transform duration-200 active:scale-90 flex items-center justify-center cursor-pointer animate-in fade-in zoom-in-75 will-change-transform"
      title={`पेज के सबसे ऊपर जाएं (${scrollProgress}% पढ़ा)`}
      aria-label="Back to Top"
    >
      {/* SVG Circular Reading Progress Ring */}
      <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-0.5" viewBox="0 0 36 36">
        <path
          className="text-black/30"
          strokeWidth="2.5"
          stroke="currentColor"
          fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <path
          className="text-white transition-all duration-150"
          strokeDasharray={`${scrollProgress}, 100`}
          strokeWidth="2.5"
          strokeLinecap="round"
          stroke="currentColor"
          fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
      </svg>

      {/* Inner Arrow Icon & Progress Percentage on Hover */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <ChevronUp size={18} className="transition-transform group-hover:-translate-y-0.5" />
        <span className="text-[8px] font-black leading-none hidden group-hover:block transition-all">
          {scrollProgress}%
        </span>
      </div>
    </button>
  );
};
