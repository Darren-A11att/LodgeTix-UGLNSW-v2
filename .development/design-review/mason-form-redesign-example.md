# MasonForm Redesign Example

## Overview
This document shows a practical implementation of the new responsive form layout system applied to the MasonForm component.

## Current Issues in MasonForm
1. Inconsistent field groupings
2. Poor mobile layout (fields too narrow)
3. No clear field size hierarchy
4. Complex nested components
5. Not optimized for touch

## Redesigned MasonForm Structure

### 1. New Form Layout Components
```typescript
// components/ui/form-layout/index.tsx
export * from './FormGrid'
export * from './FieldLayout'
export * from './FormSection'
```

```typescript
// components/ui/form-layout/FormGrid.tsx
import { cn } from "@/lib/utils"

export function FormGrid({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={cn(
      "grid grid-cols-2 md:grid-cols-4 gap-4",
      className
    )}>
      {children}
    </div>
  )
}
```

```typescript
// components/ui/form-layout/FieldLayout.tsx
import { cn } from "@/lib/utils"

export type FieldSize = 'small' | 'medium' | 'large'

interface FieldLayoutProps {
  size?: FieldSize
  children: React.ReactNode
  className?: string
}

const fieldSizeClasses = {
  small: 'col-span-1',
  medium: 'col-span-2 md:col-span-2',
  large: 'col-span-2 md:col-span-4'
}

export function FieldLayout({ 
  size = 'medium', 
  children, 
  className 
}: FieldLayoutProps) {
  return (
    <div className={cn(fieldSizeClasses[size], className)}>
      {children}
    </div>
  )
}
```

### 2. Redesigned MasonBasicInfo
```typescript
// components/register/forms/mason/MasonBasicInfo.tsx
import { FormGrid, FieldLayout } from "@/components/ui/form-layout"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface MasonBasicInfoProps {
  mason: UnifiedAttendeeData
  isPrimary: boolean
  onChange: (field: keyof UnifiedAttendeeData, value: any) => void
  handleTitleChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  titles: string[]
  ranks: Array<{ value: string; label: string }>
}

export function MasonBasicInfo({
  mason,
  isPrimary,
  onChange,
  handleTitleChange,
  titles,
  ranks
}: MasonBasicInfoProps) {
  return (
    <FormGrid>
      {/* Mobile: Row 1 */}
      {/* Desktop: Row 1, Columns 1 & 4 */}
      <FieldLayout size="small">
        <Label htmlFor="title">Title</Label>
        <Select
          id="title"
          value={mason.title || ''}
          onChange={handleTitleChange}
          className="w-full h-11"
        >
          <option value="">Select Title</option>
          {titles.map(title => (
            <option key={title} value={title}>{title}</option>
          ))}
        </Select>
      </FieldLayout>

      {/* Mobile: Moves to next row (100% width) */}
      {/* Desktop: Row 1, Columns 2-3 */}
      <FieldLayout size="medium">
        <Label htmlFor="firstName">First Name</Label>
        <Input
          id="firstName"
          type="text"
          value={mason.firstName || ''}
          onChange={(e) => onChange('firstName', e.target.value)}
          className="w-full h-11"
          required
        />
      </FieldLayout>

      {/* Mobile: Own row (100% width) */}
      {/* Desktop: Row 2, Columns 1-2 */}
      <FieldLayout size="medium">
        <Label htmlFor="lastName">Last Name</Label>
        <Input
          id="lastName"
          type="text"
          value={mason.lastName || ''}
          onChange={(e) => onChange('lastName', e.target.value)}
          className="w-full h-11"
          required
        />
      </FieldLayout>

      {/* Mobile: Shares row with title */}
      {/* Desktop: Row 2, Column 4 */}
      <FieldLayout size="small">
        <Label htmlFor="rank">Rank</Label>
        <Select
          id="rank"
          value={mason.rank || ''}
          onChange={(e) => onChange('rank', e.target.value)}
          className="w-full h-11"
        >
          <option value="">Select Rank</option>
          {ranks.map(rank => (
            <option key={rank.value} value={rank.value}>{rank.label}</option>
          ))}
        </Select>
      </FieldLayout>
    </FormGrid>
  )
}
```

