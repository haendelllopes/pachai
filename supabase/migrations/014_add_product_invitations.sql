-- Product invitations table for sharing products via email
CREATE TABLE product_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
  token UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

-- Indexes for performance
CREATE UNIQUE INDEX idx_product_invitations_token ON product_invitations(token);
CREATE INDEX idx_product_invitations_product_id ON product_invitations(product_id);
CREATE INDEX idx_product_invitations_email ON product_invitations(email);
CREATE INDEX idx_product_invitations_status ON product_invitations(status);
CREATE INDEX idx_product_invitations_expires_at ON product_invitations(expires_at);

-- Row Level Security (RLS)
ALTER TABLE product_invitations ENABLE ROW LEVEL SECURITY;

-- SELECT: Owner e Editor do produto podem ver convites
CREATE POLICY "Owners and editors can view invitations"
  ON product_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM product_members pm
      WHERE pm.product_id = product_invitations.product_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'editor')
    )
    OR EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_invitations.product_id
      AND products.user_id = auth.uid()
    )
  );

-- INSERT: Owner e Editor podem criar convites
CREATE POLICY "Owners and editors can create invitations"
  ON product_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM product_members pm
      WHERE pm.product_id = product_invitations.product_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'editor')
    )
    OR EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_invitations.product_id
      AND products.user_id = auth.uid()
    )
  );

-- UPDATE: Apenas Owner pode atualizar convites (sistema também pode marcar como accepted)
-- Permitir que o sistema atualize status para 'accepted' ou 'expired'
CREATE POLICY "Owners can update invitations"
  ON product_invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM product_members pm
      WHERE pm.product_id = product_invitations.product_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'owner'
    )
    OR EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_invitations.product_id
      AND products.user_id = auth.uid()
    )
    -- Permitir atualização pelo sistema (via service_role) para marcar como accepted/expired
    OR (status = 'pending' AND NEW.status IN ('accepted', 'expired'))
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM product_members pm
      WHERE pm.product_id = product_invitations.product_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'owner'
    )
    OR EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_invitations.product_id
      AND products.user_id = auth.uid()
    )
    -- Permitir atualização pelo sistema
    OR (status = 'pending' AND NEW.status IN ('accepted', 'expired'))
  );

-- DELETE: PROIBIDO (convites não são deletados, apenas expiram)
-- Não criamos política de DELETE, então nenhuma deleção será permitida via RLS

-- Function to mark expired invitations
CREATE OR REPLACE FUNCTION mark_expired_invitations()
RETURNS void AS $$
BEGIN
  UPDATE product_invitations
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and mark expired invitations (can be called on validation)
CREATE OR REPLACE FUNCTION check_invitation_expiry(invitation_token UUID)
RETURNS BOOLEAN AS $$
DECLARE
  invitation_record product_invitations%ROWTYPE;
BEGIN
  SELECT * INTO invitation_record
  FROM product_invitations
  WHERE token = invitation_token;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Mark as expired if past expiration date
  IF invitation_record.expires_at < NOW() AND invitation_record.status = 'pending' THEN
    UPDATE product_invitations
    SET status = 'expired'
    WHERE token = invitation_token;
    RETURN FALSE;
  END IF;
  
  RETURN invitation_record.status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
