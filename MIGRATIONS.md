# Guia de Migrations do Supabase

## Como Aplicar Migrations

### Método 1: Via MCP do Supabase (Recomendado - Automático)

Se você está usando o Cursor AI, pode aplicar migrations automaticamente:

1. Peça ao Cursor AI: **"Aplicar migrations pendentes usando MCP do Supabase"**
2. O Cursor verificará quais migrations já foram aplicadas
3. Aplicará apenas as pendentes automaticamente

✅ **Status atual:** Todas as migrations foram aplicadas via MCP:
- ✅ `add_conversation_status` (20260106142047)
- ✅ `add_paused_at` (20260106142050)
- ✅ `add_reopened_at` (20260106142053)

### Método 2: Manual via SQL Editor

### Método Rápido (Recomendado)

Execute o comando para ver todas as migrations pendentes:

```bash
npm run migrations
```

Isso mostrará todas as migrations na ordem correta. Copie e cole cada uma no SQL Editor do Supabase.

### Passo a Passo Manual

1. **Acesse o Dashboard do Supabase:**
   - URL: https://aznkixldjikctoruonuo.supabase.co
   - Faça login se necessário

2. **Abra o SQL Editor:**
   - No menu lateral, clique em "SQL Editor"

3. **Aplique cada migration na ordem:**
   - `002_add_conversation_status.sql` - Adiciona campos `status` e `last_activity_at`
   - `003_add_paused_at.sql` - Adiciona campo `paused_at`
   - `004_add_reopened_at.sql` - Adiciona campo `reopened_at`

4. **Execute cada SQL:**
   - Cole o conteúdo da migration
   - Clique em "Run" ou pressione Ctrl+Enter
   - Verifique se não há erros

## Migrations Aplicadas

### ✅ 002_add_conversation_status.sql (Aplicada)
- Adiciona coluna `status` (ACTIVE, PAUSED, CLOSED)
- Adiciona coluna `last_activity_at`
- Cria índices para performance

### ✅ 003_add_paused_at.sql (Aplicada)
- Adiciona coluna `paused_at` (timestamp de quando foi pausada)
- Cria índice para performance

### ✅ 004_add_reopened_at.sql (Aplicada)
- Adiciona coluna `reopened_at` (timestamp de quando foi reaberta)
- Cria índice para performance

## Verificação

Após aplicar todas as migrations, você pode verificar executando no SQL Editor:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'conversations'
ORDER BY ordinal_position;
```

Você deve ver as colunas: `status`, `last_activity_at`, `paused_at`, `reopened_at`.

