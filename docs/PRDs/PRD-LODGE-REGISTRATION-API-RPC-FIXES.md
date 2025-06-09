# PRD: Fix Lodge Registration API/RPC to Populate Financial Fields

## Overview
Update the Lodge registration API endpoint and RPC function to properly populate all financial and organizational fields during registration creation/update.

## Problem Statement
The current `upsert_lodge_registration` RPC function and API endpoint are not populating critical fields:
- `connected_account_id` (needed for Stripe Connect payment routing)
- `booking_contact_id` (should match customer_id)
- `platform_fee_amount` (needed for financial reporting)

These are application-level concerns that should be handled in the API/RPC layer, not database triggers.

## Current State Analysis

### API Endpoint (`/app/api/registrations/lodge/route.ts`)
- Receives lodge registration data including `lodgeDetails.lodge_id`
- Passes data to RPC function
- Does not lookup organisation's Stripe account

### RPC Function (`upsert_lodge_registration`)
- Sets `organisation_id` from lodge_details (✓)
- Sets `total_amount_paid` and `total_price_paid` (✓)
- Sets `subtotal` and `stripe_fee` (✓)
- Missing: `connected_account_id`, `booking_contact_id`, `platform_fee_amount` (✗)

## Requirements

### Functional Requirements

1. **Populate connected_account_id**
   - In RPC function, after extracting `organisation_id`
   - Query organisations table to get `stripe_onbehalfof`
   - Set `connected_account_id` = `organisations.stripe_onbehalfof`

2. **Set booking_contact_id**
   - In RPC function, set `booking_contact_id` = `customer_id`
   - This maintains consistency with individual registrations

3. **Calculate platform_fee_amount**
   - Use existing platform fee calculation: `MIN(subtotal * 0.02, 20.00)`
   - Store calculated value in `platform_fee_amount` field

4. **Return complete data**
   - RPC should return the populated `connected_account_id` for API response
   - This allows the API to use it for Stripe payment intent creation

### Non-Functional Requirements
1. **Backward Compatibility**: Changes must not break existing integrations
2. **Performance**: Single query to fetch organisation data
3. **Error Handling**: Graceful handling if organisation not found

## Technical Solution

### 1. Update RPC Function
Modify the `upsert_lodge_registration` function to include organisation lookup and field population.

```sql
-- After extracting organisation_id (around line 235)
v_organisation_id := COALESCE(
  (p_lodge_details->>'organisation_id')::uuid,
  (p_lodge_details->>'lodge_id')::uuid
);

-- NEW: Lookup connected account from organisation
DECLARE
  v_connected_account_id TEXT;
  v_platform_fee_amount NUMERIC;
BEGIN
  -- Fetch organisation's Stripe account
  IF v_organisation_id IS NOT NULL THEN
    SELECT stripe_onbehalfof INTO v_connected_account_id
    FROM organisations
    WHERE organisation_id = v_organisation_id;
  END IF;
  
  -- Calculate platform fee (2% capped at $20)
  IF p_subtotal IS NOT NULL AND p_subtotal > 0 THEN
    v_platform_fee_amount := LEAST(p_subtotal * 0.02, 20.00);
  END IF;
END;

-- Update INSERT statement to include new fields
INSERT INTO registrations (
  -- ... existing fields ...
  booking_contact_id,
  connected_account_id,
  platform_fee_amount,
  -- ... rest of fields ...
) VALUES (
  -- ... existing values ...
  v_customer_id,  -- booking_contact_id = customer_id
  v_connected_account_id,
  v_platform_fee_amount,
  -- ... rest of values ...
)
```

### 2. Update API Response
Ensure the API returns the connected_account_id for use in payment processing:

```typescript
// In route.ts, after RPC call
return NextResponse.json({
  success: true,
  registrationId: rpcResult.registrationId,
  connectedAccountId: rpcResult.connectedAccountId, // NEW
  registrationData: {
    // ... existing fields ...
    connected_account_id: rpcResult.connectedAccountId // NEW
  }
});
```

### 3. Update RPC Return Type
Modify the RPC to return connected_account_id:

```sql
RETURN jsonb_build_object(
  'success', true,
  'registrationId', v_registration_id,
  'confirmationNumber', v_confirmation_number,
  'customerId', v_customer_id,
  'connectedAccountId', v_connected_account_id, -- NEW
  'organisationName', v_organisation_name
);
```

## Implementation Plan

### Phase 1: RPC Function Update
1. Create migration to update `upsert_lodge_registration` function
2. Add organisation lookup logic
3. Populate all three missing fields
4. Update return structure

### Phase 2: API Updates
1. Update TypeScript types for RPC response
2. Include connected_account_id in API response
3. Update any client code expecting the response

### Phase 3: Testing
1. Test with valid organisation (has stripe_onbehalfof)
2. Test with organisation missing stripe_onbehalfof
3. Test platform fee calculations
4. Test booking_contact_id population
5. Integration test full registration flow

### Phase 4: Migration of Existing Data
1. Create script to update existing lodge registrations
2. Populate missing fields for historical data
3. Verify data integrity

## Success Criteria
1. All new lodge registrations have `connected_account_id` when organisation has `stripe_onbehalfof`
2. All lodge registrations have `booking_contact_id` = `customer_id`
3. Platform fees correctly calculated and stored (2% capped at $20)
4. API returns connected_account_id for payment processing
5. No breaking changes to existing integrations

## Testing Scenarios

### Happy Path
1. Create lodge registration with valid organisation
2. Verify all financial fields populated
3. Verify API returns complete data

### Edge Cases
1. Organisation without stripe_onbehalfof
2. Registration without organisation_id
3. Zero subtotal (no platform fee)
4. Platform fee at cap ($20)

### Error Cases
1. Invalid organisation_id
2. Database connection issues
3. Concurrent registration updates

## Rollback Plan
1. Keep backup of original RPC function
2. Can revert migration if issues found
3. Monitor error rates after deployment

## Future Considerations
1. Make platform fee percentage/cap configurable
2. Support different fee structures per organisation
3. Add audit logging for fee calculations
4. Create admin tools for fee management