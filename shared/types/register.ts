import { AttendeeData } from '../../lib/api/registrations';
import { ProgressStep } from '../../hooks/useRegistrationProgress';
import { EmailConflictInfo } from './validation';
import { AttendeeType } from './enums';
import { z } from 'zod';
// Assuming validation schemas are defined here or imported elsewhere
// import { MasonSchema, LadyPartnerSchema, GuestSchema, GuestPartnerSchema } from './validation';

export enum AttendeeType {
  MASON = 'mason',
  LADY_PARTNER = 'ladypartner',
  GUEST = 'guest',
  GUEST_PARTNER = 'guestpartner'
}

export interface TicketType {
  event_ticket_id: string;
  name: string;
  description: string;
  price: number;           // Required as per the schema update
  includes: string[];
  event_id?: string;       // Now required in the database schema
}

export interface AttendeeTicket {
  event_ticket_id: string;
  events: string[]; // Array of selected event IDs (at least one is required)
}

export interface LadyPartnerData {
  attendee_id: string;
  title: string;
  first_name: string;
  last_name: string;
  dietary_requirements: string;
  special_needs: string;
  relationship: string; // Tracks relationship to the Mason
  related_attendee_id: string; // Tracks which Mason this Lady/Partner belongs to
  contact_preference: string; // Mason, Directly, Provide Later
  phone: string;
  email: string;
  has_partner: boolean; // Whether attendee has partner
  ticket?: AttendeeTicket; // Selected ticket and events
}

export interface MasonData {
  attendee_id: string;
  title: string;
  first_name: string;
  last_name: string;
  event_title: string; // Masonic rank/title for event
  phone: string;
  email: string;
  contact_preference?: string; // Primary Attendee, Directly, Provide Later - Only for additional Masons
  dietary_requirements: string;
  special_needs: string;
  has_partner: boolean;
  ticket?: AttendeeTicket; // Selected ticket and events
  
  // Mason-specific fields (stored in masonic_profiles or derived)
  lodge_id?: string;
  lodge_name?: string;
  grand_lodge_id?: string;
  grand_lodge_name?: string;
  masonic_rank?: string;
  grand_rank?: string; // For GL rank
  grand_officer?: string; // Current or Past
  grand_office?: string; // Specific grand office when Current
  
  // UI state fields
  sameLodgeAsPrimary?: boolean;
  isPendingNewLodge?: boolean; 
  pendingLodgeDetails?: { name: string; number: string; grand_lodge_id: string } | null;
}

export interface GuestPartnerData {
  attendee_id: string;
  title: string;
  first_name: string;
  last_name: string;
  dietary_requirements: string;
  special_needs: string;
  relationship: string; // Tracks relationship to the Guest
  related_attendee_id: string; // Tracks which Guest this Partner belongs to
  contact_preference: string; // Mason, Guest, Directly, Provide Later
  phone: string;
  email: string;
  has_partner: boolean; // Whether attendee has partner
  ticket?: AttendeeTicket; // Selected ticket and events
}

export interface GuestData {
  attendee_id: string;
  title: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  dietary_requirements: string;
  special_needs: string;
  has_partner: boolean; // Flag for partner registration
  contact_preference: string; // Primary Attendee, Directly, Provide Later
  ticket?: AttendeeTicket; // Selected ticket and events
}

export interface EmailConflictInfo {
  attemptedEmail: string;
  conflictingAttendeeId: string;
  conflictingAttendeeType: AttendeeType;
  conflictingAttendeeName: string;
}

// Define types for normalized structures
export interface NormalizedAttendee {
  attendee_id: string;
  type: AttendeeType;
  partnerId?: string; // For lady/guest partners linking back
  relatedMasonId?: string; // Link lady partner to mason
  relatedGuestId?: string; // Link guest partner to guest
}

export interface EntityStore {
  attendees: Record<string, NormalizedAttendee>;
  tickets: Record<string, AttendeeTicket>;
}

export interface RelationshipStore {
  masonToPartner: Record<string, string>; // masonId -> partnerId
  guestToPartner: Record<string, string>; // guestId -> partnerId
}