### 3. Redesigned MasonLodgeInfo
```typescript
// components/register/forms/mason/MasonLodgeInfo.tsx
import { FormGrid, FieldLayout } from "@/components/ui/form-layout"
import { AutocompleteInput } from "@/shared/components/AutocompleteInput"

export function MasonLodgeInfo({
  mason,
  isPrimary,
  onLodgeFieldChange,
  // ... other props
}) {
  return (
    <>
      <FormGrid>
        {/* Grand Lodge - Full width on both mobile and desktop */}
        <FieldLayout size="large">
          <Label htmlFor="grandLodge">Grand Lodge</Label>
          <AutocompleteInput
            id="grandLodge"
            value={grandLodgeInputValue}
            onChange={handleGrandLodgeInputChange}
            onSelect={handleGrandLodgeSelect}
            options={grandLodges}
            placeholder="Search for Grand Lodge..."
            className="w-full h-11"
          />
        </FieldLayout>

        {/* Lodge - Full width on both mobile and desktop */}
        <FieldLayout size="large">
          <Label htmlFor="lodge">Lodge</Label>
          <AutocompleteInput
            id="lodge"
            value={lodgeInputValue}
            onChange={handleLodgeInputChange}
            onSelect={handleLodgeSelect}
            options={lodgeSearchResults}
            placeholder="Search for Lodge..."
            className="w-full h-11"
            disabled={!selectedGrandLodge}
          />
        </FieldLayout>
      </FormGrid>

      {/* "Use same lodge as primary" checkbox for non-primary masons */}
      {!isPrimary && primaryMasonData && (
        <div className="mt-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useSameLodge}
              onChange={handleUseSameLodgeChange}
              className="h-4 w-4"
            />
            <span className="text-sm">Use same lodge as primary attendee</span>
          </label>
        </div>
      )}
    </>
  )
}
```

### 4. Redesigned MasonContactInfo
```typescript
// components/register/forms/mason/MasonContactInfo.tsx
import { FormGrid, FieldLayout } from "@/components/ui/form-layout"
import { PhoneInput } from "@/components/ui/phone-input"

export function MasonContactInfo({
  mason,
  onChange,
  handlePhoneChange,
  isPrimary,
  hideContactFields,
  // ... other props
}) {
  return (
    <FormGrid>
      {/* Contact Preference - Full width on mobile, half on desktop */}
      <FieldLayout size="medium">
        <Label htmlFor="contactPreference">Contact Preference</Label>
        <Select
          id="contactPreference"
          value={mason.contactPreference || ''}
          onChange={(e) => onChange('contactPreference', e.target.value)}
          className="w-full h-11"
        >
          <option value="">Select preference</option>
          <option value="Directly">Contact me directly</option>
          <option value="PrimaryAttendee">Via primary attendee</option>
          <option value="ProvideLater">Provide later</option>
        </Select>
      </FieldLayout>

      {!hideContactFields && (
        <>
          {/* Email - Full width on mobile, half on desktop */}
          <FieldLayout size="medium">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={mason.primaryEmail || ''}
              onChange={(e) => onChange('primaryEmail', e.target.value)}
              className="w-full h-11"
              required={isPrimary || mason.contactPreference === 'Directly'}
            />
          </FieldLayout>

          {/* Phone - Full width on mobile, half on desktop */}
          <FieldLayout size="medium">
            <Label htmlFor="phone">Phone Number</Label>
            <PhoneInput
              id="phone"
              value={mason.primaryPhone || ''}
              onChange={handlePhoneChange}
              className="w-full h-11"
              required={isPrimary || mason.contactPreference === 'Directly'}
            />
          </FieldLayout>
        </>
      )}
    </FormGrid>
  )
}
```

