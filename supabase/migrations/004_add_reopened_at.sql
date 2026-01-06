-- Add reopened_at column to conversations table

ALTER TABLE conversations
ADD COLUMN reopened_at TIMESTAMPTZ;

-- Create index on reopened_at for performance
CREATE INDEX idx_conversations_reopened_at ON conversations(reopened_at);

