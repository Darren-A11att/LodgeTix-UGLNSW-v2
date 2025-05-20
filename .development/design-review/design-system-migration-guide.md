# Design System Migration Guide

## Overview
This guide shows how to migrate from hardcoded values to a global design system using Tailwind CSS extended configuration.

## Step 1: Audit Current Implementation

### Common Patterns to Replace
1. **Field Widths**: `col-span-1`, `col-span-2`, `w-1/2`, `w-full`
2. **Spacing**: `p-4`, `gap-4`, `mb-8`
3. **Heights**: `h-11`, `min-h-[44px]`
4. **Colors**: Direct color values
5. **Border Radius**: `rounded-md`, `rounded-lg`

## Step 2: Create Global Configuration

### A. Extend Tailwind Config
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      // Custom grid column spans for forms
      gridColumn: {
        'field-xs': 'span 1 / span 1',
        'field-sm': 'span 1 / span 1',
        'field-sm-md': 'span 2 / span 2', 
        'field-md': 'span 2 / span 2',
        'field-lg': 'span 3 / span 3',
        'field-full': 'span 4 / span 4',
      },
      
      // Responsive width utilities
      width: {
        'field-mobile-half': '50%',
        'field-mobile-full': '100%',
        'field-desktop-quarter': '25%',
        'field-desktop-half': '50%',
        'field-desktop-full': '100%',
      },
    }
  }
}
```

### B. Create Design Token Module
```typescript
// lib/design-system/tokens.ts
export const designTokens = {
  // Form field configurations
  fields: {
    // Size definitions with responsive behavior
    sizes: {
      xs: {
        mobile: 'col-span-1', // 50% on 2-col grid
        tablet: 'sm:col-span-1', // 25% on 4-col grid
        desktop: 'md:col-span-1', // 25% on 4-col grid
      },
      sm: {
        mobile: 'col-span-1', // 50% on 2-col grid
        tablet: 'sm:col-span-2', // 50% on 4-col grid
        desktop: 'md:col-span-2', // 50% on 4-col grid
      },
      md: {
        mobile: 'col-span-2', // 100% on 2-col grid
        tablet: 'sm:col-span-2', // 50% on 4-col grid
        desktop: 'md:col-span-2', // 50% on 4-col grid
      },
      lg: {
        mobile: 'col-span-2', // 100% on 2-col grid
        tablet: 'sm:col-span-3', // 75% on 4-col grid
        desktop: 'md:col-span-3', // 75% on 4-col grid
      },
      full: {
        mobile: 'col-span-2', // 100% on 2-col grid
        tablet: 'sm:col-span-4', // 100% on 4-col grid
        desktop: 'md:col-span-4', // 100% on 4-col grid
      },
    },
    
    // Common field patterns
    patterns: {
      title: 'xs',
      name: 'sm', 
      email: 'full',
      phone: 'md',
      address: 'full',
      select: 'sm',
      textarea: 'full',
    },
  },
  
  // Layout configurations
  layouts: {
    formGrid: {
      base: 'grid gap-4',
      mobile: 'grid-cols-2',
      tablet: 'sm:grid-cols-4',
      desktop: 'md:grid-cols-4',
    },
  },
  
  // Component specifications
  components: {
    input: {
      height: 'h-11', // 44px
      padding: 'px-3 py-2',
      border: 'border rounded-md',
      focus: 'focus:outline-none focus:ring-2 focus:ring-primary',
    },
    button: {
      height: 'h-11',
      padding: 'px-4 py-2',
      rounded: 'rounded-md',
    },
  },
}
```

## Step 3: Create Utility Functions

```typescript
// lib/design-system/utils.ts
import { designTokens } from './tokens'

export function getFieldSizeClasses(size: keyof typeof designTokens.fields.sizes) {
  const sizeConfig = designTokens.fields.sizes[size]
  return `${sizeConfig.mobile} ${sizeConfig.tablet} ${sizeConfig.desktop}`
}

export function getFieldPatternSize(pattern: keyof typeof designTokens.fields.patterns) {
  return designTokens.fields.patterns[pattern]
}

export function getGridClasses() {
  const { base, mobile, tablet, desktop } = designTokens.layouts.formGrid
  return `${base} ${mobile} ${tablet} ${desktop}`
}
```

## Step 4: Migrate Components

### Before (Hardcoded):
```typescript
// MasonBasicInfo.tsx
<div className="grid grid-cols-12 gap-4">
  <div className="col-span-3">
    <Label>Title</Label>
    <Select className="h-11" />
  </div>
  <div className="col-span-4">
    <Label>First Name</Label>
    <Input className="h-11" />
  </div>
</div>
```

### After (Design System):
```typescript
// MasonBasicInfo.tsx
import { getFieldSizeClasses, getGridClasses } from '@/lib/design-system/utils'
import { designTokens } from '@/lib/design-system/tokens'

<div className={getGridClasses()}>
  <div className={getFieldSizeClasses('xs')}>
    <Label>Title</Label>
    <Select className={designTokens.components.input.height} />
  </div>
  <div className={getFieldSizeClasses('sm')}>
    <Label>First Name</Label>
    <Input className={designTokens.components.input.height} />
  </div>
</div>
```

## Step 5: Create Preset Components

```typescript
// components/ui/form-layout.tsx
import { getFieldSizeClasses } from '@/lib/design-system/utils'

export function FormField({ 
  size = 'md', 
  children,
  className 
}: {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'full'
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn(getFieldSizeClasses(size), className)}>
      {children}
    </div>
  )
}

// Usage
<FormField size="xs">
  <Label>Title</Label>
  <Select />
</FormField>
```

## Step 6: Common Patterns

### Form Layout Pattern
```typescript
// Standardized form structure
export function StandardForm({ children }) {
  return (
    <form className="space-y-8">
      <FormSection title="Personal Information">
        <FormGrid>
          {children}
        </FormGrid>
      </FormSection>
    </form>
  )
}
```

### Field Pattern Mapping
```typescript
// Map common fields to their sizes
const fieldMappings = {
  'title': 'xs',
  'firstName': 'sm',
  'lastName': 'sm', 
  'email': 'full',
  'phone': 'md',
  'grandLodge': 'full',
  'lodge': 'lg',
  'dietaryRequirements': 'full',
}

// Usage
<FormField size={fieldMappings.title}>
  <TitleSelect />
</FormField>
```

## Step 7: Benefits Achieved

1. **Single Source of Truth**: Change `h-11` to `h-12` in one place
2. **Consistent Responsive Behavior**: All fields follow same breakpoints
3. **Semantic Naming**: `size="sm"` vs `col-span-2 md:col-span-2`
4. **Easy Maintenance**: Update design system without touching components
5. **Type Safety**: TypeScript ensures valid values
6. **Documentation**: Self-documenting code with clear intent

## Step 8: Migration Checklist

- [ ] Audit all components for hardcoded values
- [ ] Create Tailwind config extensions
- [ ] Build design token module
- [ ] Create utility functions
- [ ] Migrate one component as proof of concept
- [ ] Create preset components
- [ ] Document patterns for team
- [ ] Migrate remaining components
- [ ] Remove all hardcoded values
- [ ] Test responsive behavior

## Example: Complete Migration

### Old Registration Type Step
```typescript
<div className="max-w-6xl mx-auto p-6">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div className="p-6 rounded-lg border">
```

### New Registration Type Step
```typescript
<div className={registrationLayouts.container}>
  <div className={registrationLayouts.typeGrid}>
    <Card className={registrationStyles.typeCard}>
```

This systematic approach ensures consistency, maintainability, and scalability across the entire application.