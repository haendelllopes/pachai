-- Create ENUM type for audit phase (same as enforcement_scope)
CREATE TYPE audit_phase AS ENUM ('pre_state', 'pre_prompt', 'pre_context', 'post_response');

-- Create veredict_audit table for logging violations
CREATE TABLE veredict_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  veredict_code TEXT NOT NULL REFERENCES global_veredicts(code) ON DELETE CASCADE,
  phase audit_phase NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  details JSONB,
  was_blocked BOOLEAN NOT NULL DEFAULT false
);

-- Indexes for performance
CREATE INDEX idx_veredict_audit_veredict_code ON veredict_audit(veredict_code);
CREATE INDEX idx_veredict_audit_phase ON veredict_audit(phase);
CREATE INDEX idx_veredict_audit_detected_at ON veredict_audit(detected_at);
CREATE INDEX idx_veredict_audit_conversation_id ON veredict_audit(conversation_id);

-- Row Level Security (RLS)
ALTER TABLE veredict_audit ENABLE ROW LEVEL SECURITY;

-- INSERT: Apenas aplicação pode inserir (sem leitura via API na Fase 1)
CREATE POLICY "Application can insert audit logs"
  ON veredict_audit FOR INSERT
  WITH CHECK (true);

-- SELECT: Bloqueado na Fase 1 (apenas para aplicação interna)
-- Não criar política SELECT para evitar acesso via API na Fase 1
