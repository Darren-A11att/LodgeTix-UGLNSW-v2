# Key Decisions Register

This document records significant architectural and implementation decisions made during the Forms Architecture refactoring project.

---

## Phase 1 - Foundation

### Decision 1.1: Type Naming Convention
**Date**: 5/19/2025  
**Context**: Store uses `UnifiedAttendeeData`, but cleaner naming was preferred  
**Decision**: Use `AttendeeData` as the primary type name throughout the refactoring  
**Rationale**: 
- Clearer, more intuitive naming
- Establishes our own interface separate from store implementation
- User preference for this naming convention
**Impact**: All new code uses `AttendeeData`, requires type casting at store boundary  
**Clarified By**: User guidance during implementation

### Decision 1.2: Mason Rank/Title Validation Approach
**Date**: 5/19/2025  
**Context**: Initially implemented strict validation between rank and title  
**Decision**: Remove validation rules, provide suggestions only  
**Rationale**:
- Too many edge cases to handle all valid combinations
- User experience more important than strict data integrity
- Flexibility needed for uncommon but valid scenarios
**Alternative**: Enforce strict validation rules  
**Impact**: Changed from validation errors to helpful suggestions  
**Clarified By**: User feedback - "too many edge cases to solve for"

### Decision 1.3: Name Field Character Limits
**Date**: 5/19/2025  
**Context**: Previous implementation used 50 character limit  
**Decision**: Limit first and last names to 20 characters each  
**Rationale**:
- UI consistency across forms
- Database constraints consideration
- User guidance to use 20 characters
**Alternative**: Keep 50 character limit  
**Impact**: Updated validation rules and error messages

### Decision 1.4: Email Validation Strategy
**Date**: 5/19/2025  
**Context**: Initially considered custom regex validation  
**Decision**: Use browser native email validation with type="email"  
**Rationale**:
- Better user experience
- Standard implementation
- Reduced code complexity
- User guidance to use native validation
**Alternative**: Custom regex validation  
**Impact**: Simplified validation logic, relies on browser implementation

### Decision 1.5: Phone Number Validation
**Date**: 5/19/2025  
**Context**: Considered custom phone validation logic  
**Decision**: Use existing PhoneInput component from UI library  
**Rationale**:
- Consistency with existing codebase
- Component already handles formatting and validation
- User guidance to use existing component
**Alternative**: Custom phone validation  
**Impact**: Dependency on `@/components/ui/phone-input`

### Decision 1.6: Directory Structure Convention
**Date**: 5/19/2025  
**Context**: Existing code uses PascalCase directories  
**Decision**: Use lowercase directory names for new structure  
**Rationale**:
- Modern React conventions
- Better cross-platform compatibility
- Clear distinction between old and new code
**Alternative**: Keep PascalCase directories  
**Impact**: All new directories use lowercase (e.g., `forms/attendee/`)
**Note**: Phase 3-4 maintained existing PascalCase for consistency

### Decision 1.7: Separation of Concerns Architecture
**Date**: 5/19/2025  
**Context**: Need for better code organization  
**Decision**: Separate hooks, utilities, and components into distinct directories  
**Rationale**:
- Clear separation of concerns
- Better maintainability
- Easier to find and understand code
**Alternative**: Co-locate all code with components  
**Impact**: Created `lib/`, `utils/`, and component directories

### Decision 1.8: Business Logic Centralization
**Date**: 5/19/2025  
**Context**: Logic was scattered across components  
**Decision**: Extract all business logic to centralized utilities  
**Rationale**:
- Single source of truth
- Reusability across components
- Easier testing and maintenance
**Alternative**: Keep logic in components  
**Impact**: Created businessLogic.ts, validation.ts, formatters.ts

### Decision 1.9: Debounced Updates Pattern
**Date**: 5/19/2025  
**Context**: Need for performance optimization  
**Decision**: Implement debounced updates for form fields  
**Rationale**:
- Prevent excessive re-renders
- Better performance with frequent updates
- Standard pattern in form handling
**Alternative**: Immediate updates on every change  
**Impact**: Created `useAttendeeDataWithDebounce` with 300ms default

