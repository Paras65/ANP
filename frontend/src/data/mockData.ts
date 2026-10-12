import type { Article, VideoBulletin, InstagramPost, MandiRate, DistrictItem } from '../types';

export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/ambition_news/',
  instagramHandle: '@ambition_news',
  instagramBio: 'Ambition news ( कवर्धा ) • निष्पक्ष एवं निर्भीक क्षेत्रीय पत्रकारिता',
  youtube: 'https://www.youtube.com/@ambition_news',
  youtubeHandle: '@ambition_news',
  youtubeSubs: '4.2K+',
  whatsappShare: 'https://wa.me/?text=',
  whatsappChannel: 'https://whatsapp.com/channel/ambition_news',
  headquarters: 'कवर्धा (कबीरधाम), छत्तीसगढ़'
};

export const INITIAL_ARTICLES: Article[] = [
  {
    _id: 'art-kwd-1',
    title: 'कवर्धा में भोरमदेव मंदिर कॉरिडोर और पर्यटन विकास योजना को मिली हरी झंडी, ₹45 करोड़ की लागत से होगा कायाकल्प',
    excerpt: 'कबीरधाम (कवर्धा) के ऐतिहासिक भोरमदेव मंदिर क्षेत्र को अंतरराष्ट्रीय पर्यटन मानचित्र पर स्थापित करने के लिए वृहद कार्ययोजना तैयार। श्रद्धालुओं की सुविधा के लिए आधुनिक धर्मशाला, सुगम मार्ग और फव्वारे बनेंगे...',
    content: `कबीरधाम (कवर्धा) के ऐतिहासिक एवं पुरातात्विक महत्व वाले भोरमदेव मंदिर परिसर को भव्य स्वरूप देने के लिए राज्य शासन ने 45 करोड़ रुपये के विशेष विकास पैकेज को मंजूरी दे दी है।

विस्तृत कार्ययोजना के तहत:
1. मंदिर पहुंच मार्ग का 4-लेन चौड़ीकरण और सोलर स्ट्रीट लाइट्स।
2. 500 से अधिक श्रद्धालुओं के ठहरने हेतु वातानुकूलित धर्मशाला व प्रतीक्षालय।
3. स्थानीय हस्तशिल्प और माटी कला को बढ़ावा देने के लिए शिल्प ग्राम (Craft Village)।
4. मैकल पर्वत श्रृंखला की तलहटी में इको-टूरिज्म पार्क व नौकायन सुविधा।

कलेक्टर एवं स्थानीय जन प्रतिनिधियों ने संयुक्त निरीक्षण कर 15 माह के भीतर कार्य पूर्ण करने के निर्देश दिए हैं। स्थानीय नागरिकों एवं व्यापारियों में इस निर्णय से हर्ष का माहौल है।`,
    coverImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1000&auto=format&fit=crop&q=80',
    district: 'कबीरधाम (कवर्धा)',
    state: 'chhattisgarh',
    category: '🏗️ विकास',
    author: 'अमित चंद्रवंशी (कवर्धा ब्यूरो चीफ)',
    views: 3420,
    isBreaking: true,
    isFeatured: true,
    shares: 412,
    publishedAt: new Date(Date.now() - 18 * 60 * 1000).toISOString()
  },
  {
    _id: 'art-rpr-2',
    title: 'किसानों के खाते में धान बोनस की अगली किश्त जल्द: मुख्यमंत्री ने मंत्रालय में समीक्षा बैठक कर दिए कड़े निर्देश',
    excerpt: 'मंत्रालय महानदी भवन में आयोजित उच्चस्तरीय बैठक में कृषि विभाग को निर्देश दिए गए कि भुगतान प्रक्रिया में कोई बाधा न आए। सभी जिला कलेक्टरों को समयबद्ध निगरानी के आदेश...',
    content: `रायपुर: मंत्रालय महानदी भवन में मुख्यमंत्री ने कृषि एवं सहकारिता विभाग के वरिष्ठ अधिकारियों के साथ विस्तृत समीक्षा बैठक की। बैठक में स्पष्ट किया गया कि खरीफ विपणन वर्ष के तहत पंजीकृत किसानों को धान की अंतर राशि (बोनस) समय पर अंतरित की जाएगी।

बैठक में यह निर्णय लिया गया कि सभी 33 जिलों के उपार्जन केंद्रों पर बारदाने, नमी मापक यंत्र और तौल मशीनों का अग्रिम सत्यापन कराया जाए ताकि मंडियों में किसानों को अनावश्यक विलंब न झेलना पड़े।`,
    coverImage: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1000&auto=format&fit=crop&q=80',
    district: 'रायपुर',
    state: 'chhattisgarh',
    category: '🏛️ राजनीति व किसान',
    author: 'विशेष संवाददाता (रायपुर डेस्क)',
    views: 2890,
    isBreaking: true,
    isFeatured: false,
    shares: 310,
    publishedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  },
  {
    _id: 'art-kwd-3',
    title: 'कवर्धा कृषि उपज मंडी में नए गुड़ की बंपर आवक: किसानों को ₹3,500 प्रति क्विंटल तक मिला रिकॉर्ड भाव',
    excerpt: 'मैकल पर्वत की तलहटी से आने वाले गन्ने से तैयार सुगंधित गुड़ की मांग अंतरराज्यीय व्यापारियों में बढ़ी। मध्य प्रदेश, महाराष्ट्र और ओडिशा के व्यापारी कवर्धा मंडी पहुंचे...',
    content: `कबीरधाम: छत्तीसगढ़ का गुड़ का कटोरा कहे जाने वाले कवर्धा में इस सीजन के नए गुड़ की आवक चरम पर पहुंच गई है। स्थानीय गुड़ व्यापारियों और बाहर से आए खरीदारों के बीच खुली बोली में गुड़ के दाम ₹3,450 से ₹3,550 प्रति क्विंटल तक दर्ज किए गए।

मंडी सचिव ने बताया कि पारदर्शी नीलामी व्यवस्था और तत्काल भुगतान प्रणाली लागू होने से किसानों में उत्साह है। प्रशासन ने मिलावट रोकने के लिए खाद्य सुरक्षा जांच दल को तैनात रखा है।`,
    coverImage: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=1000&auto=format&fit=crop&q=80',
    district: 'कबीरधाम (कवर्धा)',
    state: 'chhattisgarh',
    category: '🌾 कृषि व मंडी',
    author: 'संजय वर्मा (कृषि डेस्क, कवर्धा)',
    views: 2150,
    isBreaking: false,
    isFeatured: false,
    shares: 195,
    publishedAt: new Date(Date.now() - 85 * 60 * 1000).toISOString()
  },
  {
    _id: 'art-bsp-4',
    title: 'बिलासपुर हाईकोर्ट का अहम फैसला: राजस्व मामलों में अनावश्यक स्थगन आदेश देने पर अफसरों पर तल्ख टिप्पणी',
    excerpt: 'हाईकोर्ट की एकलपीठ ने वर्षों से लंबित जमीन नामांतरण और सीमांकन याचिकाओं पर सुनवाई करते हुए राजस्व विभाग को 60 दिवस में समाधान की सख्त गाइडलाइन जारी की...',
    content: `बिलासपुर: छत्तीसगढ़ उच्च न्यायालय ने राजस्व न्यायालयों में वर्षों से अटके नामांतरण, बंटवारा और सीमांकन मामलों पर सख्त रुख अपनाया है। 

अदालत ने कहा कि आम किसानों व नागरिकों को अपनी ही भूमि के अभिलेख दुरुस्त कराने के लिए तहसीलों के चक्कर काटना प्राकृतिक न्याय के विरुद्ध है। मुख्य सचिव को निर्देश दिए गए हैं कि सभी जिलों के एसडीएम और तहसीलदारों की मासिक प्रगति रिपोर्ट डिजिटल पोर्टल पर प्रदर्शित की जाए।`,
    coverImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1000&auto=format&fit=crop&q=80',
    district: 'बिलासपुर',
    state: 'chhattisgarh',
    category: '⚖️ हाई कोर्ट व कानून',
    author: 'राजेश शुक्ला (विधि संवाददाता)',
    views: 1840,
    isBreaking: false,
    isFeatured: false,
    shares: 140,
    publishedAt: new Date(Date.now() - 140 * 60 * 1000).toISOString()
  },
  {
    _id: 'art-bpl-5',
    title: 'भोपाल मेट्रो के दूसरे चरण का ट्रायल रन सफल: करोंद से एम्स रूट पर जल्द दौड़ेगी ट्रेन',
    excerpt: 'राजधानी भोपाल में सार्वजनिक परिवहन को विश्वस्तरीय बनाने की दिशा में बड़ा कदम। 8 नए एलिवेटेड स्टेशनों पर तकनीकी परीक्षण पूरा, अगले माह से आम जनता के लिए शुरुआत...',
    content: `भोपाल: मध्यप्रदेश मेट्रो रेल कॉर्पोरेशन ने भोपाल मेट्रो के बहुप्रतीक्षित दूसरे चरण का सफल हाई-स्पीड सेफ्टी ट्रायल पूरा कर लिया है। एम्स से करोंद चौराहे तक फैले इस रूट पर ऊर्जा खपत, इमरजेंसी ब्रेकिंग और सिग्नलिंग का सघन परीक्षण किया गया। 

परिवहन विशेषज्ञों के अनुसार इससे प्रतिदिन 1.5 लाख से अधिक यात्रियों का सफर 40 मिनट तक तेज और सुरक्षित हो जाएगा।`,
    coverImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1000&auto=format&fit=crop&q=80',
    district: 'भोपाल',
    state: 'madhya-pradesh',
    category: '🏗️ विकास',
    author: 'नीलेश शर्मा (भोपाल ब्यूरो)',
    views: 2310,
    isBreaking: true,
    isFeatured: false,
    shares: 260,
    publishedAt: new Date(Date.now() - 190 * 60 * 1000).toISOString()
  },
  {
    _id: 'art-idr-6',
    title: 'इंदौर: स्वच्छता में लगातार 8वीं बार सिरमौर बनने के बाद अब शून्य-कार्बन उत्सर्जन मॉडल सिटी की तैयारी',
    excerpt: 'देश के सबसे स्वच्छ शहर इंदौर ने अब इलेक्ट्रिक पब्लिक ट्रांसपोर्ट और 100% सोलर रूफटॉप मिशन शुरू किया। नगर निगम ने पेश किया ग्रीन सिटी एक्शन प्लान...',
    content: `इंदौर: देश में स्वच्छता का पर्याय बन चुके इंदौर ने अब भविष्य के पर्यावरण अनुकूल शहर की ओर कदम बढ़ा दिए हैं। इंदौर नगर निगम ने शून्य-कार्बन उत्सर्जन की दिशा में 200 नई इलेक्ट्रिक बसें और शहर भर में 150 नए ईवी चार्जिंग स्टेशन स्थापित करने का फैसला किया है। 

साथ ही गीले कचरे से बायो-सीएनजी उत्पादन क्षमता को दोगुना किया जाएगा।`,
    coverImage: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=1000&auto=format&fit=crop&q=80',
    district: 'इंदौर',
    state: 'madhya-pradesh',
    category: '🏗️ विकास',
    author: 'सतीश पटेरिया (मालवा डेस्क)',
    views: 1670,
    isBreaking: false,
    isFeatured: false,
    shares: 112,
    publishedAt: new Date(Date.now() - 260 * 60 * 1000).toISOString()
  },
  {
    _id: 'art-kwd-7',
    title: 'कवर्धा के चिल्फी घाटी में भारी कोहरे और ठंड का असर: मैकल पर्वत में प्राकृतिक सौंदर्य निखरा, सैलानियों का तांता',
    excerpt: 'छत्तीसगढ़ के शिमला के नाम से मशहूर चिल्फी घाटी में तापमान में भारी गिरावट। सुबह के समय दृश्यता 20 मीटर से कम रही, रायपुर-जबलपुर नेशनल हाईवे पर वाहन रेंगते दिखे...',
    content: `कबीरधाम: जिले के सीमावर्ती चिल्फी घाटी और वनांचल बोड़ला क्षेत्र में ठंड के तेवर तीखे हो गए हैं। घने साल वनों से आच्छादित मैकल पर्वत श्रृंखला में कोहरे की चादर बिछ जाने से अद्भुत दृश्य निर्मित हो गया है।

छुट्टियों के चलते छत्तीसगढ़ और पड़ोसी राज्य मध्यप्रदेश के मंडला, बालाघाट से बड़ी संख्या में पर्यटक सनराइज पॉइंट और चिल्फी रेस्ट हाउस पहुंचे हैं। वन विभाग ने घाटी मोड़ पर सावधानी बरतने के चेतावनी बोर्ड लगाए हैं।`,
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000&auto=format&fit=crop&q=80',
    district: 'कबीरधाम (कवर्धा)',
    state: 'chhattisgarh',
    category: '🌦️ मौसम व पर्यटन',
    author: 'मनीष यादव (चिल्फी ग्राउंड रिपोर्ट)',
    views: 3100,
    isBreaking: false,
    isFeatured: false,
    shares: 380,
    publishedAt: new Date(Date.now() - 320 * 60 * 1000).toISOString()
  }
];

