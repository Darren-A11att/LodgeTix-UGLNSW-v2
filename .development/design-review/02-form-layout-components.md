# Step 02: Create Core Layout Components

## System Prompt
You are creating the foundational layout components for the LodgeTix design system. These components will provide consistent, mobile-first responsive grids and field layouts throughout the application.

## Implementation Checklist

### 1. Create FormGrid Component

Location: `/components/register/core/FormGrid.tsx`

```typescript
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface FormGridProps {
  children: ReactNode
  className?: string
  columns?: {
    mobile?: 2 | 1
    tablet?: 2 | 3 | 4
    desktop?: 2 | 3 | 4 | 6
  }
}

export function FormGrid({ 
  children, 
  className,
  columns = {
    mobile: 2,
    tablet: 2,
    desktop: 4
  }
}: FormGridProps) {
  const gridClasses = cn(
    'grid gap-4',
    // Mobile columns
    columns.mobile === 1 ? 'grid-cols-1' : 'grid-cols-2',
    // Tablet columns
    columns.tablet === 2 && 'md:grid-cols-2',
    columns.tablet === 3 && 'md:grid-cols-3',
    columns.tablet === 4 && 'md:grid-cols-4',
    // Desktop columns
    columns.desktop === 2 && 'lg:grid-cols-2',
    columns.desktop === 3 && 'lg:grid-cols-3',
    columns.desktop === 4 && 'lg:grid-cols-4',
    columns.desktop === 6 && 'lg:grid-cols-6',
    className
  )
  
  return (
    <div className={gridClasses}>
      {children}
    </div>
  )
}
```

### 2. Create FieldLayout Component

Location: `/components/register/core/FieldLayout.tsx`

```typescript
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

type FieldSize = 'small' | 'medium' | 'large' | 'full'

interface FieldLayoutProps {
  children: ReactNode
  size?: FieldSize
  className?: string
}

export function FieldLayout({ 
  children, 
  size = 'medium',
  className 
}: FieldLayoutProps) {
  const sizeClasses = {
    // Small: 1 column on mobile, stays small on desktop
    small: 'col-span-1',
    // Medium: Full width mobile, 2 columns tablet/desktop
    medium: 'col-span-2 md:col-span-2',
    // Large: Full width mobile, 3-4 columns desktop
    large: 'col-span-2 md:col-span-4 lg:col-span-3',
    // Full: Always full width
    full: 'col-span-2 md:col-span-4 lg:col-span-4'
  }
  
  return (
    <div className={cn(sizeClasses[size], className)}>
      {children}
    </div>
  )
}
```

### 3. Create FormSection Component

Location: `/components/register/core/FormSection.tsx`

```typescript
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface FormSectionProps {
  title?: string
  description?: string
  children: ReactNode
  className?: string
}

export function FormSection({ 
  title, 
  description, 
  children, 
  className 
}: FormSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h3 className="text-lg font-semibold text-primary">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-gray-600 mt-1">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
```

### 4. Create ResponsiveContainer Component

Location: `/components/register/core/ResponsiveContainer.tsx`

```typescript
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

export function ResponsiveContainer({ 
  children, 
  className,
  maxWidth = 'lg'
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  }
  
  return (
    <div className={cn(
      'w-full mx-auto px-4 sm:px-6 lg:px-8',
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  )
}
```

### 5. Create TouchTarget Component

Location: `/components/register/core/TouchTarget.tsx`

```typescript
import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface TouchTargetProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export const TouchTarget = forwardRef<HTMLButtonElement, TouchTargetProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const sizeClasses = {
      sm: 'min-h-[44px] px-3',  // Still touch-friendly
      md: 'min-h-[48px] px-4',  // Default touch target
      lg: 'min-h-[56px] px-6'   // Large touch target
    }
    
    const variantClasses = {
      primary: 'bg-primary text-white hover:bg-primary-dark',
      secondary: 'bg-secondary text-primary hover:bg-secondary-dark',
      ghost: 'bg-transparent hover:bg-gray-100'
    }
    
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-button',
          'font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-secondary',
          'disabled:pointer-events-none disabled:opacity-50',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      />
    )
  }
)

TouchTarget.displayName = 'TouchTarget'
```

### 6. Create Mobile Modal Component

Location: `/components/register/core/MobileModal.tsx`

```typescript
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { ReactNode } from 'react'
import { TouchTarget } from './TouchTarget'

interface MobileModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
}

export function MobileModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className 
}: MobileModalProps) {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={cn(
        'absolute bottom-0 left-0 right-0',
        'bg-white rounded-t-modal',
        'max-h-[90dvh] overflow-hidden',
        'animate-slide-up',
        className
      )}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{title}</h2>
            <TouchTarget
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </TouchTarget>
          </div>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto px-4 py-6" style={{ maxHeight: 'calc(90dvh - 60px)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
```

### 7. Update Exports

Location: `/components/register/core/index.ts`

```typescript
export { FormGrid } from './FormGrid'
export { FieldLayout } from './FieldLayout'
export { FormSection } from './FormSection'
export { ResponsiveContainer } from './ResponsiveContainer'
export { TouchTarget } from './TouchTarget'
export { MobileModal } from './MobileModal'

// Re-export existing components
export { FormActions } from './FormActions'
export { FormLayout } from './FormLayout'
export { AddRemoveControl } from './AddRemoveControl'
```

### 8. Add Required Animations

Location: `/app/globals.css`

```css
@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
```

### 9. Testing Checklist

- [ ] Test FormGrid with different column configurations
- [ ] Verify FieldLayout sizes work correctly
- [ ] Check responsive breakpoints on all components
- [ ] Test touch targets on mobile devices
- [ ] Verify MobileModal uses dvh units correctly
- [ ] Ensure all components are properly exported

## Usage Examples

### Basic Form Layout
```typescript
import { FormGrid, FieldLayout } from '@/components/register/core'

function ExampleForm() {
  return (
    <FormGrid>
      <FieldLayout size="small">
        <input placeholder="Title" />
      </FieldLayout>
      <FieldLayout size="small">
        <input placeholder="Rank" />
      </FieldLayout>
      <FieldLayout size="medium">
        <input placeholder="First Name" />
      </FieldLayout>
      <FieldLayout size="medium">
        <input placeholder="Last Name" />
      </FieldLayout>
      <FieldLayout size="full">
        <input placeholder="Email Address" />
      </FieldLayout>
    </FormGrid>
  )
}
```

### Responsive Modal
```typescript
import { MobileModal } from '@/components/register/core'

function ExampleModal() {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <MobileModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Edit Details"
    >
      <FormGrid>
        {/* Form content */}
      </FormGrid>
    </MobileModal>
  )
}
```

## Notes
- These components form the foundation for all form layouts
- Mobile-first approach ensures good mobile experience
- Touch targets meet accessibility standards
- dvh units in MobileModal handle mobile viewport correctly
- All components use consistent spacing and styling
