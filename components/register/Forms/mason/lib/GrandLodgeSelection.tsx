import React, { useState, useEffect, useCallback, useRef } from 'react';
import AutocompleteInput from '../../shared/AutocompleteInput';
import { Label } from '@/components/ui/label';
import { useLocationStore } from '@/lib/locationStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { AttendeeData } from '../../attendee/types';
import { create } from 'zustand';

interface GrandLodgeSelectionProps {
  value?: string;
  onChange: (value: string, organisationId?: string) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

interface GrandLodgeOption {
  id: string;
  name: string;
  country: string;
  abbreviation: string;
  organisationid?: string;
}

export const GrandLodgeSelection: React.FC<GrandLodgeSelectionProps> = ({
  value,
  onChange,
  required = false,
  disabled = false,
  error,
  className,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedGrandLodge, setSelectedGrandLodge] = useState<GrandLodgeOption | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Use refs to track user interaction and initialization status
  const userIsTypingRef = useRef(false);
  const didAttemptLocationBasedDefaultRef = useRef(false);
  
  const { 
    grandLodges, 
    searchGrandLodges, 
    fetchInitialGrandLodges,
    getUserLocation,
    ipData,
    isLoadingGrandLodges
  } = useLocationStore();

  // Handle grand lodge selection - moved up to avoid reference errors
  const handleSelect = useCallback((grandLodge: GrandLodgeOption | null) => {
    if (!grandLodge) {
      // Handle null case - clear the selection
      setSelectedGrandLodge(null);
      setInputValue('');
      onChange('', undefined);
      return;
    }
    
    // Normal flow when grandLodge is not null
    setSelectedGrandLodge(grandLodge);
    setInputValue(grandLodge.name);
    onChange(grandLodge.id, grandLodge.organisationid);
  }, [onChange]);

  // Get better default placeholder based on user's location from IP
  const getGrandLodgePlaceholder = useCallback(() => {
    const defaultPlaceholder = "Search Grand Lodge by name, country...";
    
    // If we have country data, suggest it in the placeholder
    if (ipData?.country_name) {
      return `Search Grand Lodge in ${ipData.country_name} or globally...`;
    }
    
    return defaultPlaceholder;
  }, [ipData?.country_name]);

  // Initialize with user's location-based grand lodge - improved reliability
  useEffect(() => {
    // Skip if already initialized or initializing
    if (isInitialized || didAttemptLocationBasedDefaultRef.current) return;
    
    const initializeGrandLodge = async () => {
      try {
        // Mark as initializing before starting async work
        didAttemptLocationBasedDefaultRef.current = true;
        console.log('[GrandLodgeSelection] Initializing with user location data');
        
        // Get user's location
        const userLocation = await getUserLocation();
        
        // Check if we got a value during async wait (prevents race conditions)
        if (value) {
          setIsInitialized(true);
          return;
        }
        
        // First search for Australia-focused Grand Lodges if in Australia
        let auResults: GrandLodgeOption[] = [];
        
        // Use broader query to get NSW results like "NSW" or just "United"
        const initialQuery = (userLocation?.country === 'Australia') ? 'united' : userLocation?.country || 'lodge';
        
        // Always fetch initial grand lodges to have something to work with
        if (grandLodges.length === 0 || !isLoadingGrandLodges) {
          // Ensure we have lodges to work with by fetching initial data
          await fetchInitialGrandLodges();
          
          // In Australia? Pre-fetch with a broad query to get local options
          if (userLocation?.country === 'Australia') {
            auResults = await searchGrandLodges(initialQuery, 'Australia');
            console.log(`[GrandLodgeSelection] Pre-loaded ${auResults.length} Australian Grand Lodges`);
          }
        }
        
        // Check again if we got a value during async wait
        if (value) {
          setIsInitialized(true);
          return;
        }
        
        // Set default based on location - but only if no value is already set
        if (userLocation?.country && !value) {
          let defaultGrandLodge: GrandLodgeOption | undefined;
          
          // Try to find a default Grand Lodge with more specific matching for Australia
          if (userLocation.country === 'Australia' && userLocation.region) {
            // For Australia, prioritize state-specific Grand Lodges
            const stateCode = userLocation.region_code || '';
            const stateName = userLocation.region || '';
            
            // First try by region code, then by state name, then any Australian GL
            const stateMatches = grandLodges.filter(
              gl => gl.country === 'Australia' && 
                (gl.name.includes(stateCode) || gl.name.includes(stateName))
            );
            
            if (stateMatches.length > 0) {
              // Prioritize "United Grand Lodge of NSW" for NSW
              if (stateCode === 'NSW') {
                defaultGrandLodge = stateMatches.find(gl => 
                  gl.name.toLowerCase().includes('united') && gl.name.includes('NSW')
                );
              }
              
              // If no specific match found, use the first state match
              if (!defaultGrandLodge) {
                defaultGrandLodge = stateMatches[0];
              }
            }
          }
          
          // If no state-specific match found, fall back to any Grand Lodge in the user's country
          if (!defaultGrandLodge) {
            defaultGrandLodge = grandLodges.find(gl => gl.country === userLocation.country);
          }
          
          if (defaultGrandLodge) {
            console.log(`[GrandLodgeSelection] Setting default based on location: ${defaultGrandLodge.name}`);
            // Do NOT call handleSelect directly to avoid loops
            setSelectedGrandLodge(defaultGrandLodge);
            setInputValue(defaultGrandLodge.name);
            // Call onChange last
            onChange(defaultGrandLodge.id, defaultGrandLodge.organisationid);
            setIsInitialized(true);
          }
        }
      } catch (error) {
        console.error('[GrandLodgeSelection] Failed to initialize grand lodge:', error);
      }
    };

    // Only initialize if not already loading and no value is set yet
    if (!value && !isLoadingGrandLodges) {
      initializeGrandLodge();
    } else if (value) {
      // If value already exists, consider it initialized
      setIsInitialized(true);
    }
  }, [fetchInitialGrandLodges, searchGrandLodges, getUserLocation, grandLodges, value, onChange, isLoadingGrandLodges]);

  // Load selected grand lodge data when value changes or grandLodges are loaded
  useEffect(() => {
    // React Hooks must be called at the top level - not inside conditionals or loops
    // Create the ref outside the effect instead
    
    // Skip if user is actively typing
    if (userIsTypingRef.current) return;
    
    // Track if we're currently processing to avoid recursive updates
    let isProcessing = false;
    
    if (value && grandLodges.length > 0) {
      isProcessing = true;
      
      try {
        // Only update if we don't already have the right selection
        if (!selectedGrandLodge || selectedGrandLodge.id !== value) {
          const grandLodge = grandLodges.find(gl => gl.id === value);
          if (grandLodge) {
            setSelectedGrandLodge(grandLodge);
            setInputValue(grandLodge.name);
            setIsInitialized(true);
          }
        }
      } finally {
        isProcessing = false;
      }
    } else if (!value && selectedGrandLodge !== null) {
      // Clear selection if value is empty/null and user is not typing
      setSelectedGrandLodge(null);
      setInputValue('');
    }
  }, [value, grandLodges, selectedGrandLodge]);

  // Pre-filter options locally for immediate feedback while search happens
  const filterLocalOptions = useCallback((query: string): GrandLodgeOption[] => {
    if (!query || query.length < 2 || grandLodges.length === 0) return [];
    
    const lowercaseQuery = query.toLowerCase();
    const userCountry = ipData?.country_name || 'Australia';
    
    // Special case for NSW - ensure it matches both "NSW" directly and "United Grand Lodge of NSW"
    if (query.toUpperCase() === "NSW") {
      // Find any grand lodge containing NSW in the name or abbreviation
      const nswMatches = grandLodges.filter(gl => {
        return gl.name.includes("NSW") || 
               gl.abbreviation?.includes("NSW") || 
               gl.name.toLowerCase().includes("new south wales");
      });
      
      if (nswMatches.length > 0) {
        console.log(`[GrandLodgeSelection] Special NSW search found ${nswMatches.length} matches`);
        // Prioritize United Grand Lodge of NSW specifically
        return nswMatches.sort((a, b) => {
          const aHasUnited = a.name.toLowerCase().includes("united");
          const bHasUnited = b.name.toLowerCase().includes("united");
          if (aHasUnited && !bHasUnited) return -1;
          if (!aHasUnited && bHasUnited) return 1;
          return a.name.localeCompare(b.name);
        });
      }
    }
    
    // Filter by name and prioritize by country
    const filteredOptions = grandLodges.filter(gl => {
      // Match by name, abbreviation, or country - much more permissive
      const nameMatch = gl.name.toLowerCase().includes(lowercaseQuery);
      const abbrevMatch = gl.abbreviation?.toLowerCase().includes(lowercaseQuery);
      const countryMatch = gl.country?.toLowerCase().includes(lowercaseQuery);
      return nameMatch || abbrevMatch || countryMatch;
    });
    
    // Sort by:
    // 1. Country match with user's country first
    // 2. Name exact match
    // 3. Beginning of name match
    return filteredOptions.sort((a, b) => {
      // First priority: user's country
      const aIsUserCountry = a.country === userCountry;
      const bIsUserCountry = b.country === userCountry;
      if (aIsUserCountry && !bIsUserCountry) return -1;
      if (!aIsUserCountry && bIsUserCountry) return 1;
      
      // Second priority: exact name match
      const aExactMatch = a.name.toLowerCase() === lowercaseQuery;
      const bExactMatch = b.name.toLowerCase() === lowercaseQuery;
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      // Third priority: starts with query
      const aStartsWith = a.name.toLowerCase().startsWith(lowercaseQuery);
      const bStartsWith = b.name.toLowerCase().startsWith(lowercaseQuery);
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      // Final sort by name
      return a.name.localeCompare(b.name);
    });
  }, [grandLodges, ipData?.country_name]);
  
  // Track the latest search term to avoid duplicate API calls
  const lastSearchTermRef = useRef<string>('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle input change with proper debounce for search
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    userIsTypingRef.current = true;
    
    // Clear any pending search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    
    // Start search if there are at least 2 characters
    if (value.length >= 2) {
      // If we have grand lodges locally, do an immediate filter while waiting for the search
      const localResults = filterLocalOptions(value);
      console.log(`[GrandLodgeSelection] Local filter found ${localResults.length} matches for '${value}'`);
      
      // Trigger search immediately for "NSW" due to its importance
      if (value.toUpperCase() === "NSW" || value.includes("United Grand Lodge")) {
        console.log(`[GrandLodgeSelection] Immediate search for important term: '${value}'`);
        searchGrandLodges(value, ipData?.country_name || 'Australia')
          .then(results => {
            console.log(`[GrandLodgeSelection] Immediate search found ${results.length} results`);
            // No need to store lastSearchTermRef since we're doing an immediate search
          });
      } 
      // Debounce other search terms
      else if (value.length >= 2 && value !== lastSearchTermRef.current) {
        lastSearchTermRef.current = value;
        searchTimeoutRef.current = setTimeout(() => {
          searchGrandLodges(value, ipData?.country_name || 'Australia');
        }, 300);
      }
    }
    
    // Reset the user typing flag after a delay
    setTimeout(() => {
      userIsTypingRef.current = false;
    }, 500);
    
    // If clearing the input, clear the selection
    if (value === '') {
      setSelectedGrandLodge(null);
      onChange('', undefined);
    } else if (selectedGrandLodge) {
      // If there's a selected lodge but input doesn't match it,
      // keep the ID in sync
      onChange(selectedGrandLodge.id, selectedGrandLodge.organisationid);
    }
  }, [searchGrandLodges, filterLocalOptions, ipData?.country_name, selectedGrandLodge, onChange]);

