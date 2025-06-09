# TODO: Capture Organisation ID and Connected Account ID in Lodge Registrations

## Overview

This TODO list outlines all changes needed to properly capture:
1. The lodge's organisation_id (WHO is registering)
2. The function organiser's connected_account_id (WHO gets the money)

## Current State

### What's Working
- ✅ Lodge selection passes organisation_id as 3rd parameter
- ✅ Payment flow correctly determines connected_account_id from function organiser
- ✅ Stripe payments use transfer_data with correct connected account
- ✅ Database has all necessary columns

### What's Missing
- ❌ Lodge's organisation_id is dropped in LodgesForm handler
- ❌ Organisation_id not stored in registration state or database
- ❌ Connected_account_id used for payment but not stored in registration record

## Proposed Changes

### 1. Frontend Changes - Capture Lodge's Organisation ID

#### 1.1 Update Registration Store Types
**File**: `store/registrationStore.ts`

```typescript
// Current
export interface LodgeDetails {
  grand_lodge_id: string;
  lodge_id: string;
  lodgeName: string;
}

// Proposed
export interface LodgeDetails {
  grand_lodge_id: string;
  lodge_id: string;
  lodgeName: string;
  organisation_id?: string; // ADD THIS
}
```

#### 1.2 Update LodgesForm Handler
**File**: `components/register/Forms/attendee/LodgesForm.tsx`

```typescript
// Current (line ~200)
const handleLodgeChange = useCallback((lodgeId: string, lodgeName: string) => {
  updateLodgeDetails({
    lodge_id: lodgeId,
    lodgeName,
  });
}, [updateLodgeDetails]);

// Proposed
const handleLodgeChange = useCallback(
  (lodgeId: string, lodgeName: string, organisationId?: string) => {
    updateLodgeDetails({
      lodge_id: lodgeId,
      lodgeName,
      organisation_id: organisationId, // ADD THIS
    });
  },
  [updateLodgeDetails]
);
```

#### 1.3 Update Lodge Registration API Call
**File**: `components/register/RegistrationWizard/hooks/useLodgeRegistration.ts` (or wherever the API call is made)

```typescript
// Add organisation_id to the registration data
const registrationData = {
  // ... existing fields
  organisation_id: lodgeDetails.organisation_id, // ADD THIS
  // ... rest of fields
};
```

### 2. Backend Changes - Store Both IDs

#### 2.1 Update Lodge Registration RPC
**File**: Create new migration or update existing RPC

```sql
-- The RPC should accept and store organisation_id
-- Current: upsert_lodge_registration already has organisation_id parameter
-- Just need to ensure it's being passed and used
```

#### 2.2 Update API Route to Accept Organisation ID
**File**: `/app/api/registrations/lodge/route.ts`

```typescript
// Ensure the API accepts organisation_id from frontend
const {
  // ... other fields
  organisation_id, // ADD THIS if not already present
  // ... other fields
} = registrationData;

// Pass to RPC
const { data, error } = await supabase.rpc('upsert_lodge_registration', {
  // ... other parameters
  p_organisation_id: organisation_id, // ADD THIS
  // ... other parameters
});
```

### 3. Payment Flow Changes - Store Connected Account ID

#### 3.1 Capture Connected Account ID During Payment
**File**: `/app/api/registrations/[id]/payment/route.ts`

```typescript
// Current: The code already fetches connectedAccountId for Stripe
// We need to store it in the registration record after successful payment

// After successful payment confirmation:
await supabase
  .from('registrations')
  .update({ 
    connected_account_id: connectedAccountId,
    payment_status: 'completed',
    // ... other updates
  })
  .eq('id', registrationId);
```

#### 3.2 Alternative: Store Connected Account ID During Registration Creation
**File**: `/app/api/registrations/lodge/route.ts`

```typescript
// When creating the registration, look up the function's connected account
const { data: functionData } = await supabase
  .from('functions')
  .select('organisations!organiser_id(stripe_onbehalfof)')
  .eq('id', functionId)
  .single();

const connectedAccountId = functionData?.organisations?.stripe_onbehalfof;

// Pass to RPC
const { data, error } = await supabase.rpc('upsert_lodge_registration', {
  // ... other parameters
  p_connected_account_id: connectedAccountId, // Already supported by RPC
});
```

## Implementation Steps

### Phase 1: Frontend Changes (2-3 hours)
1. [ ] Update `LodgeDetails` interface in registration store
2. [ ] Update `handleLodgeChange` in `LodgesForm.tsx` to accept organisation_id
3. [ ] Verify organisation_id flows through to API call
4. [ ] Test that lodge selection properly stores organisation_id

### Phase 2: Backend Changes (2-3 hours)
1. [ ] Ensure lodge registration API accepts organisation_id
2. [ ] Verify RPC stores organisation_id in registrations table
3. [ ] Add logic to look up function's connected_account_id
4. [ ] Store connected_account_id during registration or payment

### Phase 3: Testing (2 hours)
1. [ ] Test complete lodge registration flow
2. [ ] Verify organisation_id is stored for lodge registrations
3. [ ] Verify connected_account_id is stored after payment
4. [ ] Check Stripe dashboard shows correct transfers
5. [ ] Test edge cases (no organisation, no connected account)

## Validation Queries

```sql
-- Check if data is being captured correctly
SELECT 
  r.id,
  r.registration_type,
  r.organisation_id as lodge_organisation_id,
  r.connected_account_id,
  l.name as lodge_name,
  o1.name as lodge_organisation_name,
  o2.name as function_organiser_name,
  o2.stripe_onbehalfof
FROM registrations r
LEFT JOIN lodges l ON r.lodge_id = l.id
LEFT JOIN organisations o1 ON r.organisation_id = o1.id
LEFT JOIN events e ON r.event_id = e.id
LEFT JOIN organisations o2 ON e.organiser_id = o2.id
WHERE r.registration_type = 'lodge'
ORDER BY r.created_at DESC;
```

## Success Criteria

1. **Lodge Organisation Tracking**
   - Every new lodge registration has organisation_id populated
   - Can query which organisation submitted each registration

2. **Payment Routing**
   - connected_account_id matches the Stripe transfer destination
   - Can reconcile payments with database records

3. **No User Impact**
   - Registration flow remains unchanged for users
   - No additional steps or complexity

## Risk Mitigation

1. **Missing Organisation ID**
   - Some lodges might not have organisation_id
   - Log warning but allow registration to continue
   - Can be updated later via admin tools

2. **Missing Connected Account**
   - Function organiser might not have Stripe account
   - Payment falls back to platform account
   - Flag for manual processing

3. **Data Migration**
   - Existing registrations won't have these fields
   - Create separate migration script if needed
   - Not critical for historical data

## Notes

- The RPC `upsert_lodge_registration` already supports both organisation_id and connected_account_id parameters
- The payment flow already determines the correct connected_account_id
- Main work is connecting the existing pieces, not building new functionality