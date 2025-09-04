-- Migration: Create votes table
-- Date: 2024-09-04
-- Description: Creates the votes table for storing user votes

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  poll_id uuid NOT NULL,
  user_id uuid NOT NULL,
  option text NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at);

-- Add comments for documentation
COMMENT ON TABLE votes IS 'Stores user votes for polls';
COMMENT ON COLUMN votes.id IS 'Unique identifier for the vote';
COMMENT ON COLUMN votes.created_at IS 'Timestamp when the vote was cast';
COMMENT ON COLUMN votes.poll_id IS 'ID of the poll being voted on';
COMMENT ON COLUMN votes.user_id IS 'ID of the user who cast the vote';
COMMENT ON COLUMN votes.option IS 'The option the user voted for';

-- Verify table was created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'votes'
ORDER BY ordinal_position;
