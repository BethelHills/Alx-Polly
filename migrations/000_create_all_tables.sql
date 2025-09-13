-- Migration: Create all tables for polling application
-- Date: 2024-09-04
-- Description: Creates all necessary tables for the polling application

-- ==============================================
-- AUDIT_LOGS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid,
  action text,
  target_id uuid,
  details jsonb
);

-- Add indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_id ON audit_logs(target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ==============================================
-- POLLS TABLE
-- ==============================================
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

-- Add indexes for polls
CREATE INDEX IF NOT EXISTS idx_polls_owner ON polls(owner);
CREATE INDEX IF NOT EXISTS idx_polls_is_active ON polls(is_active);
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at);

-- ==============================================
-- VOTES TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  poll_id uuid NOT NULL,
  user_id uuid NOT NULL,
  option text NOT NULL
);

-- Add indexes for votes
CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at);

-- ==============================================
-- TABLE COMMENTS
-- ==============================================
COMMENT ON TABLE audit_logs IS 'Audit trail for tracking user actions and system events';
COMMENT ON TABLE polls IS 'Stores poll data including title, description, options, and owner';
COMMENT ON TABLE votes IS 'Stores user votes for polls';

-- ==============================================
-- VERIFICATION
-- ==============================================
-- Verify all tables were created
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name IN ('audit_logs', 'polls', 'votes')
ORDER BY table_name;
