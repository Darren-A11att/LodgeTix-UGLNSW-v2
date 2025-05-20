# MasonForm with Semantic Width System

## Current Implementation (Hardcoded)
```typescript
// components/register/forms/mason/MasonBasicInfo.tsx
<div className="grid grid-cols-12 gap-4">
  <div className="col-span-3"> {/* Title - hardcoded 3/12 = 25% */}
    <Label>Title</Label>
    <Select />
  </div>
  <div className="col-span-4"> {/* First Name - hardcoded 4/12 = 33% */}
    <Label>First Name</Label>
    <Input />
  </div>
  <div className="col-span-4"> {/* Last Name - hardcoded 4/12 = 33% */}
    <Label>Last Name</Label>
    <Input />
  </div>
</div>
```

## Step 1: Update Tailwind Config
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      // Option A: Using width utilities
      width: {
        'field-title': '25%',
        'field-name': '33.333%',
        'field-email': '100%',
        'field-phone': '50%',
        'field-lodge': '75%',
      },
      
      // Option B: Using grid column spans (recommended)
      gridColumn: {
        'field-xs': 'span 2 / span 2',   // 2/8 = 25%
        'field-sm': 'span 3 / span 3',   // 3/8 = 37.5%
        'field-md': 'span 4 / span 4',   // 4/8 = 50%
        'field-lg': 'span 6 / span 6',   // 6/8 = 75%
        'field-xl': 'span 8 / span 8',   // 8/8 = 100%
      }
    }
  }
}
```

## Step 2: Refactor MasonBasicInfo Component
```typescript
// components/register/forms/mason/MasonBasicInfo.tsx
import React from 'react';

interface MasonBasicInfoProps {
  mason: UnifiedAttendeeData;
  onChange: (field: keyof UnifiedAttendeeData, value: any) => void;
  titles: string[];
  ranks: Array<{ value: string; label: string }>;
}

