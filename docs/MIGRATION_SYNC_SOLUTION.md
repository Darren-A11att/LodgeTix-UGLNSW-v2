# Migration Sync Solution - Production Database as Source of Truth

## Problem Summary
The GitHub integration is failing because:
1. Remote database has migrations that don't exist locally (in wrong directory)
2. Local has migrations that were never applied to remote
3. The `supabase_functions` schema is missing, causing trigger creation to fail

## Remote Production Database State
- **Total Migrations**: 82 (from 20250605073722 to 20250608001200)
- **Critical**: These are the source of truth and must be preserved exactly

## Local Repository Issues Found

### Migrations in Wrong Location
The following 15 migrations exist on remote but were in `migrations_temp/` locally:
- 20250608000222_fix_all_registration_rls
- 20250608000223_fix_function_security_definer
- 20250608000224_fix_confirmation_number_constraint
- 20250608000225_fix_booking_contact_fkey
- 20250608000226_fix_ticket_column_mapping
- 20250608000227_fix_ticket_status_constraint
- 20250608000228_fix_all_ticket_constraints
- 20250608000229_fix_attendee_ticket_order
- 20250608000230_fix_event_id_lookup_from_event_tickets
- 20250608000310_final_attendee_relationship_fix
- 20250608001020_remove_attendee_fk_constraint
- 20250608001030_force_remove_fk_constraint
- 20250608001040_check_and_remove_all_fk_constraints
- 20250608001100_final_remove_fk_constraint
- 20250608001200_comprehensive_fk_removal

### Local-Only Migrations (Not on Remote)
These must be removed as they were never applied to production:
- 20250605000000_create_supabase_functions_schema
- 20250605073721_fix_webhook_triggers
- 20250609000001_add_event_subtitle_to_tickets_view
- 20250609000002_add_lodge_creation_policies
- 20250609000003_secure_lodge_creation_policies
- 20250609000004_* (if exists)
- 20250610000002_* (if exists)

### Schema Dependency Issue
The migration `20250605073722_remote_schema.sql` references `supabase_functions.http_request` but the schema doesn't exist. This suggests the schema was created manually in production.

## Solution Implementation

### Step 1: Run the Sync Script
```bash
./scripts/sync-migrations-with-remote.sh
```

This script will:
1. Create a backup of current migrations
2. Move migrations from `migrations_temp/` to `migrations/`
3. Remove local-only migrations
4. Add schema creation to the beginning of `remote_schema.sql`
5. Verify the count matches remote (82 migrations)

### Step 2: Test Locally
```bash
# Reset local database with synced migrations
supabase db reset

# This will apply all 82 migrations in order
```

### Step 3: Commit and Deploy
```bash
# Review changes
git status

# Commit the sync
git add -A
git commit -m "fix: sync migrations with remote production database

- Move 15 migrations from migrations_temp to main directory
- Remove local-only migrations that don't exist on remote
- Add supabase_functions schema creation to fix dependency
- Ensure exact match with 82 remote migrations"

# Push to development branch first
git checkout development
git push origin development

# After verification, merge to main
git checkout main
git merge development
git push origin main
```

## Why This Works

1. **Exact Match**: Local migrations now exactly match what's on remote
2. **Schema Fix**: The `supabase_functions` schema is created before it's referenced
3. **Proper Structure**: All migrations are in the correct directory
4. **GitHub Integration**: The integration expects migrations in `supabase/migrations/`

## Verification Steps

1. Check Supabase dashboard for successful deployment
2. Verify no errors in GitHub integration logs
3. Test that new migrations can be added and deployed
4. Ensure both development and production branches work

## Future Prevention

1. Always use `supabase migration new` to create migrations
2. Never manually move migrations between directories
3. Keep migrations in sync between environments
4. Test migrations locally before pushing

## Important Notes

- The remote database is the source of truth
- All 82 migrations must be preserved in exact order
- The `supabase_functions` schema issue is fixed by prepending creation
- This solution maintains backward compatibility