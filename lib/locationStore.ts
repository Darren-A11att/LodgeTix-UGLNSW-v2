import { create, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAllGrandLodges, GrandLodgeRow } from './api/grandLodges';
import { getLodgesByGrandLodgeId, LodgeRow, createLodge as createLodgeApi, searchAllLodges as searchAllLodgesApi, getLodgesByStateRegionCode } from './api/lodges';
import { supabase } from "./supabase";
import { searchGrandLodges as searchGrandLodgesService } from './services/masonic-services';

// --- Define Interfaces First ---
export interface IpApiData {
  ip: string;
  network?: string;
  version?: string;
  city?: string;
  region?: string;
  region_code?: string;
  country?: string;
  country_code?: string;
  country_code_iso3?: string;
  country_name?: string;
  country_capital?: string;
  country_tld?: string;
  continent_code?: string;
  in_eu?: boolean;
  postal?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  utc_offset?: string;
  country_calling_code?: string;
  currency?: string;
  currency_name?: string;
  languages?: string;
  country_area?: number;
  country_population?: number;
  asn?: string;
  org?: string;
}

export interface GrandLodgeCache {
  data: GrandLodgeRow[];
  timestamp: number;
  byCountry: Record<string, GrandLodgeRow[]>;
  byRegion: Record<string, GrandLodgeRow[]>;
}

export interface LodgeCache {
  byGrandLodge: Record<string, {
    data: LodgeRow[];
    timestamp: number;
  }>;
  byRegion: Record<string, {
    data: LodgeRow[];
    timestamp: number;
  }>;
}

// --- Define Defaults Second ---
const defaultIpData: IpApiData = { 
  ip: '0.0.0.0',
  version: 'IPv4', 
  city: 'Unknown', 
  region: 'Unknown', 
  region_code: '', 
  country: 'AU',
  country_name: 'Australia',
  country_code: 'AU',
  country_code_iso3: 'AUS',
  latitude: -33.86,
  longitude: 151.20,
  network: undefined,
  country_capital: undefined,
  country_tld: undefined,
  continent_code: undefined,
  in_eu: false,
  postal: undefined,
  timezone: undefined,
  utc_offset: undefined,
  country_calling_code: undefined,
  currency: undefined,
  currency_name: undefined,
  languages: undefined,
  country_area: undefined,
  country_population: undefined,
  asn: undefined,
  org: undefined,
};

const defaultGrandLodgeCache: GrandLodgeCache = {
  data: [],
  timestamp: 0,
  byCountry: {},
  byRegion: {},
};

const defaultLodgeCache: LodgeCache = {
  byGrandLodge: {},
  byRegion: {},
};

const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const isCacheExpired = (timestamp: number): boolean => {
  return Date.now() - timestamp > CACHE_EXPIRY_MS;
};

// --- Define State Interface Third ---
export interface LocationState {
  // --- Persisted State ---
  ipData: IpApiData;
  grandLodgeCache: GrandLodgeCache;
  lodgeCache: LodgeCache;
  
  // --- Non-Persisted / Derived State ---
  isLoadingIpData: boolean; // Renamed from isLoading
  ipDataError: string | null; // Renamed from error
  
  grandLodges: GrandLodgeRow[]; // For display/selection
  isLoadingGrandLodges: boolean;
  grandLodgeError: string | null;
  
  lodges: LodgeRow[]; // For display/selection (e.g., after selecting GL)
  isLoadingLodges: boolean;
  lodgeError: string | null;
  
  allLodgeSearchResults: LodgeRow[]; // For global search results
  isLoadingAllLodges: boolean;
  allLodgesError: string | null;

  // --- Actions ---
  fetchIpData: () => Promise<void>;
  fetchInitialGrandLodges: () => Promise<void>;
  searchGrandLodges: (searchTerm: string) => Promise<GrandLodgeRow[]>;
  getLodgesByGrandLodge: (grandLodgeId: string, searchTerm?: string) => Promise<void>; // Changed: updates state, returns void
  searchAllLodgesAction: (term: string) => Promise<void>;
  createLodge: (lodgeData: Omit<LodgeRow, 'lodge_id' | 'created_at' | 'display_name'>) => Promise<LodgeRow | null>; // Keep return for immediate use
  preloadGrandLodgesByCountry: (countryCode: string) => Promise<void>; // Keep preload actions
  preloadGrandLodgesByRegion: (regionCode: string) => Promise<void>;
  preloadLodgesByRegion: (regionCode: string) => Promise<void>;
  clearCaches: () => void;
  getUserLocation: () => IpApiData | Promise<IpApiData>; // Add getUserLocation
}