export const VIDEO_BULLETINS: VideoBulletin[] = [
  {
    id: 'vid-1',
    title: 'Ambition News Special: कवर्धा शहर के प्रमुख मुद्दों पर नागरिकों और जनप्रतिनिधियों की सीधी बहस',
    youtubeId: 'b_oYfF8jO4M',
    thumbnail: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
    duration: '14:28',
    views: '8.4K',
    timeAgo: '2 घंटे पहले',
    category: 'कवर्धा स्पेशल',
    youtubeUrl: 'https://www.youtube.com/@ambition_news'
  },
  {
    id: 'vid-2',
    title: 'छत्तीसगढ़ आज शाम का महाबुलेटिन: धान खरीदी, कैबिनेट बैठक और बस्तर से ग्राउंड रिपोर्ट',
    youtubeId: 'L_LUpnjgPso',
    thumbnail: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&auto=format&fit=crop&q=80',
    duration: '18:50',
    views: '12.1K',
    timeAgo: '5 घंटे पहले',
    category: 'राज्य बुलेटिन',
    youtubeUrl: 'https://www.youtube.com/@ambition_news'
  },
  {
    id: 'vid-3',
    title: 'भोरमदेव महोत्सव 2026 की भव्य तैयारियां: मंदिर के इतिहास और रहस्य पर विशेष वृत्तचित्र',
    youtubeId: 'kJQP7kiw5Fk',
    thumbnail: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80',
    duration: '09:15',
    views: '6.8K',
    timeAgo: '1 दिन पहले',
    category: 'संस्कृति व धरोहर',
    youtubeUrl: 'https://www.youtube.com/@ambition_news'
  },
  {
    id: 'vid-4',
    title: 'मंडी हलचल: कवर्धा, राजनांदगांव और इंदौर मंडियों में आज के रिकॉर्ड भाव और किसानों की राय',
    youtubeId: 'fJ9rUzIMcZQ',
    thumbnail: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&auto=format&fit=crop&q=80',
    duration: '07:42',
    views: '5.2K',
    timeAgo: '1 दिन पहले',
    category: 'मंडी भाव',
    youtubeUrl: 'https://www.youtube.com/@ambition_news'
  }
];

