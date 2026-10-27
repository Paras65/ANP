import React, { useState, useEffect } from 'react';
import { X, Search, MapPin, Check, Building2, Sparkles } from 'lucide-react';
import type { DistrictItem } from '../types';

export const ALL_CG_DISTRICTS: DistrictItem[] = [
  { _id: 'cg-kwd', name: 'Kabirdham', nameHindi: 'कबीरधाम (कवर्धा)', slug: 'kabirdham', state: 'chhattisgarh' },
  { _id: 'cg-rpr', name: 'Raipur', nameHindi: 'रायपुर', slug: 'raipur', state: 'chhattisgarh' },
  { _id: 'cg-bsp', name: 'Bilaspur', nameHindi: 'बिलासपुर', slug: 'bilaspur', state: 'chhattisgarh' },
  { _id: 'cg-drg', name: 'Durg', nameHindi: 'दुर्ग', slug: 'durg', state: 'chhattisgarh' },
  { _id: 'cg-bhl', name: 'Bhilai', nameHindi: 'भिलाई', slug: 'bhilai', state: 'chhattisgarh' },
  { _id: 'cg-rjn', name: 'Rajnandgaon', nameHindi: 'राजनंदगांव', slug: 'rajnandgaon', state: 'chhattisgarh' },
  { _id: 'cg-krb', name: 'Korba', nameHindi: 'कोरबा', slug: 'korba', state: 'chhattisgarh' },
  { _id: 'cg-rgh', name: 'Raigarh', nameHindi: 'रायगढ़', slug: 'raigarh', state: 'chhattisgarh' },
  { _id: 'cg-jgd', name: 'Jagdalpur', nameHindi: 'जगदलपुर', slug: 'jagdalpur', state: 'chhattisgarh' },
  { _id: 'cg-bst', name: 'Bastar', nameHindi: 'बस्तर', slug: 'bastar', state: 'chhattisgarh' },
  { _id: 'cg-dnt', name: 'Dantewada', nameHindi: 'दंतेवाड़ा', slug: 'dantewada', state: 'chhattisgarh' },
  { _id: 'cg-knk', name: 'Kanker', nameHindi: 'कांकेर', slug: 'kanker', state: 'chhattisgarh' },
  { _id: 'cg-skm', name: 'Sukma', nameHindi: 'सुकमा', slug: 'sukma', state: 'chhattisgarh' },
  { _id: 'cg-bjp', name: 'Bijapur', nameHindi: 'बीजापुर', slug: 'bijapur', state: 'chhattisgarh' },
  { _id: 'cg-nrp', name: 'Narayanpur', nameHindi: 'नारायणपुर', slug: 'narayanpur', state: 'chhattisgarh' },
  { _id: 'cg-kdg', name: 'Kondagaon', nameHindi: 'कोंडागांव', slug: 'kondagaon', state: 'chhattisgarh' },
  { _id: 'cg-sgj', name: 'Surguja', nameHindi: 'सरगुजा', slug: 'surguja', state: 'chhattisgarh' },
  { _id: 'cg-abk', name: 'Ambikapur', nameHindi: 'अंबिकापुर', slug: 'ambikapur', state: 'chhattisgarh' },
  { _id: 'cg-sjp', name: 'Surajpur', nameHindi: 'सूरजपुर', slug: 'surajpur', state: 'chhattisgarh' },
  { _id: 'cg-blp', name: 'Balrampur', nameHindi: 'बलरामपुर', slug: 'balrampur', state: 'chhattisgarh' },
  { _id: 'cg-kry', name: 'Koriya', nameHindi: 'कोरिया', slug: 'koriya', state: 'chhattisgarh' },
  { _id: 'cg-mcb', name: 'Manendragarh-Chirmiri-Bharatpur', nameHindi: 'मनेंद्रगढ़-चिरमिरी-भरतपुर', slug: 'mcb', state: 'chhattisgarh' },
  { _id: 'cg-jsh', name: 'Jashpur', nameHindi: 'जशपुर', slug: 'jashpur', state: 'chhattisgarh' },
  { _id: 'cg-jjc', name: 'Janjgir-Champa', nameHindi: 'जांजगीर-चांपा', slug: 'janjgir-champa', state: 'chhattisgarh' },
  { _id: 'cg-skt', name: 'Sakti', nameHindi: 'सक्ती', slug: 'sakti', state: 'chhattisgarh' },
  { _id: 'cg-mng', name: 'Mungeli', nameHindi: 'मुंगेली', slug: 'mungeli', state: 'chhattisgarh' },
  { _id: 'cg-gpm', name: 'Gaurela-Pendra-Marwahi', nameHindi: 'गौरेला-पेंड्रा-मरवाही', slug: 'gpm', state: 'chhattisgarh' },
  { _id: 'cg-kcg', name: 'Khairagarh-Chhuikhadan-Gandai', nameHindi: 'खैरागढ़-छुईखदान-गंडई', slug: 'kcg', state: 'chhattisgarh' },
  { _id: 'cg-mma', name: 'Mohla-Manpur-Ambagarh Chowki', nameHindi: 'मोहला-मानपुर-अंबागढ़ चौकी', slug: 'mma', state: 'chhattisgarh' },
  { _id: 'cg-bmt', name: 'Bemetara', nameHindi: 'बेमेतरा', slug: 'bemetara', state: 'chhattisgarh' },
  { _id: 'cg-bld', name: 'Balod', nameHindi: 'बालोद', slug: 'balod', state: 'chhattisgarh' },
  { _id: 'cg-dht', name: 'Dhamtari', nameHindi: 'धमतरी', slug: 'dhamtari', state: 'chhattisgarh' },
  { _id: 'cg-mhs', name: 'Mahasamund', nameHindi: 'महासमुंद', slug: 'mahasamund', state: 'chhattisgarh' },
  { _id: 'cg-grb', name: 'Gariaband', nameHindi: 'गरियाबंद', slug: 'gariaband', state: 'chhattisgarh' },
  { _id: 'cg-bzb', name: 'Baloda Bazar-Bhatapara', nameHindi: 'बलौदा बाजार-भाटापारा', slug: 'baloda-bazar', state: 'chhattisgarh' },
  { _id: 'cg-sbg', name: 'Sarangarh-Bilaigarh', nameHindi: 'सारंगढ़-बिलाईगढ़', slug: 'sarangarh', state: 'chhattisgarh' }
];

