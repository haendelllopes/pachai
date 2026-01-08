-- Atualizar RLS de conversations para considerar product_members
-- Viewers não devem ter acesso a conversas

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view conversations of their products" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations for their products" ON conversations;
DROP POLICY IF EXISTS "Users can update conversations of their products" ON conversations;

-- SELECT: Apenas owners e editors podem ver conversas
CREATE POLICY "Owners and editors can view conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM product_members pm
      WHERE pm.product_id = conversations.product_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'editor')
    )
    OR EXISTS (
      SELECT 1 FROM products
      WHERE products.id = conversations.product_id
      AND products.user_id = auth.uid()
    )
  );

-- INSERT: Apenas owners e editors podem criar conversas
CREATE POLICY "Owners and editors can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM product_members pm
      WHERE pm.product_id = conversations.product_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'editor')
    )
    OR EXISTS (
      SELECT 1 FROM products
      WHERE products.id = conversations.product_id
      AND products.user_id = auth.uid()
    )
  );

-- UPDATE: Apenas owners e editors podem atualizar conversas
CREATE POLICY "Owners and editors can update conversations"
  ON conversations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM product_members pm
      WHERE pm.product_id = conversations.product_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'editor')
    )
    OR EXISTS (
      SELECT 1 FROM products
      WHERE products.id = conversations.product_id
      AND products.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM product_members pm
      WHERE pm.product_id = conversations.product_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'editor')
    )
    OR EXISTS (
      SELECT 1 FROM products
      WHERE products.id = conversations.product_id
      AND products.user_id = auth.uid()
    )
  );

-- Atualizar RLS de messages para considerar product_members
-- Viewers não devem ter acesso a mensagens

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view messages of their conversations" ON messages;
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON messages;

-- SELECT: Apenas owners e editors podem ver mensagens
CREATE POLICY "Owners and editors can view messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      JOIN product_members pm ON pm.product_id = conversations.product_id
      WHERE conversations.id = messages.conversation_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'editor')
    )
    OR EXISTS (
      SELECT 1 FROM conversations
      JOIN products ON products.id = conversations.product_id
      WHERE conversations.id = messages.conversation_id
      AND products.user_id = auth.uid()
    )
  );

-- INSERT: Apenas owners e editors podem criar mensagens
CREATE POLICY "Owners and editors can create messages"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      JOIN product_members pm ON pm.product_id = conversations.product_id
      WHERE conversations.id = messages.conversation_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'editor')
    )
    OR EXISTS (
      SELECT 1 FROM conversations
      JOIN products ON products.id = conversations.product_id
      WHERE conversations.id = messages.conversation_id
      AND products.user_id = auth.uid()
    )
  );
