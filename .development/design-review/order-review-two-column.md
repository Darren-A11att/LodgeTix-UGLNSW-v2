# Order Review Two-Column Layout Implementation

## Current Layout Problems

The current `OrderReviewView` component has several layout issues:

### 1. Single Column Layout Wastes Space
```tsx
// Current implementation - everything stacks vertically
<div className="space-y-6">
  <SectionHeader>/* ... */</SectionHeader>
  <Card className="border-masonic-navy">
    <ReviewHeader /* ... */ />
    <CardContent className="p-6 space-y-6">
      {/* All attendee cards stack vertically */}
      {orderedAttendees.map((attendee, index) => (
        <AttendeeReviewCard /* ... */ />
      ))}
    </CardContent>
    <OrderSummary /* ... */ />
  </Card>
</div>
```

### 2. AttendeeReviewCard Layout Issues
- Action buttons (Edit/Remove) are cramped in header
- Ticket list takes full width when it could be more compact
- No clear visual separation between sections
- Poor mobile experience with small touch targets

### 3. Order Summary Placement
- Order summary is buried at the bottom
- Users must scroll to see total
- No persistent visibility of order total

## New Two-Column Responsive Implementation

### Main View Structure
```tsx
export function OrderReviewView({ /* props */ }) {
  return (
    <div className="space-y-6">
      <SectionHeader>
        <h1 className="text-2xl font-bold text-masonic-navy">Review Your Order</h1>
        <div className="masonic-divider"></div>
        <p className="text-gray-600">
          Please review your registration details before proceeding to payment
        </p>
      </SectionHeader>

      {/* Two-column layout for desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Main content column */}
        <div className="space-y-4">
          {orderedAttendees.length === 0 ? (
            <Alert className="border-yellow-500 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-700" />
              <AlertDescription className="text-yellow-700">
                No attendees have been added to this registration yet.
              </AlertDescription>
            </Alert>
          ) : (
            orderedAttendees.map((attendee, index) => (
              <ImprovedAttendeeReviewCard
                key={attendee.attendeeId}
                attendee={attendee}
                index={index}
                tickets={getAttendeeTickets(attendee.attendeeId)}
                attendeeTotal={getAttendeeTotal(attendee.attendeeId)}
                attendeeTypeLabel={getAttendeeTypeLabel(attendee)}
                masonicTitle={getMasonicTitle(attendee)}
                onEdit={() => onEditAttendee(attendee, index)}
                onRemove={() => onRemoveAttendee(attendee.attendeeId)}
                onRemoveTicket={onRemoveTicket}
              />
            ))
          )}
        </div>

        {/* Sidebar column - Order summary */}
        <div className="lg:sticky lg:top-4 lg:h-fit">
          <Card className="border-masonic-navy">
            <CardHeader className="bg-masonic-navy text-white">
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Attendees</span>
                  <span className="font-medium">{attendeeCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tickets</span>
                  <span className="font-medium">{ticketCount}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Action buttons for desktop */}
              <div className="space-y-3 pt-4">
                <Button
                  onClick={onGoToNextStep}
                  disabled={orderedAttendees.length === 0}
                  className="w-full bg-masonic-navy hover:bg-masonic-blue"
                >
                  Proceed to Payment
                </Button>
                <Button
                  variant="outline"
                  onClick={onGoToPrevStep}
                  className="w-full border-masonic-navy text-masonic-navy"
                >
                  Back to Tickets
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile action buttons */}
      <div className="lg:hidden flex justify-between gap-4">
        <Button
          variant="outline"
          onClick={onGoToPrevStep}
          className="flex-1 border-masonic-navy text-masonic-navy"
        >
          Back
        </Button>
        <Button
          onClick={onGoToNextStep}
          disabled={orderedAttendees.length === 0}
          className="flex-1 bg-masonic-navy hover:bg-masonic-blue"
        >
          Payment
        </Button>
      </div>
    </div>
  )
}
```

