# Step 09: Update Attendee Cards

## System Prompt
You are redesigning the attendee cards to implement a two-column mobile layout, fix touch targets for the remove button, update partner information display, and add collapsible sections for better mobile UX.

## Implementation Checklist

### 1. Redesigned Attendee Card

Location: `/components/register/registration/core/AttendeeCardView.tsx`

```typescript
import { Card } from '@/components/ui/card'
import { TouchTarget } from '@/components/register/core'
import { Heading, Text } from '@/components/ui/typography'
import { ChevronDown, ChevronUp, Trash2, User, Mail, Phone } from 'lucide-react'
import { useState } from 'react'

interface AttendeeCardViewProps {
  attendee: Attendee
  onRemove: () => void
  onEdit: () => void
  isRemovable?: boolean
}

export function AttendeeCardView({ 
  attendee, 
  onRemove, 
  onEdit,
  isRemovable = true 
}: AttendeeCardViewProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  return (
    <Card variant="default" className="mb-4">
      {/* Card Header with Two-Column Mobile Layout */}
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Left Column: Name and Type */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-secondary-light rounded-full">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <Heading as="h4" variant="h5">
                  {attendee.firstName} {attendee.lastName}
                </Heading>
                <Text variant="small" className="text-gray-600">
                  {attendee.type} • {attendee.ticketType}
                </Text>
              </div>
            </div>
          </div>
          
          {/* Right Column: Actions */}
          <div className="col-span-2 sm:col-span-1 flex justify-end items-start space-x-2">
            <TouchTarget
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="sm:hidden"
              aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </TouchTarget>
            
            <TouchTarget
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="text-primary hover:text-primary-dark"
            >
              Edit
            </TouchTarget>
            
            {isRemovable && (
              <TouchTarget
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-5 w-5" />
                <span className="sr-only">Remove</span>
              </TouchTarget>
            )}
          </div>
        </div>
        
        {/* Contact Information - Always visible on desktop, collapsible on mobile */}
        <div className={`mt-4 grid grid-cols-2 gap-4 ${!isExpanded ? 'hidden sm:grid' : ''}`}>
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center space-x-2 text-sm">
              <Mail className="h-4 w-4 text-gray-400" />
              <Text variant="small">{attendee.email}</Text>
            </div>
          </div>
          
          {attendee.phone && (
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <Text variant="small">{attendee.phone}</Text>
              </div>
            </div>
          )}
        </div>
        
        {/* Additional Details - Collapsible */}
        {(attendee.lodgeName || attendee.dietaryRequirements) && (
          <div className={`mt-4 space-y-3 ${!isExpanded ? 'hidden sm:block' : ''}`}>
            {attendee.lodgeName && (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <Text variant="small" className="text-gray-500">Lodge</Text>
                  <Text variant="small" className="font-medium">
                    {attendee.lodgeName} No. {attendee.lodgeNumber}
                  </Text>
                </div>
                
                {attendee.grandLodge && (
                  <div className="col-span-2 sm:col-span-1">
                    <Text variant="small" className="text-gray-500">Grand Lodge</Text>
                    <Text variant="small" className="font-medium">
                      {attendee.grandLodge}
                    </Text>
                  </div>
                )}
              </div>
            )}
            
            {attendee.dietaryRequirements && (
              <div>
                <Text variant="small" className="text-gray-500">Dietary Requirements</Text>
                <Text variant="small" className="font-medium">
                  {attendee.dietaryRequirements}
                </Text>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Partner Information - Separate Section */}
      {attendee.partner && (
        <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <Text variant="small" weight="semibold" className="text-gray-700">
              Partner Details
            </Text>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <Text variant="small" className="text-gray-500">Name</Text>
              <Text variant="small" className="font-medium">
                {attendee.partner.firstName} {attendee.partner.lastName}
              </Text>
            </div>
            
            {attendee.partner.dietaryRequirements && (
              <div className="col-span-2 sm:col-span-1">
                <Text variant="small" className="text-gray-500">Dietary Requirements</Text>
                <Text variant="small" className="font-medium">
                  {attendee.partner.dietaryRequirements}
                </Text>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
```

### 2. Create Compact Attendee Card for Mobile

Location: `/components/register/registration/core/AttendeeCardCompact.tsx`

```typescript
export function AttendeeCardCompact({ attendee, onSelect }) {
  return (
    <TouchTarget
      className="w-full p-4 bg-white border border-gray-200 rounded-lg hover:border-secondary"
      onClick={() => onSelect(attendee)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-secondary-light rounded-full">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <Text weight="medium">
              {attendee.firstName} {attendee.lastName}
            </Text>
            <Text variant="small" className="text-gray-600">
              {attendee.type} • {attendee.ticketType}
            </Text>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </div>
    </TouchTarget>
  )
}
```

### 3. Create Attendee List with Mobile Optimization

Location: `/components/register/registration/AttendeeList.tsx`

