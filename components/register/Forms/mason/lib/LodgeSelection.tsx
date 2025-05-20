import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AutocompleteInput } from '../../shared/AutocompleteInput';
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
    // Skip if user is actively typing - let them finish
    if (userIsTypingRef.current) return;
    
    if (value && !selectedLodge) {
      console.log(`[LodgeSelection] Loading lodge data for ID: ${value}`);
      
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
      
      // If we have a lodgeNameNumber, use it
      if (primaryMason?.lodgeNameNumber && primaryMason.lodgeId === value) {
        console.log(`[LodgeSelection] Using lodge name from primary mason: ${primaryMason.lodgeNameNumber}`);
        setInputValue(primaryMason.lodgeNameNumber);
        lodgeNameRef.current = primaryMason.lodgeNameNumber;
        initialLoadDoneRef.current = true;
        setIsInitialized(true);
        return;
      }
      
      // If all else fails, try to search for it directly
      if (!isLoadingAllLodges && !initialLoadDoneRef.current) {
        console.log(`[LodgeSelection] Searching for lodge with ID: ${value}`);
        searchAllLodgesAction(value);
        initialLoadDoneRef.current = true;
        setInputValue('Looking up Lodge...');
      }
    } else if (!value) {
      // Clear selection if value is empty/null
      setSelectedLodge(null);
      setInputValue('');
      lodgeNameRef.current = null;
    }
  }, [value, lodges, selectedLodge, allLodgeSearchResults, isLoadingAllLodges, searchAllLodgesAction, primaryMason]);

  // Handle use same lodge checkbox
  useEffect(() => {
    if (useSameLodge && primaryMason?.lodgeId && primaryMason?.lodgeNameNumber) {
      console.log(`[LodgeSelection] Using same lodge as primary: ${primaryMason.lodgeNameNumber}`);
      onChange(primaryMason.lodgeId, primaryMason.lodgeNameNumber);
      setInputValue(primaryMason.lodgeNameNumber);
      lodgeNameRef.current = primaryMason.lodgeNameNumber;
      
      // Try to find the lodge in current list for info display
      const primaryLodge = lodges.find(l => l.id === primaryMason.lodgeId);
      if (primaryLodge) {
        setSelectedLodge(primaryLodge);
      } else {
        // If not found, set selected lodge to null but keep the input value
        setSelectedLodge(null);
      }
    } else if (!useSameLodge && !value) {
      // When unchecking "use same lodge", clear the selection if no value was set previously
      setSelectedLodge(null);
      setInputValue('');
      onChange('', '');
    }
  }, [useSameLodge, primaryMason, onChange, lodges]);

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