export function MasonBasicInfo({ mason, onChange, titles, ranks }: MasonBasicInfoProps) {
  return (
    <div className="grid grid-cols-8 gap-4"> {/* 8-column grid for flexibility */}
      {/* Title - small field */}
      <div className="col-field-xs">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Title *
        </label>
        <select
          value={mason.title || ''}
          onChange={(e) => onChange('title', e.target.value)}
          className="w-full h-input rounded-input border-gray-300"
          required
        >
          <option value="">Select Title</option>
          {titles.map(title => (
            <option key={title} value={title}>{title}</option>
          ))}
        </select>
      </div>

      {/* Rank - small field */}
      <div className="col-field-xs">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Rank *
        </label>
        <select
          value={mason.rank || ''}
          onChange={(e) => onChange('rank', e.target.value)}
          className="w-full h-input rounded-input border-gray-300"
          required
        >
          <option value="">Select Rank</option>
          {ranks.map(rank => (
            <option key={rank.value} value={rank.value}>{rank.label}</option>
          ))}
        </select>
      </div>

      {/* First Name - medium field */}
      <div className="col-field-md">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          First Name *
        </label>
        <input
          type="text"
          value={mason.firstName || ''}
          onChange={(e) => onChange('firstName', e.target.value)}
          className="w-full h-input rounded-input border-gray-300"
          required
        />
      </div>

      {/* Last Name - medium field */}
      <div className="col-field-md">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Last Name *
        </label>
        <input
          type="text"
          value={mason.lastName || ''}
          onChange={(e) => onChange('lastName', e.target.value)}
          className="w-full h-input rounded-input border-gray-300"
          required
        />
      </div>

      {/* Email - full width */}
      <div className="col-field-xl">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Email Address *
        </label>
        <input
          type="email"
          value={mason.primaryEmail || ''}
          onChange={(e) => onChange('primaryEmail', e.target.value)}
          className="w-full h-input rounded-input border-gray-300"
          required
        />
      </div>
    </div>
  );
}
```

## Step 3: Add Responsive Behavior
```typescript
// tailwind.config.ts - with responsive overrides
export default {
  theme: {
    extend: {
      gridColumn: {
        // Mobile-first approach
        'field-xs': 'span 4 / span 4',        // 50% on mobile
        'field-sm': 'span 4 / span 4',        // 50% on mobile
        'field-md': 'span 8 / span 8',        // 100% on mobile
        'field-lg': 'span 8 / span 8',        // 100% on mobile
        'field-xl': 'span 8 / span 8',        // 100% on mobile
        
        // Desktop overrides
        'field-xs-md': 'span 2 / span 2',     // 25% on desktop
        'field-sm-md': 'span 3 / span 3',     // 37.5% on desktop
        'field-md-md': 'span 4 / span 4',     // 50% on desktop
        'field-lg-md': 'span 6 / span 6',     // 75% on desktop
        'field-xl-md': 'span 8 / span 8',     // 100% on desktop
      }
    }
  }
}
```

## Step 4: Apply Responsive Classes
```typescript
// MasonBasicInfo.tsx with responsive behavior
export function MasonBasicInfo({ mason, onChange, titles, ranks }: MasonBasicInfoProps) {
  return (
    <div className="grid grid-cols-8 gap-4">
      {/* Title - 50% mobile, 25% desktop */}
      <div className="col-field-sm md:col-field-xs-md">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Title *
        </label>
        <select
          value={mason.title || ''}
          onChange={(e) => onChange('title', e.target.value)}
          className="w-full h-input rounded-input"
        >
          {titles.map(title => (
            <option key={title} value={title}>{title}</option>
          ))}
        </select>
      </div>

      {/* Rank - 50% mobile, 25% desktop */}
      <div className="col-field-sm md:col-field-xs-md">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Rank *
        </label>
        <select
          value={mason.rank || ''}
          onChange={(e) => onChange('rank', e.target.value)}
          className="w-full h-input rounded-input"
        >
          {ranks.map(rank => (
            <option key={rank.value} value={rank.value}>{rank.label}</option>
          ))}
        </select>
      </div>

      {/* Names - 100% mobile, 50% desktop */}
      <div className="col-field-md md:col-field-md-md">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          First Name *
        </label>
        <input
          type="text"
          value={mason.firstName || ''}
          onChange={(e) => onChange('firstName', e.target.value)}
          className="w-full h-input rounded-input"
          required
        />
      </div>

      <div className="col-field-md md:col-field-md-md">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Last Name *
        </label>
        <input
          type="text"
          value={mason.lastName || ''}
          onChange={(e) => onChange('lastName', e.target.value)}
          className="w-full h-input rounded-input"
          required
        />
      </div>
    </div>
  );
}
```

## Step 5: Apply to Complete MasonForm
```typescript
// components/register/forms/mason/MasonForm.tsx
export default function MasonForm({ attendeeId, attendeeNumber, isPrimary = false }) {
  // ... existing state and logic ...

  return (
    <div className="bg-slate-50 rounded-lg mb-8 overflow-hidden">
      {/* Header */}
      <div className="bg-masonic-navy text-white p-4">
        <h3 className="text-lg font-semibold">
          {isPrimary ? 'Primary Mason' : `Mason ${attendeeNumber}`}
        </h3>
      </div>

      {/* Form Content */}
      <div className="p-6 space-y-section-gap">
        {/* Basic Information Section */}
        <div>
          <h4 className="text-base font-semibold mb-4">Basic Information</h4>
          <MasonBasicInfo
            mason={mason}
            onChange={handleFieldChange}
            titles={titles}
            ranks={ranks}
          />
        </div>

        {/* Lodge Information Section */}
        <div>
          <h4 className="text-base font-semibold mb-4">Lodge Information</h4>
          <div className="grid grid-cols-8 gap-4">
            {/* Grand Lodge - full width */}
            <div className="col-field-xl">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Grand Lodge *
              </label>
              <AutocompleteInput
                value={grandLodgeInputValue}
                onChange={handleGrandLodgeInputChange}
                onSelect={handleGrandLodgeSelect}
                options={grandLodges}
                className="w-full h-input rounded-input"
              />
            </div>

            {/* Lodge Name - large field */}
            <div className="col-field-md md:col-field-lg-md">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Lodge Name *
              </label>
              <AutocompleteInput
                value={lodgeInputValue}
                onChange={handleLodgeInputChange}
                onSelect={handleLodgeSelect}
                options={lodgeSearchResults}
                className="w-full h-input rounded-input"
              />
            </div>

            {/* Lodge Number - small field */}
            <div className="col-field-sm md:col-field-xs-md">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Lodge No.
              </label>
              <input
                type="text"
                value={mason.lodgeNumber || ''}
                onChange={(e) => handleFieldChange('lodgeNumber', e.target.value)}
                className="w-full h-input rounded-input"
              />
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div>
          <h4 className="text-base font-semibold mb-4">Contact Information</h4>
          <MasonContactInfo
            mason={mason}
            onChange={handleFieldChange}
            handlePhoneChange={handlePhoneChange}
            isPrimary={isPrimary}
            hideContactFields={hideContactFieldsForMason}
          />
        </div>
      </div>
    </div>
  );
}
```

## Benefits of This Approach

1. **Global Control**: Change `col-field-sm` definition in one place, updates everywhere
2. **Semantic**: `col-field-sm` is clearer than `col-span-3`
3. **Responsive**: Built-in mobile/desktop differences
4. **Consistent**: All forms use same sizing system
5. **Maintainable**: Easy to adjust design system without touching components

## CSS Variable Alternative
```css
/* globals.css */
@layer utilities {
  .col-field-xs { @apply col-span-4 md:col-span-2; }
  .col-field-sm { @apply col-span-4 md:col-span-3; }
  .col-field-md { @apply col-span-8 md:col-span-4; }
  .col-field-lg { @apply col-span-8 md:col-span-6; }
  .col-field-xl { @apply col-span-8; }
}
```

Now you can change field widths globally by updating these utility classes!