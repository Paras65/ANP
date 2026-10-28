import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, FileText, CheckCircle2, Lock, Scale } from 'lucide-react';
import { SOCIAL_LINKS } from '../data/mockData';

export type ComplianceTab = 'editorial' | 'factcheck' | 'grievance' | 'privacy';

interface ComplianceModalProps {
  initialTab?: ComplianceTab;
  isDark: boolean;
  onClose: () => void;
}

export const ComplianceModal: React.FC<ComplianceModalProps> = ({
  initialTab = 'editorial',
  isDark,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<ComplianceTab>(initialTab);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className={`relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-colors ${
          isDark ? 'bg-[#0b0f19] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Modal Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'border-slate-800/80 bg-slate-900/60' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600/10 text-red-500 border border-red-500/20 flex items-center justify-center shrink-0">
              <Scale size={20} />
            </div>
            <div>
              <h2 className={`text-base sm:text-lg font-black tracking-tight leading-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                डिजिटल मीडिया एवं विधिक अनुपालन (Compliance)
              </h2>
              <p className="text-[11px] text-slate-400">
                IT Rules 2021 • DPDP Act 2023 • भारतीय प्रेस परिषद (PCI) मानक
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
            }`}
            aria-label="बंद करें"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`flex border-b overflow-x-auto no-scrollbar shrink-0 px-2 sm:px-4 text-xs font-bold ${
          isDark ? 'border-slate-800 bg-[#070b14]' : 'border-slate-200 bg-slate-100/70'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('editorial')}
            className={`px-3 sm:px-4 py-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'editorial'
                ? 'border-red-600 text-red-500'
                : isDark ? 'border-transparent text-slate-400 hover:text-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={14} />
            <span>संपादकीय नीति</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('factcheck')}
            className={`px-3 sm:px-4 py-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'factcheck'
                ? 'border-red-600 text-red-500'
                : isDark ? 'border-transparent text-slate-400 hover:text-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 size={14} />
            <span>तथ्य जांच व सुधार नीति</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('grievance')}
            className={`px-3 sm:px-4 py-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'grievance'
                ? 'border-red-600 text-red-500'
                : isDark ? 'border-transparent text-slate-400 hover:text-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck size={14} />
            <span>शिकायत निवारण (IT Rules)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`px-3 sm:px-4 py-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'border-red-600 text-red-500'
                : isDark ? 'border-transparent text-slate-400 hover:text-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock size={14} />
            <span>गोपनीयता नीति (DPDP)</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm leading-relaxed">
          {activeTab === 'editorial' && (
            <div className="space-y-4">
              <div className="border-l-4 border-red-600 pl-3">
                <h3 className={`font-black text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  संपादकीय मानक एवं आचार संहिता (Editorial Standards)
                </h3>
                <p className="text-xs text-slate-400">निष्पक्ष, निर्भीक और जिम्मेदार डिजिटल पत्रकारिता का संकल्प</p>
              </div>
              <p>
                <strong>एम्बिशन न्यूज़ (Ambition News Portal)</strong> कवर्धा (कबीरधाम), छत्तीसगढ़ (33 जिले) और मध्य प्रदेश (55 जिले) में निष्पक्ष एवं जनहितकारी समाचार प्रसारण के प्रति समर्पित है। हमारी संपादकीय नीति <em>भारतीय प्रेस परिषद (Press Council of India - PCI)</em> और <em>डिजिटल मीडिया आचार संहिता 2021</em> के दिशानिर्देशों के अनुरूप संचालित होती है।
              </p>
              <div className={`p-3.5 rounded-2xl border space-y-2 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="font-bold text-red-500">संपादकीय सिद्धांत:</h4>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li><strong>निष्पक्षता:</strong> किसी भी राजनीतिक दल, जाति, धर्म या समुदाय के प्रति पूर्वाग्रह रहित रिपोर्टिंग।</li>
                  <li><strong>सटीकता:</strong> अफवाहों व अपुष्ट सोशल मीडिया संदेशों से परे प्राथमिक स्रोतों (प्रशासन, प्रत्यक्षदर्शी, आधिकारिक विज्ञप्ति) से सत्यापन।</li>
                  <li><strong>सामाजिक सद्भाव:</strong> सांप्रदायिक सौहार्द, राष्ट्रीय एकता एवं कानून-व्यवस्था का सम्मान।</li>
                  <li><strong>गोपनीयता व सुरक्षा:</strong> यौन अपराध पीड़ितों, नाबालिगों एवं संवेदनशील जांच से जुड़े व्यक्तियों की पहचान का प्रकटीकरण पूर्णतः प्रतिबंधित है।</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'factcheck' && (
            <div className="space-y-4">
              <div className="border-l-4 border-emerald-600 pl-3">
                <h3 className={`font-black text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  तथ्य जांच (Fact-Checking) एवं सुधार नीति (Corrections Policy)
                </h3>
                <p className="text-xs text-slate-400">अंतरराष्ट्रीय तथ्य जांच नेटवर्क (IFCN) के सिद्धांतों पर आधारित पारदर्शी प्रक्रिया</p>
              </div>
              <p>
                एम्बिशन न्यूज़ डिजिटल मंचों पर फैलने वाले भ्रामक दावों, डीपफेक, और फर्जी खबरों की पहचान के लिए त्रि-स्तरीय सत्यापन प्रक्रिया अपनाता है:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="font-bold text-amber-500 mb-1">१. स्रोत सत्यापन</div>
                  दावा किए गए वीडियो, फोटो या दस्तावेज के मूल स्रोत और मेटाडेटा की तकनीकी जांच।
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="font-bold text-emerald-500 mb-1">२. जमीनी जांच</div>
                  कवर्धा, रायपुर अथवा संबंधित जिले के अधिकृत संवाददाता द्वारा मौके पर सत्यापन।
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="font-bold text-blue-500 mb-1">३. आधिकारिक पुष्टि</div>
                  संबंधित प्रशासनिक अधिकारी, पुलिस या विभाग से औपचारिक वक्तव्य।
                </div>
              </div>
              <div className={`p-3.5 rounded-2xl border space-y-1.5 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="font-bold text-red-500">त्रुटि सुधार (Corrections) नीति:</h4>
                <p className="text-xs">
                  यदि हमारी प्रकाशित खबर में कोई तथ्यात्मक त्रुटि पाई जाती है, तो हम पाठकों के सामने पारदर्शी रूप से खबर के शीर्ष पर <strong>[संशोधन / Correction]</strong> नोट के साथ स्पष्टीकरण प्रकाशित करते हैं।
                </p>
              </div>
            </div>
          )}

          {activeTab === 'grievance' && (
            <div className="space-y-4">
              <div className="border-l-4 border-amber-600 pl-3">
                <h3 className={`font-black text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  सूचना प्रौद्योगिकी (मध्यवर्ती दिशानिर्देश व डिजिटल मीडिया आचार संहिता) नियमावली, 2021
                </h3>
                <p className="text-xs text-slate-400">नियम 11(2)(a) के तहत त्रि-स्तरीय शिकायत निवारण तंत्र की विधिक घोषणा</p>
              </div>
              <p>
                भारत सरकार के सूचना एवं प्रसारण मंत्रालय (MIB) द्वारा अधिसूचित <em>IT Rules 2021</em> के अनुपालन में, एम्बिशन न्यूज़ ने पाठकों की शिकायतों के त्वरित समाधान हेतु अधिकृत शिकायत अधिकारी नियुक्त किया है:
              </p>
              <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-300'}`}>
                <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck size={16} /> अधिकृत शिकायत निवारण अधिकारी (Grievance Redressal Officer)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">नाम एवं पद:</span>
                    <strong className={isDark ? 'text-white' : 'text-slate-900'}>श्री आर. के. वर्मा (वरिष्ठ संपादक व विधिक प्रतिनिधि)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">ईमेल (विधिक पत्राचार):</span>
                    <a href="mailto:grievance@ambition.news" className="font-bold text-red-500 hover:underline">
                      grievance@ambition.news
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400 block">मुख्यालय पता:</span>
                    <span>राजमहल रोड, कवर्धा (कबीरधाम), छत्तीसगढ़ — 491995</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">हेल्पलाइन:</span>
                    <span>{SOCIAL_LINKS.phoneFormatted}</span>
                  </div>
                </div>
                <div className={`pt-2 border-t text-[11px] ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                  ⏱️ <strong>कानूनी समय सीमा:</strong> शिकायत प्राप्त होने पर <strong>२४ घंटे के भीतर</strong> पावती (Acknowledgment) जारी की जाएगी और <strong>१५ दिनों के भीतर</strong> निष्पक्ष निर्णय/समाधान प्रेषित किया जाएगा।
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="border-l-4 border-purple-600 pl-3">
                <h3 className={`font-black text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  गोपनीयता नीति (Privacy Policy) एवं डेटा सुरक्षा (DPDP Act 2023)
                </h3>
                <p className="text-xs text-slate-400">भारतीय डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम 2023 के अनुरूप</p>
              </div>
              <p>
                एम्बिशन न्यूज़ आपके व्यक्तिगत डेटा की गोपनीयता का पूर्ण सम्मान करता है। हम न्यूनतम आवश्यक डेटा सिद्धांत (Data Minimization) का पालन करते हैं।
              </p>
              <div className={`p-3.5 rounded-2xl border space-y-2 text-xs ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="font-bold text-purple-400">प्रमुख सुरक्षा बिंदु:</h4>
                <ul className="list-disc list-inside space-y-1.5">
                  <li><strong>कुकीज एवं लोकल स्टोरेज:</strong> केवल आपकी थीम पसंद (Dark/Light mode), पसंदीदा जिला, और सहेजे गए लेखों/रील्स को स्थानीय डिवाइस पर रखने हेतु उपयोग किया जाता है।</li>
                  <li><strong>कोई तृतीय-पक्ष ट्रैकर नहीं:</strong> हम पाठकों का व्यक्तिगत डेटा किसी तीसरे पक्ष विज्ञापन नेटवर्क या डेटा ब्रोकर को विक्रय नहीं करते।</li>
                  <li><strong>नागरिक रिपोर्टर (Scoop) गोपनीयता:</strong> यदि कोई पाठक जनहित में खबर भेजता है, तो उसकी सहमति के बिना उसकी पहचान या संपर्क विवरण किसी भी स्थिति में सार्वजनिक नहीं किया जाता।</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs ${
          isDark ? 'border-slate-800/80 bg-slate-900/60 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
        }`}>
          <span>© 2026 Ambition News Portal • कवर्धा (कबीरधाम), छत्तीसगढ़</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition"
          >
            समझ गए (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
