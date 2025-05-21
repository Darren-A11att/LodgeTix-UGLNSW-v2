# Global Grid Pattern Definitions

## Option 1: Custom Utility Classes in CSS
```css
/* style/styles/globals.css */
@layer components {
  /* Form grid patterns */
  .form-grid {
    @apply grid grid-cols-8 gap-4;
  }
  
  .form-grid-mobile {
    @apply grid grid-cols-2 gap-4 md:grid-cols-8;
  }
  
  .form-grid-responsive {
    @apply grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-8;
  }
  
  /* Specific grid patterns */
  .mason-form-grid {
    @apply grid grid-cols-2 gap-4 md:grid-cols-8 md:gap-4;
  }
  
  .guest-form-grid {
    @apply grid grid-cols-2 gap-3 md:grid-cols-8 md:gap-4;
  }
  
  .ticket-grid {
    @apply grid grid-cols-1 gap-6 md:grid-cols-2;
  }
}
```

### Usage:
```typescript
// Instead of: <div className="grid grid-cols-8 gap-4">
<div className="form-grid">
  <div className="col-field-xs">...</div>
  <div className="col-field-md">...</div>
</div>
```

## Option 2: Component-Based Approach
```typescript
// components/ui/form-grid.tsx
import { cn } from '@/lib/utils'

interface FormGridProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'mobile' | 'responsive' | 'mason' | 'guest'
}

const gridVariants = {
  default: 'grid grid-cols-8 gap-4',
  mobile: 'grid grid-cols-2 gap-4 md:grid-cols-8',
  responsive: 'grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-8',
  mason: 'grid grid-cols-2 gap-4 md:grid-cols-8 md:gap-4',
  guest: 'grid grid-cols-2 gap-3 md:grid-cols-8 md:gap-4',
}

export function FormGrid({ 
  children, 
  className,
  variant = 'default' 
}: FormGridProps) {
  return (
    <div className={cn(gridVariants[variant], className)}>
      {children}
    </div>
  )
}
```

### Usage:
```typescript
// MasonBasicInfo.tsx
import { FormGrid } from '@/components/ui/form-grid'

export function MasonBasicInfo({ mason, onChange }) {
  return (
    <FormGrid variant="mason">
      <div className="col-field-xs">...</div>
      <div className="col-field-md">...</div>
    </FormGrid>
  )
}
```

## Option 3: Tailwind Plugin
```javascript
// tailwind.config.js
const plugin = require('tailwindcss/plugin')

module.exports = {
  plugins: [
    plugin(function({ addComponents }) {
      addComponents({
        '.form-grid': {
          display: 'grid',
          gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
          gap: '1rem',
        },
        '.form-grid-mobile': {
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '1rem',
          '@media (min-width: 768px)': {
            gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
          },
        },
      })
    })
  ],
}
```

## Option 4: CSS Custom Properties with Utilities
```css
/* globals.css */
@layer base {
  :root {
    --form-grid-cols: 8;
    --form-grid-gap: 1rem;
    --form-grid-cols-mobile: 2;
    --form-grid-gap-mobile: 1rem;
  }
}

@layer utilities {
  .form-grid {
    display: grid;
    grid-template-columns: repeat(var(--form-grid-cols-mobile), minmax(0, 1fr));
    gap: var(--form-grid-gap-mobile);
  }
  
  @media (min-width: 768px) {
    .form-grid {
      grid-template-columns: repeat(var(--form-grid-cols), minmax(0, 1fr));
      gap: var(--form-grid-gap);
    }
  }
}
```

## Option 5: Extending Tailwind Theme
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      // Define custom grid templates
      gridTemplateColumns: {
        'form': 'repeat(8, minmax(0, 1fr))',
        'form-mobile': 'repeat(2, minmax(0, 1fr))',
        'form-desktop': 'repeat(8, minmax(0, 1fr))',
      },
      // Define standard gaps
      gap: {
        'form': '1rem',
        'form-tight': '0.75rem',
        'form-loose': '1.5rem',
      }
    }
  }
}
```

### Usage:
```typescript
// Use semantic grid names
<div className="grid grid-cols-form-mobile md:grid-cols-form gap-form">
  <div className="col-field-xs">...</div>
</div>
```

## Option 6: Composition with Multiple Utilities
```typescript
// lib/design-system/grid-patterns.ts
export const gridPatterns = {
  form: 'grid grid-cols-2 md:grid-cols-8 gap-4',
  formTight: 'grid grid-cols-2 md:grid-cols-8 gap-2',
  formLoose: 'grid grid-cols-2 md:grid-cols-8 gap-6',
  mason: 'grid grid-cols-2 md:grid-cols-8 gap-4',
  guest: 'grid grid-cols-2 md:grid-cols-8 gap-4',
  tickets: 'grid grid-cols-1 md:grid-cols-2 gap-6',
}

// Usage in component
import { gridPatterns } from '@/lib/design-system/grid-patterns'

<div className={gridPatterns.form}>
  <div className="col-field-xs">...</div>
</div>
```

## Recommended Approach: Hybrid Solution

### 1. Define in CSS for reusability:
```css
/* globals.css */
@layer components {
  .form-grid {
    @apply grid grid-cols-2 gap-4 md:grid-cols-8;
  }
  
  .form-grid-tight {
    @apply grid grid-cols-2 gap-2 md:grid-cols-8;
  }
  
  .form-grid-loose {
    @apply grid grid-cols-2 gap-6 md:grid-cols-8;
  }
}
```

### 2. Create type-safe component wrapper:
```typescript
// components/ui/form-grid.tsx
export function FormGrid({ 
  children, 
  spacing = 'normal',
  className 
}: {
  children: React.ReactNode
  spacing?: 'tight' | 'normal' | 'loose'
  className?: string
}) {
  const spacingClasses = {
    tight: 'form-grid-tight',
    normal: 'form-grid',
    loose: 'form-grid-loose',
  }
  
  return (
    <div className={cn(spacingClasses[spacing], className)}>
      {children}
    </div>
  )
}
```

### 3. Use in components:
```typescript
// MasonBasicInfo.tsx
<FormGrid spacing="normal">
  <div className="col-field-xs">
    <Label>Title</Label>
    <Select />
  </div>
  <div className="col-field-md">
    <Label>First Name</Label>
    <Input />
  </div>
</FormGrid>
```

## Benefits:
1. **DRY**: No more repeating `grid grid-cols-8 gap-4`
2. **Centralized**: Change grid structure in one place
3. **Semantic**: `form-grid` is clearer than utility soup
4. **Flexible**: Can have different grid patterns for different forms
5. **Type-safe**: Component approach provides TypeScript support
6. **Responsive**: Built-in mobile/desktop differences

This way, you define your grid patterns once and use them everywhere!