// Script to create PNG icons from app-icon.jpeg
// Run with: node scripts/create-icons-from-jpeg.js

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const jpegPath = path.join(__dirname, '..', 'public', 'image', 'app-icon.jpeg');
const outputDir = path.join(__dirname, '..', 'public', 'icons');

async function createIcons() {
  try {
    // Verificar se o arquivo existe
    if (!fs.existsSync(jpegPath)) {
      console.error('❌ Arquivo não encontrado:', jpegPath);
      process.exit(1);
    }

    // Criar diretório se não existir
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Criar ícone 192x192
    await sharp(jpegPath)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(path.join(outputDir, 'icon-192x192.png'));
    
    console.log('✓ Criado icon-192x192.png');
    
    // Criar ícone 512x512
    await sharp(jpegPath)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(path.join(outputDir, 'icon-512x512.png'));
    
    console.log('✓ Criado icon-512x512.png');
    console.log('\n✅ Todos os ícones criados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar ícones:', error);
    process.exit(1);
  }
}

createIcons();

