import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { State } from '../src/models/State.model.js';
import { District } from '../src/models/District.model.js';
import { Category } from '../src/models/Category.model.js';
import { User } from '../src/models/User.model.js';
import { Article } from '../src/models/Article.model.js';
import { Video } from '../src/models/Video.model.js';
import { Reel } from '../src/models/Reel.model.js';

dotenv.config();

// 33 Districts of Chhattisgarh
const cgDistricts = [
  { name: 'Raipur', nameHindi: 'रायपुर', slug: 'raipur' },
  { name: 'Bilaspur', nameHindi: 'बिलासपुर', slug: 'bilaspur' },
  { name: 'Durg', nameHindi: 'दुर्ग', slug: 'durg' },
  { name: 'Bhilai', nameHindi: 'भिलाई', slug: 'bhilai' },
  { name: 'Rajnandgaon', nameHindi: 'राजनंदगांव', slug: 'rajnandgaon' },
  { name: 'Korba', nameHindi: 'कोरबा', slug: 'korba' },
  { name: 'Raigarh', nameHindi: 'रायगढ़', slug: 'raigarh' },
  { name: 'Jagdalpur', nameHindi: 'जगदलपुर', slug: 'jagdalpur' },
  { name: 'Bastar', nameHindi: 'बस्तर', slug: 'bastar' },
  { name: 'Dantewada', nameHindi: 'दंतेवाड़ा', slug: 'dantewada' },
  { name: 'Kanker', nameHindi: 'कांकेर', slug: 'kanker' },
  { name: 'Sukma', nameHindi: 'सुकमा', slug: 'sukma' },
  { name: 'Bijapur', nameHindi: 'बीजापुर', slug: 'bijapur' },
  { name: 'Narayanpur', nameHindi: 'नारायणपुर', slug: 'narayanpur' },
  { name: 'Kondagaon', nameHindi: 'कोंडागांव', slug: 'kondagaon' },
  { name: 'Surguja', nameHindi: 'सरगुजा', slug: 'surguja' },
  { name: 'Ambikapur', nameHindi: 'अंबिकापुर', slug: 'ambikapur' },
  { name: 'Surajpur', nameHindi: 'सूरजपुर', slug: 'surajpur' },
  { name: 'Balrampur', nameHindi: 'बलरामपुर', slug: 'balrampur' },
  { name: 'Koriya', nameHindi: 'कोरिया', slug: 'koriya' },
  { name: 'Manendragarh-Chirmiri-Bharatpur', nameHindi: 'मनेंद्रगढ़-चिरमिरी-भरतपुर', slug: 'mcb' },
  { name: 'Jashpur', nameHindi: 'जशपुर', slug: 'jashpur' },
  { name: 'Janjgir-Champa', nameHindi: 'जांजगीर-चांपा', slug: 'janjgir-champa' },
  { name: 'Sakti', nameHindi: 'सक्ती', slug: 'sakti' },
  { name: 'Mungeli', nameHindi: 'मुंगेली', slug: 'mungeli' },
  { name: 'Gaurela-Pendra-Marwahi', nameHindi: 'गौरेला-पेंड्रा-मरवाही', slug: 'gpm' },
  { name: 'Kabirdham', nameHindi: 'कबीरधाम (कवर्धा)', slug: 'kabirdham' },
  { name: 'Khairagarh-Chhuikhadan-Gandai', nameHindi: 'खैरागढ़-छुईखदान-गंडई', slug: 'kcg' },
  { name: 'Mohla-Manpur-Ambagarh Chowki', nameHindi: 'मोहला-मानपुर-अंबागढ़ चौकी', slug: 'mma' },
  { name: 'Bemetara', nameHindi: 'बेमेतरा', slug: 'bemetara' },
  { name: 'Balod', nameHindi: 'बालोद', slug: 'balod' },
  { name: 'Dhamtari', nameHindi: 'धमतरी', slug: 'dhamtari' },
  { name: 'Mahasamund', nameHindi: 'महासमुंद', slug: 'mahasamund' },
  { name: 'Gariaband', nameHindi: 'गरियाबंद', slug: 'gariaband' },
  { name: 'Baloda Bazar-Bhatapara', nameHindi: 'बलौदा बाजार-भाटापारा', slug: 'baloda-bazar' },
  { name: 'Sarangarh-Bilaigarh', nameHindi: 'सारंगढ़-बिलाईगढ़', slug: 'sarangarh' },
];

