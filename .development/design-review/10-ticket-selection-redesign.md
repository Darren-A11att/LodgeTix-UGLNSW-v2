# Step 10: Refactor Ticket Selection

## System Prompt
You are refactoring the ticket selection step to replace table layouts with responsive flexbox/grid, implement a sticky order summary, update mobile collapsed views, and fix all touch targets.

## Implementation Checklist

### 1. Redesigned Ticket Selection View

Location: `/components/register/steps/ticket-selection/TicketSelectionView.tsx`

```typescript
import { FormGrid, ResponsiveContainer } from '@/components/register/core'
import { Card } from '@/components/ui/card'
import { Heading, Text } from '@/components/ui/typography'
import { useState } from 'react'

export function TicketSelectionView({ 
  attendees, 
  tickets, 
  packages,
  selections,
  onSelectionChange,
  onContinue 
}) {
  const [expandedSections, setExpandedSections] = useState<string[]>([])
  
  return (
    <ResponsiveContainer maxWidth="2xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Ticket Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Package Selection */}
          {packages.length > 0 && (
            <Card>
              <Card.Header 
                title="Package Options"
                subtitle="Save by selecting a package"
              />
              <Card.Content>
                <div className="space-y-3">
                  {packages.map((pkg) => (
                    <PackageSelector
                      key={pkg.id}
                      package={pkg}
                      selected={selections.packageId === pkg.id}
                      onSelect={() => onSelectionChange({ packageId: pkg.id })}
                    />
                  ))}
                </div>
              </Card.Content>
            </Card>
          )}
          
          {/* Individual Ticket Selection */}
          <Card>
            <Card.Header 
              title="Individual Tickets"
              subtitle="Select tickets for each attendee"
            />
            <Card.Content>
              <div className="space-y-4">
                {attendees.map((attendee) => (
                  <AttendeeTicketSelector
                    key={attendee.id}
                    attendee={attendee}
                    tickets={tickets}
                    selection={selections.attendees[attendee.id]}
                    onSelectionChange={(ticketId) => 
                      onSelectionChange({ 
                        attendeeId: attendee.id, 
                        ticketId 
                      })
                    }
                    expanded={expandedSections.includes(attendee.id)}
                    onToggle={() => toggleSection(attendee.id)}
                  />
                ))}
              </div>
            </Card.Content>
          </Card>
        </div>
        
        {/* Sticky Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <OrderSummaryCard
              selections={selections}
              attendees={attendees}
              tickets={tickets}
              packages={packages}
              onContinue={onContinue}
            />
          </div>
        </div>
      </div>
    </ResponsiveContainer>
  )
}
```

### 2. Create Attendee Ticket Selector

Location: `/components/register/steps/ticket-selection/components/AttendeeTicketSelector.tsx`

```typescript
import { TouchTarget } from '@/components/register/core'
import { ChevronDown, ChevronUp, User } from 'lucide-react'

export function AttendeeTicketSelector({ 
  attendee, 
  tickets, 
  selection, 
  onSelectionChange,
  expanded,
  onToggle 
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header - Always Visible */}
      <div className="p-4 bg-gray-50">
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
                {attendee.type} • {selection ? tickets.find(t => t.id === selection)?.name : 'No ticket selected'}
              </Text>
            </div>
          </div>
          
          <TouchTarget
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="lg:hidden"
          >
            {expanded ? <ChevronUp /> : <ChevronDown />}
          </TouchTarget>
        </div>
      </div>
      
      {/* Ticket Options - Collapsible on Mobile */}
      <div className={`${!expanded ? 'hidden lg:block' : ''}`}>
        <div className="p-4 space-y-2">
          {tickets.map((ticket) => (
            <TicketOption
              key={ticket.id}
              ticket={ticket}
              selected={selection === ticket.id}
              onSelect={() => onSelectionChange(ticket.id)}
              attendeeType={attendee.type}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
```

### 3. Create Ticket Option Component

Location: `/components/register/steps/ticket-selection/components/TicketOption.tsx`

```typescript
export function TicketOption({ ticket, selected, onSelect, attendeeType }) {
  const isEligible = ticket.eligibleTypes.includes(attendeeType)
  
  return (
    <label 
      className={cn(
        'flex items-center p-3 rounded-lg border cursor-pointer transition-colors',
        selected ? 'border-secondary bg-secondary-light' : 'border-gray-200',
        !isEligible && 'opacity-50 cursor-not-allowed',
        'hover:border-secondary-dark'
      )}
    >
      <input
        type="radio"
        checked={selected}
        onChange={() => isEligible && onSelect()}
        disabled={!isEligible}
        className="sr-only"
      />
      
      <div className="flex items-center justify-between w-full">
        <div className="flex-1">
          <Text weight="medium">{ticket.name}</Text>
          <Text variant="small" className="text-gray-600">
            {ticket.description}
          </Text>
          {!isEligible && (
            <Text variant="small" className="text-red-600">
              Not available for {attendeeType}
            </Text>
          )}
        </div>
        
        <div className="text-right ml-4">
          <Text weight="semibold" className="text-primary">
            ${ticket.price}
          </Text>
          {ticket.originalPrice && ticket.originalPrice > ticket.price && (
            <Text variant="small" className="text-gray-500 line-through">
              ${ticket.originalPrice}
            </Text>
          )}
        </div>
      </div>
    </label>
  )
}
```

### 4. Create Package Selector

Location: `/components/register/steps/ticket-selection/components/PackageSelector.tsx`

