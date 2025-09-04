#!/bin/bash

# Database Setup Script
# Sets up the complete database schema for the polling application

set -e

echo "🗄️  Database Setup for Polling Application"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "migrations/000_create_all_tables.sql" ]; then
    echo "❌ Migration files not found. Please run this script from the project root."
    exit 1
fi

echo "📋 Database Setup Steps:"
echo "   1. Create all tables (polls, votes, audit_logs)"
echo "   2. Add unique vote constraint"
echo "   3. Enable Row Level Security (RLS)"
echo "   4. Create security policies"
echo ""

echo "⚠️  IMPORTANT: This will set up your complete database schema."
echo "   Make sure you're connected to the correct database!"
echo ""

read -p "🤔 Do you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Setup cancelled."
    exit 1
fi

echo ""
echo "📝 To set up your database:"
echo ""
echo "1️⃣  Go to your Supabase Dashboard:"
echo "   https://supabase.com/dashboard"
echo ""
echo "2️⃣  Navigate to SQL Editor"
echo ""
echo "3️⃣  Run these migrations in order:"
echo ""
echo "   Step 1: Create all tables"
echo "   $(cat migrations/000_create_all_tables.sql)"
echo ""
echo "   Step 2: Add unique vote constraint"
echo "   $(cat migrations/001_add_unique_vote_constraint.sql)"
echo ""
echo "   Step 3: Enable RLS and create policies"
echo "   $(cat migrations/002_enable_rls_policies.sql)"
echo ""
echo "4️⃣  Verify setup with:"
echo ""
echo "   SELECT table_name FROM information_schema.tables WHERE table_name IN ('polls', 'votes', 'audit_logs');"
echo ""
echo "✅ Database setup complete!"
echo ""
echo "💡 Next steps:"
echo "   1. Test your API endpoints"
echo "   2. Verify RLS policies are working"
echo "   3. Check audit logging functionality"
