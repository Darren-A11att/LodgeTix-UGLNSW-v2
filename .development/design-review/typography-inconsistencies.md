# Typography Inconsistencies Analysis

## Overview
The LodgeTix registration wizard lacks a cohesive typographic system, with inconsistent heading hierarchies, font weights, and text sizes across all steps.

## Typography Elements Identified

### 1. Heading Hierarchies
- `<h1>`: Main step headings
- `<h2>`: Section headings
- `<h3>`: Sub-headings
- `<h4>`: Minor headings
- `CardTitle`: Component-based headings
- Mixed HTML and component approaches

### 2. Font Sizes
- `text-2xl`: Primary headings
- `text-xl`: Secondary headings
- `text-lg`: Card titles
- `text-sm`: Description text
- `text-xs`: Micro text
- Default sizes: No explicit size

### 3. Font Weights
- `font-bold`: Major headings, prices, emphasis
- `font-medium`: Sub-headings, labels
- `font-semibold`: Section titles
- Default weight: Regular text

## Step-by-Step Typography Usage

### Step 1: Registration Type
- Main heading: `<h1> text-2xl font-bold`
- Card titles: `CardTitle` (no explicit size)
- Description: Default size, no weight
- List items: No defined typography

### Step 2: Attendee Details
- Main heading: `<h1> text-2xl font-bold`
- Form headings: `<h3> text-xl font-bold`
- Error heading: `text-lg font-bold`
- Debug text: `text-xs`

### Step 3: Ticket Selection
- Main heading: `<h1> text-2xl font-bold`
- Section headings: `<h3> font-semibold` (no size)
- Card titles: `CardTitle text-lg`
- Description: `text-sm`
- Table text: Mix of `text-xs` and defaults

### Step 4: Order Review
- Main heading: `<h1> text-2xl font-bold`
- Card titles: `CardTitle text-lg`
- Section headings: `<h4> font-medium`
- Price displays: `text-xl font-bold`
- Descriptions: `text-sm`

### Step 5: Payment
- Main heading: `<h1> text-2xl font-bold`
- Alert titles: Component defaults
- Form labels: Component defaults
- Limited custom typography

### Step 6: Confirmation
- Main heading: `<h1> text-2xl font-bold`
- Section heading: `<h2> text-xl font-bold`
- Card titles: Component defaults
- Sub-headings: `<h3> font-medium`
- Confirmation number: `text-2xl font-bold`

## Major Issues

### 1. Inconsistent Heading Hierarchy
- No clear h1 → h2 → h3 progression
- Mixed HTML tags and component titles
- Same visual treatment for different levels
- No semantic hierarchy

### 2. Font Size Fragmentation
- Primary headings vary: `text-2xl`, `text-xl`, `text-lg`
- Description text varies: default, `text-sm`, `text-xs`
- No modular scale
- Arbitrary size choices

### 3. Font Weight Confusion
- Bold used for different purposes
- Medium vs semibold distinction unclear
- No consistent weight hierarchy
- Overuse of bold

### 4. Component vs HTML
- Some use CardTitle components
- Others use raw HTML headings
- Different rendering and defaults
- No unified approach

### 5. Missing Typography System
- No base font size definition
- No line height specifications
- No letter spacing guidelines
- No responsive typography

## Typography Scale Issues

### Current (Fragmented)
```
text-2xl → 24px (1.5rem)
text-xl → 20px (1.25rem)
text-lg → 18px (1.125rem)
text-base → 16px (1rem)
text-sm → 14px (0.875rem)
text-xs → 12px (0.75rem)
```

### Problems
- Inconsistent jumps between sizes
- No clear hierarchy purpose
- Missing intermediate sizes
- No relationship to content importance

## Recommendations

### 1. Establish Type Scale
```css
--h1: 2rem (32px)
--h2: 1.5rem (24px)
--h3: 1.25rem (20px)
--h4: 1.125rem (18px)
--body: 1rem (16px)
--small: 0.875rem (14px)
--micro: 0.75rem (12px)
```

### 2. Define Weight System
```css
--weight-bold: 700 (headings, emphasis)
--weight-medium: 500 (sub-headings)
--weight-regular: 400 (body text)
```

### 3. Create Heading Components
```jsx
<Heading level={1}>Main Title</Heading>
<Heading level={2}>Section Title</Heading>
<Heading level={3}>Sub-section</Heading>
```

### 4. Standardize Text Components
```jsx
<Text size="body">Regular content</Text>
<Text size="small">Secondary content</Text>
<Text size="micro">Helper text</Text>
```

### 5. Define Line Heights
```css
--line-tight: 1.2 (headings)
--line-normal: 1.5 (body)
--line-relaxed: 1.75 (descriptions)
```

### 6. Responsive Typography
```css
/* Mobile */
--h1-mobile: 1.5rem
--h2-mobile: 1.25rem

/* Desktop */
--h1-desktop: 2rem
--h2-desktop: 1.5rem
```

## Impact
The current typography inconsistencies create:
- Poor visual hierarchy
- Difficult content scanning
- Inconsistent reading experience
- Maintenance challenges
- Accessibility issues