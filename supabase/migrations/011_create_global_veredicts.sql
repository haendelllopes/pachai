-- Create ENUM type for enforcement scope
CREATE TYPE enforcement_scope AS ENUM ('pre_state', 'pre_prompt', 'pre_context', 'post_response');

-- Create global_veredicts table for foundational governance rules
CREATE TABLE global_veredicts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  rule_text TEXT NOT NULL,
  enforcement_scope enforcement_scope NOT NULL,
  priority INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_global_veredicts_code ON global_veredicts(code);
CREATE INDEX idx_global_veredicts_scope ON global_veredicts(enforcement_scope);
CREATE INDEX idx_global_veredicts_priority ON global_veredicts(priority);
CREATE INDEX idx_global_veredicts_active ON global_veredicts(is_active);
CREATE INDEX idx_global_veredicts_scope_active_priority ON global_veredicts(enforcement_scope, is_active, priority);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_global_veredicts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_global_veredicts_updated_at
  BEFORE UPDATE ON global_veredicts
  FOR EACH ROW
  EXECUTE FUNCTION update_global_veredicts_updated_at();

-- Row Level Security (RLS)
ALTER TABLE global_veredicts ENABLE ROW LEVEL SECURITY;

-- SELECT: Apenas leitura para usuários autenticados
CREATE POLICY "Authenticated users can view global veredicts"
  ON global_veredicts FOR SELECT
  USING (auth.role() = 'authenticated');

-- INSERT/UPDATE/DELETE: Bloqueado via RLS (apenas via migrações ou scripts administrativos)
-- Não criar políticas de INSERT/UPDATE/DELETE para garantir que mudanças sejam feitas apenas via migrações
