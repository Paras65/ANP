/**
 * Ambition News Portal - Cryptographic Secret & Hash Generator
 * 
 * Usage:
 *   1. Generate random 32-character master passwords & 32-byte keys:
 *      node scripts/generate-secret.js
 * 
 *   2. Generate SHA-256 hash of a specific password:
 *      node scripts/generate-secret.js "MySecretPassword"
 */
import crypto from 'crypto';

const args = process.argv.slice(2);
const customInput = args[0];

function generatePassword(length = 32) {
  // Safe high-entropy character set (avoiding confusing characters like 0/O, 1/l/I)
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()_+~';
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[bytes[i] % charset.length];
  }
  return result;
}

console.log('\n===============================================================');
console.log(' 🔐 AMBITION NEWS PORTAL - CRYPTOGRAPHIC KEY & HASH GENERATOR');
console.log('===============================================================\n');

if (customInput) {
  // Hash a custom password
  const sha256 = crypto.createHash('sha256').update(customInput).digest('hex');
  const hmac = crypto.createHmac('sha256', 'anp_super_admin_master_salt_2026').update(`super_admin:${customInput}`).digest('hex');

  console.log(`Input String: "${customInput}"`);
  console.log('\n1. Standard 32-Byte (256-bit) SHA-256 Hash (Hex):');
  console.log(`   ${sha256}`);
  console.log('\n2. Salted HMAC-SHA256 Hash (Used in Super Admin DB):');
  console.log(`   ${hmac}`);
  console.log('\n===============================================================');
} else {
  // Generate Fresh Cryptographic Keys & Passwords
  const pass1 = generatePassword(32);
  const pass2 = generatePassword(32);
  const jwtSecret = crypto.randomBytes(32).toString('hex'); // 32 bytes (256-bit) -> 64 hex chars
  const hex32 = crypto.randomBytes(16).toString('hex'); // 16 bytes -> 32 hex chars

  console.log('1. [32-Character High-Entropy Passwords] (मास्टर पासवर्ड):');
  console.log(`   A) ${pass1}`);
  console.log(`   B) ${pass2}`);
  console.log('\n2. [32-Hex Character Key] (16 Bytes / 128-bit):');
  console.log(`   ${hex32}`);
  console.log('\n3. [64-Hex Character Key] (32 Bytes / 256-bit) (JWT_SECRET के लिए सर्वोत्तम):');
  console.log(`   ${jwtSecret}`);
  console.log('\n4. [Password Hash Example] (Pass A का SHA-256 हैश):');
  console.log(`   ${crypto.createHash('sha256').update(pass1).digest('hex')}`);
  console.log('\n💡 उपयोग निर्देश:');
  console.log('   - इनमें से कोई एक पासवर्ड अपने सुपर एडमिन लॉगिन के लिए उपयोग करें।');
  console.log('   - 32-byte हेक्स कुंजी को backend/.env में JWT_SECRET= के रूप में सुरक्षित रखें।');
  console.log('   - ध्यान रहे: .env फ़ाइल को कभी भी git में कमिट न करें।');
  console.log('===============================================================\n');
}

