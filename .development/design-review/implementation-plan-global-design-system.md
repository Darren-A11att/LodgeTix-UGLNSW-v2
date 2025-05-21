# Global Design System Implementation Plan

## Overview
A phased approach to implementing a global design system, starting with configuration files and CSS, before touching any component code.

## Phase 1: Foundation Setup (Week 1)

### 1.1 Extend Tailwind Configuration
**File:** `tailwind.config.ts`

```typescript
export default {
  theme: {
    extend: {
      // Grid column definitions
      gridColumn: {
        'field-xs': 'span 1 / span 1',  // 12.5% (1/8)
        'field-sm': 'span 2 / span 2',  // 25% (2/8)
        'field-md': 'span 4 / span 4',  // 50% (4/8)
        'field-lg': 'span 6 / span 6',  // 75% (6/8)
        'field-xl': 'span 8 / span 8',  // 100% (8/8)
      },
      
      // Grid templates
      gridTemplateColumns: {
        'form-base': 'repeat(8, minmax(0, 1fr))',
        'form-mobile': 'repeat(2, minmax(0, 1fr))',
        'form-tablet': 'repeat(4, minmax(0, 1fr))',
      },
      
      // Spacing system
      spacing: {
        'form-gap': '1rem',          // Standard form gap
        'form-gap-tight': '0.75rem', // Compact forms
        'form-gap-loose': '1.5rem',  // Spacious forms
        'section-gap': '2rem',       // Between sections
        'card-gap': '1.5rem',        // Between cards
      },
      
      // Component heights
      height: {
        'input': '2.75rem',   // 44px - touch friendly
        'button': '2.75rem',  // 44px - consistent with inputs
        'touch': '3rem',      // 48px - minimum touch target
      },
      
      // Border radius system
      borderRadius: {
        'input': '0.375rem',  // 6px
        'button': '0.375rem', // 6px
        'card': '0.5rem',     // 8px
        'modal': '0.75rem',   // 12px
      },
      
      // Width system
      width: {
        'field-mobile-half': '50%',
        'field-mobile-full': '100%',
        'field-desktop-quarter': '25%',
        'field-desktop-half': '50%',
        'field-desktop-three-quarter': '75%',
        'field-desktop-full': '100%',
      },
      
      // Typography scale
      fontSize: {
        'label': ['0.875rem', { lineHeight: '1.25rem' }],
        'hint': ['0.75rem', { lineHeight: '1rem' }],
        'error': ['0.75rem', { lineHeight: '1rem' }],
      },
      
      // Transition durations
      transitionDuration: {
        'field': '200ms',
        'button': '150ms',
        'modal': '300ms',
      },
    },
  },
  plugins: [],
}
```

### 1.2 Create Global CSS Classes
**File:** `style/styles/globals.css`

```css
@layer components {
  /* Form Grid System */
  .form-grid {
    @apply grid grid-cols-2 gap-form md:grid-cols-8;
  }
  
  .form-grid-tight {
    @apply grid grid-cols-2 gap-form-tight md:grid-cols-8;
  }
  
  .form-grid-loose {
    @apply grid grid-cols-2 gap-form-loose md:grid-cols-8;
  }
  
  /* Responsive Grid Patterns */
  .mason-grid {
    @apply grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-8;
  }
  
  .guest-grid {
    @apply grid grid-cols-2 gap-4 md:grid-cols-8;
  }
  
  .ticket-grid {
    @apply grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3;
  }
  
  /* Form Section Spacing */
  .form-section {
    @apply space-y-section-gap;
  }
  
  .form-section-header {
    @apply text-base font-semibold text-gray-900 mb-4;
  }
  
  /* Field Layout Classes */
  .field-xs {
    @apply col-span-1;
  }
  
  .field-sm {
    @apply col-span-1 md:col-span-2;
  }
  
  .field-md {
    @apply col-span-2 md:col-span-4;
  }
  
  .field-lg {
    @apply col-span-2 md:col-span-6;
  }
  
  .field-xl {
    @apply col-span-2 md:col-span-8;
  }
  
  /* Component Base Classes */
  .input-base {
    @apply w-full h-input px-3 py-2 
           border border-gray-300 rounded-input
           transition-colors duration-field
           focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary
           disabled:bg-gray-50 disabled:text-gray-500;
  }
  
  .button-base {
    @apply h-button px-4 py-2 
           rounded-button font-medium
           transition-all duration-button
           focus:outline-none focus:ring-2 focus:ring-offset-2;
  }
  
  .label-base {
    @apply block text-label font-medium text-gray-700 mb-1;
  }
  
  .error-text {
    @apply text-error text-red-600 mt-1;
  }
  
  .hint-text {
    @apply text-hint text-gray-500 mt-1;
  }
}

/* CSS Custom Properties for runtime control */
@layer base {
  :root {
    /* Grid columns */
    --form-cols-mobile: 2;
    --form-cols-tablet: 4;
    --form-cols-desktop: 8;
    
    /* Field widths */
    --field-xs: 12.5%;
    --field-sm: 25%;
    --field-md: 50%;
    --field-lg: 75%;
    --field-xl: 100%;
    
    /* Mobile overrides */
    @media (max-width: 768px) {
      --field-xs: 50%;
      --field-sm: 50%;
      --field-md: 100%;
      --field-lg: 100%;
    }
  }
}
```

