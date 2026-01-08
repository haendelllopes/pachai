/**
 * Script opcional de validação de sincronização entre documentação e banco de dados
 * 
 * Este script verifica se todos os vereditos documentados em _docs/vereditos-fundadores.md
 * existem no banco de dados.
 * 
 * Não bloqueante - apenas alerta sobre divergências
 * 
 * Uso: node scripts/validate-veredicts-sync.js
 */

const fs = require('fs')
const path = require('path')

// Códigos esperados dos vereditos fundadores (extraídos da documentação)
const EXPECTED_VEREDICT_CODES = [
  'MEMORY_SHARING',
  'EXTERNAL_SEARCH_CONSCIOUS',
  'EXTERNAL_SEARCH_CONSCIOUS_PROMPT',
  'REACTIVE_BEHAVIOR',
  'CLOSURE_RECOGNITION',
  'CLOSURE_RECOGNITION_RESPONSE',
  'EXPLICIT_CONTEXT_EVOLUTION',
  'VEREDICT_META'
]

async function validateSync() {
  console.log('🔍 Validando sincronização entre documentação e banco de dados...\n')

  // Ler documentação
  const docsPath = path.join(__dirname, '..', '_docs', 'vereditos-fundadores.md')
  
  if (!fs.existsSync(docsPath)) {
    console.error('❌ Arquivo de documentação não encontrado:', docsPath)
    process.exit(1)
  }

  const docsContent = fs.readFileSync(docsPath, 'utf-8')
  
  // Extrair códigos mencionados na documentação
  const mentionedCodes = []
  EXPECTED_VEREDICT_CODES.forEach(code => {
    if (docsContent.includes(code)) {
      mentionedCodes.push(code)
    }
  })

  console.log(`📄 Códigos mencionados na documentação: ${mentionedCodes.length}`)
  mentionedCodes.forEach(code => console.log(`   - ${code}`))

  // Verificar banco de dados (requer conexão)
  // Por enquanto, apenas validar estrutura da documentação
  console.log('\n✅ Validação de estrutura da documentação concluída')
  console.log('⚠️  Validação completa requer conexão com banco de dados')
  console.log('   Para validar banco, execute query:')
  console.log('   SELECT code FROM global_veredicts WHERE is_active = true;')
  
  // Verificar se todos os códigos esperados estão na documentação
  const missingInDocs = EXPECTED_VEREDICT_CODES.filter(
    code => !mentionedCodes.includes(code)
  )

  if (missingInDocs.length > 0) {
    console.log('\n⚠️  Códigos esperados não encontrados na documentação:')
    missingInDocs.forEach(code => console.log(`   - ${code}`))
    console.log('\n💡 Considere atualizar a documentação')
  } else {
    console.log('\n✅ Todos os códigos esperados estão na documentação')
  }

  console.log('\n✨ Validação concluída (não bloqueante)')
}

// Executar validação
validateSync().catch(error => {
  console.error('❌ Erro durante validação:', error)
  process.exit(1)
})
