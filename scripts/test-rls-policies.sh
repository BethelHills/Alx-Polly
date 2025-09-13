#!/bin/bash

# RLS Testing Script
# Tests Row Level Security policies to ensure they're working correctly

set -e

echo "🧪 RLS Policy Testing Guide"
echo "==========================="

echo "📋 This script provides test queries to verify your RLS policies are working."
echo ""

echo "🔍 Test 1: Verify RLS is enabled"
echo "Run this query in Supabase SQL Editor:"
echo ""
echo "SELECT schemaname, tablename, rowsecurity as rls_enabled"
echo "FROM pg_tables"
echo "WHERE tablename IN ('polls', 'votes', 'audit_logs')"
echo "ORDER BY tablename;"
echo ""
echo "Expected: All tables should show rls_enabled = true"
echo ""

echo "🔍 Test 2: Verify policies exist"
echo "Run this query in Supabase SQL Editor:"
echo ""
echo "SELECT schemaname, tablename, policyname, cmd"
echo "FROM pg_policies"
echo "WHERE tablename IN ('polls', 'votes', 'audit_logs')"
echo "ORDER BY tablename, policyname;"
echo ""
echo "Expected: Should show all 6 policies we created"
echo ""

echo "🔍 Test 3: Test public poll access"
echo "Run this query as an anonymous user (no auth context):"
echo ""
echo "SELECT COUNT(*) FROM polls;"
echo ""
echo "Expected: Should return count of all polls (public read access)"
echo ""

echo "🔍 Test 4: Test authenticated user poll creation"
echo "Run this query as an authenticated user:"
echo ""
echo "INSERT INTO polls (title, options, owner) VALUES ('Test Poll', '[\"Option 1\", \"Option 2\"]', auth.uid());"
echo ""
echo "Expected: Should succeed for authenticated users"
echo ""

echo "🔍 Test 5: Test poll ownership modification"
echo "Run this query as the poll owner:"
echo ""
echo "UPDATE polls SET title = 'Updated Title' WHERE id = 'your-poll-id' AND owner = auth.uid();"
echo ""
echo "Expected: Should succeed only for poll owner"
echo ""

echo "🔍 Test 6: Test vote insertion"
echo "Run this query as an authenticated user:"
echo ""
echo "INSERT INTO votes (poll_id, option, user_id) VALUES ('your-poll-id', 'Option 1', auth.uid());"
echo ""
echo "Expected: Should succeed for authenticated users"
echo ""

echo "🔍 Test 7: Test vote visibility"
echo "Run this query as a user who voted or poll owner:"
echo ""
echo "SELECT * FROM votes WHERE user_id = auth.uid() OR EXISTS (SELECT 1 FROM polls p WHERE p.id = votes.poll_id AND p.owner = auth.uid());"
echo ""
echo "Expected: Should only show votes the user can see"
echo ""

echo "✅ RLS Testing Complete!"
echo ""
echo "💡 If any tests fail, check:"
echo "   1. RLS is enabled on all tables"
echo "   2. All policies were created successfully"
echo "   3. User authentication is working"
echo "   4. Database schema matches expectations"
