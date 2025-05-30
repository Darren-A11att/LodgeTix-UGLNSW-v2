import { AttendeeData } from '../types';
import { GRAND_TITLES } from './constants';

// Email validation
export const validateEmail = (email: string): boolean => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateEmailDomain = async (email: string): Promise<boolean> => {
  // Extract domain and perform basic checks
  const domain = email.split('@')[1];
  if (!domain) return false;
  
  // Basic domain validation (could add DNS validation here if needed)
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?)*$/;
  return domainRegex.test(domain);
};

// Phone validation
export const validatePhone = (phone: string): boolean => {
  if (!phone) return false;
  // Remove all non-numeric characters except + for international codes
  const cleaned = phone.replace(/[^\d+]/g, '');
  // Check if it's a valid length for international numbers
  return cleaned.length >= 10 && cleaned.length <= 15;
};

export const validateInternationalPhone = (phone: string): boolean => {
  if (!phone) return false;
  // International phone regex pattern
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return phoneRegex.test(cleaned);
};

// Name validation
export const validateName = (name: string): boolean => {
  if (!name) return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 20;  // Updated to 20 chars as per requirement
};

// No Mason-specific validation for rank/title combinations
// This is handled as helpful suggestions in businessLogic.ts, not as validation rules

// Grand Officer validation
export const validateGrandOfficerFields = (attendee: Partial<AttendeeData>): boolean => {
  if (attendee.rank !== 'GL') return true;
  
  if (!attendee.grandOfficerStatus) return false;
  
  if (attendee.grandOfficerStatus === 'Present') {
    if (!attendee.presentGrandOfficerRole) return false;
    if (attendee.presentGrandOfficerRole === 'Other' && !attendee.otherGrandOfficerRole) {
      return false;
    }
  }
  
  return true;
};

// Contact preference validation
export const validateContactPreference = (attendee: Partial<AttendeeData>): boolean => {
  if (attendee.isPrimary) return true;
  
  const validPreferences = ['Directly', 'PrimaryAttendee', 'ProvideLater'];
  return validPreferences.includes(attendee.contactPreference || '');
};

// Attendee validation
export const validateAttendee = (attendee: AttendeeData): ValidationResult => {
  const errors: ValidationError[] = [];

  // Basic fields
  if (!validateName(attendee.firstName)) {
    errors.push({ field: 'firstName', message: 'First name must be 2-20 characters' });
  }
  if (!validateName(attendee.lastName)) {
    errors.push({ field: 'lastName', message: 'Last name must be 2-20 characters' });
  }
  if (!attendee.title) {
    errors.push({ field: 'title', message: 'Title is required' });
  }

  // Contact validation based on preference
  if (attendee.isPrimary || attendee.contactPreference === 'Directly') {
    if (!validateEmail(attendee.primaryEmail)) {
      errors.push({ field: 'primaryEmail', message: 'Valid email is required' });
    }
    if (!validatePhone(attendee.primaryPhone)) {
      errors.push({ field: 'primaryPhone', message: 'Valid phone number is required' });
    }
  }

  // Mason-specific validation
  if (attendee.attendeeType === 'Mason') {
    if (!attendee.rank) {
      errors.push({ field: 'rank', message: 'Rank is required' });
    }
    
    // Validate Grand Rank (suffix) field when rank is 'GL' 
    // Field is only displayed when rank is 'GL', so we only validate in that case
    if (attendee.rank === 'GL' && attendee.isPrimary && !attendee.suffix) {
      errors.push({ field: 'suffix', message: 'Grand Rank is required' });
    }
    
    if (attendee.rank === 'GL' && attendee.isPrimary) {
      if (!attendee.grandOfficerStatus) {
        errors.push({ field: 'grandOfficerStatus', message: 'Grand Officer status is required' });
      }
      if (attendee.grandOfficerStatus === 'Present' && !attendee.presentGrandOfficerRole) {
        errors.push({ field: 'presentGrandOfficerRole', message: 'Grand Officer role is required' });
      }
      if (attendee.presentGrandOfficerRole === 'Other' && !attendee.otherGrandOfficerRole) {
        errors.push({ field: 'otherGrandOfficerRole', message: 'Other role description is required' });
      }
    }
    
    // Lodge validation
    if (attendee.isPrimary) {
      if (!attendee.grand_lodge_id) {
        errors.push({ field: 'grand_lodge_id', message: 'Grand Lodge is required' });
      }
      if (!attendee.lodge_id && !attendee.lodgeNameNumber) {
        errors.push({ field: 'lodge_id', message: 'Lodge is required' });
      }
    }
  }
  
  // Contact preference validation
  if (!attendee.isPrimary && !validateContactPreference(attendee)) {
    errors.push({ field: 'contactPreference', message: 'Valid contact preference is required' });
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

// Field-specific validators
export const fieldValidators = {
  email: validateEmail,
  primaryEmail: validateEmail,
  phone: validatePhone,
  primaryPhone: validatePhone,
  firstName: validateName,
  lastName: validateName,
  title: (value: string) => !!value,
  rank: (value: string) => !!value,
  contactPreference: (value: string) => validateContactPreference({ contactPreference: value }),
};

// Real-time field validation hook
import { useState, useCallback } from 'react';

export const useValidation = () => {
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const validateField = useCallback(async (field: string, value: any): Promise<boolean> => {
    const validator = fieldValidators[field as keyof typeof fieldValidators];
    if (!validator) return true;
    
    const isValid = validator(value);
    
    setErrors(prevErrors => {
      const newErrors = prevErrors.filter(error => error.field !== field);
      if (!isValid) {
        newErrors.push({ 
          field, 
          message: getFieldErrorMessage(field, value) 
        });
      }
      return newErrors;
    });
    
    return isValid;
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors(prevErrors => prevErrors.filter(error => error.field !== field));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return { 
    errors, 
    validateField, 
    clearFieldError, 
    clearAllErrors 
  };
};

// Helper function to get appropriate error messages
function getFieldErrorMessage(field: string, value: any): string {
  switch (field) {
    case 'email':
    case 'primaryEmail':
      return 'Please enter a valid email address';
    case 'phone':
    case 'primaryPhone':
      return 'Please enter a valid phone number';
    case 'firstName':
    case 'lastName':
      return `${field === 'firstName' ? 'First' : 'Last'} name must be 2-20 characters`;
    case 'title':
      return 'Please select a title';
    case 'rank':
      return 'Please select a rank';
    case 'contactPreference':
      return 'Please select how to contact this attendee';
    default:
      return 'This field is required';
  }
}