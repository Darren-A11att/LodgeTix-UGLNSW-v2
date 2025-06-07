/**
 * Homepage Content Service
 * 
 * This service resolves content from the homepage-content.ts configuration,
 * fetching from database when source is "DATABASE" or returning fallback content.
 */

import { createClient } from '@/utils/supabase/server'
import { homepageContent, ContentItem, DatabaseConfig } from './homepage-content'

export class HomepageContentService {
  private supabase: any

  constructor() {
    this.init()
  }

  private async init() {
    this.supabase = await createClient()
  }

  /**
   * Resolves a single content item based on its source configuration
   */
  async resolveContentItem(item: ContentItem): Promise<any> {
    if (item.source === 'FALLBACK') {
      return item.fallback
    }

    if (item.source === 'DATABASE' && item.database) {
      try {
        const value = await this.fetchFromDatabase(item.database)
        return value || item.fallback // Fallback if database returns null/undefined
      } catch (error) {
        console.warn('Failed to fetch from database, using fallback:', error)
        return item.fallback
      }
    }

    return item.fallback
  }

  /**
   * Fetches a single value from the database based on configuration
   */
  private async fetchFromDatabase(config: DatabaseConfig): Promise<any> {
    if (!this.supabase) {
      await this.init()
    }

    // Ensure we have a valid record ID
    if (!config.recordId) {
      throw new Error(`No record ID provided for table ${config.table}`)
    }

    const { data, error } = await this.supabase
      .from(config.table)
      .select(config.valueColumn)
      .eq(config.idColumn, config.recordId)
      .single()

    if (error) {
      throw error
    }

    return data?.[config.valueColumn]
  }

  /**
   * Resolves an object with multiple content items
   */
  async resolveContentObject(obj: any): Promise<any> {
    const resolved: any = {}

    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object' && 'source' in value) {
        // This is a ContentItem
        resolved[key] = await this.resolveContentItem(value as ContentItem)
      } else if (value && typeof value === 'object') {
        // This is a nested object, recurse
        resolved[key] = await this.resolveContentObject(value)
      } else {
        // This is a primitive value
        resolved[key] = value
      }
    }

    return resolved
  }

  /**
   * Get all homepage content with resolved values
   */
  async getAllContent() {
    return await this.resolveContentObject(homepageContent)
  }

  /**
   * Get specific section content
   */
  async getNavigationContent() {
    return await this.resolveContentObject(homepageContent.navigation)
  }

  async getHeroContent() {
    const heroContent = await this.resolveContentObject(homepageContent.hero)
    
    // Special handling for hero button href that depends on database slug
    if (homepageContent.hero.buttons.primary.href.source === 'DATABASE') {
      try {
        const slug = await this.resolveContentItem(homepageContent.hero.buttons.primary.href)
        if (slug && slug !== '/functions') {
          heroContent.buttons.primary.href = `/functions/${slug}/register`
        }
      } catch (error) {
        console.warn('Failed to get slug for hero button, using fallback:', error)
        // heroContent.buttons.primary.href already has fallback from resolveContentObject
      }
    }

    return heroContent
  }

  async getSponsorsContent() {
    return await this.resolveContentObject(homepageContent.sponsors)
  }

  async getFeaturedEventsContent() {
    const content = await this.resolveContentObject(homepageContent.featuredEvents)
    
    // Special handling for events data if coming from database
    if (homepageContent.featuredEvents.eventsData.source === 'DATABASE') {
      try {
        if (!this.supabase) {
          await this.init()
        }

        const functionId = process.env.FEATURED_FUNCTION_ID
        if (!functionId) {
          throw new Error('FEATURED_FUNCTION_ID not set')
        }

        const { data: events, error } = await this.supabase
          .from('events')
          .select('*,locations(place_name,suburb,state)')
          .eq('function_id', functionId)
          .eq('is_published', true)
          .order('event_start', { ascending: true })
          .limit(2)

        if (!error && events && events.length > 0) {
          content.eventsData = events.map((event: any) => {
            // Format location string from nested location data
            let locationString = ''
            if (event.locations) {
              locationString = event.locations.place_name
              if (event.locations.suburb && event.locations.state) {
                locationString += `, ${event.locations.suburb}, ${event.locations.state}`
              } else if (event.locations.suburb || event.locations.state) {
                locationString += `, ${event.locations.suburb || event.locations.state}`
              }
            }

            return {
              id: event.event_id,
              slug: event.slug,
              title: event.title,
              description: event.description,
              date: new Date(event.event_start).toLocaleDateString('en-AU', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }),
              location: locationString || 'Location TBA',
              imageUrl: event.image_url || '/placeholder.svg?height=400&width=1000',
              price: 'View pricing'
            }
          })
        }
      } catch (error) {
        console.warn('Failed to fetch events from database, using fallback:', error)
        // Content already has fallback from resolveContentObject
      }
    }

    return content
  }

  async getLocationInfoContent() {
    return await this.resolveContentObject(homepageContent.locationInfo)
  }

  async getCtaContent() {
    return await this.resolveContentObject(homepageContent.cta)
  }
}

// Singleton instance for server components
let contentServiceInstance: HomepageContentService | null = null

export async function getHomepageContentService(): Promise<HomepageContentService> {
  if (!contentServiceInstance) {
    contentServiceInstance = new HomepageContentService()
    await contentServiceInstance['init']() // Call private init method
  }
  return contentServiceInstance
}