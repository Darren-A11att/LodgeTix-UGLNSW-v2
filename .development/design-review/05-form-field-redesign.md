# Step 05: Refactor Form Fields

## System Prompt
You are redesigning form fields to use the new layout system, implement responsive sizing, add proper labels and error states, and ensure touch-friendly inputs across the LodgeTix platform.

## Implementation Checklist

### 1. Create Base Input Component

Location: `/components/register/fields/BaseInput.tsx`

```typescript
import { cn } from '@/lib/utils'
import { forwardRef, InputHTMLAttributes } from 'react'

interface BaseInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  touched?: boolean
}

export const BaseInput = forwardRef<HTMLInputElement, BaseInputProps>(
  ({ className, error, touched, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full min-h-input px-3 py-2',
          'border rounded-button',
          'text-base text-gray-900',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2',
          // Default state
          'border-gray-300 focus:border-secondary focus:ring-secondary',
          // Error state
          error && touched && [
            'border-error focus:border-error focus:ring-error',
            'text-red-900 placeholder-red-400'
          ],
          // Disabled state
          'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
    )
  }
)

BaseInput.displayName = 'BaseInput'
```

### 2. Create Field Wrapper Component

Location: `/components/register/fields/FieldWrapper.tsx`

```typescript
import { cn } from '@/lib/utils'
import { Label, ErrorText } from '@/components/ui/typography'
import { FieldLayout } from '@/components/register/core'
import { ReactNode } from 'react'

interface FieldWrapperProps {
  children: ReactNode
  label?: string
  error?: string
  touched?: boolean
  required?: boolean
  size?: 'small' | 'medium' | 'large' | 'full'
  className?: string
  fieldId?: string
  hint?: string
}

export function FieldWrapper({
  children,
  label,
  error,
  touched,
  required,
  size = 'medium',
  className,
  fieldId,
  hint
}: FieldWrapperProps) {
  const showError = error && touched
  
  return (
    <FieldLayout size={size} className={className}>
      <div className="w-full">
        {label && (
          <Label htmlFor={fieldId} required={required}>
            {label}
          </Label>
        )}
        {hint && (
          <p className="text-sm text-gray-500 mb-1">{hint}</p>
        )}
        <div className="relative">
          {children}
        </div>
        {showError && (
          <ErrorText>{error}</ErrorText>
        )}
      </div>
    </FieldLayout>
  )
}
```

### 3. Update TextField Component

Location: `/components/register/fields/TextField.tsx`

```typescript
import { forwardRef } from 'react'
import { BaseInput } from './BaseInput'
import { FieldWrapper } from './FieldWrapper'
import { UseFormRegisterReturn } from 'react-hook-form'

interface TextFieldProps {
  label?: string
  error?: string
  touched?: boolean
  required?: boolean
  size?: 'small' | 'medium' | 'large' | 'full'
  hint?: string
  registration?: UseFormRegisterReturn
  type?: 'text' | 'email' | 'tel' | 'url' | 'password'
  placeholder?: string
  autoComplete?: string
  fieldId?: string
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ 
    label,
    error,
    touched,
    required,
    size = 'medium',
    hint,
    registration,
    fieldId,
    ...inputProps 
  }, ref) => {
    const id = fieldId || registration?.name
    
    return (
      <FieldWrapper
        label={label}
        error={error}
        touched={touched}
        required={required}
        size={size}
        hint={hint}
        fieldId={id}
      >
        <BaseInput
          ref={ref}
          id={id}
          error={!!error}
          touched={touched}
          {...registration}
          {...inputProps}
        />
      </FieldWrapper>
    )
  }
)

TextField.displayName = 'TextField'
```

### 4. Update SelectField Component

Location: `/components/register/fields/SelectField.tsx`

```typescript
import { cn } from '@/lib/utils'
import { forwardRef, SelectHTMLAttributes } from 'react'
import { FieldWrapper } from './FieldWrapper'
import { UseFormRegisterReturn } from 'react-hook-form'

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  touched?: boolean
  required?: boolean
  size?: 'small' | 'medium' | 'large' | 'full'
  hint?: string
  registration?: UseFormRegisterReturn
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ 
    label,
    error,
    touched,
    required,
    size = 'medium',
    hint,
    registration,
    options,
    placeholder,
    className,
    ...selectProps 
  }, ref) => {
    const id = registration?.name
    
    return (
      <FieldWrapper
        label={label}
        error={error}
        touched={touched}
        required={required}
        size={size}
        hint={hint}
        fieldId={id}
      >
        <select
          ref={ref}
          id={id}
          className={cn(
            'w-full min-h-input px-3 py-2',
            'border rounded-button',
            'text-base text-gray-900',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2',
            'appearance-none',
            'bg-white bg-no-repeat bg-right',
            'bg-[length:20px]',
            // Custom arrow
            'bg-[url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTcgN0wxMCAxMEwxMyA3IiBzdHJva2U9IiM2Qjc2ODAiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+")]',
            // Default state
            'border-gray-300 focus:border-secondary focus:ring-secondary',
            // Error state
            error && touched && [
              'border-error focus:border-error focus:ring-error',
              'text-red-900'
            ],
            // Disabled state
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            className
          )}
          {...registration}
          {...selectProps}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FieldWrapper>
    )
  }
)

SelectField.displayName = 'SelectField'
```

### 5. Update TextareaField Component

Location: `/components/register/fields/TextareaField.tsx`