```typescript
import { useMediaQuery } from '@/hooks/use-mobile'
import { AttendeeCardView } from './core/AttendeeCardView'
import { AttendeeCardCompact } from './core/AttendeeCardCompact'

export function AttendeeList({ attendees, onRemove, onEdit }) {
  const isMobile = useMediaQuery('(max-width: 640px)')
  const [selectedAttendee, setSelectedAttendee] = useState(null)
  
  if (isMobile) {
    return (
      <>
        <div className="space-y-3">
          {attendees.map((attendee) => (
            <AttendeeCardCompact
              key={attendee.id}
              attendee={attendee}
              onSelect={setSelectedAttendee}
            />
          ))}
        </div>
        
        {/* Detail Modal for Mobile */}
        <MobileModal
          isOpen={!!selectedAttendee}
          onClose={() => setSelectedAttendee(null)}
          title="Attendee Details"
        >
          {selectedAttendee && (
            <AttendeeDetailView
              attendee={selectedAttendee}
              onEdit={() => {
                onEdit(selectedAttendee)
                setSelectedAttendee(null)
              }}
              onRemove={() => {
                onRemove(selectedAttendee.id)
                setSelectedAttendee(null)
              }}
            />
          )}
        </MobileModal>
      </>
    )
  }
  
  return (
    <div className="space-y-4">
      {attendees.map((attendee) => (
        <AttendeeCardView
          key={attendee.id}
          attendee={attendee}
          onRemove={() => onRemove(attendee.id)}
          onEdit={() => onEdit(attendee)}
        />
      ))}
    </div>
  )
}
```

### 4. Create Attendee Detail View for Mobile Modal

Location: `/components/register/registration/core/AttendeeDetailView.tsx`

```typescript
export function AttendeeDetailView({ attendee, onEdit, onRemove }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex p-3 bg-secondary-light rounded-full mb-3">
          <User className="h-8 w-8 text-primary" />
        </div>
        <Heading as="h3" variant="h4">
          {attendee.firstName} {attendee.lastName}
        </Heading>
        <Text className="text-gray-600">
          {attendee.type} • {attendee.ticketType}
        </Text>
      </div>
      
      {/* Contact Information */}
      <div className="space-y-4">
        <div>
          <Text variant="small" className="text-gray-500">Email</Text>
          <Text className="font-medium">{attendee.email}</Text>
        </div>
        
        {attendee.phone && (
          <div>
            <Text variant="small" className="text-gray-500">Phone</Text>
            <Text className="font-medium">{attendee.phone}</Text>
          </div>
        )}
      </div>
      
      {/* Lodge Information (Masons only) */}
      {attendee.lodgeName && (
        <div className="space-y-4">
          <div>
            <Text variant="small" className="text-gray-500">Lodge</Text>
            <Text className="font-medium">
              {attendee.lodgeName} No. {attendee.lodgeNumber}
            </Text>
          </div>
          
          {attendee.grandLodge && (
            <div>
              <Text variant="small" className="text-gray-500">Grand Lodge</Text>
              <Text className="font-medium">{attendee.grandLodge}</Text>
            </div>
          )}
        </div>
      )}
      
      {/* Actions */}
      <div className="flex flex-col space-y-3">
        <TouchTarget
          variant="primary"
          onClick={onEdit}
          className="w-full"
        >
          Edit Details
        </TouchTarget>
        
        <TouchTarget
          variant="ghost"
          onClick={onRemove}
          className="w-full text-red-600 hover:text-red-700"
        >
          Remove Attendee
        </TouchTarget>
      </div>
    </div>
  )
}
```

### 5. Testing Checklist

- [ ] Cards display in 2-column grid on mobile
- [ ] Remove button meets 48px touch target
- [ ] Expand/collapse works smoothly on mobile
- [ ] Partner information displays clearly
- [ ] Edit and remove actions are accessible
- [ ] Modal view works well on small screens
- [ ] Content remains readable at all sizes
- [ ] Touch interactions feel responsive
- [ ] Keyboard navigation works properly
- [ ] Screen readers announce correctly

## Key Improvements

### Mobile Experience
1. **Collapsible Details**: Less important info hidden by default
2. **Touch Targets**: All buttons meet 48px minimum
3. **Compact View**: List view for multiple attendees
4. **Modal Details**: Full details in modal on mobile

### Visual Hierarchy
1. **Clear Headers**: Name and type prominent
2. **Icon Usage**: Visual cues for information types
3. **Grouped Content**: Related info clustered
4. **Color Coding**: Status indicated by colors

### Accessibility
1. **ARIA Labels**: Screen reader friendly
2. **Keyboard Navigation**: Full keyboard support
3. **Focus States**: Clear focus indicators
4. **Semantic HTML**: Proper heading structure

## Before/After Comparison

### Before (Mobile)
```
[Name Type Remove]
[Email Phone]
[Partner info]
[Dietary]
```

### After (Mobile)
```
[Icon Name/Type] [Actions]
[Email] [Phone]
[+ Expand for more]
```

### After (Desktop)
```
[Icon Name/Type]     [Edit] [Remove]
[Email]              [Phone]
[Lodge Details]      [Dietary]
[Partner Section - if applicable]
```

## Migration Notes

1. Replace existing AttendeeCard with new responsive version
2. Add mobile detection for list/detail pattern
3. Update touch targets to meet accessibility standards
4. Test collapsible sections on various devices
5. Verify modal behavior on iOS and Android
6. Check partner information display logic
