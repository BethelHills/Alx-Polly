-- Migration: Enable Row Level Security (RLS) and create security policies
-- Date: 2024-09-04
-- Description: Implements database-level security policies for polls, votes, and audit_logs

-- Enable RLS on all tables
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- POLLS TABLE POLICIES
-- ==============================================

-- Allow public select on polls (so UI can show polls)
CREATE POLICY "public_select_polls" ON polls FOR SELECT USING ( true );

-- Allow authenticated users to insert polls
CREATE POLICY "auth_insert_polls" ON polls FOR INSERT USING ( auth.role() = 'authenticated' );

-- Allow authenticated users to update/delete their own polls
CREATE POLICY "owner_modify_polls" ON polls FOR UPDATE, DELETE USING ( owner = auth.uid() );

-- ==============================================
-- VOTES TABLE POLICIES
-- ==============================================

-- Allow authenticated users to insert votes
CREATE POLICY "auth_insert_votes" ON votes FOR INSERT USING ( auth.role() = 'authenticated' );

-- Control select on votes: only the vote owner or poll owner can see votes
CREATE POLICY "vote_select_restricted" ON votes FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM polls p WHERE p.id = votes.poll_id AND p.owner = auth.uid())
);

-- ==============================================
-- AUDIT_LOGS TABLE POLICIES
-- ==============================================

-- Allow authenticated users to insert audit logs (server only should use service role)
CREATE POLICY "auth_insert_audit" ON audit_logs FOR INSERT USING ( auth.role() = 'authenticated' );

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('polls', 'votes', 'audit_logs')
ORDER BY tablename;

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('polls', 'votes', 'audit_logs')
ORDER BY tablename, policyname;
