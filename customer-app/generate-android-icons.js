/**
 * Script to generate Android launcher icons from a source image
 * 
 * Usage:
 * 1. Place your icon image (PNG, JPG, or SVG) in customer-app/android/icon-source.png
 * 2. Run: node generate-android-icons.js
 * 
 * This will generate all required icon sizes for Android.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Android icon size requirements (in pixels)
const iconSizes = {
  'mipmap-mdpi': { launcher: 48, foreground: 108 },
  'mipmap-hdpi': { launcher: 72, foreground: 162 },
  'mipmap-xhdpi': { launcher: 96, foreground: 216 },
  'mipmap-xxhdpi': { launcher: 144, foreground: 324 },
  'mipmap-xxxhdpi': { launcher: 192, foreground: 432 }
};

// Try multiple possible source icon locations
const possibleSources = [
  path.join(__dirname, 'android', 'icon-source.png'),
  path.join(__dirname, 'android', 'icon-source.jpg'),
  path.join(__dirname, 'android', 'icon-source.jpeg'),
  path.join(__dirname, 'src', 'assets', 'dailynk-logo.svg'),
  path.join(__dirname, 'src', 'assets', 'dreamsync-logo.svg')
];

const resPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');

console.log('Android Icon Generator');
console.log('======================\n');

// Find source icon
let sourceIconPath = null;
for (const possiblePath of possibleSources) {
  if (fs.existsSync(possiblePath)) {
    sourceIconPath = possiblePath;
    break;
  }
}

// Check if source icon exists
if (!sourceIconPath) {
  console.error('❌ Source icon not found!');
  console.error(`   Please place your icon image at one of these locations:`);
  possibleSources.forEach(p => console.error(`   - ${p}`));
  console.error('\n   Supported formats: PNG, JPG, JPEG, SVG');
  console.error('   Recommended: 1024x1024 PNG with transparent background');
  process.exit(1);
}

console.log('✅ Source icon found:', sourceIconPath);
console.log('\n📱 Generating Android icons...\n');

// Check if sharp is available (for image processing)
let sharp;
try {
  sharp = (await import('sharp')).default;
  console.log('✅ Using sharp for image processing\n');
} catch (e) {
  console.error('❌ Sharp library not found!');
  console.error('\n   Please install sharp:');
  console.error('   npm install --save-dev sharp\n');
  console.error('   Or use Android Asset Studio:');
  console.error('   https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html');
  process.exit(1);
}

try {
  // Read source image
  const sourceImage = sharp(sourceIconPath);
  const metadata = await sourceImage.metadata();
  
  console.log(`   Source image: ${metadata.width}x${metadata.height}px\n`);

  // Generate icons for each density
  for (const [folder, sizes] of Object.entries(iconSizes)) {
    const folderPath = path.join(resPath, folder);
    
    // Ensure folder exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // Generate launcher icon (square)
    const launcherPath = path.join(folderPath, 'ic_launcher.png');
    await sourceImage
      .clone()
      .resize(sizes.launcher, sizes.launcher, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFile(launcherPath);
    console.log(`   ✅ ${folder}/ic_launcher.png (${sizes.launcher}x${sizes.launcher})`);

    // Generate round launcher icon
    const roundPath = path.join(folderPath, 'ic_launcher_round.png');
    await sourceImage
      .clone()
      .resize(sizes.launcher, sizes.launcher, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFile(roundPath);
    console.log(`   ✅ ${folder}/ic_launcher_round.png (${sizes.launcher}x${sizes.launcher})`);

    // Generate foreground icon for adaptive icons (larger, will be cropped by Android)
    const foregroundPath = path.join(folderPath, 'ic_launcher_foreground.png');
    await sourceImage
      .clone()
      .resize(sizes.foreground, sizes.foreground, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFile(foregroundPath);
    console.log(`   ✅ ${folder}/ic_launcher_foreground.png (${sizes.foreground}x${sizes.foreground})`);
  }

  console.log('\n✅ All Android icons generated successfully!');
  console.log('\n📝 Next steps:');
  console.log('   1. Rebuild your Android app');
  console.log('   2. Test the icon on different devices');
  console.log('   3. If needed, adjust the background color in:');
  console.log('      android/app/src/main/res/values/ic_launcher_background.xml\n');

} catch (error) {
  console.error('\n❌ Error generating icons:', error.message);
  process.exit(1);
}
