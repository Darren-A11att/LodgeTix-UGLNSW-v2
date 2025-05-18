# Step 11: Update Order Review

## System Prompt
You are redesigning the order review step to implement a sidebar layout on desktop, create a mobile-friendly summary, update attendee review cards with two-column layout, and ensure responsive behavior throughout.

## Implementation Checklist

### 1. Redesigned Order Review View

Location: `/components/register/order/review/OrderReviewView.tsx`

```typescript
import { ResponsiveContainer } from '@/components/register/core'
import { Card } from '@/components/ui/card'
import { Heading, Text } from '@/components/ui/typography'
import { useState } from 'react'

export function OrderReviewView({ 
  attendees, 
  selections,
  event,
  onEdit,
  onConfirm,
  isProcessing 
}) {
  const [expandedCards, setExpandedCards] = useState<string[]>([])
  const isMobile = useMediaQuery('(max-width: 768px)')
  
  return (
    <ResponsiveContainer maxWidth="2xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Attendee Review */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Information */}
          <Card>
            <Card.Header 
              title="Event Details"
              subtitle={event.date}
            />
            <Card.Content>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Text variant="small" className="text-gray-500">Event</Text>
                  <Text weight="medium">{event.name}</Text>
                </div>
                <div>
                  <Text variant="small" className="text-gray-500">Location</Text>
                  <Text weight="medium">{event.location}</Text>
                </div>
                <div className="col-span-2">
                  <Text variant="small" className="text-gray-500">Date & Time</Text>
                  <Text weight="medium">
                    {formatDate(event.date)} at {event.time}
                  </Text>
                </div>
              </div>
            </Card.Content>
          </Card>
          
          {/* Attendee Cards */}
          <div className="space-y-4">
            <Heading as="h3" variant="h4">
              Attendee Details
            </Heading>
            
            {attendees.map((attendee) => (
              <AttendeeReviewCard
                key={attendee.id}
                attendee={attendee}
                ticket={selections.tickets[attendee.id]}
                expanded={expandedCards.includes(attendee.id)}
                onToggle={() => toggleCard(attendee.id)}
                onEdit={() => onEdit(attendee.id)}
                isMobile={isMobile}
              />
            ))}
          </div>
        </div>
        
        {/* Sidebar - Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <OrderSummaryReview
              attendees={attendees}
              selections={selections}
              onConfirm={onConfirm}
              isProcessing={isProcessing}
            />
          </div>
        </div>
      </div>
      
      {/* Mobile Fixed Footer */}
      {isMobile && (
        <MobileOrderFooter
          total={calculateTotal(selections)}
          onConfirm={onConfirm}
          isProcessing={isProcessing}
        />
      )}
    </ResponsiveContainer>
  )
}
```

### 2. Create Attendee Review Card

Location: `/components/register/order/review/AttendeeReviewCard.tsx`

