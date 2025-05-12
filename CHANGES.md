# Changes Made to Fix Import Issues

This document summarizes the changes made to fix import issues in the LodgeTix-UGLNSW-v2 codebase.

## Issue Summary

After the code migration, there were issues with import paths that needed to be resolved:

1. Form components were using incorrect import paths due to file structure changes
2. Import styles were inconsistent (default vs named exports)
3. File naming conventions varied between PascalCase and kebab-case
4. SectionHeader component imports were inconsistent

## Solutions Implemented

### 1. Fix Form Component Imports

- Updated import paths in `order-review-step.tsx` and related files to use the correct paths for form components:
  - From: `import MasonForm from "../forms/mason/MasonForm"`
  - To: `import { MasonForm } from "../forms/mason/mason-form"`

- Changed import style from default imports to named exports to match actual component export style

### 2. Fix SectionHeader Imports

- Created script to standardize SectionHeader imports across files

### 3. Created Utility Scripts

Several shell scripts were created to automate these fixes:

- `fix-form-imports.sh`: Comprehensively fixes form component imports
- `fix-section-header-imports.sh`: Standardizes SectionHeader imports

## Files Modified

1. `/components/register/order/order-review-step.tsx`
2. `/components/register/attendee/AttendeeDetails.tsx`
3. `/components/register/attendee/AttendeeEditModal.tsx`

## Remaining Considerations

For future maintenance:

1. Consider standardizing file naming conventions (kebab-case vs. PascalCase)
2. Consider standardizing export patterns (default vs. named exports)
3. Review import patterns and establish project-wide conventions