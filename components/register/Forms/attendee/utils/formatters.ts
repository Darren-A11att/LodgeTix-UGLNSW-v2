import { AttendeeData } from '../types';

// Phone number formatting
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-numeric characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Format based on length and pattern
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    // Australian format: 0400 000 000
    return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  }
  
  // International format
  if (cleaned.startsWith('+61') && cleaned.length === 12) {
    // Australian international: +61 400 000 000
    return cleaned.replace(/(\+\d{2})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
  }
  
  if (cleaned.startsWith('+')) {
    // Generic international format
    const countryCode = cleaned.match(/^\+\d{1,3}/)?.[0] || '';
    const remaining = cleaned.slice(countryCode.length);
    const formatted = remaining.replace(/(\d{3,4})(?=\d)/g, '$1 ');
    return `${countryCode} ${formatted}`.trim();
  }
  
  // Default: just add spaces every 3-4 digits
  return cleaned.replace(/(\d{3,4})(?=\d)/g, '$1 ');
};

// Name formatting
export const formatName = (name: string): string => {
  if (!name) return '';
  
  return name
    .trim()
    .split(/\s+/)
    .map(word => {
      // Handle special cases (e.g., McDonald, O'Brien)
      if (word.includes("'")) {
        const parts = word.split("'");
        return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join("'");
      }
      if (word.startsWith('Mc') && word.length > 2) {
        return 'Mc' + word.charAt(2).toUpperCase() + word.slice(3).toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

// Title formatting for display
export const formatTitle = (title: string, firstName: string, lastName: string, suffix?: string): string => {
  const parts = [title, firstName, lastName];
  if (suffix) parts.push(suffix);
  return parts.filter(Boolean).join(' ');
};

// Lodge display formatting
export const formatLodgeDisplay = (name: string, number?: string | number | null): string => {
  if (!name) return '';
  if (!number) return name;
  return `${name} No. ${number}`;
};

// Email formatting (lowercase, trim)
export const formatEmail = (email: string): string => {
  if (!email) return '';
  return email.trim().toLowerCase();
};

// Grand Officer display
export const formatGrandOfficerDisplay = (
  status: 'Present' | 'Past',
  role?: string,
  otherRole?: string
): string => {
  if (!role) return status;
  if (role === 'Other' && otherRole) {
    return `${status} ${otherRole}`;
  }
  return `${status} ${role}`;
};

// Date formatting
export const formatDate = (date: Date | string): string => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Currency formatting
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD'
  }).format(amount);
};

// Input sanitization
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  // Remove potentially harmful characters while preserving valid ones
  return input.replace(/[<>]/g, '').trim();
};

// Form field value normalizer
export const normalizeFieldValue = (field: string, value: any): any => {
  if (value === null || value === undefined) return '';
  
  switch (field) {
    case 'primaryEmail':
    case 'email':
      return formatEmail(value);
    case 'primaryPhone':
    case 'phone':
    case 'mobile':
      return formatPhoneNumber(value);
    case 'firstName':
    case 'lastName':
      return formatName(value);
    default:
      return typeof value === 'string' ? value.trim() : value;
  }
};

// Attendee summary formatters
export const formatAttendeeSummary = (attendee: AttendeeData): string => {
  const name = formatTitle(attendee.title, attendee.firstName, attendee.lastName, attendee.suffix);
  
  if (attendee.attendeeType === 'Mason') {
    const lodgeInfo = attendee.lodgeNameNumber || 
                     (attendee.lodge_id ? formatLodgeDisplay(attendee.lodge_id, null) : '');
    return lodgeInfo ? `${name} - ${lodgeInfo}` : name;
  }
  
  return name;
};

// Contact preference formatter
export const formatContactPreference = (preference: string): string => {
  const mappings: Record<string, string> = {
    'Directly': 'Contact directly',
    'PrimaryAttendee': 'Via primary attendee',
    'ProvideLater': 'Provide details later'
  };
  return mappings[preference] || preference;
};

// Relationship formatter
export const formatRelationship = (relationship: string | null | undefined): string => {
  if (!relationship) return '';
  
  // Format common relationships
  const mappings: Record<string, string> = {
    'Wife': 'Wife',
    'Husband': 'Husband',
    'Partner': 'Partner',
    'Spouse': 'Spouse',
    'Fiancee': 'Fiancée',
    'Fiance': 'Fiancé'
  };
  
  return mappings[relationship] || relationship;
};

// Mason rank formatter
export const formatMasonRank = (rank: string): string => {
  const rankMappings: Record<string, string> = {
    'EAF': 'Entered Apprentice Freemason',
    'FCF': 'Fellow Craft Freemason',
    'MM': 'Master Mason',
    'IM': 'Installed Master',
    'GL': 'Grand Lodge'
  };
  return rankMappings[rank] || rank;
};

// Address formatter (if needed)
export const formatAddress = (
  addressLine1: string,
  addressLine2?: string,
  city?: string,
  state?: string,
  postalCode?: string,
  country?: string
): string => {
  const parts = [
    addressLine1,
    addressLine2,
    city,
    state && postalCode ? `${state} ${postalCode}` : state || postalCode,
    country
  ].filter(Boolean);
  
  return parts.join(', ');
};

// Field label formatter (for dynamic field labels)
export const formatFieldLabel = (fieldName: string): string => {
  // Convert camelCase or snake_case to Title Case
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
    .trim();
};

// Initials formatter
export const formatInitials = (firstName: string, lastName: string): string => {
  const first = firstName.charAt(0).toUpperCase();
  const last = lastName.charAt(0).toUpperCase();
  return `${first}${last}`;
};