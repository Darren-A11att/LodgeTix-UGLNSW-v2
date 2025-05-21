# Step 03: Implement Typography System

## System Prompt
You are implementing a consistent typography system for the LodgeTix platform. This system will replace inline text styles with semantic components and CSS variables for maintainable, scalable typography.

## Implementation Checklist

### 1. Create Typography CSS Variables

Location: `/style/styles/globals.css`

```css
:root {
  /* Font families */
  --font-primary: font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'SF Mono', Monaco, Consolas, monospace;
  
  /* Font sizes - Mobile first */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  --text-5xl: 3rem;      /* 48px */
  
  /* Line heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
  --leading-loose: 2;
  
  /* Font weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* Letter spacing */
  --tracking-tight: -0.025em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
}

/* Desktop adjustments */
@media (min-width: 768px) {
  :root {
    --text-base: 1rem;     /* Keep 16px */
    --text-lg: 1.25rem;    /* 20px */
    --text-xl: 1.5rem;     /* 24px */
    --text-2xl: 1.875rem;  /* 30px */
    --text-3xl: 2.25rem;   /* 36px */
    --text-4xl: 3rem;      /* 48px */
    --text-5xl: 3.75rem;   /* 60px */
  }
}
```

### 2. Create Typography Components

Location: `/components/ui/typography.tsx`

```typescript
import { cn } from '@/lib/utils'
import { HTMLAttributes, forwardRef } from 'react'

// Heading component
interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ as: Component = 'h2', variant, className, ...props }, ref) => {
    const variantClasses = {
      h1: 'text-4xl md:text-5xl font-bold leading-tight tracking-tight text-primary',
      h2: 'text-3xl md:text-4xl font-bold leading-tight text-primary',
      h3: 'text-2xl md:text-3xl font-semibold leading-normal text-primary',
      h4: 'text-xl md:text-2xl font-semibold leading-normal text-primary',
      h5: 'text-lg md:text-xl font-medium leading-normal text-primary',
      h6: 'text-base md:text-lg font-medium leading-normal text-primary',
    }
    
    const selectedVariant = variant || Component
    
    return (
      <Component
        ref={ref as any}
        className={cn(variantClasses[selectedVariant], className)}
        {...props}
      />
    )
  }
)

Heading.displayName = 'Heading'

// Text component
interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  as?: 'p' | 'span' | 'div'
  variant?: 'body' | 'lead' | 'small' | 'caption'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
}

export const Text = forwardRef<HTMLParagraphElement, TextProps>(
  ({ 
    as: Component = 'p', 
    variant = 'body', 
    weight = 'normal',
    className, 
    ...props 
  }, ref) => {
    const variantClasses = {
      body: 'text-base leading-normal',
      lead: 'text-lg md:text-xl leading-relaxed',
      small: 'text-sm leading-normal',
      caption: 'text-xs leading-normal',
    }
    
    const weightClasses = {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    }
    
    return (
      <Component
        ref={ref as any}
        className={cn(
          variantClasses[variant],
          weightClasses[weight],
          'text-gray-700',
          className
        )}
        {...props}
      />
    )
  }
)

Text.displayName = 'Text'

// Label component
interface LabelProps extends HTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'text-sm font-medium text-gray-700',
          'mb-1 block',
          className
        )}
        {...props}
      >
        {children}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
    )
  }
)

Label.displayName = 'Label'

// Error text component
export const ErrorText = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn('text-sm text-red-600 mt-1 block', className)}
        role="alert"
        {...props}
      />
    )
  }
)

ErrorText.displayName = 'ErrorText'

// Link component
interface LinkProps extends HTMLAttributes<HTMLAnchorElement> {
  href: string
  external?: boolean
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, external, ...props }, ref) => {
    return (
      <a
        ref={ref}
        className={cn(
          'text-secondary hover:text-secondary-dark',
          'underline underline-offset-2',
          'transition-colors',
          className
        )}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        {...props}
      />
    )
  }
)

Link.displayName = 'Link'
```

