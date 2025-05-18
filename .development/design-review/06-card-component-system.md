# Step 06: Update Card Components

## System Prompt
You are standardizing all card components across the LodgeTix platform to use consistent padding, spacing, borders, shadows, and structure while ensuring mobile responsiveness.

## Implementation Checklist

### 1. Create Base Card Component

Location: `/components/ui/base-card.tsx`

```typescript
import { cn } from '@/lib/utils'
import { HTMLAttributes, forwardRef } from 'react'

interface BaseCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated' | 'flat'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  interactive?: boolean
}

export const BaseCard = forwardRef<HTMLDivElement, BaseCardProps>(
  ({ 
    className, 
    variant = 'default', 
    padding = 'md',
    interactive = false,
    ...props 
  }, ref) => {
    const variantClasses = {
      default: 'bg-white border border-gray-200 shadow-sm',
      bordered: 'bg-white border-2 border-primary',
      elevated: 'bg-white shadow-lg',
      flat: 'bg-gray-50 border border-gray-200',
    }
    
    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-card',
          variantClasses[variant],
          paddingClasses[padding],
          interactive && [
            'transition-all duration-200',
            'hover:shadow-md hover:border-secondary',
            'cursor-pointer active:scale-[0.99]'
          ],
          className
        )}
        {...props}
      />
    )
  }
)

BaseCard.displayName = 'BaseCard'
```

### 2. Create Card Header Component

Location: `/components/ui/card-header.tsx`

```typescript
import { cn } from '@/lib/utils'
import { HTMLAttributes, forwardRef } from 'react'
import { Heading } from './typography'

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  action?: React.ReactNode
  divider?: boolean
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, action, divider = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col sm:flex-row sm:items-center sm:justify-between',
          divider && 'pb-4 mb-4 border-b border-gray-200',
          className
        )}
        {...props}
      >
        <div className="flex-1">
          <Heading as="h3" variant="h4">
            {title}
          </Heading>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <div className="mt-3 sm:mt-0 sm:ml-4">
            {action}
          </div>
        )}
      </div>
    )
  }
)

CardHeader.displayName = 'CardHeader'
```

### 3. Create Card Content Component

Location: `/components/ui/card-content.tsx`

```typescript
import { cn } from '@/lib/utils'
import { HTMLAttributes, forwardRef } from 'react'

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('space-y-4', className)}
        {...props}
      />
    )
  }
)

CardContent.displayName = 'CardContent'
```

### 4. Create Card Footer Component

Location: `/components/ui/card-footer.tsx`

```typescript
import { cn } from '@/lib/utils'
import { HTMLAttributes, forwardRef } from 'react'

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  divider?: boolean
  justify?: 'start' | 'end' | 'between' | 'center'
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, divider = false, justify = 'end', ...props }, ref) => {
    const justifyClasses = {
      start: 'justify-start',
      end: 'justify-end',
      between: 'justify-between',
      center: 'justify-center',
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-wrap gap-3',
          justifyClasses[justify],
          divider && 'pt-4 mt-4 border-t border-gray-200',
          className
        )}
        {...props}
      />
    )
  }
)

CardFooter.displayName = 'CardFooter'
```

### 5. Create Composite Card Component

Location: `/components/ui/card.tsx`

```typescript
import { BaseCard } from './base-card'
import { CardHeader } from './card-header'
import { CardContent } from './card-content'
import { CardFooter } from './card-footer'

// Re-export all parts
export const Card = Object.assign(BaseCard, {
  Header: CardHeader,
  Content: CardContent,
  Footer: CardFooter,
})

// Export individual components
export { BaseCard, CardHeader, CardContent, CardFooter }
```

### 6. Update Attendee Card

Location: `/components/register/registration/core/AttendeeCardView.tsx`

Before:
```typescript
<div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
  <div className="flex justify-between items-start">
    <div>
      <h3 className="font-semibold">{attendee.name}</h3>
      <p className="text-sm text-gray-600">{attendee.type}</p>
    </div>
    <button className="text-red-500 hover:text-red-700">
      Remove
    </button>
  </div>
</div>
```

After:
```typescript
import { Card } from '@/components/ui/card'
import { TouchTarget } from '@/components/register/core'
import { Trash2 } from 'lucide-react'

<Card variant="default" padding="md" className="mb-4">
  <Card.Header
    title={attendee.name}
    subtitle={`${attendee.type} • ${attendee.ticketType}`}
    action={
      <TouchTarget
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
        <span className="ml-2">Remove</span>
      </TouchTarget>
    }
  />
  <Card.Content>
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <span className="text-gray-500">Email:</span>
        <p className="font-medium">{attendee.email}</p>
      </div>
      <div>
        <span className="text-gray-500">Phone:</span>
        <p className="font-medium">{attendee.phone}</p>
      </div>
    </div>
    {attendee.partner && (
      <div className="mt-4 p-3 bg-gray-50 rounded">
        <p className="text-sm font-medium">Partner: {attendee.partner.name}</p>
      </div>
    )}
  </Card.Content>
</Card>
```

