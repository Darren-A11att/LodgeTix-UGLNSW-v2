# Issue: No User-Facing Error Feedback

**Status:** 🟡 YELLOW  
**Severity:** Medium  
**Category:** UX / Error Handling

## Problem Description
Errors are logged to console but not displayed to users, leaving them confused when operations fail.

## Evidence
- Toast component exists but rarely used for errors
- API errors return JSON but UI doesn't display them
- Form validation errors shown, but API failures aren't
- Users see loading states that never resolve on error

## Impact
- Users don't know why operations failed
- Can't tell if it's their fault or system issue
- May retry operations that will never succeed
- Increased support tickets
- Poor user experience

## Root Cause
Development focused on console logging for debugging. User-facing error messages were not prioritized.

## Fix Plan

### Immediate Action
1. Add error display to critical flows:
```typescript
// In payment step
catch (error) {
  console.error('Payment failed:', error);
  toast({
    title: "Payment Failed",
    description: error.message || "Please try again or contact support",
    variant: "destructive"
  });
}
```

2. Update loading states to handle errors:
```typescript
const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');
```

### Long-term Solution
1. Standardize error handling:
   - All API calls show toast on failure
   - Loading states have error states
   - Retry buttons where appropriate
   
2. Create error message mapping:
```typescript
const userFriendlyErrors = {
  'stripe_payment_failed': 'Payment could not be processed. Please check your card details.',
  'event_full': 'Sorry, this event is now full.',
  'session_expired': 'Your session has expired. Please refresh the page.'
};
```

3. Add global error interceptor for API calls

## Verification Steps
```bash
# Test each error scenario:
1. Invalid payment details
2. Network offline during registration
3. Session timeout
4. Server errors (500)

# Each should show clear user message
```