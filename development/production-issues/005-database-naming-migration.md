# Issue: Incomplete Database Table Naming Migration

**Status:** 🟡 YELLOW  
**Severity:** Medium  
**Category:** Database Schema

## Problem Description
The database is in a transitional state between PascalCase (old) and snake_case (new) table names, causing confusion and potential errors.

## Evidence
- Duplicate type definitions: `registrations` and `Registrations`
- Both versions referenced in RLS migration files
- `DB_TABLE_NAMES` mapping in code to handle both formats
- Foreign key references still using old names

## Impact
- Confusion about which table name to use
- Potential for querying wrong/non-existent table
- Maintenance overhead with compatibility layer
- Risk of data inconsistency

## Root Cause
Incomplete migration from PascalCase to snake_case naming convention. The system supports both to maintain backwards compatibility, but this creates complexity.

## Fix Plan

### Immediate Action
1. Verify which table names actually exist in production:
   ```sql
   SELECT tablename FROM pg_tables 
   WHERE schemaname = 'public' 
   AND (tablename LIKE '%egistration%' OR tablename LIKE '%ttendee%');
   ```
2. Ensure code uses the compatibility layer consistently

### Long-term Solution
1. Complete the migration to snake_case:
   - Create new tables with snake_case names
   - Migrate data
   - Update all foreign keys
   - Drop old PascalCase tables
2. Remove compatibility layer from code
3. Update TypeScript types to only have snake_case versions
4. Run migration script that was already created

## Verification Steps
```bash
# Check for mixed case usage in code
grep -r "Registrations" --include="*.ts" --include="*.tsx" | grep -v "types.ts"

# Verify all queries use proper table names
grep -r "from.*Registrations" --include="*.ts" --include="*.tsx"
```