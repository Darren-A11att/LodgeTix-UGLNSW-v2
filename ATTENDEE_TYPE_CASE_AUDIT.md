# Attendee Type Case Audit Report

## Summary
The database enum `attendee_type` uses lowercase values: `["mason", "guest", "ladypartner", "guestpartner"]`

However, many files in the codebase are using capitalized values ('Mason', 'Guest') which will cause mismatches when interacting with the database.

## Files That Need to be Updated

### Core Type Definition Files
These files define the fundamental types and need to be updated first:

1. **`/lib/registration-types.ts`**
   - Line 26: `type: "mason"` - Already lowercase ✓
   - But need to check if there are any references to 'Mason' or 'Guest' elsewhere in the file

2. **`/components/register/Forms/attendee/types.ts`**
   - Line 7: `attendeeType: 'mason' | 'guest';` - Already lowercase ✓
   - Good, this is correct

3. **`/shared/types/register.ts`**
   - Lines 9-14: Using enum with correct lowercase values ✓
   - `MASON = 'mason'`, `GUEST = 'guest'` - Enum values are correct

### Form Components (30+ files)
These files check attendee types and need to be updated:

#### Registration Wizard Components
- `/components/register/RegistrationWizard/Summary/AttendeeDetailsSummary.tsx`
- `/components/register/RegistrationWizard/hooks/useAttendeeProgress.ts`
- `/components/register/RegistrationWizard/hooks/useTicketEligibility.ts`
- `/components/register/RegistrationWizard/payment/BillingDetailsForm.tsx`
- `/components/register/RegistrationWizard/registration-wizard.tsx`
- `/components/register/RegistrationWizard/Attendees/AttendeeSummary.tsx`
- `/components/register/RegistrationWizard/Attendees/AttendeeEditModal.tsx`
- `/components/register/RegistrationWizard/Steps/ticket-selection-step.tsx`
- `/components/register/RegistrationWizard/Steps/order-review-step.tsx`
- `/components/register/RegistrationWizard/Steps/confirmation-step.tsx`
- `/components/register/RegistrationWizard/Shared/attendee-card.tsx`

#### Form Components
- `/components/register/Forms/guest/Layouts/GuestForm.tsx`
- `/components/register/Forms/mason/lib/LodgeSelection.tsx`
- `/components/register/Forms/mason/Layouts/MasonForm.tsx`
- `/components/register/Forms/attendee/AttendeeEditDialog.tsx`
- `/components/register/Forms/attendee/components/EditAttendeeDialog.tsx`
- `/components/register/Forms/attendee/AttendeeWithPartner.tsx`
- `/components/register/Forms/attendee/DelegationsForm.tsx`
- `/components/register/Forms/attendee/IndividualsForm.tsx`
- `/components/register/Forms/attendee/utils/formatters.ts`
- `/components/register/Forms/attendee/utils/businessLogic.ts`
- `/components/register/Forms/attendee/utils/validation.ts`
- `/components/register/Forms/attendee/utils/attendeeTypeRenderer.tsx`

### API Routes (Critical - these interact with database)
- `/app/api/functions/[functionId]/individual-registration/route.ts`
- `/app/api/registrations/[id]/payment/route.ts`
- `/app/api/registrations/route.ts`

### Services
- `/lib/registrationStore.ts`
- `/lib/services/registration-service.ts`
- `/lib/services/pdf-service.ts`
- `/lib/services/post-payment-service.ts`
- `/lib/validation/schemas.ts`

### Supabase Edge Functions
- `/supabase/functions/send-confirmation-email/index.ts`
- `/supabase/functions/send-confirmation-email/types/email.ts`
- `/supabase/functions/send-confirmation-email/templates/primary_contact_ticket_template.tsx`
- `/supabase/functions/send-confirmation-email/templates/lodge_confirmation_template.tsx`
- `/supabase/functions/send-confirmation-email/templates/individuals_confirmation_template.tsx`

### Customer Portal Pages
- `/app/(portals)/customer/registrations/[registrationId]/page.tsx`
- `/app/(portals)/customer/registrations/[registrationId]/tickets/page.tsx`
- `/app/(portals)/customer/registrations/[registrationId]/attendees/page.tsx`

### Test Files (Lower priority, but should be updated for consistency)
- Various test files in `__tests__` directories
- Puppeteer test files in `/tests/puppeteer/`

## Common Patterns to Fix

1. **Equality checks:**
   ```typescript
   // Change from:
   attendeeType === 'Mason'
   // To:
   attendeeType === 'mason'
   ```

2. **Switch statements:**
   ```typescript
   // Change from:
   case 'Mason':
   case 'Guest':
   // To:
   case 'mason':
   case 'guest':
   ```

3. **Type assignments:**
   ```typescript
   // Change from:
   type: 'Mason' as const
   // To:
   type: 'mason' as const
   ```

4. **Default values:**
   ```typescript
   // Change from:
   attendeeType: 'Guest'
   // To:
   attendeeType: 'guest'
   ```

## Recommended Approach

1. Start with API routes and services that interact with the database
2. Update form components that create/update attendee data
3. Update display components that show attendee information
4. Finally update test files

## Note on Type Safety

The good news is that the core type definitions (`/components/register/Forms/attendee/types.ts` and `/lib/registration-types.ts`) already use lowercase values, so once we update the string literals throughout the codebase, TypeScript should help catch any remaining mismatches.