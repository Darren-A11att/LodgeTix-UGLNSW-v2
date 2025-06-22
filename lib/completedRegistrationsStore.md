# Completed Registrations Store

## Overview
The `completedRegistrationsStore` is a separate Zustand store that tracks all completed registrations with minimal but critical information. This store is persisted to localStorage with **user-specific encryption** and automatically cleans up expired registrations.

## Purpose
- Keep a local record of completed registrations for 90 days after the function start date
- Allow users to view their confirmation details if they return to the confirmation page
- Track confirmation email status and delivery
- Separate completed registrations from the main registration store to avoid confusion with drafts

## Data Structure

### CompletedRegistration
```typescript
{
  completedAt: number;              // Timestamp when registration was completed
  registrationId: string;           // Unique registration ID
  functionId: string;               // Function UUID
  functionStartDate: string;        // ISO date string of function start
  confirmationNumber: string;       // Confirmation number (e.g., "GEN-2024-ABC123")
  paymentReference: {
    provider: string;               // Payment provider (e.g., 'square', 'stripe')
    paymentId?: string;             // Provider-specific payment ID
    paymentIntentId?: string;       // Stripe payment intent
    transactionId?: string;         // Generic transaction ID
  };
  paymentStatus: string;            // Status from payment provider
  userId: string;                   // Anonymous or authenticated user ID
  confirmationEmails: Array<{       // Track all confirmation email attempts
    status: number;                 // HTTP status code (e.g., 200)
    emailId: string;                // Email ID from response
    to: string;                     // Email address sent to
    sentAt: number;                 // Timestamp when sent
  }>;
  expiresAt: number;                // Auto-calculated: 90 days after function start
  metadata?: {                      // Rich metadata for support/debugging
    registrationType: 'individuals' | 'lodge' | 'delegation';
    primaryAttendee?: {
      title?: string;
      firstName: string;
      lastName: string;
      rank?: string;              // Mason-specific
      grandRank?: string;         // Mason-specific
      isGrandOfficer?: boolean;   // Mason-specific
      grandOffice?: string;       // Mason-specific
      attendeeType: string;
    };
    attendees: Array<{
      attendeeId: string;
      title?: string;
      firstName: string;
      lastName: string;
      attendeeType: string;
      rank?: string;
      selectedTickets: Array<{
        ticketId: string;
        ticketName: string;
        price: number;
        isPackage: boolean;
      }>;
    }>;
    totalAttendees: number;
    totalAmount: number;
    subtotal: number;
  };
}
```

## Implementation Locations

### 1. Individual Registrations
- **File**: `components/register/RegistrationWizard/Steps/payment-step.tsx`
- **When**: After successful payment and confirmation number generation
- **Line**: ~935

### 2. Lodge Registrations
- **File**: `components/register/RegistrationWizard/Steps/LodgeRegistrationStep.tsx`
- **When**: After successful payment via lodge-specific API
- **Line**: ~265

### 3. Delegation Registrations
- **File**: Uses same payment step as individuals
- **When**: After successful payment and confirmation number generation

### 4. Confirmation Email Tracking
- **File**: `components/register/confirmation/client-confirmation-page.tsx`
- **When**: After successful email send via API
- **Line**: ~193

## Store Actions

1. **addCompletedRegistration**: Add or update a completed registration
2. **addConfirmationEmail**: Track email send attempts
3. **getRegistrationByConfirmation**: Find by confirmation number
4. **getRegistrationById**: Find by registration ID
5. **clearExpiredRegistrations**: Remove registrations older than 90 days past function date
6. **clearAllRegistrations**: Remove all registrations (for testing/reset)

## Auto-Cleanup
- Registrations expire 90 days after the function start date
- Expired registrations are automatically cleared on store rehydration
- Manual cleanup can be triggered with `clearExpiredRegistrations()`

## Security & Encryption

### Encryption Details
- **Encryption Algorithm**: AES-256 (via CryptoJS)
- **Encryption Key**: SHA256 hash of user ID + app-specific salt
- **Key Derivation**: `SHA256(userId + 'lodgetix-2024-secure-salt')`
- **Fallback**: Device-specific key if no user ID available

### localStorage Key
- **Key**: `lodgetix-completed-registrations`
- **Storage Format**: AES-encrypted JSON string
- **Persisted Fields**: All fields in the CompletedRegistration interface

### Security Benefits
1. **User-Specific Encryption**: Each user's data encrypted with their own key
2. **Shared Device Protection**: Other users on same device cannot access data
3. **Automatic Key Rotation**: Key changes when user logs out/in
4. **Graceful Migration**: Unencrypted data automatically encrypted on next save

## Usage Example
```typescript
import { useCompletedRegistrationsStore } from '@/lib/completedRegistrationsStore';

// Add a completed registration
const { addCompletedRegistration } = useCompletedRegistrationsStore.getState();
addCompletedRegistration({
  completedAt: Date.now(),
  registrationId: 'reg-123',
  functionId: 'func-456',
  functionStartDate: '2024-12-25',
  confirmationNumber: 'CONF-2024-001',
  paymentReference: {
    provider: 'square',
    paymentId: 'sq_123'
  },
  paymentStatus: 'completed',
  userId: 'user-789',
  confirmationEmails: []
});

// Track email sent
const { addConfirmationEmail } = useCompletedRegistrationsStore.getState();
addConfirmationEmail('reg-123', {
  status: 200,
  emailId: 'email-456',
  to: 'user@example.com',
  sentAt: Date.now()
});

// Find registration by confirmation number
const registration = useCompletedRegistrationsStore.getState()
  .getRegistrationByConfirmation('CONF-2024-001');
```

## Benefits
1. **Separation of Concerns**: Completed registrations don't interfere with draft recovery
2. **Persistent History**: Users can view confirmations even after starting new registrations
3. **Automatic Cleanup**: Old data is automatically removed
4. **Email Tracking**: Complete audit trail of confirmation emails
5. **Multi-Provider Support**: Works with Square, Stripe, or future payment providers