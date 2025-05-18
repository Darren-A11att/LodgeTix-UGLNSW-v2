# Step 08: Refactor Guest Form

## System Prompt
You are refactoring the Guest form to match the patterns established in the Mason form, ensuring consistent field layouts, proper sizing, and optimal mobile experience.

## Implementation Checklist

### 1. Update Guest Form Structure

Location: `/components/register/forms/guest/GuestForm.tsx`

```typescript
import { FormGrid, FormSection } from '@/components/register/core'
import { TextField, SelectField, TextareaField } from '@/components/register/fields'
import { GuestTitle } from '@/components/register/guests'
import { GuestRelationship } from '@/components/register/guests'

export function GuestForm({ form, errors, touchedFields }) {
  const { register } = form
  
  return (
    <div className="space-y-8">
      {/* Basic Information Section */}
      <FormSection 
        title="Personal Information"
        description="Guest details for registration"
      >
        <FormGrid>
          {/* Title and Relationship - Small fields */}
          <SelectField
            label="Title"
            size="small"
            required
            registration={register('title')}
            error={errors.title?.message}
            touched={touchedFields.title}
            options={GuestTitle.options}
          />
          
          <SelectField
            label="Relationship"
            size="small"
            required
            registration={register('relationship')}
            error={errors.relationship?.message}
            touched={touchedFields.relationship}
            options={GuestRelationship.options}
            hint="To the Mason"
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
        </FormGrid>
      </FormSection>
      
      {/* Contact Information Section */}
      <FormSection 
        title="Contact Information"
        description="How can we reach this guest?"
      >
        <FormGrid>
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
            hint="We'll send confirmation details here"
          />
          
          {/* Phone - Medium field */}
          <PhoneField
            label="Phone Number"
            size="medium"
            registration={register('phone')}
            error={errors.phone?.message}
            touched={touchedFields.phone}
            autoComplete="tel"
          />
          
          {/* Contact Preference - Medium field */}
          <SelectField
            label="Preferred Contact"
            size="medium"
            registration={register('contactPreference')}
            error={errors.contactPreference?.message}
            touched={touchedFields.contactPreference}
            options={[
              { value: 'email', label: 'Email' },
              { value: 'phone', label: 'Phone' },
              { value: 'either', label: 'Either' },
            ]}
          />
        </FormGrid>
      </FormSection>
      
      {/* Partner Information Section */}
      <GuestPartnerToggle form={form} />
      
      {/* Additional Information Section */}
      <FormSection 
        title="Additional Information"
        description="Special requirements or dietary needs"
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

### 2. Update Guest Basic Info Component

Location: `/components/register/forms/guest/GuestBasicInfo.tsx`

```typescript
import { FormGrid } from '@/components/register/core'
import { TextField, SelectField } from '@/components/register/fields'

