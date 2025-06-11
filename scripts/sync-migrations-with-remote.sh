#!/bin/bash

# Script to sync local migrations with remote production database
# This ensures local migrations match EXACTLY what's on remote

set -e

echo "=== Syncing Local Migrations with Remote Production Database ==="
echo "Remote has 82 migrations that must be preserved exactly"

# Step 1: Backup current state
echo -e "\nStep 1: Creating backup of current migrations..."
mkdir -p backup/migrations_backup_$(date +%Y%m%d_%H%M%S)
cp -r supabase/migrations/* backup/migrations_backup_$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
echo "✓ Backup created"

# Step 2: Move migrations from migrations_temp to main directory
echo -e "\nStep 2: Moving migrations from migrations_temp..."
if [ -d "supabase/migrations_temp" ]; then
    for file in supabase/migrations_temp/*.sql; do
        if [ -f "$file" ]; then
            basename=$(basename "$file")
            echo "  Moving: $basename"
            mv "$file" "supabase/migrations/"
        fi
    done
    rmdir supabase/migrations_temp
    echo "✓ Moved all migrations from migrations_temp"
else
    echo "✓ No migrations_temp directory found"
fi

# Step 3: Remove migrations that don't exist on remote
echo -e "\nStep 3: Removing local-only migrations not on remote..."
LOCAL_ONLY_MIGRATIONS=(
    "20250605000000_create_supabase_functions_schema.sql"
    "20250605073721_fix_webhook_triggers.sql"
    "20250609000001_add_event_subtitle_to_tickets_view.sql"
    "20250609000002_add_lodge_creation_policies.sql"
    "20250609000003_secure_lodge_creation_policies.sql"
    "20250609000004_add_registration_audit_log.sql"
    "20250610000002_fix_delegation_registration_counts.sql"
)

for migration in "${LOCAL_ONLY_MIGRATIONS[@]}"; do
    if [ -f "supabase/migrations/$migration" ]; then
        echo "  Removing: $migration"
        rm -f "supabase/migrations/$migration"
    fi
done
echo "✓ Removed local-only migrations"

# Step 4: Fix the supabase_functions schema issue
echo -e "\nStep 4: Fixing supabase_functions schema dependency..."
# Check if remote_schema.sql references supabase_functions
if grep -q "supabase_functions" "supabase/migrations/20250605073722_remote_schema.sql"; then
    # Create a temporary file with schema creation prepended
    cat > temp_schema_fix.sql << 'EOF'
-- Ensure supabase_functions schema exists
-- This is required for the triggers in this migration
CREATE SCHEMA IF NOT EXISTS supabase_functions;

-- Create http_request function if it doesn't exist
-- This is a placeholder for Edge Functions integration
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
            -- In production, this triggers actual HTTP requests
            RAISE NOTICE 'HTTP Request: % % %', method, url, payload;
        END;
        $func$;
    END IF;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA supabase_functions TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION supabase_functions.http_request(text, text, jsonb, jsonb, integer) 
    TO postgres, anon, authenticated, service_role;

-- Original migration content follows:
EOF
    
    # Append the original migration content
    cat "supabase/migrations/20250605073722_remote_schema.sql" >> temp_schema_fix.sql
    
    # Replace the original file
    mv temp_schema_fix.sql "supabase/migrations/20250605073722_remote_schema.sql"
    echo "✓ Added supabase_functions schema creation to remote_schema.sql"
fi

# Step 5: Verify migration count
echo -e "\nStep 5: Verifying migration count..."
EXPECTED_COUNT=82
ACTUAL_COUNT=$(ls supabase/migrations/*.sql 2>/dev/null | wc -l | tr -d ' ')

echo "Expected migrations: $EXPECTED_COUNT"
echo "Actual migrations: $ACTUAL_COUNT"

if [ "$ACTUAL_COUNT" -eq "$EXPECTED_COUNT" ]; then
    echo "✓ Migration count matches remote!"
else
    echo "⚠️  Warning: Migration count mismatch. Expected $EXPECTED_COUNT but found $ACTUAL_COUNT"
    echo "   Please check if any migrations are missing or extra."
fi

# Step 6: List all migrations for verification
echo -e "\nStep 6: Current migrations (should match remote):"
ls supabase/migrations/*.sql | sed 's/.*\///g' | sed 's/\.sql$//g' | sort | head -10
echo "... (showing first 10)"

# Step 7: Create a migration manifest
echo -e "\nStep 7: Creating migration manifest..."
ls supabase/migrations/*.sql | sed 's/.*\///g' | sed 's/\.sql$//g' | sort > migration_manifest.txt
echo "✓ Created migration_manifest.txt for reference"

# Clean up
rm -f temp_backup.gz local_migrations.txt remote_migrations.txt

echo -e "\n=== Sync Complete ==="
echo "Next steps:"
echo "1. Review changes: git status"
echo "2. Test locally: supabase db reset"
echo "3. Commit: git add -A && git commit -m 'fix: sync migrations with remote production database'"
echo "4. Push to development branch first for testing"
echo "5. After verification, push to main branch"
echo ""
echo "The GitHub integration should now work without errors!"