export const ALL_MP_DISTRICTS: DistrictItem[] = [
  { _id: 'mp-bpl', name: 'Bhopal', nameHindi: 'भोपाल', slug: 'bhopal', state: 'madhya-pradesh' },
  { _id: 'mp-idr', name: 'Indore', nameHindi: 'इंदौर', slug: 'indore', state: 'madhya-pradesh' },
  { _id: 'mp-jbl', name: 'Jabalpur', nameHindi: 'जबलपुर', slug: 'jabalpur', state: 'madhya-pradesh' },
  { _id: 'mp-gwl', name: 'Gwalior', nameHindi: 'ग्वालियर', slug: 'gwalior', state: 'madhya-pradesh' },
  { _id: 'mp-ujn', name: 'Ujjain', nameHindi: 'उज्जैन', slug: 'ujjain', state: 'madhya-pradesh' },
  { _id: 'mp-sgr', name: 'Sagar', nameHindi: 'सागर', slug: 'sagar', state: 'madhya-pradesh' },
  { _id: 'mp-rew', name: 'Rewa', nameHindi: 'रीवा', slug: 'rewa', state: 'madhya-pradesh' },
  { _id: 'mp-stn', name: 'Satna', nameHindi: 'सतना', slug: 'satna', state: 'madhya-pradesh' },
  { _id: 'mp-chw', name: 'Chhindwara', nameHindi: 'छिंदवाड़ा', slug: 'chhindwara', state: 'madhya-pradesh' },
  { _id: 'mp-rtm', name: 'Ratlam', nameHindi: 'रतलाम', slug: 'ratlam', state: 'madhya-pradesh' },
  { _id: 'mp-dws', name: 'Dewas', nameHindi: 'देवास', slug: 'dewas', state: 'madhya-pradesh' },
  { _id: 'mp-ktn', name: 'Murwara (Katni)', nameHindi: 'कटनी', slug: 'katni', state: 'madhya-pradesh' },
  { _id: 'mp-sng', name: 'Singrauli', nameHindi: 'सिंगरौली', slug: 'singrauli', state: 'madhya-pradesh' },
  { _id: 'mp-brh', name: 'Burhanpur', nameHindi: 'बुरहानपुर', slug: 'burhanpur', state: 'madhya-pradesh' },
  { _id: 'mp-khd', name: 'Khandwa', nameHindi: 'खंडवा', slug: 'khandwa', state: 'madhya-pradesh' },
  { _id: 'mp-khg', name: 'Khargone', nameHindi: 'खरगोन', slug: 'khargone', state: 'madhya-pradesh' },
  { _id: 'mp-bhd', name: 'Bhind', nameHindi: 'भिंड', slug: 'bhind', state: 'madhya-pradesh' },
  { _id: 'mp-mrn', name: 'Morena', nameHindi: 'मुरैना', slug: 'morena', state: 'madhya-pradesh' },
  { _id: 'mp-svp', name: 'Shivpuri', nameHindi: 'शिवपुरी', slug: 'shivpuri', state: 'madhya-pradesh' },
  { _id: 'mp-gna', name: 'Guna', nameHindi: 'गुना', slug: 'guna', state: 'madhya-pradesh' },
  { _id: 'mp-vds', name: 'Vidisha', nameHindi: 'विदिशा', slug: 'vidisha', state: 'madhya-pradesh' },
  { _id: 'mp-shr', name: 'Sehore', nameHindi: 'सीहोर', slug: 'sehore', state: 'madhya-pradesh' },
  { _id: 'mp-nrm', name: 'Hoshangabad (Narmadapuram)', nameHindi: 'नर्मदापुरम (होशंगाबाद)', slug: 'narmadapuram', state: 'madhya-pradesh' },
  { _id: 'mp-btl', name: 'Betul', nameHindi: 'बैतूल', slug: 'betul', state: 'madhya-pradesh' },
  { _id: 'mp-hrd', name: 'Harda', nameHindi: 'हरदा', slug: 'harda', state: 'madhya-pradesh' },
  { _id: 'mp-rsn', name: 'Raisen', nameHindi: 'रायसेन', slug: 'raisen', state: 'madhya-pradesh' },
  { _id: 'mp-rjg', name: 'Rajgarh', nameHindi: 'राजगढ़', slug: 'rajgarh', state: 'madhya-pradesh' },
  { _id: 'mp-sjp', name: 'Shajapur', nameHindi: 'शाजापुर', slug: 'shajapur', state: 'madhya-pradesh' },
  { _id: 'mp-agm', name: 'Agar Malwa', nameHindi: 'आगर मालवा', slug: 'agar-malwa', state: 'madhya-pradesh' },
  { _id: 'mp-mds', name: 'Mandsaur', nameHindi: 'मंदसौर', slug: 'mandsaur', state: 'madhya-pradesh' },
  { _id: 'mp-nmc', name: 'Neemuch', nameHindi: 'नीमच', slug: 'neemuch', state: 'madhya-pradesh' },
  { _id: 'mp-dhr', name: 'Dhar', nameHindi: 'धार', slug: 'dhar', state: 'madhya-pradesh' },
  { _id: 'mp-brw', name: 'Barwani', nameHindi: 'बड़वानी', slug: 'barwani', state: 'madhya-pradesh' },
  { _id: 'mp-alr', name: 'Alirajpur', nameHindi: 'अलीराजपुर', slug: 'alirajpur', state: 'madhya-pradesh' },
  { _id: 'mp-jhb', name: 'Jhabua', nameHindi: 'झाबुआ', slug: 'jhabua', state: 'madhya-pradesh' },
  { _id: 'mp-dmh', name: 'Damoh', nameHindi: 'दमोह', slug: 'damoh', state: 'madhya-pradesh' },
  { _id: 'mp-pnn', name: 'Panna', nameHindi: 'पन्ना', slug: 'panna', state: 'madhya-pradesh' },
  { _id: 'mp-cht', name: 'Chhatarpur', nameHindi: 'छतरपुर', slug: 'chhatarpur', state: 'madhya-pradesh' },
  { _id: 'mp-tkm', name: 'Tikamgarh', nameHindi: 'टीकमगढ़', slug: 'tikamgarh', state: 'madhya-pradesh' },
  { _id: 'mp-nwr', name: 'Niwari', nameHindi: 'निवाड़ी', slug: 'niwari', state: 'madhya-pradesh' },
  { _id: 'mp-shp', name: 'Sheopur', nameHindi: 'श्योपुर', slug: 'sheopur', state: 'madhya-pradesh' },
  { _id: 'mp-ask', name: 'Ashoknagar', nameHindi: 'अशोकनगर', slug: 'ashoknagar', state: 'madhya-pradesh' },
  { _id: 'mp-dta', name: 'Datia', nameHindi: 'दतिया', slug: 'datia', state: 'madhya-pradesh' },
  { _id: 'mp-sdh', name: 'Sidhi', nameHindi: 'सीधी', slug: 'sidhi', state: 'madhya-pradesh' },
  { _id: 'mp-shd', name: 'Shahdol', nameHindi: 'शहडोल', slug: 'shahdol', state: 'madhya-pradesh' },
  { _id: 'mp-anp', name: 'Anuppur', nameHindi: 'अनूपपुर', slug: 'anuppur', state: 'madhya-pradesh' },
  { _id: 'mp-umr', name: 'Umaria', nameHindi: 'उमरिया', slug: 'umaria', state: 'madhya-pradesh' },
  { _id: 'mp-dnd', name: 'Dindori', nameHindi: 'डिंडोरी', slug: 'dindori', state: 'madhya-pradesh' },
  { _id: 'mp-mnd', name: 'Mandla', nameHindi: 'मंडला', slug: 'mandla', state: 'madhya-pradesh' },
  { _id: 'mp-blg', name: 'Balaghat', nameHindi: 'बालाघाट', slug: 'balaghat', state: 'madhya-pradesh' },
  { _id: 'mp-sni', name: 'Seoni', nameHindi: 'सिवनी', slug: 'seoni', state: 'madhya-pradesh' },
  { _id: 'mp-nrp', name: 'Narsinghpur', nameHindi: 'नरसिंहपुर', slug: 'narsinghpur', state: 'madhya-pradesh' },
  { _id: 'mp-mgn', name: 'Mauganj', nameHindi: 'मऊगंज', slug: 'mauganj', state: 'madhya-pradesh' },
  { _id: 'mp-mhr', name: 'Maihar', nameHindi: 'मैहर', slug: 'maihar', state: 'madhya-pradesh' },
  { _id: 'mp-pdh', name: 'Pandhurna', nameHindi: 'पांढुर्णा', slug: 'pandhurna', state: 'madhya-pradesh' }
];

