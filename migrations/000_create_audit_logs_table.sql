-- Migration: Create audit_logs table
-- Date: 2024-09-04
-- Description: Creates the audit_logs table for tracking user actions and maintaining audit trail

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid,
  action text,
  target_id uuid,
  details jsonb
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_id ON audit_logs(target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'Audit trail for tracking user actions and system events';
COMMENT ON COLUMN audit_logs.id IS 'Unique identifier for the audit log entry';
COMMENT ON COLUMN audit_logs.created_at IS 'Timestamp when the action occurred';
COMMENT ON COLUMN audit_logs.user_id IS 'ID of the user who performed the action (nullable for system actions)';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed (e.g., create_poll, vote, delete_poll)';
COMMENT ON COLUMN audit_logs.target_id IS 'ID of the target object (e.g., poll_id, vote_id)';
COMMENT ON COLUMN audit_logs.details IS 'Additional details about the action in JSON format';

-- Verify table was created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'audit_logs'
ORDER BY ordinal_position;
