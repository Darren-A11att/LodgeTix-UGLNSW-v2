// Event Facade - Unified interface for events data
// This facade allows gradual migration from hard-coded to database events

import type { Event } from '@/lib/event-utils'
import { getEventService as getNewEventService } from '@/lib/services/events-schema-service'
import { getEvents as getHardCodedEvents, getEventByIdOrSlug as getHardCodedEvent } from '@/lib/event-utils'
import { api } from '@/lib/api-logger'

// Feature flag - set this in .env.local
const USE_EVENTS_SCHEMA = process.env.NEXT_PUBLIC_USE_EVENTS_SCHEMA === 'true'

// Simple in-memory cache for frequently accessed data
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

interface EventCache {
  allEvents?: CacheItem<Event[]>;
  eventById: Record<string, CacheItem<Event | null>>;
  featuredEvents?: CacheItem<Event[]>;
  upcomingEvents?: CacheItem<Event[]>;
  eventsByCategory: Record<string, CacheItem<Event[]>>;
  searchResults: Record<string, CacheItem<Event[]>>;
}

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// Initialize cache - using a function to ensure it's created fresh for each client
const createCache = (): EventCache => ({
  eventById: {},
  eventsByCategory: {},
  searchResults: {}
});

// Use separate caches for server and client to prevent hydration issues
const isClient = typeof window !== 'undefined';
const cache: EventCache = isClient ? createCache() : {
  eventById: {},
  eventsByCategory: {},
  searchResults: {}
};

// Log which source we're using
if (typeof window !== 'undefined') {
  console.log(`Events source: ${USE_EVENTS_SCHEMA ? 'Events table from Supabase' : 'Hard-coded'}`)
}

/**
 * Check if a cache item is still valid
 */
function isCacheValid<T>(cacheItem?: CacheItem<T>): boolean {
  if (!cacheItem) return false;
  return Date.now() - cacheItem.timestamp < CACHE_TTL;
}

/**
 * Set a cache item with current timestamp
 */
function setCacheItem<T>(cache: CacheItem<T> | undefined, data: T): CacheItem<T> {
  return { data, timestamp: Date.now() };
}

/**
 * Get all events - from database or hard-coded
 * @param bypassCache Force a fresh fetch, bypassing cache
 */
export async function getEvents(bypassCache: boolean = false): Promise<Event[]> {
  // Check cache first unless bypass is requested
  if (!bypassCache && isCacheValid(cache.allEvents)) {
    api.debug('Returning cached events');
    return cache.allEvents!.data;
  }

  if (USE_EVENTS_SCHEMA) {
    try {
      api.debug('Fetching events from Supabase');
      const eventService = getNewEventService()
      const events = await eventService.getPublishedEvents()
      
      // Update cache
      cache.allEvents = setCacheItem(cache.allEvents, events);
      
      return events;
    } catch (error) {
      api.error('Error fetching events from events schema:', error);
      api.info('Falling back to hard-coded events data');
      
      const events = getHardCodedEvents();
      
      // Cache the fallback result too
      cache.allEvents = setCacheItem(cache.allEvents, events);
      
      return events;
    }
  }
  
  api.debug('Using hard-coded events (feature flag off)');
  const events = getHardCodedEvents();
  
  // Update cache
  cache.allEvents = setCacheItem(cache.allEvents, events);
  
  return events;
}

/**
 * Get an event by ID or slug
 * @param idOrSlug UUID or slug string
 * @param bypassCache Force a fresh fetch, bypassing cache
 */
export async function getEventByIdOrSlug(idOrSlug: string, bypassCache: boolean = false): Promise<Event | null> {
  // Sanitize input
  if (!idOrSlug) {
    api.warn('getEventByIdOrSlug called with empty idOrSlug');
    return null;
  }
  
  // Check cache first unless bypass is requested
  if (!bypassCache && cache.eventById[idOrSlug] && isCacheValid(cache.eventById[idOrSlug])) {
    api.debug(`Returning cached event for ${idOrSlug}`);
    return cache.eventById[idOrSlug].data;
  }

  if (USE_EVENTS_SCHEMA) {
    try {
      api.debug(`Fetching event ${idOrSlug} from Supabase`);
      const eventService = getNewEventService()
      const event = await eventService.getEventByIdOrSlug(idOrSlug)
      
      // Update cache
      cache.eventById[idOrSlug] = setCacheItem(cache.eventById[idOrSlug], event);
      
      return event;
    } catch (error) {
      api.error(`Error fetching event ${idOrSlug} from events schema:`, error);
      api.info('Falling back to hard-coded event data');
      
      const event = getHardCodedEvent(idOrSlug);
      const result = event || null;
      
      // Cache the fallback result too
      cache.eventById[idOrSlug] = setCacheItem(cache.eventById[idOrSlug], result);
      
      return result;
    }
  }
  
  api.debug(`Using hard-coded event for ${idOrSlug} (feature flag off)`);
  const event = getHardCodedEvent(idOrSlug);
  const result = event || null;
  
  // Update cache
  cache.eventById[idOrSlug] = setCacheItem(cache.eventById[idOrSlug], result);
  
  return result;
}