  // Search function for autocomplete - with memoization
  const searchFunctionRef = useRef<Record<string, GrandLodgeOption[]>>({});
  
  const searchFunction = useCallback(async (query: string) => {
    if (query.length < 2) return [];
    
    // Check if we've already made this exact query recently
    if (searchFunctionRef.current[query]) {
      console.log(`[GrandLodgeSelection] Using cached search results for '${query}'`);
      return searchFunctionRef.current[query];
    }
    
    try {
      console.log(`[GrandLodgeSelection] Searching for '${query}'`);
      // Use the ipData country if available for better results
      const userCountry = ipData?.country_name || 'Australia';
      
      // Pass the user's country to prioritize local grand lodges
      const results = await searchGrandLodges(query, userCountry);
      console.log(`[GrandLodgeSelection] Search returned ${results.length} results`);
      
      // Cache results for this query
      searchFunctionRef.current[query] = results;
      
      // Clear the cache after 30 seconds to ensure fresh data
      setTimeout(() => {
        delete searchFunctionRef.current[query];
      }, 30000);
      
      return results;
    } catch (error) {
      console.error('[GrandLodgeSelection] Grand lodge search error:', error);
      return [];
    }
  }, [searchGrandLodges, ipData?.country_name]);

  // Render option for dropdown
  const renderOption = (grandLodge: GrandLodgeOption) => (
    <div className="py-1">
      <div className="font-medium">{grandLodge.name}</div>
      <div className="text-xs text-gray-500 flex justify-between">
        <span>{grandLodge.country}</span>
        {grandLodge.abbreviation && <span className="font-medium">{grandLodge.abbreviation}</span>}
      </div>
    </div>
  );

