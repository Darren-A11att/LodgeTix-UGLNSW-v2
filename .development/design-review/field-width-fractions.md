# Field Width Fractional System

## Overview
A comprehensive system for defining field widths as fractions, particularly for mobile where fields can be 1/2 of the container.

## Fractional Width System

### 1. Tailwind Configuration for Fractions
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      width: {
        '1/8': '12.5%',
        '2/8': '25%',
        '3/8': '37.5%',
        '4/8': '50%',
        '5/8': '62.5%',
        '6/8': '75%',
        '7/8': '87.5%',
        '8/8': '100%',
      },
      gridTemplateColumns: {
        // Fractional grid systems
        '8': 'repeat(8, minmax(0, 1fr))',
        '12': 'repeat(12, minmax(0, 1fr))',
        '16': 'repeat(16, minmax(0, 1fr))',
      },
    }
  }
}
```

### 2. Field Width Definitions
```typescript
// lib/design-system/field-widths.ts
export const fieldWidths = {
  // Mobile-first fractional system
  fractions: {
    '1/4': { mobile: 'w-2/8', tablet: 'w-2/8', desktop: 'w-1/8' },
    '1/2': { mobile: 'w-4/8', tablet: 'w-4/8', desktop: 'w-2/8' },
    '3/4': { mobile: 'w-6/8', tablet: 'w-6/8', desktop: 'w-3/8' },
    'full': { mobile: 'w-8/8', tablet: 'w-8/8', desktop: 'w-4/8' },
  },
  
  // Grid-based fractional system
  grid: {
    xs: { span: 1, mobile: 'col-span-4', desktop: 'col-span-1' }, // 1/2 mobile, 1/8 desktop
    sm: { span: 2, mobile: 'col-span-4', desktop: 'col-span-2' }, // 1/2 mobile, 1/4 desktop
    md: { span: 4, mobile: 'col-span-8', desktop: 'col-span-4' }, // full mobile, 1/2 desktop
    lg: { span: 6, mobile: 'col-span-8', desktop: 'col-span-6' }, // full mobile, 3/4 desktop
    xl: { span: 8, mobile: 'col-span-8', desktop: 'col-span-8' }, // full both
  },
  
  // Specific field patterns
  patterns: {
    title: '1/4',      // Quarter width on desktop, half on mobile
    name: '1/2',       // Half width on desktop, half on mobile
    email: 'full',     // Full width always
    phone: '1/2',      // Half width
    postal: '1/4',     // Quarter width
  }
}
```

### 3. CSS Custom Properties Approach
```css
/* style/styles/globals.css */
@layer base {
  :root {
    /* Fractional widths */
    --field-1-8: 12.5%;
    --field-1-4: 25%;
    --field-3-8: 37.5%;
    --field-1-2: 50%;
    --field-5-8: 62.5%;
    --field-3-4: 75%;
    --field-7-8: 87.5%;
    --field-full: 100%;
    
    /* Mobile overrides */
    @media (max-width: 640px) {
      --field-1-8: 50%;  /* 1/8 becomes 1/2 on mobile */
      --field-1-4: 50%;  /* 1/4 becomes 1/2 on mobile */
      --field-3-8: 50%;  /* 3/8 becomes 1/2 on mobile */
      --field-1-2: 50%;  /* 1/2 stays 1/2 on mobile */
      --field-5-8: 100%; /* 5/8 becomes full on mobile */
      --field-3-4: 100%; /* 3/4 becomes full on mobile */
    }
  }
}

/* Utility classes */
.field-quarter { width: var(--field-1-4); }
.field-third { width: var(--field-3-8); }
.field-half { width: var(--field-1-2); }
.field-two-thirds { width: var(--field-5-8); }
.field-three-quarter { width: var(--field-3-4); }
.field-full { width: var(--field-full); }
```

### 4. Component Implementation
```typescript
// components/ui/fractional-field.tsx
interface FractionalFieldProps {
  fraction: '1/4' | '1/2' | '3/4' | 'full'
  mobileOverride?: '1/2' | 'full'
  children: React.ReactNode
}

