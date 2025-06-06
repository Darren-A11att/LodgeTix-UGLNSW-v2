# PRD: Fix "Unknown attendee type: mason" Error

## Problem Statement
The application is throwing an error "Unknown attendee type: mason" in the AttendeeWithPartner component when processing attendees during registration. This occurs when switching from delegation to individual registration type.

## Error Details
- **Location**: AttendeeWithPartner.tsx:61:27
- **Context**: useMemo hook for AttendeeFormComponent
- **Trigger**: When registration type is switched and attendees with type 'mason' exist

## Current Behavior
1. User has a delegation registration with attendees of type 'mason'
2. User switches to individual registration type
3. AttendeeWithPartner component encounters 'mason' attendee type
4. Component throws error because it doesn't recognize 'mason' as valid

## Expected Behavior
1. AttendeeWithPartner component should handle all valid attendee types
2. No error should occur when switching between registration types
3. Attendee types should be properly mapped/handled across all forms

## Requirements
1. Identify all valid attendee types in the system
2. Update AttendeeWithPartner component to handle all valid types
3. Ensure consistent attendee type handling across all registration forms
4. Add proper error handling for unknown types

## Technical Findings
1. **Database Schema** (shared/types/database.ts):
   - Valid attendee_type enum values: "mason" | "guest" | "ladypartner" | "guestpartner" (all lowercase)

2. **Registration Store** (lib/registrationStore.ts):
   - Creates attendees with lowercase types: 'mason', 'guest' (matches database)

3. **AttendeeWithPartner Component** (components/register/Forms/attendee/AttendeeWithPartner.tsx):
   - Expects capitalized types: 'Mason', 'Guest'
   - Throws error for unrecognized types

## Root Cause
Case mismatch between database/store (lowercase) and component expectations (capitalized)

## Success Criteria
- No error when switching between registration types
- All attendee types are properly handled
- Graceful fallback for unknown types
- Consistent case handling throughout the application

## TODO Checklist
- [ ] Investigate current attendee type definitions in the codebase
- [ ] Identify where 'mason' type is being set
- [ ] Check AttendeeWithPartner component's type handling logic
- [ ] Determine complete list of valid attendee types
- [ ] Update AttendeeWithPartner to handle all valid types
- [ ] Add tests for all attendee type scenarios
- [ ] Verify fix across all registration flows