// 55 Districts of Madhya Pradesh
const mpDistricts = [
  { name: 'Bhopal', nameHindi: 'भोपाल', slug: 'bhopal' },
  { name: 'Indore', nameHindi: 'इंदौर', slug: 'indore' },
  { name: 'Jabalpur', nameHindi: 'जबलपुर', slug: 'jabalpur' },
  { name: 'Gwalior', nameHindi: 'ग्वालियर', slug: 'gwalior' },
  { name: 'Ujjain', nameHindi: 'उज्जैन', slug: 'ujjain' },
  { name: 'Sagar', nameHindi: 'सागर', slug: 'sagar' },
  { name: 'Rewa', nameHindi: 'रीवा', slug: 'rewa' },
  { name: 'Satna', nameHindi: 'सतना', slug: 'satna' },
  { name: 'Chhindwara', nameHindi: 'छिंदवाड़ा', slug: 'chhindwara' },
  { name: 'Ratlam', nameHindi: 'रतलाम', slug: 'ratlam' },
  { name: 'Dewas', nameHindi: 'देवास', slug: 'dewas' },
  { name: 'Murwara (Katni)', nameHindi: 'कटनी', slug: 'katni' },
  { name: 'Singrauli', nameHindi: 'सिंगरौली', slug: 'singrauli' },
  { name: 'Burhanpur', nameHindi: 'बुरहानपुर', slug: 'burhanpur' },
  { name: 'Khandwa', nameHindi: 'खंडवा', slug: 'khandwa' },
  { name: 'Khargone', nameHindi: 'खरगोन', slug: 'khargone' },
  { name: 'Bhind', nameHindi: 'भिंड', slug: 'bhind' },
  { name: 'Morena', nameHindi: 'मुरैना', slug: 'morena' },
  { name: 'Shivpuri', nameHindi: 'शिवपुरी', slug: 'shivpuri' },
  { name: 'Guna', nameHindi: 'गुना', slug: 'guna' },
  { name: 'Vidisha', nameHindi: 'विदिशा', slug: 'vidisha' },
  { name: 'Sehore', nameHindi: 'सीहोर', slug: 'sehore' },
  { name: 'Hoshangabad (Narmadapuram)', nameHindi: 'नर्मदापुरम (होशंगाबाद)', slug: 'narmadapuram' },
  { name: 'Betul', nameHindi: 'बैतूल', slug: 'betul' },
  { name: 'Harda', nameHindi: 'हरदा', slug: 'harda' },
  { name: 'Raisen', nameHindi: 'रायसेन', slug: 'raisen' },
  { name: 'Rajgarh', nameHindi: 'राजगढ़', slug: 'rajgarh' },
  { name: 'Shajapur', nameHindi: 'शाजापुर', slug: 'shajapur' },
  { name: 'Agar Malwa', nameHindi: 'आगर मालवा', slug: 'agar-malwa' },
  { name: 'Mandsaur', nameHindi: 'मंदसौर', slug: 'mandsaur' },
  { name: 'Neemuch', nameHindi: 'नीमच', slug: 'neemuch' },
  { name: 'Dhar', nameHindi: 'धार', slug: 'dhar' },
  { name: 'Barwani', nameHindi: 'बड़वानी', slug: 'barwani' },
  { name: 'Alirajpur', nameHindi: 'अलीराजपुर', slug: 'alirajpur' },
  { name: 'Jhabua', nameHindi: 'झाबुआ', slug: 'jhabua' },
  { name: 'Damoh', nameHindi: 'दमोह', slug: 'damoh' },
  { name: 'Panna', nameHindi: 'पन्ना', slug: 'panna' },
  { name: 'Chhatarpur', nameHindi: 'छतरपुर', slug: 'chhatarpur' },
  { name: 'Tikamgarh', nameHindi: 'टीकमगढ़', slug: 'tikamgarh' },
  { name: 'Niwari', nameHindi: 'निवाड़ी', slug: 'niwari' },
  { name: 'Sheopur', nameHindi: 'श्योपुर', slug: 'sheopur' },
  { name: 'Ashoknagar', nameHindi: 'अशोकनगर', slug: 'ashoknagar' },
  { name: 'Datia', nameHindi: 'दतिया', slug: 'datia' },
  { name: 'Sidhi', nameHindi: 'सीधी', slug: 'sidhi' },
  { name: 'Shahdol', nameHindi: 'शहडोल', slug: 'shahdol' },
  { name: 'Anuppur', nameHindi: 'अनूपपुर', slug: 'anuppur' },
  { name: 'Umaria', nameHindi: 'उमरिया', slug: 'umaria' },
  { name: 'Dindori', nameHindi: 'डिंडोरी', slug: 'dindori' },
  { name: 'Mandla', nameHindi: 'मंडला', slug: 'mandla' },
  { name: 'Balaghat', nameHindi: 'बालाघाट', slug: 'balaghat' },
  { name: 'Seoni', nameHindi: 'सिवनी', slug: 'seoni' },
  { name: 'Narsinghpur', nameHindi: 'नरसिंहपुर', slug: 'narsinghpur' },
  { name: 'Mauganj', nameHindi: 'मऊगंज', slug: 'mauganj' },
  { name: 'Maihar', nameHindi: 'मैहर', slug: 'maihar' },
  { name: 'Pandhurna', nameHindi: 'पांढुर्णा', slug: 'pandhurna' }
];

