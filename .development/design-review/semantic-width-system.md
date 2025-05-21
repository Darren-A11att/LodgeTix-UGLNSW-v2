# Semantic Width System with Tailwind

## Overview
Define semantic width classes in your components (like `w-field-sm`) and configure what those mean globally in your Tailwind config.

## Implementation

### 1. Define Custom Widths in Tailwind Config
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      width: {
        // Semantic field widths
        'field-xs': '12.5%',    // 1/8 width
        'field-sm': '25%',      // 1/4 width
        'field-md': '50%',      // 1/2 width
        'field-lg': '75%',      // 3/4 width
        'field-xl': '100%',     // Full width
        
        // Mobile-specific overrides
        'field-sm-mobile': '50%',
        'field-md-mobile': '100%',
        'field-lg-mobile': '100%',
      },
      
      // Using CSS Grid spans
      gridColumn: {
        'field-sm': 'span 1 / span 1',
        'field-md': 'span 2 / span 2',
        'field-lg': 'span 3 / span 3',
        'field-xl': 'span 4 / span 4',
      }
    }
  }
}
```

### 2. Use in Components
```typescript
// components/register/forms/mason/MasonForm.tsx
function MasonForm() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {/* Small field - will be 25% on desktop */}
      <div className="w-field-sm">
        <Label>Title</Label>
        <Select />
      </div>
      
      {/* Medium field - will be 50% on desktop */}
      <div className="w-field-md">
        <Label>First Name</Label>
        <Input />
      </div>
      
      {/* Extra large field - will be 100% */}
      <div className="w-field-xl">
        <Label>Email</Label>
        <Input />
      </div>
    </div>
  )
}
```

### 3. Using CSS Custom Properties for Runtime Control
```css
/* style/styles/globals.css */
@layer base {
  :root {
    /* Define field widths as CSS variables */
    --field-xs: 12.5%;
    --field-sm: 25%;
    --field-md: 50%;
    --field-lg: 75%;
    --field-xl: 100%;
  }
  
  /* Mobile overrides */
  @media (max-width: 640px) {
    :root {
      --field-xs: 50%;   /* Small becomes half on mobile */
      --field-sm: 50%;   /* Small becomes half on mobile */
      --field-md: 100%;  /* Medium becomes full on mobile */
      --field-lg: 100%;  /* Large becomes full on mobile */
    }
  }
}

/* Custom utility classes using CSS variables */
@layer utilities {
  .w-field-xs { width: var(--field-xs); }
  .w-field-sm { width: var(--field-sm); }
  .w-field-md { width: var(--field-md); }
  .w-field-lg { width: var(--field-lg); }
  .w-field-xl { width: var(--field-xl); }
}
```

### 4. Grid-Based Semantic Widths
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      gridColumn: {
        // Semantic grid spans
        'field-xs': 'span 1 / span 1',
        'field-sm': 'span 1 / span 1',
        'field-md': 'span 2 / span 2',
        'field-lg': 'span 3 / span 3',
        'field-xl': 'span 4 / span 4',
      }
    }
  }
}

// Usage in component
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <div className="col-field-sm">
    <TitleSelect />
  </div>
  <div className="col-field-md">
    <FirstNameInput />
  </div>
</div>
```

### 5. Responsive Semantic Classes
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      width: {
        // Base widths
        'field-sm': '25%',
        'field-md': '50%',
        'field-lg': '75%',
        'field-xl': '100%',
      }
    }
  }
}

// Usage with responsive modifiers
<div className="w-full md:w-field-sm">
  <TitleSelect />
</div>

<div className="w-full md:w-field-md">
  <FirstNameInput />
</div>
```

### 6. Creating a Complete System
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      spacing: {
        // Semantic spacing
        'form-gap': '1rem',
        'section-gap': '2rem',
      },
      
      width: {
        // Semantic widths
        'field-xs': '12.5%',
        'field-sm': '25%',
        'field-md': '50%',
        'field-lg': '75%',
        'field-xl': '100%',
      },
      
      height: {
        // Semantic heights
        'input': '2.75rem',
        'button': '2.75rem',
      },
      
      borderRadius: {
        // Semantic radii
        'input': '0.375rem',
        'button': '0.375rem',
        'card': '0.5rem',
      }
    }
  }
}

// Usage in components
<form className="space-y-section-gap">
  <div className="grid grid-cols-4 gap-form-gap">
    <div className="w-field-sm">
      <input className="h-input rounded-input" />
    </div>
  </div>
</form>
```

### 7. Practical Examples

#### Before (hardcoded values):
```typescript
<div className="w-1/4">
  <TitleSelect />
</div>
<div className="w-1/2">
  <FirstNameInput />
</div>
<div className="w-full">
  <EmailInput />
</div>
```

#### After (semantic values):
```typescript
<div className="w-field-sm">
  <TitleSelect />
</div>
<div className="w-field-md">
  <FirstNameInput />
</div>
<div className="w-field-xl">
  <EmailInput />
</div>
```

### 8. Benefits

1. **Semantic Naming**: `w-field-sm` is clearer than `w-1/4`
2. **Global Control**: Change the definition of "small" in one place
3. **Consistency**: All small fields are exactly the same width
4. **Responsive**: Can have different values at different breakpoints
5. **Maintainable**: Easy to update design system
6. **Self-Documenting**: Code shows intent, not implementation

### 9. Advanced Pattern: Component-Specific Widths
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      width: {
        // Form field widths
        'field-title': '25%',
        'field-name': '50%',
        'field-email': '100%',
        'field-phone': '50%',
        'field-postal': '25%',
        
        // Card widths
        'card-sm': '18rem',
        'card-md': '24rem',
        'card-lg': '32rem',
      }
    }
  }
}

// Ultra-specific usage
<div className="w-field-title">
  <TitleSelect />
</div>
<div className="w-field-name">
  <FirstNameInput />
</div>
```

This approach gives you exactly what you want - define semantic class names in your components, then control what those mean globally in your Tailwind configuration or CSS.