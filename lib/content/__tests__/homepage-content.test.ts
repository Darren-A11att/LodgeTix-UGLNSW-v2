/**
 * Tests for Homepage Content Structure
 * 
 * These tests verify that the homepage content configuration
 * has the correct structure and required fields.
 */

import { homepageContent } from '../homepage-content'

describe('Homepage Content Structure', () => {
  it('should have all required sections', () => {
    expect(homepageContent).toHaveProperty('navigation')
    expect(homepageContent).toHaveProperty('hero')
    expect(homepageContent).toHaveProperty('sponsors')
    expect(homepageContent).toHaveProperty('featuredEvents')
    expect(homepageContent).toHaveProperty('locationInfo')
    expect(homepageContent).toHaveProperty('cta')
  })

  describe('Navigation Section', () => {
    it('should have brand configuration', () => {
      expect(homepageContent.navigation.brand).toHaveProperty('name')
      expect(homepageContent.navigation.brand).toHaveProperty('logo')
      expect(homepageContent.navigation.brand.name).toHaveProperty('source')
      expect(homepageContent.navigation.brand.name).toHaveProperty('fallback')
    })

    it('should have menu items', () => {
      expect(homepageContent.navigation.menuItems).toHaveProperty('source')
      expect(homepageContent.navigation.menuItems).toHaveProperty('fallback')
      expect(Array.isArray(homepageContent.navigation.menuItems.fallback)).toBe(true)
      expect(homepageContent.navigation.menuItems.fallback.length).toBeGreaterThan(0)
    })

    it('should have auth link configuration', () => {
      expect(homepageContent.navigation.authLink).toHaveProperty('text')
      expect(homepageContent.navigation.authLink).toHaveProperty('href')
      expect(homepageContent.navigation.authLink.text).toHaveProperty('source')
      expect(homepageContent.navigation.authLink.text).toHaveProperty('fallback')
    })
  })

  describe('Hero Section', () => {
    it('should have title configuration', () => {
      expect(homepageContent.hero.title).toHaveProperty('source')
      expect(homepageContent.hero.title).toHaveProperty('fallback')
      expect(['DATABASE', 'FALLBACK']).toContain(homepageContent.hero.title.source)
    })

    it('should have image configuration', () => {
      expect(homepageContent.hero.image).toHaveProperty('url')
      expect(homepageContent.hero.image).toHaveProperty('alt')
      expect(homepageContent.hero.image.url).toHaveProperty('source')
      expect(homepageContent.hero.image.url).toHaveProperty('fallback')
    })

    it('should have button configuration', () => {
      expect(homepageContent.hero.buttons).toHaveProperty('primary')
      expect(homepageContent.hero.buttons).toHaveProperty('secondary')
      expect(homepageContent.hero.buttons.primary).toHaveProperty('text')
      expect(homepageContent.hero.buttons.primary).toHaveProperty('href')
    })

    it('should have database configuration for DATABASE sources', () => {
      if (homepageContent.hero.title.source === 'DATABASE') {
        expect(homepageContent.hero.title).toHaveProperty('database')
        expect(homepageContent.hero.title.database).toHaveProperty('table')
        expect(homepageContent.hero.title.database).toHaveProperty('recordId')
        expect(homepageContent.hero.title.database).toHaveProperty('idColumn')
        expect(homepageContent.hero.title.database).toHaveProperty('valueColumn')
        expect(homepageContent.hero.title.database.valueColumn).toBe('name')
      }
    })

    it('should use correct database field mappings', () => {
      // Test that title maps to 'name' field
      if (homepageContent.hero.title.source === 'DATABASE') {
        expect(homepageContent.hero.title.database.valueColumn).toBe('name')
      }
      
      // Test that subtitle is fallback-only (no database field exists)
      expect(homepageContent.hero.subtitle.source).toBe('FALLBACK')
    })
  })

  describe('Sponsors Section', () => {
    it('should have title and items', () => {
      expect(homepageContent.sponsors).toHaveProperty('title')
      expect(homepageContent.sponsors).toHaveProperty('items')
      expect(homepageContent.sponsors.title).toHaveProperty('source')
      expect(homepageContent.sponsors.title).toHaveProperty('fallback')
    })

    it('should have sponsor items with required fields', () => {
      expect(Array.isArray(homepageContent.sponsors.items.fallback)).toBe(true)
      const firstSponsor = homepageContent.sponsors.items.fallback[0]
      expect(firstSponsor).toHaveProperty('name')
      expect(firstSponsor).toHaveProperty('logo')
      expect(firstSponsor).toHaveProperty('alt')
    })
  })

  describe('Featured Events Section', () => {
    it('should have all required fields', () => {
      expect(homepageContent.featuredEvents).toHaveProperty('title')
      expect(homepageContent.featuredEvents).toHaveProperty('description')
      expect(homepageContent.featuredEvents).toHaveProperty('viewAllButton')
      expect(homepageContent.featuredEvents).toHaveProperty('eventsData')
    })

    it('should have fallback events with correct structure', () => {
      expect(Array.isArray(homepageContent.featuredEvents.eventsData.fallback)).toBe(true)
      const firstEvent = homepageContent.featuredEvents.eventsData.fallback[0]
      expect(firstEvent).toHaveProperty('id')
      expect(firstEvent).toHaveProperty('title')
      expect(firstEvent).toHaveProperty('description')
      expect(firstEvent).toHaveProperty('date')
      expect(firstEvent).toHaveProperty('location')
      expect(firstEvent).toHaveProperty('imageUrl')
    })
  })

  describe('Location Info Section', () => {
    it('should have all required fields', () => {
      expect(homepageContent.locationInfo).toHaveProperty('badge')
      expect(homepageContent.locationInfo).toHaveProperty('title')
      expect(homepageContent.locationInfo).toHaveProperty('description')
      expect(homepageContent.locationInfo).toHaveProperty('image')
      expect(homepageContent.locationInfo).toHaveProperty('features')
    })

    it('should have features with correct structure', () => {
      expect(Array.isArray(homepageContent.locationInfo.features.fallback)).toBe(true)
      const firstFeature = homepageContent.locationInfo.features.fallback[0]
      expect(firstFeature).toHaveProperty('name')
      expect(firstFeature).toHaveProperty('description')
      expect(firstFeature).toHaveProperty('icon')
    })
  })

  describe('CTA Section', () => {
    it('should have all required fields', () => {
      expect(homepageContent.cta).toHaveProperty('title')
      expect(homepageContent.cta).toHaveProperty('description')
      expect(homepageContent.cta).toHaveProperty('secondaryDescription')
      expect(homepageContent.cta).toHaveProperty('button')
      expect(homepageContent.cta).toHaveProperty('images')
    })

    it('should have images with correct structure', () => {
      expect(Array.isArray(homepageContent.cta.images.fallback)).toBe(true)
      const firstImage = homepageContent.cta.images.fallback[0]
      expect(firstImage).toHaveProperty('url')
      expect(firstImage).toHaveProperty('alt')
      expect(firstImage).toHaveProperty('className')
    })

    it('should have button configuration', () => {
      expect(homepageContent.cta.button).toHaveProperty('text')
      expect(homepageContent.cta.button).toHaveProperty('href')
      expect(homepageContent.cta.button.text).toHaveProperty('source')
      expect(homepageContent.cta.button.text).toHaveProperty('fallback')
    })
  })

  describe('Content Source Validation', () => {
    const validateContentItem = (item: any, path: string) => {
      if (item && typeof item === 'object' && 'source' in item) {
        expect(['DATABASE', 'FALLBACK']).toContain(item.source)
        expect(item).toHaveProperty('fallback')
        
        // Special case: eventsData is handled differently in the service
        if (item.source === 'DATABASE' && path !== 'featuredEvents.eventsData') {
          expect(item).toHaveProperty('database')
          expect(item.database).toHaveProperty('table')
          expect(item.database).toHaveProperty('recordId')
          expect(item.database).toHaveProperty('idColumn')
          expect(item.database).toHaveProperty('valueColumn')
        }
      }
    }

    const traverseObject = (obj: any, path = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key
        validateContentItem(value, currentPath)
        
        if (value && typeof value === 'object' && !('source' in value) && !Array.isArray(value)) {
          traverseObject(value, currentPath)
        }
      }
    }

    it('should have valid source values for all content items', () => {
      traverseObject(homepageContent)
    })
  })
})