export const INSTAGRAM_POSTS: InstagramPost[] = [
  {
    id: 'insta-1',
    caption: 'कवर्धा चिल्फी घाटी का विहंगम दृश्य... मैकल की वादियों में कोहरे की चादर 📸 @ambition_news #Kawardha #ChilphiGhati #MaikalRange #ChhattisgarhTourism',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    youtubeId: 'kJQP7kiw5Fk',
    postUrl: 'https://www.instagram.com/ambition_news/',
    likes: '1,420',
    commentsCount: '184',
    sharesCount: '92',
    district: 'कवर्धा',
    timeAgo: '3 घंटे पहले',
    audioTrack: 'Ambition News • चिल्फी घाटी मॉर्निंग स्पेशल'
  },
  {
    id: 'insta-2',
    caption: 'ऐतिहासिक भोरमदेव मंदिर — छत्तीसगढ़ का खजुराहो! 45 करोड़ की भव्य योजना का एलान। #Bhoramdeo #AmbitionNews #Kawardha #Heritage',
    imageUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80',
    youtubeId: 'b_oYfF8jO4M',
    postUrl: 'https://www.instagram.com/ambition_news/',
    likes: '2,180',
    commentsCount: '342',
    sharesCount: '215',
    district: 'कबीरधाम',
    timeAgo: '7 घंटे पहले',
    audioTrack: 'Ambition News • भोरमदेव भक्ति व संस्कृति'
  },
  {
    id: 'insta-3',
    caption: 'कवर्धा गुड़ मंडी में रिकॉर्ड आवक! देसी स्वाद और किसानों की मेहनत की खुशबू चारों ओर। #MandiBhav #CGKisan #KawardhaMandi',
    imageUrl: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&auto=format&fit=crop&q=80',
    youtubeId: 'fJ9rUzIMcZQ',
    postUrl: 'https://www.instagram.com/ambition_news/',
    likes: '980',
    commentsCount: '96',
    sharesCount: '58',
    district: 'कवर्धा',
    timeAgo: '1 दिन पहले',
    audioTrack: 'Ambition News • किसान व मंडी हलचल'
  },
  {
    id: 'insta-4',
    caption: 'अंबिशन न्यूज़ टीम ग्राउंड पर! जनता की हर आवाज़ निष्पक्षता से आप तक पहुंचाना हमारा संकल्प। #GroundReporting #KawardhaNews #AmbitionJournalism',
    imageUrl: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&auto=format&fit=crop&q=80',
    youtubeId: 'L_LUpnjgPso',
    postUrl: 'https://www.instagram.com/ambition_news/',
    likes: '1,750',
    commentsCount: '228',
    sharesCount: '140',
    district: 'मुख्यालय',
    timeAgo: '2 दिन पहले',
    audioTrack: 'Ambition News • ग्राउंड जीरो रिपोर्टिंग ओरिजिनल'
  },
  {
    id: 'insta-5',
    caption: 'कवर्धा रानीदहरा जलप्रपात — वनांचल की हरी-भरी वादियों के बीच बहती दूधिया जलधारा! वीकेंड पर पर्यटकों की उमड़ी भारी भीड़। #Ranidahra #KawardhaWaterfall #KabirdhamTourism #AmbitionNews',
    imageUrl: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-waterfall-in-forest-2213-large.mp4',
    youtubeId: 'kJQP7kiw5Fk',
    postUrl: 'https://www.instagram.com/ambition_news/',
    likes: '3,420',
    commentsCount: '412',
    sharesCount: '310',
    district: 'कवर्धा',
    timeAgo: '4 घंटे पहले',
    audioTrack: 'Ambition News • रानीदहरा झरना व प्राकृतिक संगीत'
  },
  {
    id: 'insta-6',
    caption: 'छत्तीसगढ़िया ओलंपिक और पारंपरिक खेलों में कवर्धा के युवाओं का जलवा! गेड़ी दौड़ और कबड्डी में दिखा गजब का उत्साह। #CGOlympics #KawardhaSports #AmbitionNewsLive #Kabaddi',
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-man-running-on-a-rural-road-42674-large.mp4',
    youtubeId: 'b_oYfF8jO4M',
    postUrl: 'https://www.instagram.com/ambition_news/',
    likes: '2,890',
    commentsCount: '275',
    sharesCount: '198',
    district: 'कबीरधाम',
    timeAgo: '1 दिन पहले',
    audioTrack: 'Ambition News • छत्तीसगढ़िया जोश व खेल तरंग'
  },
  {
    id: 'insta-7',
    caption: 'कवर्धा भारत माता चौक पर भव्य शाम की महाआरती और रोशनी का मनोरम दृश्य! जय छत्तीसगढ़ महतारी। #KawardhaCity #BharatMataChowk #NightView #Kabirdham',
    imageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=80',
    youtubeId: 'L_LUpnjgPso',
    postUrl: 'https://www.instagram.com/ambition_news/',
    likes: '4,120',
    commentsCount: '530',
    sharesCount: '420',
    district: 'कवर्धा',
    timeAgo: '2 दिन पहले',
    audioTrack: 'Ambition News • कवर्धा संध्या आरती ओरिजिनल'
  }
];

