import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  grandLodgeId?: string;
  value?: string;
  onChange: (value: string, lodgeNameNumber?: string) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  // For "use same lodge" functionality
  showUseSameLodge?: boolean;
  primaryMason?: AttendeeData;
}

interface LodgeOption {
  id: string;
  name: string;
  number: number | null;
  district: string | null;
  meeting_place: string | null;
  display_name: string;
  grand_lodge_id: string;
  region_code?: string;
}

export const LodgeSelection: React.FC<LodgeSelectionProps> = ({
  grandLodgeId,
  value,
  onChange,
  required = false,
  disabled = false,
  error,
  className,
  showUseSameLodge = false,
  primaryMason,
}) => {
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
    searchLodges,
    getLodgesByGrandLodge,
    createLodge,
    lodgeCache,
    isLoadingLodges,
    ipData,
    allLodgeSearchResults,
    searchAllLodgesAction,
    isLoadingAllLodges
  } = useLocationStore();

  // Update cache reference when lodgeCache changes
  const cacheRef = useRef(lodgeCache);
  useEffect(() => {
    cacheRef.current = lodgeCache;
  }, [lodgeCache]);

  // Check if we have cached lodges for this grand lodge
  const hasCachedLodges = useCallback(() => {
    if (!grandLodgeId) return false;
    const cache = cacheRef.current?.byGrandLodge?.[grandLodgeId];
    return cache?.data?.length > 0;
  }, [grandLodgeId]);

  // Load lodges when grand lodge changes
  useEffect(() => {
    if (grandLodgeId && !hasCachedLodges() && !isLoadingLodges) {
      console.log(`[LodgeSelection] Loading lodges for Grand Lodge ID: ${grandLodgeId}`);
      getLodgesByGrandLodge(grandLodgeId);
    }
  }, [grandLodgeId, getLodgesByGrandLodge, hasCachedLodges, isLoadingLodges]);

  // Handle input change with tracking for user interaction
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    userIsTypingRef.current = true;
    
    // Start search if there are at least 2 characters
    if (value.length > 2 && grandLodgeId) {
      searchLodges(value, grandLodgeId);
    }
    
    // Reset the user typing flag after a delay
    setTimeout(() => {
      userIsTypingRef.current = false;
    }, 500);
  }, [searchLodges, grandLodgeId]);

  // Load selected lodge data with improved reliability
  useEffect(() => {
    // React Hooks must be called at the top level - not inside conditionals or loops
    // Use a local variable instead for tracking processing state
    
    // Skip if user is actively typing
    if (userIsTypingRef.current) return;
    
    // Use a local variable to track processing state
    let isProcessing = false;
    
    if (value && !selectedLodge) {
      isProcessing = true;
      console.log(`[LodgeSelection] Loading lodge data for ID: ${value}`);
      
      // Check if the value we're loading matches the primaryMason
      if (primaryMason?.lodgeId === value) {
        // If we have an active "use same lodge" setting, let that effect handle it
        if (useSameLodge) {
          return;
        }
      }
      
      try {
        // First try to find it in the current lodges list
        const foundInCurrentList = lodges.find(l => l.id === value);
        if (foundInCurrentList) {
          console.log(`[LodgeSelection] Found lodge in current list: ${foundInCurrentList.display_name}`);
          setSelectedLodge(foundInCurrentList);
          setInputValue(foundInCurrentList.display_name);
          lodgeNameRef.current = foundInCurrentList.display_name;
          setIsInitialized(true);
          return;
        }
        
        // Next, try to find it in search results
        const foundInSearch = allLodgeSearchResults.find(l => l.id === value);
        if (foundInSearch) {
          console.log(`[LodgeSelection] Found lodge in search results: ${foundInSearch.display_name}`);
          setSelectedLodge(foundInSearch);
          setInputValue(foundInSearch.display_name);
          lodgeNameRef.current = foundInSearch.display_name;
          setIsInitialized(true);
          return;
        }
        
        // If we have a lodgeNameNumber from primary mason, use it
        if (primaryMason?.lodgeNameNumber && primaryMason.lodgeId === value) {
          console.log(`[LodgeSelection] Using lodge name from primary mason: ${primaryMason.lodgeNameNumber}`);
          setInputValue(primaryMason.lodgeNameNumber);
          lodgeNameRef.current = primaryMason.lodgeNameNumber;
          initialLoadDoneRef.current = true;
          setIsInitialized(true);
          return;
        }
        
        // If all else fails, try to search for it directly - but only once
        if (!isLoadingAllLodges && !initialLoadDoneRef.current) {
          console.log(`[LodgeSelection] Searching for lodge with ID: ${value}`);
          searchAllLodgesAction(value);
          initialLoadDoneRef.current = true;
          setInputValue('Looking up Lodge...');
        }
      } finally {
        // Flag is no longer needed as we're using a local variable
        isProcessing = false;
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
      console.log(`[LodgeSelection] Using same lodge as primary: ${primaryMason.lodgeNameNumber}`);
      
      // Update references first
      lodgeNameRef.current = primaryMason.lodgeNameNumber;
      setInputValue(primaryMason.lodgeNameNumber);
      
      // Try to find the lodge in current list for info display
      const primaryLodge = lodges.find(l => l.id === primaryMason.lodgeId);
      setSelectedLodge(primaryLodge || null);
      
      // Call onChange last to avoid triggering other effects
      if (value !== primaryMason.lodgeId) {
        onChange(primaryMason.lodgeId, primaryMason.lodgeNameNumber);
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
      
      onChange('', '');
      
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
      onChange('', '');
      return;
    }
    
    // Normal flow when lodge is not null
    setSelectedLodge(lodge);
    const displayValue = lodge.display_name || `${lodge.name} No. ${lodge.number || 'N/A'}`;
    setInputValue(displayValue);
    lodgeNameRef.current = displayValue;
    onChange(lodge.id, displayValue);
    
    console.log(`[LodgeSelection] Selected lodge: ${displayValue} (${lodge.id})`);
  }, [onChange]);

  // Search function for autocomplete
  const searchFunction = useCallback(async (query: string) => {
    if (!grandLodgeId || query.length < 2) return [];
    
    try {
      console.log(`[LodgeSelection] Searching lodges with query: ${query}`);
      const results = await searchLodges(query, grandLodgeId);
      return results;
    } catch (error) {
      console.error('[LodgeSelection] Lodge search error:', error);
      return [];
    }
  }, [searchLodges, grandLodgeId]);

  // Create new lodge
  const handleCreateLodge = async () => {
    if (!grandLodgeId || !newLodgeName) return;
    
    setIsCreating(true);
    try {
      console.log(`[LodgeSelection] Creating new lodge: ${newLodgeName} No. ${newLodgeNumber || 'N/A'}`);
      
      // Add region code from IP data if available
      const regionCode = ipData?.region_code;
      
      const newLodge = await createLodge({
        name: newLodgeName,
        number: parseInt(newLodgeNumber) || null,
        grand_lodge_id: grandLodgeId,
        display_name: `${newLodgeName} No. ${newLodgeNumber || 'N/A'}`,
        region_code: regionCode,
        district: null,
        meeting_place: null
      });
      
      if (newLodge) {
        console.log(`[LodgeSelection] Successfully created lodge: ${newLodge.id}`);
        handleSelect(newLodge);
        setShowCreateDialog(false);
        setNewLodgeName('');
        setNewLodgeNumber('');
      }
    } catch (error) {
      console.error('[LodgeSelection] Failed to create lodge:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle "use same lodge" checkbox change
  const handleUseSameLodgeChange = useCallback((checked: boolean) => {
    console.log(`[LodgeSelection] "Use same lodge" changed to: ${checked}`);
    setUseSameLodge(checked);
    
    // This will trigger the useEffect that handles the actual lodge update
  }, []);

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
    if (!grandLodgeId) return 'Select a Grand Lodge first';
    
    if (hasCachedLodges()) {
      return 'Select from list or type to search';
    }
    
    if (ipData?.region_code && ipData?.region) {
      return `Search for Lodges in ${ipData.region} or globally...`;
    }
    
    return 'Type to search lodges...';
  }, [grandLodgeId, hasCachedLodges, ipData]);

  return (
    <div className={className}>
      <Label htmlFor="lodge">
        Lodge
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      {/* Use same lodge checkbox */}
      {showUseSameLodge && primaryMason?.lodgeId && (
        <div className="flex items-center space-x-2 mb-2">
          <Checkbox
            id="use-same-lodge"
            checked={useSameLodge}
            onCheckedChange={(checked) => handleUseSameLodgeChange(!!checked)}
            disabled={disabled}
          />
          <Label 
            htmlFor="use-same-lodge" 
            className="text-sm font-normal cursor-pointer"
          >
            Use same lodge as {primaryMason.firstName} ({primaryMason.lodgeNameNumber})
          </Label>
        </div>
      )}
      
      <AutocompleteInput<LodgeOption>
        id="lodge"
        name="lodge"
        value={inputValue}
        onChange={handleInputChange}
        onSelect={handleSelect}
        options={lodges.filter(l => l.grand_lodge_id === grandLodgeId)}
        getOptionLabel={(lodge) => lodge.display_name}
        getOptionValue={(lodge) => lodge.id}
        renderOption={renderOption}
        placeholder={getLodgePlaceholder()}
        searchFunction={searchFunction}
        searchAsYouType={true}
        minSearchLength={2}
        debounceMs={300}
        disabled={disabled || !grandLodgeId || useSameLodge}
        isLoading={isLoadingLodges}
        className="mt-1"
        allowCreate={true}
        createNewText="Create new Lodge..."
        onCreateNew={() => setShowCreateDialog(true)}
      />
      
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
      
      {selectedLodge && (
        <Alert className="mt-2 bg-blue-50 border-blue-200">
          <InfoIcon className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm">
            Selected: {selectedLodge.display_name}
            {selectedLodge.district && ` • District: ${selectedLodge.district}`}
          </AlertDescription>
        </Alert>
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
      grandLodgeId={mason.grandLodgeId}
      value={mason.lodgeId}
      onChange={handleChange}
      required={true}
      error={errors?.lodgeId}
      showUseSameLodge={!mason.isPrimary}
      primaryMason={primaryMason}
    />
  );
};