/**
 * Get an event by ID (alias for getEventByIdOrSlug)
 */
export async function getEventById(id: string, bypassCache: boolean = false): Promise<Event | null> {
  return getEventByIdOrSlug(id, bypassCache);
}

/**
 * Get featured events
 * @param bypassCache Force a fresh fetch, bypassing cache
 */
export async function getFeaturedEvents(bypassCache: boolean = false): Promise<Event[]> {
  // Check cache first unless bypass is requested
  if (!bypassCache && isCacheValid(cache.featuredEvents)) {
    api.debug('Returning cached featured events');
    return cache.featuredEvents!.data;
  }

  if (USE_EVENTS_SCHEMA) {
    try {
      api.debug('Fetching featured events from Supabase');
      const eventService = getNewEventService()
      const events = await eventService.getFeaturedEvents()
      
      // Update cache
      cache.featuredEvents = setCacheItem(cache.featuredEvents, events);
      
      return events;
    } catch (error) {
      api.error('Error fetching featured events from events schema:', error);
      api.info('Falling back to hard-coded featured events');
      
      const events = getHardCodedEvents();
      const filtered = events.filter(event => event.featured || event.category === 'Installation').slice(0, 3);
      
      // Cache the fallback result too
      cache.featuredEvents = setCacheItem(cache.featuredEvents, filtered);
      
      return filtered;
    }
  }
  
  api.debug('Using hard-coded featured events (feature flag off)');
  const events = getHardCodedEvents();
  const filtered = events.filter(event => event.featured || event.category === 'Installation').slice(0, 3);
  
  // Update cache
  cache.featuredEvents = setCacheItem(cache.featuredEvents, filtered);
  
  return filtered;
}

/**
 * Get upcoming events
 * @param limit Maximum number of events to return
 * @param bypassCache Force a fresh fetch, bypassing cache
 */
export async function getUpcomingEvents(limit: number = 10, bypassCache: boolean = false): Promise<Event[]> {
  // Check cache first unless bypass is requested
  if (!bypassCache && isCacheValid(cache.upcomingEvents)) {
    api.debug('Returning cached upcoming events');
    const cachedEvents = cache.upcomingEvents!.data;
    return cachedEvents.slice(0, limit); // Apply limit to cached results
  }

  if (USE_EVENTS_SCHEMA) {
    try {
      api.debug(`Fetching upcoming events from Supabase (limit: ${limit})`);
      const eventService = getNewEventService()
      const events = await eventService.getUpcomingEvents(limit)
      
      // Update cache with full result
      cache.upcomingEvents = setCacheItem(cache.upcomingEvents, events);
      
      return events;
    } catch (error) {
      api.error('Error fetching upcoming events from events schema:', error);
      api.info('Falling back to hard-coded upcoming events');
      
      const filtered = filterUpcomingEvents(getHardCodedEvents(), limit);
      
      // Cache the fallback result too
      cache.upcomingEvents = setCacheItem(cache.upcomingEvents, filtered);
      
      return filtered;
    }
  }
  
  api.debug(`Using hard-coded upcoming events (feature flag off, limit: ${limit})`);
  const filtered = filterUpcomingEvents(getHardCodedEvents(), limit);
  
  // Update cache
  cache.upcomingEvents = setCacheItem(cache.upcomingEvents, filtered);
  
  return filtered;
}

/**
 * Get events by category
 * @param category Category name to filter by
 * @param bypassCache Force a fresh fetch, bypassing cache
 */