```typescript
export function AttendeeReviewCard({ 
  attendee, 
  ticket, 
  expanded, 
  onToggle, 
  onEdit,
  isMobile 
}) {
  return (
    <Card>
      {/* Header - Always Visible */}
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-secondary-light rounded-full">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Heading as="h4" variant="h5">
                {attendee.firstName} {attendee.lastName}
              </Heading>
              <Text variant="small" className="text-gray-600">
                {attendee.type} • {ticket.name}
              </Text>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isMobile && (
              <TouchTarget
                variant="ghost"
                size="sm"
                onClick={onToggle}
                aria-label={expanded ? 'Show less' : 'Show more'}
              >
                {expanded ? <ChevronUp /> : <ChevronDown />}
              </TouchTarget>
            )}
            
            <TouchTarget
              variant="ghost"
              size="sm"
              onClick={onEdit}
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </TouchTarget>
          </div>
        </div>
        
        {/* Summary Row - Mobile */}
        {isMobile && !expanded && (
          <div className="mt-3 flex justify-between items-center">
            <Text variant="small" className="text-gray-600">
              {ticket.name}
            </Text>
            <Text weight="medium" className="text-primary">
              ${ticket.price}
            </Text>
          </div>
        )}
      </div>
      
      {/* Detailed Information - Collapsible on Mobile */}
      {(!isMobile || expanded) && (
        <div className="border-t border-gray-200">
          <div className="p-4 sm:p-6 space-y-4">
            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Text variant="small" className="text-gray-500">Email</Text>
                <Text variant="small" className="font-medium break-all">
                  {attendee.email}
                </Text>
              </div>
              
              {attendee.phone && (
                <div>
                  <Text variant="small" className="text-gray-500">Phone</Text>
                  <Text variant="small" className="font-medium">
                    {attendee.phone}
                  </Text>
                </div>
              )}
              
              {attendee.lodgeName && (
                <div className="col-span-2">
                  <Text variant="small" className="text-gray-500">Lodge</Text>
                  <Text variant="small" className="font-medium">
                    {attendee.lodgeName} No. {attendee.lodgeNumber}
                  </Text>
                </div>
              )}
            </div>
            
            {/* Ticket Information */}
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <div>
                  <Text variant="small" className="text-gray-500">Ticket</Text>
                  <Text weight="medium">{ticket.name}</Text>
                  <Text variant="small" className="text-gray-600">
                    {ticket.description}
                  </Text>
                </div>
                <Text variant="large" weight="bold" className="text-primary">
                  ${ticket.price}
                </Text>
              </div>
            </div>
            
            {/* Special Requirements */}
            {(attendee.dietaryRequirements || attendee.specialRequirements) && (
              <div className="pt-4 border-t space-y-3">
                {attendee.dietaryRequirements && (
                  <div>
                    <Text variant="small" className="text-gray-500">
                      Dietary Requirements
                    </Text>
                    <Text variant="small" className="font-medium">
                      {attendee.dietaryRequirements}
                    </Text>
                  </div>
                )}
                
                {attendee.specialRequirements && (
                  <div>
                    <Text variant="small" className="text-gray-500">
                      Special Requirements
                    </Text>
                    <Text variant="small" className="font-medium">
                      {attendee.specialRequirements}
                    </Text>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
```

### 3. Create Order Summary for Review

Location: `/components/register/order/review/OrderSummaryReview.tsx`

```typescript
export function OrderSummaryReview({ 
  attendees, 
  selections, 
  onConfirm, 
  isProcessing 
}) {
  const { subtotal, fees, total } = calculateOrderTotals(selections)
  
  return (
    <Card variant="elevated" className="overflow-hidden">
      <Card.Header 
        title="Order Summary" 
        subtitle={`${attendees.length} attendees`}
      />
      
      <Card.Content>
        {/* Line Items */}
        <div className="space-y-3">
          {attendees.map((attendee) => {
            const ticket = selections.tickets[attendee.id]
            return (
              <div key={attendee.id} className="flex justify-between text-sm">
                <div>
                  <Text className="text-gray-700">
                    {attendee.firstName} {attendee.lastName}
                  </Text>
                  <Text variant="small" className="text-gray-500">
                    {ticket.name}
                  </Text>
                </div>
                <Text weight="medium">
                  ${ticket.price}
                </Text>
              </div>
            )
          })}
          
          {/* Subtotal */}
          <div className="pt-3 mt-3 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <Text>Subtotal</Text>
              <Text weight="medium">${subtotal}</Text>
            </div>
            
            {/* Fees */}
            {fees > 0 && (
              <div className="flex justify-between text-sm mt-2">
                <Text>Processing Fee</Text>
                <Text weight="medium">${fees}</Text>
              </div>
            )}
          </div>
          
          {/* Total */}
          <div className="pt-3 mt-3 border-t border-gray-200">
            <div className="flex justify-between">
              <Text weight="semibold">Total</Text>
              <Text variant="large" weight="bold" className="text-primary">
                ${total}
              </Text>
            </div>
          </div>
        </div>
      </Card.Content>
      
      {/* Desktop Confirm Button */}
      <Card.Footer className="hidden lg:block">
        <TouchTarget
          variant="primary"
          size="lg"
          onClick={onConfirm}
          className="w-full"
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Confirm and Pay'}
        </TouchTarget>
      </Card.Footer>
    </Card>
  )
}
```