export function FractionalField({ 
  fraction, 
  mobileOverride,
  children 
}: FractionalFieldProps) {
  const classes = cn(
    // Desktop width
    {
      '1/4': 'md:w-1/4',
      '1/2': 'md:w-1/2',
      '3/4': 'md:w-3/4',
      'full': 'md:w-full',
    }[fraction],
    // Mobile width (default or override)
    {
      '1/2': 'w-1/2',
      'full': 'w-full',
    }[mobileOverride || (fraction === 'full' ? 'full' : '1/2')]
  )
  
  return <div className={classes}>{children}</div>
}
```

### 5. Grid-Based Fractional System
```typescript
// Using CSS Grid for precise fractions
export const fractionalGrid = {
  container: 'grid grid-cols-8 gap-4', // 8-column grid
  
  fields: {
    eighths: {
      1: 'col-span-1', // 1/8
      2: 'col-span-2', // 2/8 = 1/4
      3: 'col-span-3', // 3/8
      4: 'col-span-4', // 4/8 = 1/2
      5: 'col-span-5', // 5/8
      6: 'col-span-6', // 6/8 = 3/4
      7: 'col-span-7', // 7/8
      8: 'col-span-8', // 8/8 = full
    },
    
    // Responsive overrides
    mobile: {
      small: 'col-span-4 md:col-span-2',  // 1/2 mobile, 1/4 desktop
      medium: 'col-span-4 md:col-span-4', // 1/2 mobile, 1/2 desktop
      large: 'col-span-8 md:col-span-6',  // full mobile, 3/4 desktop
      full: 'col-span-8',                 // full always
    }
  }
}
```

### 6. Real-World Examples

#### Mason Form with Fractions
```typescript
function MasonBasicInfo() {
  return (
    <div className={fractionalGrid.container}>
      {/* Title: 1/4 desktop, 1/2 mobile */}
      <div className={fractionalGrid.fields.mobile.small}>
        <Label>Title</Label>
        <Select />
      </div>
      
      {/* First Name: 1/2 desktop, 1/2 mobile */}
      <div className={fractionalGrid.fields.mobile.medium}>
        <Label>First Name</Label>
        <Input />
      </div>
      
      {/* Email: Full width always */}
      <div className={fractionalGrid.fields.mobile.full}>
        <Label>Email</Label>
        <Input />
      </div>
    </div>
  )
}
```

#### Using Fractional Components
```typescript
function RegistrationForm() {
  return (
    <FormGrid>
      <FractionalField fraction="1/4">
        <TitleSelect />
      </FractionalField>
      
      <FractionalField fraction="1/2">
        <FirstNameInput />
      </FractionalField>
      
      <FractionalField fraction="1/2">
        <LastNameInput />
      </FractionalField>
      
      <FractionalField fraction="full">
        <EmailInput />
      </FractionalField>
    </FormGrid>
  )
}
```

### 7. Advanced Fractional Patterns

```typescript
// Complex fractional layouts
export const advancedFractions = {
  // 12-column system for finer control
  grid12: {
    '1/12': 'col-span-1',
    '1/6': 'col-span-2',  
    '1/4': 'col-span-3',
    '1/3': 'col-span-4',
    '5/12': 'col-span-5',
    '1/2': 'col-span-6',
    '7/12': 'col-span-7',
    '2/3': 'col-span-8',
    '3/4': 'col-span-9',
    '5/6': 'col-span-10',
    '11/12': 'col-span-11',
    'full': 'col-span-12',
  },
  
  // Responsive fractional system
  responsive: {
    title: 'col-span-6 md:col-span-3',     // 1/2 → 1/4
    name: 'col-span-6 md:col-span-4',      // 1/2 → 1/3
    email: 'col-span-12',                  // always full
    phone: 'col-span-6 md:col-span-4',     // 1/2 → 1/3
    postcode: 'col-span-6 md:col-span-3',  // 1/2 → 1/4
  }
}
```

### 8. Benefits of Fractional System

1. **Mathematical Precision**: Exact fractional widths
2. **Responsive Logic**: Clear mobile-to-desktop transitions
3. **Visual Rhythm**: Creates consistent spacing patterns
4. **Easy Mental Model**: Think in fractions, not pixels
5. **Flexible Grids**: 8, 12, or 16 column systems
6. **CSS Variables**: Runtime customization possible

This fractional system provides precise control over field widths while maintaining responsive behavior across all devices.