### 3. Update Existing Components

#### Example: Update Registration Step Headers

Before:
```typescript
<h2 className="text-2xl font-semibold mb-4">
  {title}
</h2>
```

After:
```typescript
import { Heading } from '@/components/ui/typography'

<Heading as="h2" variant="h3">
  {title}
</Heading>
```

#### Example: Update Form Labels

Before:
```typescript
<label className="block text-sm font-medium text-gray-700">
  {label}
  {required && <span className="text-red-500">*</span>}
</label>
```

After:
```typescript
import { Label } from '@/components/ui/typography'

<Label required={required}>
  {label}
</Label>
```

### 4. Create Typography Utility Classes

Location: `/style/styles/globals.css`

```css
/* Typography utilities */
.text-balance {
  text-wrap: balance;
}

.text-no-wrap {
  white-space: nowrap;
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Masonic-specific text styles */
.text-masonic-heading {
  font-family: var(--font-primary);
  font-weight: var(--font-bold);
  color: var(--color-primary);
  letter-spacing: var(--tracking-tight);
}

.text-masonic-subheading {
  font-family: var(--font-primary);
  font-weight: var(--font-semibold);
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}
```

### 5. Migration Script

Create a script to help identify typography that needs updating:

Location: `/scripts/find-typography.js`

```javascript
const fs = require('fs')
const path = require('path')

const directoriesToSearch = [
  './components',
  './app',
]

const patternsToFind = [
  /className="[^"]*text-\d+xl[^"]*"/g,
  /className="[^"]*font-(bold|semibold|medium)[^"]*"/g,
  /<h[1-6][^>]*>/g,
  /<p[^>]*>/g,
  /<label[^>]*>/g,
]

function searchDirectory(dir) {
  const files = fs.readdirSync(dir)
  
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      searchDirectory(filePath)
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(filePath, 'utf8')
      
      patternsToFind.forEach(pattern => {
        const matches = content.match(pattern)
        if (matches) {
          console.log(`\n${filePath}:`)
          matches.forEach(match => console.log(`  ${match}`))
        }
      })
    }
  })
}

directoriesToSearch.forEach(searchDirectory)
```

### 6. Update Common Typography Patterns

#### Page Headers
```typescript
// Before
<div className="mb-8">
  <h1 className="text-3xl font-bold text-gray-900">
    {pageTitle}
  </h1>
  <p className="text-lg text-gray-600 mt-2">
    {description}
  </p>
</div>

// After
import { Heading, Text } from '@/components/ui/typography'

<div className="mb-8">
  <Heading as="h1" variant="h1">
    {pageTitle}
  </Heading>
  <Text variant="lead" className="mt-2 text-gray-600">
    {description}
  </Text>
</div>
```

#### Form Fields
```typescript
// Before
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    {label}
  </label>
  <input {...inputProps} />
  {error && (
    <p className="text-sm text-red-600 mt-1">{error}</p>
  )}
</div>

// After
import { Label, ErrorText } from '@/components/ui/typography'

<div>
  <Label htmlFor={inputId}>{label}</Label>
  <input id={inputId} {...inputProps} />
  {error && <ErrorText>{error}</ErrorText>}
</div>
```

### 7. Testing Checklist

- [ ] All headings use the Heading component
- [ ] All body text uses the Text component
- [ ] All form labels use the Label component
- [ ] All error messages use the ErrorText component
- [ ] Typography scales properly on mobile and desktop
- [ ] Line heights are comfortable for reading
- [ ] Font weights create proper hierarchy
- [ ] No inline text styling remains

## Benefits

1. **Consistency**: All text follows the same styling rules
2. **Maintainability**: Changes to typography happen in one place
3. **Accessibility**: Semantic HTML and proper hierarchy
4. **Responsive**: Typography scales appropriately
5. **Performance**: Reduced CSS duplication

## Notes

- Start with high-traffic pages and work through the app
- Use the migration script to find instances to update
- Test on multiple devices to ensure readability
- Consider creating a typography preview page for reference
