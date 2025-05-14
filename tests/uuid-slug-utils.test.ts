import { describe, it, expect } from 'vitest';
import { 
  generateSlug,
  generateUUID,
  isUUID,
  findBySlug,
  findById
} from '../lib/uuid-slug-utils';

describe('UUID and Slug Utilities', () => {
  describe('generateSlug', () => {
    it('converts a title to a URL-friendly slug', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
      expect(generateSlug('Grand Installation 2025')).toBe('grand-installation-2025');
      expect(generateSlug('Test & Special Characters!')).toBe('test-special-characters');
    });

    it('handles edge cases', () => {
      expect(generateSlug('   Trim   Spaces   ')).toBe('trim-spaces');
      expect(generateSlug('Multiple---Hyphens')).toBe('multiple-hyphens');
      expect(generateSlug('-Leading-and-Trailing-')).toBe('leading-and-trailing');
      expect(generateSlug('')).toBe('');
    });
  });

  describe('generateUUID', () => {
    it('generates a valid UUID', () => {
      const uuid = generateUUID();
      expect(typeof uuid).toBe('string');
      expect(isUUID(uuid)).toBe(true);
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('generates unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('isUUID', () => {
    it('returns true for valid UUIDs', () => {
      expect(isUUID('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')).toBe(true);
      expect(isUUID('A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11')).toBe(true); // Case insensitive
    });

    it('returns false for invalid UUIDs', () => {
      expect(isUUID('not-a-uuid')).toBe(false);
      expect(isUUID('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a1')).toBe(false); // Too short
      expect(isUUID('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a111')).toBe(false); // Too long
      expect(isUUID('g0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')).toBe(false); // Invalid character
    });
  });

  describe('findBySlug and findById', () => {
    const items = [
      { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', slug: 'item-one', name: 'Item One' },
      { id: 'b1ffc99-9c0b-4ef8-bb6d-6bb9bd380a22', slug: 'item-two', name: 'Item Two' },
      { id: 'c2ddbc99-9c0b-4ef8-bb6d-6bb9bd380a33', slug: 'item-three', name: 'Item Three' }
    ];

    it('finds an item by slug', () => {
      const item = findBySlug(items, 'item-two');
      expect(item).toBeDefined();
      expect(item?.name).toBe('Item Two');
    });

    it('returns undefined for non-existent slug', () => {
      const item = findBySlug(items, 'non-existent');
      expect(item).toBeUndefined();
    });

    it('finds an item by ID', () => {
      const item = findById(items, 'c2ddbc99-9c0b-4ef8-bb6d-6bb9bd380a33');
      expect(item).toBeDefined();
      expect(item?.name).toBe('Item Three');
    });

    it('returns undefined for non-existent ID', () => {
      const item = findById(items, 'non-existent-id');
      expect(item).toBeUndefined();
    });
  });
});