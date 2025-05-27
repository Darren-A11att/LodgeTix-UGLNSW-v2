# Issue: Event Slug Passed as UUID to Database

**Status:** 🔴 RED  
**Severity:** Critical  
**Category:** State Management / Data Flow

## Problem Description
The registration flow was passing event slugs (from URL) directly as event IDs to the database, causing foreign key constraint violations.

## Evidence
- Error: "error-event" UUID database errors in registration
- Tickets page passed `params.id` (actually a slug) directly to RegistrationWizard
- Registration API expects UUID for event_id field
- Recent fix in commit 1d2a6fb addressed this issue

## Impact
- **CRITICAL**: Registration creation fails completely
- Database foreign key constraint violation
- Users cannot complete registration process
- Error message: "Invalid UUID" or foreign key violation

## Root Cause
The `/events/[id]/tickets` route receives a slug in the URL but was passing it directly as eventId without converting to UUID first. The registration store and API expect UUIDs.

## Current Fix (Already Applied)
The issue was fixed by:
1. Fetching event by slug to get UUID
2. Passing UUID to RegistrationWizard
3. Adding validation to reject non-UUID values

## Additional Safeguards Needed

### 1. Add UUID Validation in Store
```typescript
// In registrationStore.ts
setCurrentEvent: (eventId: string, eventSlug: string) => {
  if (!isValidUUID(eventId)) {
    console.error('Invalid UUID provided for eventId:', eventId);
    return;
  }
  set({ currentEventId: eventId, currentEventSlug: eventSlug });
}
```

### 2. Type Safety
```typescript
// Create branded types
type EventUUID = string & { __brand: 'EventUUID' };
type EventSlug = string & { __brand: 'EventSlug' };

// Force explicit conversion
function toEventUUID(id: string): EventUUID {
  if (!isValidUUID(id)) throw new Error('Invalid UUID');
  return id as EventUUID;
}
```

### 3. Consistent Naming
- Routes using slugs should be named `[slug]` not `[id]`
- Variables should clearly indicate type: `eventUuid` vs `eventSlug`

## Verification Steps
```bash
# Test registration flow
1. Navigate to /events/grand-proclamation-2025
2. Click Register/Get Tickets
3. Open DevTools > Network
4. Complete registration
5. Check POST /api/registrations payload
6. Verify eventId is a UUID, not slug

# Check logs for warnings
grep "non-UUID eventId" /path/to/logs
```