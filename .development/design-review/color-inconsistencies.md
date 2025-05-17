# Color Inconsistencies Analysis

## Overview
The LodgeTix registration wizard exhibits significant color inconsistencies across all six steps, resulting in a fragmented visual experience.

## Color Palettes Identified

### 1. Masonic Theme Colors
- `masonic-navy`: Primary brand color
- `masonic-gold`: Secondary brand color  
- `masonic-lightgold`: Lighter variant
- `masonic-lightblue`: Light accent
- `masonic-blue`: Darker blue variant

### 2. Tailwind Default Colors
- `gray-600`, `gray-500`, `gray-200`: Various gray shades
- `slate-800`, `slate-200`, `slate-50`: Slate palette
- `red-600`, `red-500`: Error/destructive actions
- `yellow-500`, `yellow-700`: Warnings
- `amber-200`, `amber-800`: Alerts
- `green-600`, `green-100`: Success states
- `blue-100`, `blue-800`: Informational
- `white`: Various uses

### 3. Opacity Variations
- `/10`, `/20`, `/30`, `/90`: Different opacity levels applied inconsistently

## Step-by-Step Color Usage

### Step 1: Registration Type
- Text: `text-masonic-navy`, `text-gray-600`
- Backgrounds: `bg-masonic-lightblue`, `bg-masonic-navy`
- Borders: `border-masonic-gold`, `border-gray-200`
- Hover: `hover:border-masonic-lightgold`, `hover:bg-masonic-blue`
- Modal: `bg-red-600` for destructive action

### Step 2: Attendee Details
- Text: `text-masonic-navy`, `text-gray-600`, `text-slate-800`, `text-gray-500`
- Backgrounds: `bg-slate-50`, `bg-red-50`
- Borders: `border-slate-200`, `border-red-200`
- Error states: `text-red-800`, `text-red-500`

### Step 3: Ticket Selection
- Headers: `bg-masonic-lightblue`, `bg-masonic-navy`
- Selected states: `border-masonic-gold`, `bg-masonic-lightgold/10`
- Icons: `text-green-600` (checks), `text-red-600` (remove)
- Hover: `hover:bg-masonic-lightblue/90`, `hover:border-masonic-lightgold`

### Step 4: Order Review
- Headers: `bg-masonic-navy text-white`, `bg-masonic-lightgold/10`
- Alerts: `bg-yellow-50 border-yellow-500`, `bg-masonic-gold/10`
- Buttons: `bg-masonic-gold text-masonic-navy`
- Footer: `bg-gray-50`

### Step 5: Payment
- Text: `text-masonic-navy`, `text-gray-600`
- Buttons: `bg-masonic-gold text-masonic-navy`
- Alerts: Default destructive variant
- Limited custom coloring

### Step 6: Confirmation
- Success: `bg-green-100`, `text-green-600`
- Headers: `bg-masonic-navy text-white`
- Alerts: `bg-amber-50 border-amber-200`
- Badges: `bg-green-500/20`, `bg-masonic-gold`
- Various card borders and backgrounds

## Major Issues

### 1. Multiple Color Systems
- Masonic theme colors used inconsistently
- Tailwind defaults mixed with custom colors
- Different palettes for similar UI elements

### 2. Inconsistent State Colors
- Success: Green vs masonic-gold
- Error: Red with different shades
- Warning: Yellow vs amber
- Info: Blue vs masonic-navy

### 3. Opacity Usage
- Random opacity values (10, 20, 30, 90)
- Applied to different color combinations
- No systematic approach

### 4. Text Color Variations
- Primary text: `masonic-navy` vs `slate-800`
- Secondary text: `gray-600` vs `gray-500`
- Error text: Different red shades

### 5. Background Colors
- Form containers: `slate-50` vs `gray-50`
- Card headers: Various approaches
- Alert backgrounds: Different color families

## Recommendations

### 1. Establish Primary Palette
```css
--primary: masonic-navy
--secondary: masonic-gold
--accent: masonic-blue
--neutral: gray palette
```

### 2. Define State Colors
```css
--success: masonic-gold variants
--error: red-600 family
--warning: amber family
--info: masonic-blue family
```

### 3. Standardize Opacity Scale
```css
--opacity-light: 0.1
--opacity-medium: 0.3
--opacity-heavy: 0.5
--opacity-dark: 0.9
```

### 4. Create Color Usage Guidelines
- Primary text: Always use `text-masonic-navy`
- Secondary text: Always use `text-gray-600`
- Form backgrounds: Consistent `bg-gray-50`
- Card headers: Consistent approach

### 5. Remove Mixed Palettes
- Eliminate slate usage in favor of gray
- Choose between yellow/amber for warnings
- Standardize green usage for success

## Impact
The current color inconsistencies create:
- Visual fragmentation
- Poor brand cohesion
- Confusing user experience
- Difficult maintenance
- Unprofessional appearance