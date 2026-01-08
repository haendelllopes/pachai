-- Product members table for role-based access control
CREATE TABLE product_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  UNIQUE(product_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_product_members_product_id ON product_members(product_id);
CREATE INDEX idx_product_members_user_id ON product_members(user_id);
CREATE INDEX idx_product_members_role ON product_members(role);

-- Row Level Security (RLS)
ALTER TABLE product_members ENABLE ROW LEVEL SECURITY;

-- SELECT: Usuários com acesso ao produto podem ver membros
CREATE POLICY "Users with product access can view members"
  ON product_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM product_members pm
      WHERE pm.product_id = product_members.product_id
      AND pm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_members.product_id
      AND products.user_id = auth.uid()
    )
  );

-- INSERT: Apenas owner pode adicionar membros
CREATE POLICY "Owners can add members"
  ON product_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM product_members pm
      WHERE pm.product_id = product_members.product_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'owner'
    )
    OR EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_members.product_id
      AND products.user_id = auth.uid()
      AND NOT EXISTS (
        SELECT 1 FROM product_members pm2
        WHERE pm2.product_id = product_members.product_id
      )
    )
  );

-- UPDATE: Apenas owner pode alterar papéis
CREATE POLICY "Owners can update member roles"
  ON product_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM product_members pm
      WHERE pm.product_id = product_members.product_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'owner'
    )
    OR EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_members.product_id
      AND products.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM product_members pm
      WHERE pm.product_id = product_members.product_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'owner'
    )
    OR EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_members.product_id
      AND products.user_id = auth.uid()
    )
  );

-- DELETE: Apenas owner pode remover membros (exceto si mesmo se for único owner)
CREATE POLICY "Owners can remove members"
  ON product_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM product_members pm
      WHERE pm.product_id = product_members.product_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'owner'
      -- Não permitir remover o último owner (verificar antes da deleção)
      AND (
        SELECT COUNT(*) FROM product_members pm2
        WHERE pm2.product_id = product_members.product_id
        AND pm2.role = 'owner'
        AND pm2.id != product_members.id
      ) >= 1
    )
    OR EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_members.product_id
      AND products.user_id = auth.uid()
      -- Permitir remover membros se não houver product_members ainda (migração)
      AND NOT EXISTS (
        SELECT 1 FROM product_members pm3
        WHERE pm3.product_id = product_members.product_id
        AND pm3.role = 'owner'
      )
    )
  );

-- Function to automatically create owner member when product is created
-- This will be called from application code, but we create a trigger as backup
CREATE OR REPLACE FUNCTION create_product_owner_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO product_members (product_id, user_id, role, created_by)
  VALUES (NEW.id, NEW.user_id, 'owner', NEW.user_id)
  ON CONFLICT (product_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create owner member (runs after INSERT on products)
CREATE TRIGGER trigger_create_product_owner_member
  AFTER INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION create_product_owner_member();

-- Migrate existing products: create owner members for all existing products
INSERT INTO product_members (product_id, user_id, role, created_by)
SELECT id, user_id, 'owner', user_id
FROM products
WHERE NOT EXISTS (
  SELECT 1 FROM product_members pm
  WHERE pm.product_id = products.id
)
ON CONFLICT (product_id, user_id) DO NOTHING;
