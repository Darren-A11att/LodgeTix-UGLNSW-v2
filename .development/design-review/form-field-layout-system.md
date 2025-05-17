# Form Field Layout System

## Overview
The current form layouts have inconsistent column implementations that create poor mobile experiences. This document defines a standardized field layout system that works well on both desktop and mobile.

## Field Size System

### Field Types
1. **Small Fields** (25% on desktop, 50% on mobile)
   - Title, Rank, State/Territory
   - Checkboxes and toggles
   - Short select dropdowns

2. **Medium Fields** (50% on desktop, 100% on mobile)
   - First Name, Last Name
   - Email, Phone Number
   - City/Suburb, Postcode

3. **Large Fields** (100% on both desktop and mobile)
   - Grand Lodge, Lodge
   - Address fields
   - Textarea fields
   - Special instructions

### Layout Examples

#### Mason Form Structure
```
Desktop (4 columns):
[Small] [Medium---] [Medium---] [Small]
(Title) (FirstName) (LastName) (Rank)

[Large------------------------]
(Grand Lodge)

[Large------------------------]
(Lodge)

Mobile (2 columns):
[Small][Small]
(Title)(Rank)

[Medium------]
(First Name)

[Medium------]
(Last Name)

[Large-------]
(Grand Lodge)

[Large-------]
(Lodge)
```

## Implementation Strategy

### 1. Grid System
```css
/* Base grid system for forms */
.form-grid {
  display: grid;
  gap: 1rem;
  
  /* Mobile: 2 columns */
  grid-template-columns: repeat(2, 1fr);
  
  /* Desktop: 4 columns */
  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Field size classes */
.field-small {
  grid-column: span 1;
}

.field-medium {
  grid-column: span 2;
  
  @media (min-width: 768px) {
    grid-column: span 2;
  }
}

.field-large {
  grid-column: span 2;
  
  @media (min-width: 768px) {
    grid-column: span 4;
  }
}
```

### 2. React Component Implementation
```typescript
// components/ui/form-field-layout.tsx
import { cn } from "@/lib/utils"

export type FieldSize = 'small' | 'medium' | 'large'

interface FormFieldLayoutProps {
  size?: FieldSize
  children: React.ReactNode
  className?: string
}

export function FormFieldLayout({ 
  size = 'medium', 
  children, 
  className 
}: FormFieldLayoutProps) {
  const sizeClasses = {
    small: 'col-span-1',
    medium: 'col-span-2 md:col-span-2',
    large: 'col-span-2 md:col-span-4'
  }
  
  return (
    <div className={cn(sizeClasses[size], className)}>
      {children}
    </div>
  )
}

// Form grid wrapper
export function FormGrid({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn(
      "grid grid-cols-2 md:grid-cols-4 gap-4",
      className
    )}>
      {children}
    </div>
  )
}
```

### 3. Example Usage in MasonForm
```typescript
// components/register/forms/mason/MasonBasicInfo.tsx
export function MasonBasicInfo({ mason, onChange, titles, ranks }) {
  return (
    <FormGrid>
      <FormFieldLayout size="small">
        <Label htmlFor="title">Title</Label>
        <Select
          id="title"
          value={mason.title}
          onChange={(e) => onChange('title', e.target.value)}
        >
          {titles.map(title => (
            <option key={title} value={title}>{title}</option>
          ))}
        </Select>
      </FormFieldLayout>
      
      <FormFieldLayout size="medium">
        <Label htmlFor="firstName">First Name</Label>
        <Input
          id="firstName"
          value={mason.firstName}
          onChange={(e) => onChange('firstName', e.target.value)}
        />
      </FormFieldLayout>
      
      <FormFieldLayout size="medium">
        <Label htmlFor="lastName">Last Name</Label>
        <Input
          id="lastName"
          value={mason.lastName}
          onChange={(e) => onChange('lastName', e.target.value)}
        />
      </FormFieldLayout>
      
      <FormFieldLayout size="small">
        <Label htmlFor="rank">Rank</Label>
        <Select
          id="rank"
          value={mason.rank}
          onChange={(e) => onChange('rank', e.target.value)}
        >
          {ranks.map(rank => (
            <option key={rank.value} value={rank.value}>{rank.label}</option>
          ))}
        </Select>
      </FormFieldLayout>
    </FormGrid>
  )
}
```

## Modal Implementations

### AttendeeEditModal Mobile Optimization
```typescript
// components/register/attendee/AttendeeEditModal.tsx
export function AttendeeEditModal({ isOpen, onClose, attendee }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[100dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Attendee</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <FormGrid>
            {/* Use same field layout system */}
            <FormFieldLayout size="small">
              <Label htmlFor="title">Title</Label>
              <Select id="title" value={attendee.title}>
                {/* options */}
              </Select>
            </FormFieldLayout>
            
            <FormFieldLayout size="medium">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" value={attendee.firstName} />
            </FormFieldLayout>
            
            {/* Continue with same pattern */}
          </FormGrid>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### Mobile Modal Styling
```css
/* Ensure modals use dvh units for mobile */
.modal-content {
  max-height: 100dvh;
  overflow-y: auto;
  
  /* Add safe area insets for mobile devices */
  padding-bottom: env(safe-area-inset-bottom);
}

/* Responsive modal sizing */
@media (max-width: 640px) {
  .modal-content {
    width: 100%;
    height: 100dvh;
    border-radius: 0;
    margin: 0;
  }
}
```

## Responsive Patterns

### Common Field Groupings
1. **Name Fields**
   ```
   Desktop: [Title] [First Name--] [Last Name--]
   Mobile:  [Title]
            [First Name----]
            [Last Name-----]
   ```

2. **Contact Fields**
   ```
   Desktop: [Email---------] [Phone---------]
   Mobile:  [Email---------]
            [Phone---------]
   ```

3. **Address Fields**
   ```
   Desktop: [Address Line 1----------------]
            [Suburb--------] [State] [Post]
   Mobile:  [Address Line 1----------------]
            [Suburb---------]
            [State] [Postcode]
   ```

## Benefits

1. **Consistent Layout**: All forms follow the same grid system
2. **Mobile Optimized**: Clean 2-column layout on mobile
3. **Predictable Behavior**: Developers know how fields will layout
4. **Maintainable**: Single source of truth for field sizes
5. **Accessible**: Proper label/input relationships maintained

## Migration Plan

1. Create base components (`FormGrid`, `FormFieldLayout`)
2. Update MasonForm as pilot implementation
3. Extend to other form components
4. Update modals with dvh units
5. Test on various devices

## Testing Requirements

1. **Mobile Devices**
   - iPhone (various sizes)
   - Android phones
   - Tablet devices

2. **Breakpoints**
   - 320px (small mobile)
   - 640px (mobile/tablet boundary)
   - 768px (tablet/desktop boundary)
   - 1024px (desktop)

3. **Orientation**
   - Portrait and landscape
   - Modal behavior in both

This system provides a clear, consistent approach to form layouts that works well on all devices while maintaining the visual hierarchy needed for complex forms.