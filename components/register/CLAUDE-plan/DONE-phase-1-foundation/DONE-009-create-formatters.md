# Task 009: Create Formatters

## Objective
Create formatting utilities for consistent data display and input handling across all forms.

## Dependencies
- Task 003 (type definitions)

## Reference Files
- Look for any formatting logic in existing forms
- Phone number formatting
- Name formatting (title case, etc.)

## Steps

1. Create `components/register/forms/attendee/utils/formatters.ts`:
```typescript
// Phone number formatting
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    // Australian format: 0400 000 000
    return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  }
  
  // International format
  if (cleaned.startsWith('61') && cleaned.length === 11) {
    // Australian international: +61 400 000 000
    return '+' + cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
  }
  
  // Default: just add spaces every 3-4 digits
  return cleaned.replace(/(\d{3,4})(?=\d)/g, '$1 ');
};

// Name formatting
export const formatName = (name: string): string => {
  return name
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Title formatting for display
export const formatTitle = (title: string, firstName: string, lastName: string): string => {
  return `${title} ${firstName} ${lastName}`.trim();
};

// Lodge display formatting
export const formatLodgeDisplay = (name: string, number: string | number): string => {
  if (!name) return '';
  if (!number) return name;
  return `${name} No. ${number}`;
};

// Email formatting (lowercase, trim)
export const formatEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

// Grand Officer display
export const formatGrandOfficerDisplay = (
  status: 'Present' | 'Past',
  role?: string
): string => {
  if (!role) return status;
  return `${status} ${role}`;
};

// Date formatting (if needed)
export const formatDate = (date: Date | string): string => {
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
  // Remove potentially harmful characters
  return input.replace(/[<>]/g, '');
};

// Form field value normalizer
export const normalizeFieldValue = (field: string, value: any): any => {
  switch (field) {
    case 'primaryEmail':
      return formatEmail(value);
    case 'primaryPhone':
      return formatPhoneNumber(value);
    case 'firstName':
    case 'lastName':
      return formatName(value);
    default:
      return typeof value === 'string' ? value.trim() : value;
  }
};
```

2. Create display formatters for summary views:
```typescript
export const formatAttendeeSummary = (attendee: AttendeeData): string => {
  const name = formatTitle(attendee.title, attendee.firstName, attendee.lastName);
  if (attendee.attendeeType === 'Mason' && attendee.lodgeNameNumber) {
    return `${name} - ${attendee.lodgeNameNumber}`;
  }
  return name;
};

export const formatContactPreference = (preference: string): string => {
  const mappings = {
    'Directly': 'Contact directly',
    'PrimaryAttendee': 'Via primary attendee',
    'ProvideLater': 'Provide later'
  };
  return mappings[preference] || preference;
};
```

## Deliverables
- Complete formatting utilities
- Input sanitization functions
- Display formatters
- Field-specific formatters

## Success Criteria
- All formatting logic extracted from old forms
- Consistent formatting across all components
- Proper handling of edge cases
- Type-safe formatting functions