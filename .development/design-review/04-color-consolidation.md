# Step 04: Consolidate Color Usage

## System Prompt
You are consolidating and standardizing color usage across the LodgeTix platform. Replace inline color values with the masonic palette and create semantic color mappings for consistent theming.

## Implementation Checklist

### 1. Audit Current Color Usage

Run this script to find inline color values:

Location: `/scripts/find-colors.js`

```javascript
const fs = require('fs')
const path = require('path')

const directoriesToSearch = [
  './components',
  './app',
]

const colorPatterns = [
  // Hex colors
  /#[0-9A-Fa-f]{3,6}/g,
  // RGB/RGBA
  /rgba?\([^)]+\)/g,
  // Tailwind color classes
  /\b(text|bg|border)-(gray|blue|red|green|yellow|purple|pink|indigo)-\d{2,3}\b/g,
]

function searchDirectory(dir) {
  const files = fs.readdirSync(dir)
  
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      searchDirectory(filePath)
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.css')) {
      const content = fs.readFileSync(filePath, 'utf8')
      
      colorPatterns.forEach(pattern => {
        const matches = content.match(pattern)
        if (matches) {
          console.log(`\n${filePath}:`)
          const uniqueMatches = [...new Set(matches)]
          uniqueMatches.forEach(match => console.log(`  ${match}`))
        }
      })
    }
  })
}

directoriesToSearch.forEach(searchDirectory)
```

### 2. Create Color Mapping Guide

Map current colors to masonic palette:

| Current Color | Masonic Replacement | Usage |
|--------------|-------------------|-------|
| `#000080`, `navy` | `masonic.navy` | Primary brand color |
| `#FFD700`, `gold` | `masonic.gold` | Accent, highlights |
| `#F0F8FF`, light blues | `masonic.lightblue` | Backgrounds |
| `gray-700`, `#374151` | `primary` | Primary text |
| `gray-500`, `#6B7280` | `gray-600` | Secondary text |
| `red-500`, `#EF4444` | `red-600` | Errors |
| `green-500`, `#10B981` | `green-600` | Success |

### 3. Update Component Colors

#### Example: Button Component

Before:
```typescript
const variants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
}
```

After:
```typescript
const variants = {
  primary: 'bg-primary hover:bg-primary-dark text-white',
  secondary: 'bg-secondary hover:bg-secondary-dark text-primary',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
}
```

#### Example: Card Component

Before:
```typescript
<div className="bg-white border border-gray-200 rounded-lg shadow-sm">
  <h3 className="text-gray-900 font-semibold">{title}</h3>
  <p className="text-gray-600">{description}</p>
</div>
```

After:
```typescript
<div className="bg-white border border-border rounded-card shadow-sm">
  <h3 className="text-primary font-semibold">{title}</h3>
  <p className="text-gray-600">{description}</p>
</div>
```

### 4. Create Semantic Color Classes

Location: `/style/styles/globals.css`

```css
/* Semantic color utilities */
.text-primary { color: theme('colors.primary.DEFAULT'); }
.text-primary-light { color: theme('colors.primary.light'); }
.text-primary-dark { color: theme('colors.primary.dark'); }

.bg-primary { background-color: theme('colors.primary.DEFAULT'); }
.bg-primary-light { background-color: theme('colors.primary.light'); }
.bg-primary-dark { background-color: theme('colors.primary.dark'); }

.border-primary { border-color: theme('colors.primary.DEFAULT'); }
.border-primary-light { border-color: theme('colors.primary.light'); }
.border-primary-dark { border-color: theme('colors.primary.dark'); }

/* Secondary colors */
.text-secondary { color: theme('colors.secondary.DEFAULT'); }
.bg-secondary { background-color: theme('colors.secondary.DEFAULT'); }
.border-secondary { border-color: theme('colors.secondary.DEFAULT'); }

/* State colors */
.text-error { color: theme('colors.red.600'); }
.bg-error { background-color: theme('colors.red.600'); }
.border-error { border-color: theme('colors.red.600'); }

.text-success { color: theme('colors.green.600'); }
.bg-success { background-color: theme('colors.green.600'); }
.border-success { border-color: theme('colors.green.600'); }

/* Masonic gradient */
.bg-masonic-gradient {
  background: linear-gradient(135deg, theme('colors.primary.DEFAULT') 0%, theme('colors.primary.light') 100%);
}
```