### Decision 1.10: Partner Relationship Model
**Date**: 5/19/2025  
**Context**: Need for consistent relationship modeling  
**Decision**: Partners are always Guest type with isPartner foreign key  
**Rationale**:
- Simpler data model
- Clear relationship hierarchy
- Consistent with business requirements
**Alternative**: Allow partners to be any type  
**Impact**: Partner management logic in usePartnerManager hook

### Decision 1.11: Persistence Strategy
**Date**: 5/19/2025  
**Context**: Need for form data recovery  
**Decision**: Use localStorage for drafts, sessionStorage for sensitive data  
**Rationale**:
- Balance between persistence and security
- Standard web storage patterns
- 24-hour expiration for drafts
**Alternative**: No persistence or server-side only  
**Impact**: Created usePersistence hook with both storage options

### Decision 1.12: Constants Extraction
**Date**: 5/19/2025  
**Context**: Constants scattered throughout components  
**Decision**: Extract all domain constants to centralized file  
**Rationale**:
- Single source of truth
- Easier maintenance
- Type safety with const assertions
**Alternative**: Duplicate constants where needed  
**Impact**: Created comprehensive constants.ts file

### Decision 1.13: Validation Philosophy
**Date**: 5/19/2025  
**Context**: Balance between data integrity and user experience  
**Decision**: Minimal validation with maximum flexibility  
**Rationale**:
- User experience prioritized
- Avoid frustrating edge cases
- Server-side validation as backup
**Alternative**: Strict client-side validation  
**Impact**: Only essential validations implemented

---

## Phase 3 - Form Sections

### Decision 3.1: Single AttendeeData Interface
**Date**: 5/19/2025  
**Context**: Need to handle both Mason and Guest attendee types  
**Decision**: Create a single AttendeeData interface with optional Mason-specific fields  
**Rationale**: 
- Reduces code duplication
- Simplifies type checking
- Allows easy conversion between types
**Alternative**: Separate MasonData and GuestData interfaces  
**Impact**: All components use the same interface, with type guards for Mason-specific logic

### Decision 3.2: Centralized Constants and Business Logic
**Date**: 5/19/2025  
**Context**: Common constants and logic needed across multiple components  
**Decision**: Create dedicated constants.ts and businessLogic.ts files  
**Rationale**:
- Single source of truth for business rules
- Easier maintenance and updates
- Consistent behavior across components
**Alternative**: Duplicate logic in each component  
**Impact**: All components import from shared files

### Decision 3.3: Backward Compatibility Wrappers
**Date**: 5/19/2025  
**Context**: Existing code uses different component interfaces  
**Decision**: Create wrapper components that adapt old interfaces to new  
**Rationale**:
- Allows gradual migration
- Doesn't break existing functionality
- Provides clear migration path
**Alternative**: Force immediate updates to all calling code  
**Impact**: Both old and new patterns work simultaneously

### Decision 3.4: AutocompleteInput Single-Select Only
**Date**: 5/19/2025  
**Context**: Question about multi-select capability  
**Decision**: Keep AutocompleteInput as single-select only  
**Rationale**: Users can only register for one Grand Lodge and one Lodge  
**Alternative**: Build multi-select capability  
**Impact**: Simpler implementation, meets all current requirements  
**Clarified By**: User feedback during implementation

### Decision 3.5: Dietary Requirements Character Limit
**Date**: 5/19/2025  
**Context**: Initial implementation used 500 character limit  
**Decision**: Limit dietary requirements to 200 characters  
**Rationale**: Business requirement to keep entries concise  
**Alternative**: Allow longer entries (500+ characters)  
**Impact**: Updated maxLength in both AdditionalInfo components  
**Clarified By**: User feedback during implementation

### Decision 3.6: Grand Officer Roles Limited Selection
**Date**: 5/19/2025  
**Context**: 70+ Grand Officer roles exist across Grand Lodges  
**Decision**: Show only 5 senior roles plus "Other" option  
**Rationale**:
- Dropdown with 70+ options would be unwieldy
- Senior roles cover most common cases
- "Other" with text input handles edge cases
**Alternative**: Complete list of all roles  
**Impact**: Clean UI with flexibility for uncommon roles  
**Clarified By**: User feedback during implementation

