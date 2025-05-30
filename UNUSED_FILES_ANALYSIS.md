# Unused Files Analysis Report

Generated: 2025-05-29

## Analysis Methods

1. **Static Analysis**: Using TypeScript compiler and import/export analysis
2. **Dependency Graph**: Using file dependency mapping
3. **Git History**: Files not modified in the last 6 months

## Analysis Results Summary

- **Total files analyzed**: 321
- **Potentially unused files**: 168
- **Files appearing in multiple analyses**: Cross-referenced below

## 🔴 High Confidence (Appears in ALL 3 analyses) - SAFE TO DELETE

### Backup Files
- [x] `components/register/Forms/mason/lib/MasonLodgeInfo.tsx.bak` ✅ DELETED
- [x] `components/register/RegistrationWizard/Steps/ticket-selection-step.tsx.backup` ✅ DELETED
- [x] `components/register/RegistrationWizard/Steps/ticket-selection-step.tsx.bak` ✅ DELETED
- [x] `components/register/RegistrationWizard/Steps/registration-type-step.tsx.bak` ✅ DELETED
- [x] `components/register/RegistrationWizard/registration-wizard.tsx.bak` ✅ DELETED

### Old/Duplicate Components
- [x] `components/register/RegistrationWizard/Steps/payment-step-old.tsx` ✅ DELETED
- [x] `components/register/RegistrationWizard/payment/FilterableComboboxOld.tsx` ✅ DELETED

### Unused Form Components
- [x] `components/register/Forms/shared/PartnerToggleExample.tsx` ✅ DELETED

### Completed Migration Scripts
- [x] `scripts/migrate-events-to-uuid.js` ✅ DELETED
- [x] `scripts/migrate-events-to-supabase.ts` ✅ DELETED
- [x] `scripts/migrate-form-imports.ts` ✅ DELETED
- [x] `scripts/apply-database-naming-standards.js` ✅ DELETED
- [x] `scripts/complete-database-migration.js` ✅ DELETED
- [x] `scripts/final-database-cleanup.js` ✅ DELETED
- [x] `scripts/fix-critical-database-refs.js` ✅ DELETED
- [x] `scripts/migrate-supabase-naming.js` ✅ DELETED
- [x] `scripts/migrate-to-snake-case.sh` ✅ DELETED

## 🟡 Medium Confidence (Appears in 2/3 analyses) - NEEDS VERIFICATION

### Updated Components (verify if replacements are in use)
- [x] `components/register/RegistrationWizard/Steps/ConfirmationStepUpdated.tsx` ✅ DELETED
- [x] `components/register/RegistrationWizard/Steps/OrderReviewStepUpdated.tsx` ✅ DELETED
- [x] `components/register/RegistrationWizard/Steps/PaymentStepUpdated.tsx` ✅ DELETED
- [x] `components/register/RegistrationWizard/Steps/TicketSelectionStepUpdated.tsx` ✅ DELETED (was not actually used)
- [x] `components/register/steps/ticket-selection-step.tsx` ✅ DELETED (unused re-export)

### Hero/Marketing Components
- [ ] `components/grand-installation-hero.tsx` ❌ KEEP (used in app/page.tsx)
- [x] `components/grand-installation-hero-updated.tsx` ✅ DELETED
- [x] `components/featured-event.tsx` ✅ DELETED
- [x] `components/featured-events.tsx` ✅ DELETED
- [ ] `components/featured-events-section.tsx` ❌ KEEP (used in app/page.tsx)
- [ ] `components/event-timeline.tsx` ❌ KEEP (used in app/page.tsx)

### Unused Services
- [ ] `lib/api-logger.ts` ❌ KEEP (used by 7 files)
- [x] `lib/calendarUtils.ts` ✅ DELETED
- [x] `lib/mobileUtils.ts` ✅ DELETED
- [x] `lib/redirectPrevention.ts` ✅ DELETED
- [x] `lib/reservationService.ts` ✅ DELETED
- [x] `lib/reservationService.realtime.ts` ✅ DELETED
- [x] `lib/vasService.ts` ✅ DELETED

### Summary Components
- [x] `components/register/RegistrationWizard/Summary/SimpleAttendeeSummary.tsx` ✅ DELETED
- [x] `components/register/RegistrationWizard/Summary/SimpleAttendeeSummaryV2.tsx` ✅ DELETED
- [x] `components/register/RegistrationWizard/Summary/SimpleConfirmationSummary.tsx` ✅ DELETED
- [x] `components/register/RegistrationWizard/Summary/SimpleOrderReviewSummary.tsx` ✅ DELETED
- [x] `components/register/RegistrationWizard/Summary/SimplePaymentSummary.tsx` ✅ DELETED
- [x] `components/register/RegistrationWizard/Summary/SimpleTicketSummary.tsx` ✅ DELETED

