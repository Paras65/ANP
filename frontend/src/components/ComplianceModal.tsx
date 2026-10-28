import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, FileText, CheckCircle2, Lock, Scale, AlertCircle, BookOpen } from 'lucide-react';
import { SOCIAL_LINKS } from '../data/mockData';

export type ComplianceTab = 'editorial' | 'factcheck' | 'grievance' | 'privacy' | 'terms' | 'disclaimer';

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
                विधिक नीतियां एवं नियम (Legal, Privacy & Compliance)
              </h2>
              <p className="text-[11px] text-slate-400">
                IT Rules 2021 • DPDP Act 2023 • कॉपीराइट अधिनियम 1957 • भारतीय प्रेस परिषद मानक
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
            onClick={() => setActiveTab('privacy')}
            className={`px-3 sm:px-4 py-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'border-red-600 text-red-500'
                : isDark ? 'border-transparent text-slate-400 hover:text-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock size={14} />
            <span>गोपनीयता नीति (Privacy Policy)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`px-3 sm:px-4 py-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'terms'
                ? 'border-red-600 text-red-500'
                : isDark ? 'border-transparent text-slate-400 hover:text-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen size={14} />
            <span>उपयोग की शर्तें (Terms of Use)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('disclaimer')}
            className={`px-3 sm:px-4 py-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'disclaimer'
                ? 'border-red-600 text-red-500'
                : isDark ? 'border-transparent text-slate-400 hover:text-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertCircle size={14} />
            <span>अस्वीकरण (Disclaimer)</span>
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
            <span>शिकायत निवारण (IT Rules 2021)</span>
          </button>
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
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm leading-relaxed">
          {/* 1. PRIVACY POLICY (DPDP ACT 2023) */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="border-l-4 border-purple-600 pl-3">
                <h3 className={`font-black text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  गोपनीयता नीति (Privacy Policy) एवं डेटा सुरक्षा (DPDP Act 2023)
                </h3>
                <p className="text-xs text-slate-400">भारतीय डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम 2023 के अनुरूप</p>
              </div>
              <p>
                <strong>एम्बिशन न्यूज़ (Ambition News Portal)</strong> आपके व्यक्तिगत डेटा की गोपनीयता का सर्वोच्च सम्मान करता है। हम न्यूनतम आवश्यक डेटा सिद्धांत (Data Minimization) का कड़ाई से पालन करते हैं।
              </p>
              <div className={`p-4 rounded-2xl border space-y-2.5 text-xs ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="font-bold text-purple-400">मुख्य गोपनीयता घोषणाएं:</h4>
                <ul className="list-disc list-inside space-y-1.5">
                  <li><strong>लोकल स्टोरेज व कुकीज:</strong> हम केवल आपकी चयनित थीम (डार्क/लाइट), चुना हुआ जिला, और बुकमार्क/सहेजे गए लेखों को आपके अपने ब्राउज़र के सुरक्षित स्टोरेज में रखते हैं। हम कोई आक्रामक ट्रैकर या क्रॉस-साइट फिंगरप्रिंटिंग उपयोग नहीं करते।</li>
                  <li><strong>नागरिक पत्रकारिता (Citizen Scoop) सुरक्षा:</strong> यदि आप &lsquo;खबर भेजें&rsquo; फीचर द्वारा कोई समाचार भेजते हैं, तो आपका नाम अथवा फोन नंबर केवल आंतरिक संपादकीय सत्यापन तक सीमित रहता है। आपकी स्पष्ट सहमति के बिना आपकी पहचान कभी उजागर नहीं की जाती।</li>
                  <li><strong>शून्य डेटा बिक्री (No Third-Party Sale):</strong> हम अपने पाठकों का कोई भी व्यक्तिगत डेटा किसी विज्ञापन एजेंसी, डेटा ब्रोकर, अथवा तीसरे पक्ष को विक्रय या साझा नहीं करते।</li>
                  <li><strong>सुरक्षित संचार (SSL/TLS Encryption):</strong> पोर्टल और सर्वर के मध्य समस्त संचार 256-बिट SSL/TLS एन्क्रिप्टेड है।</li>
                </ul>
              </div>
            </div>
          )}

          {/* 2. TERMS OF USE */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="border-l-4 border-blue-600 pl-3">
                <h3 className={`font-black text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  उपयोग की शर्तें व नियम (Terms of Use / Terms of Service)
                </h3>
                <p className="text-xs text-slate-400">पोर्टल का उपयोग करने पर इन विधिक शर्तों की सहमति अनिवार्य है</p>
              </div>
              <p>
                एम्बिशन न्यूज़ पोर्टल (ambitionnews.com / ambition-news-portal.vercel.app) का उपयोग करके आप निम्नलिखित शर्तों से कानूनी रूप से बाध्य होने की सहमति देते हैं:
              </p>
              <div className={`p-4 rounded-2xl border space-y-2.5 text-xs ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="font-bold text-blue-400">उपयोग के नियम:</h4>
                <ul className="list-disc list-inside space-y-1.5">
                  <li><strong>व्यक्तिगत व गैर-व्यावसायिक उपयोग:</strong> पाठक पोर्टल की सामग्री को व्यक्तिगत जानकारी के उद्देश्य से पढ़ने व सोशल मीडिया पर साझा (Share) करने के लिए स्वतंत्र हैं।</li>
                  <li><strong>कॉपीराइट व बौद्धिक संपदा:</strong> एम्बिशन न्यूज़ की मूल रिपोर्ट, तस्वीरें, विशेष वीडियो बुलेटिन और ग्राफिक्स <em>कॉपीराइट अधिनियम, 1957</em> के तहत संरक्षित हैं। संपादकीय डेस्क की लिखित अनुमति के बिना थोक में सामग्री की चोरी या व्यावसायिक री-पब्लिशिंग दंडनीय अपराध है।</li>
                  <li><strong>निषिद्ध आचरण:</strong> पोर्टल पर किसी भी प्रकार का साइबर हमला, दुर्भावनापूर्ण स्क्रिप्ट इंजेक्शन, डेटा स्क्रैपिंग, अथवा नागरिक रिपोर्टर फॉर्म में फर्जी, अश्लील, भड़काऊ या मानहानिकारक सामग्री भेजना प्रतिबंधित है।</li>
                  <li><strong>विधिक क्षेत्राधिकार:</strong> इस पोर्टल से उत्पन्न किसी भी विधिक विवाद की स्थिति में न्यायिक क्षेत्राधिकार केवल <strong>कवर्धा (कबीरधाम), छत्तीसगढ़</strong> की सक्षम न्यायालयों का होगा।</li>
                </ul>
              </div>
            </div>
          )}

          {/* 3. DISCLAIMER */}
          {activeTab === 'disclaimer' && (
            <div className="space-y-4">
              <div className="border-l-4 border-amber-600 pl-3">
                <h3 className={`font-black text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  अस्वीकरण एवं प्रकटीकरण (Content & Legal Disclaimer)
                </h3>
                <p className="text-xs text-slate-400">सामग्री की प्रामाणिकता, मंडी भाव एवं बाह्य लिंक्स संबंधी प्रकटीकरण</p>
              </div>
              <div className={`p-4 rounded-2xl border space-y-2.5 text-xs ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>समाचार सटीकता:</strong> यद्यपि हम प्रत्येक समाचार को निष्पक्ष एवं सटीक स्रोतों से जांचने के पश्चात ही प्रकाशित करते हैं, फिर भी आपातकालीन परिस्थितियों अथवा कानूनी प्रक्रियाओं में पाठकों को आधिकारिक सरकारी गजट या प्रशासनिक सूचनाओं पर भी निर्भर रहने की सलाह दी जाती है।</li>
                  <li><strong>मंडी भाव प्रकटीकरण:</strong> पोर्टल पर प्रदर्शित कृषि उपज एवं मंडी भाव (कवर्धा, रायपुर, बिलासपुर, जबलपुर आदि कृषि उपज मंडियों) स्थानीय व्यापारियों व दैनिक आवक के आधार पर सांकेतिक रूप से प्रस्तुत किए जाते हैं। वास्तविक गुणवत्ता व बोली के अनुसार स्थानीय स्तर पर दरों में मामूली अंतर संभव है।</li>
                  <li><strong>तृतीय-पक्ष सोशल मीडिया लिंक्स:</strong> पोर्टल पर यूट्यूब वीडियो, इंस्टाग्राम रील्स, अथवा व्हाट्सएप लिंक्स जनहित एवं संदर्भ हेतु एम्बेड किए गए हैं। इन मंचों की अपनी स्वतंत्र नीतियां हैं जिनके लिए एम्बिशन न्यूज़ उत्तरदायी नहीं है।</li>
                </ul>
              </div>
            </div>
          )}

          {/* 4. GRIEVANCE REDRESSAL (IT RULES 2021) */}
          {activeTab === 'grievance' && (
            <div className="space-y-4">
              <div className="border-l-4 border-red-600 pl-3">
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
                    <strong className={isDark ? 'text-white' : 'text-slate-900'}>श्री उत्तम चंद्रवंशी (वरिष्ठ संपादक व विधिक प्रतिनिधि)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">ईमेल (विधिक पत्राचार):</span>
                    <a href="mailto:grievance@ambitionnews.in" className="font-bold text-red-500 hover:underline">
                      grievance@ambitionnews.in
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

          {/* 5. EDITORIAL POLICY */}
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

          {/* 6. FACT-CHECKING POLICY */}
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