### Decision 3.7: SectionProps Interface Pattern
**Date**: 5/19/2025  
**Context**: Need consistent props across all section components  
**Decision**: All sections use SectionProps interface  
**Rationale**:
- Consistent API across components
- Easy to compose into forms
- Type safety maintained
**Alternative**: Custom props for each section  
**Impact**: Uniform component signatures

### Decision 3.8: Lodge Cache Strategy
**Date**: 5/19/2025  
**Context**: Multiple lodge searches can be expensive  
**Decision**: Implement caching by Grand Lodge  
**Rationale**:
- Reduces API calls
- Improves performance
- Lodge lists rarely change
**Alternative**: No caching, fresh API call each time  
**Impact**: Better UX with faster responses

### Decision 3.9: Field Components Enhancement
**Date**: 5/19/2025  
**Context**: Initial FieldComponents were basic  
**Decision**: Accept linter enhancements with validation  
**Rationale**:
- Better validation UX
- Consistent formatting
- Improved accessibility
**Alternative**: Keep minimal implementation  
**Impact**: More robust form fields with better user feedback

### Decision 3.10: Title-Rank Interaction Logic
**Date**: 5/19/2025  
**Context**: Mason titles and ranks have dependencies  
**Decision**: Implement automatic rank suggestions based on title  
**Rationale**:
- W Bro title suggests IM rank
- Grand titles (VW/RW/MW Bro) suggest GL rank
- Improves data consistency
**Alternative**: Independent title and rank selection  
**Impact**: Better data quality with logical defaults

---

## Phase 4 - Form Compositions

### Decision 4.1: Form Composition Pattern
**Date**: 6/1/2025  
**Context**: Initial implementation created multiple form variants  
**Decision**: Forms should be pure compositions with no business logic  
**Rationale**:
- Separation of concerns - forms compose, containers handle context
- Single responsibility principle
- Cleaner architecture as specified in CLAUDE.md
**Alternative**: Multiple form variants (Compact, Summary, etc.)  
**Impact**: Removed all variants, simplified to MasonForm and GuestForm only  
**Supersedes**: Initial over-engineered implementation with variants

### Decision 4.2: Single Forms Only
**Date**: 6/1/2025  
**Context**: Question about needing different form versions  
**Decision**: Create only one form per attendee type  
**Rationale**:
- Responsiveness handled by CSS, not component variants
- Container components handle different contexts
- Aligns with CLAUDE.md requirements
**Alternative**: Create multiple form variants  
**Impact**: Deleted MasonFormCompact, GuestFormCompact, etc.  
**Clarified By**: User question "Why don't we just do one form and make it responsive"

### Decision 4.3: No Custom Validation/Persistence
**Date**: 6/1/2025  
**Context**: Initial implementation created custom validation and persistence components  
**Decision**: Use existing Phase 1 utilities instead of creating new ones  
**Rationale**:
- Phase 1 already provides validation utilities
- Phase 1 already provides persistence hooks
- Avoid code duplication
**Alternative**: Create form-specific validation/persistence  
**Impact**: Removed ValidatedForms.tsx, PersistedForms.tsx, useFormValidation.ts, useFormPersistence.ts  
**Supersedes**: Initial implementation with custom utilities

### Decision 4.4: Container Responsibility
**Date**: 6/1/2025  
**Context**: Need to handle different contexts (with/without partner)  
**Decision**: Container components (Phase 5) handle context-specific logic  
**Rationale**:
- Forms remain pure compositions
- Containers orchestrate based on context
- Clear separation of concerns
**Alternative**: Build context handling into forms  
**Impact**: AttendeeWithPartner (Phase 5) will handle partner management

### Decision 4.5: Import Path Consistency
**Date**: 6/1/2025  
**Context**: Import paths needed correction for existing structure  
**Decision**: Use PascalCase for existing directories in Phase 3-4  
**Rationale**:
- Match existing project structure
- Avoid breaking changes
- Maintain consistency within phases
**Alternative**: Force lowercase throughout  
**Impact**: Updated imports to use correct casing (Attendee, BasicDetails, etc.)  
**Updates**: Decision 1.6 - noted that Phase 3-4 maintains existing casing

