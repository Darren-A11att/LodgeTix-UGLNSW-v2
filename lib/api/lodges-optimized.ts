import { staticDataService } from '../services/static-data-service';
import { Database } from '../../shared/types/supabase';

// Explicitly type based on your Database schema definitions
export type LodgeRow = Database['public']['Tables']['lodges']['Row'] & {
  organisationid?: string;
};
export type LodgeInsert = Database['public']['Tables']['lodges']['Insert'];
export type LodgeUpdate = Database['public']['Tables']['lodges']['Update'];

/**
 * Fetches lodges filtered by Grand Lodge ID using optimized caching
 * @param grandLodgeId The UUID of the Grand Lodge.
 * @param searchTerm Optional string for searching.
 * @returns Promise resolving to array of LodgeRow objects.
 */
export async function getLodgesByGrandLodgeId(
  grandLodgeId: string,
  searchTerm?: string
): Promise<LodgeRow[]> {
  if (!grandLodgeId) {
    console.warn('getLodgesByGrandLodgeId called with no grandLodgeId.');
    return [];
  }

  try {
    // If searching, use the search method
    if (searchTerm && searchTerm.trim()) {
      return searchAllLodges(searchTerm, 50, grandLodgeId);
    }

    // Get all lodges for the grand lodge from cache (5 min TTL)
    const lodges = await staticDataService.getLodges(grandLodgeId);
    
    // Convert to LodgeRow format
    return lodges.map(lodge => ({
      id: lodge.id,
      lodge_id: lodge.id, // Compatibility
      name: lodge.name,
      number: lodge.number || null,
      grand_lodge_id: lodge.grand_lodge_id,
      location: lodge.location || null,
      display_name: lodge.name + (lodge.number ? ` No. ${lodge.number}` : ''),
      district: null,
      meeting_place: lodge.location || null,
      state_region: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      organisation_id: null,
    }));
  } catch (err) {
    console.error('Unexpected error fetching lodges:', err);
    return [];
  }
}

/**
 * Creates a new lodge in the database.
 * @param lodgeData The data for the new lodge.
 * @returns Promise resolving to the created LodgeRow object or null.
 */
export async function createLodge(lodgeData: LodgeInsert): Promise<LodgeRow | null> {
  if (!lodgeData.grand_lodge_id) {
    console.error('createLodge called without a grand_lodge_id.');
    return null;
  }

  const displayName = lodgeData.name + (lodgeData.number ? ` No. ${lodgeData.number}` : '');
  const insertData = { ...lodgeData, display_name: displayName }; 

  try {
    // Use the static data service's client
    const { createClient } = await import('@/lib/supabase-browser');
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('lodges')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating lodge:', error);
      return null;
    }
    
    // Clear lodge cache for this grand lodge
    staticDataService.clearCache('lodges');
    
    return data as LodgeRow;
  } catch (err) {
    console.error('Unexpected error creating lodge:', err);
    return null;
  }
}

/**
 * Searches all lodges using the optimized search method
 * @param searchTerm The string to search for.
 * @param limit Optional limit for the number of results. Default 10.
 * @param grandLodgeId Optional Grand Lodge ID to filter results.
 * @returns Promise resolving to array of LodgeRow objects.
 */
export async function searchAllLodges(
  searchTerm: string, 
  limit: number = 10,
  grandLodgeId?: string
): Promise<LodgeRow[]> {
  if (!searchTerm || !searchTerm.trim()) {
    return [];
  }
  
  const trimmedTerm = searchTerm.trim();
  console.log(`[searchAllLodges] Searching for: "${trimmedTerm}"${grandLodgeId ? ` in GL: ${grandLodgeId}` : ''}`);

  try {
    // Use the optimized search method
    const lodges = await staticDataService.searchLodges(trimmedTerm, grandLodgeId);
    
    // Convert to LodgeRow format and limit results
    const results = lodges
      .slice(0, limit)
      .map(lodge => ({
        id: lodge.id,
        lodge_id: lodge.id, // Compatibility
        name: lodge.name,
        number: lodge.number || null,
        grand_lodge_id: lodge.grand_lodge_id,
        location: lodge.location || null,
        display_name: lodge.name + (lodge.number ? ` No. ${lodge.number}` : ''),
        district: null,
        meeting_place: lodge.location || null,
        state_region: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        organisation_id: null,
      }));
    
    console.log(`[searchAllLodges] Search returned ${results.length} results`);
    return results;
  } catch (err) {
    console.error('[searchAllLodges] Unexpected error during global lodge search:', err);
    return [];
  }
}

/**
 * Fetches lodges filtered by state/region code.
 * @param regionCode The state/region code (e.g., 'NSW').
 * @returns Promise resolving to array of LodgeRow objects.
 */
export async function getLodgesByStateRegionCode(regionCode: string): Promise<LodgeRow[]> {
  if (!regionCode) return [];
  console.log(`[API] Fetching lodges for region code: ${regionCode}`);
  
  try {
    // Get all lodges from cache
    const allLodges = await staticDataService.getLodges();
    
    // Filter by state region in memory
    const filteredLodges = allLodges.filter(lodge => {
      // Check if the lodge's location contains the region code
      return lodge.location?.includes(regionCode);
    });
    
    console.log(`[API] Found ${filteredLodges.length} lodges for region code ${regionCode}`);
    
    // Convert to LodgeRow format
    return filteredLodges.map(lodge => ({
      id: lodge.id,
      lodge_id: lodge.id, // Compatibility
      name: lodge.name,
      number: lodge.number || null,
      grand_lodge_id: lodge.grand_lodge_id,
      location: lodge.location || null,
      display_name: lodge.name + (lodge.number ? ` No. ${lodge.number}` : ''),
      district: null,
      meeting_place: lodge.location || null,
      state_region: regionCode,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      organisation_id: null,
    }));
  } catch (err) {
    console.error(`[getLodgesByStateRegionCode] Unexpected error for region code ${regionCode}:`, err);
    return [];
  }
}