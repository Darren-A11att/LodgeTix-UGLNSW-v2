import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Plus, Loader2 } from "lucide-react";

// Define a more flexible base type - essentially any object
// This avoids implying an index signature needed by Record<string, unknown>
export type BaseOption = object; 

// Update the generic constraint to use BaseOption
interface AutocompleteInputProps<T extends BaseOption> { 
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: T | null) => void; // Allow selecting null if input cleared/no match
  onCreateNew?: (value: string) => void;
  options: T[];
  // Make these mandatory for proper generic handling
  getOptionLabel: (option: T) => string; 
  getOptionValue: (option: T) => string | number; // Value can be string or number
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  filterOptions?: (options: T[], query: string) => T[];
  renderOption?: (option: T) => React.ReactNode;
  formatSelected?: (option: T) => string;
  allowCreate?: boolean;
  createNewText?: string;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  isLoading?: boolean;
  error?: string | null;
  searchFunction?: (query: string) => Promise<T[]>;
  searchAsYouType?: boolean;
  minSearchLength?: number;
  debounceMs?: number;
}

// Update the function signature constraint
function AutocompleteInput<T extends BaseOption>({
  id = 'autocomplete',
  name = 'autocomplete',
  value,
  onChange = (val: string) => { console.warn(`AutocompleteInput (${id}/${name}): Missing onChange handler`, val); },
  onSelect,
  onCreateNew,
  options,
  getOptionLabel,
  getOptionValue, // Remove default, must be provided
  placeholder = "",
  className = "",
  required = false,
  disabled = false,
  filterOptions,
  renderOption,
  formatSelected,
  allowCreate = false,
  createNewText = "Create",
  onFocus,
  isLoading = false,
  error = null,
  searchFunction,
  searchAsYouType = true,
  minSearchLength = 1,
  debounceMs = 300,
}: AutocompleteInputProps<T>): React.ReactElement {
  const [inputValue, setInputValue] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<T[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showCreateOption, setShowCreateOption] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // Ref for the main container
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync input value if parent value changes
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setInputValue(value);
    }
  }, [value]);

  // Handle search function
  const performSearch = useCallback(async (query: string) => {
    if (!searchFunction || query.length < minSearchLength) {
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchFunction(query);
      setFilteredOptions(results.slice(0, 10)); // Limit results
      
      // Check for exact match
      const exactMatch = results.some(
        (option) => getOptionLabel(option).toLowerCase() === query.toLowerCase()
      );
      
      setShowCreateOption(
        allowCreate && !exactMatch && query.trim().length > 0
      );
    } catch (error) {
      console.error('Search error:', error);
      setFilteredOptions([]);
      setShowCreateOption(false);
    } finally {
      setIsSearching(false);
    }
  }, [searchFunction, minSearchLength, allowCreate, getOptionLabel]);

  // Handle debounced search
  useEffect(() => {
    if (searchFunction && searchAsYouType && inputValue.trim()) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        performSearch(inputValue);
      }, debounceMs);

      return () => {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
      };
    }
  }, [inputValue, searchFunction, searchAsYouType, debounceMs, performSearch]);

  // Filter options based on input, handle loading state
  const updateFilteredOptions = useCallback(() => {
    if (searchFunction) {
      return; // Let search function handle filtering
    }

    if (!isLoading && inputValue.trim() !== "") {
      try {
        const validOptions = options.filter(opt => opt !== null && typeof opt === 'object');
        
        if (filterOptions) {
          setFilteredOptions(filterOptions(validOptions, inputValue).slice(0, 10));
        } else {
          // Default filtering
          const filtered = validOptions.filter(option => {
            const label = getOptionLabel(option).toLowerCase();
            return label.includes(inputValue.toLowerCase());
          });
          setFilteredOptions(filtered.slice(0, 10));
        }
        
        const exactMatch = validOptions.some(
          (option) => getOptionLabel(option).toLowerCase() === inputValue.toLowerCase()
        );
        
        setShowCreateOption(
          allowCreate && !exactMatch && inputValue.trim().length > 0
        );
      } catch (err) {
        console.error('Error processing options:', err);
        setFilteredOptions([]);
        setShowCreateOption(false);
      }
    } else {
      setFilteredOptions([]);
      setShowCreateOption(false);
    }
    
    setHighlightedIndex(-1);
  }, [inputValue, options, isLoading, allowCreate, getOptionLabel, filterOptions]);

  // Update filtered options when needed
  useEffect(() => {
    if (!searchFunction) {
      updateFilteredOptions();
    }
  }, [updateFilteredOptions, searchFunction]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLoading) return;
    const newValue = e.target.value;
    setInputValue(newValue);
    
    onChange(newValue); 
    
    if (!showDropdown) {
        setShowDropdown(true); 
    }
    
    if (newValue.trim() === '' || !options.some(opt => getOptionLabel(opt) === newValue)) {
       if (onSelect && typeof onSelect === 'function') {
          onSelect(null); 
       }
    }
  };

  const handleSelect = (option: T) => {
    const selectedValue = formatSelected
      ? formatSelected(option)
      : getOptionLabel(option);
    setInputValue(selectedValue);
    onChange(selectedValue);

    if (onSelect) {
      onSelect(option);
    }

    setShowDropdown(false);
  };

  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew(inputValue);
    }
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalOptions = filteredOptions.length + (showCreateOption ? 1 : 0);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < totalOptions - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      if (highlightedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[highlightedIndex]);
      } else if (showCreateOption) {
        handleCreateNew();
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const handleInputFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    if (!isLoading) {
        setShowDropdown(true);
    }
    if (onFocus) {
        onFocus(event);
    }
  };

  const handleClear = () => {
    setInputValue("");
    onChange("");
    if(onSelect) {
      onSelect(null);
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const inputClasses = `
    w-full px-4 py-2 pl-10 pr-10 border rounded-md focus:outline-none focus:ring-2 
    ${error ? 'border-red-500 focus:ring-red-500/50' : 'border-slate-300 focus:ring-primary/50'}
    ${disabled ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}
    ${className}
  `;

  const showLoading = isLoading || isSearching;

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {showLoading ? (
            <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-slate-400" />
          )}
        </div>
        {inputValue && !showLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="text-slate-400 hover:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Clear input"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          id={id}
          name={name}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={inputClasses}
          required={required}
          disabled={disabled}
          autoComplete="off"
        />
      </div>

      {showDropdown && !showLoading && (filteredOptions.length > 0 || showCreateOption) && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          <ul className="list-none p-0 m-0 w-full">
            {filteredOptions.map((option, index) => {
              const optionLabel = getOptionLabel(option);
              const optionValue = getOptionValue(option);
              const isHighlighted = index === highlightedIndex;
              return (
                <li
                  key={String(optionValue)}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-4 py-2 cursor-pointer ${isHighlighted ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100'}`}
                >
                  {renderOption ? renderOption(option) : optionLabel}
                </li>
              );
            })}

            {showCreateOption && (
              <li
                onClick={handleCreateNew}
                onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
                className={`px-4 py-2 cursor-pointer flex items-center ${highlightedIndex === filteredOptions.length ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100'}`}
              >
                <Plus className="h-4 w-4 mr-2" />
                {createNewText} "{inputValue}"
              </li>
            )}
          </ul>
        </div>
      )}
      {error && (
          <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

export { AutocompleteInput };
export default AutocompleteInput;