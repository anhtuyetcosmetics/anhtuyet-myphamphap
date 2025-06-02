import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = {
  'pwa-192x192.png': 192,
  'pwa-512x512.png': 512,
  'apple-touch-icon.png': 180
};

async function generateIcons() {
  const svgBuffer = fs.readFileSync(path.join(__dirname, '../public/masked-icon.svg'));
  
  for (const [filename, size] of Object.entries(sizes)) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(__dirname, '../public', filename));
    
    console.log(`Generated ${filename}`);
  }
}

generateIcons().catch(console.error); 