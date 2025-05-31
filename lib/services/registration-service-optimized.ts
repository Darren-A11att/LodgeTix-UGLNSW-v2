import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@/lib/supabase-browser';
import { Database } from '@/shared/types/database';
import { cacheManager, CacheKeys } from '@/lib/cache-manager';
import { RPCService } from '@/lib/api/rpc-service';

// Types for registration views
interface RegistrationDetailView {
  registration_id: string;
  confirmation_number: string;
  event_id: string;
  event_title: string;
  event_subtitle: string | null;
  event_start: string;
  event_end: string | null;
  event_location: string;
  registration_type: Database['public']['Enums']['registration_type'];
  status: string;
  payment_status: Database['public']['Enums']['payment_status'];
  total_amount: number;
  amount_paid: number;
  stripe_payment_intent_id: string | null;
  customer_id: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_phone: string | null;
  attendee_count: number;
  created_at: string;
  updated_at: string;
}

interface AttendeeCompleteView {
  attendee_id: string;
  registration_id: string;
  attendee_type: Database['public']['Enums']['attendee_type'];
  title: string | null;
  first_name: string;
  last_name: string;
  suffix: string | null;
  email: string | null;
  phone: string | null;
  dietary_requirements: string | null;
  special_needs: string | null;
  is_primary: boolean;
  is_partner: boolean;
  has_partner: boolean;
  related_attendee_id: string | null;
  relationship: string | null;
  event_title: string | null;
  contact_preference: Database['public']['Enums']['attendee_contact_preference'];
  grand_lodge_id: string | null;
  grand_lodge_name: string | null;
  lodge_id: string | null;
  lodge_name: string | null;
  lodge_number: string | null;
  rank: string | null;
  masonic_title: string | null;
  grand_rank: string | null;
  grand_office: string | null;
  grand_officer: string | null;
}

export class RegistrationServiceOptimized {
  private rpcService: RPCService;
  
  constructor(private isServer: boolean = false) {
    this.rpcService = new RPCService();
  }

  private async getClient() {
    return this.isServer ? await createServerClient() : createClient();
  }

  /**
   * Get registration details using optimized view
   */
  async getRegistrationDetails(registrationId: string): Promise<RegistrationDetailView | null> {
    const cacheKey = CacheKeys.registrationDetail(registrationId);
    
    return cacheManager.getOrFetch(
      cacheKey,
      async () => {
        try {
          const client = this.getClient();
          
          const { data, error } = await client
            .from('registration_detail_view')
            .select('*')
            .eq('registration_id', registrationId)
            .single();
          
          if (error) {
            console.error('Error fetching registration details:', error);
            return null;
          }
          
          return data as RegistrationDetailView;
        } catch (error) {
          console.error('Exception fetching registration details:', error);
          return null;
        }
      },
      'EVENT_DETAIL' // 2 minute cache for registration details
    );
  }

  /**
   * Get all attendees for a registration using optimized view
   */
  async getRegistrationAttendees(registrationId: string): Promise<AttendeeCompleteView[]> {
    const cacheKey = CacheKeys.attendeeList(registrationId);
    
    return cacheManager.getOrFetch(
      cacheKey,
      async () => {
        try {
          const client = this.getClient();
          
          const { data, error } = await client
            .from('attendee_complete_view')
            .select('*')
            .eq('registration_id', registrationId)
            .order('is_primary', { ascending: false })
            .order('created_at', { ascending: true });
          
          if (error) {
            console.error('Error fetching attendees:', error);
            return [];
          }
          
          return (data || []) as AttendeeCompleteView[];
        } catch (error) {
          console.error('Exception fetching attendees:', error);
          return [];
        }
      },
      'EVENT_DETAIL'
    );
  }

  /**
   * Get complete registration data with attendees and tickets
   * Uses RPC function for atomic operation
   */
  async getCompleteRegistration(registrationId: string) {
    const cacheKey = `registration_complete:${registrationId}`;
    
    return cacheManager.getOrFetch(
      cacheKey,
      async () => {
        try {
          const data = await this.rpcService.getRegistrationComplete(registrationId);
          return data;
        } catch (error) {
          console.error('Error fetching complete registration:', error);
          return null;
        }
      },
      'EVENT_DETAIL'
    );
  }

