# Production Config Migration Guide

## Overview
This guide walks through implementing the global design system in your LodgeTix application. The changes are designed to be non-breaking and can be applied gradually.

## Step 1: Backup Current Files
Before making any changes, backup your current configuration files:
```bash
cp tailwind.config.ts tailwind.config.ts.backup
cp app/globals.css app/globals.css.backup
```

## Step 2: Update Tailwind Configuration
Replace your existing `tailwind.config.ts` with the updated version that includes all the design system extensions.

Key additions:
- Grid column utilities (`field-xs`, `field-sm`, etc.)
- Semantic spacing (`form-gap`, `section-gap`)
- Component heights (`input`, `button`)
- Typography scale (`label`, `hint`, `error`)
- Form-specific utilities

## Step 3: Update Global CSS
Add the new design system classes to your `app/globals.css` file. The new classes are added in the `@layer components` section and won't conflict with existing styles.

New classes include:
- `.form-grid` - Responsive grid layouts
- `.field-*` - Field size utilities
- `.input-base`, `.button-base` - Component base classes
- `.form-section` - Section spacing patterns

## Step 4: Create Design Token Module
Create a new file at `lib/design-system/tokens.ts` with the provided design tokens. This provides:
- Centralized configuration
- Type-safe token access
- Helper functions for common patterns

## Step 5: Start Using New Classes (Gradual Migration)

### Example 1: Replace Grid Layout
```typescript
// Before
<div className="grid grid-cols-12 gap-4">
  <div className="col-span-3">...</div>
  <div className="col-span-6">...</div>
</div>

// After  
<div className="form-grid">
  <div className="field-xs">...</div>
  <div className="field-md">...</div>
</div>
```

### Example 2: Use Semantic Field Sizes
```typescript
// Before
<div className="w-full md:w-1/4">
  <Label>Title</Label>
  <Select className="h-11" />
</div>

// After
<div className="field-xs">
  <Label>Title</Label>
  <Select className="input-base" />
</div>
```

### Example 3: Apply Design Tokens
```typescript
import { designTokens, getFieldSizeClass } from '@/lib/design-system/tokens'

// Use semantic grid
<div className={designTokens.grids.form}>
  {/* Use field patterns */}
  <div className={getFieldSizeClass('xs')}>
    <Label className={designTokens.components.label}>Title</Label>
    <Select className={designTokens.components.select} />
  </div>
</div>
```

## Step 6: Testing

### Visual Testing
1. Components should look identical after migration
2. Responsive behavior should be preserved
3. No layout shifts or broken designs

### Functional Testing
1. Form submissions work correctly
2. Validation displays properly
3. Interactive elements remain functional

## Step 7: Benefits You'll See

1. **Consistency**: All forms use the same spacing and sizing
2. **Maintainability**: Change a design value in one place
3. **Clarity**: Semantic class names like `field-sm` instead of `col-span-3`
4. **Flexibility**: Easy to adjust the design system globally

## Migration Priority

1. **High Priority** (Do First):
   - Form components (MasonForm, GuestForm)
   - Registration wizard steps
   - Payment forms

2. **Medium Priority**:
   - Card components
   - Modal dialogs
   - Attendee lists

3. **Low Priority**:
   - Static content pages
   - Marketing components
   - Footer/Header

## Common Patterns

### Form Layout Pattern
```typescript
<div className="form-grid">
  <div className="field-xs">Title</div>
  <div className="field-xs">Rank</div>
  <div className="field-sm">First Name</div>
  <div className="field-sm">Last Name</div>
  <div className="field-xl">Email</div>
  <div className="field-md">Phone</div>
  <div className="field-md">Contact Preference</div>
</div>
```

### Section Pattern
```typescript
<div className="form-section">
  <h3 className="form-section-header">Personal Information</h3>
  <div className="form-grid">
    {/* fields */}
  </div>
</div>
```

### Card Pattern
```typescript
<div className="card-base card-hover">
  <div className="p-6">
    {/* content */}
  </div>
</div>
```

## Troubleshooting

### Issue: Styles not applying
- Ensure Tailwind config is properly loaded
- Check that globals.css is imported in layout.tsx
- Clear Next.js cache: `rm -rf .next`

### Issue: TypeScript errors
- Install type definitions: `npm i --save-dev @types/tailwindcss`
- Ensure design-tokens.ts is properly imported

### Issue: Layout breaks
- Check responsive classes are applied correctly
- Verify grid container has proper class
- Test at different breakpoints

## Next Steps

1. Start with one component as proof of concept
2. Gradually migrate other components
3. Update team documentation
4. Consider creating Storybook examples
5. Plan training session for team

## Support

For questions or issues:
1. Check the design system documentation
2. Review the example implementations
3. Consult with the design team

This migration can be done incrementally without disrupting current development. Start with new features and gradually update existing components.