-- Políticas de Storage para o bucket 'attachments'
-- O bucket deve ser PRIVADO (não público) por segurança

-- Política para INSERT (upload)
-- Usuários podem fazer upload se a conversa pertence a eles
-- Nota: Upload acontece ANTES de criar registro em conversation_attachments,
-- então verificamos acesso via conversations/products
CREATE POLICY "Users can upload attachments to their conversations"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'attachments' AND
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN products p ON p.id = c.product_id
    WHERE p.user_id = auth.uid()
    AND (storage.foldername(name))[1] = c.id::text
  )
);

-- Política para SELECT (visualizar/download)
-- Usuários podem visualizar apenas arquivos de conversas que pertencem a eles
CREATE POLICY "Users can view attachments from their conversations"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'attachments' AND
  EXISTS (
    SELECT 1 FROM conversation_attachments ca
    JOIN conversations c ON c.id = ca.conversation_id
    JOIN products p ON p.id = c.product_id
    WHERE ca.user_id = auth.uid()
    AND ca.file_url LIKE '%' || storage.objects.name
  )
);

-- Política para DELETE
-- Usuários podem deletar apenas arquivos de conversas que pertencem a eles
CREATE POLICY "Users can delete attachments from their conversations"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'attachments' AND
  EXISTS (
    SELECT 1 FROM conversation_attachments ca
    JOIN conversations c ON c.id = ca.conversation_id
    JOIN products p ON p.id = c.product_id
    WHERE ca.user_id = auth.uid()
    AND ca.file_url LIKE '%' || storage.objects.name
  )
);

-- Nota: UPDATE não é necessário para arquivos (não editamos arquivos, apenas substituímos)
