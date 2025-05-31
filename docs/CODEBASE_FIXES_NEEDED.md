# Codebase Fixes Needed

## Summary
The database uses correct snake_case column naming. The codebase needs to be updated to use these column names instead of the incorrect lowercase no-underscore names.

## Files That Need Fixing

### 1. `/app/api/registrations/route.ts`

**Current (WRONG):**
```typescript
const attendeeRecord: TablesInsert<'attendees'> = {
  attendeeid: newAttendeeId,
  registrationid: newRegistrationId, 
  attendeetype: attendeeTypeForDb,
  eventtitle: eventTitle || null,
  dietaryrequirements: attendee.dietaryRequirements || null,
  specialneeds: attendee.specialNeeds || null,
  contactpreference: contactPreferenceForDb,
  relationship: attendee.relationship || null,
  relatedattendeeid: attendee.partnerOf || attendee.related_attendee_id || null,
  person_id: attendee.person_id || attendee.personId || null
};
```

**Should Be:**
```typescript
const attendeeRecord: TablesInsert<'attendees'> = {
  attendee_id: newAttendeeId,
  registration_id: newRegistrationId, 
  attendee_type: attendeeTypeForDb,
  event_title: eventTitle || null,
  dietary_requirements: attendee.dietaryRequirements || null,
  special_needs: attendee.specialNeeds || null,
  contact_preference: contactPreferenceForDb,
  relationship: attendee.relationship || null,
  related_attendee_id: attendee.partnerOf || attendee.related_attendee_id || null,
  person_id: attendee.person_id || attendee.personId || null,
  
  // These columns DO exist - remove the incorrect comment
  is_primary: attendee.isPrimary,
  is_partner: attendee.isPartner, // This is a UUID, not boolean
  has_partner: !!attendee.partner,
  title: personTitle,
  first_name: attendee.firstName,
  last_name: attendee.lastName,
  suffix: personSuffix,
  email: includeContactDetails ? attendee.primaryEmail : null,
  phone: includeContactDetails ? attendee.primaryPhone : null
};
```

### 2. Update references in SQL queries

Any place in the codebase that references `attendeeid` should use `attendee_id`, etc.

### 3. `/lib/api/registration-rpc.ts`

The RPC transformation code is already correct - it uses snake_case. The issue is in the direct insert code.

## Database Changes Made

The migration file `20250602_fix_datatypes_to_match_codebase.sql` ensures:

1. **is_partner** is UUID (not boolean) with FK to attendees(attendee_id)
2. **event_title** column exists in attendees table
3. All enum values the codebase uses are available:
   - registration_type: 'individuals', 'groups', 'officials' 
   - attendee_type: 'ladypartner', 'guestpartner'
   - attendee_contact_preference: 'directly', 'primaryattendee', 'mason', 'guest', 'providelater'
4. Tickets status constraint accepts: 'available', 'reserved', 'sold', 'used', 'cancelled'
5. All columns that the codebase expects exist in the attendees table

## Action Items

1. **Fix the registration API** to use correct column names
2. **Remove misleading comments** about missing columns
3. **Regenerate TypeScript types** if needed to ensure they match the database
4. **Test the registration flow** after fixes are applied