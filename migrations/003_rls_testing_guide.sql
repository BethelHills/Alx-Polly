-- RLS Testing Guide
-- This file contains test queries to verify RLS policies are working correctly

-- ==============================================
-- TEST 1: Verify RLS is enabled
-- ==============================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('polls', 'votes', 'audit_logs')
ORDER BY tablename;

-- Expected result: All tables should show rls_enabled = true

-- ==============================================
-- TEST 2: Verify policies exist
-- ==============================================
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

-- Expected result: Should show all the policies we created

-- ==============================================
-- TEST 3: Test public poll access (should work for anonymous users)
-- ==============================================
-- Run this as an anonymous user (no auth context)
SELECT COUNT(*) FROM polls;

-- Expected result: Should return count of all polls

-- ==============================================
-- TEST 4: Test authenticated user poll creation
-- ==============================================
-- Run this as an authenticated user
-- INSERT INTO polls (title, options, owner) VALUES ('Test Poll', '["Option 1", "Option 2"]', auth.uid());

-- Expected result: Should succeed for authenticated users

-- ==============================================
-- TEST 5: Test poll ownership modification
-- ==============================================
-- Run this as the poll owner
-- UPDATE polls SET title = 'Updated Title' WHERE id = 'poll-id' AND owner = auth.uid();

-- Expected result: Should succeed only for poll owner

-- ==============================================
-- TEST 6: Test vote insertion
-- ==============================================
-- Run this as an authenticated user
-- INSERT INTO votes (poll_id, option, user_id) VALUES ('poll-id', 'Option 1', auth.uid());

-- Expected result: Should succeed for authenticated users

-- ==============================================
-- TEST 7: Test vote visibility
-- ==============================================
-- Run this as a user who voted or poll owner
-- SELECT * FROM votes WHERE user_id = auth.uid() OR EXISTS (SELECT 1 FROM polls p WHERE p.id = votes.poll_id AND p.owner = auth.uid());

-- Expected result: Should only show votes the user can see

-- ==============================================
-- TEST 8: Test audit log insertion
-- ==============================================
-- Run this as an authenticated user (typically server-side)
-- INSERT INTO audit_logs (user_id, action, target_id, details) VALUES (auth.uid(), 'test_action', 'test_id', '{"test": true}');

-- Expected result: Should succeed for authenticated users

-- ==============================================
-- ROLLBACK QUERIES (if needed)
-- ==============================================

-- To disable RLS (NOT RECOMMENDED for production):
-- ALTER TABLE polls DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE votes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- To drop all policies:
-- DROP POLICY IF EXISTS "public_select_polls" ON polls;
-- DROP POLICY IF EXISTS "auth_insert_polls" ON polls;
-- DROP POLICY IF EXISTS "owner_modify_polls" ON polls;
-- DROP POLICY IF EXISTS "auth_insert_votes" ON votes;
-- DROP POLICY IF EXISTS "vote_select_restricted" ON votes;
-- DROP POLICY IF EXISTS "auth_insert_audit" ON audit_logs;
