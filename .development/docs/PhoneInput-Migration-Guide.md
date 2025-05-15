# PhoneInput Migration Guide

This guide explains how to migrate from the old `PhoneInputWrapper` component to the new shadcn/ui-compatible `PhoneInput` component.

## Features of the New PhoneInput Component

- Built using shadcn/ui design principles
- Validates Australian mobile numbers (04XX XXX XXX)
- Validates Australian landline numbers (0X XXXX XXXX)
- Validates international phone numbers
- Works with or without react-hook-form
- Automatic formatting for display
- Stores numbers in international E.164 format (+614XXXXXXXX)
- Shows user-friendly validation errors
- Customizable styling consistent with shadcn/ui

## Migration Steps

1. Import the new component:

```tsx
// Old import
import PhoneInputWrapper from '@/shared/components/PhoneInputWrapper';
// or
import PhoneInputWrapper from '@/components/register/functions/PhoneInputWrapper';

// New import
import { PhoneInput } from '@/components/ui/phone-input';
```

2. Replace component usage:

```tsx
// Old usage
<PhoneInputWrapper
  value={data.mobile || ''}
  onChange={handlePhoneChange}
  inputProps={{
    name: "mobile",
    id: "mobile",
  }}
  required={true}
/>

// New usage (without react-hook-form)
<PhoneInput
  name="mobile"
  value={data.mobile || ''}
  onChange={handlePhoneChange}
  required={true}
/>
```

3. For use with react-hook-form:

```tsx
// Import the schema for validation
import { phoneNumberSchema } from '@/components/ui/phone-input';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Define your form schema
const formSchema = z.object({
  mobile: phoneNumberSchema,
  // other fields...
});

// Set up your form
const form = useForm({
  resolver: zodResolver(formSchema),
  defaultValues: {
    mobile: '',
    // other defaults...
  }
});

// In your JSX
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="mobile"
      render={({ field }) => (
        <PhoneInput
          name="mobile"
          label="Mobile Number"
          required={true}
          {...field}
        />
      )}
    />
    <Button type="submit">Submit</Button>
  </form>
</Form>
```

## Validation Rules

The built-in validation (`phoneNumberSchema`) checks for:

1. Australian mobile numbers (e.g., 0438 871 124, +61438871124)
   - Display format: 0438 871 124 or +61 4 3887 1124
   - Storage format: +61438871124

2. Australian landline numbers with area codes:
   - Sydney (02): 02 9773 0048, +61297730048
   - Melbourne (03): 03 8765 1234, +61387651234
   - Brisbane/Queensland (07): 07 9685 1414, +61796851414
   - Perth/Adelaide/Darwin (08): 08 7456 5598, +61874565598
   - Display format: 02 9773 0048 or +61 2 9773 0048
   - Storage format: +61297730048

3. International numbers (e.g., +1 555 123 4567)
   - Display format: Groups of 3-4 digits for readability
   - Storage format: Preserved as entered with + prefix

## Special Features

- **Smart Display Formatting**:
  - When a user types `0438871124` it displays as `0438 871 124`
  - When a user types `+61438871124` it displays as `+61 438 871 124`
  - When loading from storage, international format numbers are converted to local format for display

- **Preservation of User Format Choice**:
  - The component preserves the format style (local vs international) that the user chooses to enter
  - International formats remain international, local formats remain local

- **International Storage**:
  - All numbers are stored in E.164 international format (+61438871124) in a hidden field
  - This ensures consistent storage regardless of display format

- **Auto-Formatting on Blur**:
  - The input is automatically formatted when the user leaves the field
  - This provides clean formatting without disrupting the user's typing

- **Form Integration**: Works natively with react-hook-form
- **Standalone Mode**: Can also be used outside of forms with manual state management

## Customization

The component accepts all standard input HTML attributes plus:

- `label`: Optional label text
- `error`: Custom error message (for non-form-based usage)
- `className`: For additional styling

## Example Usage

```tsx
// Basic usage
<PhoneInput 
  name="mobile"
  label="Mobile Number"
  required={true}
/>

// With custom styling
<PhoneInput 
  name="mobile"
  label="Mobile Number"
  className="w-full max-w-xs"
  required={true}
/>

// With custom placeholder
<PhoneInput 
  name="mobile"
  label="Mobile Number"
  placeholder="Enter mobile number"
  required={true}
/>
```