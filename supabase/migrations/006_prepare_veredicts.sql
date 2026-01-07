-- Add new optional fields to veredicts table for future use
-- NÃO refatorar ainda - apenas preparar para futuro
-- Manter todos os campos existentes funcionando

-- Create ENUM type for scope
CREATE TYPE veredict_scope AS ENUM ('global', 'project');

-- Add new optional fields (all NULLABLE for compatibility)
ALTER TABLE veredicts
  ADD COLUMN IF NOT EXISTS scope veredict_scope NULL,
  ADD COLUMN IF NOT EXISTS title TEXT NULL,
  ADD COLUMN IF NOT EXISTS content TEXT NULL;

-- Make product_id nullable for global scope (future use)
-- Por enquanto mantemos NOT NULL para compatibilidade
-- ALTER TABLE veredicts ALTER COLUMN product_id DROP NOT NULL; -- Não fazer ainda

-- Add index for scope queries (future use)
CREATE INDEX IF NOT EXISTS idx_veredicts_scope ON veredicts(scope);
CREATE INDEX IF NOT EXISTS idx_veredicts_created_at_desc ON veredicts(created_at DESC);

-- Note: RLS policies já existem e continuam funcionando
-- Novos campos são cobertos pelas políticas existentes

