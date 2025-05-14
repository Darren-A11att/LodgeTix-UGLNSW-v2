import React, { useState, useEffect, useRef } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { useLocationStore } from '../../../lib/locationStore';
import type { LocationState } from '../../../lib/locationStore';

interface PhoneInputWrapperProps {
  value: string;
  onChange: (value: string) => void;
  inputProps?: any;
  className?: string;
  required?: boolean;
}

/**
 * PhoneInputWrapper that handles Australian mobile numbers in a user-friendly way.
 * - Allows users to enter numbers in local format (04XX XXX XXX)
 * - Stores numbers in international format (+614XXXXXXXX) for the state
 * - Doesn't convert input for display - shows exactly what the user types
 * - Doesn't pre-fill the field with formatted values
 */
const PhoneInputWrapper: React.FC<PhoneInputWrapperProps> = ({
  value,
  onChange,
  inputProps = {},
  className = '',
  required = false
}) => {
  const [isValid, setIsValid] = useState(true);
  const [displayValue, setDisplayValue] = useState('');
  const initialized = useRef(false);

  // Get country code from global store
  const detectedCountryCode = useLocationStore(
    (state: LocationState) => state.ipData?.country_code
  );

  // Always use Australia
  const country = 'au';

  // Initialize validation state based on incoming value
  useEffect(() => {
    if (!initialized.current && value) {
      initialized.current = true;
      const valid = validateNumber(value);
      setIsValid(valid);
    }
  }, [value]);

  // Convert to international format for storage only
  const formatForStorage = (inputValue: string): string => {
    // If empty, return empty
    if (!inputValue) return '';

    // Remove all non-digits except the plus sign at the beginning
    const cleanedValue = inputValue.replace(/[^\d+]/g, '');

    // If already in international format (starts with +), keep as is
    if (cleanedValue.startsWith('+')) {
      return cleanedValue.substring(1); // Remove the + for our storage format
    }

    // If it's an Australian mobile starting with 04, convert to 614...
    if (cleanedValue.startsWith('04')) {
      return `61${cleanedValue.substring(1)}`;
    }

    // Default - return the cleaned value
    return cleanedValue;
  };

  // Validate the phone number
  const validateNumber = (inputValue: string): boolean => {
    if (!inputValue) return !required;

    try {
      // First try validating with libphonenumber
      const normalized = formatForStorage(inputValue);
      return isValidPhoneNumber(`+${normalized}`);
    } catch (e) {
      // For Australian mobiles, do a simple length check
      const digitsOnly = inputValue.replace(/\D/g, '');
      if (digitsOnly.startsWith('04')) {
        return digitsOnly.length === 10; // Australian mobiles are 10 digits (04XX XXX XXX)
      }
      return false;
    }
  };

 // Handle input change
  const handleChange = (rawInputValue: string, countryData: any, event: React.ChangeEvent<HTMLInputElement>) => {
    // Get the direct input value from the event - what the user actually typed
    const currentInputVal = event.target.value;

    // Remove any country code prefixes the component might add
    const cleanedInput = currentInputVal.replace(/^\+\d+\s+/, '');

    setDisplayValue(cleanedInput);

    // Convert to international format for storage
    const storageValue = formatForStorage(cleanedInput);

    // Validate
    const valid = validateNumber(cleanedInput);
    setIsValid(valid);

    // Call parent onChange with the standardized format for storage
    onChange(storageValue);
  };

  return (
    <div className="relative">
      <PhoneInput
        country={country}
        value={displayValue} // Only use what the user has typed, don't use value from props
        onChange={handleChange}
        containerClass={`w-full ${className}`}
        inputProps={{
          required,
          ...inputProps,
          pattern: null,
          placeholder: "",
          type: "tel"
        }}
        enableSearch={true}
        autoFormat={false}
        disableSearchIcon={true}
        countryCodeEditable={false}
        specialLabel={''}
        placeholder=""
        masks={{}}
        enableAreaCodes={false}
        enableTerritories={false}
        onlyCountries={['au']}
        formatOnInit={false}
        disableCountryCode={true}
        initialValueFormat="input"
        excludeCountries={[]}
        jumpCursorToEnd={false}
        autocompleteSearch={false}
        defaultMask="..........}"
        alwaysDefaultMask={false}
        prefix=""
        inputStyle={{
          width: '100%',
          height: '2.75rem',
          fontSize: '16px',
          paddingLeft: '1px' // Reduced padding to move text closer to flag
        }}
        buttonStyle={{
          backgroundColor: 'white',
          borderRight: 'none',
          paddingLeft: '5px',
          width: '10px' // Narrower width for the button
        }}
      />

      {/* Helper text showing the international format only if user has typed something */}
      {displayValue && (
        <div className="mt-1 text-xs text-slate-500 pl-12">
          {isValid ? 'Format: ' : 'Invalid format: '}{formatInternational(displayValue)}
        </div>
      )}

      {/* Success indicator for valid numbers only if user has typed something */}
      {isValid && displayValue && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2 text-green-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default PhoneInputWrapper;