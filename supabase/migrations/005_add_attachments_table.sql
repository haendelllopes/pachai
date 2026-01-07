-- Create ENUM types for conversation_attachments
CREATE TYPE attachment_type AS ENUM ('document', 'image', 'audio', 'video');
CREATE TYPE attachment_source AS ENUM ('upload', 'recording');
CREATE TYPE attachment_status AS ENUM ('processing', 'ready', 'failed');

-- Conversation attachments table
CREATE TABLE conversation_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type attachment_type NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  extracted_text TEXT NULL, -- NULLABLE: status='ready' NÃO implica extracted_text obrigatório
  source attachment_source NOT NULL DEFAULT 'upload',
  status attachment_status NOT NULL DEFAULT 'processing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_attachments_conversation_id ON conversation_attachments(conversation_id);
CREATE INDEX idx_attachments_user_id ON conversation_attachments(user_id);
CREATE INDEX idx_attachments_status ON conversation_attachments(status);
CREATE INDEX idx_attachments_created_at ON conversation_attachments(created_at);

-- Row Level Security (RLS)
ALTER TABLE conversation_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversation_attachments
CREATE POLICY "Users can view attachments of their conversations"
  ON conversation_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      JOIN products ON products.id = conversations.product_id
      WHERE conversations.id = conversation_attachments.conversation_id
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create attachments for their conversations"
  ON conversation_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      JOIN products ON products.id = conversations.product_id
      WHERE conversations.id = conversation_attachments.conversation_id
      AND products.user_id = auth.uid()
    )
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can update attachments of their conversations"
  ON conversation_attachments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      JOIN products ON products.id = conversations.product_id
      WHERE conversations.id = conversation_attachments.conversation_id
      AND products.user_id = auth.uid()
    )
    AND auth.uid() = user_id
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      JOIN products ON products.id = conversations.product_id
      WHERE conversations.id = conversation_attachments.conversation_id
      AND products.user_id = auth.uid()
    )
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can delete attachments of their conversations"
  ON conversation_attachments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      JOIN products ON products.id = conversations.product_id
      WHERE conversations.id = conversation_attachments.conversation_id
      AND products.user_id = auth.uid()
    )
    AND auth.uid() = user_id
  );

