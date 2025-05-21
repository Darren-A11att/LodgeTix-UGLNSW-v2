# Client-Side Integration Plan

## Overview

This document outlines the client-side changes needed to integrate with the Supabase registration submission API. The main focus is on modifying the payment step to properly collect and send all necessary data to our API endpoint.

## Current Implementation Analysis

The current implementation in `PaymentStepUpdated.tsx` includes a placeholder `saveRegistration` function that makes a POST request to `/api/registrations` with the following data:

```typescript
async function saveRegistration(data: any) {
  const response = await fetch('/api/registrations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to save registration');
  }

  return response.json();
}
```

The function is called in the `handlePaymentSuccess` callback:

```typescript
const handlePaymentSuccess = useCallback(async (paymentIntentId: string) => {
  try {
    // Update payment status in store
    setPaymentStatus({
      status: 'completed',
      paymentIntentId,
      amount: total,
      timestamp: new Date().toISOString(),
    });

    // Save registration to database
    await saveRegistration({
      attendees,
      tickets,
      event,
      paymentIntentId,
      amount: total,
    });

    setPaymentSuccess(true);
    
    // Navigate to confirmation after a short delay
    setTimeout(() => {
      onNext();
    }, 1500);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save registration';
    setPaymentError(message);
  }
}, [attendees, tickets, event, total, setPaymentStatus, onNext]);
```

## Required Modifications

### 1. Enhanced `saveRegistration` Function

Update the `saveRegistration` function to include all required data and handle errors better:

```typescript
async function saveRegistration(data: {
  attendees: UnifiedAttendeeData[];
  tickets: any;
  event: any;
  paymentIntentId: string;
  amount: number;
  registrationType: RegistrationType;
  agreeToTerms: boolean;
}) {
  try {
    const response = await fetch('/api/registrations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save registration');
    }

    return response.json();
  } catch (error) {
    console.error('Registration submission error:', error);
    throw error;
  }
}
```

### 2. Update `handlePaymentSuccess` Callback

Enhance the callback to include all necessary data:

```typescript
const handlePaymentSuccess = useCallback(async (paymentIntentId: string) => {
  try {
    // Update payment status in store
    setPaymentStatus({
      status: 'completed',
      paymentIntentId,
      amount: total,
      timestamp: new Date().toISOString(),
    });

    // Save registration to database with complete data
    const result = await saveRegistration({
      attendees,
      tickets,
      event,
      paymentIntentId,
      amount: total,
      registrationType: useRegistrationStore.getState().registrationType!,
      agreeToTerms: useRegistrationStore.getState().agreeToTerms,
      // Include any additional data needed by the API
    });

    // Store confirmation number in registration store
    if (result.confirmationNumber) {
      useRegistrationStore.getState().setConfirmationNumber(result.confirmationNumber);
    }

    setPaymentSuccess(true);
    
    // Navigate to confirmation after a short delay
    setTimeout(() => {
      onNext();
    }, 1500);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save registration';
    setPaymentError(message);
    
    // Also update store with error
    setPaymentStatus({
      status: 'failed',
      error: message,
      timestamp: new Date().toISOString(),
    });
  }
}, [attendees, tickets, event, total, setPaymentStatus, onNext]);
```

### 3. Add Data Validation Before Submission

Add client-side validation before sending the data:

```typescript
// Add this before the fetch call in saveRegistration
function validateRegistrationData(data: any) {
  // Ensure we have a primary attendee
  if (!data.attendees.some(a => a.isPrimary)) {
    throw new Error('No primary attendee specified');
  }
  
  // Ensure each attendee has required fields
  for (const attendee of data.attendees) {
    if (!attendee.firstName || !attendee.lastName) {
      throw new Error('All attendees must have a name');
    }
    
    if (attendee.isPrimary && !attendee.primaryEmail) {
      throw new Error('Primary attendee must have an email');
    }
  }
  
  // Ensure we have payment data
  if (!data.paymentIntentId || !data.amount) {
    throw new Error('Payment information is missing');
  }
  
  // Ensure we have event data
  if (!data.event || !data.event.id) {
    throw new Error('Event information is missing');
  }
  
  // Validate ticket assignments
  if (!data.tickets || !data.tickets.ticketAssignments) {
    throw new Error('Ticket information is missing');
  }
  
  return true;
}

// Use it in saveRegistration
validateRegistrationData(data);
```

### 4. Add Loading States

Enhance the UI to show loading states during submission:

```typescript
const [isSubmitting, setIsSubmitting] = useState(false);

// Update handlePaymentSuccess
const handlePaymentSuccess = useCallback(async (paymentIntentId: string) => {
  setIsSubmitting(true);
  try {
    // ... existing code ...
  } catch (error) {
    // ... error handling ...
  } finally {
    setIsSubmitting(false);
  }
}, [/* dependencies */]);

// Update UI to show loading state
{isSubmitting && (
  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
    <Loader2 className="w-8 h-8 animate-spin text-masonic-gold" />
    <span className="ml-2 text-masonic-navy font-medium">Saving registration...</span>
  </div>
)}
```

### 5. Enhance Confirmation Display

Update the confirmation step to display the registration ID and confirmation number:

```typescript
// In the ConfirmationStep component
const { 
  attendees,
  tickets,
  event,
  registrationType,
  paymentStatus,
  clearRegistration,
  confirmationNumber,  // Added this
} = useRegistrationStore();

// Update the Badge display
<Badge variant="success" className="text-lg px-4 py-2">
  Confirmation: {confirmationNumber || registrationId || 'REG-' + Date.now()}
</Badge>
```

## Implementation Steps

1. Create a new client-side service in `/lib/services/registration-service.ts` to handle the API communication
2. Update the `PaymentStepUpdated.tsx` component to use this service
3. Add validation functions for data integrity
4. Enhance error handling and user feedback
5. Update the ConfirmationStep component to display registration details
6. Add unit tests for the new service and updated components

## Error Handling Strategy

1. **Network Errors**: Handle fetch failures with clear messaging
2. **Validation Errors**: Display specific validation error messages
3. **Server Errors**: Provide appropriate user feedback
4. **Recovery Options**: Allow users to retry submission when possible
5. **Logging**: Log errors for debugging and monitoring

## User Experience Considerations

1. **Loading States**: Clear indication when processing
2. **Error Messages**: User-friendly error messages
3. **Success Feedback**: Confirmation animations/messaging
4. **Retry Options**: Allow users to retry failed submissions
5. **Fallback Options**: Provide alternative contact methods if submission fails