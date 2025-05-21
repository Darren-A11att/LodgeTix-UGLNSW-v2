# Step 12: Update Modals for Mobile

## System Prompt
You are optimizing all modal components for mobile devices by implementing dvh units, adding proper close buttons, ensuring content scrollability, and testing on various devices.

## Implementation Checklist

### 1. Create Base Mobile Modal

Location: `/components/ui/mobile-modal.tsx`

```typescript
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { ReactNode, useEffect } from 'react'
import { TouchTarget } from '@/components/register/core'
import { createPortal } from 'react-dom'

interface MobileModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  variant?: 'fullscreen' | 'sheet' | 'center'
  className?: string
}

export function MobileModal({ 
  isOpen, 
  onClose, 
  title, 
  description,
  children, 
  variant = 'sheet',
  className 
}: MobileModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])
  
  if (!isOpen) return null
  
  const modalClasses = {
    fullscreen: 'fixed inset-0',
    sheet: 'fixed bottom-0 left-0 right-0 rounded-t-2xl',
    center: 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-md rounded-xl'
  }
  
  const heightClasses = {
    fullscreen: 'h-full',
    sheet: 'max-h-[90dvh] min-h-[50dvh]',
    center: 'max-h-[80dvh]'
  }
  
  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 animate-fade-in" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div 
        className={cn(
          modalClasses[variant],
          heightClasses[variant],
          'bg-white z-10 overflow-hidden',
          'animate-slide-up',
          'shadow-xl',
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex-1">
              <h2 
                id="modal-title" 
                className="text-lg font-semibold text-primary"
              >
                {title}
              </h2>
              {description && (
                <p className="text-sm text-gray-600 mt-0.5">
                  {description}
                </p>
              )}
            </div>
            <TouchTarget
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="ml-4 rounded-full"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </TouchTarget>
          </div>
        </div>
        
        {/* Content */}
        <div 
          className="overflow-y-auto overscroll-contain"
          style={{ maxHeight: variant === 'sheet' ? 'calc(90dvh - 64px)' : 'calc(80dvh - 64px)' }}
        >
          <div className="p-4 pb-safe">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
```

### 2. Update Edit Attendee Modal

Location: `/components/register/attendee/AttendeeEditModal.tsx`

```typescript
import { MobileModal } from '@/components/ui/mobile-modal'
import { FormGrid } from '@/components/register/core'
import { TextField, SelectField } from '@/components/register/fields'

export function AttendeeEditModal({ 
  isOpen, 
  onClose, 
  attendee, 
  onSave 
}) {
  const { form, handleSubmit } = useAttendeeForm(attendee)
  const isMobile = useMediaQuery('(max-width: 640px)')
  
  const handleSave = (data) => {
    onSave(data)
    onClose()
  }
  
  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Attendee"
      description="Update attendee information"
      variant={isMobile ? 'sheet' : 'center'}
    >
      <form onSubmit={handleSubmit(handleSave)}>
        <FormGrid>
          <TextField
            label="First Name"
            size="medium"
            {...form.register('firstName')}
            error={form.errors.firstName?.message}
            touched={form.touchedFields.firstName}
          />
          
          <TextField
            label="Last Name"
            size="medium"
            {...form.register('lastName')}
            error={form.errors.lastName?.message}
            touched={form.touchedFields.lastName}
          />
          
          <TextField
            label="Email"
            type="email"
            size="full"
            {...form.register('email')}
            error={form.errors.email?.message}
            touched={form.touchedFields.email}
          />
          
          {/* Additional fields... */}
        </FormGrid>
        
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <TouchTarget
            type="submit"
            variant="primary"
            size="lg"
            className="flex-1"
          >
            Save Changes
          </TouchTarget>
          
          <TouchTarget
            type="button"
            variant="ghost"
            size="lg"
            onClick={onClose}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </TouchTarget>
        </div>
      </form>
    </MobileModal>
  )
}
```

### 3. Create Confirmation Modal

Location: `/components/ui/confirmation-modal.tsx`

```typescript
export function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  title, 
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger' 
}) {
  const isMobile = useMediaQuery('(max-width: 640px)')
  
  const variantClasses = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    info: 'bg-primary hover:bg-primary-dark'
  }
  
  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      variant={isMobile ? 'sheet' : 'center'}
    >
      <div className="space-y-4">
        <Text className="text-gray-700">
          {message}
        </Text>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <TouchTarget
            variant="ghost"
            size="lg"
            onClick={onClose}
            className="flex-1 order-2 sm:order-1"
          >
            {cancelText}
          </TouchTarget>
          
          <TouchTarget
            className={cn(
              'flex-1 order-1 sm:order-2',
              variantClasses[variant],
              'text-white'
            )}
            size="lg"
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmText}
          </TouchTarget>
        </div>
      </div>
    </MobileModal>
  )
}
```

