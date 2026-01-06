/**
 * Script para visualizar e aplicar migrations do Supabase
 * 
 * Uso: npm run migrations
 * 
 * Este script mostra as migrations pendentes e instruções para aplicá-las.
 * As migrations precisam ser aplicadas manualmente via SQL Editor do Supabase.
 */

const fs = require('fs');
const path = require('path');

function showMigration(filePath, fileName, index) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📄 Migration ${index}: ${fileName}`);
  console.log('='.repeat(70));
  
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(sql);
  } catch (err) {
    console.error(`❌ Erro ao ler arquivo: ${err.message}`);
  }
}

function main() {
  console.log('\n🚀 Migrations Pendentes do Supabase\n');
  console.log('As seguintes migrations precisam ser aplicadas manualmente:');
  console.log('\n📋 Instruções:');
  console.log('1. Acesse: https://aznkixldjikctoruonuo.supabase.co');
  console.log('2. Vá em SQL Editor (menu lateral)');
  console.log('3. Execute cada migration na ordem abaixo');
  console.log('4. Verifique se não há erros após cada execução\n');
  
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const migrationFiles = [
    '002_add_conversation_status.sql',
    '003_add_paused_at.sql',
    '004_add_reopened_at.sql'
  ];
  
  migrationFiles.forEach((fileName, index) => {
    const filePath = path.join(migrationsDir, fileName);
    
    if (fs.existsSync(filePath)) {
      showMigration(filePath, fileName, index + 1);
    } else {
      console.log(`\n⚠️  Arquivo não encontrado: ${fileName}`);
    }
  });
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ Após aplicar todas as migrations, o banco estará atualizado!');
  console.log('='.repeat(70) + '\n');
}

main();

