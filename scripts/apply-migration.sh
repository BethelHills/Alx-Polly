#!/bin/bash

# Database Migration Script
# Applies the unique vote constraint migration

set -e

echo "🗄️  Database Migration: Add Unique Vote Constraint"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "migrations/001_add_unique_vote_constraint.sql" ]; then
    echo "❌ Migration file not found. Please run this script from the project root."
    exit 1
fi

echo "📋 Migration Details:"
echo "   - File: migrations/001_add_unique_vote_constraint.sql"
echo "   - Purpose: Add unique constraint to prevent duplicate votes"
echo "   - Constraint: UNIQUE (poll_id, user_id)"
echo ""

echo "⚠️  IMPORTANT: This migration will:"
echo "   1. Add a unique constraint to the votes table"
echo "   2. Prevent users from voting multiple times on the same poll"
echo "   3. Handle existing duplicate votes (if any) by failing the migration"
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
echo "   $(cat migrations/001_add_unique_vote_constraint.sql)"
echo ""
echo "4️⃣  Execute the migration"
echo ""
echo "5️⃣  Verify the constraint was added:"
echo ""
echo "   SELECT conname, contype, pg_get_constraintdef(oid)"
echo "   FROM pg_constraint"
echo "   WHERE conname = 'unique_user_poll_vote';"
echo ""
echo "✅ Migration ready to apply!"
echo ""
echo "💡 Alternative: Use Supabase CLI if you have it installed:"
echo "   supabase db push"
