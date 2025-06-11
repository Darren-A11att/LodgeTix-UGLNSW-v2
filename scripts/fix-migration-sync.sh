#!/bin/bash

# Script to fix Supabase migration sync issues
set -e

echo "=== Fixing Supabase Migration Sync Issues ==="

# Step 1: Move migrations from migrations_temp to main migrations directory
echo "Step 1: Moving migrations from migrations_temp to main directory..."
if [ -d "supabase/migrations_temp" ]; then
    mv supabase/migrations_temp/*.sql supabase/migrations/ 2>/dev/null || true
    echo "✓ Moved all SQL files from migrations_temp"
else
    echo "✓ No migrations_temp directory found"
fi

# Step 2: Remove local-only migrations that aren't on remote
echo "Step 2: Removing local-only migrations that will be reapplied..."
rm -f supabase/migrations/20250605000000_create_supabase_functions_schema.sql
rm -f supabase/migrations/20250605073721_fix_webhook_triggers.sql
rm -f supabase/migrations/20250609000001_add_event_subtitle_to_tickets_view.sql
rm -f supabase/migrations/20250609000002_add_lodge_creation_policies.sql
rm -f supabase/migrations/20250609000003_secure_lodge_creation_policies.sql
rm -f supabase/migrations/20250609000004_*.sql 2>/dev/null || true
rm -f supabase/migrations/20250610000002_*.sql 2>/dev/null || true
echo "✓ Removed local-only migrations"

# Step 3: Create a new migration to ensure supabase_functions schema exists
echo "Step 3: Creating schema fix migration..."
cat > supabase/migrations/20250605000000_ensure_supabase_functions_schema.sql << 'EOF'
-- Ensure supabase_functions schema exists
-- This migration ensures the schema is created before any triggers that depend on it

CREATE SCHEMA IF NOT EXISTS supabase_functions;

-- Create http_request function if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'supabase_functions' 
        AND p.proname = 'http_request'
    ) THEN
        CREATE FUNCTION supabase_functions.http_request(
            url text,
            method text,
            headers jsonb DEFAULT '{}'::jsonb,
            payload jsonb DEFAULT '{}'::jsonb,
            timeout_ms integer DEFAULT 5000
        )
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $func$
        BEGIN
            -- Placeholder function for Edge Functions webhook
            RAISE NOTICE 'HTTP Request: % % %', method, url, payload;
        END;
        $func$;
    END IF;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA supabase_functions TO postgres, anon, authenticated, service_role;
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'supabase_functions' 
        AND p.proname = 'http_request'
    ) THEN
        GRANT EXECUTE ON FUNCTION supabase_functions.http_request TO postgres, anon, authenticated, service_role;
    END IF;
END $$;
EOF
echo "✓ Created schema fix migration"

# Step 4: List final migration state
echo -e "\nStep 4: Final migration count..."
MIGRATION_COUNT=$(ls supabase/migrations/*.sql 2>/dev/null | wc -l)
echo "Total migrations in main directory: $MIGRATION_COUNT"

# Step 5: Clean up
echo -e "\nStep 5: Cleaning up..."
rm -rf supabase/migrations_temp
rm -f temp_backup.gz
rm -f local_migrations.txt remote_migrations.txt
echo "✓ Cleanup complete"

echo -e "\n=== Migration Sync Fix Complete ==="
echo "Next steps:"
echo "1. Review the changes with: git status"
echo "2. Commit the changes: git add supabase/migrations && git commit -m 'fix: sync migrations with remote database'"
echo "3. Push to trigger GitHub integration: git push"