interface DistrictPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDistrict: string;
  selectedState: 'chhattisgarh' | 'madhya-pradesh';
  onSelectDistrict: (districtName: string, state?: 'chhattisgarh' | 'madhya-pradesh') => void;
  isDark: boolean;
}

export const DistrictPickerModal: React.FC<DistrictPickerModalProps> = ({
  isOpen,
  onClose,
  currentDistrict,
  selectedState,
  onSelectDistrict,
  isDark
}) => {
  const [activeTab, setActiveTab] = useState<'chhattisgarh' | 'madhya-pradesh'>(selectedState);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setActiveTab(selectedState);
  }, [selectedState]);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentDistrictsList = activeTab === 'chhattisgarh' ? ALL_CG_DISTRICTS : ALL_MP_DISTRICTS;
  const filtered = currentDistrictsList.filter(d => 
    !search.trim() || 
    d.nameHindi.toLowerCase().includes(search.toLowerCase()) ||
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Modal Dialog */}
      <div className={`relative w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 ${
        isDark ? 'bg-[#090d18] border-red-950/60 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-red-950/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-wide flex items-center gap-2">
                <span>जिला चुनें</span>
                <span className="text-xs bg-red-600/20 text-red-400 border border-red-600/30 px-2 py-0.5 rounded-full font-bold">
                  88 जिले
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                छत्तीसगढ़ (33) व मध्य प्रदेश (55) के अपने जिले की ताज़ा खबरें देखें
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="बंद करें"
          >
            <X size={20} />
          </button>
        </div>

        {/* State Tabs & Search Bar */}
        <div className="p-3 sm:p-4 border-b border-red-950/20 space-y-3 shrink-0">
          
          {/* State Switcher Pills */}
          <div className="flex rounded-xl p-1 bg-slate-950/80 border border-slate-800 text-xs font-bold gap-1">
            <button
              onClick={() => setActiveTab('chhattisgarh')}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                activeTab === 'chhattisgarh'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 size={13} />
              <span>छत्तीसगढ़ (33 जिले)</span>
            </button>
            <button
              onClick={() => setActiveTab('madhya-pradesh')}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                activeTab === 'madhya-pradesh'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 size={13} />
              <span>मध्य प्रदेश (55 जिले)</span>
            </button>
          </div>

          {/* District Search Box */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`जिला खोजें (उदा. कवर्धा, रायपुर, भोपाल, इंदौर)...`}
              className="w-full bg-[#05070e] border border-slate-800 focus:border-red-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none transition"
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                हटाएं
              </button>
            )}
          </div>

        </div>

        {/* All Districts Grid */}
        <div className="p-3 sm:p-5 overflow-y-auto no-scrollbar flex-1 overscroll-contain">
          
          {/* 'All Districts' Quick Button */}
          <button
            onClick={() => {
              onSelectDistrict('सभी', activeTab);
              onClose();
            }}
            className={`w-full mb-3 p-3 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer active:scale-98 ${
              currentDistrict === 'सभी'
                ? 'bg-red-600/20 border-red-500 text-red-300 font-bold'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 text-xs">
              <span className="p-1 rounded-lg bg-red-600 text-white font-bold">ALL</span>
              <span>{activeTab === 'chhattisgarh' ? 'छत्तीसगढ़ के सभी जिले' : 'मध्य प्रदेश के सभी जिले'}</span>
            </div>
            {currentDistrict === 'सभी' && <Check size={16} className="text-red-400" />}
          </button>

          {/* Grid of districts */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filtered.map(d => {
              const isSelected = currentDistrict === d.nameHindi || currentDistrict.includes(d.nameHindi);
              const isKawardhaHQ = d.nameHindi.includes('कवर्धा');

              return (
                <button
                  key={d._id}
                  onClick={() => {
                    onSelectDistrict(d.nameHindi, activeTab);
                    onClose();
                  }}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-red-500 shadow-md font-bold'
                      : isKawardhaHQ
                        ? 'bg-amber-950/30 border-amber-500/50 text-amber-300 font-bold hover:bg-amber-950/50'
                        : isDark
                          ? 'bg-slate-900/80 border-slate-800/80 text-slate-300 hover:border-red-600/50 hover:text-white'
                          : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-red-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {isKawardhaHQ && <Sparkles size={12} className="text-amber-400 shrink-0" />}
                    <span className="truncate">{d.nameHindi}</span>
                  </div>
                  {isKawardhaHQ && !isSelected && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded shrink-0">
                      HQ
                    </span>
                  )}
                  {isSelected && <Check size={14} className="shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs">
              '{search}' नाम से कोई जिला नहीं मिला। कृपया वर्तनी जांचें।
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
