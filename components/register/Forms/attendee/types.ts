// Type definitions for the new forms architecture
import { UnifiedAttendeeData } from '@/lib/registrationStore';

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
  contactPreference: 'directly' | 'primaryattendee' | 'providelater';
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
  grand_lodge_id?: string;
  grandLodgeOrganisationId?: string;
  lodge_id?: string;
  lodgeOrganisationId?: string;
  lodgeNameNumber?: string;
  useSameLodge?: boolean;
}

// Props for form components
export interface FormProps {
  attendeeId: string;
  attendeeNumber: number;
  isPrimary?: boolean;
}

// Props for section components - now accepts either AttendeeData or UnifiedAttendeeData
export interface SectionProps<T = AttendeeData | UnifiedAttendeeData> {
  data: T;
  type?: 'Mason' | 'Guest';
  isPrimary?: boolean;
  onChange: (field: string, value: any) => void;
}

// Type guards and utility types
export const isMason = (attendee: AttendeeData | UnifiedAttendeeData): boolean => 
  attendee.attendeeType === 'Mason';

export const isGuest = (attendee: AttendeeData | UnifiedAttendeeData): boolean => 
  attendee.attendeeType === 'Guest';

export const hasPartner = (attendee: AttendeeData | UnifiedAttendeeData): boolean => 
  !!attendee.partner;