import { createClient } from '@/lib/supabase-browser';
import type { Database } from '@/shared/types/database';

// ============================================
// TYPES FOR CONTACTS-AWARE SCHEMA
// ============================================

export interface CreateRegistrationParamsV3 {
  registration_type: Database['public']['Enums']['registration_type'];
  event_id: string;
  customer: {
    id?: string;
    title?: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    business_name?: string;
    billing_street_address?: string;
    billing_street_address_2?: string;
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
    suffix?: string; // Maps to suffix_1
    suffix_2?: string;
    suffix_3?: string;
    email?: string;
    phone?: string;
    dietary_requirements?: string;
    special_needs?: string;
    contact_preference: Database['public']['Enums']['attendee_contact_preference'];
    has_partner?: boolean;
    is_primary?: boolean;
    event_title?: string;
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
      ticket_type_id?: string;
    }>;
  }>;
  organisation_id?: string;
  registration_data?: any;
}

export interface RegistrationResponseV3 {
  registration_id: string;
  confirmation_number: string;
  contact_id: string;
  customer_contact_id: string;
  total_amount: number;
  attendees: Array<{
    attendee_id: string;
    contact_id: string;
    partner_id?: string;
    partner_contact_id?: string;
    tickets: any;
  }>;
}

export interface ContactWithProfile {
  contact: Database['public']['Tables']['contacts']['Row'];
  masonic_profile?: Database['public']['Tables']['masonic_profiles']['Row'] & {
    lodge?: Database['public']['Tables']['lodges']['Row'];
    grand_lodge?: Database['public']['Tables']['grand_lodges']['Row'];
  };
}

