import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

// Basic formatters
const formatEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Australian mobile formatting
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  }
  
  // International format
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  return cleaned;
};

// Basic validators
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Australian mobile
  if (cleaned.startsWith('04') && cleaned.length === 10) {
    return true;
  }
  
  // International format (min 7 digits after country code)
  if (cleaned.length >= 7 && cleaned.length <= 15) {
    return true;
  }
  
  return false;
};

interface FieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  updateOnBlur?: boolean;
}

// Base field wrapper
const FieldWrapper: React.FC<{
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ label, name, required, error, className, children }) => {
  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

// Text field
export const TextField: React.FC<FieldProps & {
  type?: string;
  placeholder?: string;
  maxLength?: number;
}> = ({ 
  label, 
  name, 
  value, 
  onChange, 
  error, 
  required, 
  disabled, 
  type = "text", 
  placeholder, 
  maxLength,
  className,
  inputClassName,
  updateOnBlur = true // Default to updating store only on blur
}) => {
  const [localValue, setLocalValue] = useState(value);
  
  // Update local value when prop value changes from parent
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle input change locally without propagating to parent/store
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // Only update the store immediately if updateOnBlur is false
    if (!updateOnBlur) {
      onChange(newValue);
    }
  };
  
  // When field loses focus, update the store with current value
  const handleBlur = () => {
    if (updateOnBlur && localValue !== value) {
      onChange(localValue);
    }
  };
  
  return (
    <FieldWrapper label={label} name={name} required={required} error={error} className={className}>
      <Input
        id={name}
        type={type}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className={cn(error && "border-red-500", inputClassName)}
      />
    </FieldWrapper>
  );
};

// Email field - uses HTML5 email validation
export const EmailField: React.FC<FieldProps & {
  placeholder?: string;
  updateOnBlur?: boolean;
}> = ({ label, name, value, onChange, error, required, disabled, placeholder, className, inputClassName, updateOnBlur = true }) => {
  const [localValue, setLocalValue] = useState(value);
  const [localError, setLocalError] = useState('');
  
  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  // Handle change locally with email formatting
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const formatted = formatEmail(newValue);
    setLocalValue(formatted);
    
    // Validate immediately for user feedback
    if (formatted && formatted.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setLocalError(emailRegex.test(formatted) ? '' : 'Invalid email format');
    } else {
      setLocalError('');
    }
    
    // Only update parent immediately if not using blur
    if (!updateOnBlur) {
      onChange(formatted);
    }
  };
  
  // Update parent on blur
  const handleBlur = () => {
    if (updateOnBlur && localValue !== value) {
      onChange(localValue);
    }
  };

  return (
    <FieldWrapper label={label} name={name} required={required} error={error || localError} className={className}>
      <Input
        id={name}
        type="email"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder || "email@example.com"}
        disabled={disabled}
        className={cn((error || localError) && "border-red-500", inputClassName)}
      />
    </FieldWrapper>
  );
};

// Phone field with formatting
export const PhoneField: React.FC<FieldProps & {
  placeholder?: string;
  international?: boolean;
  updateOnBlur?: boolean;
}> = ({ 
  label, 
  name, 
  value, 
  onChange, 
  error, 
  required, 
  disabled, 
  placeholder, 
  international = true,
  className, 
  inputClassName,
  updateOnBlur = true
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [localError, setLocalError] = useState('');
  
  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle local change with formatting
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const formatted = formatPhoneNumber(newValue);
    setLocalValue(formatted);
    
    // Validation check happens immediately for UX feedback
    if (formatted && !validatePhone(formatted)) {
      setLocalError('Invalid phone number');
    } else {
      setLocalError('');
    }
    
    // Only update parent immediately if not using blur
    if (!updateOnBlur) {
      onChange(formatted);
    }
  };
  
  // Update parent on blur
  const handleBlur = () => {
    if (updateOnBlur && localValue !== value) {
      onChange(localValue);
    }
  };

  return (
    <FieldWrapper label={label} name={name} required={required} error={error || localError} className={className}>
      <Input
        id={name}
        type="tel"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder || "0400 000 000"}
        disabled={disabled}
        className={cn((error || localError) && "border-red-500", inputClassName)}
      />
    </FieldWrapper>
  );
};