export interface FormState {
  registrationType: string; 
  step: number; 
  selectedTicket?: string; // Keep if needed for compatibility/logic
  selectedEventId: string | null;
  
  // Comment out old fields instead of removing immediately
  // masons: MasonData[];
  // guests: GuestData[];
  // ladyPartners: LadyPartnerData[];
  // guestPartners: GuestPartnerData[];
  
  // ADD the new unified attendees array
  attendees: AttendeeData[]; 

  agreeToTerms: boolean;
  useUniformTicketing: boolean;
  attendeeAddOrder?: { type: AttendeeType; id: string }[] | string[]; // Allow string[] based on previous edit
  emailConflictFlags?: Record<string, EmailConflictInfo>; 
  
  // Keep existing normalized structures if present
  entities?: EntityStore;
  // attendeeOrder?: { id: string; type: string }[]; // This might be replaced by attendeeAddOrder
  relationships?: RelationshipStore;

  // ADD progressData field
  progressData?: {
    currentStep: ProgressStep;
    completedSteps: ProgressStep[];
  } | null;

  // Add other fields from previous definition if they were missed
  registrationId: string | null;
  contactId: string | null;
  userId: string | null;
  isLoading: boolean;
  error: string | null;
}

// Define type alias for different attendee types and export it
export type AttendeeData = MasonData | LadyPartnerData | GuestData | GuestPartnerData;

// Placeholder type for package/ticket selections per attendee
// TODO: Define the actual structure based on package data
export interface PackageSelectionType {
  ticketDefinitionId: string | null;
  selectedEvents: string[]; // Array of event IDs
  // Add other relevant package/ticket properties
}

// Placeholder type for billing details
// TODO: Define the actual structure needed
export interface BillingDetailsType {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  // Add other relevant billing properties
}

// Define RegistrationType if not already defined
export type RegistrationType = 'individual' | 'lodge' | 'delegation';

// --- Attendee Base Data ---
// Keep AttendeeData export if it's used elsewhere
export interface AttendeeDataBase {
  attendee_id: string;
  title?: string;
  first_name: string;
  last_name: string;
  email?: string; 
  phone?: string;
  dietary_requirements?: string;
  special_needs?: string;
  contact_preference?: string;
  has_partner?: boolean;
  ticket?: AttendeeTicket;
}

// --- Specific Attendee Types (Extending Base) ---

export interface MasonData extends AttendeeDataBase {
  attendeeType: AttendeeType.MASON;
  memberNumber?: string;
  rank?: string; 
  grandRank?: string;
  grandLodgeId?: string | null;
  lodgeId?: string | null;
  grandOffice?: string;
  pastGrandOffice?: string;
  isPastGrandMaster?: boolean;
  honours?: string;
  hasLadyPartner?: boolean;
  // email is required for Masons?
  email: string; 
}

export interface LadyPartnerData extends AttendeeDataBase {
  attendeeType: AttendeeType.LADY_PARTNER;
  relationship?: string;
  masonId: string; // Link back to the Mason
}

export interface GuestData extends AttendeeDataBase {
  attendeeType: AttendeeType.GUEST;
  relationship?: string;
  hasGuestPartner?: boolean;
}

export interface GuestPartnerData extends AttendeeDataBase {
  attendeeType: AttendeeType.GUEST_PARTNER;
  relationship?: string;
  guestId: string; // Link back to the Guest
}

// --- Unified Attendee Type --- 
// This seems to be the intended unified type from `src/lib/api/registrations`
// Let's keep this consistent if possible, otherwise redefine carefully
// export type UnifiedAttendeeData = AttendeeDataBase & Partial<MasonData> & Partial<LadyPartnerData> & Partial<GuestData> & Partial<GuestPartnerData>;
// If UnifiedAttendeeData comes from registrations API, import it there instead.

// Placeholder type for package/ticket selections per attendee
// This might be redundant if ticket info is stored within AttendeeDataBase
export interface PackageSelectionType {
  ticketDefinitionId: string | null;
  selectedEvents: string[]; // Array of event IDs
}

// Placeholder type for billing details
export interface BillingDetailsType {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
}