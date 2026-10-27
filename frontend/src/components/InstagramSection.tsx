import React, { useState } from 'react';
import { Heart, ExternalLink, Play, Film, Plus, X, Check, AlertCircle } from 'lucide-react';
import { InstagramIcon } from './SocialIcons';
import type { InstagramPost } from '../types';
import { SOCIAL_LINKS } from '../data/mockData';
import { parseInstagramUrl, parseYouTubeUrl } from '../utils/mediaUtils';

interface InstagramSectionProps {
  posts: InstagramPost[];
  onSelectReel: (postId: string) => void;
  isDark: boolean;
  onAddReel?: (post: InstagramPost) => void;
}

export const InstagramSection: React.FC<InstagramSectionProps> = ({ 
  posts, 
  onSelectReel, 
  isDark,
  onAddReel 
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [reelUrlInput, setReelUrlInput] = useState('');
  const [captionInput, setCaptionInput] = useState('');
  const [districtInput, setDistrictInput] = useState('कवर्धा');
  const [audioInput, setAudioInput] = useState('Ambition News Original');
  const [parsedReel, setParsedReel] = useState<{ type: 'instagram' | 'youtube_short'; embedUrl: string; previewThumb?: string; rawId?: string } | null>(null);

  // Compact Shelf Controls
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<'all' | string>('all');

  // Collect distinct districts from posts
  const districts = ['all', ...Array.from(new Set(posts.map(p => p.district).filter(Boolean)))];

  const filteredPosts = selectedDistrict === 'all' 
    ? posts 
    : posts.filter(p => p.district === selectedDistrict);

  const visiblePosts = isExpanded ? filteredPosts : filteredPosts.slice(0, 8);

  const handleUrlChange = (val: string) => {
    setReelUrlInput(val);
    const ig = parseInstagramUrl(val);
    if (ig) {
      setParsedReel({
        type: 'instagram',
        embedUrl: ig.embedUrl
      });
      return;
    }
    const yt = parseYouTubeUrl(val);
    if (yt) {
      setParsedReel({
        type: 'youtube_short',
        embedUrl: yt.embedUrl,
        previewThumb: yt.thumbnailUrl,
        rawId: yt.id
      });
      return;
    }
    setParsedReel(null);
  };

  const handleSaveReel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedReel || !captionInput.trim()) return;

    const newPost: InstagramPost = {
      id: 'reel_' + Date.now(),
      caption: captionInput.trim(),
      imageUrl: parsedReel.previewThumb || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800',
      youtubeId: parsedReel.type === 'youtube_short' ? parsedReel.rawId : undefined,
      embedUrl: parsedReel.embedUrl,
      postUrl: reelUrlInput.trim(),
      likes: '1',
      commentsCount: '0',
      sharesCount: '0',
      district: districtInput,
      timeAgo: 'अभी-अभी',
      audioTrack: audioInput.trim() || 'Ambition News Original'
    };

    if (onAddReel) {
      onAddReel(newPost);
    }
    setShowAddModal(false);
    setReelUrlInput('');
    setCaptionInput('');
    setParsedReel(null);
  };

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
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover rounded-full" />
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
          {onAddReel && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 transition active:scale-95 shadow"
              title="नई इंस्टाग्राम रील या यूट्यूब शॉर्ट जोड़ें"
            >
              <Plus size={14} className="text-pink-400" />
              <span>+ रील जोड़ें</span>
            </button>
          )}

          {/* Follow CTA */}
          <a 
            href={SOCIAL_LINKS.instagram}
            target="_blank"
            rel="noopener noreferrer"
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
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2.5 mb-3 text-xs">
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
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-600/25 transition active:scale-95"
          >
            <Play size={14} className="fill-white" />
            <span>फुलस्क्रीन में लगातार चलाएं (Watch All)</span>
          </button>
        </div>
      )}

      {/* Add New Reel Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-pink-500/30 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            
            <div className="p-4 bg-[#070a12] flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2 text-pink-500 font-bold text-sm">
                <InstagramIcon size={18} />
                <span className="text-white">नई इंस्टाग्राम रील या यूट्यूब शॉर्ट जोड़ें</span>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveReel} className="p-5 space-y-4">
              {/* URL Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>रील लिंक (Instagram Reel या YouTube Shorts URL)</span>
                  <span className="text-[10px] text-pink-400 font-normal">instagram.com/reel/... या shorts/...</span>
                </label>
                <input 
                  type="text"
                  value={reelUrlInput}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="उदा. https://www.instagram.com/reel/C8xxx... या https://youtube.com/shorts/..."
                  className="w-full bg-[#05070e] border border-white/15 focus:border-pink-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none transition"
                  required
                />
              </div>

              {/* Live Preview if parsed */}
              {parsedReel && (
                <div className="p-3 rounded-2xl bg-black/40 border border-emerald-500/40 flex items-center gap-3">
                  <div className="w-16 aspect-[9/14] rounded-lg overflow-hidden relative shrink-0 bg-slate-900 border border-white/10 flex items-center justify-center">
                    {parsedReel.previewThumb ? (
                      <img src={parsedReel.previewThumb} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <InstagramIcon size={24} className="text-pink-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                      <Check size={12} />
                      <span>{parsedReel.type === 'instagram' ? 'मान्य इंस्टाग्राम रील' : 'मान्य यूट्यूब शॉर्ट'} मिली!</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                      सीधे फुल स्क्रीन प्लेयर में चलेगी
                    </span>
                  </div>
                </div>
              )}

              {reelUrlInput && !parsedReel && (
                <div className="p-2.5 rounded-xl bg-pink-950/30 border border-pink-500/30 flex items-center gap-2 text-[11px] text-pink-400">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>कृपया वैध इंस्टाग्राम रील या यूट्यूब शॉर्ट का लिंक दर्ज करें।</span>
                </div>
              )}

              {/* Caption */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">कैप्शन (Caption)</label>
                <textarea 
                  value={captionInput}
                  onChange={(e) => setCaptionInput(e.target.value)}
                  placeholder="उदा. कवर्धा भोरमदेव मंदिर का मनमोहक दृश्य... #Kawardha #AmbitionNews"
                  rows={3}
                  className="w-full bg-[#05070e] border border-white/15 focus:border-pink-500 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 outline-none resize-none transition"
                  required
                />
              </div>

              {/* District & Audio */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">जिला (District)</label>
                  <input 
                    type="text"
                    value={districtInput}
                    onChange={(e) => setDistrictInput(e.target.value)}
                    placeholder="कवर्धा"
                    className="w-full bg-[#05070e] border border-white/15 focus:border-pink-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">ऑडियो/म्यूजिक ट्रैक</label>
                  <input 
                    type="text"
                    value={audioInput}
                    onChange={(e) => setAudioInput(e.target.value)}
                    placeholder="Ambition News Original"
                    className="w-full bg-[#05070e] border border-white/15 focus:border-pink-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={!parsedReel || !captionInput.trim()}
                  className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-pink-600/30 transition active:scale-95 flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>रील प्रकाशित करें</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </section>
  );
};
