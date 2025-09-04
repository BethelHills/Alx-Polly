-- Migration: Create polls table
-- Date: 2024-09-04
-- Description: Creates the polls table for storing poll data

-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  title text NOT NULL,
  description text,
  options text[] NOT NULL,
  owner uuid NOT NULL,
  is_active boolean DEFAULT true
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_polls_owner ON polls(owner);
CREATE INDEX IF NOT EXISTS idx_polls_is_active ON polls(is_active);
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at);

-- Add comments for documentation
COMMENT ON TABLE polls IS 'Stores poll data including title, description, options, and owner';
COMMENT ON COLUMN polls.id IS 'Unique identifier for the poll';
COMMENT ON COLUMN polls.created_at IS 'Timestamp when the poll was created';
COMMENT ON COLUMN polls.updated_at IS 'Timestamp when the poll was last updated';
COMMENT ON COLUMN polls.title IS 'Title of the poll';
COMMENT ON COLUMN polls.description IS 'Optional description of the poll';
COMMENT ON COLUMN polls.options IS 'Array of poll options';
COMMENT ON COLUMN polls.owner IS 'ID of the user who created the poll';
COMMENT ON COLUMN polls.is_active IS 'Whether the poll is currently active';

-- Verify table was created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'polls'
ORDER BY ordinal_position;
