"use client"

import * as React from "react"
import { memo } from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Controller, useFormContext } from "react-hook-form"
import { z } from "zod"

// Phone number validation patterns
const AUSTRALIAN_MOBILE_REGEX = /^(?:\+?61|0)4\d{8}$/
const AUSTRALIAN_LANDLINE_REGEX = /^(?:\+?61|0)[2378]\d{8}$/
const INTERNATIONAL_PHONE_REGEX = /^\+(?:[0-9]){6,15}$/

export const phoneNumberSchema = z.string()
  .refine(
    (value) => {
      if (!value) return true // Allow empty string
      
      // Clean the input value (remove spaces and other formatting characters)
      const cleaned = value.replace(/[^\d+]/g, "")
      
      // Check if it's a valid Australian mobile number
      if (AUSTRALIAN_MOBILE_REGEX.test(cleaned)) return true
      
      // Check if it's a valid Australian landline number
      if (AUSTRALIAN_LANDLINE_REGEX.test(cleaned)) return true
      
      // Check if it's a valid international number (must start with +)
      if (cleaned.startsWith('+') && INTERNATIONAL_PHONE_REGEX.test(cleaned)) return true
      
      // If it has 8+ digits but doesn't match the patterns above, treat as an international number
      if (cleaned.length >= 8 && !cleaned.startsWith('0') && !cleaned.startsWith('+61')) {
        return true
      }
      
      return false
    },
    {
      message: "Please enter a valid Australian mobile, landline, or international phone number",
    }
  )

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "defaultValue"> {
  name: string
  label?: string
  error?: string
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onBlur?: (value: string) => void
  required?: boolean
}