### 7. Update Order Summary Card

Location: `/components/register/payment/core/OrderSummaryView.tsx`

After:
```typescript
import { Card } from '@/components/ui/card'

<Card variant="elevated" className="sticky top-4">
  <Card.Header 
    title="Order Summary" 
    subtitle={`${attendeeCount} attendees`}
    divider
  />
  <Card.Content>
    {items.map((item) => (
      <div key={item.id} className="flex justify-between py-2">
        <span className="text-gray-700">{item.name}</span>
        <span className="font-medium">${item.price}</span>
      </div>
    ))}
  </Card.Content>
  <Card.Footer divider justify="between">
    <span className="text-lg font-semibold">Total</span>
    <span className="text-lg font-bold text-primary">
      ${total.toFixed(2)}
    </span>
  </Card.Footer>
</Card>
```

### 8. Create Feature Card Variations

Location: `/components/cards/feature-card.tsx`

```typescript
import { Card } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}

export function FeatureCard({ icon: Icon, title, description, action }: FeatureCardProps) {
  return (
    <Card variant="default" padding="lg" interactive>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="p-3 bg-secondary-light rounded-lg">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-primary mb-2">
            {title}
          </h3>
          <p className="text-gray-600 text-sm">
            {description}
          </p>
          {action && (
            <div className="mt-4">
              {action}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
```

### 9. Mobile-Responsive Card Grid

Location: `/components/cards/card-grid.tsx`

```typescript
import { cn } from '@/lib/utils'

interface CardGridProps {
  children: React.ReactNode
  columns?: {
    mobile?: 1 | 2
    tablet?: 2 | 3
    desktop?: 3 | 4
  }
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export function CardGrid({ 
  children, 
  columns = {
    mobile: 1,
    tablet: 2,
    desktop: 3
  },
  gap = 'md',
  className 
}: CardGridProps) {
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  }
  
  const columnClasses = cn(
    'grid',
    gapClasses[gap],
    columns.mobile === 1 ? 'grid-cols-1' : 'grid-cols-2',
    columns.tablet === 2 && 'md:grid-cols-2',
    columns.tablet === 3 && 'md:grid-cols-3',
    columns.desktop === 3 && 'lg:grid-cols-3',
    columns.desktop === 4 && 'lg:grid-cols-4',
  )
  
  return (
    <div className={cn(columnClasses, className)}>
      {children}
    </div>
  )
}
```

### 10. Testing Checklist

- [ ] All cards use consistent padding (16px mobile, 24px desktop)
- [ ] Shadows and borders are standardized
- [ ] Interactive cards have hover states
- [ ] Card headers align properly on mobile
- [ ] Footer actions stack on mobile
- [ ] Nested cards have proper spacing
- [ ] Card grids are responsive
- [ ] Touch targets in cards meet 48px minimum

## Card System Guidelines

### Variants
- **Default**: Standard card with border and subtle shadow
- **Bordered**: Emphasized with primary color border
- **Elevated**: Higher shadow for important content
- **Flat**: Minimal styling for grouped content

### Spacing
- **Small padding**: 16px (mobile), 16px (desktop)
- **Medium padding**: 16px (mobile), 24px (desktop)
- **Large padding**: 24px (mobile), 32px (desktop)

### Structure
1. **Header**: Title, subtitle, optional action
2. **Content**: Main card content with consistent spacing
3. **Footer**: Actions or summary, optional divider

### Mobile Considerations
- Stack header actions below title on mobile
- Reduce padding on smaller screens
- Ensure touch targets are accessible
- Use responsive grid for card layouts

## Migration Examples

### Simple Card
```typescript
// Before
<div className="bg-white rounded-lg shadow p-6">
  <h3 className="text-xl font-bold mb-2">{title}</h3>
  <p>{content}</p>
</div>

// After
<Card>
  <Card.Header title={title} />
  <Card.Content>
    <p>{content}</p>
  </Card.Content>
</Card>
```

### Complex Card
```typescript
// Before
<div className="border rounded-lg p-4">
  <div className="flex justify-between mb-4">
    <h3 className="font-bold">{title}</h3>
    <button>Edit</button>
  </div>
  <div className="space-y-2">
    {items.map(item => <div key={item.id}>{item.name}</div>)}
  </div>
  <div className="mt-4 pt-4 border-t flex justify-end">
    <button>Save</button>
  </div>
</div>

// After
<Card>
  <Card.Header 
    title={title}
    action={<Button variant="ghost" size="sm">Edit</Button>}
    divider
  />
  <Card.Content>
    {items.map(item => <div key={item.id}>{item.name}</div>)}
  </Card.Content>
  <Card.Footer divider>
    <Button>Save</Button>
  </Card.Footer>
</Card>
```

## Notes

- Start with the most visible cards first
- Maintain existing functionality while updating styles
- Test card shadows on different backgrounds
- Ensure cards are distinguishable from backgrounds
- Document any special card variations needed
