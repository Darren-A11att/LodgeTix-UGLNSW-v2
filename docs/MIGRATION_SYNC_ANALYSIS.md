# Migration Sync Analysis

## Remote Database Migrations (from backup)
Total: 82 migrations

## Local Repository Migrations
Total: 68 migrations in main directory + 15 in migrations_temp

## Differences Found

### Local has but Remote doesn't:
- `20250605000000_create_supabase_functions_schema.sql` ⚠️ **This explains the schema error!**
- `20250605073721_fix_webhook_triggers.sql`
- `20250609000001_add_event_subtitle_to_tickets_view.sql`
- `20250609000002_add_lodge_creation_policies.sql`
- `20250609000003_secure_lodge_creation_policies.sql`
- `20250609000004` (if exists)
- `20250610000002` (if exists)

### Remote has but Local main directory doesn't:
These 15 migrations are exactly what's in your `migrations_temp` directory:
- `20250608000222` through `20250608001200`

## Root Cause Analysis

1. **Missing supabase_functions schema**: The migration `20250605000000_create_supabase_functions_schema.sql` was never applied to remote, which is why `20250605073722_remote_schema.sql` fails when it tries to reference this schema.

2. **Migrations in wrong directory**: The 15 migrations in `migrations_temp` were applied to remote but aren't in the main migrations directory where GitHub integration expects them.

3. **Timeline mismatch**: Some newer migrations (20250609* and 20250610*) exist locally but haven't been applied to remote.

## Solution Steps

1. Move the 15 migrations from `migrations_temp` to the main `migrations` directory
2. Remove migrations that exist locally but not remotely (they'll be reapplied)
3. Ensure the supabase_functions schema creation migration runs first
4. Commit and push to trigger GitHub integration