export function GuestBasicInfo({ form, errors, touchedFields }) {
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
          { value: 'mr', label: 'Mr' },
          { value: 'mrs', label: 'Mrs' },
          { value: 'ms', label: 'Ms' },
          { value: 'miss', label: 'Miss' },
          { value: 'dr', label: 'Dr' },
        ]}
      />
      
      <SelectField
        label="Relationship"
        size="small"
        required
        registration={form.register('relationship')}
        error={errors.relationship?.message}
        touched={touchedFields.relationship}
        options={[
          { value: 'spouse', label: 'Spouse' },
          { value: 'partner', label: 'Partner' },
          { value: 'family', label: 'Family' },
          { value: 'friend', label: 'Friend' },
          { value: 'colleague', label: 'Colleague' },
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

### 3. Update Guest Contact Info Component

Location: `/components/register/forms/guest/GuestContactInfo.tsx`

```typescript
export function GuestContactInfo({ form, errors, touchedFields }) {
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
        hint="Confirmation will be sent here"
      />
      
      <PhoneField
        label="Phone Number"
        size="medium"
        registration={form.register('phone')}
        error={errors.phone?.message}
        touched={touchedFields.phone}
      />
      
      <SelectField
        label="Contact Preference"
        size="medium"
        registration={form.register('contactPreference')}
        error={errors.contactPreference?.message}
        touched={touchedFields.contactPreference}
        options={[
          { value: 'email', label: 'Email preferred' },
          { value: 'phone', label: 'Phone preferred' },
          { value: 'either', label: 'Either is fine' },
        ]}
      />
    </FormGrid>
  )
}
```

### 4. Update Guest Partner Form

Location: `/components/register/forms/guest/GuestPartnerForm.tsx`

```typescript
export function GuestPartnerForm({ form, errors, touchedFields }) {
  const partnerPrefix = 'partner'
  
  return (
    <FormSection 
      title="Partner Information"
      description="If bringing a partner"
    >
      <FormGrid>
        <SelectField
          label="Partner Title"
          size="small"
          registration={form.register(`${partnerPrefix}.title`)}
          error={errors.partner?.title?.message}
          touched={touchedFields.partner?.title}
          options={[
            { value: 'mr', label: 'Mr' },
            { value: 'mrs', label: 'Mrs' },
            { value: 'ms', label: 'Ms' },
          ]}
        />
        
        <div className="col-span-1" /> {/* Spacer for alignment */}
        
        <TextField
          label="Partner First Name"
          size="medium"
          registration={form.register(`${partnerPrefix}.firstName`)}
          error={errors.partner?.firstName?.message}
          touched={touchedFields.partner?.firstName}
        />
        
        <TextField
          label="Partner Last Name"
          size="medium"
          registration={form.register(`${partnerPrefix}.lastName`)}
          error={errors.partner?.lastName?.message}
          touched={touchedFields.partner?.lastName}
        />
        
        <TextareaField
          label="Partner Dietary Requirements"
          size="full"
          registration={form.register(`${partnerPrefix}.dietaryRequirements`)}
          error={errors.partner?.dietaryRequirements?.message}
          touched={touchedFields.partner?.dietaryRequirements}
          placeholder="Any dietary restrictions"
          rows={2}
        />
      </FormGrid>
    </FormSection>
  )
}
```

### 5. Update Guest Partner Toggle

Location: `/components/register/forms/guest/GuestPartnerToggle.tsx`

```typescript
import { useState } from 'react'
import { FormSection } from '@/components/register/core'
import { CheckboxField } from '@/components/register/fields'
import { GuestPartnerForm } from './GuestPartnerForm'

export function GuestPartnerToggle({ form }) {
  const [hasPartner, setHasPartner] = useState(false)
  
  return (
    <>
      <FormSection>
        <CheckboxField
          label="I'm bringing a partner"
          checked={hasPartner}
          onChange={(e) => setHasPartner(e.target.checked)}
          hint="Select if you're bringing a plus-one"
        />
      </FormSection>
      
      {hasPartner && <GuestPartnerForm form={form} />}
    </>
  )
}
```

### 6. Testing Checklist

- [ ] Title and Relationship display side-by-side on mobile
- [ ] Names use appropriate width on all devices
- [ ] Email spans full width for readability
- [ ] Phone and preference fields align properly
- [ ] Partner form toggle works smoothly
- [ ] Partner fields follow same layout patterns
- [ ] Error messages display consistently
- [ ] Touch targets meet 48px minimum
- [ ] Form sections have consistent spacing
- [ ] Mobile keyboard types are appropriate

## Layout Comparison

### Guest Form Mobile Layout (375px)
```
[Title] [Relation]
[First Name     ]
[Last Name      ]
[Email Address  ]
[Phone Number   ]
[Contact Pref   ]
```

### Guest Form Desktop Layout (1024px+)
```
[Title] [Relation] [First Name] [Last Name]
[Email Address                           ]
[Phone Number   ] [Contact Preference    ]
```

## Key Improvements

1. **Consistent with Mason Form**: Same field sizing and layout patterns
2. **Simplified Structure**: Cleaner section organization
3. **Mobile Optimization**: 2-column grid expanding to 4 columns
4. **Partner Form**: Toggle with smooth animation
5. **Field Hints**: Helpful context for users
6. **Error States**: Consistent error display

## Migration Steps

1. Replace custom layout with FormGrid
2. Update all fields to use new field components
3. Apply consistent sizing (small/medium/large/full)
4. Add proper field hints where helpful
5. Test partner toggle functionality
6. Verify mobile responsiveness
7. Check touch target sizes

## Notes

- Guest forms should feel lighter than Mason forms
- Partner information is optional and toggleable
- Relationship field helps contextualize the guest
- Contact preferences default to email for guests
- Dietary requirements are important for both guest and partner