### 1.3 Create Design Token Module
**File:** `lib/design-system/tokens.ts`

```typescript
// Centralized design tokens
export const designTokens = {
  // Grid configurations
  grids: {
    form: 'form-grid',
    mason: 'mason-grid',
    guest: 'guest-grid',
    ticket: 'ticket-grid',
  },
  
  // Field sizes mapping
  fields: {
    title: 'field-xs',
    rank: 'field-xs',
    firstName: 'field-sm',
    lastName: 'field-sm',
    email: 'field-xl',
    phone: 'field-md',
    grandLodge: 'field-xl',
    lodge: 'field-lg',
    lodgeNumber: 'field-xs',
    dietary: 'field-xl',
    notes: 'field-xl',
  },
  
  // Component classes
  components: {
    input: 'input-base',
    button: 'button-base',
    label: 'label-base',
    error: 'error-text',
    hint: 'hint-text',
  },
  
  // Spacing patterns
  spacing: {
    formSection: 'form-section',
    cardPadding: 'p-6',
    modalPadding: 'p-4 sm:p-6',
  },
}
```

## Phase 2: Utility Creation (Week 1-2)

### 2.1 Create Form Component Library
**File:** `components/ui/form-system/index.tsx`

```typescript
import { cn } from '@/lib/utils'
import { designTokens } from '@/lib/design-system/tokens'

// Grid wrapper component
export function FormGrid({ 
  children, 
  variant = 'form',
  className 
}: {
  children: React.ReactNode
  variant?: keyof typeof designTokens.grids
  className?: string
}) {
  return (
    <div className={cn(designTokens.grids[variant], className)}>
      {children}
    </div>
  )
}

// Field wrapper component
export function FormField({
  children,
  size = 'md',
  className
}: {
  children: React.ReactNode
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const sizeClass = `field-${size}`
  return (
    <div className={cn(sizeClass, className)}>
      {children}
    </div>
  )
}

// Section wrapper
export function FormSection({
  children,
  title,
  className
}: {
  children: React.ReactNode
  title?: string
  className?: string
}) {
  return (
    <div className={cn('form-section', className)}>
      {title && <h3 className="form-section-header">{title}</h3>}
      {children}
    </div>
  )
}
```

### 2.2 Create Common Patterns
**File:** `lib/design-system/patterns.ts`

```typescript
// Common field patterns as constants
export const fieldPatterns = {
  // Mason form patterns
  mason: {
    title: 'field-xs',
    rank: 'field-xs',
    firstName: 'field-sm',
    lastName: 'field-sm',
    email: 'field-xl',
    grandLodge: 'field-xl',
    lodge: 'field-lg',
    lodgeNumber: 'field-xs',
  },
  
  // Guest form patterns
  guest: {
    title: 'field-xs',
    relationship: 'field-sm',
    firstName: 'field-sm',
    lastName: 'field-sm',
    email: 'field-xl',
    phone: 'field-md',
  },
  
  // Address patterns
  address: {
    street: 'field-xl',
    city: 'field-md',
    state: 'field-xs',
    postalCode: 'field-xs',
  },
}
```

## Phase 3: Migration Strategy (Week 2-3)

