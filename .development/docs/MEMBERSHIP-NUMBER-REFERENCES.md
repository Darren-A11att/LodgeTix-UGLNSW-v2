# Membership Number References

This document catalogs all references to membership numbers in the LodgeTix-UGLNSW-v2 codebase. The purpose is to identify where and how membership numbers are used, as well as where AI-assisted engineers might be incorrectly implementing membership number fields when they should not be.

## Summary of Findings

Membership numbers are **defined in type definitions** but are **not implemented in the actual UI components**. There is an explicit comment in the registration wizard that states "There is no membershipNumber field in this application."

## Type Definitions

### 1. `/shared/types/register.ts` 

- **Line 219**: `memberNumber?: string;` defined in the `MasonData` interface
- **Description**: This is an optional field in the MasonData interface. 
- **Usage**: Not implemented in any UI components. This appears to be a type definition that is not actively used in form components.

### 2. `/shared/types/supabase.ts`

- **Line 728**: `membershipid: string` in the `OrganisationMemberships` table definition
- **Description**: Part of the database schema type definitions, this field appears in the context of organization memberships, not individual mason memberships.
- **Usage**: Used to define the database schema for Supabase, but does not represent an individual mason's membership number.

### 3. Documentation Files

#### `/docs/Application-Data/SUPABASE_DATA_POINTS.md`

- **Line 180**: `memberNumber?: string;` defined in proposed schema for `MasonAttendee` interface
- **Description**: This appears in a documentation file describing the data model, but is not implemented in the actual application.
- **Usage**: Schema documentation only, not implemented in code.

#### `/docs/Application-Data/user-data.md`

- **Lines 18, 36, 52, 76, 93**, etc.: Contains example data with `memberNumber` fields in the `masonicInfo` objects
- **Description**: These are test/sample data examples and not reflective of the actual implemented application.
- **Usage**: Sample data only, not implemented in code.

### 4. Explicit Non-Implementation

#### `/components/register/registration/registration-wizard.tsx`

- **Line 108-109**: Comment: "There is no membershipNumber field in this application"
- **Description**: An explicit comment in the code stating that membership numbers are not part of the application.
- **Usage**: This comment serves as a clear indication that membership numbers should not be implemented.

## Implementation in UI Components

- No implementation of membership number input fields was found in the Mason form components:
  - `MasonBasicInfo.tsx`
  - `MasonLodgeInfo.tsx`
  - `MasonGrandLodgeFields.tsx`

## Conclusion

The codebase contains type definitions and sample data structures that include membership number fields, but these are **not implemented in the actual UI components**. The comment in the registration wizard explicitly states that membership numbers are not part of the application.

AI-assisted engineers may be incorrectly implementing membership number fields based on the type definitions and sample data they see in the codebase, without recognizing the explicit comment and the intentional absence of these fields in the actual UI components.

## Recommendations

1. Consider removing the `memberNumber` field from type definitions to prevent confusion.
2. Update documentation to clearly indicate that membership numbers are not used.
3. Add a note to the CLAUDE.md files that explicitly states membership numbers are not part of the application requirements.
4. Review the inconsistency between type definitions and actual implementation to ensure alignment.