  return (
    <div className={className}>
      <Label htmlFor="grand-lodge">
        Grand Lodge
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <AutocompleteInput<GrandLodgeOption>
        id="grand-lodge"
        name="grand-lodge"
        value={inputValue}
        onChange={handleInputChange}
        onSelect={handleSelect}
        options={grandLodges}
        getOptionLabel={(gl) => gl.name}
        getOptionValue={(gl) => gl.id}
        renderOption={renderOption}
        placeholder={getGrandLodgePlaceholder()}
        searchFunction={searchFunction}
        searchAsYouType={true} // Re-enabling search as you type to ensure results show
        minSearchLength={2}
        debounceMs={300} // Moderate debounce time
        disabled={disabled}
        isLoading={isLoadingGrandLodges}
        className="mt-1"
        // Custom filter function for more permissive matching
        filterOptions={(options, query) => {
          if (!query || query.length < 2) return [];
          
          console.log(`[GrandLodgeSelection] Filtering options for '${query}', options count: ${options.length}`);
          const lowercaseQuery = query.toLowerCase();
          const userCountry = ipData?.country_name || 'Australia';
          
          // Filter and sort results
          const filtered = options
            .filter(gl => {
              // Match name, abbreviation or country - more permissive
              const nameMatch = gl.name.toLowerCase().includes(lowercaseQuery);
              const abbrevMatch = gl.abbreviation?.toLowerCase().includes(lowercaseQuery);
              const countryMatch = gl.country?.toLowerCase().includes(lowercaseQuery);
              return nameMatch || abbrevMatch || countryMatch;
            })
            .sort((a, b) => {
              // Prioritize entries from user's country
              const aIsLocal = a.country === userCountry;
              const bIsLocal = b.country === userCountry;
              if (aIsLocal && !bIsLocal) return -1;
              if (!aIsLocal && bIsLocal) return 1;
              
              // Then prioritize exact matches
              const aExactMatch = a.name.toLowerCase() === lowercaseQuery;
              const bExactMatch = b.name.toLowerCase() === lowercaseQuery;
              if (aExactMatch && !bExactMatch) return -1;
              if (!aExactMatch && bExactMatch) return 1;
              
              // Then prioritize starts with
              const aStartsWith = a.name.toLowerCase().startsWith(lowercaseQuery);
              const bStartsWith = b.name.toLowerCase().startsWith(lowercaseQuery);
              if (aStartsWith && !bStartsWith) return -1;
              if (!aStartsWith && bStartsWith) return 1;
              
              // Default sort by name
              return a.name.localeCompare(b.name);
            });
            
          console.log(`[GrandLodgeSelection] Filtered to ${filtered.length} results for '${query}'`);
          return filtered;
        }}
      />
      
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};