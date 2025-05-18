# Step 07: Refactor Mason Form

## System Prompt
You are refactoring the Mason form to use the new grid layout system, apply proper field sizing, update sections with consistent spacing, and optimize the mobile experience.

## Implementation Checklist

### 1. Update Mason Form Structure

Location: `/components/register/forms/mason/MasonForm.tsx`

```typescript
import { FormGrid, FormSection } from '@/components/register/core'
import { TextField, SelectField, TextareaField } from '@/components/register/fields'
import { MasonTitle } from '@/components/register/masons'
import { MasonRank } from '@/components/register/masons'
import { ContactPreference } from '@/components/register/masons'

export function MasonForm({ form, errors, touchedFields }) {
  const { register } = form
  
  return (
    <div className="space-y-8">
      {/* Basic Information Section */}
      <FormSection 
        title="Personal Information"
        description="Please provide your personal details"
      >
        <FormGrid>
          {/* Title and Rank - Small fields side by side */}
          <SelectField
            label="Title"
            size="small"
            required
            registration={register('title')}
            error={errors.title?.message}
            touched={touchedFields.title}
            options={MasonTitle.options}
          />
          
          <SelectField
            label="Masonic Rank"
            size="small"
            required
            registration={register('rank')}
            error={errors.rank?.message}
            touched={touchedFields.rank}
            options={MasonRank.options}
          />
          
          {/* Names - Medium fields */}
          <TextField
            label="First Name"
            size="medium"
            required
            registration={register('firstName')}
            error={errors.firstName?.message}
            touched={touchedFields.firstName}
            autoComplete="given-name"
          />
          
          <TextField
            label="Last Name"
            size="medium"
            required
            registration={register('lastName')}
            error={errors.lastName?.message}
            touched={touchedFields.lastName}
            autoComplete="family-name"
          />
          
          {/* Email - Full width */}
          <TextField
            label="Email Address"
            type="email"
            size="full"
            required
            registration={register('email')}
            error={errors.email?.message}
            touched={touchedFields.email}
            autoComplete="email"
            hint="We'll use this for your booking confirmation"
          />
        </FormGrid>
      </FormSection>
      
      {/* Lodge Information Section */}
      <FormSection 
        title="Lodge Information"
        description="Your Masonic lodge details"
      >
        <FormGrid>
          {/* Grand Lodge - Full width */}
          <AutocompleteField
            label="Grand Lodge"
            size="full"
            required
            registration={register('grandLodge')}
            error={errors.grandLodge?.message}
            touched={touchedFields.grandLodge}
            options={grandLodgeOptions}
            placeholder="Start typing to search..."
          />
          
          {/* Lodge Name - Large field */}
          <AutocompleteField
            label="Lodge Name"
            size="large"
            required
            registration={register('lodgeName')}
            error={errors.lodgeName?.message}
            touched={touchedFields.lodgeName}
            options={lodgeOptions}
            placeholder="Select your lodge"
          />
          
          {/* Lodge Number - Small field */}
          <TextField
            label="Lodge No."
            size="small"
            registration={register('lodgeNumber')}
            error={errors.lodgeNumber?.message}
            touched={touchedFields.lodgeNumber}
            placeholder="e.g. 123"
          />
        </FormGrid>
      </FormSection>
      
      {/* Contact Information Section */}
      <FormSection 
        title="Contact Information"
        description="How can we reach you?"
      >
        <FormGrid>
          {/* Phone - Medium field */}
          <PhoneField
            label="Phone Number"
            size="medium"
            required
            registration={register('phone')}
            error={errors.phone?.message}
            touched={touchedFields.phone}
            autoComplete="tel"
          />
          
          {/* Contact Preference - Medium field */}
          <SelectField
            label="Preferred Contact Method"
            size="medium"
            registration={register('contactPreference')}
            error={errors.contactPreference?.message}
            touched={touchedFields.contactPreference}
            options={ContactPreference.options}
          />
        </FormGrid>
      </FormSection>
      
      {/* Grand Lodge Officers Section (conditional) */}
      {isGrandLodgeOfficer && (
        <FormSection 
          title="Grand Lodge Officer Information"
          description="Additional information for Grand Lodge officers"
        >
          <FormGrid>
            <SelectField
              label="Officer Status"
              size="medium"
              required
              registration={register('grandOfficerStatus')}
              error={errors.grandOfficerStatus?.message}
              touched={touchedFields.grandOfficerStatus}
              options={GrandOfficerStatus.options}
            />
            
            <SelectField
              label="Officer Role"
              size="medium"
              required
              registration={register('grandOfficerRole')}
              error={errors.grandOfficerRole?.message}
              touched={touchedFields.grandOfficerRole}
              options={GrandOfficerRole.options}
            />
          </FormGrid>
        </FormSection>
      )}
      
      {/* Additional Information Section */}
      <FormSection 
        title="Additional Information"
        description="Any special requirements or dietary needs"
      >
        <FormGrid>
          <TextareaField
            label="Dietary Requirements"
            size="full"
            registration={register('dietaryRequirements')}
            error={errors.dietaryRequirements?.message}
            touched={touchedFields.dietaryRequirements}
            placeholder="e.g. Vegetarian, Halal, Gluten-free"
            rows={3}
          />
          
          <TextareaField
            label="Special Requirements"
            size="full"
            registration={register('specialRequirements')}
            error={errors.specialRequirements?.message}
            touched={touchedFields.specialRequirements}
            placeholder="Any accessibility needs or other requirements"
            rows={3}
          />
        </FormGrid>
      </FormSection>
    </div>
  )
}
```

