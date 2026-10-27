import React from 'react';

export interface StoryItem {
  id: string;
  label: string;
  title: string;
  image: string;
  category: string;
  district: string;
  excerpt: string;
  badge?: string;
  ringGradient: string;
  seen?: boolean;
}

export const DEMO_STORIES: StoryItem[] = [
  {
    id: 's-live',
    label: 'लाइव टीवी',
    title: 'Ambition News लाइव बुलेटिन: कवर्धा व प्रदेश की आज की 50 बड़ी खबरें',
    image: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80',
    category: '🔴 LIVE',
    district: 'कवर्धा HQ',
    excerpt: 'कवर्धा स्टूडियो से सीधा प्रसारण: भोरमदेव महोत्सव, धान अंतर राशि व मौसम का ताजा हाल।',
    badge: 'LIVE',
    ringGradient: 'from-red-500 via-rose-600 to-amber-500'
  },
  {
    id: 's-kwd',
    label: 'कवर्धा',
    title: 'भोरमदेव कॉरिडोर प्रोजेक्ट: ₹45 करोड़ की भव्य योजना का मॉडल जारी',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&auto=format&fit=crop&q=80',
    category: 'विकास',
    district: 'कबीरधाम',
    excerpt: 'कवर्धा के ऐतिहासिक भोरमदेव मंदिर क्षेत्र में 4-लेन चौड़ीकरण, आधुनिक धर्मशाला और शिल्प ग्राम बनेगा।',
    badge: 'HQ',
    ringGradient: 'from-amber-400 via-orange-500 to-red-500'
  },
  {
    id: 's-mandi',
    label: 'मंडी भाव',
    title: 'आज के मंडी भाव: कवर्धा मंडी में नया गुड़ ₹3,480 व चना ₹5,950 प्रति क्विंटल',
    image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=600&auto=format&fit=crop&q=80',
    category: 'कृषि',
    district: 'कवर्धा मंडी',
    excerpt: 'कवर्धा कृषि उपज मंडी में नए गुड़ की रिकॉर्ड आवक दर्ज। किसानों को मिला तुरंत नकद भुगतान।',
    badge: 'भाव',
    ringGradient: 'from-emerald-400 via-teal-500 to-green-600'
  },
  {
    id: 's-chilphi',
    label: 'चिल्फी घाटी',
    title: 'मैकल की वादियों में कोहरे की चादर: चिल्फी घाटी में ठंड ने तोड़े रिकॉर्ड',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
    category: 'मौसम',
    district: 'चिल्फी / बोड़ला',
    excerpt: 'छत्तीसगढ़ के शिमला कहे जाने वाले चिल्फी में न्यूनतम तापमान में भारी गिरावट, सैलानियों की भीड़ उमड़ी।',
    ringGradient: 'from-cyan-400 via-blue-500 to-indigo-600'
  },
  {
    id: 's-crime',
    label: 'क्राइम अलर्ट',
    title: 'कोयला चोरी व तस्करी गिरोह पर पुलिस का शिकंजा: 4 गिरफ्तार, 2 ट्रक जब्त',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
    category: 'अपराध',
    district: 'बिलासपुर',
    excerpt: 'पुलिस अधीक्षक के निर्देश पर बनी स्पेशल टीम ने देर रात छापा मारकर मुख्य सरगना को धर दबोचा।',
    ringGradient: 'from-purple-500 via-pink-600 to-rose-500'
  },
  {
    id: 's-dhan',
    label: 'धान बोनस',
    title: 'किसानों के खाते में धान बोनस की अगली किश्त की तारीख तय: सीएम समीक्षा',
    image: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600&auto=format&fit=crop&q=80',
    category: 'किसान',
    district: 'रायपुर',
    excerpt: 'मंत्रालय महानदी भवन में आयोजित बैठक में अधिकारियों को निर्देश: भुगतान में न आए कोई रुकावट।',
    ringGradient: 'from-yellow-400 via-amber-500 to-orange-600'
  }
];

interface StoriesTrayProps {
  onSelectStory: (story: StoryItem) => void;
  isDark: boolean;
}

export const StoriesTray: React.FC<StoriesTrayProps> = ({ onSelectStory, isDark }) => {
  return (
    <div className="w-full max-w-full overflow-x-auto no-scrollbar py-2 px-1">
      <div className="flex items-center gap-3.5 sm:gap-4 w-max">
        {DEMO_STORIES.map((story) => (
          <button
            key={story.id}
            onClick={() => onSelectStory(story)}
            className="flex flex-col items-center gap-1.5 focus:outline-none group active:scale-95 transition-transform"
          >
            {/* Story Avatar Circle with Gradient Ring */}
            <div className={`relative w-[66px] h-[66px] sm:w-[72px] sm:h-[72px] rounded-full p-[2.5px] bg-gradient-to-tr ${story.ringGradient} shadow-md group-hover:scale-105 transition-transform`}>
              <div className={`w-full h-full rounded-full overflow-hidden p-[2px] ${
                isDark ? 'bg-slate-950' : 'bg-white'
              }`}>
                <img 
                  src={story.image} 
                  alt={story.label}
                  className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300" 
                />
              </div>

              {/* Optional Badge */}
              {story.badge && (
                <span className="absolute -bottom-1 inset-x-0 mx-auto w-max bg-red-600 text-white font-black text-[9px] px-1.5 py-0.2 rounded-full uppercase tracking-tighter shadow border border-slate-950">
                  {story.badge}
                </span>
              )}
            </div>

            {/* Label */}
            <span className={`text-[11px] font-bold tracking-tight max-w-[68px] truncate transition-colors ${
              isDark ? 'text-slate-200 group-hover:text-red-400' : 'text-slate-800 group-hover:text-red-600'
            }`}>
              {story.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