### 4. Create Mobile Order Footer

Location: `/components/register/order/review/MobileOrderFooter.tsx`

```typescript
export function MobileOrderFooter({ total, onConfirm, isProcessing }) {
  return (
    <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 p-4 z-10">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-3">
          <Text weight="semibold">Total</Text>
          <Text variant="large" weight="bold" className="text-primary">
            ${total}
          </Text>
        </div>
        
        <TouchTarget
          variant="primary"
          size="lg"
          onClick={onConfirm}
          className="w-full"
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Confirm and Pay'}
        </TouchTarget>
      </div>
    </div>
  )
}
```

### 5. Create Ticket Summary List

Location: `/components/register/order/review/TicketList.tsx`

```typescript
export function TicketList({ attendees, selections }) {
  const ticketGroups = groupTicketsByType(attendees, selections)
  
  return (
    <div className="space-y-4">
      {ticketGroups.map((group) => (
        <div key={group.ticketId} className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <Text weight="medium">{group.ticketName}</Text>
              <Text variant="small" className="text-gray-600">
                {group.count} {group.count === 1 ? 'ticket' : 'tickets'}
              </Text>
            </div>
            <Text weight="medium" className="text-primary">
              ${group.totalPrice}
            </Text>
          </div>
          
          <div className="space-y-1">
            {group.attendees.map((attendee) => (
              <Text key={attendee.id} variant="small" className="text-gray-700">
                • {attendee.firstName} {attendee.lastName}
              </Text>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

### 6. Testing Checklist

- [ ] Desktop shows sidebar layout with sticky summary
- [ ] Mobile shows expandable attendee cards
- [ ] Two-column layout works on attendee details
- [ ] Touch targets meet 48px minimum
- [ ] Fixed footer appears on mobile only
- [ ] Edit buttons are easily accessible
- [ ] Pricing calculations are accurate
- [ ] Responsive breakpoints work smoothly
- [ ] Loading states display correctly
- [ ] Screen readers can navigate properly

## Key Improvements

### Mobile Experience
1. **Expandable Cards**: Conserve space with toggles
2. **Fixed Footer**: Easy access to total and confirm
3. **Summary View**: Quick price overview
4. **Touch Targets**: All buttons 48px+

### Desktop Experience
1. **Sidebar Layout**: Summary always visible
2. **Detailed View**: All information shown
3. **Edit Access**: Quick edit capabilities
4. **Visual Hierarchy**: Clear sections

### Data Display
1. **Two-Column Grid**: Efficient use of space
2. **Grouped Information**: Related data together
3. **Price Prominence**: Clear pricing display
4. **Accessibility**: Proper semantic markup

## Before/After Comparison

### Before (Mobile)
```
[Attendee 1 All Details]
[Attendee 2 All Details]
[Order Summary]
[Confirm Button]
```

### After (Mobile)
```
[Attendee 1 Summary] [▼]
[Attendee 2 Summary] [▼]
[Fixed: Total | Confirm]
```

### After (Desktop)
```
[Event Details     ] [Order Summary]
[Attendee 1 Full   ] [Attendee List]
[Attendee 2 Full   ] [Subtotal     ]
                     [Total        ]
                     [Confirm      ]
```

## Migration Notes

1. Update all attendee cards to use new layout
2. Implement mobile detection for UI changes
3. Add expanding/collapsing functionality
4. Create sticky sidebar for desktop
5. Add fixed footer for mobile
6. Update touch target sizes
7. Test on various screen sizes
8. Verify accessibility compliance