### 5. Complete MasonForm Structure
```typescript
// components/register/forms/mason/MasonForm.tsx
import { FormSection } from "@/components/ui/form-layout"

export default function MasonForm({
  formData,
  onFormChange,
  attendeeNumber,
  isPrimary = false,
  showPartnerToggle = true,
}) {
  return (
    <div className="bg-slate-50 rounded-lg mb-8 overflow-hidden">
      {/* Header */}
      <div className="bg-masonic-navy text-white p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            {isPrimary ? 'Primary Mason' : `Mason ${attendeeNumber}`}
          </h3>
          {!isPrimary && (
            <button
              onClick={handleRemove}
              className="text-white hover:text-masonic-gold transition-colors"
              aria-label={`Remove Mason ${attendeeNumber}`}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Form Content */}
      <div className="p-4 md:p-6 space-y-6">
        <FormSection title="Basic Information">
          <MasonBasicInfo
            mason={formData}
            isPrimary={isPrimary}
            onChange={handleFieldChange}
            handleTitleChange={handleTitleChange}
            titles={titles}
            ranks={ranks}
          />
        </FormSection>

        {formData.rank === 'GL' && (
          <FormSection title="Grand Lodge Information">
            <MasonGrandLodgeFields
              mason={formData}
              onChange={handleFieldChange}
              isPrimary={isPrimary}
            />
          </FormSection>
        )}

        <FormSection title="Lodge Information">
          <MasonLodgeInfo
            mason={formData}
            isPrimary={isPrimary}
            onLodgeFieldChange={handleLodgeFieldChange}
          />
        </FormSection>

        <FormSection title="Contact Information">
          <MasonContactInfo
            mason={formData}
            onChange={handleFieldChange}
            handlePhoneChange={handlePhoneChange}
            isPrimary={isPrimary}
            hideContactFields={hideContactFields}
            showConfirmation={showConfirmation}
            getConfirmationMessage={getConfirmationMessage}
          />
        </FormSection>

        <FormSection title="Additional Information">
          <MasonAdditionalInfo
            mason={formData}
            onChange={handleFieldChange}
            isPrimary={isPrimary}
          />
        </FormSection>

        {showPartnerToggle && (
          <FormSection>
            <LadyPartnerToggle
              isChecked={!!formData.registerPartner}
              onChange={handlePartnerToggle}
              label="Register a Lady Partner?"
            />
            
            {formData.registerPartner && (
              <div className="mt-4">
                <LadyPartnerForm
                  formData={formData.partnerDetails || {}}
                  onFormChange={handlePartnerFormChange}
                />
              </div>
            )}
          </FormSection>
        )}
      </div>
    </div>
  )
}
```

## Visual Representation

### Mobile Layout (2 columns)
```
[Title ] [Rank  ]
[First Name    ]
[Last Name     ]
[Grand Lodge   ]
[Lodge         ]
[Contact Pref  ]
[Email         ]
[Phone         ]
```

### Desktop Layout (4 columns)
```
[Title ] [First Name   ] [Last Name    ] [Rank  ]
[Grand Lodge                                  ]
[Lodge                                        ]
[Contact Pref  ] [Email        ]
[Phone         ] [             ]
```

## Benefits of This Approach

1. **Consistent Layout**: All forms follow the same grid system
2. **Mobile-First**: Works perfectly on mobile with 2 columns
3. **Flexible Desktop**: Expands to 4 columns on larger screens
4. **Predictable Behavior**: Developers know exactly how fields will layout
5. **Touch-Friendly**: All inputs are 44px tall (h-11)
6. **Accessible**: Proper label associations and semantic HTML

## Migration Path

1. Create the form layout components
2. Update MasonBasicInfo as proof of concept
3. Progressively update other sections
4. Test on various devices
5. Apply pattern to other forms (GuestForm, etc.)

This approach solves the mobile responsiveness issues while maintaining a clean, consistent design system throughout the application.