### 2. Create Responsive Field Components

Location: `/components/register/masons/fields/AutocompleteField.tsx`

```typescript
import { FieldWrapper } from '@/components/register/fields/FieldWrapper'
import { AutocompleteInput } from '@/components/register/functions/AutocompleteInput'

export function AutocompleteField({
  label,
  size,
  required,
  registration,
  error,
  touched,
  options,
  placeholder,
  ...props
}) {
  return (
    <FieldWrapper
      label={label}
      size={size}
      required={required}
      error={error}
      touched={touched}
      fieldId={registration?.name}
    >
      <AutocompleteInput
        {...registration}
        options={options}
        placeholder={placeholder}
        error={!!error && touched}
        className="w-full"
        {...props}
      />
    </FieldWrapper>
  )
}
```

### 3. Update Mason Basic Info Component

Location: `/components/register/forms/mason/MasonBasicInfo.tsx`

```typescript
import { FormGrid } from '@/components/register/core'
import { TextField, SelectField } from '@/components/register/fields'

export function MasonBasicInfo({ form, errors, touchedFields }) {
  return (
    <FormGrid>
      <SelectField
        label="Title"
        size="small"
        required
        registration={form.register('title')}
        error={errors.title?.message}
        touched={touchedFields.title}
        options={[
          { value: 'wbro', label: 'W.Bro.' },
          { value: 'bro', label: 'Bro.' },
          { value: 'rwbro', label: 'R.W.Bro.' },
          { value: 'vwbro', label: 'V.W.Bro.' },
          { value: 'mwbro', label: 'M.W.Bro.' },
        ]}
      />
      
      <SelectField
        label="Rank"
        size="small"
        required
        registration={form.register('rank')}
        error={errors.rank?.message}
        touched={touchedFields.rank}
        options={[
          { value: 'ea', label: 'Entered Apprentice' },
          { value: 'fc', label: 'Fellow Craft' },
          { value: 'mm', label: 'Master Mason' },
          { value: 'pm', label: 'Past Master' },
        ]}
      />
      
      <TextField
        label="First Name"
        size="medium"
        required
        registration={form.register('firstName')}
        error={errors.firstName?.message}
        touched={touchedFields.firstName}
      />
      
      <TextField
        label="Last Name"
        size="medium"
        required
        registration={form.register('lastName')}
        error={errors.lastName?.message}
        touched={touchedFields.lastName}
      />
    </FormGrid>
  )
}
```

