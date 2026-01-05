// Script to create PNG icons from SVG
// Run with: node scripts/create-icons.js

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'public', 'icons', 'icon.svg');
const outputDir = path.join(__dirname, '..', 'public', 'icons');

async function createIcons() {
  try {
    // Read SVG
    const svgBuffer = fs.readFileSync(svgPath);
    
    // Create 192x192 icon
    await sharp(svgBuffer)
      .resize(192, 192)
      .png()
      .toFile(path.join(outputDir, 'icon-192x192.png'));
    
    console.log('✓ Created icon-192x192.png');
    
    // Create 512x512 icon
    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile(path.join(outputDir, 'icon-512x512.png'));
    
    console.log('✓ Created icon-512x512.png');
    console.log('\n✅ All icons created successfully!');
  } catch (error) {
    console.error('Error creating icons:', error);
    process.exit(1);
  }
}

createIcons();
