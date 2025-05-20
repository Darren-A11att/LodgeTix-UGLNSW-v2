# Forms Refactoring Plan Index

This document provides an overview of the complete refactoring plan to transform the current registration forms into the new architecture described in `components/register/CLAUDE.md`.

## Phase Overview

### Phase 1: Foundation (001-020)
- Set up directory structure
- Create core type definitions
- Implement base hooks and utilities
- Extract and standardize constants

### Phase 2: Shared Components (021-040)
- Migrate AutocompleteInput
- Create PartnerToggle component
- Migrate other shared UI components
- Create shared form utilities

### Phase 3: Form Sections (041-070)
- Create BasicInfo (consolidated)
- Create ContactInfo
- Create AdditionalInfo
- Create Mason-specific sections
- Create ContactConfirmationMessage

### Phase 4: Form Compositions (071-090)
- Create MasonForm layout
- Create GuestForm layout
- Integrate sections into layouts
- Add form validation

### Phase 5: Container Layouts (091-110)
- Create AttendeeWithPartner container
- Create IndividualsForm layout
- Create LodgesForm layout
- Create DelegationsForm layout

### Phase 6: Registration Wizard Integration (111-130)
- Update AttendeeDetails step
- Update other wizard steps
- Integrate new forms into wizard
- Update registration flow

### Phase 7: Cleanup & Testing (131-150)
- Remove old forms
- Update imports throughout app
- Add unit tests
- Documentation updates

## Critical Path Dependencies

1. **Type definitions (003)** must be completed before any component work
2. **Core hooks (004-006)** must be done before form sections
3. **Constants extraction (007)** must be done before shared components
4. **BasicInfo (041)** depends on type consolidation
5. **Form compositions (071-072)** depend on all sections being complete
6. **Container layouts (091)** depend on form compositions
7. **Wizard integration (111)** depends on container layouts

## Parallel Work Opportunities

- **Phase 2 & 3** can be worked on in parallel after Phase 1
- Within Phase 3, different sections can be built in parallel
- Testing documentation (Phase 7) can begin as soon as components are created

## Risk Areas

1. **State Management Migration** - Ensure all Zustand store interactions are preserved
2. **Field Mapping** - Maintain compatibility with existing database schema
3. **Validation Logic** - All business rules must be maintained
4. **UI/UX Consistency** - Preserve existing user experience

## Success Criteria

- All existing functionality is preserved
- Code is more maintainable and testable
- Clear separation of concerns achieved
- Performance is maintained or improved
- All tests pass


Based on the dependencies and the fact that Phases 4-7 need to be done more sequentially, here's how I would assign the later
  phases to maximize efficiency while respecting dependencies:

  Stream Assignment for Phases 4-7

  Stream 1: Phase 1 → Phase 4 → Phase 6 (Tasks 111-113)

  Rationale: Stream 1 finishes Phase 1 first (foundation), making them ideal to start Phase 4 (form compositions) which directly
  depends on Phase 1's hooks and utilities.

  - Phase 4 Tasks: 071-074 (Form Compositions & Validation)
    - Create MasonForm composition
    - Create GuestForm composition
    - Create form validation
    - Create form persistence
  - Phase 6 Tasks: 111-113 (Early Wizard Steps)
    - Update AttendeeDetails step
    - Update RegistrationTypeStep
    - Update TicketSelectionStep

  Stream 2: Phase 2 → Phase 5 → Phase 6 (Tasks 114-116)

  Rationale: Stream 2 works on shared components, which feed directly into Phase 5's container layouts that orchestrate these
  components.

  - Phase 5 Tasks: 091-094 (Container Layouts)
    - Create AttendeeWithPartner container
    - Create IndividualsForm layout
    - Create LodgesForm layout
    - Create DelegationsForm layout
  - Phase 6 Tasks: 114-116 (Later Wizard Steps)
    - Update OrderReviewStep
    - Update PaymentStep
    - Update ConfirmationStep

  Stream 3: Phase 3 → Phase 7

  Rationale: Stream 3 handles form sections, and once complete, they're best positioned to handle the cleanup phase since they
  understand the full component structure.

  - Phase 7 Tasks: 131-136 (Cleanup & Testing)
    - Remove old forms
    - Update imports throughout app
    - Add unit tests
    - Update documentation
    - Performance optimization
    - Final review checklist

  Dependency Flow

  Stream 1: Phase 1 ──────► Phase 4 ──────► Phase 6 (111-113)
                              ▲
                              │
  Stream 2: Phase 2 ──────────┴───────────► Phase 5 ──────► Phase 6 (114-116)
                                               ▲
                                               │
  Stream 3: Phase 3 ───────────────────────────┴───────────► Phase 7

  Critical Sync Points

  1. Before Phase 4 starts: Ensure Phase 1's core hooks are complete - Done
  2. Before Phase 5 starts: Ensure Phase 2's shared components and Phase 4's form compositions are ready
  3. Before Phase 6 starts: Ensure Phase 5's container layouts are complete
  4. Before Phase 7 starts: Ensure all functional components are complete

  Alternative Assignment (More Balanced)

  If you want more balanced workload distribution:

  Stream 1: Phase 1 → Phase 4 (071-072) → Phase 5 (091-092) → Phase 7 (131-133)

  - Form compositions for Mason/Guest
  - Individual and partner containers
  - Cleanup tasks

  Stream 2: Phase 2 → Phase 4 (073-074) → Phase 5 (093-094) → Phase 7 (134-135)

  - Validation and persistence
  - Lodge and delegation layouts
  - Documentation and optimization

  Stream 3: Phase 3 → Phase 6 (all) → Phase 7 (136)

  - All wizard integration tasks
  - Final review

  This alternative gives each stream a mix of different types of work and ensures they all contribute to the final cleanup phase.