# Task 045: Create LodgeSelection Component

## Objective
Create the LodgeSelection component for Mason-specific lodge selection with autocomplete and creation functionality.

## Dependencies
- Task 044 (GrandLodgeSelection)
- Task 021 (AutocompleteInput)
- Task 010 (business logic)

## Reference Files
- `components/register/oldforms/mason/MasonLodgeInfo.tsx`
- Implementation details in CLAUDE.md

## Steps

1. Create `components/register/forms/mason/lib/LodgeSelection.tsx`:
```typescript
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
  
  const { 
    lodges, 
    searchLodges,
    getLodgesByGrandLodge,
    createLodge,
    lodgeCache 
  } = useLocationStore();

  // Cache reference for quick lookups
  const cacheRef = useRef(lodgeCache);

  // Check if we have cached lodges for this grand lodge
  const hasCachedLodges = useCallback(() => {
    if (!grandLodgeId) return false;
    const cache = cacheRef.current?.byGrandLodge?.[grandLodgeId];
    return cache?.data?.length > 0;
  }, [grandLodgeId]);

  // Load lodges when grand lodge changes
  useEffect(() => {
    if (grandLodgeId && !hasCachedLodges()) {
      getLodgesByGrandLodge(grandLodgeId);
    }
  }, [grandLodgeId, getLodgesByGrandLodge, hasCachedLodges]);

  // Load selected lodge data
  useEffect(() => {
    if (value && lodges.length > 0) {
      const lodge = lodges.find(l => l.id === value);
      if (lodge) {
        setSelectedLodge(lodge);
        setInputValue(lodge.display_name);
      }
    }
  }, [value, lodges]);

  // Handle use same lodge checkbox
  useEffect(() => {
    if (useSameLodge && primaryMason?.lodgeId && primaryMason?.lodgeNameNumber) {
      onChange(primaryMason.lodgeId, primaryMason.lodgeNameNumber);
    }
  }, [useSameLodge, primaryMason, onChange]);

  // Handle lodge selection
  const handleSelect = useCallback((lodge: LodgeOption) => {
    setSelectedLodge(lodge);
    setInputValue(lodge.display_name);
    onChange(lodge.id, lodge.display_name);
  }, [onChange]);

  // Search function for autocomplete
  const searchFunction = useCallback(async (query: string) => {
    if (!grandLodgeId || query.length < 2) return [];
    
    try {
      const results = await searchLodges(query, grandLodgeId);
      return results;
    } catch (error) {
      console.error('Lodge search error:', error);
      return [];
    }
  }, [searchLodges, grandLodgeId]);

  // Create new lodge
  const handleCreateLodge = async () => {
    if (!grandLodgeId || !newLodgeName) return;
    
    setIsCreating(true);
    try {
      const newLodge = await createLodge({
        name: newLodgeName,
        number: parseInt(newLodgeNumber) || null,
        grand_lodge_id: grandLodgeId,
        display_name: `${newLodgeName} No. ${newLodgeNumber || 'N/A'}`
      });
      
      if (newLodge) {
        handleSelect(newLodge);
        setShowCreateDialog(false);
        setNewLodgeName('');
        setNewLodgeNumber('');
      }
    } catch (error) {
      console.error('Failed to create lodge:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Render option for dropdown
  const renderOption = (lodge: LodgeOption) => (
    <div className="py-1">
      <div className="font-medium">{lodge.display_name}</div>
      {(lodge.district || lodge.meeting_place) && (
        <div className="text-xs text-gray-500">
          {lodge.district && <span>{lodge.district}</span>}
          {lodge.district && lodge.meeting_place && <span> • </span>}
          {lodge.meeting_place && <span>{lodge.meeting_place}</span>}
        </div>
      )}
    </div>
  );

  // Get placeholder based on cache status
  const getPlaceholder = () => {
    if (!grandLodgeId) return 'Select a Grand Lodge first';
    if (hasCachedLodges()) return 'Select from list or type to search';
    return 'Type to search lodges...';
  };

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
            onCheckedChange={(checked) => setUseSameLodge(!!checked)}
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
        value={inputValue}
        onChange={setInputValue}
        onSelect={handleSelect}
        options={lodges.filter(l => l.grand_lodge_id === grandLodgeId)}
        getOptionLabel={(lodge) => lodge.display_name}
        getOptionValue={(lodge) => lodge.id}
        renderOption={renderOption}
        placeholder={getPlaceholder()}
        searchFunction={searchFunction}
        searchAsYouType={true}
        minSearchLength={2}
        debounceMs={300}
        disabled={disabled || !grandLodgeId || useSameLodge}
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
```

2. Create a wrapper for existing usage:
```typescript
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
```

## Deliverables
- LodgeSelection component
- Autocomplete with search functionality
- Create new lodge dialog
- Use same lodge functionality
- Caching strategy implementation
- Backward compatibility wrapper

## Success Criteria
- Search works within selected grand lodge
- Lodge creation dialog functions properly
- Use same lodge checkbox works
- Caching improves performance
- Proper error handling