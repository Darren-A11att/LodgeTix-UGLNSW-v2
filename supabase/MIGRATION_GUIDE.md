# Supabase Migration Guide

## Migration Structure

### `/migrations` - Pending Migrations
These are migrations that need to be applied in sequence:

1. **Functions Architecture** (db_001 through db_012)
   - Creates the new functions-based architecture
   - Migrates from parent_event structure to functions
   - Must be applied in order

2. **Additional Migrations**
   - `20250601133000_setup_organiser_portal_auth.sql` - Organiser portal authentication
   - `20250606_fix_get_event_with_details_et_id_error.sql` - Critical fix for RPC function

### `/applied_migrations` - Already Applied
These migrations have been applied to the database:

- Views and RPC functions
- Performance indexes
- Stripe integration
- RLS policies (final version: v6)
- Data fixes
- `20250602_consolidated_database_state.sql` - Complete database state as of June 2

### `/archived_migrations` - Superseded/Outdated
Old migrations that have been replaced or consolidated.

## Applying Migrations

### For New Database
1. Apply all migrations in `/migrations` folder in order
2. Skip `/applied_migrations` as they're already included in the consolidated state

### For Existing Database
1. Check which migrations have been applied using:
   ```sql
   SELECT * FROM schema_migrations ORDER BY version;
   ```
2. Apply any missing migrations from `/migrations`
3. Apply the critical fix: `20250606_fix_get_event_with_details_et_id_error.sql`

## Important Notes

- The `20250602_consolidated_database_state.sql` contains the complete database state including all tables, views, functions, and RLS policies
- Always backup your database before applying migrations
- Test migrations in a development environment first