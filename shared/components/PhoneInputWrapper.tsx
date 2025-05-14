import React, { useState, useEffect } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import './PhoneInputWrapper.css';
import { useLocationStore } from '../../lib/locationStore';
import type { LocationState } from '../../lib/locationStore';

interface PhoneInputWrapperProps {
  value: string;
  onChange: (value: string) => void;
  name: string;
  isInternational?: boolean;
  className?: string;
  required?: boolean;
  inputProps?: {
    id?: string;
    name?: string;
  };
}

const PhoneInputWrapper: React.FC<PhoneInputWrapperProps> = ({
  value,
  onChange,
  name,
  isInternational = false,
  className = "",
  required = false,
  inputProps = {},
}) => {
  // Get country code from global store
  const detectedCountryCode = useLocationStore(
    (state) => state.ipData?.country_code
  );

  // Track display value separately from the stored value
  const [displayValue, setDisplayValue] = useState<string>('');

  // Determine the country to use: detected or default 'au'
  const country = (detectedCountryCode?.toLowerCase() as any) || "au";
  
  // Initialize the display value based on the stored value
  useEffect(() => {
    if (value) {
      // If we have a stored value, format it for display
      if (value.startsWith('+61') && value.length >= 12) {
        // Australian mobile number format: +614XXXXXXXX -> 04XX XXX XXX
        const rawMobile = value.replace('+614', '04');
        if (rawMobile.length === 10) {
          // Format: 04XX XXX XXX
          const formattedMobile = rawMobile.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
          setDisplayValue(formattedMobile);
        } else {
          setDisplayValue(rawMobile);
        }
      } else {
        // Not an Australian mobile, just use as is
        setDisplayValue(value);
      }
    } else {
      // No value, empty display
      setDisplayValue('');
    }
  }, [value]);

  // Handle changes from the phone input component
  const handlePhoneChange = (newValue: string | undefined) => {
    if (!newValue) {
      onChange("");
      setDisplayValue("");
      return;
    }

    // If the country is Australia, handle special formatting
    if (country === 'au') {
      // Remove all non-digit characters to get clean number
      const digitsOnly = newValue.replace(/\D/g, '');
      
      // If Australian mobile format (starting with 04)
      if (digitsOnly.startsWith('04') && digitsOnly.length <= 10) {
        // Format for display: 04XX XXX XXX
        let formattedDisplay = digitsOnly;
        if (digitsOnly.length >= 4) {
          formattedDisplay = digitsOnly.slice(0, 4);
          if (digitsOnly.length >= 7) {
            formattedDisplay += ' ' + digitsOnly.slice(4, 7);
            if (digitsOnly.length > 7) {
              formattedDisplay += ' ' + digitsOnly.slice(7, 10);
            }
          } else if (digitsOnly.length > 4) {
            formattedDisplay += ' ' + digitsOnly.slice(4);
          }
        }
        
        setDisplayValue(formattedDisplay);
        
        // For storing in Zustand: convert to +614XXXXXXXX format
        if (digitsOnly.length === 10) {
          // Only convert to international format if we have a complete number
          const internationalFormat = '+61' + digitsOnly.substring(1); // Replace '0' with '+61'
          onChange(internationalFormat);
        } else {
          // For incomplete numbers, store as is so we can continue editing
          onChange(digitsOnly);
        }
      } else {
        // Not an Australian mobile or longer than 10 digits, handle normally
        setDisplayValue(newValue);
        onChange(newValue);
      }
    } else {
      // Not Australia, handle normally
      setDisplayValue(newValue);
      onChange(newValue);
    }
  };

  return (
    <div className={`custom-phone-input ${className}`}>
      <PhoneInput
        country={country}
        value={displayValue}
        onChange={handlePhoneChange}
        inputProps={{
          name: name,
          required: required
        }}
        placeholder=""
        enableSearch={true}
        preferredCountries={['au', 'nz', 'gb', 'us']}
        labels={{
          search: "Search",
          searchPlaceholder: "Search country..."
        }}
      />
      {required && (
        <input
          type="hidden"
          required={required}
          value={value}
          onChange={() => {}}
        />
      )}
    </div>
  );
};

export default PhoneInputWrapper;