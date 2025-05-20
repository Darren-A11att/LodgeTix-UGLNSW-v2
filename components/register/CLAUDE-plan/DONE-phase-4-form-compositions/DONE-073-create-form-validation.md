# Task 073: Create Form Validation

## Objective
Implement comprehensive validation for both MasonForm and GuestForm compositions using the validation utilities.

## Dependencies
- Task 008 (validation utils)
- Task 010 (business logic)
- Task 071 (MasonForm)
- Task 072 (GuestForm)

## Steps

1. Create `components/register/forms/attendee/lib/useFormValidation.ts`:
```typescript
import { useCallback, useEffect, useState } from 'react';
import { AttendeeData } from '../types';
import { validateAttendee, ValidationError, fieldValidators } from '../utils/validation';
import { getRequiredFields } from '../utils/businessLogic';
import { useAttendeeData } from './useAttendeeData';

interface UseFormValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

export const useFormValidation = (
  attendeeId: string,
  options: UseFormValidationOptions = {}
) => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 300,
  } = options;

  const { attendee } = useAttendeeData(attendeeId);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState(false);

  // Field-level validation
  const validateField = useCallback(async (
    fieldName: string,
    value: any
  ): Promise<string | null> => {
    // Get field validator if exists
    const fieldValidator = fieldValidators[fieldName];
    if (fieldValidator) {
      const isValid = await fieldValidator(value);
      if (!isValid) {
        return `Invalid ${fieldName}`;
      }
    }

    // Check required fields
    const requiredFields = getRequiredFields(attendee!);
    if (requiredFields.includes(fieldName) && !value) {
      return `${fieldName} is required`;
    }

    return null;
  }, [attendee]);

  // Form-level validation
  const validateForm = useCallback(async (): Promise<boolean> => {
    if (!attendee) return false;

    setIsValidating(true);
    
    try {
      const result = validateAttendee(attendee);
      
      // Convert validation errors to error map
      const errorMap: Record<string, string> = {};
      result.errors.forEach(error => {
        errorMap[error.field] = error.message;
      });
      
      setErrors(errorMap);
      return result.isValid;
    } finally {
      setIsValidating(false);
    }
  }, [attendee]);

  // Handle field change with validation
  const handleFieldChange = useCallback(async (
    fieldName: string,
    value: any
  ) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));

    if (validateOnChange) {
      const error = await validateField(fieldName, value);
      setErrors(prev => ({
        ...prev,
        [fieldName]: error || '',
      }));
    }
  }, [validateField, validateOnChange]);

  // Handle field blur
  const handleFieldBlur = useCallback(async (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));

    if (validateOnBlur && attendee) {
      const value = attendee[fieldName as keyof AttendeeData];
      const error = await validateField(fieldName, value);
      setErrors(prev => ({
        ...prev,
        [fieldName]: error || '',
      }));
    }
  }, [attendee, validateField, validateOnBlur]);

  // Get error for field (only if touched)
  const getFieldError = useCallback((fieldName: string): string | undefined => {
    return touched[fieldName] ? errors[fieldName] : undefined;
  }, [errors, touched]);

  // Clear errors
  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  return {
    errors,
    touched,
    isValidating,
    validateField,
    validateForm,
    handleFieldChange,
    handleFieldBlur,
    getFieldError,
    clearErrors,
  };
};
```