// 12 Core Categories for Regional CG & MP
const categories = [
  { name: 'राजनीति', nameEn: 'Politics', slug: 'rajniti', icon: '🏛️', color: '#dc2626' },
  { name: 'अपराध व कानून', nameEn: 'Crime & Law', slug: 'apradh', icon: '🚔', color: '#ea580c' },
  { name: 'कृषि व मंडी भाव', nameEn: 'Agriculture & Mandi', slug: 'krishi', icon: '🌾', color: '#16a34a' },
  { name: 'विकास कार्य', nameEn: 'Development', slug: 'vikas', icon: '🏗️', color: '#2563eb' },
  { name: 'शिक्षा व रोजगार', nameEn: 'Education & Jobs', slug: 'shiksha', icon: '📚', color: '#9333ea' },
  { name: 'न्यायालय व फैसले', nameEn: 'High Court & Legal', slug: 'nyayalay', icon: '⚖️', color: '#0284c7' },
  { name: 'स्वास्थ्य व सेवाएं', nameEn: 'Health & Medical', slug: 'swasthya', icon: '🏥', color: '#059669' },
  { name: 'खेल जगत', nameEn: 'Sports', slug: 'khel', icon: '⚽', color: '#e11d48' },
  { name: 'मौसम व पर्यावरण', nameEn: 'Weather & Environment', slug: 'mausam', icon: '🌦️', color: '#d97706' },
  { name: 'व्यापार व उद्योग', nameEn: 'Business & Trade', slug: 'vyapar', icon: '💼', color: '#4b5563' },
  { name: 'संस्कृति व मेले', nameEn: 'Culture & Fairs', slug: 'sanskriti', icon: '🎭', color: '#ec4899' },
  { name: 'विशेष संपादकीय', nameEn: 'Editorial & Opinion', slug: 'editorial', icon: '✍️', color: '#b91c1c' },
];

