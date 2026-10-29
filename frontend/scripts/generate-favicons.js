/**
 * Generates all multi-size Favicons & Touch Icons compliant with Google Search Favicon Guidelines:
 * - favicon.ico (16x16, 32x32, 48x48)
 * - favicon-48x48.png (Google Search exact 48px square requirement)
 * - favicon-96x96.png (High-DPI search result icon)
 * - favicon-32x32.png
 * - favicon-16x16.png
 * - apple-touch-icon.png (180x180)
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateFavicons() {
  const publicDir = path.resolve(__dirname, '../public');
  const src = path.join(publicDir, 'logo.png');

  if (!fs.existsSync(src)) {
    console.error('Source logo not found at:', src);
    process.exit(1);
  }

  console.log('Generating Google Search compliant favicons from:', src);

  const img48 = await sharp(src).resize(48, 48).png().toBuffer();
  const img32 = await sharp(src).resize(32, 32).png().toBuffer();
  const img16 = await sharp(src).resize(16, 16).png().toBuffer();
  const img96 = await sharp(src).resize(96, 96).png().toBuffer();
  const img180 = await sharp(src).resize(180, 180).png().toBuffer();

  fs.writeFileSync(path.join(publicDir, 'favicon-48x48.png'), img48);
  fs.writeFileSync(path.join(publicDir, 'favicon-96x96.png'), img96);
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), img32);
  fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), img16);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), img180);

  // Build standard multi-resolution ICO file wrapping 48x48, 32x32, 16x16 PNGs
  const images = [
    { size: 48, buffer: img48 },
    { size: 32, buffer: img32 },
    { size: 16, buffer: img16 }
  ];

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // ICO Type 1
  header.writeUInt16LE(images.length, 4); // Count of images

  let offset = 6 + images.length * 16;
  const entries = [];
  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.size, 0); // Width
    entry.writeUInt8(img.size, 1); // Height
    entry.writeUInt8(0, 2); // Colors (0 = >= 8bpp)
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // Size of image data
    entry.writeUInt32LE(offset, 12); // Offset from start of file
    entries.push(entry);
    offset += img.buffer.length;
  }

  const icoBuffer = Buffer.concat([header, ...entries, ...images.map(i => i.buffer)]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);

  console.log('✅ Favicon generation complete:');
  console.log(' - favicon.ico:', icoBuffer.length, 'bytes');
  console.log(' - favicon-48x48.png:', img48.length, 'bytes');
  console.log(' - favicon-96x96.png:', img96.length, 'bytes');
}

generateFavicons().catch(err => {
  console.error('Favicon generation failed:', err);
  process.exit(1);
});