---

## Phase 5 - Container Layouts

### Decision 5.1: DelegationsForm Table-Based Hybrid Approach
**Date**: 5/19/2025  
**Context**: User requirement for table-based delegation entry  
**Decision**: Implement hybrid approach with table summary and modal editing  
**Rationale**:
- Balance between table format and existing vertical forms
- Preserves component reusability
- Maintains clean architecture while meeting UX needs
**Alternative**: Full table-based inline editing  
**Impact**: Table shows summary data, edit buttons open modal with full MasonForm/GuestForm  
**Clarified By**: User feedback - "We specifically need to re-use all the components we created and stick to the architecture, but this needs to be in a table format"

### Decision 5.2: Container Pattern Implementation
**Date**: 5/19/2025  
**Context**: Need for consistent container pattern across all layouts  
**Decision**: All containers orchestrate form compositions without business logic  
**Rationale**:
- Clear separation of concerns
- Containers handle context, forms handle data
- Aligns with architecture specification
**Alternative**: Mix business logic in containers  
**Impact**: Pure orchestration pattern across AttendeeWithPartner, IndividualsForm, LodgesForm, DelegationsForm

### Decision 5.3: Partner Relationship Management
**Date**: 5/19/2025  
**Context**: Partners need proper relationship linking in all containers  
**Decision**: Partners always have attendeeType='Guest' with isPartner FK to parent  
**Rationale**:
- Consistent data model
- Clear relationship hierarchy
- Simplifies partner management
**Alternative**: Allow mixed partner types  
**Impact**: All containers use same partner management pattern via usePartnerManager

---

## General Principles

### Principle 1: Composition Over Inheritance
- Build complex forms from simple, reusable sections
- Each component has single responsibility
- Easy to test and maintain

### Principle 2: Type Safety First
- Use TypeScript interfaces throughout
- Avoid any types
- Provide type guards where needed

### Principle 3: Progressive Enhancement
- Start with basic functionality
- Add features as needed
- Accept improvements from tooling

### Principle 4: Business Logic Separation
- Keep UI components pure
- Extract business rules to utilities
- Make logic testable

### Principle 5: Follow CLAUDE.md Exactly
- No over-engineering
- Implement only what's specified
- Ask for clarification when uncertain

---

## Decision-Making Principles

1. **User Experience First**: Prioritize flexibility over strict validation
2. **Consistency**: Follow existing patterns where they work well
3. **Maintainability**: Extract shared logic to utilities
4. **Performance**: Use appropriate optimization techniques
5. **Type Safety**: Maintain strong typing throughout
6. **Simplicity**: Avoid over-engineering, follow CLAUDE.md requirements

---

## How to Use This Document

1. **Before Making Decisions**: Check if similar decisions have been made
2. **When Making Decisions**: Add new entries with full context
3. **During Implementation**: Reference decisions for consistency
4. **For Questions**: Use this as source of truth for architectural choices
5. **When Unclear**: Re-read CLAUDE.md and ask for clarification

---

**Document Version**: 1.4  
**Last Updated**: 5/19/2025  
**Maintained By**: Development Team
**Change Log**: Added Phase 5 decisions on container implementation patterns and DelegationsForm hybrid approach

---

## Appendix: Original Phase 1 Decisions Document

_The following content was migrated from PHASE-1-DECISIONS.md on 5/19/2025_

# Phase 1 - Critical Decisions Log

**Phase**: Phase 1 - Foundation  
**Date**: May 19, 2025  
**Version**: 1.0

## Technology Stack Decisions

Frontend Stack
	•	Next.js provides the framework
	•	React handles UI components
	•	TypeScript adds type safety
	•	Tailwind styles components
	•	shadcn/ui provides base components
	•	Zustand manages client state

Backend Stack
	•	Next.js API Routes handle server logic
	•	Supabase provides database and auth
	•	Stripe processes payments
	•	Sentry tracks errors

