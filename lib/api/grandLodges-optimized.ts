import { staticDataService } from '../services/static-data-service';
import { Database } from '../../shared/types/supabase';

// Explicitly type based on your Database schema definitions
export type GrandLodgeRow = Database['public']['Tables']['grand_lodges']['Row'] & {
  organisationid?: string;
};

// Define filter type
interface GrandLodgeFilter {
  searchTerm?: string;
  countryName?: string; // Add specific country filter
}

/**
 * Fetches grand lodges using the optimized static data service with caching
 * @param filter Optional filter object containing searchTerm or countryName.
 * @returns Promise resolving to array of GrandLodgeRow objects.
 */
export async function getAllGrandLodges(filter?: GrandLodgeFilter): Promise<GrandLodgeRow[]> {
  try {
    // Get all grand lodges from cache (infinite TTL for static data)
    const allGrandLodges = await staticDataService.getGrandLodges();
    
    // Convert to GrandLodgeRow format
    let grandLodges: GrandLodgeRow[] = allGrandLodges.map(gl => ({
      id: gl.id,
      name: gl.name,
      country: gl.country,
      state_region: gl.state || null,
      state_region_code: null,
      abbreviation: null,
      address: null,
      website: null,
      email: null,
      phone: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      organisation_id: null,
      state: gl.state || null
    }));

    // Apply filters in memory (since data is cached)
    if (filter?.countryName && filter.countryName.trim()) {
      console.log(`[getAllGrandLodges] Filtering by country: ${filter.countryName}`);
      grandLodges = grandLodges.filter(gl => 
        gl.country?.toLowerCase() === filter.countryName?.trim().toLowerCase()
      );
    } else if (filter?.searchTerm && filter.searchTerm.trim()) {
      const searchTerm = filter.searchTerm.trim().toLowerCase();
      console.log(`%%%%%% [getAllGrandLodges] API Filtering by searchTerm: "${searchTerm}" %%%%%%`);
      
      grandLodges = grandLodges.filter(gl => {
        return (
          gl.name?.toLowerCase().includes(searchTerm) ||
          gl.abbreviation?.toLowerCase().includes(searchTerm) ||
          gl.country?.toLowerCase().includes(searchTerm) ||
          gl.state_region?.toLowerCase().includes(searchTerm) ||
          gl.state_region_code?.toLowerCase().includes(searchTerm)
        );
      });
    }

    // Already sorted by name in the service
    return grandLodges;
  } catch (err) {
    console.error('[getAllGrandLodges] Unexpected error:', err);
    return [];
  }
}