import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { State } from '../src/models/State.model.js';
import { District } from '../src/models/District.model.js';
import { Category } from '../src/models/Category.model.js';
import { User } from '../src/models/User.model.js';

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
    await User.findOneAndUpdate(
      { phone: '9999999999' },
      {
        phone: '9999999999',
        name: 'Chief Editor Admin',
        nameHindi: 'मुख्य संपादक डेस्क',
        role: 'ADMIN',
        isActive: true
      },
      { upsert: true }
    );

    console.log('✅ [Seed Completed] 2 States, 88+ Districts, 12 Categories, and Super Admin ready!');
    process.exit(0);
  } catch (error) {
    console.error('❌ [Seed Error]:', error);
    process.exit(1);
  }
};

seedDatabase();

