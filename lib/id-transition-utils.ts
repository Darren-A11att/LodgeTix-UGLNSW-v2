/**
 * Utilities for handling the transition between string IDs and UUID/slug system
 */

import { isUUID } from './uuid-slug-utils';

/**
 * Legacy ID to UUID mapping
 * This is generated during migration and should be imported at build time
 */
import legacyMapping from './legacy-event-id-mapping.json';

/**
 * Interface for the mapping structure
 */
interface LegacyMapping {
  [legacyId: string]: {
    uuid: string;
    slug: string;
  };
}

/**
 * Converts a legacy string ID to a UUID
 * If the input is already a UUID, it is returned unchanged
 */
export function legacyIdToUUID(idOrSlug: string): string | null {
  // If it's already a UUID, return it as is
  if (isUUID(idOrSlug)) {
    return idOrSlug;
  }

  // Check if it's a known legacy ID
  const mapping = legacyMapping as LegacyMapping;
  const entry = mapping[idOrSlug];
  if (entry) {
    return entry.uuid;
  }

  // Check if it matches any slug in the mapping
  for (const [legacyId, data] of Object.entries(mapping)) {
    if (data.slug === idOrSlug) {
      return data.uuid;
    }
  }

  // If we can't find a mapping, it might be a new slug or invalid ID
  // Return null to indicate no mapping was found
  return null;
}

/**
 * Converts a string ID (legacy or UUID) to a slug
 * If the input is already a slug, it is returned unchanged
 */
export function idToSlug(idOrSlug: string): string | null {
  // Check if it's a UUID
  if (isUUID(idOrSlug)) {
    // Find the slug for this UUID
    const mapping = legacyMapping as LegacyMapping;
    for (const data of Object.values(mapping)) {
      if (data.uuid === idOrSlug) {
        return data.slug;
      }
    }
    return null; // UUID not found in mapping
  }

  // Check if it's a known legacy ID
  const mapping = legacyMapping as LegacyMapping;
  const entry = mapping[idOrSlug];
  if (entry) {
    return entry.slug;
  }

  // At this point, it's either a slug or an unknown ID
  // Check if it matches any slug in the mapping
  for (const data of Object.values(mapping)) {
    if (data.slug === idOrSlug) {
      return idOrSlug; // It's already a slug
    }
  }

  // If we can't determine whether it's a slug or not,
  // return the original value and let the application decide
  return idOrSlug;
}

/**
 * Ensures a path uses slugs instead of IDs
 * This helps gradually migrate routes to use slugs
 */
export function ensureSlugPath(path: string): string {
  // Regex to match the event ID pattern in paths like /events/[id]
  const eventIdRegex = /\/events\/([^\/]+)(\/.*)?/;
  const match = path.match(eventIdRegex);
  
  if (match) {
    const idOrSlug = match[1];
    const restOfPath = match[2] || '';
    
    const slug = idToSlug(idOrSlug);
    
    if (slug && slug !== idOrSlug) {
      return `/functions/${slug}${restOfPath}`;
    }
  }
  
  return path;
}

/**
 * Converts event objects that might use legacy IDs to use UUID/slug
 * This helps in the transition period where both formats might exist
 */
export function convertEventIdFormat(event: any): any {
  if (!event) return event;
  
  const updatedEvent = { ...event };
  
  // If the event has an ID but no slug, try to find the slug
  if (updatedEvent.id && !updatedEvent.slug) {
    const slug = idToSlug(updatedEvent.id);
    if (slug) {
      updatedEvent.slug = slug;
    }
  }
  
  // If the event has a legacy string ID (not a UUID), try to convert it
  if (updatedEvent.id && !isUUID(updatedEvent.id)) {
    const uuid = legacyIdToUUID(updatedEvent.id);
    if (uuid) {
      // Keep the original ID as legacyId for reference
      updatedEvent.legacyId = updatedEvent.id;
      updatedEvent.id = uuid;
    }
  }
  
  return updatedEvent;
}