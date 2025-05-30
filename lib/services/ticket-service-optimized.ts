import { getServerClient } from '@/lib/supabase-singleton';
import { createClient } from '@/lib/supabase-browser';
import { cacheManager, CacheKeys } from '@/lib/cache-manager';
import { Database } from '@/shared/types/database';

// Types for ticket views
interface TicketAvailabilityView {
  ticket_id: string;
  event_id: string;
  event_title: string;
  name: string;
  description: string | null;
  price: number;
  attendee_type: string | null;
  total_quantity: number;
  reserved_quantity: number;
  sold_quantity: number;
  available_quantity: number;
  max_per_order: number;
  min_per_order: number;
  is_active: boolean;
  is_available: boolean;
  sort_order: number | null;
}

export class TicketServiceOptimized {
  private client: ReturnType<typeof createClient<Database>>;

  constructor(private isServer: boolean = false) {
    this.client = this.isServer ? getServerClient() : createClient();
  }

  /**
   * Get available tickets for an event using the optimized view
   * No caching as ticket availability must be real-time
   */
  async getEventTickets(eventId: string) {
    try {
      const { data, error } = await this.client
        .from('ticket_availability_view')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('price', { ascending: true });

      if (error) {
        console.error('Error fetching tickets:', error);
        return [];
      }

      return (data || []) as TicketAvailabilityView[];
    } catch (error) {
      console.error('Exception fetching tickets:', error);
      return [];
    }
  }

  /**
   * Get eligible tickets for a specific attendee type
   */
  async getEligibleTickets(eventId: string, attendeeType: Database['public']['Enums']['attendee_type']) {
    try {
      const { data, error } = await this.client.rpc('get_eligible_tickets', {
        p_event_id: eventId,
        p_attendee_type: attendeeType
      });

      if (error) {
        console.error('Error fetching eligible tickets:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching eligible tickets:', error);
      return [];
    }
  }

  /**
   * Check real-time ticket availability for a batch of tickets
   */
  async checkBatchAvailability(ticketIds: string[]) {
    try {
      const { data, error } = await this.client
        .from('ticket_availability_view')
        .select('ticket_id, available_quantity, is_available')
        .in('ticket_id', ticketIds);

      if (error) {
        console.error('Error checking batch availability:', error);
        return new Map<string, { available: number; isAvailable: boolean }>();
      }

      const availabilityMap = new Map();
      (data || []).forEach(ticket => {
        availabilityMap.set(ticket.ticket_id, {
          available: ticket.available_quantity,
          isAvailable: ticket.is_available
        });
      });

      return availabilityMap;
    } catch (error) {
      console.error('Exception checking batch availability:', error);
      return new Map();
    }
  }

  /**
   * Reserve tickets for a registration (using RPC for atomic operation)
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
      const { data, error } = await this.client.rpc('reserve_tickets', {
        p_event_id: params.event_id,
        p_registration_id: params.registration_id,
        p_ticket_selections: params.ticket_selections
      });

      if (error) {
        console.error('Error reserving tickets:', error);
        throw error;
      }

      // Clear ticket cache for this event
      cacheManager.clear(CacheKeys.eventTickets(params.event_id));

      return data;
    } catch (error) {
      console.error('Exception reserving tickets:', error);
      throw error;
    }
  }

  /**
   * Calculate pricing for tickets (using RPC)
   */
  async calculateEventPricing(params: {
    event_id: string;
    ticket_selections: Array<{
      ticket_type_id: string;
      quantity: number;
    }>;
    promo_code?: string;
  }) {
    try {
      const { data, error } = await this.client.rpc('calculate_event_pricing', {
        p_event_id: params.event_id,
        p_ticket_selections: params.ticket_selections,
        p_promo_code: params.promo_code || null
      });

      if (error) {
        console.error('Error calculating pricing:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Exception calculating pricing:', error);
      throw error;
    }
  }

  /**
   * Subscribe to ticket availability changes
   */
  subscribeToTicketAvailability(
    eventId: string,
    callback: (payload: any) => void
  ) {
    return this.client
      .channel(`ticket_availability:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `event_id=eq.${eventId}`
        },
        callback
      )
      .subscribe();
  }

  /**
   * Batch check ticket availability for multiple events
   */
  async getEventsTicketAvailability(eventIds: string[]) {
    try {
      const { data, error } = await this.client
        .from('ticket_availability_view')
        .select('event_id, sum(available_quantity)')
        .in('event_id', eventIds)
        .eq('is_active', true)
        .groupBy('event_id');

      if (error) {
        console.error('Error fetching events availability:', error);
        return new Map<string, number>();
      }

      const availabilityMap = new Map();
      (data || []).forEach(event => {
        availabilityMap.set(event.event_id, event.sum || 0);
      });

      return availabilityMap;
    } catch (error) {
      console.error('Exception fetching events availability:', error);
      return new Map();
    }
  }

  /**
   * Get ticket statistics for an event
   */
  async getEventTicketStats(eventId: string) {
    const cacheKey = `ticket_stats:${eventId}`;
    
    return cacheManager.getOrFetch(
      cacheKey,
      async () => {
        try {
          const { data, error } = await this.client
            .from('ticket_availability_view')
            .select('*')
            .eq('event_id', eventId);

          if (error) {
            console.error('Error fetching ticket stats:', error);
            return null;
          }

          const stats = {
            totalCapacity: 0,
            totalSold: 0,
            totalReserved: 0,
            totalAvailable: 0,
            totalRevenue: 0,
            ticketTypes: [] as Array<{
              id: string;
              name: string;
              capacity: number;
              sold: number;
              available: number;
              revenue: number;
            }>
          };

          (data || []).forEach(ticket => {
            stats.totalCapacity += ticket.total_quantity;
            stats.totalSold += ticket.sold_quantity;
            stats.totalReserved += ticket.reserved_quantity;
            stats.totalAvailable += ticket.available_quantity;
            stats.totalRevenue += ticket.sold_quantity * ticket.price;

            stats.ticketTypes.push({
              id: ticket.ticket_id,
              name: ticket.name,
              capacity: ticket.total_quantity,
              sold: ticket.sold_quantity,
              available: ticket.available_quantity,
              revenue: ticket.sold_quantity * ticket.price
            });
          });

          return stats;
        } catch (error) {
          console.error('Exception fetching ticket stats:', error);
          return null;
        }
      },
      'EVENT_DETAIL'
    );
  }
}

// Export singleton instances
export const ticketService = new TicketServiceOptimized(false);
export const serverTicketService = new TicketServiceOptimized(true);