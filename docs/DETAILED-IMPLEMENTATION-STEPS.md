# Detailed Implementation Steps: Capture Organisation and Connected Account IDs

## Overview
This document breaks down every single change needed, file by file, line by line.

---

## Part 1: Frontend Changes - Capture Lodge's Organisation ID

### 1.1 Update the Registration Store Type Definition

**File**: `/store/registrationStore.ts`

**Current Code** (around line 50-60):
```typescript
export interface LodgeDetails {
  grand_lodge_id: string;
  lodge_id: string;
  lodgeName: string;
}
```

**Change To**:
```typescript
export interface LodgeDetails {
  grand_lodge_id: string;
  lodge_id: string;
  lodgeName: string;
  organisation_id?: string;  // <-- ADD THIS LINE
}
```

**Why**: This allows the registration store to hold the organisation_id when a lodge is selected.

---

### 1.2 Update the Lodge Change Handler

**File**: `/components/register/Forms/attendee/LodgesForm.tsx`

**Current Code** (around line 200):
```typescript
const handleLodgeChange = useCallback((lodgeId: string, lodgeName: string) => {
  updateLodgeDetails({
    lodge_id: lodgeId,
    lodgeName,
  });
}, [updateLodgeDetails]);
```

**Change To**:
```typescript
const handleLodgeChange = useCallback(
  (lodgeId: string, lodgeName: string, organisationId?: string) => {
    updateLodgeDetails({
      lodge_id: lodgeId,
      lodgeName,
      organisation_id: organisationId,  // <-- ADD THIS LINE
    });
  },
  [updateLodgeDetails]
);
```

**Why**: The LodgeSelection component is already passing organisationId as the 3rd parameter, but the handler is ignoring it. This change captures that value.

---

### 1.3 Find Where Lodge Registration API is Called

**Need to Search For**: Where the lodge registration is submitted to the API

**Likely Files**:
- `/components/register/RegistrationWizard/Steps/LodgeRegistrationStep.tsx`
- `/components/register/RegistrationWizard/hooks/useLodgeRegistration.ts`
- Or within the payment step

**What to Look For**:
```typescript
// Something like this:
const response = await fetch('/api/registrations/lodge', {
  method: 'POST',
  body: JSON.stringify(registrationData)
});
```

**Change Needed**:
```typescript
const registrationData = {
  // ... existing fields like:
  functionId,
  lodgeId: lodgeDetails.lodge_id,
  grandLodgeId: lodgeDetails.grand_lodge_id,
  // ... other fields
  
  // ADD THIS:
  organisationId: lodgeDetails.organisation_id,
};
```

---

## Part 2: Backend Changes - Accept and Store Organisation ID

### 2.1 Update Lodge Registration API Route

**File**: `/app/api/registrations/lodge/route.ts`

**Current Code** (around line 30-50, in the POST handler):
```typescript
const {
  functionId,
  lodgeId,
  grandLodgeId,
  lodgeName,
  bookingContact,
  packages,
  totalAmount,
  subtotal,
  stripeFee,
  connectedAccountId,
  // ... other fields
} = registrationData;
```

**Change To**:
```typescript
const {
  functionId,
  lodgeId,
  grandLodgeId,
  lodgeName,
  bookingContact,
  packages,
  totalAmount,
  subtotal,
  stripeFee,
  connectedAccountId,
  organisationId,  // <-- ADD THIS LINE
  // ... other fields
} = registrationData;
```

**Then Further Down** (around line 200-250, where RPC is called):
```typescript
const { data: registration, error } = await supabase.rpc('upsert_lodge_registration', {
  p_function_id: functionId,
  p_customer_id: customer.id,
  p_lodge_id: lodgeId,
  p_grand_lodge_id: grandLodgeId,
  p_lodge_name: lodgeName,
  // ... other parameters
  
  // ADD THIS:
  p_organisation_id: organisationId || null,
  
  // ... rest of parameters
});
```

---

## Part 3: Store Connected Account ID (Two Options)

### Option A: Store During Payment (Recommended)

**File**: `/app/api/registrations/[id]/payment/route.ts`

