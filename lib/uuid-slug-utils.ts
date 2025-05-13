import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a URL-friendly slug from a title or text string
 */
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Generates a new UUID
 */
export const generateUUID = (): string => {
  return uuidv4();
};

/**
 * Creates a mapping object to convert legacy string IDs to UUID/slug pairs
 */
export const createLegacyIdMapping = (legacyIds: string[]): Record<string, { uuid: string, slug: string }> => {
  const mapping: Record<string, { uuid: string, slug: string }> = {};
  
  for (const legacyId of legacyIds) {
    mapping[legacyId] = {
      uuid: generateUUID(),
      slug: legacyId // Use the legacy ID as the slug initially
    };
  }
  
  return mapping;
};

/**
 * Interface for objects with both ID and slug properties
 */
export interface IdentifiableWithSlug {
  id: string; // UUID
  slug: string;
}

/**
 * Finds an item by slug in an array of items that have both id and slug properties
 */
export const findBySlug = <T extends IdentifiableWithSlug>(items: T[], slug: string): T | undefined => {
  return items.find(item => item.slug === slug);
};

/**
 * Finds an item by ID in an array of items that have both id and slug properties
 */
export const findById = <T extends IdentifiableWithSlug>(items: T[], id: string): T | undefined => {
  return items.find(item => item.id === id);
};

/**
 * Determines if a string is likely a UUID
 */
export const isUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};