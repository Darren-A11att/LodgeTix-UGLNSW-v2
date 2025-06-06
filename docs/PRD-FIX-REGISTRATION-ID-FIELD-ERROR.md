# PRD: Fix Registration ID Field Error in Payment Update

## Problem Statement
When updating a registration's payment status, the database returns error code 42703: `'record "new" has no field "id"'`. This occurs because somewhere in the database layer (trigger, RPC function, or policy), there's a reference to `NEW.id` when the registrations table actually uses `registration_id` as its primary key.

## Current Behavior
- Payment intent creation succeeds
- Registration update fails with PostgreSQL error 42703
- Error message indicates `NEW.id` field doesn't exist
- The update is attempting to set payment_status to 'completed'

## Expected Behavior
- Payment intent creation succeeds
- Registration update succeeds
- Payment status is updated to 'completed'
- No database errors occur

## Technical Context
- Registrations table uses `registration_id` as primary key (not `id`)
- Error occurs during UPDATE operation on registrations table
- The error references `NEW` which indicates it's likely in a trigger or RLS policy

## Success Criteria
1. Payment updates complete successfully without database errors
2. All references to `id` in database objects are corrected to `registration_id`
3. No regression in other registration operations

## Implementation Approach
1. Search for all database objects (triggers, functions, policies) that reference the registrations table
2. Identify where `NEW.id` or `OLD.id` is used instead of `NEW.registration_id` or `OLD.registration_id`
3. Create migration to fix the incorrect field references
4. Test the fix with payment updates

## Root Cause Analysis
Found the issue in two migration files:
1. `20250608000002_create_database_webhook.sql` - Lines 46 and 49
2. `20250605073722_remote_schema.sql` - Lines 2325 and 2328

The `should_generate_confirmation()` trigger function uses `NEW.id` instead of `NEW.registration_id`.

## TODO Checklist
- [x] Search for database triggers on registrations table
- [x] Search for RLS policies on registrations table  
- [x] Search for functions that reference registrations table
- [x] Identify exact location of NEW.id reference
- [ ] Create migration script to fix the issue
- [ ] Test payment update flow after fix
- [ ] Verify no regression in other registration operations