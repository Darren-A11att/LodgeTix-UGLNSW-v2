# PRD: Fix Lodge Organisation ID Flow

## Executive Summary

The lodge selection component already fetches and attempts to pass the organisation_id, but it's being dropped in the data flow. This PRD outlines a simple fix to capture and use this existing data for Stripe Connect.

## Problem Statement

When a user selects a lodge during registration:
- The `LodgeSelection` component has access to `organisation_id`
- It passes this as the third parameter to its onChange handler
- The parent component (`LodgesForm`) ignores this parameter
- The organisation_id is lost and never stored in registration state
- Payment cannot use Stripe Connect because we don't have the organisation_id

## Current Implementation

### What Works
```typescript
// LodgeSelection.tsx - ALREADY PASSES organisation_id
onChange(lodge.lodge_id, displayValue, lodge.organisation_id);
```

### What's Broken
```typescript
// LodgesForm.tsx - IGNORES organisation_id
const handleLodgeChange = useCallback((lodgeId: string, lodgeName: string) => {
  updateLodgeDetails({
    lodge_id: lodgeId,
    lodgeName,
  });
}, [updateLodgeDetails]);
```

## Solution

### Step 1: Update LodgeDetails Interface
```typescript
// registrationStore.ts
export interface LodgeDetails {
  grand_lodge_id: string;
  lodge_id: string;
  lodgeName: string;
  organisation_id?: string; // ADD THIS
}
```

### Step 2: Update Handler in LodgesForm
```typescript
// LodgesForm.tsx
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

### Step 3: Get Connected Account ID
```typescript
// When lodge is selected, fetch the organisation's stripe_onbehalfof
const getConnectedAccountId = async (organisationId: string) => {
  const { data } = await supabase
    .from('organisations')
    .select('stripe_onbehalfof')
    .eq('id', organisationId)
    .single();
  
  return data?.stripe_onbehalfof;
};
```

### Step 4: Pass to Registration API
```typescript
// In the registration submission
const registrationData = {
  // ... other fields
  connectedAccountId: await getConnectedAccountId(lodgeDetails.organisation_id)
};
```

## Implementation Tasks

### Immediate Fix (2-4 hours)
1. [ ] Add `organisation_id` to `LodgeDetails` interface
2. [ ] Update `handleLodgeChange` to accept third parameter
3. [ ] Store organisation_id in registration state
4. [ ] Test lodge selection saves organisation_id

### Payment Integration (4-6 hours)
1. [ ] Create helper to fetch organisation's `stripe_onbehalfof`
2. [ ] Pass `connectedAccountId` to registration API
3. [ ] Update payment processing to use connected account
4. [ ] Test end-to-end payment flow

### Polish (2-3 hours)
1. [ ] Handle lodges without organisations gracefully
2. [ ] Add loading state for organisation fetch
3. [ ] Display selected organisation in summary
4. [ ] Add organisation details to confirmation

## Edge Cases

1. **Lodge without Organisation**
   - Some lodges might not have an organisation_id
   - Payment should fall back to platform account
   - Add warning in UI

2. **Organisation without Stripe Account**
   - Organisation exists but no `stripe_onbehalfof`
   - Allow registration to continue
   - Queue for manual processing

3. **API Optimization**
   - Consider including `organisation.stripe_onbehalfof` in lodge query
   - Reduces extra API call
   - Improves performance

## Success Criteria

1. **Technical Success**
   - Organisation_id captured for all lodge selections
   - Connected account ID passed to payment API
   - Stripe Connect transfers working

2. **User Experience**
   - No additional steps for users
   - Seamless lodge selection as before
   - Clear indication of payment recipient

3. **Business Success**
   - Automatic fund distribution to lodges
   - Reduced manual reconciliation
   - Platform fees correctly allocated

## Testing Plan

1. **Unit Tests**
   - Test organisation_id flows through state
   - Test API includes all fields
   - Test payment with connected account

2. **Integration Tests**
   - Select lodge → Verify organisation_id stored
   - Complete registration → Verify payment routes correctly
   - Test with and without organisation

3. **Manual Testing**
   - Test various lodges
   - Verify Stripe dashboard shows transfers
   - Test edge cases

## Rollout Plan

1. **Phase 1**: Update data flow (no user impact)
2. **Phase 2**: Enable Stripe Connect for new registrations
3. **Phase 3**: Backfill existing registrations if needed

## Conclusion

This is a surgical fix that completes the Stripe Connect integration by properly capturing data that's already available. No new UI components needed - just connecting the existing dots.