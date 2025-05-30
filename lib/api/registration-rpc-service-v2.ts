import { createClient } from '@/lib/supabase-browser';
import type { Database } from '@/shared/types/database';

// ============================================
// TYPES FOR NEW SCHEMA
// ============================================

export interface CreateRegistrationParamsV2 {
  registration_type: Database['public']['Enums']['registration_type'];
  event_id: string;
  customer: {
    id?: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    business_name?: string;
    billing_street_address?: string;
    billing_city?: string;
    billing_state?: string;
    billing_postal_code?: string;
    billing_country?: string;
  };
  attendees: Array<{
    attendee_type: Database['public']['Enums']['attendee_type'];
    title?: string;
    first_name: string;
    last_name: string;
    suffix?: string;
    email?: string;
    phone?: string;
    dietary_requirements?: string;
    special_needs?: string;
    contact_preference: Database['public']['Enums']['attendee_contact_preference'];
    has_partner?: boolean;
    is_primary?: boolean;
    event_title?: string; // For special roles like "Head of Delegation"
    create_contact?: boolean; // Whether to create permanent contact record
    masonic_profile?: {
      masonic_title?: string;
      rank?: string;
      grand_rank?: string;
      grand_officer?: string;
      grand_office?: string;
      lodge_id?: string;
      grand_lodge_id?: string;
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
    tickets?: Array<{
      package_id?: string;
      ticket_type_id?: string; // For individual tickets
    }>;
  }>;
  organisation_id?: string; // For lodge/delegation registrations
  registration_data?: any; // Additional data like delegation_name, table_count, etc.
}

export interface RegistrationResponseV2 {
  registration_id: string;
  confirmation_number: string;
  contact_id: string;
  total_amount: number;
  attendees: Array<{
    attendee_id: string;
    partner_id?: string;
    tickets: any;
  }>;
}

export interface EventWithPackagesData {
  event: Database['public']['Tables']['events']['Row'];
  location: Database['public']['Tables']['locations']['Row'] | null;
  organizer: Database['public']['Tables']['organisations']['Row'] | null;
  packages: Array<{
    package_id: string;
    name: string;
    description: string | null;
    package_price: number;
    original_price: number | null;
    discount: number | null;
    includes_description: string[] | null;
    included_items: any;
    eligibility_criteria: any;
    is_active: boolean | null;
    qty: number | null;
    available: boolean;
  }>;
  tickets: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number;
    total_capacity: number | null;
    available_count: number | null;
    sold_count: number | null;
    reserved_count: number | null;
    eligibility_criteria: any;
    is_active: boolean | null;
    status: string | null;
  }>;
}

export interface RegistrationCompleteData {
  registration: Database['public']['Tables']['registrations']['Row'];
  customer: Database['public']['Tables']['customers']['Row'];
  attendees: Array<{
    attendee: Database['public']['Tables']['attendees']['Row'];
    masonic_profile?: Database['public']['Tables']['masonic_profiles']['Row'];
    partner?: Database['public']['Tables']['attendees']['Row'];
    tickets: Database['public']['Tables']['tickets']['Row'][];
  }>;
  event: {
    event_id: string;
    title: string;
    subtitle: string | null;
    event_start: string | null;
    event_end: string | null;
    slug: string;
  };
}

// ============================================
// REGISTRATION RPC SERVICE V2
// ============================================

export class RegistrationRPCServiceV2 {
  private supabase = createClient();

  /**
   * Creates a complete registration using new schema
   */
  async createRegistration(params: CreateRegistrationParamsV2): Promise<RegistrationResponseV2> {
    // Note: rpc_create_registration_v2 doesn't exist in current schema
    // Use create_registration_with_attendees instead
    const { data, error } = await this.supabase.rpc('create_registration_with_attendees', {
      registration: {
        event_id: params.event_id,
        registration_type: params.registration_type,
        agree_to_terms: true,
        registration_data: params.registration_data,
        organisation_id: params.organisation_id
      },
      customer: params.customer,
      attendees: params.attendees,
      tickets: params.attendees.flatMap((att, idx) => 
        (att.tickets || []).map(t => ({
          ticket_type_id: t.ticket_type_id,
          package_id: t.package_id,
          attendee_index: idx,
          is_partner_ticket: false
        }))
      )
    });

    if (error) throw error;
    return data as RegistrationResponseV2;
  }

