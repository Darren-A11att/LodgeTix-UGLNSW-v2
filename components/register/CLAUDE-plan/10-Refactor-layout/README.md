# Registration Wizard Layout Refactoring Plan

## Objective
Refactor the registration wizard to achieve:
1. **Constrained Height**: Always 100dvh with header, body, and footer always in view
2. **Dynamic Body Sizing**: Body section auto-resizes to fill space between header and footer
3. **Responsive Layouts**: Different layouts for mobile vs. desktop
4. **Clear Structure**: Centralized control of wizard navigation, headers, and layout
5. **Two Layout Patterns**: 1-column and 2-column layouts for different steps

## Structure Overview

### Stacked Main Layout (WizardShellLayout)
- 100dvh container with 3 sections:
  - Header (fixed height)
  - Body (flex-1, overflow-y-auto)
  - Footer (fixed height)

### Body Structure (WizardBodyStructureLayout)
- 4 rows contained within the scrollable body:
  1. Step Indicator
  2. Section Header
  3. Step Container (flex-1)
  4. Back & Continue Buttons

### Step Container Layouts
1. **One-Column Layout**:
   - Mobile: Full width
   - Desktop: Contained width with padding
   - Used for: Registration Type, Order Review, Confirmation

2. **Two-Column Layout**:
   - Mobile: Full width (summary hidden)
   - Desktop: 70% content, 30% summary
   - Used for: Attendee Details, Ticket Selection, Payment

## Implementation Phases
1. **Phase 1**: Create WizardShellLayout
2. **Phase 2**: Create WizardBodyStructureLayout
3. **Phase 3**: Create Step Layout Components
4. **Phase 4**: Refactor Individual Steps

Each phase is broken down into discrete tasks in the following files. 