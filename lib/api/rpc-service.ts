import { createClient } from '@/lib/supabase-browser';
import type { Database } from '@/shared/types/database';

// Types for RPC parameters and returns
export interface CreateFunctionRegistrationParams {
  functionId: string;
  registration: {
    function_id: string;
    registration_type: Database['public']['Enums']['registration_type'];
    agree_to_terms: boolean;
    registration_data?: any;
    organisation_id?: string;
  };
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
    is_primary?: boolean;
    is_partner?: boolean;
    has_partner?: boolean;
    related_attendee_id?: string;
    relationship?: string;
    event_title?: string;
    masonic_profile?: {
      grand_lodge_id?: string;
      lodge_id?: string;
      rank?: string;
      masonic_title?: string;
      grand_rank?: string;
      grand_office?: string;
      grand_officer?: string;
    };
  }>;
  tickets: Array<{
    ticket_type_id?: string;
    package_id?: string;
    attendee_index: number;
    is_partner_ticket?: boolean;
  }>;
  selectedEvents: string[];
}

export interface CreateRegistrationResponse {
  registration_id: string;
  confirmation_number: string;
  total_amount_paid: number;
  customer_id: string;
  attendee_ids: string[];
}

export interface EventFullData {
  event: Database['public']['Tables']['events']['Row'];
  location: Database['public']['Tables']['locations']['Row'] | null;
  packages: Database['public']['Tables']['packages']['Row'][];
  tickets: Database['public']['Tables']['event_tickets']['Row'][];
  capacity: Database['public']['Tables']['event_capacity']['Row'] | null;
}

export interface EventTicketsPackagesData {
  packages: Array<{
    package_id: string;
    name: string;
    description: string | null;
    package_price: number;
    original_price: number | null;
    discount: number | null;
    included_items: any;
    includes_description: string[] | null;
    eligibility_criteria: any;
    available: boolean;
  }>;
  tickets: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number;
    eligibility_criteria: any;
    available_count: number;
    total_capacity: number | null;
    can_purchase: boolean;
  }>;
  event_capacity: Database['public']['Tables']['event_capacity']['Row'] | null;
}

export interface RegistrationCompleteData {
  registration: Database['public']['Tables']['registrations']['Row'];
  customer: Database['public']['Tables']['customers']['Row'];
  attendees: Array<Database['public']['Tables']['attendees']['Row'] & {
    masonic_profile?: Database['public']['Tables']['masonic_profiles']['Row'];
  }>;
  tickets: Database['public']['Tables']['tickets']['Row'][];
  event: {
    event_id: string;
    title: string;
    subtitle: string | null;
    event_start: string | null;
    event_end: string | null;
  };
}

export interface UpdatePaymentStatusParams {
  stripe_payment_intent_id: string;
  payment_status: Database['public']['Enums']['payment_status'];
  amount_paid?: number;
}

export interface UpdatePaymentStatusResponse {
  registration_id: string;
  confirmation_number: string;
  payment_status: Database['public']['Enums']['payment_status'];
  status: string;
}

export interface CheckTicketAvailabilityParams {
  event_id: string;
  ticket_requests: Array<{
    ticket_type_id: string;
    quantity: number;
  }>;
}

export interface CheckTicketAvailabilityResponse {
  results: Array<{
    ticket_type_id: string;
    requested: number;
    available: number;
    can_fulfill: boolean;
  }>;
  all_available: boolean;
}

export interface FunctionDetailsResponse {
  function_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  start_date: string;
  end_date: string;
  location_id: string | null;
  organiser_id: string;
  events: any[];
  packages: any[];
  location: any;
  registration_count: number;
  metadata: Record<string, any>;
  is_published: boolean;
}

// RPC Service Class
export class RPCService {
  private supabase = createClient();

  /**
   * Gets function details by slug
   */
  async getFunctionDetails(slug: string): Promise<FunctionDetailsResponse> {
    const { data, error } = await this.supabase
      .rpc('get_function_details', { p_function_slug: slug });
    
    if (error) throw error;
    return data as FunctionDetailsResponse;
  }

  /**
   * Creates a complete registration for a function
   */
  async createFunctionRegistration(params: CreateFunctionRegistrationParams): Promise<CreateRegistrationResponse> {
    const { data, error } = await this.supabase.rpc('create_function_registration', {
      p_function_id: params.functionId,
      p_registration: params.registration,
      p_customer: params.customer,
      p_attendees: params.attendees,
      p_tickets: params.tickets,
      p_selected_events: params.selectedEvents
    });

    if (error) throw error;
    return data as CreateRegistrationResponse;
  }

  /**
   * Gets eligible tickets for a function based on attendee type
   */
  async getFunctionEligibleTickets(
    functionId: string,
    attendeeType: Database['public']['Enums']['attendee_type'] = 'mason'
  ): Promise<EventTicketsPackagesData> {
    const { data, error } = await this.supabase.rpc('get_function_eligible_tickets', {
      p_function_id: functionId,
      p_attendee_type: attendeeType
    });

    if (error) throw error;
    return data as EventTicketsPackagesData;
  }

  /**
   * Retrieves complete registration data
   */
  async getRegistrationComplete(registrationId: string): Promise<RegistrationCompleteData | null> {
    const { data, error } = await this.supabase.rpc('get_registration_summary', {
      registration_id: registrationId
    });

    if (error) throw error;
    return data as RegistrationCompleteData | null;
  }

  /**
   * Updates payment status after Stripe webhook
   */
  async updatePaymentStatus(params: UpdatePaymentStatusParams): Promise<UpdatePaymentStatusResponse> {
    const { data, error } = await this.supabase.rpc('complete_payment', {
      stripe_payment_intent_id: params.stripe_payment_intent_id,
      payment_status: params.payment_status,
      amount_paid: params.amount_paid
    });

    if (error) throw error;
    return data as UpdatePaymentStatusResponse;
  }

  /**
   * Checks if requested tickets are available
   */
  async checkTicketAvailability(
    params: CheckTicketAvailabilityParams
  ): Promise<CheckTicketAvailabilityResponse> {
    const { data, error } = await this.supabase.rpc('check_ticket_availability', {
      event_id: params.event_id,
      ticket_requests: params.ticket_requests
    });

    if (error) throw error;
    return data as CheckTicketAvailabilityResponse;
  }
}

// Export singleton instance
export const rpcService = new RPCService();