  /**
   * Gets event with packages using new schema
   */
  async getEventWithPackages(eventId: string): Promise<EventWithPackagesData | null> {
    // Note: rpc_get_event_with_packages doesn't exist in current schema
    // Use get_event_with_details instead
    const { data, error } = await this.supabase.rpc('get_event_with_details', {
      event_slug: eventId // Note: This expects a slug, not an ID
    });

    if (error) throw error;
    return data as EventWithPackagesData | null;
  }

  /**
   * Gets complete registration data
   */
  async getRegistrationComplete(registrationId: string): Promise<RegistrationCompleteData | null> {
    const { data, error } = await this.supabase.rpc('get_registration_summary', {
      registration_id: registrationId
    });

    if (error) throw error;
    return data as RegistrationCompleteData | null;
  }

  /**
   * Updates payment status
   */
  async updatePaymentStatus(
    stripePaymentIntentId: string,
    paymentStatus: Database['public']['Enums']['payment_status'],
    amountPaid?: number
  ) {
    const { data, error } = await this.supabase.rpc('complete_payment', {
      stripe_payment_intent_id: stripePaymentIntentId,
      payment_status: paymentStatus,
      amount_paid: amountPaid
    });

    if (error) throw error;
    return data;
  }

  // ============================================
  // FORM DATA TRANSFORMERS
  // ============================================

  /**
   * Transform form data for individual registration
   */
  transformIndividualRegistration(formData: any): CreateRegistrationParamsV2 {
    const attendees = formData.attendees.map((att: any, index: number) => {
      const baseAttendee = {
        attendee_type: this.mapAttendeeType(att.attendeeType),
        title: att.title,
        first_name: att.firstName,
        last_name: att.lastName,
        suffix: att.suffix,
        email: att.primaryEmail,
        phone: att.primaryPhone,
        dietary_requirements: att.dietaryRequirements,
        special_needs: att.specialNeeds,
        contact_preference: this.mapContactPreference(att.contactPreference),
        has_partner: att.hasPartner || att.hasLadyPartner,
        is_primary: index === 0,
        create_contact: false, // Only create contacts when explicitly requested
        tickets: att.tickets || []
      };

      // Add masonic profile if mason
      if (att.attendeeType === 'Mason') {
        baseAttendee.masonic_profile = {
          masonic_title: att.masonicTitle,
          rank: att.rank,
          grand_rank: att.grandRank,
          grand_officer: att.grandOfficerStatus,
          grand_office: att.presentGrandOfficerRole || att.grandOffice,
          lodge_id: att.lodgeId,
          grand_lodge_id: att.grandLodgeId
        };
      }

      // Add partner if exists
      if (att.partner) {
        baseAttendee.partner = {
          title: att.partner.title,
          first_name: att.partner.firstName,
          last_name: att.partner.lastName,
          email: att.partner.email,
          phone: att.partner.phone,
          dietary_requirements: att.partner.dietaryRequirements,
          special_needs: att.partner.specialNeeds,
          relationship: att.partner.relationship
        };
      }

      return baseAttendee;
    });

    return {
      registration_type: 'individuals',
      event_id: formData.eventId,
      customer: this.transformCustomerData(formData.billing),
      attendees,
      registration_data: {
        draft_id: formData.draftId,
        notes: formData.notes
      }
    };
  }

