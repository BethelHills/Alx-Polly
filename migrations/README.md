# Database Migrations

This directory contains SQL migration scripts for the polling application database.

## Migration Files

### 001_add_unique_vote_constraint.sql
- **Purpose**: Add unique constraint to prevent duplicate votes
- **Date**: 2024-09-04
- **Description**: Ensures each user can only vote once per poll

## How to Apply Migrations

### Option 1: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the migration SQL
4. Execute the migration

### Option 2: Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push
```

### Option 3: Direct SQL Execution
```bash
# Connect to your database and run:
psql -h your-db-host -U your-username -d your-database -f migrations/001_add_unique_vote_constraint.sql
```

## Verification

After applying the migration, verify the constraint exists:

```sql
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'unique_user_poll_vote';
```

Expected result:
- `constraint_name`: `unique_user_poll_vote`
- `constraint_type`: `u` (unique)
- `constraint_definition`: `UNIQUE (poll_id, user_id)`

## Rollback (if needed)

To remove the constraint:

```sql
ALTER TABLE votes DROP CONSTRAINT unique_user_poll_vote;
```

## Important Notes

- This constraint prevents race conditions in voting
- The application code handles the constraint violation gracefully
- Test the migration on a development database first
- Backup your database before applying to production
