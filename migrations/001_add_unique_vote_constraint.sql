-- Migration: Add unique constraint to prevent duplicate votes
-- Date: 2024-09-04
-- Description: Ensures each user can only vote once per poll

-- Add unique constraint to votes table
ALTER TABLE votes
  ADD CONSTRAINT unique_user_poll_vote UNIQUE (poll_id, user_id);

-- Add comment for documentation
COMMENT ON CONSTRAINT unique_user_poll_vote ON votes IS 
'Prevents users from voting multiple times on the same poll';

-- Verify the constraint was added
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'unique_user_poll_vote';
