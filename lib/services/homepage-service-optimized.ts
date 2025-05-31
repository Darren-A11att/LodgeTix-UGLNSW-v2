import { createClient } from '@/utils/supabase/server';
import { api } from '@/lib/api-logger';
import { formatEventDate, formatEventTime } from '@/lib/event-facade';
import { cacheManager, CacheKeys } from '@/lib/cache-manager';
import type { Database } from '@/shared/types/database';

// Type for event display view data
interface EventDisplayView {
  event_id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  event_start: string;
  event_end: string | null;
  location: string;
  image_url: string | null;
  is_featured: boolean;
  is_published: boolean;
  parent_event_id: string | null;
  event_type: string | null;
  parent_slug: string | null;
  parent_title: string | null;
  min_price: number | null;
  max_price: number | null;
  has_free_tickets: boolean;
  total_capacity: number | null;
  tickets_sold: number;
  is_sold_out: boolean;
  organiser_name: string | null;
  venue_name: string | null;
  venue_address: string | null;
}

/**
 * Get the next upcoming event using optimized view
 * Single query instead of multiple
 */
export async function getGrandInstallationEvent() {
  const cacheKey = CacheKeys.eventList('upcoming_main');
  
  return cacheManager.getOrFetch(
    cacheKey,
    async () => {
      try {
        const supabase = await createClient();
        
        const now = new Date().toISOString();
        
        // Single optimized query using the view
        const { data, error } = await supabase
          .from("event_display_view")
          .select('*')
          .eq('is_published', true)
          .gte('event_end', now)
          .order('parent_event_id', { ascending: true, nullsFirst: true })
          .order('event_start', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (error) {
          api.error('Error fetching upcoming event:', error);
          return null;
        }

        return data ? transformViewData(data as EventDisplayView) : null;
      } catch (error) {
        api.error('Exception fetching upcoming event:', error);
        return null;
      }
    },
    'EVENT_LIST'
  );
}

/**
 * Get event timeline using optimized view and caching
 */
export async function getEventTimeline() {
  const cacheKey = CacheKeys.eventList('timeline');
  
  return cacheManager.getOrFetch(
    cacheKey,
    async () => {
      try {
        const supabase = await createClient();
        
        const mainEvent = await getGrandInstallationEvent();
        if (!mainEvent) {
          api.warn('No events found for timeline');
          return [];
        }

        const now = new Date().toISOString();
        
        // Use event hierarchy view for better performance
        const { data, error } = await supabase
          .from("event_hierarchy_view")
          .select('*')
          .or(`parent_event_id.eq.${mainEvent.id},and(event_id.neq.${mainEvent.id},event_end.gte.${now})`)
          .eq('is_published', true)
          .order('event_level', { ascending: false })
          .order('event_start', { ascending: true })
          .limit(8);

        if (error) {
          api.error('Error fetching event timeline:', error);
          return [];
        }

        return (data || []).map(event => ({
          id: event.event_id,
          slug: event.slug,
          title: event.title,
          subtitle: event.subtitle,
          description: event.description,
          date: formatEventDate({ event_start: event.event_start }),
          time: formatEventTime({ event_start: event.event_start }),
          location: event.location,
          image_url: event.image_url,
          imageUrl: event.image_url,
          price: event.min_price ? `$${event.min_price}` : "$0",
          parent_event_id: event.parent_event_id,
          event_start: event.event_start,
          event_end: event.event_end
        }));
      } catch (error) {
        api.error('Exception fetching event timeline:', error);
        return [];
      }
    },
    'EVENT_LIST'
  );
}

/**
 * Get featured events using optimized view with caching
 */
export async function getFeaturedEvents() {
  const cacheKey = CacheKeys.eventList('featured');
  
  return cacheManager.getOrFetch(
    cacheKey,
    async () => {
      try {
        const supabase = await createClient();
        
        // Single query using the optimized view
        const { data, error } = await supabase
          .from("event_display_view")
          .select('*')
          .eq('is_featured', true)
          .eq('is_published', true)
          .order('event_start', { ascending: true })
          .limit(3);

        if (error) {
          api.error('Error fetching featured events:', error);
          return [];
        }

        return (data || []).map(event => transformViewData(event as EventDisplayView));
      } catch (error) {
        api.error('Exception fetching featured events:', error);
        return [];
      }
    },
    'EVENT_LIST'
  );
}

/**
 * Get all published events with pagination support
 */
export async function getPublishedEvents(page: number = 1, limit: number = 12) {
  const cacheKey = CacheKeys.eventList(`published_${page}_${limit}`);
  
  return cacheManager.getOrFetch(
    cacheKey,
    async () => {
      try {
        const supabase = await createClient();
        
        const offset = (page - 1) * limit;
        
        // Get total count
        const { count } = await supabase
          .from("event_display_view")
          .select('*', { count: 'exact', head: true })
          .eq('is_published', true);
        
        // Get paginated results
        const { data, error } = await supabase
          .from("event_display_view")
          .select('*')
          .eq('is_published', true)
          .order('event_start', { ascending: true })
          .range(offset, offset + limit - 1);

        if (error) {
          api.error('Error fetching published events:', error);
          return { events: [], total: 0 };
        }

        return {
          events: (data || []).map(event => transformViewData(event as EventDisplayView)),
          total: count || 0
        };
      } catch (error) {
        api.error('Exception fetching published events:', error);
        return { events: [], total: 0 };
      }
    },
    'EVENT_LIST'
  );
}

/**
 * Transform view data to homepage format
 */
function transformViewData(data: EventDisplayView) {
  const formattedDate = formatEventDate({
    event_start: data.event_start,
    date: data.event_start
  });

  const formattedTime = formatEventTime({
    event_start: data.event_start,
    time: data.event_start
  });

  return {
    id: data.event_id,
    slug: data.slug,
    title: data.title,
    subtitle: data.subtitle || '',
    description: data.description || '',
    organiser: data.organiser_name || 'TBD',
    location: data.venue_name || data.location || 'TBD',
    image_url: data.image_url,
    imageUrl: data.image_url,
    date: formattedDate,
    time: formattedTime,
    price: data.min_price ? `$${data.min_price}` : "$0",
    maxPrice: data.max_price,
    hasFreeTickets: data.has_free_tickets,
    parent_event_id: data.parent_event_id,
    event_start: data.event_start,
    event_end: data.event_end,
    isSoldOut: data.is_sold_out,
    ticketsSold: data.tickets_sold,
    totalCapacity: data.total_capacity,
    venue_address: data.venue_address
  };
}

/**
 * Prefetch events for better performance
 */
export async function prefetchHomepageData() {
  await Promise.all([
    getGrandInstallationEvent(),
    getEventTimeline(),
    getFeaturedEvents()
  ]);
}

/**
 * Clear homepage cache when events are updated
 */
export function clearHomepageCache() {
  cacheManager.invalidatePattern(/^events:/);
}

// Export optimized service
export const homepageService = {
  getGrandInstallationEvent,
  getEventTimeline,
  getFeaturedEvents,
  getPublishedEvents,
  prefetchHomepageData,
  clearHomepageCache
};