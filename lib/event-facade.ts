// Event Facade - Unified interface for events data
// This facade allows gradual migration from hard-coded to database events

import type { Event } from '@/lib/event-utils'
import { getEventService as getNewEventService } from '@/lib/services/events-schema-service'
import { getEvents as getHardCodedEvents, getEventByIdOrSlug as getHardCodedEvent } from '@/lib/event-utils'

// Feature flag - set this in .env.local
const USE_EVENTS_SCHEMA = process.env.NEXT_PUBLIC_USE_EVENTS_SCHEMA === 'true'

// Log which source we're using
if (typeof window !== 'undefined') {
  console.log(`Events source: ${USE_EVENTS_SCHEMA ? 'events.events schema' : 'Hard-coded'}`)
}

/**
 * Get all events - from database or hard-coded
 */
export async function getEvents(): Promise<Event[]> {
  if (USE_EVENTS_SCHEMA) {
    try {
      const eventService = getNewEventService()
      return await eventService.getPublishedEvents()
    } catch (error) {
      console.error('Error fetching events from events schema, falling back to hard-coded:', error)
      return getHardCodedEvents()
    }
  }
  
  return getHardCodedEvents()
}

/**
 * Get an event by ID or slug
 */
export async function getEventByIdOrSlug(idOrSlug: string): Promise<Event | null> {
  if (USE_EVENTS_SCHEMA) {
    try {
      const eventService = getNewEventService()
      return await eventService.getEventByIdOrSlug(idOrSlug)
    } catch (error) {
      console.error('Error fetching event from events schema, falling back to hard-coded:', error)
      const event = getHardCodedEvent(idOrSlug)
      return event || null
    }
  }
  
  const event = getHardCodedEvent(idOrSlug)
  return event || null
}

/**
 * Get an event by ID (alias for getEventByIdOrSlug)
 */
export async function getEventById(id: string): Promise<Event | null> {
  return getEventByIdOrSlug(id)
}

/**
 * Get featured events
 */
export async function getFeaturedEvents(): Promise<Event[]> {
  if (USE_EVENTS_SCHEMA) {
    try {
      const eventService = getNewEventService()
      return await eventService.getFeaturedEvents()
    } catch (error) {
      console.error('Error fetching featured events from events schema:', error)
      const events = getHardCodedEvents()
      return events.filter(event => event.featured || event.category === 'Installation').slice(0, 3)
    }
  }
  
  const events = getHardCodedEvents()
  return events.filter(event => event.featured || event.category === 'Installation').slice(0, 3)
}

/**
 * Get upcoming events
 */
export async function getUpcomingEvents(limit: number = 10): Promise<Event[]> {
  if (USE_EVENTS_SCHEMA) {
    try {
      const eventService = getNewEventService()
      return await eventService.getUpcomingEvents(limit)
    } catch (error) {
      console.error('Error fetching upcoming events from events schema:', error)
      return filterUpcomingEvents(getHardCodedEvents(), limit)
    }
  }
  
  return filterUpcomingEvents(getHardCodedEvents(), limit)
}

/**
 * Get events by category
 */
export async function getEventsByCategory(category: string): Promise<Event[]> {
  if (USE_EVENTS_SCHEMA) {
    try {
      const eventService = getNewEventService()
      return await eventService.getEventsByCategory(category)
    } catch (error) {
      console.error('Error fetching events by category from events schema:', error)
      return filterEventsByCategory(getHardCodedEvents(), category)
    }
  }
  
  return filterEventsByCategory(getHardCodedEvents(), category)
}

/**
 * Search events
 */
export async function searchEvents(query: string): Promise<Event[]> {
  if (USE_EVENTS_SCHEMA) {
    try {
      const eventService = getNewEventService()
      return await eventService.searchEvents(query)
    } catch (error) {
      console.error('Error searching events in events schema:', error)
      return searchHardCodedEvents(getHardCodedEvents(), query)
    }
  }
  
  return searchHardCodedEvents(getHardCodedEvents(), query)
}

// Helper functions for hard-coded events
function filterUpcomingEvents(events: Event[], limit: number): Event[] {
  const now = new Date()
  
  return events
    .filter(event => {
      const eventDate = new Date(event.date || event.eventStart)
      return eventDate > now
    })
    .sort((a, b) => {
      const dateA = new Date(a.date || a.eventStart)
      const dateB = new Date(b.date || b.eventStart)
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
  const date = event.date || event.eventStart
  if (!date) return 'Date TBD'
  
  const eventDate = new Date(date)
  return eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Helper to format event time
 */
export function formatEventTime(event: Event): string {
  const time = event.time || event.eventStart
  if (!time) return 'Time TBD'
  
  if (event.time) {
    // If it's already formatted time, return it
    return event.time
  }
  
  // Parse from ISO datetime
  const eventTime = new Date(time)
  return eventTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}