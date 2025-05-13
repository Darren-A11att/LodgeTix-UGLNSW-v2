import { describe, it, expect, vi } from 'vitest';
import { 
  legacyIdToUUID,
  idToSlug,
  ensureSlugPath, 
  convertEventIdFormat
} from '../lib/id-transition-utils';

// Mock the mapping file
vi.mock('../lib/legacy-event-id-mapping.json', () => ({
  default: {
    '1': {
      uuid: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
      slug: 'third-degree-ceremony'
    },
    'grand-installation': {
      uuid: 'd290f1ee-6c54-4b01-90e6-d701748f0855',
      slug: 'grand-installation'
    }
  }
}));

describe('ID Transition Utilities', () => {
  describe('legacyIdToUUID', () => {
    it('returns the UUID for a known legacy ID', () => {
      expect(legacyIdToUUID('1')).toBe('d290f1ee-6c54-4b01-90e6-d701748f0851');
      expect(legacyIdToUUID('grand-installation')).toBe('d290f1ee-6c54-4b01-90e6-d701748f0855');
    });

    it('returns the input if it is already a UUID', () => {
      const uuid = 'd290f1ee-6c54-4b01-90e6-d701748f0851';
      expect(legacyIdToUUID(uuid)).toBe(uuid);
    });

    it('returns null for unknown IDs', () => {
      expect(legacyIdToUUID('unknown-id')).toBeNull();
    });

    it('can identify a slug and return the associated UUID', () => {
      expect(legacyIdToUUID('third-degree-ceremony')).toBe('d290f1ee-6c54-4b01-90e6-d701748f0851');
    });
  });

  describe('idToSlug', () => {
    it('returns the slug for a known legacy ID', () => {
      expect(idToSlug('1')).toBe('third-degree-ceremony');
      expect(idToSlug('grand-installation')).toBe('grand-installation');
    });

    it('returns the slug for a known UUID', () => {
      expect(idToSlug('d290f1ee-6c54-4b01-90e6-d701748f0851')).toBe('third-degree-ceremony');
    });

    it('returns the input if it is already a slug', () => {
      expect(idToSlug('third-degree-ceremony')).toBe('third-degree-ceremony');
    });

    it('returns the input for unknown IDs assuming they might be slugs', () => {
      expect(idToSlug('unknown-id')).toBe('unknown-id');
    });
  });

  describe('ensureSlugPath', () => {
    it('converts event paths to use slugs', () => {
      expect(ensureSlugPath('/events/1')).toBe('/events/third-degree-ceremony');
      expect(ensureSlugPath('/events/1/tickets')).toBe('/events/third-degree-ceremony/tickets');
    });

    it('leaves paths with slugs unchanged', () => {
      expect(ensureSlugPath('/events/third-degree-ceremony')).toBe('/events/third-degree-ceremony');
    });

    it('leaves non-event paths unchanged', () => {
      expect(ensureSlugPath('/about')).toBe('/about');
      expect(ensureSlugPath('/profile/settings')).toBe('/profile/settings');
    });
  });

  describe('convertEventIdFormat', () => {
    it('adds missing slug for events with legacy IDs', () => {
      const event = { id: '1', title: 'Test Event' };
      const updated = convertEventIdFormat(event);
      expect(updated).toEqual({
        id: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
        legacyId: '1',
        title: 'Test Event',
        slug: 'third-degree-ceremony'
      });
    });

    it('keeps events with UUIDs unchanged except adding slug', () => {
      const event = { id: 'd290f1ee-6c54-4b01-90e6-d701748f0855', title: 'Test Event' };
      const updated = convertEventIdFormat(event);
      expect(updated).toEqual({
        id: 'd290f1ee-6c54-4b01-90e6-d701748f0855',
        title: 'Test Event',
        slug: 'grand-installation'
      });
    });

    it('leaves events with both ID and slug unchanged', () => {
      const event = { 
        id: 'd290f1ee-6c54-4b01-90e6-d701748f0851', 
        slug: 'third-degree-ceremony',
        title: 'Test Event' 
      };
      const updated = convertEventIdFormat(event);
      expect(updated).toEqual(event);
    });

    it('handles null/undefined input', () => {
      expect(convertEventIdFormat(null)).toBeNull();
      expect(convertEventIdFormat(undefined)).toBeUndefined();
    });
  });
});