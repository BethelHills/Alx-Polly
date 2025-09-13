#!/bin/bash

# RLS Migration Script
# Applies Row Level Security policies to the polling application

set -e

echo "🔒 Row Level Security (RLS) Migration"
echo "====================================="

# Check if we're in the right directory
if [ ! -f "migrations/002_enable_rls_policies.sql" ]; then
    echo "❌ RLS migration file not found. Please run this script from the project root."
    exit 1
fi

echo "📋 RLS Migration Details:"
echo "   - File: migrations/002_enable_rls_policies.sql"
echo "   - Purpose: Enable Row Level Security and create security policies"
echo "   - Tables: polls, votes, audit_logs"
echo ""

echo "🛡️  Security Policies to be created:"
echo ""
echo "   📊 POLLS TABLE:"
echo "      ✅ Public read access (anyone can view polls)"
echo "      ✅ Authenticated users can create polls"
echo "      ✅ Only poll owners can modify/delete their polls"
echo ""
echo "   🗳️  VOTES TABLE:"
echo "      ✅ Authenticated users can vote"
echo "      ✅ Users can only see their own votes or votes on their polls"
echo ""
echo "   📝 AUDIT_LOGS TABLE:"
echo "      ✅ Authenticated users can create audit logs"
echo ""

echo "⚠️  IMPORTANT: This migration will:"
echo "   1. Enable RLS on polls, votes, and audit_logs tables"
echo "   2. Create security policies to control data access"
echo "   3. Ensure users can only access their own data"
echo "   4. Allow public read access to polls (for UI display)"
echo ""

read -p "🤔 Do you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled."
    exit 1
fi

echo ""
echo "📝 To apply this migration:"
echo ""
echo "1️⃣  Go to your Supabase Dashboard:"
echo "   https://supabase.com/dashboard"
echo ""
echo "2️⃣  Navigate to SQL Editor"
echo ""
echo "3️⃣  Copy and paste this SQL:"
echo ""
echo "   $(cat migrations/002_enable_rls_policies.sql)"
echo ""
echo "4️⃣  Execute the migration"
echo ""
echo "5️⃣  Verify RLS is working:"
echo ""
echo "   $(cat migrations/003_rls_testing_guide.sql | head -20)"
echo ""
echo "✅ RLS Migration ready to apply!"
echo ""
echo "💡 After applying, test with:"
echo "   ./scripts/test-rls-policies.sh"
