-- Add paused_at column to conversations table

ALTER TABLE conversations
ADD COLUMN paused_at TIMESTAMPTZ;

-- Create index on paused_at for performance
CREATE INDEX idx_conversations_paused_at ON conversations(paused_at);

