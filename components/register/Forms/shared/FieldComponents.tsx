import React from 'react';
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
    <div className={cn("space-y-2", className)}>
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
  inputClassName 
}) => {
  return (
    <FieldWrapper label={label} name={name} required={required} error={error} className={className}>
      <Input
        id={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
}> = ({ label, name, value, onChange, error, required, disabled, placeholder, className, inputClassName }) => {
  const handleChange = (newValue: string) => {
    const formatted = formatEmail(newValue);
    onChange(formatted);
  };

  return (
    <TextField
      label={label}
      name={name}
      value={value}
      onChange={handleChange}
      type="email"
      placeholder={placeholder || "email@example.com"}
      error={error}
      required={required}
      disabled={disabled}
      className={className}
      inputClassName={inputClassName}
    />
  );
};

// Phone field with formatting
export const PhoneField: React.FC<FieldProps & {
  placeholder?: string;
  international?: boolean;
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
  inputClassName 
}) => {
  const [localError, setLocalError] = React.useState('');

  const handleChange = (newValue: string) => {
    const formatted = formatPhoneNumber(newValue);
    onChange(formatted);
    
    if (formatted && !validatePhone(formatted)) {
      setLocalError('Invalid phone number');
    } else {
      setLocalError('');
    }
  };

  return (
    <TextField
      label={label}
      name={name}
      value={value}
      onChange={handleChange}
      type="tel"
      placeholder={placeholder || "0400 000 000"}
      error={error || localError}
      required={required}
      disabled={disabled}
      className={className}
      inputClassName={inputClassName}
    />
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
  className 
}) => {
  return (
    <FieldWrapper label={label} name={name} required={required} error={error} className={className}>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger id={name} className={cn(error && "border-red-500")}>
          <SelectValue placeholder={placeholder || "Select an option"} />
        </SelectTrigger>
        <SelectContent>
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
  inputClassName 
}) => {
  return (
    <FieldWrapper label={label} name={name} required={required} error={error} className={className}>
      <Textarea
        id={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
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