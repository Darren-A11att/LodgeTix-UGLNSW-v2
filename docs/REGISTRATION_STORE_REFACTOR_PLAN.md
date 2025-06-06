# Registration Store Refactoring Plan

## Problem Statement
The current registration store uses a `draftId` that doesn't match the `registration_id` in the database. This causes:
1. Mismatch between frontend and backend IDs
2. Need for `finalRegistrationId` workarounds
3. Confusion in the codebase about which ID to use

## Solution
Refactor the registration store to:
1. Use `registrationId` instead of `draftId`
2. Store data in the exact format required by the database
3. Generate the registration ID once and use it consistently

## Database Schema Reference
From the `registrations` table:
```sql
"registration_id" "uuid" NOT NULL,
"customer_id" "uuid",
"registration_date" timestamp with time zone,
"status" character varying(50),
"total_amount_paid" numeric,
"payment_status" "public"."payment_status" DEFAULT 'pending',
"agree_to_terms" boolean DEFAULT false,
"stripe_payment_intent_id" "text",
"primary_attendee_id" "uuid",
"registration_type" "public"."registration_type",
"organisation_id" "uuid",
"function_id" "uuid",
"event_id" "uuid",
"auth_user_id" "uuid",
"booking_contact_id" "uuid",
"subtotal" numeric(10,2),
"stripe_fee" numeric(10,2),
"bill_to_primary_attendee" boolean DEFAULT false
```

## Refactoring Tasks

### 1. Update Registration State Interface
```typescript
export interface RegistrationState {
  // Core registration fields (match database exactly)
  registration_id: string | null;        // was: draftId
  customer_id: string | null;            // auth user id
  function_id: string | null;            // already correct
  event_id: string | null;               // for event-specific registrations
  registration_type: RegistrationType | null;
  status: 'pending' | 'completed' | 'cancelled';  // match DB enum
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  
  // Financial fields
  total_amount_paid: number;
  subtotal: number;
  stripe_fee: number;
  stripe_payment_intent_id: string | null;
  
  // Contact fields
  booking_contact_id: string | null;
  primary_attendee_id: string | null;
  bill_to_primary_attendee: boolean;
  
  // Organization fields
  organisation_id: string | null;
  
  // Terms and confirmation
  agree_to_terms: boolean;
  confirmation_number: string | null;
  
  // UI state (not in DB)
  currentStep: number;
  lastSaved: number | null;
  error: string | null;
  isLoading: boolean;
  anonymousSessionEstablished: boolean;
  
  // Related data
  attendees: AttendeeData[];  // Store in DB format
  tickets: TicketData[];      // Store in DB format
  booking_contact: BookingContact | null;  // Replaces billingDetails
  
  // Actions
  startNewRegistration: (type: RegistrationType) => string; // Returns registration_id
  updateRegistration: (updates: Partial<RegistrationState>) => void;
  // ... other actions
}
```

### 2. Update AttendeeData to Match Database
```typescript
interface AttendeeData {
  attendee_id: string;          // was: attendeeId
  registration_id: string;      
  customer_id: string | null;   // if has account
  contact_id: string | null;    // from contacts table
  attendee_type: 'mason' | 'guest';  // lowercase to match DB
  is_primary: boolean;          // was: isPrimary
  
  // Personal info
  title: string | null;
  first_name: string;           // was: firstName
  last_name: string;            // was: lastName
  email: string | null;
  phone: string | null;
  
  // Mason-specific
  lodge_id: string | null;
  organisation_id: string | null;
  rank: string | null;
  post_nominals: string | null;
  
  // Preferences
  dietary_requirements: string | null;
  special_needs: string | null;
  contact_preference: 'email' | 'phone' | 'post' | null;
  
  // Status
  is_checked_in: boolean;
  created_at: string;
  updated_at: string;
}
```

### 3. Update Action Implementations

#### startNewRegistration
```typescript
startNewRegistration: (type) => {
  const registrationId = generateUUID();
  const customerId = get().customer_id; // From auth
  
  set({
    registration_id: registrationId,
    customer_id: customerId,
    registration_type: type,
    status: 'pending',
    payment_status: 'pending',
    total_amount_paid: 0,
    subtotal: 0,
    stripe_fee: 0,
    attendees: [],
    tickets: [],
    booking_contact: null,
    agree_to_terms: false,
    currentStep: 0,
    error: null,
    isLoading: false
  });
  
  return registrationId;
}
```

### 4. Update API Calls

#### Individual Registration
```typescript
// Instead of creating registrationId in the API route
const registrationData = {
  registrationId: store.registration_id,  // Always provided
  functionId: store.function_id,
  eventId: store.event_id,
  customerId: store.customer_id,
  registrationType: store.registration_type,
  primaryAttendee: store.attendees.find(a => a.is_primary),
  additionalAttendees: store.attendees.filter(a => !a.is_primary),
  tickets: store.tickets,
  totalAmount: store.total_amount_paid,
  subtotal: store.subtotal,
  stripeFee: store.stripe_fee,
  paymentIntentId: store.stripe_payment_intent_id,
  billingDetails: store.booking_contact,
  agreeToTerms: store.agree_to_terms,
  billToPrimaryAttendee: store.bill_to_primary_attendee
};
```

### 5. Migration Steps

1. **Create new store structure** alongside existing one
2. **Add migration function** to convert old state to new format
3. **Update components** to use new field names
4. **Update API routes** to expect registration_id always
5. **Remove finalRegistrationId** workarounds
6. **Clean up old code**

### 6. Benefits

1. **Consistency**: Same ID throughout the entire flow
2. **Simplicity**: No ID translation needed
3. **Type Safety**: Store matches database schema
4. **Predictability**: Frontend controls the ID
5. **Debugging**: Easier to trace registrations

### 7. Implementation Order

1. Update store interface and types
2. Update `startNewRegistration` to generate `registration_id`
3. Update API routes to always expect `registration_id`
4. Update components to use new field names
5. Add migration for existing localStorage data
6. Remove old draftId references

## Notes

- Keep snake_case for all database fields in the store
- Generate all IDs on the frontend using UUID v7
- Store timestamps as ISO strings
- Store amounts as numbers (cents)
- Use database enums exactly as defined