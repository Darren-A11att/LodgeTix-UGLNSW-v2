import { createClient } from '@/lib/supabase-browser';
import type { Database } from '@/shared/types/database';

// ============================================
// INDIVIDUAL REGISTRATION TYPES
// ============================================

export interface IndividualAttendeeInput {
  attendee_type: Database['public']['Enums']['attendee_type'];
  title?: string;
  first_name: string;
  last_name: string;
  suffix?: string;
  email?: string;
  phone?: string;
  dietary_requirements?: string;
  special_needs?: string;
  contact_preference?: Database['public']['Enums']['attendee_contact_preference'];
  has_partner?: boolean;
  event_title?: string;
  masonic_profile?: {
    grand_lodge_id?: string;
    lodge_id?: string;
    rank?: string;
    masonic_title?: string;
    grand_rank?: string;
    grand_office?: string;
  };
  partner?: {
    title?: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    dietary_requirements?: string;
    special_needs?: string;
    relationship?: string;
  };
}

export interface CreateIndividualRegistrationParams {
  event_id: string;
  customer: {
    id?: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    billing_street_address?: string;
    billing_city?: string;
    billing_state?: string;
    billing_postal_code?: string;
    billing_country?: string;
  };
  attendees: IndividualAttendeeInput[];
  tickets: Array<{
    ticket_type_id: string;
    attendee_index: number;
  }>;
}

// ============================================
// LODGE REGISTRATION TYPES
// ============================================

export interface CreateLodgeRegistrationParams {
  event_id: string;
  grand_lodge_id: string;
  lodge_id: string;
  booking_contact: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  table_count: number;
  notes?: string;
}

export interface LodgeRegistrationResponse {
  registration_id: string;
  confirmation_number: string;
  total_amount: number;
  table_count: number;
  total_tickets: number;
  customer_id: string;
}

// ============================================
// DELEGATION REGISTRATION TYPES
// ============================================

export interface DelegationDelegateInput {
  attendee_type: 'mason' | 'guest';
  is_head_of_delegation: boolean;
  title?: string;
  first_name: string;
  last_name: string;
  suffix?: string;
  email?: string;
  phone?: string;
  dietary_requirements?: string;
  special_needs?: string;
  contact_preference?: Database['public']['Enums']['attendee_contact_preference'];
  has_partner?: boolean;
  masonic_profile?: {
    lodge_id?: string;
    rank?: string;
    masonic_title?: string;
  };
  partner?: {
    title?: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    dietary_requirements?: string;
    special_needs?: string;
    relationship?: string;
  };
}

export interface CreateDelegationRegistrationParams {
  event_id: string;
  delegation_name: string;
  grand_lodge_id: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    billing_street_address?: string;
    billing_city?: string;
    billing_state?: string;
    billing_postal_code?: string;
    billing_country?: string;
  };
  delegates: DelegationDelegateInput[];
  tickets: Array<{
    ticket_type_id: string;
    attendee_index: number;
  }>;
}

export interface DelegationRegistrationResponse {
  registration_id: string;
  confirmation_number: string;
  total_amount: number;
  customer_id: string;
  delegate_ids: string[];
  head_delegate_id: string;
  delegation_stats: {
    total_delegates: number;
    total_partners: number;
    grand_lodge: string;
  };
}

// ============================================
// ENHANCED EVENT DATA TYPE
// ============================================

export interface EventFullV2Data {
  event: Database['public']['Tables']['events']['Row'];
  location: Database['public']['Tables']['locations']['Row'] | null;
  organizer: Database['public']['Tables']['organisations']['Row'] | null;
  packages: Array<Database['public']['Tables']['packages']['Row'] & {
    available_count: number | null;
  }>;
  tickets: Array<Database['public']['Tables']['event_tickets']['Row'] & {
    current_availability: number;
  }>;
  capacity: Database['public']['Tables']['event_capacity']['Row'] | null;
  parent_event: {
    event_id: string;
    title: string;
    slug: string;
    event_start: string | null;
  } | null;
  child_events: Array<{
    event_id: string;
    title: string;
    subtitle: string | null;
    slug: string;
    event_start: string | null;
    event_end: string | null;
    type: string | null;
  }>;
  registration_types_allowed: string[];
  special_requirements: {
    dress_code: string | null;
    regalia: string | null;
    regalia_description: string | null;
    important_information: any;
  };
  metadata: {
    is_multi_day: boolean | null;
    is_published: boolean | null;
    featured: boolean | null;
    degree_type: string | null;
  };
}

// ============================================
// REGISTRATION TYPE RPC SERVICE
// ============================================

export class RegistrationTypeRPCService {
  private supabase = createClient();

  // ========== Individual Registration ==========
  
  async createIndividualRegistration(params: CreateIndividualRegistrationParams) {
    const { data, error } = await this.supabase.rpc('rpc_create_individual_registration', {
      p_event_id: params.event_id,
      p_customer: params.customer,
      p_attendees: params.attendees,
      p_tickets: params.tickets
    });

    if (error) throw error;
    return data as {
      registration_id: string;
      confirmation_number: string;
      total_amount: number;
      customer_id: string;
      attendee_ids: string[];
    };
  }

  // ========== Lodge Registration ==========
  
  async createLodgeRegistration(params: CreateLodgeRegistrationParams): Promise<LodgeRegistrationResponse> {
    const { data, error } = await this.supabase.rpc('rpc_create_lodge_registration', {
      p_event_id: params.event_id,
      p_grand_lodge_id: params.grand_lodge_id,
      p_lodge_id: params.lodge_id,
      p_booking_contact: params.booking_contact,
      p_table_count: params.table_count,
      p_notes: params.notes
    });

    if (error) throw error;
    return data as LodgeRegistrationResponse;
  }