### 4. Create Image Preview Modal

Location: `/components/ui/image-preview-modal.tsx`

```typescript
export function ImagePreviewModal({ 
  isOpen, 
  onClose, 
  imageSrc, 
  imageAlt 
}) {
  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      title="Image Preview"
      variant="fullscreen"
    >
      <div className="relative h-full flex items-center justify-center bg-black">
        <img
          src={imageSrc}
          alt={imageAlt}
          className="max-w-full max-h-full object-contain"
        />
        
        {/* Close button with better contrast */}
        <TouchTarget
          variant="ghost"
          size="lg"
          onClick={onClose}
          className="absolute top-4 right-4 bg-black/50 text-white rounded-full"
          aria-label="Close image preview"
        >
          <X className="h-6 w-6" />
        </TouchTarget>
      </div>
    </MobileModal>
  )
}
```

### 5. Update Alert Dialog for Mobile

Location: `/components/ui/mobile-alert.tsx`

```typescript
export function MobileAlert({ 
  isOpen, 
  onClose, 
  type = 'info',
  title, 
  message 
}) {
  const iconClasses = {
    success: { icon: CheckCircle, color: 'text-green-600' },
    error: { icon: AlertCircle, color: 'text-red-600' },
    warning: { icon: AlertTriangle, color: 'text-yellow-600' },
    info: { icon: Info, color: 'text-blue-600' }
  }
  
  const { icon: Icon, color } = iconClasses[type]
  
  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      variant="center"
      className="max-w-sm"
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className={cn('p-3 rounded-full bg-gray-100', color)}>
          <Icon className="h-8 w-8" />
        </div>
        
        <Text>
          {message}
        </Text>
        
        <TouchTarget
          variant="primary"
          size="lg"
          onClick={onClose}
          className="w-full"
        >
          OK
        </TouchTarget>
      </div>
    </MobileModal>
  )
}
```

### 6. Add Required CSS Animations

Location: `/style/styles/globals.css`

```css
/* Modal animations */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@keyframes slide-down {
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}

.animate-slide-down {
  animation: slide-down 0.3s ease-out;
}

/* Safe area padding for iOS */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Prevent body scroll when modal is open */
body.modal-open {
  overflow: hidden;
  position: fixed;
  width: 100%;
}

/* Smooth scrolling in modals */
@supports (scrollbar-gutter: stable) {
  .modal-scroll {
    scrollbar-gutter: stable;
  }
}
```

### 7. Testing Checklist

- [ ] All modals use dvh units for height
- [ ] Close buttons are easily tappable (48px)
- [ ] Content scrolls properly on all devices
- [ ] Body scroll is locked when modal is open
- [ ] Animations are smooth on mobile
- [ ] Safe area insets work on iOS
- [ ] Backdrop properly covers screen
- [ ] Focus management works correctly
- [ ] Keyboard dismissal works on mobile
- [ ] Screen readers announce modals

## Key Improvements

### Mobile Optimization
1. **Dynamic Viewport Height**: Uses dvh units
2. **Touch Targets**: All close buttons 48px+
3. **Sheet Modal**: Slides up from bottom
4. **Safe Areas**: Respects device safe zones

### Scrolling & Layout
1. **Body Lock**: Prevents background scroll
2. **Overscroll**: Contains scroll within modal
3. **Sticky Header**: Always visible title/close
4. **Flexible Height**: Adapts to content

### Variants
1. **Sheet**: Bottom sheet for forms
2. **Center**: Centered for alerts
3. **Fullscreen**: For images/large content
4. **Responsive**: Different variants per device

## Usage Examples

### Form Modal
```typescript
<MobileModal
  isOpen={isOpen}
  onClose={onClose}
  title="Edit Details"
  variant="sheet"
>
  <FormContent />
</MobileModal>
```

### Confirmation Dialog
```typescript
<ConfirmationModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Delete Attendee?"
  message="This action cannot be undone."
  variant="danger"
/>
```

### Alert Message
```typescript
<MobileAlert
  isOpen={showSuccess}
  onClose={() => setShowSuccess(false)}
  type="success"
  title="Success!"
  message="Your changes have been saved."
/>
```

## Migration Notes

1. Replace all existing modals with MobileModal
2. Update height calculations to use dvh
3. Add proper close button touch targets
4. Implement scroll locking on body
5. Test on iOS for safe area insets
6. Verify animations performance
7. Add keyboard accessibility
8. Test with screen readers
