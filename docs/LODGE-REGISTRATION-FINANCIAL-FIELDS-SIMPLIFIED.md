# Lodge Registration Financial Fields - Simplified Implementation

## Summary
Updated the lodge registration API and RPC to properly handle financial fields by accepting them as parameters from the frontend.

## Key Changes

### 1. RPC Function Update
**File**: `supabase/migrations/20250609000004_fix_lodge_registration_financial_fields.sql`

Added new parameter to `upsert_lodge_registration`:
- `p_connected_account_id` - Accepts the Stripe connected account ID from frontend

Updated the function to:
- Set `booking_contact_id = customer_id` 
- Use the provided `connected_account_id` parameter
- Set `includes_processing_fee = true` for all lodge registrations
- Store `stripe_fee` from the frontend (processing fees amount)

### 2. API Update
**File**: `app/api/registrations/lodge/route.ts`

Updated to:
- Accept `connectedAccountId` from request payload
- Pass it to the RPC function as `p_connected_account_id`
- Return it in the response for consistency

## How It Works

The frontend already has the Stripe connected account ID (stripe_onbehalfof) when creating the payment intent. Now it simply passes this same value when creating the registration:

```typescript
// Frontend sends:
{
  functionId: "...",
  packageId: "...",
  connectedAccountId: "acct_XXXXX", // Same value used for Stripe
  stripeFee: 30.61, // Processing fees shown to user
  // ... other fields
}
```

The API passes this to the RPC which stores it directly in the registration.

## Benefits

1. **Simplicity**: No database lookups needed - frontend already has the value
2. **Consistency**: Same connected account ID used for payment and stored in registration
3. **Reliability**: No risk of mismatched values between payment and registration

## Testing

```bash
# Run test script
npm run tsx scripts/test-lodge-registration-financial-fields.ts
```

The test will need to be updated to pass a `connectedAccountId` parameter.

## Deployment

1. Apply the migration:
   ```bash
   supabase migration up
   ```

2. Deploy the updated API code

3. Update frontend to pass `connectedAccountId` when creating lodge registrations

## Fields Summary

- `booking_contact_id` = `customer_id` (set by RPC)
- `connected_account_id` = value from frontend (passed as parameter)
- `stripe_fee` = processing fees from frontend
- `includes_processing_fee` = `true` (always for lodge registrations)