# PRD: Fix Missing Individual Registration RPC Function

## Problem Statement
The individual registration flow is failing with error: "Could not find the function public.upsert_individual_registration(p_registration_data) in the schema cache". This is caused by a function signature mismatch between the API and database migrations.

## Root Cause Analysis
After investigating the database migrations, the issue is:

1. **Migration 20250608000027**: Created `upsert_individual_registration(p_registration_data jsonb)` 
2. **Migration 20250608000029**: **DROPPED** the jsonb version and replaced it with individual parameters
3. **Migration 20250608000030**: Attempted hotfix but only updates if jsonb version exists (which it doesn't)

The API at `/app/api/registrations/individuals/route.ts:198-201` is calling:
```typescript
.rpc('upsert_individual_registration', {
  p_registration_data: rpcData  // JSONB parameter
});
```

But the database now only has:
```sql
upsert_individual_registration(
  "registrationId" uuid,
  "functionId" uuid, 
  -- ... 16 individual parameters
)
```

## Current Error
```
POST http://localhost:3001/api/registrations/individuals 500 (Internal Server Error)
Error: Failed to create registration: Could not find the function public.upsert_individual_registration(p_registration_data) in the schema cache
```

## Requirements
1. **Restore JSONB Function**: Create `upsert_individual_registration(p_registration_data jsonb)` function
2. **Maintain Compatibility**: Ensure existing API calls work without changes
3. **Data Integrity**: Ensure proper data flow from frontend form to database
4. **Error Handling**: Implement proper error handling and validation
5. **Testing**: Comprehensive tests for the registration flow

## Technical Solution Options
**Option 1: Restore JSONB Function (RECOMMENDED)**
- Create migration to restore `upsert_individual_registration(p_registration_data jsonb)`
- Use the working logic from migration 20250608000027 with fixes from 20250608000030
- No API changes required

**Option 2: Update API to Use Individual Parameters**
- Modify `/app/api/registrations/individuals/route.ts` to use individual parameters
- Higher risk due to API changes
- Would need to map jsonb data to 16+ individual parameters

## Technical Scope
- Database migration to restore correct function signature
- Function implementation with proper error handling
- Test coverage for registration creation

## Success Criteria
- Individual registration submissions complete successfully
- No database function errors in browser console
- Registration data is properly stored in database
- Confirmation numbers generated correctly
- Full test coverage for registration flow

## Dependencies
- Existing database schema for registrations
- Current API endpoint structure unchanged
- Frontend registration wizard continues to work

## Risk Assessment
- **High**: Registration is a core business function
- **Impact**: Users cannot complete individual registrations (lodge/delegation still work)
- **Urgency**: Critical bug requiring immediate fix

## Implementation Plan
1. Write test that reproduces the error
2. Create new migration to restore jsonb function signature  
3. Implement function using best parts of previous migrations
4. Test that API call succeeds
5. Verify end-to-end registration flow works