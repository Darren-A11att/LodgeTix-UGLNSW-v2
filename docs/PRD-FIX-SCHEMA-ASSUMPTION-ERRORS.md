# PRD: Fix Schema Assumption Errors

## Problem Statement
The registration system is failing because the code assumes database enum types exist with certain names without verifying the actual schema. This is causing runtime errors when the database rejects invalid type casts.

## Objectives
1. Fix the immediate error with contact preference enum type
2. Audit entire codebase for similar schema assumption errors
3. Implement validation to prevent future schema assumption errors
4. Document all database enum types for reference

## Requirements

### Functional Requirements
1. Fix `upsert_individual_registration` to use correct enum type `attendee_contact_preference`
2. Ensure contact creation logic follows business rules:
   - Create contact for primary attendees
   - Create contact if preference is 'directly'
   - Skip contact creation for 'primaryattendee' or 'providelater'
3. Handle enum values case-insensitively (frontend sends mixed case)

### Non-Functional Requirements
1. All database operations must use verified schema types
2. Enum casts must handle case conversion properly
3. Error messages should be meaningful for debugging

## Technical Design

### Database Enum Types
- `attendee_contact_preference`: ['directly', 'primaryattendee', 'mason', 'guest', 'providelater']
- `attendee_type`: ['mason', 'guest', 'ladypartner', 'guestpartner']
- `contact_type`: ['individual', 'organisation']
- `customer_type`: ['booking_contact', 'sponsor', 'donor']
- `payment_status`: ['pending', 'completed', 'failed', 'refunded', etc.]
- `registration_type`: ['individuals', 'groups', 'officials', 'lodge', 'delegation']

### Fixes Required
1. Replace `contact_preference_type` with `attendee_contact_preference`
2. Ensure all enum casts use LOWER() for case-insensitive matching
3. Add validation before database operations
4. Create helper functions for safe enum casting

## Success Criteria
1. Registration completes without enum type errors
2. All enum values are properly validated and cast
3. Contact creation follows business rules correctly
4. No other schema assumption errors in codebase