# Design Review: Ticket Selection Step (Step 3)

## File Path
`/components/register/steps/ticket-selection-step.tsx`

## Design Issues Identified

### Typography Issues
1. **Inconsistent Heading Hierarchy**
   - Main heading: `<h1>` with `text-2xl font-bold`
   - Section headings: `<h3>` with `font-semibold` but no size specification
   - Card titles: Different styling patterns:
     - Attendee cards: `CardTitle` with `text-lg`
     - Package cards: `<h4>` with `font-medium`
   - No consistent typographic scale

2. **Font Weight Variations**
   - Main heading: `font-bold`
   - Section headings: `font-semibold`
   - Package titles: `font-medium`
   - Table cells: Mix of `font-medium` and no explicit weight
   - Total labels: `font-bold` 
   - Inconsistent weight hierarchy

3. **Text Sizes**
   - Main heading: `text-2xl`
   - Card titles: `text-lg`
   - Description text: `text-sm` and `text-xs`
   - Badge text: No explicit size
   - Table text: Mix of `text-xs` and default sizes

### Color Inconsistencies
1. **Primary Colors**
   - Headers: `text-masonic-navy`
   - Description: `text-gray-600`
   - Icons: `text-masonic-navy`
   - Badges: `bg-masonic-navy`
   - Selected state: `border-masonic-gold`
   - Hover states: `hover:border-masonic-lightgold`

2. **Background Colors**
   - Card headers: `bg-masonic-lightblue`
   - Selected packages: `bg-masonic-lightgold/10`
   - Selected items: `bg-gray-50`
   - Order total card: `bg-masonic-lightgold/10`
   - Different opacity levels used inconsistently

3. **Status Indicators**
   - Check icons: `text-green-600`
   - Remove button: `text-red-600 hover:text-red-700`
   - Warning icons would use different colors
   - No consistent status color system

### Layout & Spacing Issues
1. **Card Component Spacing**
   - Different padding patterns:
     - Header: `py-3 px-4`
     - Content: `p-0` (for collapsed), `px-4 py-3` (for expanded)
     - Footer sections: Mixed spacing
   - Grid gaps: `gap-4` for packages, `space-y-4` for main cards

2. **Table Layout Issues**
   - Inconsistent column widths:
     - Attendee header table: `w-[80%]`, `w-[10%]`, `w-[10%]`
     - Summary table: `w-[22.5%]`, `w-[67.5%]`, `w-[10%]`
   - No standard table styling approach

3. **Button Spacing**
   - Navigation buttons use `flex justify-between`
   - Remove buttons: `h-8 w-8 p-0`
   - Different padding approaches

### Visual Components
1. **Icons**
   - Different icon sizes: `h-5 w-5` vs `h-3 w-3`
   - Custom SVG for expand/collapse icon
   - Mixed icon libraries (Lucide and custom)

2. **Card Styling**
   - Border styles vary:
     - Base: `border-masonic-navy`
     - Selected: `border-2`, `border-masonic-gold`
     - Package cards: `border-2` with transitions
   - Different hover effects per card type

3. **Badge Variations**
   - Attendee type badges: `variant="outline"` with `bg-white`
   - Price badges: No variant, `bg-masonic-navy`
   - No consistent badge design system

4. **Accordion Behavior**
   - Custom accordion implementation
   - Different animations for expand/collapse
   - Inconsistent interaction patterns

### Interactive States
1. **Hover Effects**
   - Card headers: `hover:bg-masonic-lightblue/90`
   - Package cards: `hover:border-masonic-lightgold`
   - Remove buttons: `hover:bg-red-50`
   - Different opacity and color changes

2. **Selected States**
   - Packages: Border change AND background change
   - Individual tickets: Checkbox state
   - Visual feedback varies by component type

3. **Disabled States**
   - Continue button: Generic disabled state
   - No visual consistency for disabled elements

### Component Library Usage
1. **Mixed Component Sources**
   - shadcn/ui: Card, Button, Table, Badge, Checkbox
   - Custom: SectionHeader, AlertModal
   - Direct HTML elements: Tables for layout
   - Creates design inconsistency

2. **Table Usage as Layout**
   - Using tables for non-tabular layout (header alignment)
   - Mixing Table component with HTML tables
   - Poor semantic structure

### Responsive Design Issues
1. **Grid Layouts**
   - Package grid: `md:grid-cols-3`
   - Some responsive classes, but not comprehensive
   - Mobile view likely has issues

2. **Text Truncation**
   - No handling for long text in badges or titles
   - Table cells may overflow on small screens

## Summary
The Ticket Selection Step exhibits significant design inconsistencies:
- Multiple typography scales and weights
- Inconsistent color usage and opacity levels
- Complex custom layouts using tables inappropriately
- Mixed component sources and styling approaches
- Poor responsive design consideration
- Custom accordion implementation vs standard UI patterns
- Inconsistent spacing and padding systems
- Multiple approaches to similar UI elements