  /**
   * Transform form data for lodge registration
   */
  transformLodgeRegistration(formData: any): CreateRegistrationParamsV2 {
    // Lodge registrations create placeholder attendees
    const placeholderAttendees = [];
    const totalTickets = formData.tableCount * 10;
    
    for (let i = 0; i < totalTickets; i++) {
      placeholderAttendees.push({
        attendee_type: 'mason' as const,
        first_name: 'Lodge',
        last_name: `Member ${i + 1}`,
        contact_preference: 'providelater' as const,
        is_primary: i === 0,
        tickets: [{
          package_id: formData.packageId // Lodge package
        }]
      });
    }

    return {
      registration_type: 'lodge',
      event_id: formData.eventId,
      customer: {
        first_name: formData.bookingContact.firstName,
        last_name: formData.bookingContact.lastName,
        email: formData.bookingContact.email,
        phone: formData.bookingContact.phone,
        business_name: formData.lodgeName
      },
      attendees: placeholderAttendees,
      organisation_id: formData.lodgeId,
      registration_data: {
        grand_lodge_id: formData.grandLodgeId,
        lodge_id: formData.lodgeId,
        table_count: formData.tableCount,
        booking_contact: formData.bookingContact,
        notes: formData.notes
      }
    };
  }

  /**
   * Transform form data for delegation registration
   */
  transformDelegationRegistration(formData: any): CreateRegistrationParamsV2 {
    const delegates = formData.delegates.map((del: any) => ({
      attendee_type: this.mapAttendeeType(del.attendeeType),
      title: del.title,
      first_name: del.firstName,
      last_name: del.lastName,
      suffix: del.suffix,
      email: del.email,
      phone: del.phone,
      dietary_requirements: del.dietaryRequirements,
      special_needs: del.specialNeeds,
      contact_preference: this.mapContactPreference(del.contactPreference),
      has_partner: del.hasPartner,
      is_primary: del.isHeadOfDelegation,
      event_title: del.isHeadOfDelegation ? 'Head of Delegation' : null,
      masonic_profile: {
        masonic_title: del.masonicTitle,
        rank: del.rank,
        lodge_id: del.lodgeId,
        grand_lodge_id: formData.grandLodgeId // All delegates have same grand lodge
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
      } : undefined,
      tickets: del.tickets || []
    }));

    return {
      registration_type: 'delegation',
      event_id: formData.eventId,
      customer: this.transformCustomerData(formData.billing),
      attendees: delegates,
      registration_data: {
        delegation_name: formData.delegationName,
        grand_lodge_id: formData.grandLodgeId,
        delegation_type: 'official'
      }
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private transformCustomerData(billing: any) {
    return {
      first_name: billing.firstName,
      last_name: billing.lastName,
      email: billing.emailAddress || billing.email,
      phone: billing.mobileNumber || billing.phone,
      business_name: billing.businessName,
      billing_street_address: billing.addressLine1,
      billing_city: billing.suburb,
      billing_state: billing.stateTerritory?.name || billing.state,
      billing_postal_code: billing.postcode,
      billing_country: billing.country?.name || billing.country
    };
  }

  private mapAttendeeType(type: string): Database['public']['Enums']['attendee_type'] {
    const typeMap: Record<string, Database['public']['Enums']['attendee_type']> = {
      'Mason': 'mason',
      'Guest': 'guest',
      'Lady Partner': 'ladypartner',
      'Guest Partner': 'guestpartner'
    };
    return typeMap[type] || 'guest';
  }

  private mapContactPreference(pref: string): Database['public']['Enums']['attendee_contact_preference'] {
    const prefMap: Record<string, Database['public']['Enums']['attendee_contact_preference']> = {
      'Directly': 'directly',
      'Primary Attendee': 'primaryattendee',
      'Mason': 'mason',
      'Guest': 'guest',
      'Provide Later': 'providelater'
    };
    return prefMap[pref] || 'directly';
  }
}

// Export singleton instance
export const registrationRPCServiceV2 = new RegistrationRPCServiceV2();