```typescript
import { cn } from '@/lib/utils'
import { forwardRef, TextareaHTMLAttributes } from 'react'
import { FieldWrapper } from './FieldWrapper'
import { UseFormRegisterReturn } from 'react-hook-form'

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  touched?: boolean
  required?: boolean
  size?: 'small' | 'medium' | 'large' | 'full'
  hint?: string
  registration?: UseFormRegisterReturn
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ 
    label,
    error,
    touched,
    required,
    size = 'full',
    hint,
    registration,
    className,
    rows = 4,
    ...textareaProps 
  }, ref) => {
    const id = registration?.name
    
    return (
      <FieldWrapper
        label={label}
        error={error}
        touched={touched}
        required={required}
        size={size}
        hint={hint}
        fieldId={id}
      >
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          className={cn(
            'w-full px-3 py-2',
            'border rounded-button',
            'text-base text-gray-900',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2',
            'resize-y min-h-[100px]',
            // Default state
            'border-gray-300 focus:border-secondary focus:ring-secondary',
            // Error state
            error && touched && [
              'border-error focus:border-error focus:ring-error',
              'text-red-900 placeholder-red-400'
            ],
            // Disabled state
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            className
          )}
          {...registration}
          {...textareaProps}
        />
      </FieldWrapper>
    )
  }
)

TextareaField.displayName = 'TextareaField'
```

### 6. Create Checkbox and Radio Components

Location: `/components/register/fields/CheckboxField.tsx`

```typescript
import { cn } from '@/lib/utils'
import { forwardRef, InputHTMLAttributes } from 'react'
import { UseFormRegisterReturn } from 'react-hook-form'

interface CheckboxFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
  touched?: boolean
  registration?: UseFormRegisterReturn
  hint?: string
}

export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ 
    label,
    error,
    touched,
    registration,
    hint,
    className,
    ...inputProps 
  }, ref) => {
    const id = registration?.name
    const showError = error && touched
    
    return (
      <div className={cn('relative', className)}>
        <div className="flex items-start">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            className={cn(
              'mt-1 h-4 w-4 rounded',
              'border-gray-300',
              'text-secondary',
              'focus:ring-2 focus:ring-secondary',
              'transition-colors duration-200',
              showError && 'border-error'
            )}
            {...registration}
            {...inputProps}
          />
          <div className="ml-3">
            <label htmlFor={id} className="text-sm font-medium text-gray-700">
              {label}
            </label>
            {hint && (
              <p className="text-sm text-gray-500">{hint}</p>
            )}
          </div>
        </div>
        {showError && (
          <p className="text-sm text-error mt-1 ml-7">{error}</p>
        )}
      </div>
    )
  }
)

CheckboxField.displayName = 'CheckboxField'
```

### 7. Form Field Usage Examples

#### Basic Form Layout
```typescript
import { FormGrid, FormSection } from '@/components/register/core'
import { TextField, SelectField, TextareaField } from '@/components/register/fields'

function ExampleForm() {
  const { register, formState: { errors, touchedFields } } = useForm()
  
  return (
    <form>
      <FormSection title="Personal Information">
        <FormGrid>
          <TextField
            label="Title"
            size="small"
            registration={register('title')}
            error={errors.title?.message}
            touched={touchedFields.title}
            options={[
              { value: 'mr', label: 'Mr' },
              { value: 'mrs', label: 'Mrs' },
              { value: 'ms', label: 'Ms' },
            ]}
          />
          
          <TextField
            label="First Name"
            size="medium"
            required
            registration={register('firstName')}
            error={errors.firstName?.message}
            touched={touchedFields.firstName}
          />
          
          <TextField
            label="Last Name"
            size="medium"
            required
            registration={register('lastName')}
            error={errors.lastName?.message}
            touched={touchedFields.lastName}
          />
          
          <TextField
            label="Email Address"
            type="email"
            size="full"
            required
            registration={register('email')}
            error={errors.email?.message}
            touched={touchedFields.email}
            hint="We'll use this to send your confirmation"
          />
          
          <TextareaField
            label="Special Requirements"
            size="full"
            registration={register('specialRequirements')}
            error={errors.specialRequirements?.message}
            touched={touchedFields.specialRequirements}
            placeholder="Any dietary requirements or accessibility needs?"
          />
        </FormGrid>
      </FormSection>
    </form>
  )
}
```

### 8. Testing Checklist

- [ ] All form fields use new components
- [ ] Touch targets are minimum 48px height
- [ ] Error states display correctly
- [ ] Labels are properly associated with inputs
- [ ] Tab order is logical
- [ ] Mobile keyboard triggers correctly
- [ ] Autocomplete attributes are set
- [ ] Field sizes work across breakpoints

## Accessibility Features

1. **ARIA Labels**: Automatic aria-label for required fields
2. **Error Announcements**: role="alert" on error messages
3. **Field Association**: htmlFor properly links labels
4. **Keyboard Navigation**: Full keyboard support
5. **Focus States**: Clear visual focus indicators

## Mobile Optimizations

1. **Touch Targets**: Minimum 48px height
2. **Input Types**: Proper type attributes for keyboards
3. **Autocomplete**: Helps with mobile form filling
4. **Error Placement**: Below fields for mobile visibility

## Notes

- Start with the most common forms first
- Test with screen readers
- Verify mobile keyboards work correctly
- Check autofill behavior
- Document any custom field variations
