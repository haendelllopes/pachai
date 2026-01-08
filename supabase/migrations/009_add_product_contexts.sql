-- Enable vector extension for embeddings (optional, for future semantic search)
-- Note: This extension may not be available in all Supabase instances
-- If it fails, the embedding column will be created as TEXT instead
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION
  WHEN OTHERS THEN
    -- Extension not available, continue without it
    NULL;
END $$;

-- Product contexts table
CREATE TABLE product_contexts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  content_text TEXT NOT NULL,
  embedding TEXT, -- Opcional, para futuras buscas semânticas (armazenado como JSON se vector não disponível)
  change_reason TEXT NOT NULL, -- Motivo da criação/atualização (obrigatório)
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE UNIQUE INDEX idx_product_contexts_product_id ON product_contexts(product_id);
CREATE INDEX idx_product_contexts_updated_at ON product_contexts(updated_at);

-- Row Level Security (RLS)
ALTER TABLE product_contexts ENABLE ROW LEVEL SECURITY;

-- SELECT: Qualquer usuário com acesso ao produto (owner, editor, viewer)
-- Compatibilidade: também permite owner original via products.user_id
CREATE POLICY "Users with product access can view context"
  ON product_contexts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM product_members
      WHERE product_members.product_id = product_contexts.product_id
      AND product_members.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_contexts.product_id
      AND products.user_id = auth.uid() -- Owner original (compatibilidade)
    )
  );

-- INSERT: Apenas owner ou editor
CREATE POLICY "Owners and editors can create context"
  ON product_contexts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM product_members
      WHERE product_members.product_id = product_contexts.product_id
      AND product_members.user_id = auth.uid()
      AND product_members.role IN ('owner', 'editor')
    )
    OR EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_contexts.product_id
      AND products.user_id = auth.uid()
    )
  );

-- UPDATE: Apenas owner ou editor
CREATE POLICY "Owners and editors can update context"
  ON product_contexts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM product_members
      WHERE product_members.product_id = product_contexts.product_id
      AND product_members.user_id = auth.uid()
      AND product_members.role IN ('owner', 'editor')
    )
    OR EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_contexts.product_id
      AND products.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM product_members
      WHERE product_members.product_id = product_contexts.product_id
      AND product_members.user_id = auth.uid()
      AND product_members.role IN ('owner', 'editor')
    )
    OR EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_contexts.product_id
      AND products.user_id = auth.uid()
    )
  );

-- DELETE: Não permitido (ou apenas owner, se necessário no futuro)
-- Por enquanto, não criamos política de DELETE para evitar exclusões acidentais