### Improved AttendeeReviewCard
```tsx
function ImprovedAttendeeReviewCard({ /* props */ }) {
  return (
    <Card className="border-masonic-lightgold overflow-hidden">
      <CardHeader className="bg-masonic-lightgold/10 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Attendee info */}
          <div className="flex-1">
            <h3 className="text-lg font-medium text-masonic-navy">
              {masonicTitle} {attendee.firstName} {attendee.lastName}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {attendeeTypeLabel}
              </Badge>
              {attendee.isPrimary && (
                <Badge className="bg-masonic-navy text-xs">
                  Primary Attendee
                </Badge>
              )}
            </div>
          </div>

          {/* Action buttons with better touch targets */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onEdit}
              className="h-10 px-4 min-w-[80px]"
            >
              <Edit3 className="mr-2 h-4 w-4" />
              Edit
            </Button>
            {!attendee.isPrimary && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={onRemove}
                className="h-10 px-4 min-w-[80px]"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Two-column layout for attendee details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Details column */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700">Attendee Details</h4>
            
            {attendee.attendeeType === "mason" && attendee.lodgeNameNumber && (
              <div>
                <span className="text-sm font-medium">Lodge:</span>
                <p className="text-sm text-gray-600">{attendee.lodgeNameNumber}</p>
              </div>
            )}
            
            {attendee.dietaryRequirements && (
              <div>
                <span className="text-sm font-medium">Dietary Requirements:</span>
                <p className="text-sm text-gray-600">{attendee.dietaryRequirements}</p>
              </div>
            )}
            
            {attendee.specialNeeds && (
              <div>
                <span className="text-sm font-medium">Special Needs:</span>
                <p className="text-sm text-gray-600">{attendee.specialNeeds}</p>
              </div>
            )}
          </div>

          {/* Tickets column */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700">Selected Tickets</h4>
            
            <div className="space-y-2">
              {tickets.map((ticket) => (
                <div 
                  key={ticket.id} 
                  className="flex justify-between items-start p-2 bg-gray-50 rounded"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{ticket.name}</p>
                    {ticket.description && (
                      <p className="text-xs text-gray-600">{ticket.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">${ticket.price}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveTicket(ticket.id, attendee.attendeeId, ticket.isPackage)}
                      className="h-7 w-7 text-gray-500 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t flex justify-between items-center">
              <span className="font-medium">Subtotal:</span>
              <span className="font-bold text-masonic-navy">
                ${attendeeTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

## Mobile-First Responsive Behavior

### Touch Target Improvements
```css
/* Ensure proper touch targets */
.action-button {
  min-height: 44px;
  min-width: 44px;
  padding: 8px 16px;
}

/* Mobile spacing adjustments */
@media (max-width: 768px) {
  .card-content {
    padding: 12px;
  }
  
  .section-gap {
    gap: 16px;
  }
}
```

### Breakpoint Strategy
- **Mobile (< 768px)**: Single column, stacked layout
- **Tablet (768px - 1024px)**: Two-column for card content
- **Desktop (≥ 1024px)**: Full two-column with sticky sidebar

## Visual Mockups

### Mobile View
```
┌─────────────────────────────────────────┐
│ Review Your Order                       │
│ ─────────────────                      │
│ Please review your registration details │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Mr John Smith                           │
│ [Mason] [Primary Attendee]              │
│                                         │
│ [Edit] [Remove]                         │
├─────────────────────────────────────────┤
│ Attendee Details                        │
│ Lodge: Example Lodge No. 123            │
│ Dietary: Vegetarian                     │
│                                         │
│ Selected Tickets                        │
│ ┌───────────────────────────────────┐   │
│ │ Ceremony               $100    [×] │   │
│ │ Installation ceremony              │   │
│ └───────────────────────────────────┘   │
│ ┌───────────────────────────────────┐   │
│ │ Formal Dinner          $150    [×] │   │
│ │ Post-ceremony dinner               │   │
│ └───────────────────────────────────┘   │
│                                         │
│ Subtotal: $250                          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Order Summary                           │
│ 2 Attendees • 3 Tickets                │
│ Total: $450                             │
└─────────────────────────────────────────┘

[Back]                  [Payment]
```

### Desktop View
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Review Your Order                                                       │
│ ─────────────────                                                      │
│ Please review your registration details before proceeding to payment    │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────┬────────────────────────────────┐
│ ┌──────────────────────────────────┐  │ ┌──────────────────────────┐   │
│ │ Mr John Smith        [Edit][Remove]│ │ │ Order Summary            │   │
│ │ [Mason] [Primary Attendee]        │ │ │                          │   │
│ ├──────────────────────────────────┤ │ │ Attendees         2      │   │
│ │ Details          │ Tickets        │ │ │ Tickets           3      │   │
│ │ Lodge: ABC 123   │ Ceremony  $100 │ │ │ ─────────────────────   │   │
│ │ Dietary: Vegan   │ Dinner    $150 │ │ │ Total           $450     │   │
│ │                  │ ────────────── │ │ │                          │   │
│ │                  │ Subtotal  $250 │ │ │ [Proceed to Payment]     │   │
│ └──────────────────────────────────┘ │ │                          │   │
│                                      │ │ [Back to Tickets]        │   │
│ ┌──────────────────────────────────┐ │ └──────────────────────────┘   │
│ │ Mrs Jane Smith         [Edit]     │ │                                │
│ │ [Guest]                          │ │                                │
│ ├──────────────────────────────────┤ │                                │
│ │ Details & Tickets...              │ │                                │
│ └──────────────────────────────────┘ │                                │
└────────────────────────────────────────┴────────────────────────────────┘
```

## Implementation Benefits

1. **Desktop Efficiency**: Makes better use of wide screens with two-column layout
2. **Persistent Summary**: Order total always visible on desktop
3. **Better Organization**: Clear separation between details and tickets
4. **Improved Touch Targets**: All buttons meet 44px minimum on mobile
5. **Responsive Design**: Adapts seamlessly between devices
6. **Visual Hierarchy**: Clear sections and better information grouping

## Migration Path

1. Implement grid-based layout structure
2. Create responsive AttendeeReviewCard with internal grid
3. Add sticky sidebar for desktop
4. Enhance touch targets for mobile
5. Test responsive behavior across devices
6. Validate accessibility compliance