### Documentation Files
- [ ] `development/DONE-production-issues/*.md` (40+ files)
- [ ] `development/production-bugs/DONE-*.md` (14 files)

## 🟢 Low Confidence (Appears in 1/3 analyses) - NEEDS INVESTIGATION

### Next.js Special Files (might be used by framework)
- [ ] `app/global-error.tsx`
- [ ] `app/not-found.tsx`
- [ ] `app/loading.tsx`
- [ ] `app/layout.document.tsx`

### UI Components (shadcn/ui - might be used in future)
- [ ] `components/ui/accordion.tsx`
- [ ] `components/ui/aspect-ratio.tsx`
- [ ] `components/ui/avatar.tsx`
- [ ] `components/ui/breadcrumb.tsx`
- [ ] `components/ui/carousel.tsx`
- [ ] `components/ui/chart.tsx`
- [ ] `components/ui/collapsible.tsx`
- [ ] `components/ui/context-menu.tsx`
- [ ] `components/ui/drawer.tsx`
- [ ] `components/ui/hover-card.tsx`
- [ ] `components/ui/menubar.tsx`
- [ ] `components/ui/navigation-menu.tsx`
- [ ] `components/ui/pagination.tsx`
- [ ] `components/ui/progress.tsx`
- [ ] `components/ui/resizable.tsx`
- [ ] `components/ui/sidebar.tsx`
- [ ] `components/ui/slider.tsx`
- [ ] `components/ui/toggle-group.tsx`

### Type Files
- [ ] `shared/types/register_updated.ts`
- [ ] `shared/types/customer.ts`
- [ ] `shared/types/day.ts`

### About Components
- [ ] `components/about/check-tables.tsx`

## Route Trace Verification Log

### Files Verified Safe to Delete
- [ ] (Verified files will be listed here after manual checks)

### Files to Keep
- [ ] (Files that should be kept will be listed here after manual checks)

## Action Plan

1. **Immediate Actions (High Confidence)**:
   - Delete all .bak, .backup files
   - Remove completed migration scripts
   - Delete example/test components

2. **Requires Verification (Medium Confidence)**:
   - Check if *Updated.tsx components are replacements
   - Verify hero/marketing components aren't used on any pages
   - Test if removing services breaks anything

3. **Careful Review (Low Confidence)**:
   - Keep Next.js special files unless confirmed unused
   - Keep shadcn/ui components for potential future use
   - Review type files for documentation value

## Notes
- Total potential space savings: ~168 files
- Many UI components are from shadcn/ui library (standard installation)
- Migration scripts from May 2025 have been executed and can be archived
- Backup files (.bak, .old, .backup) should always be deleted

## Lib Directory Cleanup (Added 2025-01-29)

### Duplicate Admin Services to Delete
- [x] lib/api/adminApiService.ts (duplicate of lib/api/admin/adminApiService.ts) ⚠️ NEEDS MANUAL DELETION
- [x] lib/api/customerAdminService.ts (duplicate of lib/api/admin/customerAdminService.ts) ⚠️ NEEDS MANUAL DELETION
- [x] lib/api/eventAdminService.ts (duplicate of lib/api/admin/eventAdminService.ts) ⚠️ NEEDS MANUAL DELETION
- [x] lib/api/packageAdminService.ts (duplicate of lib/api/admin/packageAdminService.ts) ⚠️ NEEDS MANUAL DELETION
- [x] lib/api/registrationAdminService.ts (duplicate of lib/api/admin/registrationAdminService.ts) ⚠️ NEEDS MANUAL DELETION
- [x] lib/api/ticketAdminService.ts (duplicate of lib/api/admin/ticketAdminService.ts) ⚠️ NEEDS MANUAL DELETION

### Unused Files to Delete (No Imports)
- [x] lib/api-utils.ts ⚠️ NEEDS MANUAL DELETION
- [x] lib/database-mappings.ts ⚠️ NEEDS MANUAL DELETION
- [x] lib/delegationRegistrationStore.ts (replaced by registrationStore.ts) ⚠️ NEEDS MANUAL DELETION
- [x] lib/supabase-adapter.ts ⚠️ NEEDS MANUAL DELETION
- [x] lib/packageService.ts ⚠️ NEEDS MANUAL DELETION

### Files to Keep (Still in Use)
- lib/lodgeRegistrationStore.ts - Used in 5 files
- lib/supabase-singleton.ts - Used in 9 files