// Select field
export const SelectField: React.FC<{
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
  updateOnBlur?: boolean;
}> = ({ 
  label, 
  name, 
  value, 
  onChange, 
  options, 
  placeholder, 
  error, 
  required, 
  disabled, 
  className,
  updateOnBlur = true // Change to true by default to match other components
}) => {
  // Track value changes with useEffect to prevent focus issues
  const [localValue, setLocalValue] = useState(value);
  
  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle value change with additional state management
  const handleValueChange = (newValue: string) => {
    // Log the selection for debugging
    console.log(`Selection in ${name}:`, newValue);
    
    // Update local state first
    setLocalValue(newValue);
    
    // Then propagate to parent
    onChange(newValue);
  };
  
  return (
    <FieldWrapper label={label} name={name} required={required} error={error} className={className}>
      <Select
        value={localValue}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger id={name} className={cn(error && "border-red-500", "px-3 py-2 h-10 text-base md:text-sm justify-between")}>
          <SelectValue placeholder={placeholder || "Select an option"} />
        </SelectTrigger>
        <SelectContent className="z-50">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldWrapper>
  );
};

// Textarea field
export const TextareaField: React.FC<FieldProps & {
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  updateOnBlur?: boolean;
}> = ({ 
  label, 
  name, 
  value, 
  onChange, 
  error, 
  required, 
  disabled, 
  placeholder, 
  rows = 3, 
  maxLength,
  className,
  inputClassName,
  updateOnBlur = true // Default to updating store only on blur
}) => {
  const [localValue, setLocalValue] = useState(value);
  
  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  // Handle input change locally
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // Only update parent/store immediately if not using blur
    if (!updateOnBlur) {
      onChange(newValue);
    }
  };
  
  // When field loses focus, update parent/store
  const handleBlur = () => {
    if (updateOnBlur && localValue !== value) {
      onChange(localValue);
    }
  };
  
  return (
    <FieldWrapper label={label} name={name} required={required} error={error} className={className}>
      <Textarea
        id={name}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        className={cn(error && "border-red-500", inputClassName)}
      />
    </FieldWrapper>
  );
};

// Name fields group
export const NameFieldGroup: React.FC<{
  firstNameValue: string;
  lastNameValue: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  firstNameError?: string;
  lastNameError?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}> = ({ 
  firstNameValue, 
  lastNameValue, 
  onFirstNameChange, 
  onLastNameChange,
  firstNameError,
  lastNameError,
  required,
  disabled,
  className 
}) => {
  return (
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      <TextField
        label="First Name"
        name="firstName"
        value={firstNameValue}
        onChange={onFirstNameChange}
        error={firstNameError}
        required={required}
        disabled={disabled}
      />
      <TextField
        label="Last Name"
        name="lastName"
        value={lastNameValue}
        onChange={onLastNameChange}
        error={lastNameError}
        required={required}
        disabled={disabled}
      />
    </div>
  );
};

// Contact fields group
export const ContactFieldGroup: React.FC<{
  emailValue: string;
  phoneValue: string;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  emailError?: string;
  phoneError?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}> = ({ 
  emailValue, 
  phoneValue, 
  onEmailChange, 
  onPhoneChange,
  emailError,
  phoneError,
  required,
  disabled,
  className 
}) => {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
      <EmailField
        label="Email"
        name="email"
        value={emailValue}
        onChange={onEmailChange}
        error={emailError}
        required={required}
        disabled={disabled}
      />
      <PhoneField
        label="Phone"
        name="phone"
        value={phoneValue}
        onChange={onPhoneChange}
        error={phoneError}
        required={required}
        disabled={disabled}
      />
    </div>
  );
};

export default TextField;