export const MANDI_RATES: MandiRate[] = [
  { id: 'm-1', crop: 'गुड़ (देसी/सुपर)', mandi: 'कवर्धा', state: 'CG', rate: 3480, unit: '₹/क्विंटल', change: 'up', diff: 80 },
  { id: 'm-2', crop: 'चना (बड़ा)', mandi: 'कवर्धा', state: 'CG', rate: 5950, unit: '₹/क्विंटल', change: 'up', diff: 120 },
  { id: 'm-3', crop: 'धान (सरना)', mandi: 'रायपुर/कवर्धा', state: 'CG', rate: 3100, unit: '₹/क्विंटल', change: 'steady', diff: 0 },
  { id: 'm-4', crop: 'सोयाबीन (पीला)', mandi: 'राजनांदगांव', state: 'CG', rate: 4720, unit: '₹/क्विंटल', change: 'down', diff: -40 },
  { id: 'm-5', crop: 'गेहूं (शरबती)', mandi: 'इंदौर/भोपाल', state: 'MP', rate: 2780, unit: '₹/क्विंटल', change: 'up', diff: 50 },
  { id: 'm-6', crop: 'मक्का (हाइब्रिड)', mandi: 'छिंदवाड़ा', state: 'MP', rate: 2150, unit: '₹/क्विंटल', change: 'steady', diff: 0 }
];

