// Script to create favicon.png from app-icon.jpeg for better browser compatibility
// Run with: node scripts/create-favicon.js

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const jpegPath = path.join(__dirname, '..', 'public', 'image', 'app-icon.jpeg');
const outputPath = path.join(__dirname, '..', 'public', 'favicon.png');

async function createFavicon() {
  try {
    // Verificar se o arquivo existe
    if (!fs.existsSync(jpegPath)) {
      console.error('❌ Arquivo não encontrado:', jpegPath);
      process.exit(1);
    }

    // Criar favicon.png com tamanho 32x32 (padrão para favicons)
    await sharp(jpegPath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(outputPath);
    
    console.log('✓ Criado favicon.png (32x32)');
    console.log('\n⚠️  Nota: Para favicon.ico completo com múltiplos tamanhos (recomendado para Windows),');
    console.log('   use uma ferramenta online como: https://realfavicongenerator.net/');
    console.log('   ou: https://favicon.io/favicon-converter/');
    console.log('   com o arquivo public/image/app-icon.jpeg como fonte.');
    console.log('\n✅ Favicon PNG criado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar favicon:', error);
    process.exit(1);
  }
}

createFavicon();

