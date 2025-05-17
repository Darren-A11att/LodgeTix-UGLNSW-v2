# Mobile Responsive Design Patterns

## Overview
This document outlines specific mobile-first responsive patterns to address the current poor mobile experience in the registration wizard.

## Core Problems
1. Inconsistent column implementations
2. Fields don't adapt well to mobile screens
3. Modals don't use viewport height properly
4. No consideration for touch interactions
5. Poor use of available screen space

## Mobile-First Grid System

### Base Grid Configuration
```typescript
// lib/design-system/grid.ts
export const gridConfig = {
  mobile: {
    columns: 2,
    gap: '1rem',
    padding: '1rem'
  },
  tablet: {
    columns: 4,
    gap: '1.5rem',
    padding: '1.5rem'
  },
  desktop: {
    columns: 4,
    gap: '2rem',
    padding: '2rem'
  }
}

// Breakpoints aligned with Tailwind
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px'
}
```

### Field Size Definitions
```typescript
// lib/design-system/forms.ts
export const fieldSizes = {
  small: {
    mobile: 'col-span-1', // 50% width
    desktop: 'md:col-span-1' // 25% width
  },
  medium: {
    mobile: 'col-span-2', // 100% width
    desktop: 'md:col-span-2' // 50% width
  },
  large: {
    mobile: 'col-span-2', // 100% width
    desktop: 'md:col-span-4' // 100% width
  }
}
```

## Component Implementation

### 1. Responsive Form Container
```typescript
// components/ui/responsive-form.tsx
import { cn } from "@/lib/utils"

export function ResponsiveForm({ children, className }: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <form className={cn(
      "w-full",
      "px-4 sm:px-6 lg:px-8", // Responsive padding
      "space-y-6", // Vertical spacing
      className
    )}>
      {children}
    </form>
  )
}
```

### 2. Field Layout Component
```typescript
// components/ui/field-layout.tsx
import { cn } from "@/lib/utils"

type FieldSize = 'small' | 'medium' | 'large'

interface FieldLayoutProps {
  size?: FieldSize
  children: React.ReactNode
  className?: string
}

export function FieldLayout({ 
  size = 'medium', 
  children, 
  className 
}: FieldLayoutProps) {
  const sizeClasses = {
    small: fieldSizes.small.mobile + ' ' + fieldSizes.small.desktop,
    medium: fieldSizes.medium.mobile + ' ' + fieldSizes.medium.desktop,
    large: fieldSizes.large.mobile + ' ' + fieldSizes.large.desktop
  }
  
  return (
    <div className={cn(sizeClasses[size], className)}>
      {children}
    </div>
  )
}
```

### 3. Mobile-Optimized Modal
```typescript
// components/ui/mobile-modal.tsx
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

export function MobileModal({ 
  open, 
  onOpenChange, 
  children, 
  title 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  title: string
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        
        <Dialog.Content className={cn(
          "fixed inset-0 z-50",
          "bg-white",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "sm:inset-auto sm:left-[50%] sm:top-[50%]",
          "sm:h-auto sm:max-h-[85vh] sm:w-[90vw] sm:max-w-lg",
          "sm:translate-x-[-50%] sm:translate-y-[-50%]",
          "sm:rounded-lg sm:border"
        )}>
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4">
              <Dialog.Title className="text-lg font-semibold">
                {title}
              </Dialog.Title>
              <Dialog.Close className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Dialog.Close>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {children}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

## Specific Form Implementations

### MasonForm Mobile Layout
```typescript
// components/register/forms/mason/MasonBasicInfo.tsx
import { FormGrid, FieldLayout } from "@/components/ui"

