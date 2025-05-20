import React, { useEffect, useRef, useCallback, useState } from 'react';
import { AutocompleteInput } from '../../shared/AutocompleteInput';
import { GrandLodgeRow } from '@/lib/api/grandLodges';
import { LodgeRow } from '@/lib/api/lodges';
import { MasonAttendee } from '@/lib/registration-types';
import { useLocationStore, LocationState } from '@/lib/locationStore';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface MasonLodgeInfoProps {
  attendeeId: string;
  isPrimary: boolean;
  grandLodgeId?: string;
  lodgeId?: string;
  onGrandLodgeChange: (grandLodgeId: string) => void;
  onLodgeChange: (lodgeId: string, lodgeNameNumber?: string) => void;
  
  // Use same lodge functionality (for non-primary masons)
  showUseSameLodge?: boolean;
  useSameLodge?: boolean;
  onUseSameLodgeChange?: (checked: boolean) => void;
  primaryMason?: MasonAttendee;
  
  // Error handling
  grandLodgeError?: string;
  lodgeError?: string;
  
  // Additional props
  className?: string;
  disabled?: boolean;
}

const MasonLodgeInfo: React.FC<MasonLodgeInfoProps> = ({
  attendeeId,
  isPrimary,
  grandLodgeId,
  lodgeId,
  onGrandLodgeChange,
  onLodgeChange,
  showUseSameLodge = false,
  useSameLodge = false,
  onUseSameLodgeChange,
  primaryMason,
  grandLodgeError,
  lodgeError,
  className,
  disabled = false,
}) => {
  // Combined component state
  const [grandLodgeInputValue, setGrandLodgeInputValue] = useState('');
  const [selectedGrandLodge, setSelectedGrandLodge] = useState<GrandLodgeRow | null>(null);
  const [lodgeInputValue, setLodgeInputValue] = useState('');
  const [selectedLodge, setSelectedLodge] = useState<LodgeRow | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Lodge creation state
  const [isCreatingLodgeUI, setIsCreatingLodgeUI] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newLodgeName, setNewLodgeName] = useState('');
  const [newLodgeNumber, setNewLodgeNumber] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // User interaction tracking refs
  const userIsTypingGrandLodgeRef = useRef(false);
  const userIsTypingLodgeRef = useRef(false);
  const didInitialLoadRef = useRef(false);
  const lodgeNameRef = useRef<string | null>(null);
  const didAttemptLocationBasedDefaultRef = useRef(false);
  
  // Get store selectors
  const { 
    grandLodges,
    searchGrandLodges,
    fetchInitialGrandLodges,
    getUserLocation,
    ipData,
    isLoadingGrandLodges,
    lodges,
    getLodgesByGrandLodge,
    searchLodges,
    isLoadingLodges,
    createLodge,
    lodgeCache,
    allLodgeSearchResults,
    searchAllLodgesAction,
    isLoadingAllLodges 
  } = useLocationStore();
  
  // Store IP data and cache info in refs to avoid re-renders
  const ipDataRef = useRef(ipData);
  const lodgeCacheRef = useRef(lodgeCache);
  
  // For NSW special handling
  const lastSearchTermRef = useRef<string>('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchFunctionRef = useRef<Record<string, GrandLodgeRow[]>>({});
  
  // Subscribe to IP data and lodge cache updates
  useEffect(() => {
    const unsubscribe = useLocationStore.subscribe(
      (state: LocationState, prevState: LocationState) => {
        // Check for actual changes before updating refs
        if (state.ipData !== prevState.ipData) {
          ipDataRef.current = state.ipData;
        }
        if (state.lodgeCache !== prevState.lodgeCache) {
          lodgeCacheRef.current = state.lodgeCache;
        }
      }
    );
    return unsubscribe; // Return the unsubscribe function for cleanup
  }, []);
  
  // Initialize with user's location-based grand lodge
  useEffect(() => {
    // Skip if already initialized or initializing
    if (isInitialized || didAttemptLocationBasedDefaultRef.current) return;
    
    const initializeGrandLodge = async () => {
      try {
        // Mark as initializing before starting async work
        didAttemptLocationBasedDefaultRef.current = true;
        console.log('[MasonLodgeInfo] Initializing with user location data');
        
        // Get user's location
        const userLocation = await getUserLocation();
        
        // Check if we got a value during async wait (prevents race conditions)
        if (grandLodgeId) {
          setIsInitialized(true);
          return;
        }
        
        // First search for Australia-focused Grand Lodges if in Australia
        let auResults: GrandLodgeRow[] = [];
        
        // Use broader query to get NSW results like "NSW" or just "United"
        const initialQuery = (userLocation?.country === 'Australia') ? 'united' : userLocation?.country || 'lodge';
        
        // Always fetch initial grand lodges to have something to work with
        if (grandLodges.length === 0 || !isLoadingGrandLodges) {
          // Ensure we have lodges to work with by fetching initial data
          await fetchInitialGrandLodges();
          
          // In Australia? Pre-fetch with a broad query to get local options
          if (userLocation?.country === 'Australia') {
            auResults = await searchGrandLodges(initialQuery, 'Australia');
            console.log(`[MasonLodgeInfo] Pre-loaded ${auResults.length} Australian Grand Lodges`);
          }
        }
        
        // Check again if we got a value during async wait
        if (grandLodgeId) {
          setIsInitialized(true);
          return;
        }
        
        // Set default based on location - but only if no value is already set
        if (userLocation?.country && !grandLodgeId) {
          let defaultGrandLodge: GrandLodgeRow | undefined;
          
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
            console.log(`[MasonLodgeInfo] Setting default based on location: ${defaultGrandLodge.name}`);
            // Do NOT call handleSelect directly to avoid loops
            setSelectedGrandLodge(defaultGrandLodge);
            setGrandLodgeInputValue(defaultGrandLodge.name);
            // Call onChange last
            onGrandLodgeChange(defaultGrandLodge.id);
            setIsInitialized(true);
          }
        }
      } catch (error) {
        console.error('[MasonLodgeInfo] Failed to initialize grand lodge:', error);
      }
    };

    // Only initialize if not already loading and no value is set yet
    if (!grandLodgeId && !isLoadingGrandLodges) {
      initializeGrandLodge();
    } else if (grandLodgeId) {
      // If value already exists, consider it initialized
      setIsInitialized(true);
    }
  }, [fetchInitialGrandLodges, searchGrandLodges, getUserLocation, grandLodges, grandLodgeId, onGrandLodgeChange, isLoadingGrandLodges, isInitialized]);

  // Load selected grand lodge data when value changes or grandLodges are loaded
  useEffect(() => {
    // Skip if user is actively typing
    if (userIsTypingGrandLodgeRef.current) return;
    
    // Track if we're currently processing to avoid recursive updates
    let isProcessing = false;
    
    if (grandLodgeId && grandLodges.length > 0) {
      isProcessing = true;
      
      try {
        // Only update if we don't already have the right selection
        if (!selectedGrandLodge || selectedGrandLodge.id !== grandLodgeId) {
          const grandLodge = grandLodges.find(gl => gl.id === grandLodgeId);
          if (grandLodge) {
            setSelectedGrandLodge(grandLodge);
            setGrandLodgeInputValue(grandLodge.name);
            setIsInitialized(true);
          }
        }
      } finally {
        isProcessing = false;
      }
    } else if (!grandLodgeId && selectedGrandLodge !== null) {
      // Clear selection if value is empty/null and user is not typing
      setSelectedGrandLodge(null);
      setGrandLodgeInputValue('');
    }
  }, [grandLodgeId, grandLodges, selectedGrandLodge]);

  // Load lodges when grand lodge changes
  useEffect(() => {
    if (grandLodgeId && lodges.length === 0 && !isLoadingLodges) {
      console.log(`[MasonLodgeInfo] Loading lodges for Grand Lodge ID: ${grandLodgeId}`);
      getLodgesByGrandLodge(grandLodgeId);
    }
  }, [grandLodgeId, getLodgesByGrandLodge, lodges.length, isLoadingLodges]);

  // Handle "use same lodge" checkbox
  const handleUseSameLodgeChange = useCallback((checked: boolean) => {
    if (onUseSameLodgeChange) {
      onUseSameLodgeChange(checked);
    }
    
    if (checked && primaryMason?.grandLodgeId && primaryMason?.lodgeId) {
      // Force the selection to match the primary mason
      if (grandLodgeId !== primaryMason.grandLodgeId) {
        onGrandLodgeChange(primaryMason.grandLodgeId);
      }
      
      if (lodgeId !== primaryMason.lodgeId) {
        onLodgeChange(primaryMason.lodgeId, primaryMason.lodgeNameNumber);
      }
    }
  }, [onUseSameLodgeChange, primaryMason, grandLodgeId, lodgeId, onGrandLodgeChange, onLodgeChange]);

  // Effect to load lodges for initial lodge selection
  useEffect(() => {
    if (lodgeId && !selectedLodge && lodges.length > 0) {
      const lodge = lodges.find(l => l.id === lodgeId);
      if (lodge) {
        setSelectedLodge(lodge);
        const displayValue = lodge.display_name || `${lodge.name} No. ${lodge.number || 'N/A'}`;
        setLodgeInputValue(displayValue);
        lodgeNameRef.current = displayValue;
      }
    }
  }, [lodgeId, selectedLodge, lodges]);

  // Grand Lodge filter and handlers
  const filterLocalGrandLodges = useCallback((query: string): GrandLodgeRow[] => {
    if (!query || query.length < 2 || grandLodges.length === 0) return [];
    
    const lowercaseQuery = query.toLowerCase();
    const userCountry = ipDataRef.current?.country_name || 'Australia';
    
    // Special case for NSW - ensure it matches both "NSW" directly and "United Grand Lodge of NSW"
    if (query.toUpperCase() === "NSW") {
      // Find any grand lodge containing NSW in the name or abbreviation
      const nswMatches = grandLodges.filter(gl => {
        return gl.name.includes("NSW") || 
               gl.abbreviation?.includes("NSW") || 
               gl.name.toLowerCase().includes("new south wales");
      });
      
      if (nswMatches.length > 0) {
        console.log(`[MasonLodgeInfo] Special NSW search found ${nswMatches.length} matches`);
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
    
    // Sort by country match and relevance
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
  }, [grandLodges]);

  // Grand Lodge input handler with debounce
  const handleGrandLodgeInputChange = useCallback((value: string) => {
    setGrandLodgeInputValue(value);
    userIsTypingGrandLodgeRef.current = true;
    
    // Clear any pending search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    
    // Start search if there are at least 2 characters
    if (value.length >= 2) {
      // Do immediate local filtering
      const localResults = filterLocalGrandLodges(value);
      console.log(`[MasonLodgeInfo] Local Grand Lodge filter found ${localResults.length} matches for '${value}'`);
      
      // Trigger search immediately for "NSW" due to its importance
      if (value.toUpperCase() === "NSW" || value.includes("United Grand Lodge")) {
        console.log(`[MasonLodgeInfo] Immediate Grand Lodge search for important term: '${value}'`);
        searchGrandLodges(value, ipDataRef.current?.country_name || 'Australia')
          .then(results => {
            console.log(`[MasonLodgeInfo] Immediate Grand Lodge search found ${results.length} results`);
          });
      } 
      // Debounce other search terms
      else if (value.length >= 2 && value !== lastSearchTermRef.current) {
        lastSearchTermRef.current = value;
        searchTimeoutRef.current = setTimeout(() => {
          searchGrandLodges(value, ipDataRef.current?.country_name || 'Australia');
        }, 300);
      }
    }
    
    // Reset the user typing flag after a delay
    setTimeout(() => {
      userIsTypingGrandLodgeRef.current = false;
    }, 500);
  }, [searchGrandLodges, filterLocalGrandLodges]);

  // Grand Lodge search function for autocomplete
  const grandLodgeSearchFunction = useCallback(async (query: string) => {
    if (query.length < 2) return [];
    
    // Check if we've already made this exact query recently
    if (searchFunctionRef.current[query]) {
      console.log(`[MasonLodgeInfo] Using cached Grand Lodge search results for '${query}'`);
      return searchFunctionRef.current[query];
    }
    
    try {
      console.log(`[MasonLodgeInfo] Searching Grand Lodges for '${query}'`);
      // Use the ipData country if available for better results
      const userCountry = ipDataRef.current?.country_name || 'Australia';
      
      // Pass the user's country to prioritize local grand lodges
      const results = await searchGrandLodges(query, userCountry);
      console.log(`[MasonLodgeInfo] Grand Lodge search returned ${results.length} results`);
      
      // Cache results for this query
      searchFunctionRef.current[query] = results;
      
      // Clear the cache after 30 seconds to ensure fresh data
      setTimeout(() => {
        delete searchFunctionRef.current[query];
      }, 30000);
      
      return results;
    } catch (error) {
      console.error('[MasonLodgeInfo] Grand lodge search error:', error);
      return [];
    }
  }, [searchGrandLodges]);

  // Grand Lodge selection handler
  const handleGrandLodgeSelect = useCallback((option: GrandLodgeRow | null) => {
    if (!option) {
      // Clear selection
      setSelectedGrandLodge(null);
      setGrandLodgeInputValue('');
      onGrandLodgeChange('');
      return;
    }
    
    // Update component state
    setSelectedGrandLodge(option);
    setGrandLodgeInputValue(option.name);
    
    // Notify parent
    onGrandLodgeChange(option.id);
    
    // When Grand Lodge changes, clear lodge selection
    if (selectedLodge && selectedLodge.grand_lodge_id !== option.id) {
      setSelectedLodge(null);
      setLodgeInputValue('');
      onLodgeChange('', '');
    }
    
    // Load lodges for this grand lodge
    getLodgesByGrandLodge(option.id);
  }, [onGrandLodgeChange, getLodgesByGrandLodge, selectedLodge, onLodgeChange]);

  // Lodge input handler
  const handleLodgeInputChange = useCallback((value: string) => {
    setLodgeInputValue(value);
    userIsTypingLodgeRef.current = true;
    
    // Only search if grand lodge is selected and value is long enough
    if (selectedGrandLodge?.id && value.length > 2) {
      searchLodges(value, selectedGrandLodge.id);
    }
    
    // Reset typing flag
    setTimeout(() => {
      userIsTypingLodgeRef.current = false;
    }, 500);
  }, [selectedGrandLodge, searchLodges]);

  // Lodge selection handler
  const handleLodgeSelect = useCallback((option: LodgeRow | null) => {
    if (!option) {
      // Clear selection
      setSelectedLodge(null);
      setLodgeInputValue('');
      lodgeNameRef.current = null;
      onLodgeChange('', '');
      return;
    }
    
    // Update component state
    setSelectedLodge(option);
    const displayValue = option.display_name || `${option.name} No. ${option.number || 'N/A'}`;
    setLodgeInputValue(displayValue);
    lodgeNameRef.current = displayValue;
    
    // Notify parent
    onLodgeChange(option.id, displayValue);
  }, [onLodgeChange]);

  // Create new lodge
  const handleInitiateLodgeCreation = useCallback((lodgeName: string) => {
    setIsCreatingLodgeUI(true);
    setNewLodgeName(lodgeName);
    setShowCreateDialog(true);
  }, []);

  const handleCancelLodgeCreation = useCallback(() => {
    setIsCreatingLodgeUI(false);
    setShowCreateDialog(false);
    setNewLodgeName('');
    setNewLodgeNumber('');
  }, []);

  const handleCreateLodge = async () => {
    if (!selectedGrandLodge?.id || !newLodgeName) return;
    
    setIsCreating(true);
    try {
      console.log(`[MasonLodgeInfo] Creating new lodge: ${newLodgeName} No. ${newLodgeNumber || 'N/A'}`);
      
      // Add region code from IP data if available
      const regionCode = ipDataRef.current?.region_code;
      
      const newLodge = await createLodge({
        name: newLodgeName,
        number: parseInt(newLodgeNumber) || null,
        grand_lodge_id: selectedGrandLodge.id,
        display_name: `${newLodgeName} No. ${newLodgeNumber || 'N/A'}`,
        region_code: regionCode || null,
        district: null,
        meeting_place: null
      });
      
      if (newLodge) {
        console.log(`[MasonLodgeInfo] Successfully created lodge: ${newLodge.id}`);
        handleLodgeSelect(newLodge);
        setIsCreatingLodgeUI(false);
        setShowCreateDialog(false);
        setNewLodgeName('');
        setNewLodgeNumber('');
      }
    } catch (error) {
      console.error('[MasonLodgeInfo] Failed to create lodge:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleLodgeNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewLodgeNumber(e.target.value);
  };

  // Render functions for dropdown options
  const renderGrandLodgeOption = (option: GrandLodgeRow): React.ReactNode => (
    <div className="py-1">
      <div className="font-medium">{option.name}</div>
      <div className="text-xs text-gray-500 flex justify-between">
        <span>{option.country ?? 'N/A'}</span> 
        {option.abbreviation && <span className="font-medium">{option.abbreviation}</span>}
      </div>
    </div>
  );

  const renderLodgeOption = (option: LodgeRow): React.ReactNode => (
    <div className="py-1">
      <div className="font-medium">{option.display_name || `${option.name} No. ${option.number || 'N/A'}`}</div>
      {(option.district || option.meeting_place) && (
        <div className="text-xs text-gray-500 flex justify-between">
          {option.district && <span>{option.district}</span>}
          {option.meeting_place && <span className="truncate text-right">{option.meeting_place}</span>}
        </div>
      )}
    </div>
  );

  // Get better placeholders based on user location
  const getGrandLodgePlaceholder = () => {
    const defaultPlaceholder = "Search Grand Lodge by name, country...";
    
    // If we have country data, suggest it in the placeholder
    if (ipDataRef.current?.country_name) {
      return `Search Grand Lodge in ${ipDataRef.current.country_name} or globally...`;
    }
    
    return defaultPlaceholder;
  };

  const getLodgePlaceholder = () => {
    if (!selectedGrandLodge) {
      return "Select Grand Lodge first";
    }
    
    if (!selectedGrandLodge.id) {
      return "Search Lodge name, number, town...";
    }
    
    // Check if we have cached lodges for this Grand Lodge - safely
    const cacheForGl = lodgeCacheRef.current?.byGrandLodge?.[selectedGrandLodge.id];
    const hasCachedLodges = cacheForGl?.data?.length > 0;
    
    if (hasCachedLodges) {
      return "Select from cached lodges or search...";
    }
    
    return "Search Lodge name, number, town...";
  };

  return (
    <div className={className || "mb-4"}>
      {/* Render "Use same lodge" checkbox for non-primary masons */}
      {showUseSameLodge && primaryMason?.grandLodgeId && primaryMason?.lodgeNameNumber && (
        <div className="mb-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`use-same-lodge-${attendeeId}`}
              checked={useSameLodge}
              onCheckedChange={(checked) => handleUseSameLodgeChange(!!checked)}
              disabled={disabled}
            />
            <Label 
              htmlFor={`use-same-lodge-${attendeeId}`}
              className="text-sm font-normal cursor-pointer"
            >
              Use same lodge as {primaryMason.firstName} ({primaryMason.lodgeNameNumber})
            </Label>
          </div>
        </div>
      )}
      
      {/* Show lodge fields if primary OR if not using same lodge */}
      {(isPrimary || !useSameLodge) && (
        <div className="form-grid gap-4 mb-4">
          {/* Grand Lodge Selection */}
          <div>
            <Label htmlFor={`grandLodge-${attendeeId}`}>
              Grand Lodge
              {isPrimary && <span className="text-red-500 ml-1">*</span>}
            </Label>
            
            <AutocompleteInput
              id={`grandLodge-${attendeeId}`}
              name={`grandLodge-${attendeeId}`}
              value={grandLodgeInputValue}
              onChange={handleGrandLodgeInputChange}
              onSelect={handleGrandLodgeSelect}
              options={grandLodges}
              getOptionLabel={(gl) => gl.name}
              getOptionValue={(gl) => gl.id}
              renderOption={renderGrandLodgeOption}
              placeholder={getGrandLodgePlaceholder()}
              searchFunction={grandLodgeSearchFunction}
              searchAsYouType={true}
              minSearchLength={2}
              debounceMs={300}
              disabled={disabled}
              isLoading={isLoadingGrandLodges}
              className="mt-1"
              required={isPrimary}
              error={grandLodgeError}
              filterOptions={(options, query) => {
                if (!query || query.length < 2) return [];
                
                console.log(`[MasonLodgeInfo] Filtering GL options for '${query}', options count: ${options.length}`);
                const lowercaseQuery = query.toLowerCase();
                const userCountry = ipDataRef.current?.country_name || 'Australia';
                
                // Special case for NSW
                if (query.toUpperCase() === "NSW") {
                  const nswMatches = options.filter(gl => {
                    return gl.name.includes("NSW") || 
                          gl.abbreviation?.includes("NSW") || 
                          gl.name.toLowerCase().includes("new south wales");
                  });
                  
                  if (nswMatches.length > 0) {
                    return nswMatches.sort((a, b) => {
                      const aHasUnited = a.name.toLowerCase().includes("united");
                      const bHasUnited = b.name.toLowerCase().includes("united");
                      if (aHasUnited && !bHasUnited) return -1;
                      if (!aHasUnited && bHasUnited) return 1;
                      return a.name.localeCompare(b.name);
                    });
                  }
                }
                
                // Normal filtering
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
                
                console.log(`[MasonLodgeInfo] Filtered to ${filtered.length} GL results for '${query}'`);
                return filtered;
              }}
            />
          </div>
          
          {/* Lodge Selection */}
          <div className={`${!selectedGrandLodge ? 'opacity-50' : ''}`}>
            <Label htmlFor={`lodge-${attendeeId}`}>
              Lodge {isPrimary && <span className="text-red-500 ml-1">*</span>}
            </Label>
            
            {!isCreatingLodgeUI ? (
              <AutocompleteInput
                id={`lodge-${attendeeId}`}
                name={`lodge-${attendeeId}`}
                value={lodgeInputValue}
                onChange={handleLodgeInputChange}
                onSelect={handleLodgeSelect}
                onCreateNew={handleInitiateLodgeCreation}
                options={lodges.filter(l => l.grand_lodge_id === selectedGrandLodge?.id)}
                getOptionLabel={(lodge) => lodge.display_name || `${lodge.name} No. ${lodge.number || 'N/A'}`}
                getOptionValue={(lodge) => lodge.id}
                renderOption={renderLodgeOption}
                placeholder={getLodgePlaceholder()}
                searchFunction={async (query) => {
                  if (!selectedGrandLodge?.id || query.length < 2) return [];
                  
                  try {
                    console.log(`[MasonLodgeInfo] Searching lodges with query: ${query}`);
                    const results = await searchLodges(query, selectedGrandLodge.id);
                    return results;
                  } catch (error) {
                    console.error('[MasonLodgeInfo] Lodge search error:', error);
                    return [];
                  }
                }}
                searchAsYouType={true}
                minSearchLength={2}
                debounceMs={300}
                disabled={disabled || !selectedGrandLodge?.id}
                isLoading={isLoadingLodges}
                className="mt-1"
                required={isPrimary}
                error={lodgeError}
                allowCreate={true}
                createNewText="Create new Lodge..."
              />
            ) : (
              <div className="bg-green-50 p-4 rounded-md border border-green-100 mt-1">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`newLodgeName-${attendeeId}`}>
                    Lodge Name *
                  </label>
                  <input
                    type="text"
                    id={`newLodgeName-${attendeeId}`}
                    name={`newLodgeName-${attendeeId}`}
                    value={newLodgeName}
                    onChange={(e) => setNewLodgeName(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 border border-green-200 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Enter the lodge name"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`newLodgeNumber-${attendeeId}`}>
                    Lodge Number *
                  </label>
                  <input
                    type="number"
                    id={`newLodgeNumber-${attendeeId}`}
                    name={`newLodgeNumber-${attendeeId}`}
                    value={newLodgeNumber}
                    onChange={handleLodgeNumberChange}
                    required
                    className="w-full px-3 py-1.5 border border-green-200 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Enter lodge number"
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={handleCancelLodgeCreation}
                    className="px-3 py-1 text-sm text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateLodge}
                    disabled={!newLodgeName || !newLodgeNumber || isCreating}
                    className={`px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 ${
                      (!newLodgeName || !newLodgeNumber || isCreating) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isCreating ? 'Creating...' : 'Confirm New Lodge'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Lodge Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Lodge</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor={`new-lodge-name-${attendeeId}`}>Lodge Name</Label>
              <Input
                id={`new-lodge-name-${attendeeId}`}
                value={newLodgeName}
                onChange={(e) => setNewLodgeName(e.target.value)}
                placeholder="Enter lodge name"
              />
            </div>
            
            <div>
              <Label htmlFor={`new-lodge-number-${attendeeId}`}>Lodge Number</Label>
              <Input
                id={`new-lodge-number-${attendeeId}`}
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
              onClick={handleCancelLodgeCreation}
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

// Backward compatibility wrapper for existing implementations
export const MasonLodgeField: React.FC<{
  mason: MasonAttendee;
  updateAttendee: (updates: Partial<MasonAttendee>) => void;
  errors?: Record<string, string>;
  primaryMason?: MasonAttendee;
}> = ({ mason, updateAttendee, errors, primaryMason }) => {
  const handleGrandLodgeChange = useCallback((grandLodgeId: string) => {
    updateAttendee({ grandLodgeId });
  }, [updateAttendee]);

  const handleLodgeChange = useCallback((lodgeId: string, lodgeNameNumber?: string) => {
    updateAttendee({ 
      lodgeId,
      lodgeNameNumber: lodgeNameNumber || '' 
    });
  }, [updateAttendee]);

  const handleUseSameLodgeChange = useCallback((checked: boolean) => {
    if (checked && primaryMason) {
      updateAttendee({ 
        useSameLodge: true,
        grandLodgeId: primaryMason.grandLodgeId,
        lodgeId: primaryMason.lodgeId,
        lodgeNameNumber: primaryMason.lodgeNameNumber 
      });
    } else {
      updateAttendee({
        useSameLodge: false,
        grandLodgeId: '',
        lodgeId: '',
        lodgeNameNumber: ''
      });
    }
  }, [updateAttendee, primaryMason]);

  return (
    <MasonLodgeInfo
      attendeeId={mason.attendeeId}
      isPrimary={mason.isPrimary || false}
      grandLodgeId={mason.grandLodgeId}
      lodgeId={mason.lodgeId}
      onGrandLodgeChange={handleGrandLodgeChange}
      onLodgeChange={handleLodgeChange}
      showUseSameLodge={!mason.isPrimary && !!primaryMason}
      useSameLodge={mason.useSameLodge || false}
      onUseSameLodgeChange={handleUseSameLodgeChange}
      primaryMason={primaryMason}
      grandLodgeError={errors?.grandLodgeId}
      lodgeError={errors?.lodgeId}
    />
  );
};

export default MasonLodgeInfo;