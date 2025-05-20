# Forms Refactoring Plan - Summary

This directory contains the complete step-by-step plan to refactor the registration forms according to the architecture defined in `components/register/CLAUDE.md`.

## Plan Structure

The refactoring is organized into 7 phases with 136 individual tasks:

### Phase 1: Foundation (Tasks 001-010)
- Create directory structure
- Set up TypeScript configuration  
- Define types and interfaces
- Create core hooks (useAttendeeData, usePartnerManager, usePersistence)
- Extract constants and business logic
- Create validation utilities

### Phase 2: Shared Components (Tasks 021-025)
- Migrate AutocompleteInput
- Create PartnerToggle component
- Migrate AddRemoveControl
- Migrate TermsAndConditions
- Create reusable field components

### Phase 3: Form Sections (Tasks 041-046)
- Create BasicInfo (consolidated Mason/Guest)
- Create ContactInfo section
- Create AdditionalInfo section
- Create GrandLodgeSelection component
- Create LodgeSelection component
- Create GrandOfficerFields component

### Phase 4: Form Compositions (Tasks 071-074)
- Create MasonForm layout
- Create GuestForm layout
- Implement form validation
- Add form persistence

### Phase 5: Container Layouts (Tasks 091-094)
- Create AttendeeWithPartner container
- Create IndividualsForm layout
- Create LodgesForm layout
- Create DelegationsForm layout

### Phase 6: Registration Wizard Integration (Tasks 111-116)
- Update AttendeeDetails step
- Update RegistrationTypeStep
- Update TicketSelectionStep
- Update OrderReviewStep
- Update PaymentStep
- Update ConfirmationStep

### Phase 7: Cleanup & Testing (Tasks 131-136)
- Remove old forms
- Update imports throughout app
- Add unit tests
- Update documentation
- Performance optimization
- Final review checklist

## Execution Order

The phases should be executed sequentially, but some tasks within phases can be done in parallel:

1. **Phase 1** must be completed first (foundation)
2. **Phases 2 & 3** can be worked on in parallel
3. **Phase 4** depends on Phases 2 & 3
4. **Phase 5** depends on Phase 4
5. **Phase 6** depends on Phase 5
6. **Phase 7** is the final cleanup

## Key Dependencies

Critical path items that block other work:
- Task 003 (type definitions) blocks all component work
- Task 004-006 (core hooks) block form sections
- Task 041 (BasicInfo) blocks form compositions
- Task 091 (AttendeeWithPartner) blocks wizard integration

## Time Estimates

Rough estimates for each phase:
- Phase 1: 2-3 days
- Phase 2: 2 days
- Phase 3: 3-4 days
- Phase 4: 2 days
- Phase 5: 2-3 days
- Phase 6: 2-3 days
- Phase 7: 2-3 days

**Total: 15-21 days**

## Success Criteria

The refactoring is complete when:
1. All old forms are removed
2. New architecture is fully implemented
3. All tests pass with >80% coverage
4. Documentation is complete
5. No regressions in functionality
6. Performance is maintained or improved

## Getting Started

1. Review `components/register/CLAUDE.md` for architecture details
2. Start with Phase 1 tasks in order
3. Use provided code examples as templates
4. Test continuously during development
5. Update documentation as you go

## Quick Links

- [Main refactoring index](./000-refactoring-plan-index.md)
- [Phase 1: Foundation](./phase-1-foundation/)
- [Phase 2: Shared Components](./phase-2-shared-components/)
- [Phase 3: Form Sections](./phase-3-form-sections/)
- [Phase 4: Form Compositions](./phase-4-form-compositions/)
- [Phase 5: Container Layouts](./phase-5-container-layouts/)
- [Phase 6: Registration Wizard](./phase-6-registration-wizard/)
- [Phase 7: Cleanup](./phase-7-cleanup/)

## Notes

- Each task file contains detailed implementation steps
- Code examples are provided where relevant
- Dependencies are clearly marked
- Success criteria defined for each task
- Migration paths included where needed

This plan ensures a systematic, low-risk refactoring of the registration forms while maintaining functionality and improving maintainability.