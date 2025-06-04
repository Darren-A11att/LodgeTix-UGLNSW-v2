# Delegation Registration Function ID Fix

## Issue
When selecting "Official Delegation" as the registration type, users were encountering an error:
- Error message: "No function ID provided to DelegationsForm"
- This occurred in the DelegationsForm component when trying to fetch function data

## Root Cause
1. The registration wizard sets `functionId` in the store during its `useEffect` hook
2. The `AttendeeDetails` component was passing `functionId || ''` to child forms
3. If `functionId` was null/undefined (due to timing), an empty string was passed
4. The `DelegationsForm` component threw an error when receiving an empty string

## Solution
Updated `AttendeeDetails.tsx` to check if `functionId` is available before rendering delegation and lodge forms:

```tsx
case 'delegation':
  // Only render if functionId is available
  if (!functionId) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading delegation registration options...</p>
      </div>
    );
  }
  return (
    <DelegationsForm
      functionId={functionId}
      onComplete={handleContinue}
      fieldErrors={showErrors ? fieldErrorsByAttendee : {}}
    />
  );
```

## Files Modified
- `/components/register/RegistrationWizard/Steps/AttendeeDetails.tsx`
  - Added loading state when `functionId` is not yet available
  - Removed fallback to empty string (`functionId || ''`)
  - Applied same fix to both 'delegation' and 'lodge' registration types

## Testing
The fix ensures that:
1. Users see a loading message while `functionId` is being resolved
2. Forms only render once `functionId` is available
3. No more "No function ID provided" errors occur

## Next Steps
- Monitor for any timing issues where `functionId` takes too long to resolve
- Consider adding a timeout or error state if `functionId` fails to load