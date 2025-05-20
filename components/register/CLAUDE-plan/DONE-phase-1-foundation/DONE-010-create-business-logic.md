# Task 010: Create Business Logic

## Objective
Extract and centralize all business logic from existing forms, including title-rank interactions and conditional field display rules.

## Dependencies
- Task 007 (constants)
- Task 003 (type definitions)

## Reference Files
- `components/register/oldforms/mason/MasonBasicInfo.tsx` (title-rank logic)
- `components/register/oldforms/mason/MasonGrandLodgeFields.tsx` (conditional display)
- `components/register/oldforms/mason/MasonLodgeInfo.tsx` (use same lodge logic)

## Steps

1. Create `components/register/forms/attendee/utils/businessLogic.ts`:
```typescript
import { AttendeeData } from '../types';
import { GRAND_TITLES, MASON_RANKS } from './constants';

// Title-Rank Interaction Logic
export const isGrandTitle = (title: string): boolean => {
  return GRAND_TITLES.includes(title);
};

export const handleTitleChange = (
  title: string, 
  currentRank: string
): { title: string; rank?: string } => {
  // If W Bro is selected and not Grand Lodge, set to Installed Master
  if (title === 'W Bro' && currentRank !== 'GL') {
    return { title, rank: 'IM' };
  }
  
  // If a Grand title is selected, set rank to GL
  if (isGrandTitle(title)) {
    return { title, rank: 'GL' };
  }
  
  return { title };
};

export const handleRankChange = (
  rank: string, 
  currentTitle: string,
  currentGrandOfficerStatus?: string
): Partial<AttendeeData> => {
  const updates: Partial<AttendeeData> = { rank };
  
  // Clear Grand Officer fields if rank changes from GL
  if (currentRank === 'GL' && rank !== 'GL') {
    updates.grandOfficerStatus = null;
    updates.presentGrandOfficerRole = null;
    updates.otherGrandOfficerRole = null;
  }
  
  // Adjust title if necessary
  if (rank === 'GL' && currentTitle === 'Bro') {
    updates.title = 'W Bro'; // Minimum title for GL
  }
  
  return updates;
};

// Field Display Rules
export const shouldShowGrandOfficerFields = (
  attendee: AttendeeData
): boolean => {
  return attendee.attendeeType === 'Mason' && attendee.rank === 'GL';
};

export const shouldShowOtherGrandOfficerInput = (
  attendee: AttendeeData
): boolean => {
  return attendee.grandOfficerStatus === 'Present' && 
         attendee.presentGrandOfficerRole === 'Other';
};

export const shouldShowContactFields = (
  attendee: AttendeeData
): boolean => {
  return attendee.isPrimary || attendee.contactPreference === 'Directly';
};

export const shouldShowConfirmationMessage = (
  attendee: AttendeeData
): boolean => {
  return !attendee.isPrimary && 
         (attendee.contactPreference === 'PrimaryAttendee' || 
          attendee.contactPreference === 'ProvideLater');
};

export const shouldShowUseSameLodge = (
  attendee: AttendeeData,
  primaryAttendee?: AttendeeData
): boolean => {
  return !attendee.isPrimary && 
         attendee.attendeeType === 'Mason' &&
         !!primaryAttendee &&
         primaryAttendee.attendeeType === 'Mason' &&
         !!primaryAttendee.lodgeId;
};

// Partner Logic
export const canHavePartner = (attendee: AttendeeData): boolean => {
  // Any attendee can have a partner
  return true;
};

export const getPartnerDefaults = (
  parentAttendee: AttendeeData
): Partial<AttendeeData> => {
  return {
    attendeeType: 'Guest',
    isPrimary: false,
    isPartner: parentAttendee.attendeeId,
    contactPreference: 'PrimaryAttendee',
    // Copy some fields from parent
    lastName: parentAttendee.lastName,
  };
};

// Lodge Logic
export const handleUseSameLodgeChange = (
  isChecked: boolean,
  attendee: AttendeeData,
  primaryAttendee?: AttendeeData
): Partial<AttendeeData> => {
  if (isChecked && primaryAttendee) {
    return {
      grandLodgeId: primaryAttendee.grandLodgeId,
      lodgeId: primaryAttendee.lodgeId,
      lodgeNameNumber: primaryAttendee.lodgeNameNumber,
    };
  } else {
    return {
      grandLodgeId: null,
      lodgeId: null,
      lodgeNameNumber: null,
    };
  }
};

// Validation dependencies
export const getRequiredFields = (attendee: AttendeeData): string[] => {
  const required = ['title', 'firstName', 'lastName'];
  
  if (attendee.attendeeType === 'Mason') {
    required.push('rank');
    
    if (attendee.rank === 'GL' && attendee.isPrimary) {
      required.push('grandOfficerStatus');
      
      if (attendee.grandOfficerStatus === 'Present') {
        required.push('presentGrandOfficerRole');
        
        if (attendee.presentGrandOfficerRole === 'Other') {
          required.push('otherGrandOfficerRole');
        }
      }
    }
  }
  
  if (shouldShowContactFields(attendee)) {
    required.push('primaryEmail', 'primaryPhone');
  }
  
  return required;
};

// Contact preference message generator
export const getConfirmationMessage = (
  preference: string, 
  primaryName: string
): string => {
  if (preference === 'PrimaryAttendee') {
    return `I confirm that ${primaryName} will be responsible for all communication with this attendee.`;
  }
  if (preference === 'ProvideLater') {
    return `I confirm that ${primaryName} will be responsible for all communication with this attendee until their contact details have been updated.`;
  }
  return '';
};
```

2. Create field mapping utilities:
```typescript
// Field name mappings for store compatibility
export const mapFieldNameToStore = (fieldName: string): string => {
  const mappings = {
    'email': 'primaryEmail',
    'mobile': 'primaryPhone',
    'hasPartner': 'hasGuestPartner'
  };
  return mappings[fieldName] || fieldName;
};

export const mapContactPreferenceToStore = (value: string): string => {
  const mappings = {
    'Primary Attendee': 'PrimaryAttendee',
    'Provide Later': 'ProvideLater',
    'Directly': 'Directly'
  };
  return mappings[value] || value;
};
```

## Deliverables
- Complete business logic utilities
- Field display rules
- Conditional logic handlers
- Validation dependencies
- Field mapping functions

## Success Criteria
- All business logic extracted from old forms
- Logic is reusable and testable
- Clear function naming and documentation
- Type-safe implementations