import sharp from 'sharp';
import path from 'path';

const publicDir = path.resolve('frontend/public');
const logoPng = path.join(publicDir, 'logo.png');
const logo512Png = path.join(publicDir, 'logo-512.png');

async function convert() {
  console.log('Generating WebP logos...');
  
  // 1. logo.webp (quality 85)
  await sharp(logoPng)
    .webp({ quality: 85 })
    .toFile(path.join(publicDir, 'logo.webp'));

  // 2. logo-96.webp (for 96x96 / 168x168 Ambition TV and avatar usages)
  await sharp(logoPng)
    .resize(96, 96)
    .webp({ quality: 85 })
    .toFile(path.join(publicDir, 'logo-96.webp'));

  // 3. logo-192.webp
  await sharp(logoPng)
    .resize(192, 192)
    .webp({ quality: 85 })
    .toFile(path.join(publicDir, 'logo-192.webp'));

  // 4. logo-512.webp
  await sharp(logo512Png)
    .resize(512, 512)
    .webp({ quality: 85 })
    .toFile(path.join(publicDir, 'logo-512.webp'));

  console.log('WebP conversion completed successfully!');
}

convert().catch(err => {
  console.error('Error during WebP conversion:', err);
  process.exit(1);
});
