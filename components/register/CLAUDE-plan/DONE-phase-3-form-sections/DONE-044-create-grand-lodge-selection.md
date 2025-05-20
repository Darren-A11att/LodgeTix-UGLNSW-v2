# Task 044: Create GrandLodgeSelection Component

## Objective
Create the GrandLodgeSelection component for Mason-specific grand lodge selection with autocomplete functionality.

## Dependencies
- Task 021 (AutocompleteInput)
- Task 007 (constants)
- Task 010 (business logic)

## Reference Files
- `components/register/oldforms/mason/MasonLodgeInfo.tsx`
- Implementation details in CLAUDE.md

## Steps

1. Create `components/register/forms/mason/lib/GrandLodgeSelection.tsx`:
```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { AutocompleteInput } from '../../shared/AutocompleteInput';
import { Label } from '@/components/ui/label';
import { useLocationStore } from '@/lib/locationStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

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
  const { 
    grandLodges, 
    searchGrandLodges, 
    fetchInitialGrandLodges,
    getUserLocation 
  } = useLocationStore();

  // Initialize with user's location-based grand lodge
  useEffect(() => {
    const initializeGrandLodge = async () => {
      try {
        // Get user's location
        const userLocation = await getUserLocation();
        
        // Fetch initial grand lodges
        await fetchInitialGrandLodges();
        
        // Set default based on location
        if (userLocation && !value) {
          const defaultGrandLodge = grandLodges.find(
            gl => gl.country === userLocation.country
          );
          
          if (defaultGrandLodge) {
            handleSelect(defaultGrandLodge);
          }
        }
      } catch (error) {
        console.error('Failed to initialize grand lodge:', error);
      }
    };

    initializeGrandLodge();
  }, []);

  // Load selected grand lodge data
  useEffect(() => {
    if (value && grandLodges.length > 0) {
      const grandLodge = grandLodges.find(gl => gl.id === value);
      if (grandLodge) {
        setSelectedGrandLodge(grandLodge);
        setInputValue(grandLodge.name);
      }
    }
  }, [value, grandLodges]);

  // Handle grand lodge selection
  const handleSelect = useCallback((grandLodge: GrandLodgeOption) => {
    setSelectedGrandLodge(grandLodge);
    setInputValue(grandLodge.name);
    onChange(grandLodge.id);
  }, [onChange]);

  // Search function for autocomplete
  const searchFunction = useCallback(async (query: string) => {
    if (query.length < 2) return [];
    
    try {
      const results = await searchGrandLodges(query);
      return results;
    } catch (error) {
      console.error('Grand lodge search error:', error);
      return [];
    }
  }, [searchGrandLodges]);

  // Render option for dropdown
  const renderOption = (grandLodge: GrandLodgeOption) => (
    <div className="py-1">
      <div className="font-medium">{grandLodge.name}</div>
      <div className="text-xs text-gray-500">
        {grandLodge.country} • {grandLodge.abbreviation}
      </div>
    </div>
  );

  // Get placeholder based on user location
  const getPlaceholder = () => {
    const userLocation = getUserLocation();
    if (userLocation?.country === 'Australia') {
      return 'e.g., United Grand Lodge of NSW & ACT';
    }
    return 'Type to search Grand Lodges...';
  };

  return (
    <div className={className}>
      <Label htmlFor="grand-lodge">
        Grand Lodge
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <AutocompleteInput<GrandLodgeOption>
        value={inputValue}
        onChange={setInputValue}
        onSelect={handleSelect}
        options={grandLodges}
        getOptionLabel={(gl) => gl.name}
        getOptionValue={(gl) => gl.id}
        renderOption={renderOption}
        placeholder={getPlaceholder()}
        searchFunction={searchFunction}
        searchAsYouType={false}
        minSearchLength={2}
        debounceMs={300}
        disabled={disabled}
        className="mt-1"
      />
      
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
      
      {selectedGrandLodge && (
        <Alert className="mt-2 bg-blue-50 border-blue-200">
          <InfoIcon className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm">
            Selected: {selectedGrandLodge.name} ({selectedGrandLodge.abbreviation})
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
```

2. Create a wrapper for existing usage:
```typescript
// Backward compatibility wrapper
export const GrandLodgeField: React.FC<{
  mason: AttendeeData;
  updateAttendee: (updates: Partial<AttendeeData>) => void;
  errors?: Record<string, string>;
}> = ({ mason, updateAttendee, errors }) => {
  const handleChange = useCallback((grandLodgeId: string) => {
    updateAttendee({ 
      grandLodgeId,
      // Clear lodge selection when grand lodge changes
      lodgeId: null,
      lodgeNameNumber: null 
    });
  }, [updateAttendee]);

  return (
    <GrandLodgeSelection
      value={mason.grandLodgeId}
      onChange={handleChange}
      required={true}
      error={errors?.grandLodgeId}
    />
  );
};
```

3. Create types for the location store if not already defined:
```typescript
// types/location.ts
export interface GrandLodgeRow {
  id: string;
  name: string;
  country: string;
  state_province: string | null;
  abbreviation: string;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface LodgeRow {
  id: string;
  grand_lodge_id: string;
  name: string;
  number: number | null;
  district: string | null;
  meeting_place: string | null;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface UserLocation {
  country: string;
  state?: string;
  city?: string;
}
```

## Deliverables
- GrandLodgeSelection component
- Autocomplete with search functionality
- Location-based default selection
- Clear visual feedback
- Backward compatibility wrapper

## Success Criteria
- Search functionality works correctly
- Location-based defaults applied
- Selection clears lodge data
- Proper error handling
- Accessible interface