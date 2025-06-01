import { AttendeeTicket } from './register'; // Import shared ticket type

// Interface for Lodge data (can be expanded based on DB schema)
export interface Lodge {
  lodge_id: string; // Typically UUID
  name: string;
  display_name?: string | null;
  number: number | null;
  meeting_place?: string | null;
  district?: string | null;
  area_type?: string | null;
  state_region?: string | null;
  grand_lodge_id?: string | null; // Foreign key
  organisation_id?: string | null; // Foreign key to organisations
}

// Interface for Grand Lodge data (can be expanded based on DB schema)
export interface GrandLodge {
  grand_lodge_id: string; // Typically UUID
  name: string; // e.g., "Grand Lodge of NSW & ACT"
  abbreviation?: string | null; // e.g., "GLNSWACT"
  country?: string | null; // e.g., "Australia"
  country_code_iso3?: string | null; // e.g., "AUS"
  state_region?: string | null; // e.g., "NSW"
  state_region_code?: string | null; // e.g., "NSW"
  organisation_id?: string | null; // Foreign key to organisations
}

// Interface for Mason-specific data
export interface MasonData {
  attendee_id: string; // Corresponds to the attendee identifier in the form state
  contact_id?: string | null; // Foreign key to contacts table
  title: string;
  first_name: string;
  last_name: string;
  event_title?: string; // Mason's title for event (rank)
  phone: string;
  email: string;
  dietary_requirements: string;
  special_needs: string;
  contact_preference?: string; // For additional masons
  has_partner: boolean; // Maps to database field
  ticket?: AttendeeTicket; // Selected ticket and events
  
  // Mason-specific fields (from masonic_profiles or UI state)
  lodge_id?: string | null; // Foreign key to lodges table
  lodge_name?: string; // Denormalized/fetched for display
  grand_lodge_id?: string | null; // Foreign key to grand_lodges table
  grand_lodge_name?: string; // Denormalized/fetched for display
  masonic_rank?: string; // Masonic rank
  grand_rank?: string; // Specific GL rank
  grand_officer?: string; // Current or Past
  grand_office?: string; // Specific grand office
  
  // UI state fields
  sameLodgeAsPrimary?: boolean; // UI state, not in DB
  isPendingNewLodge?: boolean; 
  pendingLodgeDetails?: { name: string; number: string; grand_lodge_id: string | null } | null;
} 