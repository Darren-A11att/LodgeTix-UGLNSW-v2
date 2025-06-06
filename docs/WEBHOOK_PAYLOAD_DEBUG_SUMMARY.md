# Webhook Payload Format Debug Summary

## Issue Identified
The edge function `generate-confirmation` was failing with 500 errors due to a mismatch between the webhook payload format being sent by the database trigger and the format expected by the edge function.

## Root Cause Analysis

### Database Trigger Actual Payload Format
The database trigger function `should_generate_confirmation()` was sending a flat JSON object:
```json
{
  "status": "completed",
  "trigger": "payment_completion", 
  "timestamp": "2025-06-06T05:53:00.196457+00:00",
  "old_status": "pending",
  "function_id": "eebddef5-6833-43e3-8d32-700508b1c089",
  "payment_status": "completed", 
  "registration_id": "2392c148-ffa0-4d17-bbec-44044853b8af",
  "registration_type": "individuals",
  "old_payment_status": "pending"
}
```

### Edge Function Expected Format
The edge function expected a standard Supabase webhook payload structure:
```typescript
{
  type: 'UPDATE',
  table: 'registrations',
  record: {
    id: string,
    status: string,
    payment_status: string,
    registration_type: string,
    // ... other fields
  },
  old_record?: { ... },
  schema: string
}
```

### The Mismatch
1. **Missing wrapper structure**: Edge function tried to access `payload.record.id` but payload was flat
2. **Field access errors**: Code tried to access `payload.record.registration_type` but it was at `payload.registration_type`
3. **Missing metadata**: No `payload.type` or `payload.table` fields for validation

## Solutions Implemented

### 1. Updated Edge Function (✅ DEPLOYED)
- Added `normalizeWebhookPayload()` function to handle both formats
- Enhanced logging to show raw payload for debugging
- Maintained backward compatibility with standard webhook format
- Added support for both `id` and `registration_id` field names
- Updated TypeScript types to handle format variations

### 2. Database Trigger Fix (Migration Created)
Created migration `20250608000022_fix_webhook_payload_format.sql` to:
- Update `should_generate_confirmation()` function to send proper webhook format
- Include both `record` and `old_record` nested objects
- Add `type`, `table`, and `schema` fields as expected
- Maintain logging for debugging purposes

## Files Modified

### Edge Function
- `/supabase/functions/generate-confirmation/index.ts` - Added payload normalization
- `/supabase/functions/generate-confirmation/types/webhook.ts` - Updated types

### Database Migration
- `/supabase/migrations/20250608000022_fix_webhook_payload_format.sql` - Fixed trigger

### Testing
- `/test-webhook-payload.js` - Test script for both payload formats

## Verification Needed

1. **Apply Database Migration**: Run the migration to fix the database trigger
2. **Test Real Webhook**: Trigger an actual registration completion to test
3. **Monitor Logs**: Check edge function logs for proper payload processing
4. **Verify Email Generation**: Confirm confirmation emails are sent successfully

## Next Steps

1. Apply the database migration: `npx supabase db push`
2. Test with a real registration completion
3. Monitor webhook_logs table for successful processing
4. Remove test files after verification

## Current Status
- ✅ Edge function updated with payload normalization (DEPLOYED)
- ⏳ Database migration created (NEEDS TO BE APPLIED) 
- ⏳ Real-world testing needed
- ⏳ Webhook logs monitoring needed

The edge function should now handle both the current broken format and the corrected format, providing a smooth transition path.