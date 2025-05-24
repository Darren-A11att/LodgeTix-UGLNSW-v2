# Issue: Conflicting RLS (Row Level Security) Migrations

**Status:** 🔴 RED  
**Severity:** High  
**Category:** Database Security

## Problem Description
Two migrations with opposing RLS strategies exist, creating confusion about the actual security state of the database.

## Evidence
1. `20250523_disable_all_rls.sql` - Completely disables RLS and grants ALL permissions
2. `20250523_temporary_registration_permissions.sql` - Enables RLS with specific policies
3. Both migrations have the same date prefix, unclear which runs last

## Impact
- **Security Risk**: If RLS is disabled, any authenticated user can access all data
- **Data Breach Risk**: Anonymous users might access other users' registration data
- **Compliance Issues**: Personal data may be exposed
- **Unpredictable Behavior**: Depends on migration execution order

## Root Cause
Conflicting approaches to solving permission issues during development. One migration takes the "disable everything" approach while the other implements proper policies.

## Fix Plan

### Immediate Action
1. **CRITICAL**: Check current RLS status in production:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('registrations', 'attendees', 'tickets', 'customers');
   ```
2. If RLS is disabled, enable immediately with proper policies

### Long-term Solution
1. Remove `20250523_disable_all_rls.sql` migration
2. Create proper RLS policies:
   ```sql
   -- Users can only see their own registrations
   CREATE POLICY "users_own_registrations" ON registrations
   FOR ALL USING (auth.uid() = customer_id);
   
   -- Anonymous users can create registrations
   CREATE POLICY "anon_create_registrations" ON registrations
   FOR INSERT WITH CHECK (auth.role() = 'anon');
   ```
3. Test thoroughly with different user types
4. Document the security model

## Verification Steps
```sql
-- Check RLS status
SELECT * FROM pg_policies WHERE tablename IN ('registrations', 'attendees');

-- Test data access
-- As anonymous user, try to read other registrations
SELECT * FROM registrations WHERE customer_id != auth.uid();
```