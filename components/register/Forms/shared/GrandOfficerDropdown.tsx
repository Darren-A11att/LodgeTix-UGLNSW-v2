import React, { useState, useEffect, useRef } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import * as SelectPrimitive from "@radix-ui/react-select";
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface GrandOfficerDropdownProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

// Custom SelectItem without check icon
const CustomSelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
CustomSelectItem.displayName = "CustomSelectItem";

// A robust dropdown specifically for Grand Officer roles
// Designed to maintain state during Fast Refresh
export const GrandOfficerDropdown: React.FC<GrandOfficerDropdownProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  error,
  required = false,
  disabled = false,
  className,
}) => {
  // Use local state to ensure dropdown maintains state during refresh
  const [localValue, setLocalValue] = useState(value);
  // Refs to track if selection is in progress
  const selectionInProgress = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Keep local value in sync with prop value
  useEffect(() => {
    if (!selectionInProgress.current) {
      setLocalValue(value);
    }
  }, [value]);
  
  // Handle change with debounce to prevent Fast Refresh issues
  const handleValueChange = (newValue: string) => {
    console.log(`GrandOfficerDropdown: Selected ${newValue} (previous: ${localValue})`);
    
    // Mark selection as in progress to prevent state overrides
    selectionInProgress.current = true;
    setLocalValue(newValue);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Use a timeout to ensure the selection is processed 
    // even if Fast Refresh triggers
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
      // Reset selection flag after a delay to catch Fast Refresh
      setTimeout(() => {
        selectionInProgress.current = false;
      }, 500);
    }, 50);
  };
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <Select
        value={localValue}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger 
          id={name} 
          className={cn(
            error && "border-red-500",
            "relative z-20" // Higher z-index
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent 
          className="z-50" 
          position="popper"
          sideOffset={5}
        >
          {options.map((option) => (
            <CustomSelectItem 
              key={option.value} 
              value={option.value}
              className="cursor-pointer"
            >
              {option.label}
            </CustomSelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}; 