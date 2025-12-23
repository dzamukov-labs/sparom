import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const srcDir = './public/images';
const destDir = './public/images/about';
const originalsDir = './public/images/about/originals';

// Create directories
fs.mkdirSync(destDir, { recursive: true });
fs.mkdirSync(originalsDir, { recursive: true });

// Image mappings: source -> { dest, width, quality }
const images = [
  {
    src: 'founder.JPG',
    destOriginal: 'original-founder.jpg',
    destWebp: 'founder.webp',
    width: 640, // For profile photo
    quality: 85
  },
  {
    src: 'team-ivan.jpeg',
    destOriginal: 'original-team-ivan.jpg',
    destWebp: 'team-ivan.webp',
    width: 300, // For team card
    quality: 85
  },
  {
    src: 'team-tatiana.jpg',
    destOriginal: 'original-team-tatiana.jpg',
    destWebp: 'team-tatiana.webp',
    width: 300,
    quality: 85
  },
  {
    src: 'производство зимой 1.jpeg',
    destOriginal: 'original-production-1.jpg',
    destWebp: 'production-1.webp',
    width: 800,
    quality: 80
  },
  {
    src: 'производство зимой 2.jpeg',
    destOriginal: 'original-production-2.jpg',
    destWebp: 'production-2.webp',
    width: 800,
    quality: 80
  },
  {
    src: 'фото производства осень - на фото директор вместе с бригадами.JPG',
    destOriginal: 'original-production-3.jpg',
    destWebp: 'production-3.webp',
    width: 800,
    quality: 80
  }
];

async function convertImage(config) {
  const srcPath = path.join(srcDir, config.src);
  const originalPath = path.join(originalsDir, config.destOriginal);
  const webpPath = path.join(destDir, config.destWebp);

  if (!fs.existsSync(srcPath)) {
    console.log(`⚠️  Source not found: ${config.src}`);
    return;
  }

  // Copy original
  fs.copyFileSync(srcPath, originalPath);
  console.log(`📁 Saved original: ${config.destOriginal}`);

  // Convert to WebP
  const metadata = await sharp(srcPath).metadata();
  const aspectRatio = metadata.height / metadata.width;
  const newHeight = Math.round(config.width * aspectRatio);

  await sharp(srcPath)
    .resize(config.width, newHeight, { fit: 'cover' })
    .webp({ quality: config.quality })
    .toFile(webpPath);

  const originalSize = fs.statSync(srcPath).size;
  const webpSize = fs.statSync(webpPath).size;
  const savings = ((1 - webpSize / originalSize) * 100).toFixed(1);

  console.log(`✅ Converted: ${config.destWebp} (${config.width}x${newHeight}) - saved ${savings}%`);
}

async function main() {
  console.log('🖼️  Converting images for About page...\n');

  for (const img of images) {
    await convertImage(img);
  }

  // Remove source files from public/images root
  console.log('\n🗑️  Cleaning up source files...');
  for (const img of images) {
    const srcPath = path.join(srcDir, img.src);
    if (fs.existsSync(srcPath)) {
      fs.unlinkSync(srcPath);
      console.log(`   Removed: ${img.src}`);
    }
  }

  console.log('\n✨ Done!');
}

main().catch(console.error);
