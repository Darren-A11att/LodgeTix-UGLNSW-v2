# Spacing and Layout Inconsistencies Analysis

## Overview
The LodgeTix registration wizard demonstrates significant spacing and layout inconsistencies across all steps, lacking a unified spacing system and grid structure.

## Spacing Patterns Identified

### 1. Container Spacing
- `space-y-6`: Most common vertical spacing
- `space-y-8`: Payment and confirmation steps
- `space-y-4`: Within cards and sections
- `space-y-2`: Lists and small groups
- `space-y-1`: Tight lists

### 2. Padding Variations
- `p-6`: Standard card padding
- `p-4`: Alternative card padding
- `p-3`: Smaller sections
- `p-2`: Minimal padding
- `pt-6`, `pb-4`: Asymmetric padding

### 3. Margin Patterns
- `mt-8`: Section separation
- `mt-6`: Sub-section spacing
- `mt-4`: Element spacing
- `mb-8`: Form container spacing
- `mb-4`: Header spacing

### 4. Gap Utilities
- `gap-6`: Large grid gaps
- `gap-4`: Standard gaps
- `gap-2`: Small gaps
- `gap-8`: Extra large gaps

## Step-by-Step Layout Analysis

### Step 1: Registration Type
- Grid: `md:grid-cols-3 gap-6`
- Container: `space-y-6`
- Cards: `flex flex-col h-full`
- Mixed flexbox and grid

### Step 2: Attendee Details
- Container: `space-y-6`
- Forms: `p-6 mb-8`
- Controls: `gap-4`
- Border sections: `pt-6 border-t`

### Step 3: Ticket Selection
- Accordion layout (custom)
- Table layouts (non-semantic)
- Grid: `md:grid-cols-3 gap-4`
- Inconsistent card structures

### Step 4: Order Review
- Container: `space-y-6`
- Cards: Nested structures
- Footer: `p-6`
- Complex spacing patterns

### Step 5: Payment
- Grid: `lg:grid-cols-3 gap-8`
- Container: `space-y-8`
- Form sections: `space-y-6`
- Different from other steps

### Step 6: Confirmation
- Tabs layout
- ScrollArea: Fixed height `h-[400px]`
- Grids: Multiple column variations
- Container: `space-y-8`

## Major Issues

### 1. No Spacing System
- Arbitrary values (1, 2, 3, 4, 6, 8)
- No mathematical relationship
- No consistent scale
- Random combinations

### 2. Layout Method Mixing
- Flexbox and Grid used inconsistently
- Tables for non-tabular layout
- Custom positioning
- No unified approach

### 3. Responsive Inconsistencies
- Some use `md:` breakpoints
- Others use `lg:` breakpoints
- Many have no responsive considerations
- Breakpoint chaos

### 4. Container Patterns
- Different padding approaches
- Inconsistent margins
- Variable spacing utilities
- No standard container

### 5. Component Spacing
- Cards: Various internal spacing
- Buttons: Different gap patterns
- Forms: Inconsistent field spacing
- Lists: Variable item spacing

## Grid System Problems

### Current Grids
- Step 1: `md:grid-cols-3`
- Step 4: No specific grid
- Step 5: `lg:grid-cols-3`
- Step 6: `md:grid-cols-2`, `md:grid-cols-3`

### Issues
- Different breakpoints
- Different column counts
- No consistent gutter
- No base grid system

## Fixed Dimensions
- ScrollArea: `h-[400px]`
- Icons: `h-12 w-12`, `h-4 w-4`, etc.
- Buttons: `h-8 w-8`
- No flexible sizing system

## Recommendations

### 1. Establish Spacing Scale
```css
--space-1: 0.25rem (4px)
--space-2: 0.5rem (8px)
--space-3: 0.75rem (12px)
--space-4: 1rem (16px)
--space-5: 1.5rem (24px)
--space-6: 2rem (32px)
--space-7: 3rem (48px)
--space-8: 4rem (64px)
```

### 2. Define Grid System
```css
/* 12-column grid */
--grid-columns: 12;
--grid-gutter: var(--space-4);

/* Breakpoints */
--bp-sm: 640px;
--bp-md: 768px;
--bp-lg: 1024px;
--bp-xl: 1280px;
```

### 3. Create Container System
```css
.container {
  padding: var(--space-4);
  max-width: 100%;
}

@media (min-width: var(--bp-lg)) {
  .container {
    padding: var(--space-6);
  }
}
```

### 4. Standardize Component Spacing
```css
/* Cards */
.card {
  padding: var(--space-5);
  gap: var(--space-4);
}

/* Forms */
.form-group {
  gap: var(--space-3);
}

/* Lists */
.list {
  gap: var(--space-2);
}
```

### 5. Layout Utilities
```css
.stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.cluster {
  display: flex;
  gap: var(--space-3);
}

.grid {
  display: grid;
  gap: var(--space-4);
}
```

### 6. Responsive Patterns
```css
/* Mobile First */
.cols {
  grid-template-columns: 1fr;
}

@media (min-width: var(--bp-md)) {
  .cols-md-2 { grid-template-columns: repeat(2, 1fr); }
  .cols-md-3 { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: var(--bp-lg)) {
  .cols-lg-3 { grid-template-columns: repeat(3, 1fr); }
  .cols-lg-4 { grid-template-columns: repeat(4, 1fr); }
}
```

## Impact
The current spacing and layout inconsistencies create:
- Visual imbalance
- Poor alignment
- Difficult maintenance
- Responsive issues
- Unpredictable layouts
- Code duplication