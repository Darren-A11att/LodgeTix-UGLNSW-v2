# Task 003: Create Type Definitions

## Objective
Create comprehensive TypeScript type definitions for the new architecture based on CLAUDE.md specifications.

## Dependencies
- Task 002 (TypeScript config)

## Steps

1. Create `components/register/forms/attendee/types.ts`:
```typescript
export interface AttendeeData {
  // Identity
  attendeeId: string;
  attendeeType: 'Mason' | 'Guest';
  
  // Person Data
  title: string;
  firstName: string;
  lastName: string;
  suffix?: string;
  
  // Contact
  contactPreference: 'Directly' | 'PrimaryAttendee' | 'ProvideLater';
  primaryPhone: string;
  primaryEmail: string;
  
  // Relationships
  isPrimary: boolean;
  isPartner: string | null;
  partner?: string | null;
  relationship?: 'Husband' | 'Wife' | 'Partner' | 'Fiance' | 'Fiancee' | null;
  
  // Additional
  dietaryRequirements: string;
  specialNeeds: string;
  
  // Mason-specific (optional)
  masonicTitle?: string;
  rank?: string;
  grandOfficerStatus?: 'Present' | 'Past';
  presentGrandOfficerRole?: string;
  otherGrandOfficerRole?: string;
  grandLodgeId?: string;
  lodgeId?: string;
  lodgeNameNumber?: string;
}

export interface FormProps {
  attendeeId: string;
  attendeeNumber: number;
  isPrimary?: boolean;
}

export interface SectionProps<T = AttendeeData> {
  data: T;
  type?: 'Mason' | 'Guest';
  isPrimary?: boolean;
  onChange: (field: string, value: any) => void;
}
```

2. Create type guards and utility types:
```typescript
export const isMason = (attendee: AttendeeData): boolean => 
  attendee.attendeeType === 'Mason';

export const isGuest = (attendee: AttendeeData): boolean => 
  attendee.attendeeType === 'Guest';

export const hasPartner = (attendee: AttendeeData): boolean => 
  !!attendee.partner;
```

3. Create form-specific type extensions

## Deliverables
- Complete type definitions file
- Type guards and utility functions
- Clear interface documentation

## Success Criteria
- All types from CLAUDE.md are defined
- Types are properly exported
- No type conflicts with existing code