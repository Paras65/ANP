import React, { useState } from 'react';
import { Heart, ExternalLink, Play, Film } from 'lucide-react';
import { InstagramIcon } from './SocialIcons';
import type { InstagramPost } from '../types';
import { SOCIAL_LINKS } from '../data/mockData';

interface InstagramSectionProps {
  posts: InstagramPost[];
  onSelectReel: (postId: string) => void;
  isDark: boolean;
}

export const InstagramSection: React.FC<InstagramSectionProps> = ({ 
  posts, 
  onSelectReel, 
  isDark
}) => {
  // Pure real data: do not render section if no live reels exist
  if (!posts || posts.length === 0) return null;

  // Compact Shelf Controls
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<'all' | string>('all');

  // Collect distinct districts from posts
  const districts = ['all', ...Array.from(new Set(posts.map(p => p.district).filter(Boolean)))];

  const filteredPosts = selectedDistrict === 'all' 
    ? posts 
    : posts.filter(p => p.district === selectedDistrict);

  const visiblePosts = isExpanded ? filteredPosts : filteredPosts.slice(0, 8);

  return (
    <section className={`rounded-3xl border p-4 sm:p-5 transition-colors ${
      isDark ? 'bg-[#090d18]/95 border-red-950/40 shadow-xl' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      
      {/* Instagram Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-red-950/30">
        
        {/* Profile Info */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 shrink-0">
            <div className="w-full h-full rounded-full overflow-hidden bg-slate-950 flex items-center justify-center p-0.5">
              <picture>
                <source srcSet="/logo-96.webp" type="image/webp" />
                <img 
                  src="/logo-96.webp" 
                  alt="Logo" 
                  width="44" 
                  height="44" 
                  loading="lazy" 
                  decoding="async" 
                  className="w-full h-full object-cover rounded-full" 
                />
              </picture>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                <span>Ambition Reels</span>
                <span className="text-[10px] bg-pink-950 text-pink-300 font-bold px-1.5 py-0.2 rounded border border-pink-800">
                  कवर्धा
                </span>
              </h2>
              <span className="text-[11px] text-pink-400 font-mono font-semibold">
                {SOCIAL_LINKS.instagramHandle}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {SOCIAL_LINKS.instagramBio} (क्लिक करके रील्स चलाएं)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Follow CTA */}
          <a 
            href={SOCIAL_LINKS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="एम्बिशन न्यूज़ आधिकारिक इंस्टाग्राम पर फॉलो करें"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-pink-600/30 transition active:scale-95 shrink-0"
          >
            <InstagramIcon size={15} />
            <span>इंस्टाग्राम पर फॉलो करें</span>
            <ExternalLink size={12} />
          </a>
        </div>

      </div>

      {/* District Filter Pills */}
      {districts.length > 2 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2.5 mb-3 text-xs w-full max-w-full">
          {districts.map(d => (
            <button
              key={d}
              onClick={() => setSelectedDistrict(d)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition whitespace-nowrap active:scale-95 ${
                selectedDistrict === d
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md shadow-pink-600/30'
                  : isDark 
                    ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              {d === 'all' ? `सभी रील्स (${posts.length})` : `${d} (${posts.filter(p => p.district === d).length})`}
            </button>
          ))}
        </div>
      )}

      {/* Visual Reels Grid: Clicking opens the interactive Reel Player */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {visiblePosts.map((post) => (
          <div 
            key={post.id}
            onClick={() => onSelectReel(post.id)}
            className={`group rounded-2xl border overflow-hidden flex flex-col justify-between cursor-pointer transition-transform duration-200 hover:-translate-y-1 active:scale-95 shadow-md ${
              isDark ? 'bg-slate-950 border-slate-800 hover:border-pink-500/80' : 'bg-slate-50 border-slate-200 hover:border-pink-500 hover:shadow-lg'
            }`}
          >
            {/* Image Thumbnail with Reel Play Badge */}
            <div className="relative aspect-[9/14] w-full overflow-hidden bg-slate-900">
              <img 
                src={post.imageUrl} 
                alt={post.caption}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              />
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 group-hover:from-black/90 transition-colors"></div>

              {/* Reel Play Icon in Center on hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-85 group-hover:opacity-100 transition-opacity">
                <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:bg-pink-600 group-hover:border-pink-400 transition-all">
                  <Play size={18} className="fill-current ml-0.5" />
                </div>
              </div>

              {/* Reel Badge top-left */}
              <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur text-[10px] text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-white/10">
                <Film size={11} className="text-pink-400" />
                <span>रील</span>
              </div>

              {/* District Badge top-right */}
              <div className="absolute top-2.5 right-2.5 bg-pink-950/80 text-pink-300 text-[10px] px-1.5 py-0.5 rounded font-bold border border-pink-800">
                {post.district}
              </div>

              {/* Bottom Meta on Thumbnail */}
              <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between text-white text-[11px] font-bold">
                <span className="flex items-center gap-1 drop-shadow">
                  <Heart size={13} className="fill-red-500 text-red-500" /> {post.likes}
                </span>
                <span className="text-[10px] text-slate-300 drop-shadow">
                  {post.timeAgo}
                </span>
              </div>
            </div>

            {/* Caption Snippet below */}
            <div className="p-2.5 space-y-1">
              <p className={`text-[11px] font-medium leading-snug line-clamp-2 ${
                isDark ? 'text-slate-200 group-hover:text-pink-400' : 'text-slate-800 group-hover:text-pink-600'
              }`}>
                {post.caption}
              </p>
              <div className="text-[10px] text-pink-400 font-bold flex items-center gap-1 pt-0.5">
                <span>▶️ रील देखें</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Expand/Collapse Bar & Watch All Action */}
      {filteredPosts.length > 8 && (
        <div className="mt-4 pt-3 border-t border-red-950/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-950/60 to-purple-950/60 hover:from-pink-900/80 hover:to-purple-900/80 border border-pink-500/30 text-pink-300 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md"
          >
            {isExpanded ? (
              <span>▲ कम रील्स दिखाएं (कम करें)</span>
            ) : (
              <span>▼ और {filteredPosts.length - 8} रील्स देखें (कुल {filteredPosts.length} रील्स)</span>
            )}
          </button>

          <button
            onClick={() => onSelectReel(visiblePosts[0]?.id || posts[0]?.id)}
            aria-label="सभी रील्स फुलस्क्रीन में लगातार चलाएं"
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-600/25 transition active:scale-95"
          >
            <Play size={14} className="fill-white" />
            <span>फुलस्क्रीन में लगातार चलाएं (Watch All)</span>
          </button>
        </div>
      )}

    </section>
  );
};
