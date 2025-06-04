# LodgesForm Update Instructions

## Overview
To complete the lodge registration flow, the LodgesForm component needs to be updated to use the new dedicated API endpoint and match the expected request structure.

## Required Changes

### 1. Update the API Endpoint
In the component that submits the lodge registration (likely in the registration wizard or a submit handler):

**Old:**
```typescript
const response = await fetch('/api/registrations', {
  method: 'POST',
  // ...
});
```

**New:**
```typescript
const response = await fetch('/api/registrations/lodge', {
  method: 'POST',
  // ...
});
```

### 2. Update the Request Payload Structure

The new API expects this structure:

```typescript
interface LodgeRegistrationPayload {
  functionId: string;           // Required: Function UUID
  packageId: string;            // Required: Selected package UUID
  tableCount: number;           // Number of packages/tables ordered
  lodgeDetails: {
    lodgeName: string;          // Lodge name
    lodgeNumber?: string;       // Lodge number (optional)
    lodge_id: string;           // Lodge UUID
    grand_lodge_id: string;     // Grand Lodge UUID
    organisation_id?: string;   // Organisation UUID (optional)
  };
  billingDetails: {
    emailAddress: string;       // Required
    firstName: string;          // Required
    lastName: string;           // Required
    title?: string;
    mobileNumber?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    suburb?: string;
    postcode?: string;
    stateTerritory?: {
      code: string;
      name: string;
    };
    country?: {
      code: string;
      name: string;
    };
    dietaryRequirements?: string;
    specialNeeds?: string;
  };
  totalAmount: number;          // Total amount in dollars
  subtotal: number;             // Subtotal amount
  stripeFee: number;            // Stripe processing fee
  paymentIntentId?: string;     // Optional for initial creation
  customerId: string;           // auth.uid() - Required
  agreeToTerms: boolean;        // Terms agreement
  registrationId?: string;      // Optional for draft recovery
}
```

### 3. Remove Attendee-Related Logic

The lodge registration API doesn't handle individual attendees. Remove any code that:
- Creates attendee records
- Manages attendee arrays
- Tracks individual attendee details

### 4. Example Implementation

```typescript
// In your submit handler:
const submitLodgeRegistration = async () => {
  const user = await supabase.auth.getUser();
  if (!user.data.user) {
    throw new Error('User not authenticated');
  }

  const payload = {
    functionId: functionId,
    packageId: selectedPackageId,
    tableCount: packageCount,
    lodgeDetails: {
      lodgeName: lodgeDetails.lodgeName,
      lodgeNumber: lodgeDetails.lodgeNumber,
      lodge_id: lodgeDetails.lodge_id,
      grand_lodge_id: lodgeDetails.grand_lodge_id,
    },
    billingDetails: {
      emailAddress: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      title: customer.title,
      mobileNumber: customer.mobile,
      addressLine1: customer.addressLine1,
      addressLine2: customer.addressLine2,
      suburb: customer.suburb,
      postcode: customer.postcode,
      stateTerritory: customer.stateTerritory,
      country: customer.country,
      dietaryRequirements: customer.dietaryRequirements,
      specialNeeds: customer.additionalInfo,
    },
    totalAmount: calculatedPackageOrder.totalWithFees,
    subtotal: calculatedPackageOrder.totalPrice,
    stripeFee: calculatedPackageOrder.stripeFee,
    customerId: user.data.user.id,
    agreeToTerms: true,
  };

  const response = await fetch('/api/registrations/lodge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Registration failed');
  }

  const result = await response.json();
  return result;
};
```

### 5. Update Error Handling

The new API returns structured error responses:

```typescript
if (!response.ok) {
  const errorData = await response.json();
  // errorData.error contains the error message
  console.error('Lodge registration failed:', errorData.error);
  // Handle specific error cases
  if (response.status === 401) {
    // Authentication error - redirect to login
  } else if (response.status === 400) {
    // Validation error - show form errors
  }
}
```

### 6. Update Success Handling

On successful registration, the API returns:

```typescript
interface SuccessResponse {
  success: true;
  registrationId: string;
  confirmationNumber: string;
  registrationData: {
    registration_id: string;
    confirmation_number: string;
    customer_id: string;
    organisation_name: string;
    table_count: number;
    total_attendees: number;
  };
}
```

## Testing Checklist

1. [ ] Verify authentication is working (user.id is passed as customerId)
2. [ ] Confirm all required fields are populated
3. [ ] Test successful registration creation
4. [ ] Test error handling for missing fields
5. [ ] Verify registration appears in database with customer_id
6. [ ] Test payment flow after registration
7. [ ] Confirm data is stored correctly in customers table

## Common Issues and Solutions

1. **"User not authenticated" error**
   - Ensure you're getting the current user with `supabase.auth.getUser()`
   - Pass `user.id` as `customerId` in the payload

2. **"Complete lodge details are required" error**
   - Ensure `lodgeName` and `lodge_id` are populated
   - Verify the lodge selection is working correctly

3. **"Function ID is required" error**
   - Ensure `functionId` prop is passed to LodgesForm
   - Verify it's a valid UUID format

4. **Registration created but no customer record**
   - Check that the RPC function has been deployed
   - Verify the migrations have been run in order