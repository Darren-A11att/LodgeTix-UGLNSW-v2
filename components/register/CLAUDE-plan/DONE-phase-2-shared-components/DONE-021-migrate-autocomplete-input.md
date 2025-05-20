# Task 021: Migrate AutocompleteInput

## Objective
Move and refactor the AutocompleteInput component to the new shared location with proper typing and improved functionality.

## Dependencies
- Phase 1 foundation tasks complete

## Reference Files
- `components/register/functions/AutocompleteInput.tsx`
- Usage in `components/register/oldforms/mason/MasonLodgeInfo.tsx`

## Steps

1. Copy AutocompleteInput to new location:
```bash
cp components/register/functions/AutocompleteInput.tsx \
   components/register/forms/shared/AutocompleteInput.tsx
```

2. Refactor with proper TypeScript generics:
```typescript
// components/register/forms/shared/AutocompleteInput.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AutocompleteInputProps<T> {
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: T) => void;
  options: T[];
  getOptionLabel: (option: T) => string;
  getOptionValue?: (option: T) => string;
  renderOption?: (option: T) => React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  allowCreate?: boolean;
  createNewText?: string;
  onCreateNew?: () => void;
  searchFunction?: (query: string) => Promise<T[]>;
  debounceMs?: number;
  minSearchLength?: number;
  className?: string;
  inputClassName?: string;
  dropdownClassName?: string;
}

export function AutocompleteInput<T>({
  value,
  onChange,
  onSelect,
  options,
  getOptionLabel,
  getOptionValue,
  renderOption,
  placeholder,
  disabled,
  allowCreate,
  createNewText = "Create new...",
  onCreateNew,
  searchFunction,
  debounceMs = 300,
  minSearchLength = 2,
  className,
  inputClassName,
  dropdownClassName,
}: AutocompleteInputProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<T[]>(options);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Search handling
  const handleSearch = useCallback(async (query: string) => {
    if (searchFunction && query.length >= minSearchLength) {
      setIsSearching(true);
      try {
        const results = await searchFunction(query);
        setFilteredOptions(results);
      } catch (error) {
        console.error('Search error:', error);
        setFilteredOptions([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      // Local filtering
      const filtered = options.filter(option =>
        getOptionLabel(option).toLowerCase().includes(query.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [searchFunction, options, getOptionLabel, minSearchLength]);

  // Debounced search
  const debouncedSearch = useCallback((query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(query);
    }, debounceMs);
  }, [handleSearch, debounceMs]);

  // Input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
    debouncedSearch(newValue);
  };

  // Option selection
  const handleSelectOption = (option: T) => {
    const label = getOptionLabel(option);
    const value = getOptionValue ? getOptionValue(option) : label;
    onChange(label);
    onSelect(option);
    setIsOpen(false);
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)}>
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClassName}
      />
      
      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto",
            dropdownClassName
          )}
        >
          {isSearching ? (
            <div className="p-2 text-gray-500">Searching...</div>
          ) : (
            <>
              {filteredOptions.map((option, index) => (
                <div
                  key={index}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSelectOption(option)}
                >
                  {renderOption ? renderOption(option) : getOptionLabel(option)}
                </div>
              ))}
              
              {allowCreate && onCreateNew && filteredOptions.length === 0 && (
                <div
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-blue-600"
                  onClick={onCreateNew}
                >
                  {createNewText}
                </div>
              )}
              
              {filteredOptions.length === 0 && !allowCreate && (
                <div className="p-2 text-gray-500">No results found</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

3. Create simplified version for common use cases:
```typescript
// Create a simplified version for string arrays
export function SimpleAutocomplete({
  options,
  ...props
}: Omit<AutocompleteInputProps<string>, 'getOptionLabel' | 'options'> & {
  options: string[];
}) {
  return (
    <AutocompleteInput
      {...props}
      options={options}
      getOptionLabel={(option) => option}
    />
  );
}
```

## Deliverables
- Migrated AutocompleteInput component
- Proper TypeScript generics
- Improved functionality (debouncing, search, etc.)
- Simplified version for common cases

## Success Criteria
- Component works with any data type
- Search functionality is properly debounced
- Dropdown behavior is correct
- All existing uses still work