export const POPULAR_DISTRICTS_CG = [
  'कबीरधाम (कवर्धा)',
  'रायपुर',
  'बिलासपुर',
  'दुर्ग',
  'राजनंदगांव',
  'बस्तर',
  'कोरबा',
  'रायगढ़',
  'सरगुजा'
];

export const POPULAR_DISTRICTS_MP = [
  'भोपाल',
  'इंदौर',
  'जबलपुर',
  'ग्वालियर',
  'उज्जैन',
  'सागर',
  'रीवा',
  'छिंदवाड़ा'
];

export const ALL_DISTRICTS_DEMO: DistrictItem[] = [
  { _id: 'd-kwd', name: 'Kabirdham', nameHindi: 'कबीरधाम (कवर्धा)', slug: 'kabirdham', state: 'chhattisgarh' },
  { _id: 'd-rpr', name: 'Raipur', nameHindi: 'रायपुर', slug: 'raipur', state: 'chhattisgarh' },
  { _id: 'd-bsp', name: 'Bilaspur', nameHindi: 'बिलासपुर', slug: 'bilaspur', state: 'chhattisgarh' },
  { _id: 'd-drg', name: 'Durg', nameHindi: 'दुर्ग', slug: 'durg', state: 'chhattisgarh' },
  { _id: 'd-rjn', name: 'Rajnandgaon', nameHindi: 'राजनंदगांव', slug: 'rajnandgaon', state: 'chhattisgarh' },
  { _id: 'd-bst', name: 'Bastar', nameHindi: 'बस्तर', slug: 'bastar', state: 'chhattisgarh' },
  { _id: 'd-krb', name: 'Korba', nameHindi: 'कोरबा', slug: 'korba', state: 'chhattisgarh' },
  { _id: 'd-rgh', name: 'Raigarh', nameHindi: 'रायगढ़', slug: 'raigarh', state: 'chhattisgarh' },
  { _id: 'd-sgj', name: 'Surguja', nameHindi: 'सरगुजा', slug: 'surguja', state: 'chhattisgarh' },
  { _id: 'd-dnt', name: 'Dantewada', nameHindi: 'दंतेवाड़ा', slug: 'dantewada', state: 'chhattisgarh' },
  { _id: 'd-bpl', name: 'Bhopal', nameHindi: 'भोपाल', slug: 'bhopal', state: 'madhya-pradesh' },
  { _id: 'd-idr', name: 'Indore', nameHindi: 'इंदौर', slug: 'indore', state: 'madhya-pradesh' },
  { _id: 'd-jbl', name: 'Jabalpur', nameHindi: 'जबलपुर', slug: 'jabalpur', state: 'madhya-pradesh' },
  { _id: 'd-gwl', name: 'Gwalior', nameHindi: 'ग्वालियर', slug: 'gwalior', state: 'madhya-pradesh' },
  { _id: 'd-ujn', name: 'Ujjain', nameHindi: 'उज्जैन', slug: 'ujjain', state: 'madhya-pradesh' },
  { _id: 'd-sgr', name: 'Sagar', nameHindi: 'सागर', slug: 'sagar', state: 'madhya-pradesh' },
  { _id: 'd-rew', name: 'Rewa', nameHindi: 'रीवा', slug: 'rewa', state: 'madhya-pradesh' },
  { _id: 'd-chw', name: 'Chhindwara', nameHindi: 'छिंदवाड़ा', slug: 'chhindwara', state: 'madhya-pradesh' }
];
