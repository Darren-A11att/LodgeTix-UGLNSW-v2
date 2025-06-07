# Attendee Type Enum Fix Summary

## Issue
The application was encountering a database error when creating individual registrations:
```
column "attendee_type" is of type attendee_type but expression is of type text
```

## Root Cause
The frontend was sending capitalized attendee type values (e.g., "Mason", "Guest") while the database enum expects lowercase values ("mason", "guest", "ladypartner", "guestpartner").

## Solution Applied

### 1. Enhanced attendeeType normalization function
Updated the `normalizeAttendeeType` function in `registration-wizard.tsx` to properly handle both capitalized and lowercase variations:

```typescript
const normalizeAttendeeType = (type: string): string => {
  if (!type) return 'guest';
  
  const typeMap: Record<string, string> = {
    'mason': 'mason',
    'guest': 'guest', 
    'ladypartner': 'ladypartner',
    'guestpartner': 'guestpartner',
    // Handle capitalized versions
    'Mason': 'mason',
    'Guest': 'guest',
    'LadyPartner': 'ladypartner',
    'GuestPartner': 'guestpartner'
  };
  
  return typeMap[type] || typeMap[type.toLowerCase()] || 'guest';
};
```

### 2. Applied normalization before API calls
Modified the `saveRegistrationData` function to normalize attendee types before sending to the API:

```typescript
const normalizeAttendeeForAPI = (attendee: any) => ({
  ...attendee,
  attendeeType: normalizeAttendeeType(attendee.attendeeType || 'guest')
});

const registrationData = {
  // ...
  primaryAttendee: normalizeAttendeeForAPI(storeState.attendees.find(att => att.isPrimary)),
  additionalAttendees: storeState.attendees.filter(att => !att.isPrimary).map(normalizeAttendeeForAPI),
  // ...
};
```

## Database Enum Values
The `attendee_type` enum in the database accepts these values:
- `mason`
- `guest`
- `ladypartner`
- `guestpartner`

## Testing
The fix ensures that regardless of how the frontend stores or displays attendee types, the values sent to the database will always be in the correct lowercase enum format.

## Files Modified
- `/components/register/RegistrationWizard/registration-wizard.tsx`

## Date Fixed
January 6, 2025