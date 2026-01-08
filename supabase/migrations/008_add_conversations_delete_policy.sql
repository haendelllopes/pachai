-- Adicionar políticas RLS para DELETE de conversas, veredicts e messages
-- Permite que usuários excluam conversas de seus próprios produtos e seus dados relacionados

CREATE POLICY "Users can delete conversations of their products"
  ON conversations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = conversations.product_id
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete veredicts of their products"
  ON veredicts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = veredicts.product_id
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages of their conversations"
  ON messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      JOIN products ON products.id = conversations.product_id
      WHERE conversations.id = messages.conversation_id
      AND products.user_id = auth.uid()
    )
  );
