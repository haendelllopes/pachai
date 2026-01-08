-- Corrigir recursão infinita nas políticas RLS de product_members
-- O problema é que a política SELECT referencia product_members dentro da própria política

-- Criar função helper que bypassa RLS para verificar membership
CREATE OR REPLACE FUNCTION check_product_membership(product_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se é owner do produto
  IF EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_id_param
    AND products.user_id = user_id_param
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Verificar se é membro do produto (usando SECURITY DEFINER para bypass RLS)
  IF EXISTS (
    SELECT 1 FROM product_members
    WHERE product_members.product_id = product_id_param
    AND product_members.user_id = user_id_param
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Remover política problemática
DROP POLICY IF EXISTS "Users with product access can view members" ON product_members;

-- Recriar a política usando a função helper para evitar recursão
CREATE POLICY "Users with product access can view members"
  ON product_members FOR SELECT
  USING (
    -- Usar função SECURITY DEFINER para evitar recursão
    check_product_membership(product_members.product_id, auth.uid())
    -- Também permitir que usuários vejam seu próprio registro
    OR product_members.user_id = auth.uid()
  );