export const PhoneInput = memo(function PhoneInput({
  className,
  name,
  label,
  error,
  value,
  defaultValue,
  onChange = () => {},
  onBlur,
  required = false,
  ...props
}: PhoneInputProps) {
  const methods = useFormContext()
  
  // Use refs for tracking values to reduce re-renders
  const displayValueRef = React.useRef<string>(defaultValue || value || '')
  const internationalValueRef = React.useRef<string>(defaultValue || value || '')
  const isInitialLoadRef = React.useRef(true)
  
  // State only for tracking displayed value
  const [displayValue, setDisplayValue] = React.useState<string>(defaultValue || value || '')
  
  // Convert from international format to local format (for loading saved data)
  const convertToLocalFormat = (internationalNumber: string): string => {
    if (!internationalNumber) return ""
    
    // Clean the input (without spaces)
    const cleaned = internationalNumber.replace(/\s/g, '')
    
    // Australian mobile with international prefix (+61438871124)
    if (cleaned.startsWith("+614") && cleaned.length >= 12) {
      // Convert +614XXXXXXXX to 04XXXXXXXX format
      return `0${cleaned.substring(3)}`
    }
    
    // Australian landline with international prefix (+61297730048)
    if (/^\+61[2378]/.test(cleaned) && cleaned.length >= 12) {
      // Convert +61XXXXXXXX to 0XXXXXXXX format
      return `0${cleaned.substring(3)}`
    }
    
    // For other international numbers, leave as is
    return internationalNumber
  }
  
  // Format user input for display
  const formatUserInput = (userInput: string): string => {
    if (!userInput) return ""
    
    // Remove all spaces first to normalize
    const noSpaces = userInput.replace(/\s/g, '')
    
    // CASE 1: Australian mobile number in local format (0438871124)
    if (noSpaces.startsWith("04") && noSpaces.length >= 10) {
      // Format as 0438 871 124
      return `${noSpaces.substring(0, 4)} ${noSpaces.substring(4, 7)} ${noSpaces.substring(7, 10)}${noSpaces.length > 10 ? ` ${noSpaces.substring(10)}` : ''}`
    }
    
    // CASE 2: Australian landline in local format (0297730048)
    if (/^0[2378]/.test(noSpaces) && noSpaces.length >= 10) {
      // Format as 02 9773 0048
      return `${noSpaces.substring(0, 2)} ${noSpaces.substring(2, 6)} ${noSpaces.substring(6)}`
    }
    
    // CASE 3: Australian mobile in international format (+61438871124)
    if (noSpaces.startsWith('+614') && noSpaces.length >= 12) {
      // Format as +61 438 871 124
      return `+61 ${noSpaces.substring(3, 6)} ${noSpaces.substring(6, 9)} ${noSpaces.substring(9)}`
    }
    
    // CASE 4: Australian landline in international format (+61297730048)
    if (/^\+61[2378]/.test(noSpaces) && noSpaces.length >= 12) {
      // Format as +61 2 9773 0048
      return `+61 ${noSpaces.substring(3, 4)} ${noSpaces.substring(4, 8)} ${noSpaces.substring(8)}`
    }
    
    // CASE 5: Other international numbers
    if (noSpaces.startsWith('+')) {
      // Basic formatting for other international numbers
      const countryCode = noSpaces.substring(0, 3); // Get first 3 chars (like +1 or +44)
      const rest = noSpaces.substring(3);
      
      // Add spaces every 3 digits for readability
      const formatted = rest.replace(/(\d{3})(?=\d)/g, '$1 ');
      return `${countryCode} ${formatted}`;
    }
    
    // For any other formats or partial numbers, leave as is
    return userInput
  }
  
  // Format to international E.164 format for storage
  const formatToInternational = (input: string): string => {
    if (!input) return ""
    
    // Remove all non-digits except the plus sign at the beginning
    const cleaned = input.replace(/[^\d+]/g, "")
    
    // If already in international format (starts with +), keep as is
    if (cleaned.startsWith("+")) {
      return cleaned
    }
    
    // Remove all non-digits now that we've handled the + case
    const digits = cleaned.replace(/\D/g, "")
    
    // Australian mobile numbers - Convert 04XXXXXXXX to +614XXXXXXXX
    if (digits.startsWith("04") && digits.length === 10) {
      return `+61${digits.substring(1)}`
    }
    
    // Australian landlines - Convert 0XXXXXXXX to +61XXXXXXXX
    if (/^0[2378]/.test(digits) && digits.length === 10) {
      return `+61${digits.substring(1)}`
    }
    
    // Already in international format without +
    if (digits.startsWith("61") && (digits.length >= 10)) {
      return `+${digits}`
    }
    
    // Handle other international numbers (if they don't start with 0)
    if (!digits.startsWith("0") && digits.length > 8) {
      return `+${digits}`
    }
    
    // Default case - just return cleaned digits
    return digits
  }
  
  // Initialize from value/defaultValue/methods (if coming from stored data)
  React.useEffect(() => {
    // Handle initialization from props
    if (isInitialLoadRef.current) {
      // First priority: methods form data
      if (methods) {
        const storedValue = methods.getValues(name)
        
        if (storedValue && typeof storedValue === 'string') {
          // Store the international format in the hidden field
          internationalValueRef.current = storedValue
          
          // Convert international format to local format for display
          const localFormat = convertToLocalFormat(storedValue)
          
          // Format the local version for display
          const formattedForDisplay = formatUserInput(localFormat)
          
          // Set the display value to the local format
          displayValueRef.current = formattedForDisplay
          setDisplayValue(formattedForDisplay)
        }
      }
      // Second priority: value prop (controlled component mode)
      else if (value) {
        internationalValueRef.current = value
        const localFormat = convertToLocalFormat(value)
        const formattedForDisplay = formatUserInput(localFormat)
        displayValueRef.current = formattedForDisplay
        setDisplayValue(formattedForDisplay)
      }
      // Third priority: defaultValue prop (uncontrolled component mode)
      else if (defaultValue) {
        internationalValueRef.current = defaultValue
        const localFormat = convertToLocalFormat(defaultValue)
        const formattedForDisplay = formatUserInput(localFormat)
        displayValueRef.current = formattedForDisplay
        setDisplayValue(formattedForDisplay)
      }
      
      isInitialLoadRef.current = false
    }
  }, [methods, name, value, defaultValue])
  
  // Handle input changes - debounce actual state updates
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value
    
    // Update local display value immediately for responsive UI
    setDisplayValue(rawInput) // Keep exactly what user typed, don't format yet
    
    // Update refs but don't trigger re-renders
    displayValueRef.current = rawInput
    
    // Convert to international format for storage
    const international = formatToInternational(rawInput)
    internationalValueRef.current = international
    
    // Only call onChange on blur to reduce state updates
  }
  
  // Handle blur event (format when user leaves the field)
  const handleBlur = () => {
    // Format the display value when user finishes typing
    const formattedValue = formatUserInput(displayValueRef.current)
    setDisplayValue(formattedValue)
    
    // Call onChange with the international format only when field loses focus
    if (onChange) {
      onChange(internationalValueRef.current)
    }
    
    // Call onBlur if provided
    if (onBlur) {
      onBlur(internationalValueRef.current)
    }
  }
  
  // For react-hook-form controlled input
  if (methods) {
    return (
      <Controller
        name={name}
        control={methods.control}
        render={({ field, fieldState }) => (
          <FormItem className={className}>
            {label && (
              <FormLabel htmlFor={name} className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}>
                {label}
              </FormLabel>
            )}
            <FormControl>
              <div className="relative">
                <Input
                  id={name}
                  type="tel"
                  placeholder=""
                  value={displayValue}
                  onChange={(e) => {
                    const rawInput = e.target.value
                    
                    // Keep what the user types in the display field
                    setDisplayValue(rawInput) // Unformatted raw input
                    displayValueRef.current = rawInput
                    
                    // Store international format in ref but don't update form yet
                    const international = formatToInternational(rawInput)
                    internationalValueRef.current = international
                  }}
                  onBlur={() => {
                    // Format only on blur
                    const formattedValue = formatUserInput(displayValueRef.current)
                    setDisplayValue(formattedValue)
                    
                    // Only update form if value changed
                    if (internationalValueRef.current !== field.value) {
                      field.onChange(internationalValueRef.current)
                    }
                    field.onBlur()
                  }}
                  className={cn(
                    fieldState.error && "border-red-500 focus-visible:ring-red-500"
                  )}
                  required={required}
                  {...props}
                />
                
                {/* Hidden input to store international format */}
                <input 
                  type="hidden" 
                  id={`${name}-international`} 
                  name={`${name}-international`} 
                  value={internationalValueRef.current} 
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }
  
  // For uncontrolled input
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label 
          htmlFor={name} 
          className={cn(
            "text-sm font-medium", 
            required && "after:content-['*'] after:ml-0.5 after:text-red-500"
          )}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <Input
          id={name}
          name={name}
          type="tel"
          placeholder=""
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className={cn(error && "border-red-500 focus-visible:ring-red-500")}
          required={required}
          {...props}
        />
        
        {/* Hidden input to store international format */}
        <input 
          type="hidden" 
          id={`${name}-international`} 
          name={`${name}-international`} 
          value={internationalValueRef.current} 
        />
      </div>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return prevProps.value === nextProps.value;
})