export const seedDatabase = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ambition_news';
    await mongoose.connect(connStr);
    console.log('🌱 [Seed] Connected to MongoDB...');

    // 1. Seed States
    console.log('🏛️ Seeding States (CG & MP)...');
    const cgState = await State.findOneAndUpdate(
      { slug: 'chhattisgarh' },
      { name: 'Chhattisgarh', nameHindi: 'छत्तीसगढ़', slug: 'chhattisgarh' },
      { upsert: true, new: true }
    );

    const mpState = await State.findOneAndUpdate(
      { slug: 'madhya-pradesh' },
      { name: 'Madhya Pradesh', nameHindi: 'मध्यप्रदेश', slug: 'madhya-pradesh' },
      { upsert: true, new: true }
    );

    // 2. Seed CG Districts
    console.log(`📍 Seeding ${cgDistricts.length} CG Districts...`);
    for (const d of cgDistricts) {
      await District.findOneAndUpdate(
        { slug: d.slug },
        { ...d, stateId: cgState._id },
        { upsert: true }
      );
    }

    // 3. Seed MP Districts
    console.log(`📍 Seeding ${mpDistricts.length} MP Districts...`);
    for (const d of mpDistricts) {
      await District.findOneAndUpdate(
        { slug: d.slug },
        { ...d, stateId: mpState._id },
        { upsert: true }
      );
    }

    // 4. Seed Categories
    console.log(`🏷️ Seeding ${categories.length} Categories...`);
    for (const c of categories) {
      await Category.findOneAndUpdate(
        { slug: c.slug },
        c,
        { upsert: true }
      );
    }

    // 5. Seed Super Admin User
    console.log('👑 Seeding Super Admin User...');
    const adminUser = await User.findOneAndUpdate(
      { phone: '9999999999' },
      {
        phone: '9999999999',
        name: 'Chief Editor Admin',
        nameHindi: 'मुख्य संपादक डेस्क',
        role: 'ADMIN',
        isActive: true
      },
      { upsert: true, new: true }
    );

    // 6. Seed Real Initial Articles into Atlas
    console.log('📰 Seeding Real Articles...');
    const kawardhaDistrict = await District.findOne({ slug: 'kabirdham' }) || await District.findOne({ nameHindi: /कवर्धा/ });
    const raipurDistrict = await District.findOne({ slug: 'raipur' });
    const bastarDistrict = await District.findOne({ slug: 'bastar' });
    const bhopalDistrict = await District.findOne({ slug: 'bhopal' });
    const indoreDistrict = await District.findOne({ slug: 'indore' });
    const politicsCategory = await Category.findOne({ slug: 'politics' }) || categories[0];
    const devCategory = await Category.findOne({ slug: 'development' }) || categories[1];
    const agriCategory = await Category.findOne({ slug: 'agriculture' }) || categories[2];

    const initialArticles = [
      {
        title: 'कवर्धा चिल्फी घाटी सड़क चौड़ीकरण को केंद्र से मिली मंजूरी: सुगम होगा रायपुर-जबलपुर नेशनल हाईवे सफर',
        slug: 'kawardha-chilphi-ghati-highway-widening-approval',
        excerpt: 'मैकल पर्वत श्रृंखला के बीच स्थित चिल्फी घाटी में बार-बार लगने वाले जाम से मिलेगी मुक्ति। ₹450 करोड़ की लागत से 4-लेन टनल और एलिवेटेड कॉरिडोर का निर्माण जल्द शुरू होगा...',
        content: 'कबीरधाम (कवर्धा) जिले की जीवनरेखा मानी जाने वाली चिल्फी घाटी सड़क परियोजना को केंद्र सरकार से अंतिम स्वीकृति मिल गई है। इस महत्वाकांक्षी परियोजना से छत्तीसगढ़ और मध्य प्रदेश के बीच भारी वाहनों का आवागमन सुगम और सुरक्षित होगा। स्थानीय व्यापारियों और पर्यटकों ने इस निर्णय का स्वागत किया है।',
        coverImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1000&auto=format&fit=crop&q=80',
        stateId: cgState._id,
        districtId: kawardhaDistrict?._id || raipurDistrict?._id,
        categoryId: devCategory._id,
        authorId: adminUser._id,
        tags: ['कवर्धा', 'चिल्फी घाटी', 'विकास', 'हाईवे'],
        status: 'PUBLISHED',
        isBreaking: true,
        isFeatured: true,
        views: 1420,
        publishedAt: new Date(Date.now() - 15 * 60 * 1000)
      },
      {
        title: 'किसानों के खाते में धान बोनस की अगली किश्त जल्द: मुख्यमंत्री ने मंत्रालय में समीक्षा बैठक कर दिए कड़े निर्देश',
        slug: 'dhan-bonus-next-installment-cm-review',
        excerpt: 'मंत्रालय महानदी भवन में आयोजित उच्चस्तरीय बैठक में कृषि विभाग को निर्देश दिए गए कि भुगतान प्रक्रिया में कोई बाधा न आए। सभी जिला कलेक्टरों को निगरानी के आदेश...',
        content: 'मंत्रालय महानदी भवन में आयोजित समीक्षा बैठक में मुख्यमंत्री ने कृषि एवं सहकारिता विभाग के अधिकारियों को स्पष्ट निर्देश दिए हैं कि किसानों को धान की अंतर राशि का भुगतान तय समय सीमा में सीधे बैंक खातों में सुनिश्चित किया जाए।',
        coverImage: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1000&auto=format&fit=crop&q=80',
        stateId: cgState._id,
        districtId: raipurDistrict?._id || cgState._id,
        categoryId: politicsCategory._id,
        authorId: adminUser._id,
        tags: ['धान बोनस', 'किसान', 'रायपुर'],
        status: 'PUBLISHED',
        isBreaking: true,
        isFeatured: false,
        views: 1890,
        publishedAt: new Date(Date.now() - 45 * 60 * 1000)
      },
      {
        title: 'भोरमदेव सहकारी शक्कर कारखाने में पेराई सत्र की तैयारियां तेज: कवर्धा के गन्ना उत्पादक किसानों में भारी उत्साह',
        slug: 'bhoramdeo-sugar-factory-crushing-season-kawardha',
        excerpt: 'जिले के प्रमुख भोरमदेव चीनी मिल में बॉयलरों की मरम्मत और टेस्टिंग का कार्य अंतिम चरण में। आगामी सप्ताह से गन्ना तुलाई शुरू होने के आसार...',
        content: 'कबीरधाम जिले के हजारों गन्ना किसानों के लिए राहत भरी खबर है। भोरमदेव सहकारी शक्कर कारखाने में आगामी पेराई सत्र हेतु सभी तकनीकी तैयारियां पूरी कर ली गई हैं। प्रबंधन के अनुसार इस वर्ष रिकॉर्ड 4 लाख मीट्रिक टन गन्ने की पेराई का लक्ष्य निर्धारित किया गया है।',
        coverImage: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1000&auto=format&fit=crop&q=80',
        stateId: cgState._id,
        districtId: kawardhaDistrict?._id || raipurDistrict?._id,
        categoryId: agriCategory._id,
        authorId: adminUser._id,
        tags: ['कवर्धा', 'भोरमदेव', 'गन्ना किसान', 'मंडी'],
        status: 'PUBLISHED',
        isBreaking: false,
        isFeatured: true,
        views: 950,
        publishedAt: new Date(Date.now() - 90 * 60 * 1000)
      },
      {
        title: 'भोपाल मेट्रो विस्तार परियोजना: 5 नए स्टेशनों का कार्य अंतिम चरण में, अगले माह शुरू हो सकता है ट्रायल रन',
        slug: 'bhopal-metro-expansion-new-stations',
        excerpt: 'राजधानी के मुख्य मार्गों पर यातायात को सुगम बनाने के लिए प्रशासन ने नया रूट चार्ट जारी किया। आगामी माह में ट्रायल रन शुरू होने की पूरी संभावना...',
        content: 'मध्य प्रदेश की राजधानी भोपाल में मेट्रो रेल परियोजना के पहले चरण का कार्य तेजी से पूरा किया जा रहा है। सुभाष नगर से एम्स तक के रूट पर सिग्नलिंग और सेफ्टी ऑडिट की प्रक्रिया जारी है।',
        coverImage: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1000&auto=format&fit=crop&q=80',
        stateId: mpState._id,
        districtId: bhopalDistrict?._id || mpState._id,
        categoryId: devCategory._id,
        authorId: adminUser._id,
        tags: ['भोपाल', 'मेट्रो', 'मध्य प्रदेश'],
        status: 'PUBLISHED',
        isBreaking: true,
        isFeatured: false,
        views: 1120,
        publishedAt: new Date(Date.now() - 120 * 60 * 1000)
      },
      {
        title: 'एशिया की सबसे बड़ी कृषि मंडी में सोयाबीन व गेहूं की बंपर आवक, डिजिटल पर्ची से तुरंत भुगतान',
        slug: 'indore-mandi-soybean-wheat-record-arrival',
        excerpt: 'इंदौर कृषि उपज मंडी में आज बंपर आवक दर्ज की गई। व्यापारियों ने ऑनलाइन पेमेंट से सीधे किसानों के खातों में राशि ट्रांसफर की...',
        content: 'इंदौर कृषि मंडी में नए सीजन की फसलों की जबरदस्त आवक देखी जा रही है। मंडी प्रशासन द्वारा शुरू की गई डिजिटल तौल और आरटीजीएस भुगतान प्रणाली से किसानों को घंटों लाइन में खड़े रहने से मुक्ति मिली है।',
        coverImage: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=1000&auto=format&fit=crop&q=80',
        stateId: mpState._id,
        districtId: indoreDistrict?._id || mpState._id,
        categoryId: agriCategory._id,
        authorId: adminUser._id,
        tags: ['इंदौर', 'मंडी', 'कृषि'],
        status: 'PUBLISHED',
        isBreaking: false,
        isFeatured: false,
        views: 840,
        publishedAt: new Date(Date.now() - 180 * 60 * 1000)
      }
    ];

    for (const art of initialArticles) {
      await Article.findOneAndUpdate(
        { slug: art.slug },
        art,
        { upsert: true }
      );
    }

    // 7. Seed Real Initial Videos into Atlas
    console.log('📺 Seeding Videos...');
    const initialVideos = [
      {
        title: 'Ambition News Special: कवर्धा शहर के प्रमुख मुद्दों पर नागरिकों और जनप्रतिनिधियों की सीधी बहस',
        youtubeId: 'b_oYfF8jO4M',
        thumbnail: 'https://img.youtube.com/vi/b_oYfF8jO4M/hqdefault.jpg',
        duration: '14:28',
        views: '8.4K',
        timeAgo: '2 घंटे पहले',
        category: 'कवर्धा स्पेशल',
        youtubeUrl: 'https://www.youtube.com/watch?v=b_oYfF8jO4M',
        isShort: false
      },
      {
        title: 'छत्तीसगढ़ आज शाम का महाबुलेटिन: धान खरीदी, कैबिनेट बैठक और बस्तर से ग्राउंड रिपोर्ट',
        youtubeId: 'L_LUpnjgPso',
        thumbnail: 'https://img.youtube.com/vi/L_LUpnjgPso/hqdefault.jpg',
        duration: '18:50',
        views: '12.1K',
        timeAgo: '5 घंटे पहले',
        category: 'राज्य बुलेटिन',
        youtubeUrl: 'https://www.youtube.com/watch?v=L_LUpnjgPso',
        isShort: false
      }
    ];

    for (const vid of initialVideos) {
      await Video.findOneAndUpdate(
        { youtubeId: vid.youtubeId },
        vid,
        { upsert: true }
      );
    }

    // 8. Seed Real Initial Reels into Atlas
    console.log('📱 Seeding Reels...');
    const initialReels = [
      {
        caption: 'कवर्धा चिल्फी घाटी का विहंगम दृश्य... मैकल की वादियों में कोहरे की चादर 📸 @ambition_news #Kawardha #ChilphiGhati',
        imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
        youtubeId: 'kJQP7kiw5Fk',
        embedUrl: 'https://www.youtube-nocookie.com/embed/kJQP7kiw5Fk?autoplay=1&loop=1&playlist=kJQP7kiw5Fk&rel=0',
        postUrl: 'https://www.youtube.com/shorts/kJQP7kiw5Fk',
        likes: '1.4K',
        commentsCount: '184',
        sharesCount: '92',
        district: 'कवर्धा',
        timeAgo: '3 घंटे पहले',
        audioTrack: 'Ambition News • चिल्फी घाटी मॉर्निंग स्पेशल'
      },
      {
        caption: 'छत्तीसगढ़ का खजुराहो — 1000 वर्ष प्राचीन ऐतिहासिक भोरमदेव मंदिर की दिव्य संध्या आरती 🙏🚩 #Kawardha #Bhoramdeo',
        imageUrl: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?w=800&auto=format&fit=crop&q=80',
        postUrl: 'https://www.instagram.com/ambition_news/',
        likes: '2.1K',
        commentsCount: '230',
        sharesCount: '140',
        district: 'कवर्धा',
        timeAgo: '5 घंटे पहले',
        audioTrack: 'Ambition News Original'
      }
    ];

    for (const r of initialReels) {
      await Reel.findOneAndUpdate(
        { caption: r.caption },
        r,
        { upsert: true }
      );
    }

    console.log('✅ [Seed Completed] 2 States, 88+ Districts, Categories, Articles, Videos, and Reels ready in MongoDB Atlas!');
    process.exit(0);
  } catch (error) {
    console.error('❌ [Seed Error]:', error);
    process.exit(1);
  }
};

seedDatabase();