### 4. Update Lodge Information Component

Location: `/components/register/forms/mason/MasonLodgeInfo.tsx`

```typescript
export function MasonLodgeInfo({ form, errors, touchedFields }) {
  return (
    <FormGrid>
      <AutocompleteField
        label="Grand Lodge"
        size="full"
        required
        registration={form.register('grandLodge')}
        error={errors.grandLodge?.message}
        touched={touchedFields.grandLodge}
        options={grandLodges}
        hint="Which Grand Lodge is your lodge under?"
      />
      
      <AutocompleteField
        label="Lodge Name"
        size="large"
        required
        registration={form.register('lodgeName')}
        error={errors.lodgeName?.message}
        touched={touchedFields.lodgeName}
        options={lodges}
        placeholder="Search for your lodge..."
      />
      
      <TextField
        label="Lodge Number"
        size="small"
        registration={form.register('lodgeNumber')}
        error={errors.lodgeNumber?.message}
        touched={touchedFields.lodgeNumber}
        placeholder="123"
      />
    </FormGrid>
  )
}
```

### 5. Mobile-Optimized Contact Info

Location: `/components/register/forms/mason/MasonContactInfo.tsx`

```typescript
export function MasonContactInfo({ form, errors, touchedFields }) {
  return (
    <FormGrid>
      <TextField
        label="Email Address"
        type="email"
        size="full"
        required
        registration={form.register('email')}
        error={errors.email?.message}
        touched={touchedFields.email}
        autoComplete="email"
      />
      
      <PhoneField
        label="Phone Number"
        size="medium"
        required
        registration={form.register('phone')}
        error={errors.phone?.message}
        touched={touchedFields.phone}
      />
      
      <SelectField
        label="Preferred Contact"
        size="medium"
        registration={form.register('contactPreference')}
        error={errors.contactPreference?.message}
        touched={touchedFields.contactPreference}
        options={[
          { value: 'email', label: 'Email' },
          { value: 'phone', label: 'Phone' },
          { value: 'either', label: 'Either' },
        ]}
      />
    </FormGrid>
  )
}
```

### 6. Testing Checklist

- [ ] Title and Rank display side-by-side on mobile (2 columns)
- [ ] Names take appropriate space on mobile and desktop
- [ ] Grand Lodge field spans full width
- [ ] Lodge name uses 3/4 width on desktop
- [ ] Email spans full width for easy reading
- [ ] Form sections have consistent spacing
- [ ] Autocomplete works well on mobile
- [ ] Error messages display clearly
- [ ] Touch targets are 48px minimum
- [ ] Keyboard navigation flows logically

## Layout Patterns

### Mobile Layout (375px)
```
[Title] [Rank]
[First Name    ]
[Last Name     ]
[Email Address ]
[Grand Lodge   ]
[Lodge Name    ]
[Lodge#]
[Phone Number  ]
[Contact Pref  ]
```

### Desktop Layout (1024px+)
```
[Title] [Rank] [First Name] [Last Name]
[Email Address                        ]
[Grand Lodge                          ]
[Lodge Name                    ] [No. ]
[Phone Number  ] [Contact Preference  ]
```

## Key Improvements

1. **Consistent Field Sizing**: Small, medium, large, and full width options
2. **Mobile-First Layout**: 2-column grid on mobile, expanding to 4 on desktop
3. **Proper Spacing**: Consistent gaps between fields and sections
4. **Touch Targets**: All interactive elements meet 48px minimum
5. **Semantic Sections**: Clear visual hierarchy with section headers
6. **Error Handling**: Inline errors with proper spacing
7. **Autocomplete**: Mobile-optimized search for lodges

## Migration Notes

- Replace inline styles with design system classes
- Use FormGrid instead of custom grid implementations
- Apply FieldLayout wrapper to all form fields
- Update all SelectField components to use consistent options
- Test thoroughly on mobile devices
- Verify autocomplete behavior on touch devices
