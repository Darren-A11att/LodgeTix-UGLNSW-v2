# Registration Type Step - Global Design System Implementation

## Current Issues (from 01-registration-type-step.md)
- Individual values hardcoded throughout
- Field widths defined inline
- No central configuration
- Difficult to maintain consistency

## Solution: Global Design System

### 1. Define Registration-Specific Tokens
Add to `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    // Registration-specific configurations
    spacing: {
      'reg-card-padding': '1.5rem',
      'reg-card-gap': '1rem',
      'reg-section-gap': '2rem',
    },
    
    gridTemplateColumns: {
      'reg-types': 'repeat(auto-fit, minmax(18rem, 1fr))',
      'reg-types-mobile': '1fr',
    },
    
    minWidth: {
      'reg-card': '18rem',
    },
    
    maxWidth: {
      'reg-container': '64rem',
      'reg-card': '24rem',
    },
  }
}
```

### 2. Create Registration Constants
Location: `/components/register/config/design-tokens.ts`

```typescript
export const registrationDesign = {
  // Layout configurations
  layouts: {
    typeSelection: {
      container: 'max-w-reg-container mx-auto',
      grid: 'grid grid-cols-reg-types-mobile md:grid-cols-reg-types gap-reg-card-gap',
      card: 'min-w-reg-card max-w-reg-card',
    },
    
    wizard: {
      container: 'max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8',
      content: 'max-w-4xl mx-auto',
    },
  },
  
  // Card styles
  cards: {
    type: {
      base: 'p-reg-card-padding rounded-card border-2 transition-all duration-200',
      interactive: 'hover:border-primary hover:shadow-card-hover cursor-pointer',
      selected: 'border-primary bg-primary/5',
      disabled: 'opacity-50 cursor-not-allowed',
    },
  },
  
  // Typography configurations
  typography: {
    cardTitle: 'text-xl font-semibold text-gray-900',
    cardDescription: 'text-sm text-gray-600 mt-2',
    sectionTitle: 'text-2xl font-bold text-gray-900',
    stepIndicator: 'text-sm font-medium',
  },
  
  // Animation configurations
  animations: {
    cardHover: 'hover:scale-[1.02] transition-transform duration-200',
    fadeIn: 'animate-in fade-in duration-300',
    slideUp: 'animate-in slide-in-from-bottom duration-300',
  },
  
  // Responsive breakpoints
  breakpoints: {
    mobile: 'sm:',
    tablet: 'md:',
    desktop: 'lg:',
  },
}
```

### 3. Implement Global Classes
Location: `/style/styles/globals.css`

```css
@layer components {
  /* Registration Card System */
  .reg-card {
    @apply p-reg-card-padding rounded-card border-2 
           transition-all duration-200;
  }
  
  .reg-card-interactive {
    @apply hover:border-primary hover:shadow-card-hover 
           cursor-pointer hover:scale-[1.02];
  }
  
  .reg-card-selected {
    @apply border-primary bg-primary/5;
  }
  
  /* Registration Grid System */
  .reg-grid {
    @apply grid gap-reg-card-gap;
  }
  
  .reg-grid-types {
    @apply grid-cols-1 md:grid-cols-reg-types;
  }
  
  /* Registration Typography */
  .reg-title {
    @apply text-2xl font-bold text-gray-900;
  }
  
  .reg-card-title {
    @apply text-xl font-semibold text-gray-900;
  }
  
  .reg-description {
    @apply text-sm text-gray-600;
  }
}
```

### 4. Refactored Component Using Global System

```typescript
import { registrationDesign } from '@/components/register/config/design-tokens'
import { cn } from '@/lib/utils'

export function RegistrationTypeStep() {
  const { layouts, cards, typography } = registrationDesign
  
  return (
    <div className={layouts.wizard.container}>
      <div className={layouts.wizard.content}>
        <h1 className={typography.sectionTitle}>
          Choose Registration Type
        </h1>
        
        <div className={layouts.typeSelection.grid}>
          {registrationTypes.map((type) => (
            <Card
              key={type.id}
              className={cn(
                cards.type.base,
                cards.type.interactive,
                isSelected && cards.type.selected,
                isDisabled && cards.type.disabled
              )}
              onClick={() => handleSelect(type)}
            >
              <CardHeader>
                <Icon className="w-12 h-12 text-primary" />
                <CardTitle className={typography.cardTitle}>
                  {type.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={typography.cardDescription}>
                  {type.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### 5. Benefits of This Approach

1. **Centralized Control**: Change registration card padding everywhere by updating one value
2. **Semantic Naming**: `reg-card-padding` is clearer than `p-6`
3. **Responsive by Default**: Grid automatically adjusts based on screen size
4. **Type Safety**: TypeScript ensures we use valid design tokens
5. **Easy Theming**: Can swap entire design systems by changing config
6. **Consistent Spacing**: All registration components use same spacing scale

### 6. Example: Changing Field Widths Globally

Instead of:
```typescript
// Hardcoded in multiple files
<div className="col-span-1 md:col-span-2">
```

Use:
```typescript
// Defined once in config
const fieldSizes = {
  small: 'col-span-1',
  medium: 'col-span-1 md:col-span-2',
  large: 'col-span-2 md:col-span-4',
}

// Used consistently everywhere
<div className={fieldSizes.medium}>
```

### 7. Quick Migration Guide

1. **Identify repeated values** across components
2. **Add to Tailwind config** or create constants file
3. **Replace hardcoded values** with config references
4. **Create utility classes** for common patterns
5. **Document the system** for team adoption

### 8. Real-World Example: Form Fields

```typescript
// Before: Scattered definitions
<div className="col-span-2 md:col-span-1"> // Title field
<div className="col-span-2 md:col-span-2"> // Name field
<div className="col-span-2 md:col-span-4"> // Email field

// After: Centralized system
const FIELD_LAYOUTS = {
  quarter: 'field-xs',   // 25% desktop, 50% mobile
  half: 'field-sm',      // 50% desktop, 50% mobile
  full: 'field-full',    // 100% all devices
}

<div className={FIELD_LAYOUTS.quarter}> // Title
<div className={FIELD_LAYOUTS.half}>    // Name
<div className={FIELD_LAYOUTS.full}>    // Email
```

This approach transforms individual inline styles into a cohesive, maintainable design system that can be updated globally from a single location.