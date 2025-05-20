# Forms Migration Notes

## Date: November 19, 2024

### What Was Done

1. **Backed up old forms**
   - Created backup at `components/register/oldforms-backup-20241119.tar.gz`
   - All original files preserved

2. **Removed old directories**
   - Removed `components/oldforms/` entirely
   - Kept new forms architecture in `components/register/Forms/`

3. **Updated imports**
   - Created migration script: `scripts/migrate-form-imports.ts`
   - Updated all imports from oldforms to new Forms directory
   - Fixed the following files:
     - `components/register/RegistrationWizard/Steps/AttendeeDetails.tsx`
     - `components/register/Attendees/AttendeeEditModal.tsx`

### Key Changes

1. **Form components now in**
   - `Forms/mason/Layouts/MasonForm.tsx`
   - `Forms/guest/Layouts/GuestForm.tsx`

2. **Shared components now in**
   - `Forms/shared/AutocompleteInput.tsx`
   - `Forms/shared/TermsAndConditions.tsx`
   - `Forms/shared/PartnerToggle.tsx`

3. **Partner forms unified**
   - Partners are always Guests now
   - Use `GuestForm` for all partner types
   - No more separate `LadyPartnerForm` or `GuestPartnerForm`

### Next Steps

1. Update all remaining imports throughout codebase
2. Add unit tests for new components
3. Update documentation
4. Optimize performance
5. Review final checklist

### Backup Location

`components/register/oldforms-backup-20241119.tar.gz`