export interface RegistrationCompleteV2Data {
  registration: Database['public']['Tables']['registrations']['Row'];
  customer: Database['public']['Tables']['customers']['Row'] & {
    contact: Database['public']['Tables']['contacts']['Row'];
  };
  attendees: Array<{
    attendee: Database['public']['Tables']['attendees']['Row'];
    contact: Database['public']['Tables']['contacts']['Row'];
    masonic_profile?: Database['public']['Tables']['masonic_profiles']['Row'] & {
      lodge: Database['public']['Tables']['lodges']['Row'];
      grand_lodge: Database['public']['Tables']['grand_lodges']['Row'];
    };
    partner?: {
      attendee: Database['public']['Tables']['attendees']['Row'];
      contact: Database['public']['Tables']['contacts']['Row'];
    };
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
// REGISTRATION RPC SERVICE V3
// ============================================

export class RegistrationRPCServiceV3 {
  private supabase = createClient();

  /**
   * Creates a complete registration with contacts
   */
  async createRegistration(params: CreateRegistrationParamsV3): Promise<RegistrationResponseV3> {
    const { data, error } = await this.supabase.rpc('rpc_create_registration_v3', {
      p_registration_type: params.registration_type,
      p_event_id: params.event_id,
      p_customer: params.customer,
      p_attendees: params.attendees,
      p_organisation_id: params.organisation_id,
      p_registration_data: params.registration_data || {}
    });

    if (error) throw error;
    return data as RegistrationResponseV3;
  }

  /**
   * Gets contact with masonic profile
   */
  async getContactWithProfile(contactId: string): Promise<ContactWithProfile | null> {
    const { data, error } = await this.supabase.rpc('rpc_get_contact_with_profile', {
      p_contact_id: contactId
    });

    if (error) throw error;
    return data as ContactWithProfile | null;
  }

  /**
   * Updates contact and masonic profile
   */
  async updateContactWithProfile(
    contactId: string,
    contactData: Partial<Database['public']['Tables']['contacts']['Update']>,
    masonicProfile?: Partial<Database['public']['Tables']['masonic_profiles']['Update']>
  ): Promise<ContactWithProfile | null> {
    const { data, error } = await this.supabase.rpc('rpc_update_contact_with_profile', {
      p_contact_id: contactId,
      p_contact_data: contactData,
      p_masonic_profile: masonicProfile
    });

    if (error) throw error;
    return data as ContactWithProfile | null;
  }

  /**
   * Gets complete registration with contacts
   */
  async getRegistrationComplete(registrationId: string): Promise<RegistrationCompleteV2Data | null> {
    const { data, error } = await this.supabase.rpc('rpc_get_registration_complete_v2', {
      p_registration_id: registrationId
    });

    if (error) throw error;
    return data as RegistrationCompleteV2Data | null;
  }

  // ============================================
  // FORM DATA TRANSFORMERS
  // ============================================

  /**
   * Transform form data for individual registration
   */
  transformIndividualRegistration(formData: any): CreateRegistrationParamsV3 {
    const attendees = formData.attendees.map((att: any, index: number) => {
      const baseAttendee = {
        attendee_type: this.mapAttendeeType(att.attendeeType),
        title: att.title,
        first_name: att.firstName,
        last_name: att.lastName,
        suffix: att.suffix, // Maps to suffix_1
        suffix_2: att.postNominals, // Additional suffixes
        suffix_3: att.honours,
        email: att.primaryEmail,
        phone: att.primaryPhone,
        dietary_requirements: att.dietaryRequirements,
        special_needs: att.specialNeeds,
        contact_preference: this.mapContactPreference(att.contactPreference),
        has_partner: att.hasPartner || att.hasLadyPartner,
        is_primary: index === 0,
        event_title: att.eventTitle,
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
  transformLodgeRegistration(formData: any): CreateRegistrationParamsV3 {
    // For lodge registrations, booking contact becomes the customer
    const customer = {
      title: formData.bookingContact.title,
      first_name: formData.bookingContact.firstName,
      last_name: formData.bookingContact.lastName,
      email: formData.bookingContact.email,
      phone: formData.bookingContact.phone,
      business_name: formData.lodgeName,
      // Lodge address if available
      billing_street_address: formData.lodgeAddress?.street,
      billing_city: formData.lodgeAddress?.city,
      billing_state: formData.lodgeAddress?.state,
      billing_postal_code: formData.lodgeAddress?.postcode,
      billing_country: formData.lodgeAddress?.country || 'Australia'
    };

    // Create placeholder attendees for table bookings
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
          package_id: formData.packageId
        }]
      });
    }

    return {
      registration_type: 'lodge',
      event_id: formData.eventId,
      customer,
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
  transformDelegationRegistration(formData: any): CreateRegistrationParamsV3 {
    const delegates = formData.delegates.map((del: any) => ({
      attendee_type: this.mapAttendeeType(del.attendeeType),
      title: del.title,
      first_name: del.firstName,
      last_name: del.lastName,
      suffix: del.suffix,
      suffix_2: del.postNominals,
      suffix_3: del.honours,
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
        grand_rank: del.grandRank,
        grand_officer: del.grandOfficerStatus,
        grand_office: del.grandOffice,
        lodge_id: del.lodgeId,
        grand_lodge_id: formData.grandLodgeId
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
      title: billing.title,
      first_name: billing.firstName,
      last_name: billing.lastName,
      email: billing.emailAddress || billing.email,
      phone: billing.mobileNumber || billing.phone,
      business_name: billing.businessName,
      billing_street_address: billing.addressLine1,
      billing_street_address_2: billing.addressLine2,
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

  /**
   * Helper to create a standalone contact (e.g., for lodge members)
   */
  async createContact(contactData: {
    type: Database['public']['Enums']['contact_type'];
    title?: string;
    first_name: string;
    last_name: string;
    suffix_1?: string;
    suffix_2?: string;
    suffix_3?: string;
    email: string;
    mobile_number?: string;
    organisation_id?: string;
    masonic_profile?: any;
  }): Promise<string> {
    const { data: contact, error: contactError } = await this.supabase
      .from('contacts')
      .insert({
        type: contactData.type,
        title: contactData.title,
        first_name: contactData.first_name,
        last_name: contactData.last_name,
        suffix_1: contactData.suffix_1,
        suffix_2: contactData.suffix_2,
        suffix_3: contactData.suffix_3,
        email: contactData.email,
        mobile_number: contactData.mobile_number,
        organisation_id: contactData.organisation_id
      })
      .select('contact_id')
      .single();

    if (contactError) throw contactError;

    // Create masonic profile if provided
    if (contactData.masonic_profile && contact) {
      const { error: profileError } = await this.supabase
        .from('masonic_profiles')
        .insert({
          contact_id: contact.contact_id,
          ...contactData.masonic_profile
        });

      if (profileError && profileError.code !== '23505') { // Ignore duplicate key errors
        console.warn('Failed to create masonic profile:', profileError);
      }
    }

    return contact.contact_id;
  }
}

// Export singleton instance
export const registrationRPCServiceV3 = new RegistrationRPCServiceV3();