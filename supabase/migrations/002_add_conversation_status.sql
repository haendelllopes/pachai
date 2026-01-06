-- Add status and last_activity_at columns to conversations table

-- Add status column with CHECK constraint
ALTER TABLE conversations
ADD COLUMN status TEXT CHECK (status IN ('ACTIVE', 'PAUSED', 'CLOSED')) DEFAULT 'ACTIVE';

-- Add last_activity_at column
ALTER TABLE conversations
ADD COLUMN last_activity_at TIMESTAMPTZ DEFAULT NOW();

-- Update all existing conversations to ACTIVE status
UPDATE conversations
SET status = 'ACTIVE', last_activity_at = created_at
WHERE status IS NULL;

-- Create index on status for performance
CREATE INDEX idx_conversations_status ON conversations(status);

-- Create index on last_activity_at for performance
CREATE INDEX idx_conversations_last_activity_at ON conversations(last_activity_at);

