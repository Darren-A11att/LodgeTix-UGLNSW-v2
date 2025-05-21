# Existing Design Elements Analysis

## Overview
This document catalogs existing design elements in the LodgeTix codebase that can be leveraged to address the design inconsistencies identified in the registration wizard review.

## 1. Color System

### Tailwind Configuration (`tailwind.config.ts`)
The codebase already has a well-defined Masonic color palette:

```javascript
masonic: {
  navy: "#0A2240",
  gold: "#C8A870",
  lightgold: "#E5D6B9",
  blue: "#0F3B6F",
  lightblue: "#E6EBF2",
}
```

### CSS Variables (Multiple Definitions)
Found in `/style/styles/globals.css`:

```css
/* Primary system colors */
--primary: 221 80% 15%;
--secondary: 42 45% 61%;
--destructive: 0 84.2% 60.2%;

/* Additional custom colors */
--color-primary: 25 59 103; /* Navy Blue */
--color-secondary: 180 159 95; /* Gold */
--color-accent: 130 20 30; /* Deep Red */
```

### Existing Color Classes
In `/style/styles/globals.css`:
- `.masonic-gradient`: Linear gradient for navy shades
- `.masonic-gold-gradient`: Linear gradient for gold shades
- `.masonic-divider`: Styled divider with gold color

## 2. Typography System

### Current Typography Setup
Found in CSS files:
- Headings use `font-serif`
- Body uses default sans-serif (`-apple-system, BlinkMacSystemFont, etc.`)
- No explicit type scale defined

### Button Typography
From `/style/styles/globals.css`:
```css
.btn-primary,
.btn-secondary,
.btn-outline {
  @apply px-6 py-3 rounded-md font-medium;
}
```

## 3. Component Library

### shadcn/ui Components
The project uses shadcn/ui with:
- **Configuration**: `/components.json`
- **Style**: Default theme
- **CSS Variables**: Enabled
- **Base Color**: Neutral

Key components already available:
- `Button` with variants (default, destructive, outline, secondary, ghost, link)
- `Card` with sub-components (Header, Title, Description, Content, Footer)
- `Alert` with variants (default, destructive)
- Form components
- Dialog/Modal components
- Many more...

### Custom Components

#### SectionHeader (`/components/register/registration/SectionHeader.tsx`)
A reusable component for consistent section headers:
```jsx
<SectionHeader>
  <h1>Title</h1>
  <div className="masonic-divider"></div>
  <p>Description</p>
</SectionHeader>
```

#### EventCard (`/shared/components/EventCard.tsx`)
Demonstrates consistent card patterns:
- White background with subtle shadow
- Hover effects
- Consistent spacing (`p-6`)
- Icon usage with primary color

## 4. Utility Functions

### Class Management (`/lib/utils.ts`)
```typescript
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```
This utility handles class name merging and conflicts.

## 5. Spacing Patterns

### Container Pattern
From `/style/styles/globals.css`:
```css
.container-custom {
  @apply container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl;
}
```

### Form Element Spacing
- Buttons: `px-6 py-3`
- Cards: `p-6`
- Form controls: `h-11` (44px height)

## 6. Interactive States

### Focus States
From `/style/styles/globals.css`:
```css
.react-tel-input .form-control:focus {
  outline: none !important;
  box-shadow: 0 0 0 2px rgba(var(--color-primary), 0.25) !important;
  border-color: rgba(var(--color-primary), 0.5) !important;
}
```

### Hover States
- Buttons: 90% opacity on hover
- Cards: Enhanced shadow on hover
- Links: Underline on hover

## 7. Existing Design Patterns

### Button Patterns
```css
.btn-primary {
  @apply bg-primary text-white px-6 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors;
}
```

### Form Patterns
- Consistent height for form elements (`h-11`)
- Standardized border and focus states
- Error state styling with red colors

### Card Patterns
From EventCard:
- White background
- Rounded corners (`rounded-lg`)
- Shadow effects
- Border on hover

## 8. Reusable Assets

### Icons
- Using Lucide icons throughout (configured in `components.json`)
- Consistent sizing patterns (`w-4 h-4`, `w-5 h-5`)

### Gradients
Pre-defined gradient classes:
- `.masonic-gradient`
- `.masonic-gold-gradient`

## Recommendations for Reuse

### 1. Consolidate Color System
- Use existing Tailwind masonic colors as primary palette
- Standardize on CSS variables for semantic colors
- Remove duplicate color definitions

### 2. Leverage Existing Components
- Use shadcn/ui components as base
- Extend with custom variants using `cva()`
- Create consistent prop interfaces

### 3. Build on Utility Functions
- Use `cn()` for all class merging
- Create additional utility functions for common patterns

### 4. Standardize Spacing
- Use existing container pattern
- Define spacing scale based on Tailwind defaults
- Create consistent component padding

### 5. Extend Typography
- Build on existing font assignments
- Create type scale using CSS variables
- Define component-specific typography

### 6. Component Composition
- Use SectionHeader pattern throughout
- Extend Card patterns for consistency
- Create reusable form field components

## Conclusion
The codebase already contains many design system elements that can be leveraged:
- Well-defined color palette
- shadcn/ui component library
- Utility functions and patterns
- Some consistent spacing patterns

The key is to:
1. Consolidate duplicate definitions
2. Extend existing patterns systematically
3. Create missing elements (typography scale, spacing system)
4. Document usage guidelines
5. Enforce consistency through components