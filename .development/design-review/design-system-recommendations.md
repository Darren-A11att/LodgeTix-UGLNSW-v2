# Design System Recommendations

## Executive Summary
The LodgeTix registration wizard currently lacks a cohesive design system, resulting in significant visual inconsistencies across colors, typography, spacing, and component patterns. This document provides comprehensive recommendations for establishing a unified design language.

## 1. Design Principles

### Brand Identity
- **Primary**: Professional, trustworthy, ceremonial
- **Secondary**: Modern, accessible, efficient
- **Tone**: Formal yet approachable

### User Experience Goals
- Clear visual hierarchy
- Consistent interaction patterns
- Accessible design
- Mobile-first approach
- Progressive enhancement

## 2. Color System

### Primary Palette
```css
:root {
  /* Brand Colors */
  --masonic-navy: #002b5c;
  --masonic-gold: #d4a017;
  --masonic-blue: #003d7a;
  
  /* Neutral Colors */
  --gray-900: #111827;
  --gray-700: #374151;
  --gray-600: #4b5563;
  --gray-500: #6b7280;
  --gray-300: #d1d5db;
  --gray-100: #f3f4f6;
  --gray-50: #f9fafb;
  --white: #ffffff;
}
```

### Semantic Colors
```css
:root {
  /* State Colors */
  --color-success: var(--masonic-gold);
  --color-success-light: #f5e6b3;
  --color-error: #dc2626;
  --color-error-light: #fee2e2;
  --color-warning: #f59e0b;
  --color-warning-light: #fef3c7;
  --color-info: var(--masonic-blue);
  --color-info-light: #dbeafe;
}
```

### Color Usage Rules
1. **Text Colors**
   - Primary text: `var(--masonic-navy)`
   - Secondary text: `var(--gray-600)`
   - Disabled text: `var(--gray-500)`
   - Inverse text: `var(--white)`

2. **Background Colors**
   - Primary bg: `var(--white)`
   - Secondary bg: `var(--gray-50)`
   - Card bg: `var(--white)`
   - Header bg: `var(--masonic-navy)`

3. **Interactive Colors**
   - Primary button: `var(--masonic-navy)`
   - Secondary button: `var(--masonic-gold)`
   - Hover states: 10% darker
   - Active states: 20% darker

## 3. Typography System

### Font Family
```css
:root {
  --font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'SF Mono', Consolas, monospace;
}
```

### Type Scale
```css
:root {
  /* Font Sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 2rem;      /* 32px */
  
  /* Font Weights */
  --font-regular: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* Line Heights */
  --leading-tight: 1.2;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

### Typography Components
```css
.heading-1 {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  color: var(--masonic-navy);
}

.heading-2 {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  color: var(--masonic-navy);
}

.heading-3 {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-normal);
  color: var(--masonic-navy);
}

.body-text {
  font-size: var(--text-base);
  font-weight: var(--font-regular);
  line-height: var(--leading-normal);
  color: var(--gray-700);
}