### 3.1 Create Migration Checklist
**File:** `.development/design-review/migration-checklist.md`

```markdown
# Migration Checklist

## Global Files (Complete First)
- [ ] Update tailwind.config.ts with extended theme
- [ ] Add utility classes to globals.css
- [ ] Create design token module
- [ ] Create form component library
- [ ] Document all patterns

## Component Migration Order
1. [ ] Simple components (buttons, inputs)
2. [ ] Form sections (MasonBasicInfo, GuestBasicInfo)
3. [ ] Complex forms (MasonForm, GuestForm)
4. [ ] Registration wizard steps
5. [ ] Modals and overlays

## Per-Component Tasks
- [ ] Replace hardcoded grid with form-grid class
- [ ] Replace col-span-X with field-X classes
- [ ] Use semantic component classes
- [ ] Test responsive behavior
- [ ] Verify field alignments
```

### 3.2 Create Test Plan
**File:** `.development/design-review/test-plan.md`

```markdown
# Design System Test Plan

## Visual Regression Tests
1. Screenshot all forms before migration
2. Apply global classes
3. Screenshot after migration
4. Compare for visual differences

## Responsive Tests
- [ ] Mobile (320px, 375px, 414px)
- [ ] Tablet (768px, 1024px)
- [ ] Desktop (1280px, 1440px, 1920px)

## Browser Tests
- [ ] Chrome
- [ ] Safari
- [ ] Firefox
- [ ] Edge

## Accessibility Tests
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Touch target sizes
- [ ] Color contrast
```

## Phase 4: Gradual Component Migration (Week 3-4)

### 4.1 Start with Proof of Concept
**Component:** `MasonBasicInfo.tsx`

```typescript
// Before
<div className="grid grid-cols-12 gap-4">
  <div className="col-span-3">...</div>
</div>

// After
<FormGrid variant="mason">
  <FormField size="xs">...</FormField>
</FormGrid>
```

### 4.2 Document Patterns
**File:** `.development/design-review/patterns-guide.md`

```markdown
# Design System Patterns

## Grid Usage
- Use `form-grid` for standard 8-column forms
- Use `mason-grid` for Mason-specific layouts
- Use `ticket-grid` for ticket selection

## Field Sizing
- `field-xs`: Titles, ranks, states
- `field-sm`: Names, short selects
- `field-md`: Phone, email (mobile)
- `field-lg`: Lodge names
- `field-xl`: Full width fields

## Responsive Behavior
- Mobile: 2-column grid
- Tablet: 4-column grid
- Desktop: 8-column grid
```

## Phase 5: Rollout and Documentation (Week 4)

### 5.1 Team Training
1. Create video walkthrough
2. Update coding standards
3. Hold design system workshop

### 5.2 Create Component Storybook
```typescript
// .storybook/stories/FormGrid.stories.tsx
export default {
  title: 'Design System/Form Grid',
  component: FormGrid,
}

export const Default = () => (
  <FormGrid>
    <FormField size="xs">Extra Small</FormField>
    <FormField size="sm">Small</FormField>
    <FormField size="md">Medium</FormField>
  </FormGrid>
)
```

## Implementation Timeline

### Week 1: Foundation
- Day 1-2: Update Tailwind config
- Day 3-4: Create global CSS classes
- Day 5: Create design token module

### Week 2: Utilities
- Day 1-2: Build form component library
- Day 3-4: Create pattern documentation
- Day 5: Test utilities in isolation

### Week 3: Migration
- Day 1: Migrate one component (proof of concept)
- Day 2-3: Migrate simple components
- Day 4-5: Migrate complex forms

### Week 4: Completion
- Day 1-2: Complete remaining migrations
- Day 3: Testing and bug fixes
- Day 4: Documentation
- Day 5: Team training

## Success Metrics

1. **Consistency**: All forms use same grid system
2. **Maintainability**: Changes require updating one file
3. **Performance**: No increase in bundle size
4. **Adoption**: Team uses new patterns consistently
5. **Documentation**: Complete pattern library exists

## Next Steps

1. Get approval for Phase 1 implementation
2. Create feature branch for global configs
3. Begin with Tailwind config updates
4. Test in development environment
5. Gather team feedback

This phased approach ensures smooth transition to a global design system without disrupting current development.