export function MasonBasicInfo({ mason, onChange, titles, ranks }) {
  return (
    <FormGrid>
      {/* Row 1: Title and Rank (small fields) */}
      <FieldLayout size="small">
        <Label htmlFor="title">Title</Label>
        <Select
          id="title"
          value={mason.title}
          onChange={(e) => onChange('title', e.target.value)}
          className="w-full"
        >
          {titles.map(title => (
            <option key={title} value={title}>{title}</option>
          ))}
        </Select>
      </FieldLayout>
      
      <FieldLayout size="small">
        <Label htmlFor="rank">Rank</Label>
        <Select
          id="rank"
          value={mason.rank}
          onChange={(e) => onChange('rank', e.target.value)}
          className="w-full"
        >
          {ranks.map(rank => (
            <option key={rank.value} value={rank.value}>{rank.label}</option>
          ))}
        </Select>
      </FieldLayout>
      
      {/* Row 2: First Name (medium field) */}
      <FieldLayout size="medium">
        <Label htmlFor="firstName">First Name</Label>
        <Input
          id="firstName"
          value={mason.firstName}
          onChange={(e) => onChange('firstName', e.target.value)}
          className="w-full"
        />
      </FieldLayout>
      
      {/* Row 3: Last Name (medium field) */}
      <FieldLayout size="medium">
        <Label htmlFor="lastName">Last Name</Label>
        <Input
          id="lastName"
          value={mason.lastName}
          onChange={(e) => onChange('lastName', e.target.value)}
          className="w-full"
        />
      </FieldLayout>
    </FormGrid>
  )
}
```

### AttendeeEditModal Mobile Version
```typescript
// components/register/attendee/AttendeeEditModal.tsx
import { MobileModal } from "@/components/ui/mobile-modal"

export function AttendeeEditModal({ 
  isOpen, 
  onClose, 
  attendeeData,
  attendeeNumber 
}) {
  return (
    <MobileModal
      open={isOpen}
      onOpenChange={onClose}
      title={`Edit Attendee ${attendeeNumber}`}
    >
      <div className="space-y-6">
        {/* Use same responsive form patterns */}
        <MasonBasicInfo 
          mason={attendeeData}
          onChange={handleFieldChange}
          titles={titles}
          ranks={ranks}
        />
        
        {/* Continue with other sections */}
      </div>
      
      {/* Mobile-optimized footer */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4 sm:relative sm:border-0 sm:bg-transparent sm:p-0 sm:pt-6">
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="flex-1"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </MobileModal>
  )
}
```

## Touch Optimization

### 1. Increased Touch Targets
```css
/* Minimum touch target size (44x44px) */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Form controls */
input,
select,
textarea,
button {
  min-height: 44px;
}
```

### 2. Spacing for Fingers
```css
/* Adequate spacing between interactive elements */
.form-field + .form-field {
  margin-top: 1rem; /* 16px minimum */
}

/* Button groups */
.button-group {
  display: flex;
  gap: 0.75rem; /* 12px minimum */
}
```

## Viewport Considerations

### 1. Safe Areas
```css
/* Account for device safe areas */
.mobile-container {
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
  padding-bottom: env(safe-area-inset-bottom);
}
```

### 2. Keyboard Handling
```typescript
// Hook for keyboard visibility
function useKeyboardVisible() {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false)
  
  useEffect(() => {
    const handleResize = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.clientHeight
      setKeyboardVisible(windowHeight < documentHeight * 0.75)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  return isKeyboardVisible
}
```

## Performance Optimizations

### 1. Lazy Loading Forms
```typescript
// Use dynamic imports for heavy forms
const MasonForm = dynamic(() => import('./MasonForm'), {
  loading: () => <FormSkeleton />
})
```

### 2. Debounced Inputs
```typescript
// Prevent excessive rerenders on mobile
const debouncedOnChange = useMemo(
  () => debounce(onChange, 300),
  [onChange]
)
```

## Testing Checklist

### Devices to Test
- [ ] iPhone SE (375px)
- [ ] iPhone 12/13 (390px)
- [ ] iPhone 14 Pro Max (430px)
- [ ] Samsung Galaxy S21 (360px)
- [ ] iPad Mini (768px)
- [ ] iPad Pro (1024px)

### Orientations
- [ ] Portrait mode
- [ ] Landscape mode
- [ ] Keyboard visible/hidden

### Interactions
- [ ] Touch targets are 44x44px minimum
- [ ] Forms are scrollable with keyboard open
- [ ] Modals use full viewport on mobile
- [ ] No horizontal overflow

### Performance
- [ ] Smooth scrolling
- [ ] Fast input response
- [ ] No layout shifts
- [ ] Proper keyboard handling

## Summary
This mobile-first approach ensures:
1. Consistent 2-column layout on mobile
2. Proper field grouping and sizing
3. Full viewport utilization for modals
4. Touch-friendly interactions
5. Performance optimizations

The system is flexible enough for complex desktop layouts while maintaining excellent mobile usability.