// --- Define State Creator Type Fourth ---
type LocationStateCreator = StateCreator<LocationState>;

// --- Create Store Last ---
export const useLocationStore = create<LocationState>(
  persist(
    (set, get) => ({
      // Use the well-defined constant for initial state
      ipData: defaultIpData,
      grandLodgeCache: defaultGrandLodgeCache,
      lodgeCache: defaultLodgeCache,
      isLoadingIpData: true,
      ipDataError: null,
      grandLodges: [],
      isLoadingGrandLodges: false,
      grandLodgeError: null,
      lodges: [],
      isLoadingLodges: false,
      lodgeError: null,
      allLodgeSearchResults: [],
      isLoadingAllLodges: false,
      allLodgesError: null,

      // --- Actions Implementation ---
      fetchIpData: async () => {
        set({ isLoadingIpData: true, ipDataError: null });
        let dataToStore: IpApiData = { ...defaultIpData }; // Start with defaults
        try {
          // Call ipapi.co directly from the client
          const apiUrl = 'https://ipapi.co/json/';
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          console.log('[LocationStore] Fetching IP data from ipapi.co (client-side)...');
            
            const response = await fetch(apiUrl, {
              signal: controller.signal,
              headers: { 
                'Accept': 'application/json'
              }
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
            const errorText = await response.text();
            console.warn(`IP API failed (${response.status}): ${errorText}, using default`);
            set({ ipDataError: `IP detection failed (${response.status})` });
            // Keep dataToStore as defaults
            } else {
              const ipResponse = await response.json();
            console.log('[LocationStore] Received IP data:', ipResponse);
            
            // Directly use the response, applying defaults only if necessary
            // Ensure ipResponse fields match IpApiData structure
            dataToStore = { 
              ...defaultIpData, // Start with defaults
              ...ipResponse,   // Spread the API response, overwriting defaults
              // Explicitly handle potential type mismatches or missing required fields if any
              ip: ipResponse.ip || defaultIpData.ip, // Ensure required ip is present
              // Add other required fields if ipResponse might lack them
            };
            console.log('[LocationStore] Mapped IP data:', dataToStore); // DEBUG mapped data
            set({ ipDataError: null });
            }
        } catch (fetchError: any) {
          console.warn('[LocationStore] Error fetching IP data from ipapi.co, using default:', fetchError);
          dataToStore = { ...defaultIpData }; // Reset to defaults on error
          set({ ipDataError: fetchError.name === 'AbortError' ? 'IP detection timed out.' : 'Failed to detect country.' });
        } finally {
          console.log('[LocationStore] Setting final IP data state:', dataToStore);
          set({ ipData: dataToStore, isLoadingIpData: false });
          
          // Trigger preloads using the correct fields from the stored data
          const finalIpData = get().ipData; // Get the data that was just set
          if (finalIpData.country_code) { // Use country_code for the cache key still?
            setTimeout(() => {
              console.log(`[LocationStore] Triggering preloads for country: ${finalIpData.country_name} (Code: ${finalIpData.country_code}), region: ${finalIpData.region_code}`);
              // Pass country_name for filtering GLs
              if (finalIpData.country_name) {
                  get().preloadGrandLodgesByCountry(finalIpData.country_name);
              }
              // Pass region_code for filtering Lodges
              if (finalIpData.region_code) {
                get().preloadGrandLodgesByRegion(finalIpData.region_code); // Keep using code for region GL cache key?
                get().preloadLodgesByRegion(finalIpData.region_code);
              }
            }, 0);
          }
        }
      },

      // Add getUserLocation function
      getUserLocation: async () => {
        const store = get();
        // If we already have IP data and it's not loading, return it synchronously
        if (!store.isLoadingIpData && store.ipData.ip !== '0.0.0.0') {
          return store.ipData;
        }
        
        // Otherwise, fetch the IP data and return it
        await store.fetchIpData();
        return get().ipData;
      },

      fetchInitialGrandLodges: async () => {
        const { grandLodgeCache, ipData } = get();
        const now = Date.now();
        const globalCacheExpired = isCacheExpired(grandLodgeCache.timestamp);

        console.log(`[LocationStore] Fetching initial GLs. Country: ${ipData.country_code}, Region: ${ipData.region_code}, Global Cache Expired: ${globalCacheExpired}`);

        // --- Prioritize Country-Specific Fetch --- 
        if (ipData.country_name) {
          const countryCacheKey = ipData.country_name;
          const countryCacheEntry = grandLodgeCache.byCountry[countryCacheKey];
          
          // Use country cache if it exists and is fresh (using global timestamp as proxy for now)
          if (countryCacheEntry && !globalCacheExpired) {
            console.log(`[LocationStore] Using FRESH country cache for ${countryCacheKey}`);
            set({ grandLodges: countryCacheEntry, isLoadingGrandLodges: false });
            return; 
          }
          
          // Fetch specifically for the country if cache missed or expired
          if (get().isLoadingGrandLodges) return; // Avoid concurrent fetches
          console.log(`[LocationStore] Cache miss/stale for country ${countryCacheKey}. Fetching country-specific GLs...`);
          set({ isLoadingGrandLodges: true, grandLodgeError: null });
          try {
            // Use countryName filter with ipData.country_name
            const countryData = await getAllGrandLodges({ countryName: ipData.country_name });
            set({ grandLodges: countryData, isLoadingGrandLodges: false }); // Update display state
            
            // Update country-specific cache and global cache if necessary
            set(state => {
              const updatedCache = { 
                ...state.grandLodgeCache, 
                timestamp: now, // Update global timestamp
                byCountry: { ...state.grandLodgeCache.byCountry, [countryCacheKey]: countryData }
              };
              // Prime global cache if empty
              if (updatedCache.data.length === 0) {
                updatedCache.data = countryData;
              }
              return { grandLodgeCache: updatedCache };
            });
            return; // Exit after successful country-specific fetch
          } catch (error) {
            console.error(`[LocationStore] Error fetching GLs for country ${countryCacheKey}:`, error);
            set({ grandLodgeError: "Failed to load Grand Lodges.", isLoadingGrandLodges: false });
            // Fall through to potentially use global cache or fetch all as last resort
          }
        }
        
        // --- Fallback to Global Cache or Fetch All --- 
        // Use global cache if it's not empty and not expired
        if (grandLodgeCache.data.length > 0 && !globalCacheExpired) {
          console.log('[LocationStore] Using FRESH global GL cache.');
          set({ grandLodges: grandLodgeCache.data, isLoadingGrandLodges: false });
          return;
        }

        // Fetch all if no country, or country fetch failed, or global cache stale/empty
        if (get().isLoadingGrandLodges) return; // Avoid concurrent fetches
        console.log('[LocationStore] Fetching ALL Grand Lodges (fallback or cache expired).');
        set({ isLoadingGrandLodges: true, grandLodgeError: null });
        try {
          const allData = await getAllGrandLodges({});
          set({ grandLodges: allData, isLoadingGrandLodges: false }); // Update display state
          // Update global cache
          set({ grandLodgeCache: { ...get().grandLodgeCache, data: allData, timestamp: now }});
        } catch (error) {
          console.error(`[LocationStore] Error fetching all grand lodges:`, error);
          set({ grandLodgeError: "Failed to load Grand Lodges.", isLoadingGrandLodges: false });
        }
      },

      preloadGrandLodgesByCountry: async (countryName: string) => {
        const { grandLodgeCache } = get();
        const now = Date.now();
        
        // Check cache first
        if (grandLodgeCache.byCountry[countryName]) {
          // If cache is still fresh, we're done
          if (!isCacheExpired(grandLodgeCache.timestamp)) {
            console.log(`[LocationStore] GLs for country ${countryName} already cached and fresh.`);
            return;
          }
          console.log(`[LocationStore] GLs for country ${countryName} cached but stale. Refreshing...`);
        } else {
          console.log(`[LocationStore] Preloading GLs for country ${countryName}...`);
        }

        try {
          const countryData = await getAllGrandLodges({ countryName });
          
          // Update cache
          set(state => {
            const updatedCache = { 
              ...state.grandLodgeCache,
              timestamp: now, // Refresh global timestamp on any successful fetch 
              byCountry: { ...state.grandLodgeCache.byCountry, [countryName]: countryData },
            };
            // If global data is empty, use this as initial load
            if (updatedCache.data.length === 0) {
              updatedCache.data = countryData;
            }
            return { grandLodgeCache: updatedCache };
          });
          console.log(`[LocationStore] Preloaded ${countryData.length} GLs for country ${countryName}`);
        } catch (error) {
          console.error(`[LocationStore] Failed to preload GLs for country ${countryName}:`, error);
        }
      },

      preloadGrandLodgesByRegion: async (regionCode: string) => {
        const { grandLodgeCache } = get();
        const now = Date.now();
        
        // Check region-specific cache first
        if (grandLodgeCache.byRegion[regionCode]) {
          // If cache is still fresh, we're done (use global timestamp as proxy for now)
          if (!isCacheExpired(grandLodgeCache.timestamp)) {
            console.log(`[LocationStore] GLs for region ${regionCode} already cached and fresh.`);
            return;
          }
          console.log(`[LocationStore] GLs for region ${regionCode} cached but stale. Refreshing...`);
        } else {
          console.log(`[LocationStore] Preloading GLs for region ${regionCode}...`);
        }

        try {
          // Fetch GLs by region
          const regionData = await getAllGrandLodges({ regionCode });
          
          // Update cache
          set(state => {
            const updatedCache = { 
              ...state.grandLodgeCache,
              timestamp: now, // Refresh timestamp
              byRegion: { ...state.grandLodgeCache.byRegion, [regionCode]: regionData },
            };
            return { grandLodgeCache: updatedCache };
          });
          console.log(`[LocationStore] Preloaded ${regionData.length} GLs for region ${regionCode}`);
        } catch (error) {
          console.error(`[LocationStore] Failed to preload GLs for region ${regionCode}:`, error);
        }
      },

      preloadLodgesByRegion: async (regionCode: string) => {
        const { lodgeCache } = get();
        const now = Date.now();
        
        // Check region-specific cache
        if (lodgeCache.byRegion[regionCode]?.data) {
          const regionCacheEntry = lodgeCache.byRegion[regionCode];
          if (!isCacheExpired(regionCacheEntry.timestamp)) {
            console.log(`[LocationStore] Lodges for region ${regionCode} already cached and fresh (byRegion).`);
            return;
          }
          console.log(`[LocationStore] Lodges for region ${regionCode} cached but stale (byRegion). Refreshing...`);
        } else {
          console.log(`[LocationStore] Preloading Lodges for region ${regionCode}...`);
        }

        try {
          const regionLodges = await getLodgesByStateRegionCode(regionCode);
          
          // Update cache
          set(state => {
            const updatedCache = { 
              ...state.lodgeCache,
              byRegion: { 
                ...state.lodgeCache.byRegion, 
                [regionCode]: { data: regionLodges, timestamp: now } 
              },
            };
            return { lodgeCache: updatedCache };
          });
          console.log(`[LocationStore] Preloaded ${regionLodges.length} Lodges for region ${regionCode}`);
        } catch (error) {
          console.error(`[LocationStore] Failed to preload Lodges for region ${regionCode}:`, error);
        }
      },

      searchGrandLodges: async (searchTerm: string) => {
        if (!searchTerm || searchTerm.length < 2) return [];
        
        console.log(`[LocationStore] Searching Grand Lodges for: "${searchTerm}"...`);
        set({ isLoadingGrandLodges: true, grandLodgeError: null });
        
        try {
          const searchResults = await searchGrandLodgesService(searchTerm);
          console.log(`[LocationStore] Found ${searchResults.length} Grand Lodges matching "${searchTerm}"`);
          set({ grandLodges: searchResults, isLoadingGrandLodges: false });
          return searchResults;
        } catch (error) {
          console.error(`[LocationStore] Grand Lodge search error for "${searchTerm}":`, error);
          set({ 
            grandLodgeError: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 
            isLoadingGrandLodges: false 
          });
          return [];
        }
      },

      getLodgesByGrandLodge: async (grandLodgeId: string, searchTerm?: string) => {
        const cacheKey = grandLodgeId;
        const { lodgeCache } = get();
        const cacheEntry = lodgeCache.byGrandLodge[cacheKey];
        
        // Handle search terms differently - always fetch if search term provided
        if (!searchTerm && cacheEntry?.data) {
          if (!isCacheExpired(cacheEntry.timestamp)) {
            console.log(`[LocationStore] Using cached Lodges for GL ID: ${grandLodgeId}`);
            set({ lodges: cacheEntry.data, isLoadingLodges: false });
            return;
          }
          // Cache exists but expired, refresh
          console.log(`[LocationStore] Lodge cache expired for GL ID: ${grandLodgeId}, refreshing...`);
        } else if (searchTerm) {
          console.log(`[LocationStore] Searching Lodges for GL ID: ${grandLodgeId} with term: "${searchTerm}"`); 
        } else {
          console.log(`[LocationStore] Fetching all Lodges for GL ID: ${grandLodgeId}`);
        }
        
        // Fetch from backend
        set({ isLoadingLodges: true, lodgeError: null });
        try {
          const lodges = await getLodgesByGrandLodgeId(grandLodgeId, searchTerm);
          set({ lodges, isLoadingLodges: false });
          
          // Only cache if this was a full fetch, not a search
          if (!searchTerm) {
            set(state => ({
              lodgeCache: {
                ...state.lodgeCache,
                byGrandLodge: {
                  ...state.lodgeCache.byGrandLodge,
                  [cacheKey]: { data: lodges, timestamp: Date.now() }
                }
              }
            }));
          }
        } catch (error) {
          console.error(`[LocationStore] Failed to fetch Lodges for GL ID: ${grandLodgeId}:`, error);
          set({ 
            lodgeError: `Failed to load Lodges${searchTerm ? ' for search: ' + searchTerm : ''}`,
            isLoadingLodges: false,
          });
        }
      },

      searchAllLodgesAction: async (searchTerm: string, grandLodgeId?: string) => {
        if (!searchTerm || searchTerm.length < 2) {
          set({ allLodgeSearchResults: [], allLodgesError: null });
          return;
        }
        
        console.log(`[LocationStore] Searching ALL Lodges for: "${searchTerm}"${grandLodgeId ? ` in Grand Lodge ${grandLodgeId}` : ''}...`);
        set({ isLoadingAllLodges: true, allLodgesError: null });
        
        try {
          let results = [];
          
          // Handle searches differently depending on whether we have a grandLodgeId
          if (grandLodgeId) {
            // For Grand Lodge specific searches, use direct Supabase queries for better performance
            // and to avoid syntax errors with the .or() method
            const { supabase } = await import('./supabase');
            
            // Create separate queries for text and numeric searches
            const queries = [];
            
            // Text search query
            const textQuery = supabase
              .from("lodges")
              .select("*")
              .eq("grand_lodge_id", grandLodgeId)
              .or(`name.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%,district.ilike.%${searchTerm}%,meeting_place.ilike.%${searchTerm}%`)
              .order("display_name", { ascending: true })
              .limit(20);
            
            queries.push(textQuery);
            
            // Add number search query if term is numeric
            const isNumeric = /^\d+$/.test(searchTerm);
            if (isNumeric) {
              const numberQuery = supabase
                .from("lodges")
                .select("*")
                .eq("grand_lodge_id", grandLodgeId)
                .eq("number", parseInt(searchTerm, 10))
                .limit(5);
              
              queries.push(numberQuery);
            }
            
            // Execute all queries in parallel
            const queryResults = await Promise.all(queries);
            
            // Check for errors
            const hasErrors = queryResults.some(result => result.error);
            if (hasErrors) {
              const errorResults = queryResults.filter(result => result.error);
              console.error('[LocationStore] Error in lodge queries:', errorResults.map(r => r.error));
              
              // Fall back to RPC method if direct queries fail
              const { data, error } = await supabase.rpc('search_all_lodges', {
                search_term: searchTerm.trim(),
                result_limit: 20
              });
              
              if (!error && data) {
                results = data.filter(lodge => lodge.grand_lodge_id === grandLodgeId);
              } else {
                // Last resort fallback to API method with grandLodgeId filtering built in
                results = await searchAllLodgesApi(searchTerm, 20, grandLodgeId);
              }
            } else {
              // Combine all successful results and filter duplicates
              results = queryResults.flatMap(result => result.data || [])
                .filter((lodge, index, self) => index === self.findIndex(l => l.lodge_id === lodge.lodge_id));
            }
          } else {
            // For global searches without a specific Grand Lodge, use the RPC method
            // which is optimized for searching across all lodges
            const { data, error } = await supabase.rpc('search_all_lodges', {
              search_term: searchTerm.trim(),
              result_limit: 20
            });
            
            if (!error && data) {
              results = data;
            } else {
              // Fallback to API method if RPC fails
              results = await searchAllLodgesApi(searchTerm, 20, grandLodgeId);
            }
          }
          
          console.log(`[LocationStore] Found ${results.length} Lodges matching "${searchTerm}"${grandLodgeId ? ` in Grand Lodge ${grandLodgeId}` : ''}`);
          set({ allLodgeSearchResults: results, isLoadingAllLodges: false });
        } catch (error) {
          console.error(`[LocationStore] All lodges search error for "${searchTerm}":`, error);
          set({ 
            allLodgesError: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 
            isLoadingAllLodges: false 
          });
        }
      },

      createLodge: async (lodgeData) => {
        console.log(`[LocationStore] Creating new lodge: ${lodgeData.name}`);
        try {
          const newLodge = await createLodgeApi(lodgeData);
          console.log(`[LocationStore] Successfully created lodge: ${newLodge.lodge_id}`);
          
          // Update currentLodges if we're in the GL context of the new lodge
          const currentGlLodges = get().lodges;
          if (newLodge.grand_lodge_id && get().lodges.some(l => l.grand_lodge_id === newLodge.grand_lodge_id)) {
            console.log(`[LocationStore] Adding new lodge to current GL lodge list`);
            set({ lodges: [...currentGlLodges, newLodge] });
            
            // Also update cache
            const cacheKey = newLodge.grand_lodge_id;
            const cacheEntry = get().lodgeCache.byGrandLodge[cacheKey];
            if (cacheEntry?.data) {
              set(state => ({
                lodgeCache: {
                  ...state.lodgeCache,
                  byGrandLodge: {
                    ...state.lodgeCache.byGrandLodge,
                    [cacheKey]: { 
                      data: [...cacheEntry.data, newLodge], 
                      timestamp: Date.now() 
                    }
                  }
                }
              }));
            }
          }
          
          // Add to region cache if applicable
          if (newLodge.region_code) {
            const regionCacheEntry = get().lodgeCache.byRegion[newLodge.region_code];
            if (regionCacheEntry?.data) {
              set(state => ({
                lodgeCache: {
                  ...state.lodgeCache,
                  byRegion: {
                    ...state.lodgeCache.byRegion,
                    [newLodge.region_code!]: { 
                      data: [...regionCacheEntry.data, newLodge], 
                      timestamp: Date.now() 
                    }
                  }
                }
              }));
            }
          }
          
          return newLodge;
        } catch (error) {
          console.error(`[LocationStore] Failed to create lodge:`, error);
          return null;
        }
      },

      clearCaches: () => {
        console.log('[LocationStore] Clearing all caches');
        set({
          grandLodgeCache: defaultGrandLodgeCache,
          lodgeCache: defaultLodgeCache
        });
      }
    }),
    {
      name: 'lodgetix-location-storage',
      partialize: (state) => ({
        ipData: state.ipData,
        grandLodgeCache: state.grandLodgeCache,
        lodgeCache: state.lodgeCache
      })
    }
  ) as LocationStateCreator
);