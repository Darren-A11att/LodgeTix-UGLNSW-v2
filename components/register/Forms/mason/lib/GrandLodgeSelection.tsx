import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AutocompleteInput } from '../../shared/AutocompleteInput';
import { Label } from '@/components/ui/label';
import { useLocationStore } from '@/lib/locationStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { AttendeeData } from '../../Attendee/types';

interface GrandLodgeSelectionProps {
  value?: string;
  onChange: (value: string) => void;
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
      onChange('');
      return;
    }
    
    // Normal flow when grandLodge is not null
    setSelectedGrandLodge(grandLodge);
    setInputValue(grandLodge.name);
    onChange(grandLodge.id);
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
        didAttemptLocationBasedDefaultRef.current = true;
        console.log('[GrandLodgeSelection] Initializing with user location data');
        
        // Get user's location
        const userLocation = await getUserLocation();
        
        // Fetch initial grand lodges if needed
        if (grandLodges.length === 0 && !isLoadingGrandLodges) {
          await fetchInitialGrandLodges();
        }
        
        // Set default based on location - but only if no value is already set
        if (userLocation?.country && !value && grandLodges.length > 0) {
          const defaultGrandLodge = grandLodges.find(
            gl => gl.country === userLocation.country
          );
          
          if (defaultGrandLodge) {
            console.log(`[GrandLodgeSelection] Setting default based on location: ${defaultGrandLodge.name}`);
            handleSelect(defaultGrandLodge);
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
  }, [fetchInitialGrandLodges, getUserLocation, grandLodges, value, handleSelect, isLoadingGrandLodges]);

  // Load selected grand lodge data when value changes or grandLodges are loaded
  useEffect(() => {
    // Skip if user is actively typing
    if (userIsTypingRef.current) return;
    
    if (value && grandLodges.length > 0) {
      const grandLodge = grandLodges.find(gl => gl.id === value);
      if (grandLodge) {
        setSelectedGrandLodge(grandLodge);
        setInputValue(grandLodge.name);
        setIsInitialized(true);
      }
    } else if (!value) {
      // Clear selection if value is empty/null and user is not typing
      setSelectedGrandLodge(null);
      setInputValue('');
    }
  }, [value, grandLodges]);

  // Handle input change with debounce for search
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    userIsTypingRef.current = true;
    
    // Start search if there are at least 2 characters
    if (value.length > 2) {
      searchGrandLodges(value);
    }
    
    // Reset the user typing flag after a delay
    setTimeout(() => {
      userIsTypingRef.current = false;
    }, 500);
  }, [searchGrandLodges]);

  // Search function for autocomplete
  const searchFunction = useCallback(async (query: string) => {
    if (query.length < 2) return [];
    
    try {
      const results = await searchGrandLodges(query);
      return results;
    } catch (error) {
      console.error('[GrandLodgeSelection] Grand lodge search error:', error);
      return [];
    }
  }, [searchGrandLodges]);

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
        searchAsYouType={false}
        minSearchLength={2}
        debounceMs={300}
        disabled={disabled}
        isLoading={isLoadingGrandLodges}
        className="mt-1"
      />
      
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
      
      {selectedGrandLodge && (
        <Alert className="mt-2 bg-blue-50 border-blue-200">
          <InfoIcon className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-600 ml-2">
            Selected: {selectedGrandLodge.name} ({selectedGrandLodge.country})
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};