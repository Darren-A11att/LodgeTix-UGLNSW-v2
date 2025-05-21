# Global Design System Configuration

## Overview
This document defines a centralized configuration approach for all design tokens using Tailwind CSS, making it easy to update the entire application from a single source of truth.

## Implementation Strategy

### 1. Extend Tailwind Configuration
Location: `/tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Form Layout System
      spacing: {
        'form-gap': '1rem', // Standard gap between form elements
        'section-gap': '2rem', // Gap between form sections
        'card-gap': '1.5rem', // Gap between cards
      },
      
      // Field Width System
      width: {
        'field-xs': '25%', // Extra small fields (1/4)
        'field-sm': '50%', // Small fields (1/2)
        'field-md': '100%', // Medium fields (full on mobile)
        'field-lg': '100%', // Large fields
        'field-full': '100%', // Full width fields
      },
      
      // Responsive Field Widths
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      
      // Grid Template Columns for Forms
      gridTemplateColumns: {
        // Mobile grids
        'form-mobile': 'repeat(2, minmax(0, 1fr))',
        'form-tablet': 'repeat(4, minmax(0, 1fr))',
        'form-desktop': 'repeat(4, minmax(0, 1fr))',
        
        // Specific patterns
        'attendee-mobile': 'repeat(2, minmax(0, 1fr))',
        'attendee-desktop': 'repeat(4, minmax(0, 1fr))',
        'ticket-mobile': '1fr',
        'ticket-desktop': 'repeat(2, minmax(0, 1fr))',
      },
      
      // Height System
      height: {
        'input': '2.75rem', // 44px - Touch-friendly
        'button': '2.75rem', // 44px - Touch-friendly
        'modal-mobile': '100dvh',
        'modal-desktop': 'auto',
      },
      
      minHeight: {
        'input': '2.75rem', // 44px
        'button': '2.75rem', // 44px
        'touch-target': '3rem', // 48px - Minimum touch target
      },
      
      // Border Radius System
      borderRadius: {
        'input': '0.375rem', // 6px
        'button': '0.375rem', // 6px
        'card': '0.5rem', // 8px
        'modal': '0.75rem', // 12px
      },
      
      // Typography Scale
      fontSize: {
        'form-label': ['0.875rem', { lineHeight: '1.25rem' }], // 14px
        'form-hint': ['0.75rem', { lineHeight: '1rem' }], // 12px
        'form-error': ['0.75rem', { lineHeight: '1rem' }], // 12px
        'button-sm': ['0.875rem', { lineHeight: '1.25rem' }], // 14px
        'button-md': ['0.875rem', { lineHeight: '1.25rem' }], // 14px
        'button-lg': ['1rem', { lineHeight: '1.5rem' }], // 16px
      },
      
      // Z-Index Scale
      zIndex: {
        'dropdown': '50',
        'modal': '100',
        'tooltip': '150',
        'notification': '200',
      },
      
      // Animation Durations
      transitionDuration: {
        'field': '200ms',
        'button': '150ms',
        'modal': '300ms',
      },
      
      // Box Shadows
      boxShadow: {
        'input-focus': '0 0 0 3px rgba(34, 114, 192, 0.1)',
        'button-focus': '0 0 0 3px rgba(34, 114, 192, 0.1)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}

export default config
```

### 2. Create CSS Custom Properties
Location: `/style/styles/globals.css`

```css
@layer base {
  :root {
    /* Form Layout Variables */
    --form-gap: 1rem;
    --section-gap: 2rem;
    --card-gap: 1.5rem;
    
    /* Field Widths */
    --field-xs: 25%;
    --field-sm: 50%;
    --field-md: 100%;
    --field-lg: 100%;
    --field-full: 100%;
    
    /* Responsive Breakpoints */
    --breakpoint-mobile: 640px;
    --breakpoint-tablet: 768px;
    --breakpoint-desktop: 1024px;
    
    /* Input Heights */
    --input-height: 2.75rem;
    --button-height: 2.75rem;
    --touch-target-min: 3rem;
    
    /* Typography */
    --form-label-size: 0.875rem;
    --form-hint-size: 0.75rem;
    --form-error-size: 0.75rem;
    
    /* Border Radius */
    --radius-input: 0.375rem;
    --radius-button: 0.375rem;
    --radius-card: 0.5rem;
    --radius-modal: 0.75rem;
    
    /* Transitions */
    --transition-field: 200ms;
    --transition-button: 150ms;
    --transition-modal: 300ms;
  }
}
```

### 3. Form Component System
Location: `/components/ui/form-system.tsx`