```typescript
export function PackageSelector({ package: pkg, selected, onSelect }) {
  return (
    <label 
      className={cn(
        'flex items-center p-4 rounded-lg border cursor-pointer transition-all',
        selected ? 'border-secondary bg-secondary-light shadow-md' : 'border-gray-200',
        'hover:border-secondary hover:shadow-sm'
      )}
    >
      <input
        type="radio"
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      
      <div className="flex items-center justify-between w-full">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <Text weight="semibold">{pkg.name}</Text>
            {pkg.popular && (
              <span className="px-2 py-1 text-xs bg-secondary text-white rounded-full">
                Popular
              </span>
            )}
          </div>
          <Text variant="small" className="text-gray-600 mt-1">
            {pkg.description}
          </Text>
          <div className="mt-2 space-y-1">
            {pkg.includes.map((item, idx) => (
              <Text key={idx} variant="small" className="text-gray-700">
                • {item}
              </Text>
            ))}
          </div>
        </div>
        
        <div className="text-right ml-6">
          <Text variant="large" weight="bold" className="text-primary">
            ${pkg.price}
          </Text>
          <Text variant="small" className="text-green-600">
            Save ${pkg.savings}
          </Text>
        </div>
      </div>
    </label>
  )
}
```

### 5. Create Mobile-Optimized Order Summary

Location: `/components/register/steps/ticket-selection/components/OrderSummaryCard.tsx`

```typescript
export function OrderSummaryCard({ 
  selections, 
  attendees, 
  tickets, 
  packages,
  onContinue 
}) {
  const { total, itemizedList } = useTicketCalculations({
    selections,
    attendees,
    tickets,
    packages
  })
  
  return (
    <Card variant="elevated">
      <Card.Header 
        title="Order Summary" 
        subtitle={`${attendees.length} attendees`}
      />
      
      <Card.Content>
        {/* Mobile Collapsed View */}
        <div className="lg:hidden">
          <div className="flex justify-between items-center py-3">
            <Text weight="semibold">Total</Text>
            <Text variant="large" weight="bold" className="text-primary">
              ${total.toFixed(2)}
            </Text>
          </div>
        </div>
        
        {/* Desktop Detailed View */}
        <div className="hidden lg:block space-y-3">
          {itemizedList.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <Text className="text-gray-700">{item.description}</Text>
              <Text weight="medium">${item.amount}</Text>
            </div>
          ))}
          
          <div className="pt-3 mt-3 border-t border-gray-200">
            <div className="flex justify-between">
              <Text weight="semibold">Total</Text>
              <Text variant="large" weight="bold" className="text-primary">
                ${total.toFixed(2)}
              </Text>
            </div>
          </div>
        </div>
      </Card.Content>
      
      <Card.Footer>
        <TouchTarget
          variant="primary"
          size="lg"
          onClick={onContinue}
          className="w-full"
          disabled={!isValid(selections)}
        >
          Continue to Review
        </TouchTarget>
      </Card.Footer>
    </Card>
  )
}
```

### 6. Create Responsive Utilities

Location: `/components/register/steps/ticket-selection/utils/responsiveHelpers.ts`

```typescript
export function useTicketSelectionResponsive() {
  const isMobile = useMediaQuery('(max-width: 640px)')
  const isTablet = useMediaQuery('(max-width: 1024px)')
  
  return {
    isMobile,
    isTablet,
    shouldCollapse: isMobile,
    showSummarySticky: !isTablet,
    gridColumns: isMobile ? 1 : isTablet ? 2 : 3
  }
}
```

### 7. Testing Checklist

- [ ] Table layouts replaced with responsive flexbox/grid
- [ ] Order summary is sticky on desktop
- [ ] Mobile shows collapsed ticket selections
- [ ] Touch targets meet 48px minimum
- [ ] Package selection is prominent
- [ ] Individual tickets are clearly grouped
- [ ] Price calculations update in real-time
- [ ] Expand/collapse animations are smooth
- [ ] Selected states are visually clear
- [ ] Disabled states for ineligible tickets

## Key Improvements

### Mobile Experience
1. **Collapsed Views**: Attendee tickets collapsed by default
2. **Touch Targets**: All interactive elements 48px+
3. **Simplified Summary**: Just total on mobile
4. **Accordion Pattern**: Expand one attendee at a time

### Desktop Experience
1. **Sticky Summary**: Always visible order total
2. **Side-by-side Layout**: Tickets and summary
3. **Detailed Breakdown**: Full price itemization
4. **Visual Hierarchy**: Packages prominent

### Accessibility
1. **Radio Patterns**: Proper form semantics
2. **Keyboard Navigation**: Full support
3. **Screen Reader**: Descriptive labels
4. **Focus Management**: Clear indicators

## Before/After Layouts

### Before (Mobile)
```
[Table Headers]
[Ticket Row 1]
[Ticket Row 2]
[Order Total]
```

### After (Mobile)
```
[Attendee 1 Summary] [▼]
[Attendee 2 Summary] [▼]
[Total: $XXX]
[Continue Button]
```

### After (Desktop)
```
[Package Options        ] [Order Summary]
[Individual Tickets     ] [- Item 1    ]
[- Attendee 1          ] [- Item 2    ]
[- Attendee 2          ] [Total: $XXX ]
                         [Continue    ]
```

## Migration Notes

1. Remove all table-based layouts
2. Implement proper grid system
3. Add mobile collapse functionality
4. Update touch target sizes
5. Test sticky behavior on various browsers
6. Verify price calculations
7. Check accessibility with screen readers
