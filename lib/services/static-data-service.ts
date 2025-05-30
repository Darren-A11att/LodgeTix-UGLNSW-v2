import { getServerClient } from '@/lib/supabase-singleton';
import { createClient } from '@/lib/supabase-browser';
import { Database } from '@/shared/types/database';
import { cacheManager, CacheKeys } from '@/lib/cache-manager';
import { TITLES } from '@/lib/constants/titles';
import { RELATIONSHIPS } from '@/lib/constants/relationships';

// Types
export interface GrandLodge {
  id: string;
  name: string;
  country: string;
  state?: string;
  isDefault?: boolean;
}

export interface Lodge {
  id: string;
  name: string;
  number: string;
  grand_lodge_id: string;
  location?: string;
}

export interface Country {
  code: string;
  name: string;
  states?: Array<{ code: string; name: string }>;
}

/**
 * Service for managing static and semi-static data with intelligent caching
 */
export class StaticDataService {
  private client: ReturnType<typeof createClient<Database>>;

  constructor(private isServer: boolean = false) {
    this.client = this.isServer ? getServerClient() : createClient();
  }

  /**
   * Get all grand lodges (cached indefinitely)
   */
  async getGrandLodges(): Promise<GrandLodge[]> {
    return cacheManager.getOrFetch(
      CacheKeys.GRAND_LODGES,
      async () => {
        try {
          const { data, error } = await this.client
            .from('grand_lodges')
            .select('*')
            .order('name', { ascending: true });

          if (error) {
            console.error('Error fetching grand lodges:', error);
            return [];
          }

          return (data || []).map(gl => ({
            id: gl.id,
            name: gl.name,
            country: gl.country || 'Unknown',
            state: gl.state || undefined,
            isDefault: gl.name === 'United Grand Lodge of NSW & ACT'
          }));
        } catch (error) {
          console.error('Exception fetching grand lodges:', error);
          return [];
        }
      },
      'STATIC'
    );
  }

  /**
   * Get lodges by grand lodge (cached for 5 minutes)
   */
  async getLodges(grandLodgeId?: string): Promise<Lodge[]> {
    const cacheKey = CacheKeys.lodgeList(grandLodgeId);
    
    return cacheManager.getOrFetch(
      cacheKey,
      async () => {
        try {
          let query = this.client
            .from('lodges')
            .select('*')
            .order('name', { ascending: true });

          if (grandLodgeId) {
            query = query.eq('grand_lodge_id', grandLodgeId);
          }

          const { data, error } = await query;

          if (error) {
            console.error('Error fetching lodges:', error);
            return [];
          }

          return (data || []).map(lodge => ({
            id: lodge.id,
            name: lodge.name,
            number: lodge.number || '',
            grand_lodge_id: lodge.grand_lodge_id,
            location: lodge.location || undefined
          }));
        } catch (error) {
          console.error('Exception fetching lodges:', error);
          return [];
        }
      },
      'LODGE_LIST'
    );
  }

  /**
   * Search lodges with autocomplete support
   */
  async searchLodges(searchTerm: string, grandLodgeId?: string): Promise<Lodge[]> {
    if (!searchTerm || searchTerm.length < 2) return [];

    // For search, we don't cache as results vary by search term
    try {
      let query = this.client
        .from('lodges')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,number.ilike.%${searchTerm}%`)
        .order('name', { ascending: true })
        .limit(20);

      if (grandLodgeId) {
        query = query.eq('grand_lodge_id', grandLodgeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error searching lodges:', error);
        return [];
      }

      return (data || []).map(lodge => ({
        id: lodge.id,
        name: lodge.name,
        number: lodge.number || '',
        grand_lodge_id: lodge.grand_lodge_id,
        location: lodge.location || undefined
      }));
    } catch (error) {
      console.error('Exception searching lodges:', error);
      return [];
    }
  }

  /**
   * Get organization details (cached for 10 minutes)
   */
  async getOrganization(id: string) {
    const cacheKey = CacheKeys.organization(id);
    
    return cacheManager.getOrFetch(
      cacheKey,
      async () => {
        try {
          const { data, error } = await this.client
            .from('organisations')
            .select('*')
            .eq('id', id)
            .single();

          if (error) {
            console.error('Error fetching organization:', error);
            return null;
          }

          return data;
        } catch (error) {
          console.error('Exception fetching organization:', error);
          return null;
        }
      },
      'ORGANIZATION'
    );
  }

  /**
   * Get titles list (from constants, no DB call)
   */
  getTitles() {
    return cacheManager.getOrFetch(
      CacheKeys.TITLES,
      async () => TITLES,
      'STATIC'
    );
  }

  /**
   * Get relationships list (from constants, no DB call)
   */
  getRelationships() {
    return cacheManager.getOrFetch(
      CacheKeys.RELATIONSHIPS,
      async () => RELATIONSHIPS,
      'STATIC'
    );
  }

  /**
   * Get countries list (cached indefinitely)
   */
  async getCountries(): Promise<Country[]> {
    return cacheManager.getOrFetch(
      CacheKeys.COUNTRIES,
      async () => {
        try {
          // In a real implementation, this would come from a database table
          // For now, return a static list of common countries
          return [
            { code: 'AU', name: 'Australia', states: [
              { code: 'NSW', name: 'New South Wales' },
              { code: 'VIC', name: 'Victoria' },
              { code: 'QLD', name: 'Queensland' },
              { code: 'WA', name: 'Western Australia' },
              { code: 'SA', name: 'South Australia' },
              { code: 'TAS', name: 'Tasmania' },
              { code: 'ACT', name: 'Australian Capital Territory' },
              { code: 'NT', name: 'Northern Territory' }
            ]},
            { code: 'NZ', name: 'New Zealand' },
            { code: 'US', name: 'United States' },
            { code: 'GB', name: 'United Kingdom' },
            { code: 'CA', name: 'Canada' }
          ];
        } catch (error) {
          console.error('Exception fetching countries:', error);
          return [];
        }
      },
      'STATIC'
    );
  }

  /**
   * Batch fetch multiple static data types
   */
  async batchFetchStaticData() {
    const [grandLodges, titles, relationships, countries] = await Promise.all([
      this.getGrandLodges(),
      this.getTitles(),
      this.getRelationships(),
      this.getCountries()
    ]);

    return {
      grandLodges,
      titles,
      relationships,
      countries
    };
  }

  /**
   * Prefetch all static data for registration flow
   */
  async prefetchRegistrationData(grandLodgeId?: string) {
    const staticData = await this.batchFetchStaticData();
    
    // Also prefetch lodges for the default grand lodge
    const defaultGrandLodge = staticData.grandLodges.find(gl => gl.isDefault);
    if (defaultGrandLodge) {
      await this.getLodges(grandLodgeId || defaultGrandLodge.id);
    }

    return staticData;
  }

  /**
   * Clear specific cache entries
   */
  clearCache(type?: 'lodges' | 'organizations' | 'all') {
    switch (type) {
      case 'lodges':
        cacheManager.invalidatePattern(/^lodges:/);
        break;
      case 'organizations':
        cacheManager.invalidatePattern(/^org:/);
        break;
      case 'all':
        cacheManager.clearAll();
        break;
      default:
        // Clear semi-static data only
        cacheManager.invalidatePattern(/^lodges:/);
        cacheManager.invalidatePattern(/^org:/);
    }
  }
}

// Export singleton instances
export const staticDataService = new StaticDataService(false);
export const serverStaticDataService = new StaticDataService(true);