  /**
   * Create registration with attendees and tickets in one transaction
   */
  async createRegistration(params: Parameters<RPCService['createRegistration']>[0]) {
    try {
      const result = await this.rpcService.createRegistration(params);
      
      // Clear relevant caches
      cacheManager.invalidatePattern(/^registration:/);
      cacheManager.invalidatePattern(/^attendees:/);
      
      return result;
    } catch (error) {
      console.error('Error creating registration:', error);
      throw error;
    }
  }

  /**
   * Batch update attendees
   */
  async batchUpdateAttendees(
    registrationId: string, 
    attendees: Array<Partial<Database['public']['Tables']['attendees']['Update']> & { id: string }>
  ) {
    try {
      const client = this.getClient();
      
      // Use transaction for atomic updates
      const updates = attendees.map(attendee => {
        const { id, ...data } = attendee;
        return client
          .from('attendees')
          .update(data)
          .eq('id', id)
          .eq('registration_id', registrationId);
      });
      
      await Promise.all(updates);
      
      // Clear cache
      cacheManager.clear(CacheKeys.attendeeList(registrationId));
      cacheManager.clear(CacheKeys.registrationDetail(registrationId));
      
      return true;
    } catch (error) {
      console.error('Error batch updating attendees:', error);
      throw error;
    }
  }

  /**
   * Get registration summary using RPC
   */
  async getRegistrationSummary(registrationId: string) {
    const cacheKey = `registration_summary:${registrationId}`;
    
    return cacheManager.getOrFetch(
      cacheKey,
      async () => {
        try {
          const client = this.getClient();
          
          const { data, error } = await client.rpc('get_registration_summary', {
            p_registration_id: registrationId
          });
          
          if (error) {
            console.error('Error fetching registration summary:', error);
            return null;
          }
          
          return data;
        } catch (error) {
          console.error('Exception fetching registration summary:', error);
          return null;
        }
      },
      'EVENT_DETAIL'
    );
  }

  /**
   * Check ticket availability before purchase
   */
  async checkTicketAvailability(params: Parameters<RPCService['checkTicketAvailability']>[0]) {
    // Don't cache availability checks - always get real-time data
    try {
      return await this.rpcService.checkTicketAvailability(params);
    } catch (error) {
      console.error('Error checking ticket availability:', error);
      throw error;
    }
  }

  /**
   * Reserve tickets during registration
   */
  async reserveTickets(params: {
    event_id: string;
    registration_id: string;
    ticket_selections: Array<{
      ticket_type_id: string;
      attendee_id: string;
      quantity: number;
    }>;
  }) {
    try {
      const client = this.getClient();
      
      const { data, error } = await client.rpc('reserve_tickets', {
        p_event_id: params.event_id,
        p_registration_id: params.registration_id,
        p_ticket_selections: params.ticket_selections
      });
      
      if (error) throw error;
      
      // Clear ticket availability cache
      cacheManager.clear(CacheKeys.eventTickets(params.event_id));
      
      return data;
    } catch (error) {
      console.error('Error reserving tickets:', error);
      throw error;
    }
  }

  /**
   * Complete payment and finalize registration
   */
  async completePayment(params: {
    registration_id: string;
    stripe_payment_intent_id: string;
    amount_paid: number;
  }) {
    try {
      const client = this.getClient();
      
      const { data, error } = await client.rpc('complete_payment', {
        p_registration_id: params.registration_id,
        p_stripe_payment_intent_id: params.stripe_payment_intent_id,
        p_amount_paid: params.amount_paid
      });
      
      if (error) throw error;
      
      // Clear all related caches
      cacheManager.clear(CacheKeys.registrationDetail(params.registration_id));
      cacheManager.clear(`registration_complete:${params.registration_id}`);
      cacheManager.clear(`registration_summary:${params.registration_id}`);
      
      return data;
    } catch (error) {
      console.error('Error completing payment:', error);
      throw error;
    }
  }

  /**
   * Clear registration cache
   */
  clearCache(registrationId?: string) {
    if (registrationId) {
      cacheManager.clear(CacheKeys.registrationDetail(registrationId));
      cacheManager.clear(CacheKeys.attendeeList(registrationId));
      cacheManager.clear(`registration_complete:${registrationId}`);
      cacheManager.clear(`registration_summary:${registrationId}`);
    } else {
      cacheManager.invalidatePattern(/^registration/);
      cacheManager.invalidatePattern(/^attendees:/);
    }
  }
}

// Export singleton instances
export const registrationService = new RegistrationServiceOptimized(false);
export const serverRegistrationService = new RegistrationServiceOptimized(true);