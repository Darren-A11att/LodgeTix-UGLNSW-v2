import { createClient } from '@/utils/supabase/server'
import { Database } from '@/shared/types/database'
import { cacheManager, CacheKeys } from '@/lib/cache-manager'
import { EventRPCService } from '@/lib/api/event-rpc-service'

export interface Event {
  id: string
  slug: string
  title: string
  subtitle?: string
  description: string
  date: string
  location: string
  imageUrl: string
  price: string
  organiser?: string
  category?: string
  status?: "Published" | "Draft" | "Members Only"
  ticketsSold?: number
  revenue?: string
  dressCode?: string
  regalia?: string
  degreeType?: string
  tickets?: Ticket[]
  longDescription?: string
  time?: string
  venue?: {
    name: string
    address: string
    city: string
    state: string
    postcode: string
    mapUrl?: string
  }
  childEvents?: Array<{
    id: string
    slug: string
    title: string
    subtitle?: string
    date: string
    time: string
    location: string
    price: string
  }>
}

export interface Ticket {
  id: string
  event_id: string
  name: string
  price: number
  available: boolean
  description?: string
  quantity?: number
  quantityAvailable?: number
  max_per_order?: number
  min_per_order?: number
  attendee_type?: string
}

function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// Create singleton RPC service
const eventRPC = new EventRPCService(true);

/**
 * Get event by ID or slug using RPC function for optimized data fetching
 */
export async function getEventByIdOrSlug(idOrSlug: string): Promise<Event | null> {
  const cacheKey = CacheKeys.eventDetail(idOrSlug);
  
  return cacheManager.getOrFetch(
    cacheKey,
    async () => {
      try {
        // Use RPC function that returns complete event data in one call
        const eventData = await eventRPC.getEventDetailData(idOrSlug);
        
        if (!eventData) {
          return null;
        }
        
        // Transform RPC data to Event interface
        return {
          id: eventData.event_id,
          slug: eventData.slug,
          title: eventData.title,
          subtitle: eventData.subtitle || undefined,
          description: eventData.description,
          date: eventData.event_start ? new Date(eventData.event_start).toISOString().split('T')[0] : '',
          location: eventData.location || '',
          imageUrl: eventData.image_url || '/placeholder.svg',
          price: eventData.min_price ? `$${eventData.min_price}` : '$0',
          organiser: eventData.organiser_name || undefined,
          category: eventData.event_type || undefined,
          status: eventData.is_featured ? "Published" : "Draft",
          ticketsSold: eventData.tickets_sold,
          revenue: `$${(eventData.tickets_sold * (eventData.min_price || 0)).toFixed(2)}`,
          dressCode: eventData.dress_code || undefined,
          regalia: eventData.regalia || undefined,
          degreeType: eventData.degree_type || undefined,
          tickets: eventData.tickets.map(ticket => ({
            id: ticket.ticket_id,
            event_id: eventData.event_id,
            name: ticket.name,
            price: ticket.price,
            available: ticket.is_active && ticket.quantity_available > 0,
            description: ticket.description || undefined,
            quantity: ticket.quantity_total,
            quantityAvailable: ticket.quantity_available,
            max_per_order: ticket.max_per_order,
            min_per_order: ticket.min_per_order,
            attendee_type: ticket.attendee_type || undefined
          })),
          longDescription: eventData.long_description || eventData.description,
          time: eventData.event_start ? new Date(eventData.event_start).toLocaleTimeString() : '',
          venue: eventData.venue_name ? {
            name: eventData.venue_name,
            address: eventData.venue_address || '',
            city: eventData.venue_city || '',
            state: eventData.venue_state || '',
            postcode: eventData.venue_postcode || '',
            mapUrl: eventData.venue_map_url || undefined
          } : undefined,
          childEvents: eventData.child_events.map(child => ({
            id: child.id,
            slug: child.slug,
            title: child.title,
            subtitle: child.subtitle || undefined,
            date: child.event_start ? new Date(child.event_start).toISOString().split('T')[0] : '',
            time: child.event_start ? new Date(child.event_start).toLocaleTimeString() : '',
            location: child.location,
            price: child.min_price ? `$${child.min_price}` : '$0'
          }))
        };
      } catch (error) {
        console.error('Error fetching event:', error);
        return null;
      }
    },
    'EVENT_DETAIL'
  );
}

