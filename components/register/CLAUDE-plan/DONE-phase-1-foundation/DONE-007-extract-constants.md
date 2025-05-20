# Task 007: Extract Constants

## Objective
Extract all domain constants from existing forms and create centralized constant files according to CLAUDE.md specifications.

## Dependencies
- Task 003 (type definitions)

## Reference Files
- `components/register/oldforms/mason/MasonBasicInfo.tsx`
- `components/register/oldforms/guest/GuestBasicInfo.tsx`
- `components/register/forms/mason/MasonGrandLodgeFields.tsx`
- Any other files containing domain constants

## Steps

1. Create `components/register/forms/attendee/utils/constants.ts`:
```typescript
// Title Constants
export const MASON_TITLES = ["Bro", "W Bro", "VW Bro", "RW Bro", "MW Bro"] as const;
export const GUEST_TITLES = ["Mr", "Mrs", "Ms", "Miss", "Dr", "Rev", "Prof", "Rabbi", "Hon", "Sir", "Madam", "Lady", "Dame"] as const;

// Rank Constants
export const MASON_RANKS = [
  { value: "EAF", label: "EAF" },
  { value: "FCF", label: "FCF" },
  { value: "MM", label: "MM" },
  { value: "IM", label: "IM" },
  { value: "GL", label: "GL" }
] as const;

// Grand Officer Constants
export const GRAND_OFFICER_STATUS = ["Present", "Past"] as const;

export const GRAND_OFFICER_ROLES = [
  "Grand Master",
  "Deputy Grand Master", 
  "Assistant Grand Master",
  "Grand Secretary",
  "Grand Director of Ceremonies",
  "Other"
] as const;

// Relationship Types
export const PARTNER_RELATIONSHIPS = [
  "Wife",
  "Husband",
  "Partner", 
  "Spouse",
  "Fiancée",
  "Fiancé"
] as const;

// Contact Preferences
export const CONTACT_PREFERENCES = [
  { value: "Directly", label: "Contact me directly" },
  { value: "PrimaryAttendee", label: "Via primary attendee" },
  { value: "ProvideLater", label: "Provide details later" }
] as const;

// Grand Titles (for rank logic)
export const GRAND_TITLES = ["VW Bro", "RW Bro", "MW Bro"] as const;
```

2. Create type definitions for constants:
```typescript
export type MasonTitle = typeof MASON_TITLES[number];
export type GuestTitle = typeof GUEST_TITLES[number];
export type MasonRank = typeof MASON_RANKS[number]['value'];
export type GrandOfficerStatus = typeof GRAND_OFFICER_STATUS[number];
export type GrandOfficerRole = typeof GRAND_OFFICER_ROLES[number];
export type PartnerRelationship = typeof PARTNER_RELATIONSHIPS[number];
export type ContactPreference = typeof CONTACT_PREFERENCES[number]['value'];
```

3. Extract any other constants found in existing forms:
- Field labels
- Error messages
- Validation patterns
- Default values

## Deliverables
- Complete constants file with all domain values
- Type exports for all constants
- Documentation for each constant group

## Success Criteria
- All constants from old forms are captured
- Constants match CLAUDE.md specifications
- Type-safe constant usage throughout
- No hard-coded values remain in components