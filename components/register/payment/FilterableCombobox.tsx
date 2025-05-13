"use client"

import { useState, useEffect, useRef, memo } from "react";
import { FilterableComboboxProps } from "./types";
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'

// Memoized version of the component to prevent unnecessary rerenders
export const FilterableCombobox = memo(function FilterableCombobox<T extends { name: string; isoCode: string; id?: number }>({
  label,
  items,
  placeholder = "Select an option...",
  id,
  name,
  value,
  onChange,
  displayValue,
  itemKey,
  filterFunction = (item, query) => 
    (item.name?.toLowerCase() || '').includes(query.toLowerCase()) ||
    (item.isoCode?.toLowerCase() || '').includes(query.toLowerCase()),
  loading = false,
  disabled = false,
}: FilterableComboboxProps<T>) {
  // Use refs for values that don't need to trigger re-renders
  const queryRef = useRef('');
  const [open, setOpen] = useState(false);
  
  // Only create state for filtered items when dropdown is open
  const [filteredItems, setFilteredItems] = useState<T[]>(items);
  
  // Update filtered items only when necessary
  const updateFilteredItems = (query: string) => {
    queryRef.current = query;
    if (open) {
      const newFilteredItems = query === ''
        ? items
        : items.filter((item) => filterFunction(item, query));
      setFilteredItems(newFilteredItems);
    }
  };

  // Reset query when value changes externally
  useEffect(() => {
    queryRef.current = '';
    // Only update filtered items when dropdown is open
    if (open) {
      setFilteredItems(items);
    }
  }, [value, items, open]);
  
  // Update filtered items when dropdown is opened
  useEffect(() => {
    if (open) {
      const newFilteredItems = queryRef.current === ''
        ? items
        : items.filter((item) => filterFunction(item, queryRef.current));
      setFilteredItems(newFilteredItems);
    }
  }, [open, items, filterFunction]);

  return (
    <Combobox
      as="div"
      value={value}
      onChange={(item: T | null) => {
        onChange(item);
        setOpen(false);
        queryRef.current = '';
      }}
      disabled={disabled || loading}
    >
      <div className="relative">
        <ComboboxInput
          id={id}
          name={name}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={loading ? "Loading..." : placeholder}
          onChange={(event) => {
            // Update filtered items when input changes
            updateFilteredItems(event.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          displayValue={displayValue}
          autoComplete="off"
        />
        <ComboboxButton 
          className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none"
          onClick={() => setOpen(prev => !prev)}
        >
          <ChevronUpDownIcon className="size-5 text-gray-400" aria-hidden="true" />
        </ComboboxButton>
        
        {open && (
          <ComboboxOptions 
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm"
            static
          >
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <ComboboxOption
                  key={itemKey(item)}
                  value={item}
                  className={({ active }) => 
                    `relative cursor-default select-none py-2 pl-3 pr-9 ${
                      active ? 'bg-primary text-primary-foreground' : 'text-gray-900'
                    }`
                  }
                >
                  {({ active, selected }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-semibold' : ''}`}>
                        {item.name}
                      </span>
                      {selected && (
                        <span 
                          className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                            active ? 'text-primary-foreground' : 'text-primary'
                          }`}
                        >
                          <CheckIcon className="size-5" aria-hidden="true" />
                        </span>
                      )}
                    </>
                  )}
                </ComboboxOption>
              ))
            ) : (
              <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                {queryRef.current !== '' ? 'No results found' : 'No options available'}
              </div>
            )}
          </ComboboxOptions>
        )}
      </div>
    </Combobox>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  // Only re-render if these specific props change
  return (
    prevProps.value === nextProps.value &&
    prevProps.items === nextProps.items &&
    prevProps.loading === nextProps.loading &&
    prevProps.disabled === nextProps.disabled
  );
});