Development Stack
	•	npm manages packages
	•	ESLint enforces code quality
	•	_____ runs tests
	•	Git versions code


## Architectural Decisions

### 1. Type Naming Convention
**Decision**: Use `AttendeeData` as the primary type name
- **Context**: Store uses `UnifiedAttendeeData`, but we wanted a cleaner name
- **Implementation**: All new code imports and uses `AttendeeData`
- **Trade-off**: Requires type casting when interfacing with store
- **Status**: APPROVED and IMPLEMENTED

### 2. Mason Rank/Title Validation
**Decision**: No validation rules, only helpful suggestions
- **Context**: Too many edge cases for proper validation
- **Implementation**: `handleTitleChange()` returns suggestions, not validation errors
- **Trade-off**: Less strict data integrity, better user experience
- **Status**: APPROVED and IMPLEMENTED

### 3. Character Limits
**Decision**: 20 characters per name field
- **Context**: UI consistency and database constraints
- **Implementation**: `validateName()` enforces 2-20 character limit
- **Previous**: 50 character limit
- **Status**: APPROVED and IMPLEMENTED

### 4. Email Validation
**Decision**: Use browser native validation
- **Context**: Better UX, standard implementation
- **Implementation**: Use `type="email"` on input elements
- **Alternative**: Custom regex validation
- **Status**: APPROVED and IMPLEMENTED

### 5. Phone Validation
**Decision**: Use existing PhoneInput component
- **Context**: Consistency with codebase
- **Implementation**: Import from `@/components/ui/phone-input`
- **Alternative**: Custom validation logic
- **Status**: APPROVED and IMPLEMENTED

### 6. Directory Structure
**Decision**: Use lowercase directory names
- **Context**: Modern React conventions
- **Implementation**: `forms/attendee/` not `Forms/Attendee/`
- **Alternative**: PascalCase directories
- **Status**: APPROVED and IMPLEMENTED

## Business Logic Rules

### Mason Rank/Title Interactions
- **Rule**: Suggestions only, user can override
- **Examples**:
  - "VW Bro" → suggests "GL" rank
  - "W Bro" → suggests "IM" rank (if not GL)
  - User can select "Bro" with "GL" rank if desired

### Field Visibility Logic
1. **Grand Officer Fields**: `rank === 'GL'`
2. **Contact Fields**: `isPrimary || contactPreference === 'Directly'`
3. **Confirmation Message**: `!isPrimary && (contactPreference === 'PrimaryAttendee' || 'ProvideLater')`
4. **Partner Forms**: Always Guest type

### Validation Requirements
- **Names**: 2-20 characters, required
- **Email**: Browser validation, required for primary/direct contact
- **Phone**: Component validation, required for primary/direct contact
- **Mason Rank**: Required, no compatibility checks
- **Grand Officer**: Required when rank is GL and isPrimary

## Technical Standards

### Import Patterns
```typescript
// Always import AttendeeData for new code
import { AttendeeData } from '../types';

// Don't import UnifiedAttendeeData unless interfacing with store
// import { UnifiedAttendeeData } from '@/shared/types/supabase'; // AVOID
```

### Hook Patterns
```typescript
// Use debouncing for form updates
export const useAttendeeDataWithDebounce = (attendeeId: string, delay = 300) => {
  // Implementation
};
```

### Validation Patterns
```typescript
// Character limits with clear error messages
export const validateName = (name: string): boolean => {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 20;
};
```

## File Organization

```
components/register/forms/
├── attendee/
│   ├── lib/          # Hooks and state management
│   ├── utils/        # Validation, formatting, business logic
│   └── types.ts      # Type definitions
├── basic-details/    # Shared form sections
├── guest/           # Guest-specific components
├── mason/           # Mason-specific components
└── shared/          # Shared UI components
```

## Notes for Future Phases

1. **Type Consistency**: Continue using `AttendeeData` in all new code
2. **Validation**: Keep validation minimal and user-friendly
3. **Business Logic**: Suggestions over enforcement
4. **Testing**: Add unit tests for all utilities
5. **Documentation**: Update as new decisions are made

---

**Last Updated**: May 19, 2025  
**Updated By**: Claude