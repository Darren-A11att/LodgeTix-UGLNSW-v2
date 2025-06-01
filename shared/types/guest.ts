import { AttendeeTicket } from './register';

/**
 * Represents a Guest record aligned with the database 'guests' table schema.
 */
export interface Guest {
  guest_id: string;
  customer_id: string | null;
  related_mason_id: string | null;
  related_guest_id: string | null;
  guest_type: string; // e.g., 'partner', 'guest', 'partner_of_guest'
  title: string | null;
  first_name: string | null; // Allow null as per DB
  last_name: string | null;  // Allow null as per DB
  email: string | null; 
  phone: string | null; 
  dietary_requirements: string | null;
  special_needs: string | null;
  partner_relationship: string | null; // Renamed from relationship
  contact_preference: string | null; // Changed to string | null
  contact_confirmed: boolean | null;
  created_at: string;
  // updated_at is likely handled by DB triggers, not returned directly in basic select
}

/**
 * Represents the data structure used specifically for a Mason's Lady/Partner
 * in the registration form state.
 */
export interface LadyPartnerData {
  attendee_id: string; 
  masonIndex: number;
  dbGuestId?: string | null;
  title: string;
  first_name: string;
  last_name: string;
  dietary_requirements: string;   // Maps to dietary_requirements
  special_needs: string;          // Maps to special_needs
  relationship: string;           // Maps to partner_relationship
  contact_preference: 'mason' | 'primary' | 'direct' | 'later' | 'Please Select'; 
  phone: string;
  email: string;
  has_partner: boolean;
  ticket?: AttendeeTicket;
}

/**
 * Represents the data structure used for a standard Guest attendee
 * in the registration form state.
 */
export interface GuestData {
  // UI/State specific fields
  attendee_id: string;             // Unique ID for the form state

  // Fields mapping to attendees table
  dbGuestId?: string | null;       // Actual UUID from the database
  title: string;
  first_name: string;
  last_name: string;
  phone: string;                   // Maps to phone (required if contact_preference='direct')
  email: string;                   // Maps to email (required if contact_preference='direct')
  dietary_requirements: string;    // Maps to dietary_requirements
  special_needs: string;           // Maps to special_needs
  contact_preference: 'primary' | 'direct' | 'later' | 'Please Select'; // Note: Excludes 'mason'/'guest' for standard guests?
  has_partner: boolean;            // UI flag to trigger partner form
  // partner_relationship is likely not relevant for a standard guest themselves
  
  // Ticket information
  ticket?: AttendeeTicket;
}

// TODO: Define GuestPartnerData similarly if needed for Step 11 