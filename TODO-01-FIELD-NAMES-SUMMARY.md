# TODO-01 Field Names Update Summary

## Changes Made

### 1. Customer ID → Contact ID
Updated all references from `customer_id`/`customerId` to `contact_id`/`contactId`:

**Files Updated:**
- `/lib/database-mappings.ts` - Updated mapping from `customerId` to `contact_id`
- `/lib/booking-contact-schema.ts` - Updated CustomerRecord interface and mapping functions
- `/shared/types/register.ts` - Updated FormState interface
- `/shared/types/register_updated.ts` - Updated RegistrationData, CustomerData, and FormState interfaces
- `/app/api/registrations/route.ts` - Updated all references in registration API
- `/components/register/RegistrationWizard/registration-wizard.tsx` - Updated registration data submission
- `/components/register/RegistrationWizard/Steps/payment-step.tsx` - Updated payment submission
- `/lib/supabase-adapter.ts` - Updated column mapping
- `/lib/api/registration-rpc.ts` - Updated function parameters and transformations
- `/lib/api/registration-rpc-service-v2.ts` - Updated RegistrationResponseV2 interface
- `/lib/api/registration-rpc-service-v3.ts` - Updated RegistrationResponseV3 interface

### 2. Organization → Organisation (British Spelling)
Updated all references from American to British spelling:

**Files Updated:**
- `/lib/utils/stripe-fee-calculator.ts` - Updated interface and comments
- `/components/about/about-content.tsx` - Updated content text
- `/app/privacy/page.tsx` - Updated privacy policy text
- `/app/test-location/page.tsx` - Updated display text
- `/app/events/page.tsx` - Updated comment

### 3. Organizer → Organiser (British Spelling)
Updated all references from American to British spelling:

**Files Updated:**
- `/shared/types/event.ts` - Updated EventType interface
- `/lib/services/event-service.ts` - Updated Event interface and mapping
- `/lib/services/homepage-service.ts` - Updated event data transformation
- `/lib/services/events-schema-service.ts` - Updated EventsSchemaRow interface
- `/lib/api/event-rpc-service.ts` - Updated EventDetailData interface
- `/lib/api/event-crud-service.ts` - Updated EventInput interface
- `/app/events/[slug]/[childSlug]/page.tsx` - Updated display text and field references
- `/components/auth/login-form.tsx` - Updated redirect URLs
- `/app/about/page.tsx` - Updated links
- `/components/about/about-content.tsx` - Updated content text
- `/lib/utils/stripe-fee-calculator.ts` - Updated disclaimer text

### 4. Field Names Already Correct
The following were already using the correct field names:
- Database types in `/shared/types/database.ts` - Already using `contact_id` and `organisation_id`
- Ticket count fields - Already using `sold_count`, `available_count`, `reserved_count` in RPC services

## Testing Required
After these changes, the following should be tested:
1. Registration flow - ensure contact ID is properly saved
2. Payment processing - ensure the correct user ID is passed
3. Event display pages - ensure organiser information displays correctly
4. Authentication redirects - ensure `/organiser/` URLs work correctly

## Migration Notes
- No database migration needed as the database already uses the correct field names
- This was purely a code-level update to match existing database schema
- All references have been updated to use British spelling (organisation, organiser)