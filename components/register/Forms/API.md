# Forms API Reference

## Hooks

### useAttendeeData
```typescript
const { attendee, updateField, updateMultipleFields, deleteAttendee } = useAttendeeData(attendeeId: string);
```

**Parameters:**
- `attendeeId`: Unique identifier for the attendee

**Returns:**
- `attendee`: Current attendee data
- `updateField`: Update single field
- `updateMultipleFields`: Update multiple fields
- `deleteAttendee`: Remove attendee

**Example:**
```typescript
const { attendee, updateField } = useAttendeeData('attendee-123');
updateField('firstName', 'John');
```

### usePartnerManager
```typescript
const { attendee, partner, hasPartner, togglePartner } = usePartnerManager(attendeeId: string);
```

**Parameters:**
- `attendeeId`: ID of the parent attendee

**Returns:**
- `attendee`: Parent attendee data
- `partner`: Partner attendee data (if exists)
- `hasPartner`: Boolean flag
- `togglePartner`: Add/remove partner

**Example:**
```typescript
const { partner, togglePartner } = usePartnerManager('attendee-123');
if (!partner) {
  togglePartner(); // Adds partner
}
```

### usePersistence
```typescript
const { saveDraft, loadDraft, clearDraft } = usePersistence(formId: string);
```

**Parameters:**
- `formId`: Unique identifier for the form

**Returns:**
- `saveDraft`: Save form data to storage
- `loadDraft`: Load saved draft
- `clearDraft`: Remove saved draft

### useValidation
```typescript
const { errors, validateField, clearFieldError, clearAllErrors } = useValidation();
```

**Returns:**
- `errors`: Current validation errors
- `validateField`: Validate single field
- `clearFieldError`: Clear error for specific field
- `clearAllErrors`: Clear all errors

## Components

### AttendeeWithPartner
Main container for attendee forms with optional partner.

**Props:**
- `attendeeId`: string - Unique attendee identifier
- `attendeeNumber`: number - Display number for the attendee
- `isPrimary?`: boolean - Whether this is the primary attendee
- `allowPartner?`: boolean - Whether to show partner toggle
- `className?`: string - Additional CSS classes

**Example:**
```typescript
<AttendeeWithPartner
  attendeeId="attendee-123"
  attendeeNumber={1}
  isPrimary={true}
  allowPartner={true}
/>
```

### MasonForm
Form layout for Mason attendees.

**Props:**
- `attendeeId`: string
- `attendeeNumber`: number
- `isPrimary?`: boolean

**Sections included:**
- BasicInfo (with Mason fields)
- GrandOfficerFields (conditional)
- GrandLodgeSelection
- LodgeSelection
- ContactInfo
- AdditionalInfo

### GuestForm  
Form layout for Guest attendees.

**Props:**
- `attendeeId`: string
- `attendeeNumber`: number
- `isPrimary?`: boolean

**Sections included:**
- BasicInfo (without Mason fields)
- ContactInfo
- AdditionalInfo

## Section Components

### BasicInfo
Personal information section for both Mason and Guest.

**Props:**
```typescript
interface SectionProps {
  data: AttendeeData;
  type: 'Mason' | 'Guest';
  isPrimary?: boolean;
  onChange: (field: string, value: any) => void;
}
```

**Fields:**
- Title
- First Name
- Last Name
- Suffix (optional)
- Rank (Mason only)

### ContactInfo
Contact information and preference section.

**Props:**
- Same as BasicInfo

**Fields:**
- Contact Preference (non-primary only)
- Email (conditional)
- Phone (conditional)

### AdditionalInfo
Dietary requirements and special needs.

**Props:**
- Same as BasicInfo

**Fields:**
- Dietary Requirements (200 char max)
- Special Needs

## Utilities

### Validation Functions
```typescript
validateEmail(email: string): boolean
validatePhone(phone: string): boolean  
validateName(name: string): boolean
validateAttendee(attendee: AttendeeData): ValidationResult
```

### Business Logic
```typescript
handleTitleChange(title: string, currentRank: string): Partial<AttendeeData>
shouldShowGrandOfficerFields(attendee: AttendeeData): boolean
shouldShowContactFields(attendee: AttendeeData): boolean
getRequiredFields(attendee: AttendeeData): string[]
```

### Formatters
```typescript
formatPhoneNumber(phone: string): string
formatName(name: string): string
formatLodgeDisplay(name: string, number: string): string
```

## Type Definitions

### AttendeeData
```typescript
interface AttendeeData {
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
  relationship?: string;
  
  // Additional
  dietaryRequirements: string;
  specialNeeds: string;
  
  // Mason-specific
  masonicTitle?: string;
  rank?: string;
  grandOfficerStatus?: string;
  presentGrandOfficerRole?: string;
  otherGrandOfficerRole?: string;
  grandLodgeId?: string;
  lodgeId?: string;
  lodgeNameNumber?: string;
}
```

### ValidationResult
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
}
```

## Constants

### Titles
```typescript
MASON_TITLES = ["Bro", "W Bro", "VW Bro", "RW Bro", "MW Bro"];
GUEST_TITLES = ["Mr", "Mrs", "Ms", "Miss", "Dr", "Rev", "Prof"];
```

### Ranks
```typescript
MASON_RANKS = [
  { value: "EAF", label: "EAF" },
  { value: "FCF", label: "FCF" },
  { value: "MM", label: "MM" },
  { value: "IM", label: "IM" },
  { value: "GL", label: "GL" }
];
```

### Contact Preferences
```typescript
CONTACT_PREFERENCES = ["Directly", "PrimaryAttendee", "ProvideLater"];
```