**Current Code** (after successful payment confirmation, around line 150-200):
```typescript
// After: const confirmedIntent = await stripe.paymentIntents.confirm(...)

if (confirmedIntent.status === 'succeeded') {
  // Update registration status
  await supabase
    .from('registrations')
    .update({ 
      payment_status: 'completed',
      payment_date: new Date().toISOString(),
    })
    .eq('id', registrationId);
}
```

**Change To**:
```typescript
if (confirmedIntent.status === 'succeeded') {
  // Update registration with payment status AND connected account
  await supabase
    .from('registrations')
    .update({ 
      payment_status: 'completed',
      payment_date: new Date().toISOString(),
      connected_account_id: connectedAccountId,  // <-- ADD THIS LINE
    })
    .eq('id', registrationId);
}
```

**Note**: The `connectedAccountId` variable should already be available in this scope from when it was looked up for the Stripe payment.

---

### Option B: Store During Registration Creation

**File**: `/app/api/registrations/lodge/route.ts`

**Add This Code** (before calling the RPC, around line 150-200):
```typescript
// Look up the function's connected account
let functionConnectedAccountId = connectedAccountId; // Use provided value if exists

if (!functionConnectedAccountId) {
  // Look up from function's organiser
  const { data: functionData } = await supabase
    .from('functions')
    .select(`
      id,
      organiser_id,
      organisations!functions_organiser_id_fkey (
        id,
        stripe_onbehalfof
      )
    `)
    .eq('id', functionId)
    .single();
    
  functionConnectedAccountId = functionData?.organisations?.stripe_onbehalfof || null;
}

// Then pass to RPC:
const { data: registration, error } = await supabase.rpc('upsert_lodge_registration', {
  // ... other parameters
  p_connected_account_id: functionConnectedAccountId,
  // ... other parameters
});
```

---

## Part 4: Verify RPC Function (Should Already Work)

**File**: Check latest migration files for `upsert_lodge_registration`

**Verify It Has These Parameters**:
```sql
CREATE OR REPLACE FUNCTION upsert_lodge_registration(
  -- ... other parameters
  p_organisation_id UUID DEFAULT NULL,
  p_connected_account_id TEXT DEFAULT NULL,
  -- ... other parameters
)
```

**And Uses Them**:
```sql
INSERT INTO registrations (
  -- ... other columns
  organisation_id,
  connected_account_id,
  -- ... other columns
) VALUES (
  -- ... other values
  p_organisation_id,
  p_connected_account_id,
  -- ... other values
)
```

---

## Part 5: Testing Changes

### 5.1 Test Data Flow in Browser Console

```javascript
// In browser console while on lodge registration:

// 1. Check if organisation_id is in store after selecting lodge:
registrationStore.getState().lodgeDetails

// Should see:
{
  grand_lodge_id: "xxx",
  lodge_id: "yyy",
  lodgeName: "Lodge Name",
  organisation_id: "zzz"  // <-- This should be populated
}
```

### 5.2 Check Network Tab

When submitting registration, check the POST request to `/api/registrations/lodge`:
```json
{
  "functionId": "xxx",
  "lodgeId": "yyy",
  "organisationId": "zzz",  // <-- Should be included
  // ... other fields
}
```

### 5.3 Verify Database After Registration

```sql
-- Check the registration was stored correctly
SELECT 
  id,
  lodge_id,
  organisation_id,  -- Should be populated
  connected_account_id  -- Should be populated after payment
FROM registrations
WHERE id = 'your-test-registration-id';
```

---

## Summary of All Changes

### Files to Modify:
1. `/store/registrationStore.ts` - Add organisation_id to interface (1 line)
2. `/components/register/Forms/attendee/LodgesForm.tsx` - Update handler (2 lines)
3. `[Registration submission location]` - Add organisationId to data (1 line)
4. `/app/api/registrations/lodge/route.ts` - Accept organisationId (2 lines)
5. `/app/api/registrations/[id]/payment/route.ts` - Store connected_account_id (1 line)

### Total Changes: ~7 lines of code across 5 files

### What We're NOT Changing:
- ❌ LodgeSelection component (already passes organisation_id)
- ❌ Database schema (columns exist)
- ❌ RPC function (already accepts parameters)
- ❌ Payment flow (already determines connected account)
- ❌ UI/UX (no visible changes)

This is truly just connecting the dots between existing functionality!