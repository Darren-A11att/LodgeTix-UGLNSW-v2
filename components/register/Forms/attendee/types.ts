// Type definitions for the new forms architecture
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
  isPartner: string | null; // FK to parent attendee (if this attendee is a partner)
  partner?: string | null; // FK to partner attendee (if this attendee has a partner)
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
  grandOfficerDetails?: string;
  grandLodgeId?: string;
  lodgeId?: string;
  lodgeNameNumber?: string;
}

// Props for form components
export interface FormProps {
  attendeeId: string;
  attendeeNumber: number;
  isPrimary?: boolean;
}

// Props for section components
export interface SectionProps<T = AttendeeData> {
  data: T;
  type?: 'Mason' | 'Guest';
  isPrimary?: boolean;
  onChange: (field: string, value: any) => void;
}

// Type guards and utility types
export const isMason = (attendee: AttendeeData): boolean => 
  attendee.attendeeType === 'Mason';

export const isGuest = (attendee: AttendeeData): boolean => 
  attendee.attendeeType === 'Guest';

export const hasPartner = (attendee: AttendeeData): boolean => 
  !!attendee.partner;