/**
 * Get event tickets using ticket availability view
 */
export async function getEventTickets(eventId: string): Promise<Ticket[]> {
  const cacheKey = CacheKeys.eventTickets(eventId);
  
  return cacheManager.getOrFetch(
    cacheKey,
    async () => {
      try {
        const supabase = await createClient();
        
        // Use ticket availability view for real-time availability
        const { data, error } = await supabase
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
        
        return (data || []).map(ticket => ({
          id: ticket.ticket.ticket_id,
          event_id: ticket.event_id,
          name: ticket.name,
          price: ticket.price,
          available: ticket.is_available,
          description: ticket.description || undefined,
          quantity: ticket.total_quantity,
          quantityAvailable: ticket.available_quantity,
          max_per_order: ticket.max_per_order,
          min_per_order: ticket.min_per_order,
          attendee_type: ticket.attendee_type || undefined
        }));
      } catch (error) {
        console.error('Exception fetching tickets:', error);
        return [];
      }
    },
    'EVENT_DETAIL'
  );
}

/**
 * Get all published events using the optimized view
 */
export async function getPublishedEvents(): Promise<Event[]> {
  const cacheKey = CacheKeys.eventList('all_published');
  
  return cacheManager.getOrFetch(
    cacheKey,
    async () => {
      try {
        // Use RPC service to get event cards data
        const events = await eventRPC.getAllEvents();
        
        return events.map(event => ({
          id: event.event_id,
          slug: event.slug,
          title: event.title,
          subtitle: event.subtitle || undefined,
          description: event.description,
          date: event.event_start ? new Date(event.event_start).toISOString().split('T')[0] : '',
          location: event.location || '',
          imageUrl: event.image_url || '/placeholder.svg',
          price: event.min_price ? `$${event.min_price}` : '$0',
          category: event.event_type || undefined,
          status: "Published" as const,
          ticketsSold: event.tickets_sold,
          revenue: `$${(event.tickets_sold * (event.min_price || 0)).toFixed(2)}`,
          time: event.event_start ? new Date(event.event_start).toLocaleTimeString() : ''
        }));
      } catch (error) {
        console.error('Error fetching events:', error);
        return [];
      }
    },
    'EVENT_LIST'
  );
}

/**
 * Get event hierarchy for navigation
 */
export async function getEventHierarchy(eventId: string) {
  const cacheKey = CacheKeys.eventHierarchy(eventId);
  
  return cacheManager.getOrFetch(
    cacheKey,
    async () => {
      try {
        const supabase = await createClient();
        
        const { data, error } = await supabase
          .from('event_hierarchy_view')
          .select('*')
          .or(`event_id.eq.${eventId},root_event_id.eq.${eventId}`)
          .order('event_level', { ascending: true })
          .order('event_start', { ascending: true });
        
        if (error) {
          console.error('Error fetching event hierarchy:', error);
          return [];
        }
        
        return data || [];
      } catch (error) {
        console.error('Exception fetching event hierarchy:', error);
        return [];
      }
    },
    'EVENT_DETAIL'
  );
}

/**
 * Check if event exists (optimized)
 */
export async function eventExists(idOrSlug: string): Promise<boolean> {
  const event = await getEventByIdOrSlug(idOrSlug);
  return event !== null;
}

/**
 * Clear event cache when events are updated
 */
export function clearEventCache(eventId?: string) {
  if (eventId) {
    cacheManager.clear(CacheKeys.eventDetail(eventId));
    cacheManager.clear(CacheKeys.eventTickets(eventId));
    cacheManager.clear(CacheKeys.eventHierarchy(eventId));
  } else {
    cacheManager.invalidatePattern(/^event/);
  }
}

// Export optimized service
export const eventService = {
  getEventByIdOrSlug,
  getEventTickets,
  getPublishedEvents,
  getEventHierarchy,
  eventExists,
  clearEventCache
};