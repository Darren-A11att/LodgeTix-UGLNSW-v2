"use client"

import { useState, useEffect, memo } from "react";
import { FilterableComboboxProps } from "./types";
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

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
  filterFunction,
  loading = false,
  disabled = false,
}: FilterableComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  
  // Reset query when value changes
  useEffect(() => {
    setQuery("");
  }, [value]);
  
  // Compute display value from current selection
  const currentDisplayValue = value ? displayValue(value) : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          name={name}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || loading}
        >
          {currentDisplayValue || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput
            placeholder={loading ? "Loading..." : placeholder}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>
              {query !== '' ? 'No results found' : 'No options available'}
            </CommandEmpty>
            <CommandGroup>
              {items
                .filter((item) => {
                  if (!query) return true;
                  // Use provided filter function or default to name/isoCode search
                  if (filterFunction) {
                    return filterFunction(item, query);
                  }
                  return (item.name?.toLowerCase() || '').includes(query.toLowerCase()) ||
                         (item.isoCode?.toLowerCase() || '').includes(query.toLowerCase());
                })
                .map((item) => (
                  <CommandItem
                    key={itemKey(item)}
                    value={item.name}
                    onSelect={() => {
                      onChange(item);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value && itemKey(value) === itemKey(item) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {item.name}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
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