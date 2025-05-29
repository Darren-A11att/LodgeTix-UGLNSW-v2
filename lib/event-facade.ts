// Event Facade - Unified interface for events data
// This facade now only uses database events

import type { EventType as Event } from '@/shared/types/event'
import { getEventService as getNewEventService, getServerEventService } from '@/lib/services/events-schema-service'
import { api } from '@/lib/api-logger'

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
 * Get all events - from database
 * @param bypassCache Force a fresh fetch, bypassing cache
 */
export async function getEvents(bypassCache: boolean = false): Promise<Event[]> {
  // Check cache first unless bypass is requested
  if (!bypassCache && isCacheValid(cache.allEvents)) {
    api.debug('Returning cached events');
    return cache.allEvents!.data;
  }

  try {
    api.debug('Fetching events from Supabase');
    const eventService = isClient ? getNewEventService() : getServerEventService()
    const events = await eventService.getPublishedEvents()
    
    // Update cache
    cache.allEvents = setCacheItem(cache.allEvents, events);
    
    return events;
  } catch (error) {
    api.error('Error fetching events from events schema:', error);
    throw error;
  }
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
  
  // Known non-event slugs that should not trigger warnings
  const nonEventSlugs = ['tickets', 'register', 'confirmation'];
  if (nonEventSlugs.includes(idOrSlug.toLowerCase())) {
    api.debug(`Skipping lookup for known non-event slug: ${idOrSlug}`);
    return null;
  }
  
  // Check cache first unless bypass is requested
  if (!bypassCache && cache.eventById[idOrSlug] && isCacheValid(cache.eventById[idOrSlug])) {
    api.debug(`Returning cached event for ${idOrSlug}`);
    return cache.eventById[idOrSlug].data;
  }

  try {
    api.debug(`Fetching event ${idOrSlug} from Supabase`);
    const eventService = isClient ? getNewEventService() : getServerEventService()
    const event = await eventService.getEventByIdOrSlug(idOrSlug)
    
    // Update cache
    cache.eventById[idOrSlug] = setCacheItem(cache.eventById[idOrSlug], event);
    
    return event;
  } catch (error: any) {
    api.error(`Error fetching event ${idOrSlug} from events schema:`, error);
    throw error;
  }
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

  try {
    api.debug('Fetching featured events from Supabase');
    const eventService = isClient ? getNewEventService() : getServerEventService()
    const events = await eventService.getFeaturedEvents()
    
    // Update cache
    cache.featuredEvents = setCacheItem(cache.featuredEvents, events);
    
    return events;
  } catch (error) {
    api.error('Error fetching featured events from events schema:', error);
    throw error;
  }
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

  try {
    api.debug(`Fetching upcoming events from Supabase (limit: ${limit})`);
    const eventService = isClient ? getNewEventService() : getServerEventService()
    const events = await eventService.getUpcomingEvents(limit)
    
    // Update cache with full result
    cache.upcomingEvents = setCacheItem(cache.upcomingEvents, events);
    
    return events;
  } catch (error) {
    api.error('Error fetching upcoming events from events schema:', error);
    throw error;
  }
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

  try {
    api.debug(`Fetching events for category: ${category} from Supabase`);
    const eventService = isClient ? getNewEventService() : getServerEventService()
    const events = await eventService.getEventsByCategory(category)
    
    // Update cache
    cache.eventsByCategory[cacheKey] = setCacheItem(cache.eventsByCategory[cacheKey], events);
    
    return events;
  } catch (error) {
    api.error(`Error fetching events for category: ${category} from events schema:`, error);
    throw error;
  }
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

  try {
    api.debug(`Searching events for: ${query} in Supabase`);
    const eventService = isClient ? getNewEventService() : getServerEventService()
    const events = await eventService.searchEvents(query)
    
    // Update cache
    cache.searchResults[cacheKey] = setCacheItem(cache.searchResults[cacheKey], events);
    
    return events;
  } catch (error) {
    api.error(`Error searching events for: ${query} in events schema:`, error);
    throw error;
  }
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

/**
 * Check if we're using the events schema
 */
export function isUsingEventsSchema(): boolean {
  return true; // Always true now since we only use database
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
  const date = event.date || event.eventStart
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
  const time = event.time || event.eventStart
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

  try {
    api.debug(`Fetching related events for parent_event_id: ${parent_event_id} from Supabase`);
    const eventService = isClient ? getNewEventService() : getServerEventService()
    const events = await eventService.getRelatedEvents(parent_event_id)
    
    // Update cache
    cache.eventsByCategory[cacheKey] = setCacheItem(cache.eventsByCategory[cacheKey], events);
    
    return events;
  } catch (error) {
    api.error(`Error fetching related events for parent_event_id: ${parent_event_id} from events schema:`, error);
    throw error;
  }
}

/**
 * Get child events by parent event ID
 * @param parentEventId UUID of the parent event
 * @param bypassCache Force a fresh fetch, bypassing cache
 */
export async function getChildEventsByParentId(parentEventId: string, bypassCache: boolean = false): Promise<Event[]> {
  // Sanitize input
  if (!parentEventId) {
    api.warn('getChildEventsByParentId called with empty parentEventId');
    return [];
  }
  
  const cacheKey = `children_${parentEventId}`;
  
  // Check cache first unless bypass is requested
  if (!bypassCache && cache.eventsByCategory[cacheKey] && isCacheValid(cache.eventsByCategory[cacheKey])) {
    api.debug(`Returning cached child events for parentEventId: ${parentEventId}`);
    return cache.eventsByCategory[cacheKey].data;
  }

  try {
    api.debug(`Fetching child events for parentEventId: ${parentEventId} from Supabase`);
    const eventService = isClient ? getNewEventService() : getServerEventService()
    const events = await eventService.getChildEventsByParentId(parentEventId)
    
    // Update cache
    cache.eventsByCategory[cacheKey] = setCacheItem(cache.eventsByCategory[cacheKey], events);
    
    return events;
  } catch (error) {
    api.error(`Error fetching child events for parentEventId: ${parentEventId} from events schema:`, error);
    throw error;
  }
}