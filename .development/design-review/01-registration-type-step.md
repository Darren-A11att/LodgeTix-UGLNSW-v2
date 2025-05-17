# Design Review: Registration Type Step (Step 1)

## File Path
`/components/register/steps/registration-type-step.tsx`

## Design Issues Identified

### Typography Issues
1. **Inconsistent Heading Hierarchy**
   - Main heading uses `<h1>` with `text-2xl font-bold` directly
   - Cards use `CardTitle` components without explicit sizing
   - No consistent typographic scale defined

2. **Font Weight Variations**
   - Main heading uses `font-bold`
   - No explicit font weights for card titles
   - List items have no defined font weights

### Color Inconsistencies
1. **Multiple Color Implementations**
   - Main heading: `text-masonic-navy`
   - Description: `text-gray-600`
   - Check icons: `text-masonic-navy`
   - Card description: Uses `CardDescription` component color
   - Button colors: `bg-masonic-navy hover:bg-masonic-blue`
   - Selected state: `border-masonic-gold bg-masonic-lightblue`
   - Hover state: `hover:border-masonic-lightgold`

2. **No Consistent Color Tokens**
   - Some colors use custom masonic theme (masonic-navy, masonic-gold)
   - Others use generic Tailwind colors (gray-600)
   - Mixed usage creates visual inconsistency

### Layout & Spacing Issues
1. **Card Grid**
   - Uses `gap-6` for grid spacing
   - Uses `space-y-6` for vertical spacing
   - No consistent spacing system

2. **Component Internal Spacing**
   - Cards use different spacing approaches
   - `CardHeader` has `text-center` but no explicit padding
   - List items use `space-y-2`
   - Footer has `pt-2 mt-auto`

### Visual Components
1. **Icon Inconsistency**
   - Icons are in circles with hard-coded sizes: `h-12 w-12`
   - Icon color is white on masonic-navy background
   - Check icons use different sizing: `h-4 w-4`

2. **Border & Shadow Effects**
   - Base state: `border-2 border-gray-200`
   - Selected state: `border-masonic-gold bg-masonic-lightblue`
   - Hover state: `hover:border-masonic-lightgold`
   - No consistent border width or radius system

3. **Button Styling**
   - Uses custom colors: `bg-masonic-navy hover:bg-masonic-blue`
   - Full width buttons: `w-full`
   - Modal buttons have additional colors: `bg-red-600 hover:bg-red-700`

### Interactive States
1. **Hover Effects**
   - Cards: `hover:border-masonic-lightgold`
   - Buttons: `hover:bg-masonic-blue`
   - No consistent hover behavior across components

2. **Selected States**
   - Cards get border color change AND background color
   - Very prominent visual change (possibly too heavy)

### Component Library Usage
1. **Mixed Component Sources**
   - Uses shadcn/ui components (Card, Button, AlertDialog)
   - Custom SectionHeader component
   - Direct Tailwind classes
   - Creates inconsistent styling approach

### Modal Styling
1. **AlertDialog Colors**
   - Uses different button colors than main UI
   - Red button for destructive action: `bg-red-600 hover:bg-red-700`
   - No consistent modal design language

## Summary
The Registration Type Step shows clear signs of design inconsistency:
- No unified color palette
- Mixed typography scales
- Inconsistent spacing system
- Different hover/active states across components
- Mixed usage of component libraries and custom styling
- No clear design tokens or system in place