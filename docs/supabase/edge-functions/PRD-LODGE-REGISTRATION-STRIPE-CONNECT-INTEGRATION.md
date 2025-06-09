# PRD: Lodge Registration Stripe Connect Integration

## Executive Summary

This PRD outlines the completion of Stripe Connect integration for lodge registrations in the LodgeTix UGLNSW project. While the backend infrastructure and fee calculations are fully implemented, the frontend needs to be enhanced to capture organisation selection and pass connected account IDs through the payment flow.

## Current State Analysis

### ✅ What's Already Implemented

1. **Fee Calculation Infrastructure**
   - Comprehensive fee calculator in `/lib/utils/stripe-fee-calculator.ts`
   - Supports domestic (1.7% + $0.30) and international (3.5% + $0.30) rates
   - Platform fee calculation (2% capped at $20)
   - Geolocation-based fee determination
   - Fee display components showing processing fees to users

2. **Backend Support**
   - Database fields: `booking_contact_id`, `connected_account_id`, `platform_fee_amount`
   - RPC function `upsert_lodge_registration` accepts connected account ID
   - API routes support Stripe Connect parameters
   - Organisation table has `stripe_onbehalfof` field

3. **Payment Processing**
   - Stripe payment intent creation with correct fee calculations
   - Transfer amount calculations for connected accounts
   - Fee transparency for customers

4. **Database Policies**
   - RLS policies allow creation of organisations with type 'lodge'
   - Secure access controls for organisation management

### ❌ What's Missing

1. **Frontend Organisation Management**
   - No organisation selection UI in lodge registration
   - No organisation creation flow
   - Connected account ID not captured or passed

2. **Registration Flow Integration**
   - Registration store doesn't track organisation/connected account
   - Payment step doesn't use connected account ID
   - Missing link between organisation selection and payment

3. **User Experience**
   - No way for lodges to select their organisation
   - No onboarding flow for new organisations
   - Missing organisation management portal

## Problem Statement

Lodge registrations cannot utilise Stripe Connect for automatic fund distribution because:
1. Users cannot select or create their organisation during registration
2. The connected account ID is not captured in the frontend
3. Payments process without Stripe Connect, requiring manual reconciliation

## Solution Overview

### Phase 1: Organisation Selection in Lodge Registration

**Component: OrganisationSelector**
```typescript
interface OrganisationSelectorProps {
  onSelect: (org: Organisation) => void
  currentUserId: string
  allowCreate?: boolean
}
```

Features:
- Dropdown to select existing organisations
- "Create New Organisation" option
- Display organisation details
- Show Stripe Connect status

**Integration Points:**
1. Add to `LodgesForm.tsx` after lodge selection
2. Store selected organisation in registration store
3. Pass `stripe_onbehalfof` as `connectedAccountId`

### Phase 2: Organisation Creation Flow

**Component: CreateOrganisationModal**
```typescript
interface CreateOrganisationData {
  name: string
  abn?: string
  contact_email: string
  contact_phone?: string
  address?: string
}
```

Features:
- Modal form for new organisation
- ABN validation (Australian Business Number)
- Auto-populate from lodge details
- Create organisation with type 'lodge'

**Note:** Stripe Connect onboarding happens post-registration via the organiser portal.

### Phase 3: Registration Store Updates

```typescript
// Add to registrationStore.ts
interface RegistrationState {
  // ... existing fields
  organisationId?: string
  connectedAccountId?: string
}

// Actions
setOrganisation: (org: Organisation) => void
clearOrganisation: () => void
```

### Phase 4: Payment Integration

Update payment flow to:
1. Include `connectedAccountId` in payment data
2. Show platform fee breakdown
3. Display which organisation will receive funds
4. Handle missing connected account gracefully

## Implementation Plan

### Week 1: Organisation Selection
- [ ] Create `OrganisationSelector` component
- [ ] Add organisation queries/hooks
- [ ] Integrate into `LodgesForm`
- [ ] Update registration store

### Week 2: Organisation Creation
- [ ] Create `CreateOrganisationModal` component
- [ ] Implement organisation creation API
- [ ] Add validation and error handling
- [ ] Test RLS policies

### Week 3: Payment Integration
- [ ] Update payment step with connected account
- [ ] Test Stripe Connect payment flow
- [ ] Add organisation details to confirmation
- [ ] Handle edge cases

### Week 4: Testing & Polish
- [ ] End-to-end testing
- [ ] Error scenario handling
- [ ] Performance optimization
- [ ] Documentation updates

## Technical Specifications

### API Changes

**POST /api/registrations/lodge**
No changes needed - already accepts `connectedAccountId`

**POST /api/organisations**
New endpoint for creating organisations:
```typescript
{
  name: string
  type: 'lodge'
  abn?: string
  contact_email: string
  contact_phone?: string
  address?: string
  created_by: string // User ID
}
```

### Database Changes

No schema changes required - all fields exist.

Consider adding:
- Index on `organisations.created_by` for performance
- Audit fields for organisation changes

### Component Architecture

```
LodgesForm
├── Lodge Selection
├── OrganisationSelector (NEW)
│   ├── Dropdown with existing orgs
│   └── Create new option
├── Package Selection
└── Attendee Details

CreateOrganisationModal (NEW)
├── Organisation details form
├── ABN validation
└── Contact information
```

## Success Metrics

1. **Adoption Rate**
   - 80% of lodge registrations use organisation selection
   - 50% of lodges create organisations on first registration

2. **Financial Accuracy**
   - 100% of payments route to correct connected accounts
   - Zero manual reconciliation required

3. **User Experience**
   - Organisation selection adds < 30 seconds to registration
   - 95% success rate for organisation creation

4. **Technical Performance**
   - Organisation queries < 200ms
   - No increase in registration abandonment

## Risk Mitigation

1. **Missing Connected Account**
   - Fallback to platform account
   - Email notification to complete Stripe onboarding
   - Allow registration to continue

2. **Organisation Creation Fails**
   - Allow registration without organisation
   - Queue for manual processing
   - Retry mechanism

3. **Performance Impact**
   - Cache organisation lists
   - Optimize queries with proper indexes
   - Lazy load organisation details

## Future Enhancements

1. **Bulk Organisation Import**
   - CSV upload for multiple lodges
   - Pre-populate from Grand Lodge database

2. **Organisation Management Portal**
   - Update details
   - Manage users
   - View transaction history

3. **Automated Stripe Onboarding**
   - Trigger onboarding email post-registration
   - Track onboarding status
   - Reminder notifications

## Conclusion

This implementation completes the Stripe Connect integration for lodge registrations by adding the missing frontend components. The backend infrastructure is ready, and the fee calculation system is proven. This enhancement will enable automatic fund distribution and eliminate manual reconciliation for lodge events.