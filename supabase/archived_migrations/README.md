# Archived Migrations

This folder contains migrations that have been superseded or are no longer needed.

## Archival Reasons:

### RLS Policy Iterations
- `20250531_enable_rls_policies.sql` through `20250531_enable_rls_policies_v6.sql` - Multiple iterations of RLS policies, superseded by final version

### Incremental Fixes
- Various fix files that have been consolidated into the complete database state migrations

### Test and Debug Files
- `20250531_rls_test_scenarios.sql` - Test scenarios, not production migrations
- `20250531_rls_policies_dashboard_script.sql` - Dashboard script, not a migration

## Current Active Migrations

The active migrations are:
1. Functions architecture migrations (db_001 through db_012)
2. Latest consolidated state in `20250602_complete_current_database_state.sql`
3. Critical fixes applied after the consolidation