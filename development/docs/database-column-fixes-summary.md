# Database Column Naming Fixes Summary

## Overview
After analyzing the `database.types.ts` file, we identified that the database uses all lowercase column names in several tables, which was causing mismatches with our TypeScript code that was using camelCase.

## Tables with Lowercase Column Names

### 1. `attendees` table
- `attendeeid` (not `attendeeId`)
- `registrationid` (not `registrationId`)
- `attendeetype` (not `attendeeType`)
- `relatedattendeeid` (not `relatedAttendeeId`)
- `contactpreference` (not `contactPreference`)
- `dietaryrequirements` (not `dietaryRequirements`)
- `specialneeds` (not `specialNeeds`)
- `eventtitle` (not `eventTitle`)
- `createdat` (not `createdAt`)
- `updatedat` (not `updatedAt`)

### 2. `masonicprofiles` table
- `masonicprofileid` (not `masonicProfileId`)
- `masonictitle` (not `masonicTitle`)
- `grandrank` (not `grandRank`)
- `grandofficer` (not `grandOfficer`)
- `grandoffice` (not `grandOffice`)
- `lodgeid` (not `lodgeId`)
- `createdat` (not `createdAt`)
- `updatedat` (not `updatedAt`)

### 3. `locations` table
- `locationid` (not `locationId`)
- `placename` (not `placeName`)
- `streetaddress` (not `streetAddress`)
- `postalcode` (not `postalCode`)
- `roomorarea` (not `roomOrArea`)
- `createdat` (not `createdAt`)
- `updatedat` (not `updatedAt`)

### 4. `organisations` table
- `organisationid` (not `organisationId`)
- `streetaddress` (not `streetAddress`)
- `postalcode` (not `postalCode`)
- `createdat` (not `createdAt`)
- `updatedat` (not `updatedAt`)

### 5. `organisationmemberships` table
- `membershipid` (not `membershipId`)
- `organisationid` (not `organisationId`)
- `isprimarycontact` (not `isPrimaryContact`)
- `roleinorg` (not `roleInOrg`)
- `createdat` (not `createdAt`)
- `updatedat` (not `updatedAt`)

## Foreign Key References
The foreign key references also use lowercase column names:
- `attendees.attendeeid` is referenced by multiple tables
- `masonicprofiles` references `attendees` via `person_id`

## Migration Applied

The migration `/supabase/migrations/20250528_fix_all_column_mismatches.sql` updates:

1. **complete_registration RPC function** to use all lowercase column names
2. **update_payment_status_and_complete function** to remove invalid attendee table updates
3. Proper handling of masonic profile creation using person_id lookup

## Code Updates

The TypeScript code has been updated to match the database schema:
- RPC transformation functions now use lowercase column names
- Masonic profile creation now passes attendee_id for person_id lookup
- All table references use the correct lowercase names

## Testing Required

After applying the migration, test:
1. Complete registration flow with individual attendees
2. Lodge registration with multiple attendees
3. Masonic profiles creation for mason attendees
4. Payment processing and status updates
5. Confirmation number generation

## Future Considerations

Consider creating a database naming convention migration to standardize all tables to either:
- All snake_case (current partial state)
- All camelCase (TypeScript convention)

This would eliminate the need for constant mapping between naming conventions.