export async function getEventsByCategory(category: string, bypassCache: boolean = false): Promise<Event[]> {
  // Sanitize input
  if (!category) {
    api.warn('getEventsByCategory called with empty category');
    return [];
  }
  
  const cacheKey = category.toLowerCase();
  
  // Check cache first unless bypass is requested
  if (!bypassCache && cache.eventsByCategory[cacheKey] && isCacheValid(cache.eventsByCategory[cacheKey])) {
    api.debug(`Returning cached events for category: ${category}`);
    return cache.eventsByCategory[cacheKey].data;
  }

  if (USE_EVENTS_SCHEMA) {
    try {
      api.debug(`Fetching events for category: ${category} from Supabase`);
      const eventService = getNewEventService()
      const events = await eventService.getEventsByCategory(category)
      
      // Update cache
      cache.eventsByCategory[cacheKey] = setCacheItem(cache.eventsByCategory[cacheKey], events);
      
      return events;
    } catch (error) {
      api.error(`Error fetching events for category: ${category} from events schema:`, error);
      api.info('Falling back to hard-coded category events');
      
      const filtered = filterEventsByCategory(getHardCodedEvents(), category);
      
      // Cache the fallback result too
      cache.eventsByCategory[cacheKey] = setCacheItem(cache.eventsByCategory[cacheKey], filtered);
      
      return filtered;
    }
  }
  
  api.debug(`Using hard-coded events for category: ${category} (feature flag off)`);
  const filtered = filterEventsByCategory(getHardCodedEvents(), category);
  
  // Update cache
  cache.eventsByCategory[cacheKey] = setCacheItem(cache.eventsByCategory[cacheKey], filtered);
  
  return filtered;
}

/**
 * Search events
 * @param query Search terms
 * @param bypassCache Force a fresh fetch, bypassing cache
 */
export async function searchEvents(query: string, bypassCache: boolean = false): Promise<Event[]> {
  // Sanitize input
  if (!query) {
    api.warn('searchEvents called with empty query');
    return [];
  }
  
  const cacheKey = query.toLowerCase();
  
  // Check cache first unless bypass is requested
  if (!bypassCache && cache.searchResults[cacheKey] && isCacheValid(cache.searchResults[cacheKey])) {
    api.debug(`Returning cached search results for: ${query}`);
    return cache.searchResults[cacheKey].data;
  }

  if (USE_EVENTS_SCHEMA) {
    try {
      api.debug(`Searching events for: ${query} in Supabase`);
      const eventService = getNewEventService()
      const events = await eventService.searchEvents(query)
      
      // Update cache
      cache.searchResults[cacheKey] = setCacheItem(cache.searchResults[cacheKey], events);
      
      return events;
    } catch (error) {
      api.error(`Error searching events for: ${query} in events schema:`, error);
      api.info('Falling back to hard-coded event search');
      
      const results = searchHardCodedEvents(getHardCodedEvents(), query);
      
      // Cache the fallback result too
      cache.searchResults[cacheKey] = setCacheItem(cache.searchResults[cacheKey], results);
      
      return results;
    }
  }
  
  api.debug(`Using hard-coded event search for: ${query} (feature flag off)`);
  const results = searchHardCodedEvents(getHardCodedEvents(), query);
  
  // Update cache
  cache.searchResults[cacheKey] = setCacheItem(cache.searchResults[cacheKey], results);
  
  return results;
}

/**
 * Clear all cached event data
 */
export function clearEventCache(): void {
  api.info('Clearing event cache');
  cache.allEvents = undefined;
  cache.featuredEvents = undefined;
  cache.upcomingEvents = undefined;
  cache.eventById = {};
  cache.eventsByCategory = {};
  cache.searchResults = {};
}

/**
 * Clear specific event from cache (useful after updates)
 */
export function clearEventCacheById(idOrSlug: string): void {
  api.debug(`Clearing cached event for ${idOrSlug}`);
  if (cache.eventById[idOrSlug]) {
    delete cache.eventById[idOrSlug];
  }
  
  // Also clear collection caches since they might contain this event
  cache.allEvents = undefined;
  cache.featuredEvents = undefined;
  cache.upcomingEvents = undefined;
  cache.eventsByCategory = {};
  cache.searchResults = {};
}

// Helper functions for hard-coded events
function filterUpcomingEvents(events: Event[], limit: number): Event[] {
  const now = new Date()
  
  return events
    .filter(event => {
      const eventDate = new Date(event.date || event.event_start)
      return eventDate > now
    })
    .sort((a, b) => {
      const dateA = new Date(a.date || a.event_start)
      const dateB = new Date(b.date || b.event_start)
      return dateA.getTime() - dateB.getTime()
    })
    .slice(0, limit)
}

function filterEventsByCategory(events: Event[], category: string): Event[] {
  return events.filter(event => 
    event.category?.toLowerCase() === category.toLowerCase() ||
    event.type?.toLowerCase() === category.toLowerCase()
  )
}

