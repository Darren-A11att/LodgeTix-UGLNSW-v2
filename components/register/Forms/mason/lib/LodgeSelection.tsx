import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { handleUseSameLodgeChange } from '../../attendee/utils/businessLogic';
import AutocompleteInput from '../../shared/AutocompleteInput';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useLocationStore } from '@/lib/locationStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, Plus } from 'lucide-react';
import { AttendeeData } from '../../attendee/types';

interface LodgeSelectionProps {
  grand_lodge_id?: string;
  value?: string;
  onChange: (value: string, lodgeNameNumber?: string, organisationId?: string) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  // For "use same lodge" functionality
  showUseSameLodge?: boolean;
  primaryMason?: AttendeeData;
}

interface LodgeOption {
  lodge_id: string;
  name: string;
  number: number | null;
  district: string | null;
  meeting_place: string | null;
  display_name: string | null;
  grand_lodge_id: string | null;
  region_code?: string;
  area_type?: string | null;
  created_at?: string;
  organisation_id?: string;
}

export const LodgeSelection: React.FC<LodgeSelectionProps> = ({
  grand_lodge_id,
  value,
  onChange,
  required = false,
  disabled = false,
  error,
  className,
  showUseSameLodge = false,
  primaryMason,
}) => {
  // Get primary Mason for "use same lodge" functionality
  const primaryAttendee = useRegistrationStore(state => 
    state.attendees.find(att => att.isPrimary && att.attendeeType === 'mason')
  );
  const [inputValue, setInputValue] = useState('');
  const [selectedLodge, setSelectedLodge] = useState<LodgeOption | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newLodgeName, setNewLodgeName] = useState('');
  const [newLodgeNumber, setNewLodgeNumber] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [useSameLodge, setUseSameLodge] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Use refs to track user interaction and initialization status
  const userIsTypingRef = useRef(false);
  const lodgeNameRef = useRef<string | null>(null);
  const initialLoadDoneRef = useRef(false);
  
  const { 
    lodges, 
    getLodgesByGrandLodge,
    createLodge,
    lodgeCache,
    isLoadingLodges,
    ipData,
    allLodgeSearchResults,
    searchAllLodgesAction,
    isLoadingAllLodges
  } = useLocationStore();
  
  // We don't need to directly import supabase in this component anymore
  // The store's searchAllLodgesAction will handle the data fetching for us
  
  // Store reference to methods that aren't directly exposed in the store API
  const storeRef = useRef({
    getLodgesByGrandLodge: useLocationStore.getState().getLodgesByGrandLodge,
    // Don't use any dynamic imports inside methods to avoid chunk loading errors
    searchLodgesByGrandLodge: async (term: string, grand_lodge_id: string) => {
      try {
        if (!term || term.length < 2 || !grand_lodge_id) {
          return [];
        }
        
        // Don't search if the term looks like a UUID
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidPattern.test(term)) {
          return [];
        }
        
        // First check existing lodges in state for matches
        const matchingLodges = lodges.filter(lodge => {
          if (lodge.grand_lodge_id !== grand_lodge_id) return false;
          
          const displayName = (lodge.display_name || '').toLowerCase();
          const name = (lodge.name || '').toLowerCase();
          const district = (lodge.district || '').toLowerCase();
          const meetingPlace = (lodge.meeting_place || '').toLowerCase();
          const searchTerm = term.toLowerCase();
          
          // Check for numeric match
          const isNumeric = /^\d+$/.test(term);
          if (isNumeric && lodge.number === parseInt(term, 10)) {
            return true;
          }
          
          // Check for text matches
          return displayName.includes(searchTerm) || 
                name.includes(searchTerm) || 
                district.includes(searchTerm) || 
                meetingPlace.includes(searchTerm);
        });
        
        if (matchingLodges.length > 0) {
          return matchingLodges;
        }
        
        // Check the cached lodges
        const cachedLodges = lodgeCache?.byGrandLodge?.[grand_lodge_id]?.data || [];
        
        if (cachedLodges.length > 0) {
          // Filter cached lodges by search term
          const filteredLodges = cachedLodges.filter(lodge => {
            const displayName = (lodge.display_name || '').toLowerCase();
            const name = (lodge.name || '').toLowerCase();
            const district = (lodge.district || '').toLowerCase();
            const meetingPlace = (lodge.meeting_place || '').toLowerCase();
            const searchTerm = term.toLowerCase();
            
            // Check for numeric match
            const isNumeric = /^\d+$/.test(term);
            if (isNumeric && lodge.number === parseInt(term, 10)) {
              return true;
            }
            
            // Check for text matches
            return displayName.includes(searchTerm) || 
                  name.includes(searchTerm) || 
                  district.includes(searchTerm) || 
                  meetingPlace.includes(searchTerm);
          });
          
          if (filteredLodges.length > 0) {
            return filteredLodges;
          }
        }
        
        // If not in state or cache, search using the store
        // Import supabase client
        const { supabase } = await import('@/lib/supabase');
        
        // Search for lodges directly
        const { data, error } = await supabase
          .from('lodges')
          .select('*')
          .eq('grand_lodge_id', grand_lodge_id)
          .or(`name.ilike.%${term}%,display_name.ilike.%${term}%,district.ilike.%${term}%,meeting_place.ilike.%${term}%`)
          .order('display_name', { ascending: true })
          .limit(20);
        
        if (error) {
          console.error('[LodgeSelection] Error searching lodges:', error);
          return [];
        }
        
        return data || [];
      } catch (error) {
        // Error searching lodges
        return [];
      }
    }
  });

  // Update cache reference when lodgeCache changes
  const cacheRef = useRef(lodgeCache);
  useEffect(() => {
    cacheRef.current = lodgeCache;
  }, [lodgeCache]);
  
  // Cleanup timeouts when component unmounts
  useEffect(() => {
    return () => {
      // Clear all timeouts
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
      
      if (inputChangeTimeoutRef.current) {
        clearTimeout(inputChangeTimeoutRef.current);
        inputChangeTimeoutRef.current = null;
      }
    };
  }, []);

  // Create loading flag ref outside the effect
  const loadingLodgesRef = useRef(false);
  // Track previous grand_lodge_id to detect actual changes
  const prevGrandLodgeIdRef = useRef<string | undefined>(grand_lodge_id);
  
  // Helper function to check if we have cached lodges
  const hasCachedLodges = () => {
    if (!grand_lodge_id) return false;
    const cache = cacheRef.current?.byGrandLodge?.[grand_lodge_id];
    return cache?.data?.length > 0;
  };
  
  // Simplified effect to load lodges when grand lodge changes
  useEffect(() => {
    if (!grand_lodge_id) return;
    
    // Only fetch if we don't have lodges cached already
    if (!hasCachedLodges() && !loadingLodgesRef.current) {
      loadingLodgesRef.current = true;
      
      // Use getLodgesByGrandLodge from the store
      getLodgesByGrandLodge(grand_lodge_id)
        .then(() => {
          loadingLodgesRef.current = false;
        })
        .catch(() => {
          // Error loading lodges
          loadingLodgesRef.current = false;
        });
    }
    
    // Clean up on unmount
    return () => {
      loadingLodgesRef.current = false;
    };
  }, [grand_lodge_id, getLodgesByGrandLodge]);
  
  // Reset lodge selection when grand_lodge_id changes
  // But only if the lodgeId is not already set in the store
  useEffect(() => {
    // Only reset if grand_lodge_id actually changed
    if (prevGrandLodgeIdRef.current !== grand_lodge_id) {
      // Clear search cache when grand lodge changes
      searchCacheRef.current = {};
      lastSearchQueryRef.current = '';
      
      prevGrandLodgeIdRef.current = grand_lodge_id;
      
      // Don't reset if we already have a valid lodgeId for this grandLodge
      if (value && grand_lodge_id) {
        // Try to load the lodge data
        return;
      }
      
      // Otherwise clear selection for a new grandLodge
      setSelectedLodge(null);
      setInputValue('');
      onChange('', '', '');
    }
  }, [grand_lodge_id]); // Only depend on grand_lodge_id changes

  // Handle input change with tracking for user interaction
  const inputChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    userIsTypingRef.current = true;
    
    // Clear any existing timeout to prevent multiple searches
    if (inputChangeTimeoutRef.current) {
      clearTimeout(inputChangeTimeoutRef.current);
      inputChangeTimeoutRef.current = null;
    }
    
    // We'll let the AutocompleteInput component handle the search via searchFunction
    // Don't trigger the searches here to avoid duplicate searches
    // The searchFunction will handle all searching with proper debouncing
    
    // Reset the user typing flag after a delay
    inputChangeTimeoutRef.current = setTimeout(() => {
      userIsTypingRef.current = false;
      inputChangeTimeoutRef.current = null;
    }, 500);
    
    // If clearing the input, clear the selection
    if (value === '') {
      setSelectedLodge(null);
      lodgeNameRef.current = null;
      onChange('', '', '');
    } else if (selectedLodge) {
      // If there's a selected lodge but input doesn't match it,
      // preserve the ID but update the display value
      onChange(selectedLodge.lodge_id, value, selectedLodge.organisation_id);
    } else {
      // For a partial input with no selection, don't set ID yet
      // but update display value so it persists
      onChange('', value, '');
    }
  }, [onChange, selectedLodge]);

  // Load selected lodge data with improved reliability
  useEffect(() => {
    // React Hooks must be called at the top level - not inside conditionals or loops
    // Use a local variable instead for tracking processing state
    
    // Skip if user is actively typing
    if (userIsTypingRef.current) return;
    
    if (value && !selectedLodge) {
            
      // Check if the value we're loading matches the primaryMason
      if (primaryMason?.lodgeId === value) {
        // If we have an active "use same lodge" setting, let that effect handle it
        if (useSameLodge) {
          return;
        }
      }
      
      // First try to find it in the current lodges list
      const foundInCurrentList = lodges.find(l => l.lodge_id === value);
      if (foundInCurrentList) {
        setSelectedLodge(foundInCurrentList);
        const displayName = foundInCurrentList.display_name || `${foundInCurrentList.name} No. ${foundInCurrentList.number || 'N/A'}`;
        setInputValue(displayName);
        lodgeNameRef.current = displayName;
        setIsInitialized(true);
        return;
      }
      
      // Next, try to find it in search results
      const foundInSearch = allLodgeSearchResults.find(l => l.lodge_id === value);
      if (foundInSearch) {
        setSelectedLodge(foundInSearch);
        const displayName = foundInSearch.display_name || `${foundInSearch.name} No. ${foundInSearch.number || 'N/A'}`;
        setInputValue(displayName);
        lodgeNameRef.current = displayName;
        setIsInitialized(true);
        return;
      }
      
      // If we have a lodgeNameNumber from primary mason, use it
      if (primaryMason?.lodgeNameNumber && primaryMason.lodgeId === value) {
        setInputValue(primaryMason.lodgeNameNumber);
        lodgeNameRef.current = primaryMason.lodgeNameNumber;
        initialLoadDoneRef.current = true;
        setIsInitialized(true);
        return;
      }
      
      // If all else fails, try to fetch it directly - but only once
      if (!isLoadingAllLodges && !initialLoadDoneRef.current) {
        initialLoadDoneRef.current = true;
        
        // Fetch the lodge by ID directly instead of searching for it
        const fetchLodgeById = async () => {
          try {
            const { supabase } = await import('@/lib/supabase');
            const { data, error } = await supabase
              .from('lodges')
              .select('*')
              .eq('lodge_id', value)
              .single();
            
            if (!error && data) {
              const lodgeData = data as LodgeOption;
              setSelectedLodge(lodgeData);
              setInputValue(lodgeData.display_name || `${lodgeData.name} No. ${lodgeData.number || 'N/A'}`);
              lodgeNameRef.current = lodgeData.display_name || `${lodgeData.name} No. ${lodgeData.number || 'N/A'}`;
              setIsInitialized(true);
            } else {
              // Lodge not found, clear the invalid value
              setInputValue('');
              lodgeNameRef.current = null;
              onChange('', '', '');
            }
          } catch (error) {
            console.error('[LodgeSelection] Error fetching lodge by ID:', error);
            setInputValue('');
            lodgeNameRef.current = null;
          }
        };
        
        fetchLodgeById();
      }
    } else if (!value && selectedLodge) {
      // Clear selection if value is empty/null but we have a selectedLodge
      setSelectedLodge(null);
      setInputValue('');
      lodgeNameRef.current = null;
    }
  }, [value, lodges, selectedLodge, allLodgeSearchResults, isLoadingAllLodges, searchAllLodgesAction, primaryMason?.lodgeId, primaryMason?.lodgeNameNumber, useSameLodge]);

  // Create this ref at the top level, outside any hooks or conditions
  const isHandlingSameLodgeChange = useRef(false);
  
  // Handle use same lodge checkbox
  useEffect(() => {
    // Don't call hooks inside conditions
    if (isHandlingSameLodgeChange.current) return;
    
    if (useSameLodge && primaryMason?.lodgeId && primaryMason?.lodgeNameNumber) {
      isHandlingSameLodgeChange.current = true;
      // Update references first
      lodgeNameRef.current = primaryMason.lodgeNameNumber;
      setInputValue(primaryMason.lodgeNameNumber);
      
      // Try to find the lodge in current list for info display
      const primaryLodge = lodges.find(l => l.lodge_id === primaryMason.lodgeId);
      setSelectedLodge(primaryLodge || null);
      
      // Call onChange last to avoid triggering other effects
      if (value !== primaryMason.lodgeId) {
        onChange(primaryMason.lodgeId, primaryMason.lodgeNameNumber, primaryMason.lodgeOrganisationId);
      }
      
      // Reset the flag after a short delay
      setTimeout(() => {
        isHandlingSameLodgeChange.current = false;
      }, 0);
    } else if (!useSameLodge && !value) {
      // When unchecking "use same lodge", clear the selection if no value was set previously
      isHandlingSameLodgeChange.current = true;
      setSelectedLodge(null);
      setInputValue('');
      lodgeNameRef.current = null;
      
      onChange('', '', '');
      
      // Reset the flag after a short delay
      setTimeout(() => {
        isHandlingSameLodgeChange.current = false;
      }, 0);
    }
  }, [useSameLodge, primaryMason?.lodgeId, primaryMason?.lodgeNameNumber, value, lodges, onChange]);

  // Handle lodge selection
  const handleSelect = useCallback((lodge: LodgeOption | null) => {
    if (!lodge) {
      // Handle null case - clear the selection
      setSelectedLodge(null);
      setInputValue('');
      lodgeNameRef.current = null;
      onChange('', '', '');
      return;
    }
    
    // Normal flow when lodge is not null
    setSelectedLodge(lodge);
    const displayValue = lodge.display_name || `${lodge.name} No. ${lodge.number || 'N/A'}`;
    setInputValue(displayValue);
    lodgeNameRef.current = displayValue;
    onChange(lodge.lodge_id, displayValue, lodge.organisation_id);
    
  }, [onChange]);

  // Search function for autocomplete
  const lastSearchQueryRef = useRef('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchCacheRef = useRef<Record<string, LodgeOption[]>>({});
  const searchInProgressRef = useRef<Record<string, boolean>>({});
  
  const searchFunction = useCallback(async (query: string) => {
    if (!grand_lodge_id || query.length < 2) return [];
    
    console.log(`[LodgeSelection] searchFunction called with query: "${query}", grand_lodge_id: ${grand_lodge_id}`);
    
    // Don't search if the query looks like a UUID (to prevent searching for lodge IDs)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(query)) {
      console.log('[LodgeSelection] Query is UUID, skipping search');
      return [];
    }
    
    // Create a cache key based on the query and Grand Lodge ID
    const cacheKey = `${grand_lodge_id}:${query}`;
    
    // Check if we have this query cached
    if (searchCacheRef.current[cacheKey]) {
      console.log(`[LodgeSelection] Returning cached results for key: ${cacheKey}`);
      return searchCacheRef.current[cacheKey];
    }
    
    // Check if a search is already in progress for this query
    if (searchInProgressRef.current[cacheKey]) {
      console.log(`[LodgeSelection] Search already in progress for key: ${cacheKey}, skipping`);
      return [];
    }
    
    // Skip if this is the same query we just searched for
    if (lastSearchQueryRef.current === query) {
      console.log(`[LodgeSelection] Same query as last search, checking local lodges`);
      // Just use current state without triggering new searches
      const currentResults = lodges.filter(l => 
        l.grand_lodge_id === grand_lodge_id && filterLodgeByTerm(l, query)
      );
      
      if (currentResults.length > 0) {
        console.log(`[LodgeSelection] Found ${currentResults.length} results in local state`);
        searchCacheRef.current[cacheKey] = currentResults;
        return currentResults;
      }
    }
    
    // Update the last search query reference
    lastSearchQueryRef.current = query;
    
    try {
      // Mark search as in progress
      searchInProgressRef.current[cacheKey] = true;
      
      console.log(`[LodgeSelection] Executing new search for query: "${query}"`);
      // Use our store reference method that was defined at component initialization
      // This avoids any dynamic imports during render
      const results = await storeRef.current.searchLodgesByGrandLodge(query, grand_lodge_id);
      
      console.log(`[LodgeSelection] Search returned ${results.length} results`);
      
      // Cache results for future use
      if (results.length > 0) {
        searchCacheRef.current[cacheKey] = results;
      }
      
      // Mark search as complete
      delete searchInProgressRef.current[cacheKey];
      
      return results;
    } catch (error) {
      console.error('[LodgeSelection] Search error:', error);
      // Mark search as complete even on error
      delete searchInProgressRef.current[cacheKey];
      // Lodge search error
      return [];
    }
  }, [grand_lodge_id, lodges]);

  // Create new lodge
  const handleCreateLodge = async () => {
    if (!grand_lodge_id || !newLodgeName) return;
    
    setIsCreating(true);
    try {
      const newLodge = await createLodge({
        name: newLodgeName,
        number: parseInt(newLodgeNumber) || null,
        grand_lodge_id: grand_lodge_id,
        district: null,
        meeting_place: null,
        area_type: null,
        state_region: null
      });
      
      if (newLodge) {
        handleSelect(newLodge);
        setShowCreateDialog(false);
        setNewLodgeName('');
        setNewLodgeNumber('');
      }
    } catch (error) {
      // Failed to create lodge
    } finally {
      setIsCreating(false);
    }
  };

  // Handle "use same lodge" checkbox change
  const handleUseSameLodgeChange = useCallback((checked: boolean) => {
    setUseSameLodge(checked);
    
    // Apply lodge data from primary mason
    if (checked && primaryAttendee?.lodgeId && primaryAttendee?.lodgeNameNumber) {
      // Update UI state
      setInputValue(primaryAttendee.lodgeNameNumber);
      
      // Update the lodge value
      onChange(String(primaryAttendee.lodgeId || ''), primaryAttendee.lodgeNameNumber || '', primaryAttendee.lodgeOrganisationId || '');
    } else if (!checked) {
      // Clear lodge data when unchecking
      setInputValue('');
      setSelectedLodge(null);
      onChange('', '', '');
    }
  }, [primaryAttendee, onChange]);

  // Render option for dropdown
  const renderOption = (lodge: LodgeOption) => (
    <div className="py-1">
      <div className="font-medium">{lodge.display_name}</div>
      {(lodge.district || lodge.meeting_place) && (
        <div className="text-xs text-gray-500 flex justify-between">
          {lodge.district && <span>{lodge.district}</span>}
          {lodge.meeting_place && <span className="truncate text-right">{lodge.meeting_place}</span>}
        </div>
      )}
    </div>
  );

  // Get placeholder based on cache status and user location
  const getLodgePlaceholder = useCallback(() => {
    if (!grand_lodge_id) return 'Select a Grand Lodge first';
    
    if (hasCachedLodges()) {
      return 'Type to search lodges...';
    }
    
    if (ipData?.region_code && ipData?.region) {
      return `Type to Search for Lodges in ${ipData.region} or globally`;
    }
    
    return 'Type to search lodges...';
  }, [grand_lodge_id, ipData]);

  // Helper function to filter a lodge by search term
  const filterLodgeByTerm = (lodge: LodgeOption, term: string): boolean => {
    const displayName = (lodge.display_name || '').toLowerCase();
    const name = (lodge.name || '').toLowerCase();
    const district = (lodge.district || '').toLowerCase();
    const meetingPlace = (lodge.meeting_place || '').toLowerCase();
    const searchTerm = term.toLowerCase();
    
    // Check for numeric match
    const isNumeric = /^\d+$/.test(term);
    if (isNumeric && lodge.number === parseInt(term, 10)) {
      return true;
    }
    
    // Check for text matches
    return displayName.includes(searchTerm) || 
           name.includes(searchTerm) || 
           district.includes(searchTerm) || 
           meetingPlace.includes(searchTerm);
  };
  
  // Compute filtered lodge options once to avoid re-computing in multiple places
  const filteredLodgeOptions = useMemo(() => {
    if (!grand_lodge_id) return [];
    
    // First, check if we have lodges in the cache
    const cachedLodges = lodgeCache?.byGrandLodge?.[grand_lodge_id]?.data || [];
    
    // If we have cached lodges, prioritize those for initial options
    if (cachedLodges.length > 0) {
      return cachedLodges.slice(0, 20).sort((a, b) => {
        const aName = a.display_name || a.name || '';
        const bName = b.display_name || b.name || '';
        return aName.localeCompare(bName);
      });
    }
    
    // Otherwise, show the filtered lodges from state
    const filteredLodges = lodges.filter(l => l.grand_lodge_id === grand_lodge_id);
    
    // Return filtered results
    return filteredLodges;
  }, [grand_lodge_id, lodgeCache, lodges]);

  return (
    <div className={className}>
      <Label htmlFor="lodge">
        Lodge
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      {/* Use same lodge checkbox */}
      {showUseSameLodge && primaryAttendee?.lodgeId && (
        <div className="flex items-center space-x-2 mb-2">
          <Checkbox
            id="use-same-lodge"
            checked={useSameLodge}
            onCheckedChange={(checked) => handleUseSameLodgeChange(!!checked)}
            disabled={disabled}
          />
          <Label 
            htmlFor="use-same-lodge" 
            className="cursor-pointer"
          >
            Use same lodge as {primaryAttendee.firstName || 'Primary Mason'} 
            {primaryAttendee.lodgeNameNumber && `(${primaryAttendee.lodgeNameNumber})`}
          </Label>
        </div>
      )}
      
      <AutocompleteInput<LodgeOption>
        id="lodge"
        name="lodge"
        value={inputValue}
        onChange={handleInputChange}
        onSelect={handleSelect}
        options={filteredLodgeOptions}
        getOptionLabel={(lodge) => lodge.display_name || `${lodge.name} No. ${lodge.number || 'N/A'}`}
        getOptionValue={(lodge) => lodge.lodge_id}
        renderOption={renderOption}
        placeholder={getLodgePlaceholder()}
        searchFunction={searchFunction}
        searchAsYouType={true}
        minSearchLength={2}
        debounceMs={800} // Increased debounce time substantially to reduce search frequency
        disabled={disabled || !grand_lodge_id || useSameLodge}
        isLoading={isLoadingLodges || isLoadingAllLodges}
        className="mt-1"
        allowCreate={true}
        createNewText="Create new Lodge..."
        onCreateNew={() => setShowCreateDialog(true)}
      />
      
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
      
      {/* Create Lodge Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Lodge</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-lodge-name">Lodge Name</Label>
              <Input
                id="new-lodge-name"
                value={newLodgeName}
                onChange={(e) => setNewLodgeName(e.target.value)}
                placeholder="Enter lodge name"
              />
            </div>
            
            <div>
              <Label htmlFor="new-lodge-number">Lodge Number</Label>
              <Input
                id="new-lodge-number"
                type="number"
                value={newLodgeNumber}
                onChange={(e) => setNewLodgeNumber(e.target.value)}
                placeholder="Enter lodge number"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateLodge}
              disabled={!newLodgeName || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Lodge'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Backward compatibility wrapper
export const LodgeField: React.FC<{
  mason: AttendeeData;
  updateAttendee: (updates: Partial<AttendeeData>) => void;
  errors?: Record<string, string>;
  primaryMason?: AttendeeData;
}> = ({ mason, updateAttendee, errors, primaryMason }) => {
  const handleChange = useCallback((lodgeId: string, lodgeNameNumber?: string) => {
    updateAttendee({ 
      lodgeId,
      lodgeNameNumber: lodgeNameNumber || '' 
    });
  }, [updateAttendee]);

  return (
    <LodgeSelection
      grand_lodge_id={mason.grand_lodge_id}
      value={mason.lodgeId}
      onChange={handleChange}
      required={true}
      error={errors?.lodgeId}
      showUseSameLodge={!mason.isPrimary}
      primaryMason={primaryMason}
    />
  );
};