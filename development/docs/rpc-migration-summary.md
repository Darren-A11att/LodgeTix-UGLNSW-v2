# RPC Migration Summary

## Current Status
The RPC-based registration creation is implemented but disabled by default. The column name mismatch issue has been identified and fixed.

## What Was Fixed
1. **Column Name Mismatches**:
   - `attendees` table uses `registrationid` (no underscore) but RPC was using `registration_id`
   - `tickets` table uses snake_case column names but RPC had some mismatches
   - Removed `payment_status` updates for attendees (column doesn't exist)

## Migration File Created
`/supabase/migrations/20250527_fix_rpc_column_names.sql` - This migration:
- Drops and recreates the `create_registration` function with correct column names
- Changes `registration_id` to `registrationid` for attendees table insert
- Ensures tickets table uses correct snake_case columns
- Maintains all existing functionality

## Deployment Steps

### 1. Apply the Migration
```bash
# Via Supabase Dashboard:
1. Go to SQL Editor
2. Paste contents of /supabase/migrations/20250527_fix_rpc_column_names.sql
3. Execute

# Or via CLI (if linked):
npx supabase db push
```

### 2. Test the Fix
```sql
-- Run the test script to verify column names
-- Contents of /scripts/test-rpc-column-fix.sql
```

### 3. Enable RPC Feature Flag
```bash
# Add to .env.local
NEXT_PUBLIC_USE_RPC_REGISTRATION=true
```

### 4. Test Registration Flow
1. Create a new registration through the UI
2. Verify it creates successfully without errors
3. Check that confirmation number is auto-generated
4. Verify payment status updates work correctly

## Benefits of RPC Approach
- **Atomic Operations**: All inserts happen in a single transaction
- **Better Error Handling**: Rollback on any failure
- **Auto-generated Fields**: Confirmation numbers via triggers
- **Consistent Data**: No partial registrations
- **Performance**: Single database round-trip

## Rollback Plan
If issues occur:
1. Set `NEXT_PUBLIC_USE_RPC_REGISTRATION=false` 
2. The code will fall back to direct inserts
3. Both paths store the same data

## Next Steps After Migration
1. Monitor for any errors in production
2. Remove direct insert path after RPC proves stable
3. Consider adding more RPC functions for other operations (updates, cancellations)