2. Create form-specific validation hooks:
```typescript
// Mason-specific validation
export const useMasonFormValidation = (attendeeId: string) => {
  const { attendee } = useAttendeeData(attendeeId);
  const baseValidation = useFormValidation(attendeeId);

  // Additional Mason-specific validation
  const validateMasonFields = useCallback(async () => {
    if (!attendee || attendee.attendeeType !== 'Mason') return true;

    const errors: Record<string, string> = {};

    // Validate title-rank combination
    if (attendee.title && attendee.rank) {
      const titleRankValid = validateMasonRank(attendee.title, attendee.rank);
      if (!titleRankValid) {
        errors.rank = 'Invalid rank for selected title';
      }
    }

    // Validate Grand Lodge/Lodge dependency
    if (attendee.lodgeId && !attendee.grandLodgeId) {
      errors.lodgeId = 'Please select a Grand Lodge first';
    }

    // Validate Grand Officer fields
    if (attendee.rank === 'GL' && attendee.isPrimary) {
      if (!attendee.grandOfficerStatus) {
        errors.grandOfficerStatus = 'Grand Officer status is required';
      }
      
      if (attendee.grandOfficerStatus === 'Present' && !attendee.presentGrandOfficerRole) {
        errors.presentGrandOfficerRole = 'Grand Officer role is required';
      }
      
      if (attendee.presentGrandOfficerRole === 'Other' && !attendee.otherGrandOfficerRole) {
        errors.otherGrandOfficerRole = 'Please specify the role';
      }
    }

    setErrors(prev => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  }, [attendee]);

  return {
    ...baseValidation,
    validateMasonFields,
  };
};

// Guest-specific validation
export const useGuestFormValidation = (attendeeId: string) => {
  const { attendee } = useAttendeeData(attendeeId);
  const baseValidation = useFormValidation(attendeeId);

  // Additional Guest-specific validation
  const validateGuestFields = useCallback(async () => {
    if (!attendee || attendee.attendeeType !== 'Guest') return true;

    const errors: Record<string, string> = {};

    // Validate partner relationship
    if (attendee.isPartner && !attendee.relationship) {
      errors.relationship = 'Please specify the relationship';
    }

    // Validate contact preference
    if (!attendee.isPrimary && !attendee.contactPreference) {
      errors.contactPreference = 'Please select a contact preference';
    }

    setErrors(prev => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  }, [attendee]);

  return {
    ...baseValidation,
    validateGuestFields,
  };
};
```

3. Create validated form wrappers:
```typescript
// Validated MasonForm
export const ValidatedMasonForm: React.FC<FormProps> = (props) => {
  const { errors, getFieldError, handleFieldChange, handleFieldBlur } = useMasonFormValidation(props.attendeeId);
  const { attendee, updateField } = useAttendeeData(props.attendeeId);

  const handleChange = useCallback((field: string, value: any) => {
    updateField(field, value);
    handleFieldChange(field, value);
  }, [updateField, handleFieldChange]);

  if (!attendee) return null;

  return (
    <MasonForm
      {...props}
      onChange={handleChange}
      onBlur={handleFieldBlur}
      errors={{
        title: getFieldError('title'),
        firstName: getFieldError('firstName'),
        lastName: getFieldError('lastName'),
        rank: getFieldError('rank'),
        grandLodgeId: getFieldError('grandLodgeId'),
        lodgeId: getFieldError('lodgeId'),
        grandOfficerStatus: getFieldError('grandOfficerStatus'),
        presentGrandOfficerRole: getFieldError('presentGrandOfficerRole'),
        otherGrandOfficerRole: getFieldError('otherGrandOfficerRole'),
        primaryEmail: getFieldError('primaryEmail'),
        primaryPhone: getFieldError('primaryPhone'),
      }}
    />
  );
};

// Validated GuestForm
export const ValidatedGuestForm: React.FC<FormProps> = (props) => {
  const { errors, getFieldError, handleFieldChange, handleFieldBlur } = useGuestFormValidation(props.attendeeId);
  const { attendee, updateField } = useAttendeeData(props.attendeeId);

  const handleChange = useCallback((field: string, value: any) => {
    updateField(field, value);
    handleFieldChange(field, value);
  }, [updateField, handleFieldChange]);

  if (!attendee) return null;

  return (
    <GuestForm
      {...props}
      onChange={handleChange}
      onBlur={handleFieldBlur}
      errors={{
        title: getFieldError('title'),
        firstName: getFieldError('firstName'),
        lastName: getFieldError('lastName'),
        relationship: getFieldError('relationship'),
        contactPreference: getFieldError('contactPreference'),
        primaryEmail: getFieldError('primaryEmail'),
        primaryPhone: getFieldError('primaryPhone'),
      }}
    />
  );
};
```

## Deliverables
- Form validation hook
- Field-level validation
- Form-level validation
- Type-specific validation hooks
- Validated form wrappers

## Success Criteria
- Real-time field validation
- Form submission validation
- Clear error messages
- Type-specific rules enforced
- Performance optimized with debouncing