### 5. Update Form Field States

#### Input States
```typescript
const inputVariants = {
  default: 'border-gray-300 focus:border-secondary focus:ring-secondary',
  error: 'border-error focus:border-error focus:ring-error',
  success: 'border-success focus:border-success focus:ring-success',
}
```

#### Form Labels
```typescript
const labelVariants = {
  default: 'text-gray-700',
  required: 'text-gray-700 after:content-["*"] after:text-error after:ml-1',
  disabled: 'text-gray-400',
}
```

### 6. Create Color Preview Component

Location: `/components/ColorPalette.tsx`

```typescript
export function ColorPalette() {
  const colors = [
    { name: 'Primary Navy', class: 'bg-primary', value: '#0A2240' },
    { name: 'Primary Blue', class: 'bg-primary-light', value: '#0F3B6F' },
    { name: 'Secondary Gold', class: 'bg-secondary', value: '#C8A870' },
    { name: 'Light Gold', class: 'bg-secondary-light', value: '#E5D6B9' },
    { name: 'Light Blue', class: 'bg-background-secondary', value: '#E6EBF2' },
  ]
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-6">
      {colors.map((color) => (
        <div key={color.name} className="text-center">
          <div 
            className={`${color.class} w-full h-24 rounded-lg mb-2`}
            aria-label={color.name}
          />
          <p className="font-medium text-sm">{color.name}</p>
          <p className="text-xs text-gray-500">{color.value}</p>
        </div>
      ))}
    </div>
  )
}
```

### 7. Update Registration Flow Colors

#### Step Indicator
```typescript
// Before
const stepClasses = {
  active: 'bg-blue-600 text-white',
  completed: 'bg-green-500 text-white',
  upcoming: 'bg-gray-200 text-gray-600',
}

// After
const stepClasses = {
  active: 'bg-primary text-white',
  completed: 'bg-success text-white',
  upcoming: 'bg-gray-200 text-gray-600',
}
```

#### Form Sections
```typescript
// Before
<div className="border-t-4 border-blue-600 bg-gray-50 p-6">
  <h3 className="text-xl font-bold text-gray-900">{title}</h3>
</div>

// After
<div className="border-t-4 border-secondary bg-background-secondary p-6">
  <h3 className="text-xl font-bold text-primary">{title}</h3>
</div>
```

### 8. Testing Checklist

- [ ] All hex colors replaced with semantic names
- [ ] No hardcoded color values remain
- [ ] Brand colors used consistently
- [ ] State colors (error/success) standardized
- [ ] Focus states use secondary color
- [ ] Hover states properly defined
- [ ] Dark/light variations work correctly
- [ ] Color contrast meets WCAG standards

## Migration Priority

1. **High Priority**: Navigation, headers, CTAs
2. **Medium Priority**: Forms, cards, modals
3. **Low Priority**: Utility components, edge cases

## Color Usage Guidelines

### Primary (Navy)
- Main headings
- Primary buttons
- Navigation items
- Important text

### Secondary (Gold)  
- Accents and highlights
- Secondary buttons
- Active states
- Focus rings

### Backgrounds
- White: Main content
- Light Blue: Section backgrounds
- Light Gold: Special callouts

### Text
- Primary: Headings, important text
- Gray-700: Body text
- Gray-600: Secondary text
- Gray-500: Disabled text

## Notes

- Test color contrast for accessibility
- Consider creating a dark mode palette
- Document any exceptions to the color system
- Update design documentation with color guidelines