  // ========== Delegation Registration ==========
  
  async createDelegationRegistration(params: CreateDelegationRegistrationParams): Promise<DelegationRegistrationResponse> {
    const { data, error } = await this.supabase.rpc('rpc_create_delegation_registration', {
      p_event_id: params.event_id,
      p_delegation_name: params.delegation_name,
      p_grand_lodge_id: params.grand_lodge_id,
      p_customer: params.customer,
      p_delegates: params.delegates,
      p_tickets: params.tickets
    });

    if (error) throw error;
    return data as DelegationRegistrationResponse;
  }

  // ========== Enhanced Event Data ==========
  
  async getEventFullV2(eventId: string): Promise<EventFullV2Data | null> {
    const { data, error } = await this.supabase.rpc('rpc_get_event_full_v2', {
      p_event_id: eventId
    });

    if (error) throw error;
    return data as EventFullV2Data | null;
  }

  // ========== Helper Methods ==========

  /**
   * Transforms form data to RPC format for individual registration
   */
  transformIndividualFormData(formData: any): CreateIndividualRegistrationParams {
    return {
      event_id: formData.eventId,
      customer: {
        first_name: formData.billing.firstName,
        last_name: formData.billing.lastName,
        email: formData.billing.email,
        phone: formData.billing.phone,
        billing_street_address: formData.billing.addressLine1,
        billing_city: formData.billing.suburb,
        billing_state: formData.billing.stateTerritory?.name,
        billing_postal_code: formData.billing.postcode,
        billing_country: formData.billing.country?.name
      },
      attendees: formData.attendees.map((att: any) => ({
        attendee_type: att.attendeeType.toLowerCase(),
        title: att.title,
        first_name: att.firstName,
        last_name: att.lastName,
        suffix: att.suffix,
        email: att.primaryEmail,
        phone: att.primaryPhone,
        dietary_requirements: att.dietaryRequirements,
        special_needs: att.specialNeeds,
        contact_preference: att.contactPreference?.toLowerCase(),
        has_partner: att.hasPartner || att.hasLadyPartner,
        event_title: att.eventTitle,
        masonic_profile: att.attendeeType === 'Mason' ? {
          grand_lodge_id: att.grandLodgeId,
          lodge_id: att.lodgeId,
          rank: att.rank,
          masonic_title: att.masonicTitle,
          grand_rank: att.grandRank,
          grand_office: att.grandOffice
        } : undefined,
        partner: att.partner ? {
          title: att.partner.title,
          first_name: att.partner.firstName,
          last_name: att.partner.lastName,
          email: att.partner.email,
          phone: att.partner.phone,
          dietary_requirements: att.partner.dietaryRequirements,
          special_needs: att.partner.specialNeeds,
          relationship: att.partner.relationship
        } : undefined
      })),
      tickets: formData.tickets.map((ticket: any) => ({
        ticket_type_id: ticket.ticketTypeId,
        attendee_index: ticket.attendeeIndex
      }))
    };
  }

  /**
   * Transforms form data to RPC format for lodge registration
   */
  transformLodgeFormData(formData: any): CreateLodgeRegistrationParams {
    return {
      event_id: formData.eventId,
      grand_lodge_id: formData.grandLodgeId,
      lodge_id: formData.lodgeId,
      booking_contact: {
        first_name: formData.bookingContact.firstName,
        last_name: formData.bookingContact.lastName,
        email: formData.bookingContact.email,
        phone: formData.bookingContact.phone
      },
      table_count: formData.tableCount,
      notes: formData.notes
    };
  }

  /**
   * Transforms form data to RPC format for delegation registration
   */
  transformDelegationFormData(formData: any): CreateDelegationRegistrationParams {
    return {
      event_id: formData.eventId,
      delegation_name: formData.delegationName,
      grand_lodge_id: formData.grandLodgeId,
      customer: {
        first_name: formData.billing.firstName,
        last_name: formData.billing.lastName,
        email: formData.billing.email,
        phone: formData.billing.phone,
        billing_street_address: formData.billing.addressLine1,
        billing_city: formData.billing.suburb,
        billing_state: formData.billing.stateTerritory?.name,
        billing_postal_code: formData.billing.postcode,
        billing_country: formData.billing.country?.name
      },
      delegates: formData.delegates.map((del: any) => ({
        attendee_type: del.attendeeType.toLowerCase(),
        is_head_of_delegation: del.isHeadOfDelegation,
        title: del.title,
        first_name: del.firstName,
        last_name: del.lastName,
        suffix: del.suffix,
        email: del.email,
        phone: del.phone,
        dietary_requirements: del.dietaryRequirements,
        special_needs: del.specialNeeds,
        contact_preference: del.contactPreference?.toLowerCase(),
        has_partner: del.hasPartner,
        masonic_profile: {
          lodge_id: del.lodgeId,
          rank: del.rank,
          masonic_title: del.masonicTitle
        },
        partner: del.partner ? {
          title: del.partner.title,
          first_name: del.partner.firstName,
          last_name: del.partner.lastName,
          email: del.partner.email,
          phone: del.partner.phone,
          dietary_requirements: del.partner.dietaryRequirements,
          special_needs: del.partner.specialNeeds,
          relationship: del.partner.relationship
        } : undefined
      })),
      tickets: formData.tickets.map((ticket: any) => ({
        ticket_type_id: ticket.ticketTypeId,
        attendee_index: ticket.attendeeIndex
      }))
    };
  }
}

// Export singleton instance
export const registrationRPCService = new RegistrationTypeRPCService();