```typescript
// Centralized form configuration
export const formConfig = {
  // Field size mappings for responsive grid
  fieldSizes: {
    xs: {
      mobile: 'col-span-1', // 50% on mobile (2-column grid)
      tablet: 'col-span-1', // 25% on tablet
      desktop: 'col-span-1', // 25% on desktop
    },
    sm: {
      mobile: 'col-span-1', // 50% on mobile
      tablet: 'col-span-2', // 50% on tablet
      desktop: 'col-span-2', // 50% on desktop
    },
    md: {
      mobile: 'col-span-2', // 100% on mobile
      tablet: 'col-span-2', // 50% on tablet
      desktop: 'col-span-2', // 50% on desktop
    },
    lg: {
      mobile: 'col-span-2', // 100% on mobile
      tablet: 'col-span-3', // 75% on tablet
      desktop: 'col-span-3', // 75% on desktop
    },
    full: {
      mobile: 'col-span-2', // 100% on mobile
      tablet: 'col-span-4', // 100% on tablet
      desktop: 'col-span-4', // 100% on desktop
    },
  },
  
  // Grid configurations
  grids: {
    form: {
      mobile: 'grid-cols-2',
      tablet: 'md:grid-cols-4',
      desktop: 'lg:grid-cols-4',
      gap: 'gap-4',
    },
    attendee: {
      mobile: 'grid-cols-2',
      tablet: 'md:grid-cols-4',
      desktop: 'lg:grid-cols-4',
      gap: 'gap-4',
    },
    ticket: {
      mobile: 'grid-cols-1',
      tablet: 'md:grid-cols-2',
      desktop: 'lg:grid-cols-2',
      gap: 'gap-6',
    },
  },
  
  // Component heights
  heights: {
    input: 'h-11', // 44px
    button: 'h-11', // 44px
    touchTarget: 'min-h-12', // 48px
  },
  
  // Border radius
  radius: {
    input: 'rounded-input',
    button: 'rounded-button',
    card: 'rounded-card',
    modal: 'rounded-modal',
  },
  
  // Transitions
  transitions: {
    field: 'transition-colors duration-field',
    button: 'transition-all duration-button',
    modal: 'transition-all duration-modal',
  },
}

// Utility functions
export function getFieldClasses(size: keyof typeof formConfig.fieldSizes) {
  const sizeConfig = formConfig.fieldSizes[size]
  return `${sizeConfig.mobile} ${sizeConfig.tablet} ${sizeConfig.desktop}`
}

export function getGridClasses(type: keyof typeof formConfig.grids) {
  const gridConfig = formConfig.grids[type]
  return `grid ${gridConfig.mobile} ${gridConfig.tablet} ${gridConfig.desktop} ${gridConfig.gap}`
}
```

### 4. Usage Examples

#### Form Layout
```typescript
import { getGridClasses, getFieldClasses } from '@/components/ui/form-system'

function RegistrationForm() {
  return (
    <form className={getGridClasses('form')}>
      <div className={getFieldClasses('xs')}>
        <label>Title</label>
        <select className="w-full h-input rounded-input">
          {/* options */}
        </select>
      </div>
      
      <div className={getFieldClasses('sm')}>
        <label>First Name</label>
        <input className="w-full h-input rounded-input" />
      </div>
      
      <div className={getFieldClasses('full')}>
        <label>Grand Lodge</label>
        <input className="w-full h-input rounded-input" />
      </div>
    </form>
  )
}
```

#### Responsive Field System
```typescript
// Define once, use everywhere
const fieldLayouts = {
  title: 'xs',      // 50% mobile, 25% desktop
  firstName: 'sm',  // 50% mobile, 50% desktop  
  email: 'full',    // 100% all devices
  phone: 'md',      // 100% mobile, 50% desktop
  lodge: 'lg',      // 100% mobile, 75% desktop
} as const

// Component usage
<div className={getFieldClasses(fieldLayouts.title)}>
  <SelectField label="Title" />
</div>
```

### 5. Benefits of This Approach

1. **Single Source of Truth**: All design values defined in one place
2. **Consistent Spacing**: Form gaps, section spacing standardized
3. **Responsive by Default**: Field sizes adapt based on screen size
4. **Easy Updates**: Change a value in config, updates everywhere
5. **Type Safety**: TypeScript ensures valid values
6. **Semantic Naming**: Clear what each value represents
7. **Framework Alignment**: Works with Tailwind's utility classes

### 6. Migration Strategy

1. Update `tailwind.config.ts` with extended theme
2. Create the form system configuration module
3. Replace hardcoded values in components with config references
4. Test responsiveness across all breakpoints
5. Document the new system for team members

### 7. Component Library Integration

```typescript
// Extend existing UI components
export const FormGrid = ({ children, type = 'form' }) => (
  <div className={getGridClasses(type)}>
    {children}
  </div>
)

export const FormField = ({ size = 'md', children }) => (
  <div className={getFieldClasses(size)}>
    {children}
  </div>
)

// Usage
<FormGrid type="form">
  <FormField size="xs">
    <Label>Title</Label>
    <Select />
  </FormField>
  <FormField size="sm">
    <Label>First Name</Label>
    <Input />
  </FormField>
</FormGrid>
```

This approach provides a robust, scalable design system that can be easily maintained and updated from a central location.