function searchHardCodedEvents(events: Event[], query: string): Event[] {
  const searchTerm = query.toLowerCase()
  
  return events.filter(event => 
    event.title?.toLowerCase().includes(searchTerm) ||
    event.description?.toLowerCase().includes(searchTerm) ||
    event.location?.toLowerCase().includes(searchTerm) ||
    event.category?.toLowerCase().includes(searchTerm)
  )
}

/**
 * Check if we're using the events schema
 */
export function isUsingEventsSchema(): boolean {
  return USE_EVENTS_SCHEMA
}

/**
 * Helper to get event URL
 */
export function getEventUrl(event: Event): string {
  // Prefer slug over ID for cleaner URLs
  const identifier = event.slug || event.id
  return `/events/${identifier}`
}

/**
 * Helper to format event date
 */
export function formatEventDate(event: Event): string {
  const date = event.date || event.event_start
  if (!date) return 'Date TBD'
  
  try {
    const eventDate = new Date(date)
    return eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    api.warn(`Error formatting date: ${date}`, error);
    return date.toString();
  }
}

/**
 * Helper to format event time
 */
export function formatEventTime(event: Event): string {
  const time = event.time || event.event_start
  if (!time) return 'Time TBD'
  
  if (event.time && typeof event.time === 'string' && !event.time.includes('T')) {
    // If it's already formatted time string without date part, return it
    return event.time
  }
  
  try {
    // Parse from ISO datetime
    const eventTime = new Date(time)
    return eventTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  } catch (error) {
    api.warn(`Error formatting time: ${time}`, error);
    return time.toString();
  }
}

/**
 * Get related events for a parent event
 * @param parentEventId UUID of the parent event
 * @param bypassCache Force a fresh fetch, bypassing cache
 */
export async function getRelatedEvents(parent_event_id: string, bypassCache: boolean = false): Promise<Event[]> {
  // Sanitize input
  if (!parent_event_id) {
    api.warn('getRelatedEvents called with empty parent_event_id');
    return [];
  }
  
  const cacheKey = `related_${parent_event_id}`;
  
  // Check cache first unless bypass is requested
  if (!bypassCache && cache.eventsByCategory[cacheKey] && isCacheValid(cache.eventsByCategory[cacheKey])) {
    api.debug(`Returning cached related events for parent_event_id: ${parent_event_id}`);
    return cache.eventsByCategory[cacheKey].data;
  }

  if (USE_EVENTS_SCHEMA) {
    try {
      api.debug(`Fetching related events for parent_event_id: ${parent_event_id} from Supabase`);
      const eventService = getNewEventService()
      const events = await eventService.getRelatedEvents(parent_event_id)
      
      // Update cache
      cache.eventsByCategory[cacheKey] = setCacheItem(cache.eventsByCategory[cacheKey], events);
      
      return events;
    } catch (error) {
      api.error(`Error fetching related events for parent_event_id: ${parent_event_id} from events schema:`, error);
      api.info('Falling back to hard-coded related events');
      
      // Fallback implementation for related events if DB lookup fails
      // For hard-coded events, we don't have a proper related_events implementation
      // so we just return events with the same category as a best-effort approach
      const allEvents = getHardCodedEvents();
      const parentEvent = allEvents.find(event => event.id === parent_event_id);
      
      if (!parentEvent) {
        api.warn(`Parent event not found for ID: ${parent_event_id}`);
        return [];
      }
      
      const filtered = allEvents.filter(event => 
        event.id !== parent_event_id && // Not the parent itself
        (event.category === parentEvent.category || event.parent_event_id === parent_event_id)
      );
      
      // Cache the fallback result too
      cache.eventsByCategory[cacheKey] = setCacheItem(cache.eventsByCategory[cacheKey], filtered);
      
      return filtered;
    }
  }
  
  api.debug(`Using hard-coded related events for parent_event_id: ${parent_event_id} (feature flag off)`);
  // Hard-coded implementation similar to fallback
  const allEvents = getHardCodedEvents();
  const parentEvent = allEvents.find(event => event.id === parent_event_id);
  
  if (!parentEvent) {
    api.warn(`Parent event not found for ID: ${parent_event_id}`);
    return [];
  }
  
  const filtered = allEvents.filter(event => 
    event.id !== parent_event_id && // Not the parent itself
    (event.category === parentEvent.category || event.parent_event_id === parent_event_id)
  );
  
  // Update cache
  cache.eventsByCategory[cacheKey] = setCacheItem(cache.eventsByCategory[cacheKey], filtered);
  
  return filtered;
}