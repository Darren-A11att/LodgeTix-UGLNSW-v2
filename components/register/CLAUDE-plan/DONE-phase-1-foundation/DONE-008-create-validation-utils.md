# Task 008: Create Validation Utils

## Objective
Extract validation logic from existing forms and create centralized validation utilities.

## Dependencies
- Task 007 (constants)
- Task 003 (type definitions)

## Reference Files
- `components/register/oldforms/mason/MasonContactInfo.tsx` (email validation)
- `components/register/oldforms/guest/GuestContactInfo.tsx` (phone validation)
- Any other files with validation logic

## Steps

1. Create `components/register/forms/attendee/utils/validation.ts`:
```typescript
import { AttendeeData } from '../types';
import { GRAND_TITLES } from './constants';

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateEmailDomain = async (email: string): Promise<boolean> => {
  // Extract domain and perform basic checks
  const domain = email.split('@')[1];
  if (!domain) return false;
  
  // Could add DNS validation here if needed
  return true;
};

// Phone validation
export const validatePhone = (phone: string): boolean => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  // Check if it's a valid length for international numbers
  return cleaned.length >= 10 && cleaned.length <= 15;
};

// Name validation
export const validateName = (name: string): boolean => {
  return name.trim().length >= 2;
};

// Mason-specific validation
export const validateMasonRank = (title: string, rank: string): boolean => {
  if (GRAND_TITLES.includes(title) && rank !== 'GL') {
    return false;
  }
  if (title === 'W Bro' && rank === 'GL') {
    return false;
  }
  return true;
};

// Attendee validation
export const validateAttendee = (attendee: AttendeeData): ValidationResult => {
  const errors: ValidationError[] = [];

  // Basic fields
  if (!validateName(attendee.firstName)) {
    errors.push({ field: 'firstName', message: 'First name is required' });
  }
  if (!validateName(attendee.lastName)) {
    errors.push({ field: 'lastName', message: 'Last name is required' });
  }

  // Contact validation based on preference
  if (attendee.isPrimary || attendee.contactPreference === 'Directly') {
    if (!validateEmail(attendee.primaryEmail)) {
      errors.push({ field: 'primaryEmail', message: 'Valid email is required' });
    }
    if (!validatePhone(attendee.primaryPhone)) {
      errors.push({ field: 'primaryPhone', message: 'Valid phone is required' });
    }
  }

  // Mason-specific validation
  if (attendee.attendeeType === 'Mason') {
    if (!attendee.rank) {
      errors.push({ field: 'rank', message: 'Rank is required' });
    }
    if (attendee.rank === 'GL' && attendee.isPrimary) {
      if (!attendee.grandOfficerStatus) {
        errors.push({ field: 'grandOfficerStatus', message: 'Grand Officer status is required' });
      }
      if (attendee.grandOfficerStatus === 'Present' && !attendee.presentGrandOfficerRole) {
        errors.push({ field: 'presentGrandOfficerRole', message: 'Grand Officer role is required' });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Types for validation
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
```

2. Create field-specific validators:
```typescript
export const fieldValidators = {
  email: validateEmail,
  phone: validatePhone,
  firstName: validateName,
  lastName: validateName,
  // Add more as needed
};
```

3. Create async validation wrapper:
```typescript
export const useValidation = () => {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  
  const validateField = useCallback(async (field: string, value: any) => {
    // Implement field validation with error state management
  }, []);
  
  return { errors, validateField };
};
```

## Deliverables
- Comprehensive validation utilities
- Field-specific validators
- Attendee-level validation
- Async validation support

## Success Criteria
- All validation logic extracted from old forms
- Validation is reusable across components
- Error messages are consistent
- Type-safe validation functions