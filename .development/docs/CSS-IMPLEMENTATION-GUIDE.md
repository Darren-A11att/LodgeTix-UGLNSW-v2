# CSS Implementation Guide

This guide provides detailed steps for implementing the CSS consolidation plan.

## Step 1: Update `style/styles/globals.css`

Replace the contents of `style/styles/globals.css` with the consolidated CSS from `CONSOLIDATED-GLOBALS-CSS.md`. This file will become the single source of truth for all CSS variables.

## Step 2: Update `tailwind.config.ts`

Update the colors section of the Tailwind configuration to reference the new variables:

```typescript
// Example updates to tailwind.config.ts
colors: {
  border: "hsl(var(--border))",
  input: "hsl(var(--input))",
  ring: "hsl(var(--ring))",
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  primary: {
    DEFAULT: "hsl(var(--primary))",
    foreground: "hsl(var(--primary-foreground))",
  },
  secondary: {
    DEFAULT: "hsl(var(--secondary))",
    foreground: "hsl(var(--secondary-foreground))",
  },
  // ... other color definitions ...
  
  // Update masonic colors to use the HSL variables
  masonic: {
    navy: "hsl(var(--masonic-navy))",
    gold: "hsl(var(--masonic-gold))",
    lightgold: "hsl(var(--masonic-lightgold))",
    blue: "hsl(var(--masonic-blue))",
    lightblue: "hsl(var(--masonic-lightblue))",
    red: "hsl(var(--masonic-red))",
  },
},
```

## Step 3: Update Component Imports

1. Find all components that import CSS from `style/styles/globals.css` or `shared/theme/index.css`
2. Update imports to reference `style/styles/globals.css` instead

Example:
```tsx
// Before
import '../../../style/styles/globals.css';
// or
import '../../../shared/theme/index.css';

// After
import '../../../style/styles/globals.css';
```

## Step 4: Update Direct Color References

Replace direct Tailwind color references with CSS variable equivalents:

| Before | After |
|--------|-------|
| `bg-slate-50` | `bg-background` |
| `border-slate-300` | `border-input` |
| `text-slate-700` | `text-foreground` |
| `rgba(var(--color-primary), 0.5)` | `hsl(var(--masonic-navy) / 0.5)` |

## Step 5: Test in Different Components

Test the changes in various components to ensure visual consistency:

1. Test forms from `components/register/forms/guest/`
2. Test forms from `components/register/forms/mason/`
3. Test navigation and UI components
4. Test in both light and dark modes

## Step 6: Handle Special Cases

### Phone Input Component

1. Create a separate `phone-input.css` file to contain all the phone input styling
2. Import this file only in components that use the phone input

### Custom Components

For components with special styling needs:
1. Use the component CSS pattern with `@layer components`
2. Ensure consistent variable usage

## Step 7: Clean Up

After successful migration:

1. Remove `style/styles/globals.css`
2. Remove `shared/theme/index.css` (after moving phone input styles to a dedicated file)
3. Update imports in all files

## Step 8: Documentation

Create a style guide document explaining:

1. The color system and variables
2. How to use the variables in components
3. Best practices for maintaining style consistency

## Testing Plan

For each phase, test:

1. Visual appearance of all components
2. Dark mode functionality
3. Responsive design at different breakpoints
4. Browser compatibility (Chrome, Firefox, Safari)