.caption-text {
  font-size: var(--text-sm);
  font-weight: var(--font-regular);
  line-height: var(--leading-normal);
  color: var(--gray-600);
}
```

## 4. Spacing System

### Base Scale
```css
:root {
  /* Spacing Scale (4px base) */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.5rem;    /* 24px */
  --space-6: 2rem;      /* 32px */
  --space-8: 3rem;      /* 48px */
  --space-10: 4rem;     /* 64px */
  --space-12: 6rem;     /* 96px */
}
```

### Component Spacing
```css
/* Cards */
.card {
  padding: var(--space-5);
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Forms */
.form-section { gap: var(--space-5); }
.form-group { gap: var(--space-3); }
.form-field { gap: var(--space-2); }

/* Buttons */
.button {
  padding: var(--space-2) var(--space-4);
  gap: var(--space-2);
}

/* Lists */
.list { gap: var(--space-2); }
.list-item { padding: var(--space-3); }
```

## 5. Component Patterns

### Button System
```css
/* Base Button */
.btn {
  font-weight: var(--font-medium);
  border-radius: 0.375rem;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Primary Button */
.btn-primary {
  background: var(--masonic-navy);
  color: var(--white);
}

.btn-primary:hover {
  background: var(--masonic-blue);
}

/* Secondary Button */
.btn-secondary {
  background: var(--masonic-gold);
  color: var(--masonic-navy);
}

/* Outline Button */
.btn-outline {
  border: 2px solid var(--masonic-navy);
  color: var(--masonic-navy);
  background: transparent;
}
```

### Card Patterns
```css
.card {
  background: var(--white);
  border: 1px solid var(--gray-300);
  border-radius: 0.5rem;
}

.card-header {
  padding: var(--space-4);
  border-bottom: 1px solid var(--gray-300);
}

.card-content {
  padding: var(--space-5);
}

.card-footer {
  padding: var(--space-4);
  border-top: 1px solid var(--gray-300);
  background: var(--gray-50);
}
```

### Form Elements
```css
.input {
  border: 1px solid var(--gray-300);
  border-radius: 0.375rem;
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-base);
  transition: border-color 0.15s ease;
}

.input:focus {
  border-color: var(--masonic-navy);
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--gray-700);
  margin-bottom: var(--space-1);
}
```

## 6. Grid System

### Container
```css
.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

@media (min-width: 640px) {
  .container { max-width: 640px; }
}

@media (min-width: 768px) {
  .container { max-width: 768px; }
}

@media (min-width: 1024px) {
  .container { max-width: 1024px; }
}

@media (min-width: 1280px) {
  .container { max-width: 1280px; }
}
```

### Grid Layout
```css
.grid {
  display: grid;
  gap: var(--space-4);
}

/* Responsive Columns */
.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }

@media (min-width: 768px) {
  .md\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
  .md\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 1024px) {
  .lg\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
  .lg\:grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
}
```

## 7. Component Library Structure

### Base Components
```jsx
// Typography
<Heading level={1}>Main Title</Heading>
<Text variant="body">Content</Text>
<Caption>Helper text</Caption>

// Layout
<Container>
  <Grid cols={3} gap={4}>
    <GridItem>Content</GridItem>
  </Grid>
</Container>

// Buttons
<Button variant="primary" size="medium">
  Click Me
</Button>

// Cards
<Card>
  <CardHeader>Title</CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Actions</CardFooter>
</Card>

// Forms
<FormField>
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" />
  <HelperText>Enter your email</HelperText>
</FormField>
```

## 8. Implementation Guidelines

### Phase 1: Foundation (Weeks 1-2)
1. Create CSS custom properties
2. Build base component library
3. Document component usage
4. Create Storybook for components

### Phase 2: Migration (Weeks 3-4)
1. Audit existing components
2. Create migration guide
3. Update step by step
4. Test each migration

### Phase 3: Enhancement (Weeks 5-6)
1. Add advanced patterns
2. Create theme variants
3. Implement dark mode
4. Performance optimization

### Phase 4: Documentation (Week 7)
1. Complete style guide
2. Create usage examples
3. Developer documentation
4. Training materials

## 9. Accessibility Requirements

### Color Contrast
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum

### Focus States
```css
.focusable:focus {
  outline: 2px solid var(--masonic-blue);
  outline-offset: 2px;
}
```

### ARIA Labels
- All interactive elements must have labels
- Form fields must have associated labels
- Error messages must be announced

## 10. Performance Considerations

### CSS Architecture
- Use CSS custom properties for theming
- Minimize specificity
- Avoid deep nesting
- Use utility classes sparingly

### Component Optimization
- Lazy load heavy components
- Use CSS Grid over flexbox where appropriate
- Minimize JavaScript for styling
- Implement critical CSS

## Conclusion
Implementing this design system will:
- Create visual consistency across all steps
- Improve development efficiency
- Enhance user experience
- Simplify maintenance
- Enable easier scaling

The key to success is gradual implementation, starting with foundational elements and progressively enhancing the system while maintaining backward compatibility during the transition.