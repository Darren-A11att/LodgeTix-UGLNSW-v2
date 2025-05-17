# Ticket Selection Two-Column Layout Implementation

## Current Layout Problems

The current `TicketSelectionView` and `AttendeeTicketCard` components have several issues:

### 1. Table-Based Layout in Headers
```tsx
// Current implementation uses tables for alignment
<table className="w-full">
  <tbody>
    <tr className="align-middle">
      <td className="w-[80%]">
        <CardTitle className="text-lg">{renderAttendeeHeader(attendee)}</CardTitle>
      </td>
      <td className="w-[10%]">
        <Badge variant="outline">{/* ... */}</Badge>
      </td>
      <td className="w-[10%] pr-2">
        {/* Chevron icon */}
      </td>
    </tr>
  </tbody>
</table>
```

### 2. Poor Mobile Experience
- Table columns don't scale well on mobile
- Fixed percentage widths cause content overflow
- Small touch targets for expand/collapse
- Ticket information cramped in collapsed state

### 3. Inefficient Space Usage
- Single column layout wastes desktop space
- Order total card takes full width when it could be a sidebar
- No visual hierarchy between sections

## New Two-Column Responsive Implementation

### Overall Layout Structure
```tsx
export function TicketSelectionView({ /* props */ }) {
  return (
    <div className="space-y-6">
      <SectionHeader>
        <h1 className="text-2xl font-bold text-masonic-navy">Select Tickets</h1>
        <div className="masonic-divider"></div>
        <p className="text-gray-600">Please select tickets for each attendee</p>
      </SectionHeader>

      {/* Two-column layout for desktop, single column for mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Main content column */}
        <div className="space-y-4">
          {eligibleAttendees.map((attendee) => (
            <AttendeeTicketCard key={attendee.attendeeId} /* props */ />
          ))}
        </div>

        {/* Sidebar column - Order summary */}
        <div className="lg:sticky lg:top-4 lg:h-fit">
          <OrderTotalCard
            ticketCount={currentTickets.length}
            attendeeCount={eligibleAttendees.length}
            totalAmount={orderTotalAmount}
          />
          
          {/* Action buttons for desktop */}
          <div className="hidden lg:flex flex-col gap-3 mt-6">
            <Button
              onClick={handleContinue}
              disabled={!ensureAllAttendeesHaveTickets() || currentTickets.length === 0}
              className="w-full bg-masonic-navy hover:bg-masonic-blue"
            >
              Review Order
            </Button>
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="w-full border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
            >
              Previous
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile action buttons */}
      <div className="flex lg:hidden justify-between gap-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          className="flex-1 border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
        >
          Previous
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!ensureAllAttendeesHaveTickets() || currentTickets.length === 0}
          className="flex-1 bg-masonic-navy hover:bg-masonic-blue"
        >
          Review Order
        </Button>
      </div>
    </div>
  )
}
```

### Improved AttendeeTicketCard
```tsx
export function AttendeeTicketCard({ /* props */ }) {
  return (
    <Card className="border-masonic-navy overflow-hidden">
      <CardHeader 
        className={`bg-masonic-lightblue py-3 px-4 cursor-pointer ${
          isExpanded ? "" : "hover:bg-masonic-lightblue/90"
        }`}
        onClick={onToggleExpand}
      >
        {/* Responsive flexbox instead of table */}
        <div className="flex items-center gap-3">
          {/* Main content */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h3 className="text-lg font-medium flex items-center gap-2">
                {renderAttendeeIcon()}
                <span>
                  {attendee.title} {attendee.firstName} {attendee.lastName}
                </span>
              </h3>
              <Badge variant="outline" className="self-start sm:self-center bg-white">
                {getAttendeeType()}
              </Badge>
            </div>
            {attendee.rank && (
              <p className="text-sm text-gray-600 mt-1">{attendee.rank}</p>
            )}
          </div>

          {/* Expand/Collapse button with better touch target */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full shrink-0"
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand()
            }}
          >
            <ChevronDown 
              className={`h-5 w-5 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isExpanded ? (
          <div className="p-4 space-y-6">
            {/* Package selection */}
            <div className="space-y-3">
              <h4 className="font-medium text-masonic-navy">Ticket Packages</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Package cards with better mobile layout */}
              </div>
            </div>

            {/* Individual ticket selection */}
            <div className="space-y-3">
              <h4 className="font-medium text-masonic-navy">Individual Tickets</h4>
              <div className="space-y-2">
                {/* Improved ticket items */}
              </div>
            </div>

            {/* Selected tickets summary */}
            <SelectedTicketsSummary
              attendeeId={attendee.attendeeId}
              tickets={attendeeTickets}
              total={attendeeTotal}
              removeTicket={removeTicket}
            />
          </div>
        ) : (
          /* Collapsed view with better mobile layout */
          <div className="px-4 py-3 border-t" onClick={onToggleExpand}>
            {attendeeTickets.length === 0 ? (
              <p className="text-gray-500 italic text-sm">
                Click to expand and add tickets
              </p>
            ) : (
              <div className="space-y-2">
                {attendeeTickets.map((ticket) => (
                  <div key={ticket.id} className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{ticket.name}</p>
                      <p className="text-xs text-gray-600">{ticket.description}</p>
                    </div>
                    <span className="text-sm font-medium shrink-0">
                      ${ticket.price}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-bold">TOTAL</span>
                  <span className="font-bold">${attendeeTotal}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

## Mobile-First Responsive Behavior

### Touch Target Enhancements
```css
/* Minimum touch targets */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}

/* Improved spacing for mobile */
@media (max-width: 640px) {
  .card-padding {
    padding: 16px;
  }
  
  .section-spacing {
    gap: 24px;
  }
}
```

### Breakpoint Strategy
- **Mobile (< 640px)**: Single column, optimized touch
- **Tablet (640px - 1024px)**: Better spacing, some two-column elements
- **Desktop (≥ 1024px)**: Full two-column with sticky sidebar

## Visual Mockups

### Mobile View
```
┌─────────────────────────────────────────┐
│ Select Tickets                          │
│ ─────────────                          │
│ Please select tickets for each attendee │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 👤 Mr John Smith     [Mason]       [▼] │
│    Past Master                          │
├─────────────────────────────────────────┤
│ Click to expand and add tickets         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 👤 Mrs Jane Smith    [Guest]       [▲] │
├─────────────────────────────────────────┤
│ Ticket Packages                         │
│ ┌───────────────┐ ┌───────────────┐    │
│ │ Full Package  │ │ Dinner Only   │    │
│ │ $250          │ │ $150          │    │
│ └───────────────┘ └───────────────┘    │
│                                         │
│ Individual Tickets                      │
│ ☐ Grand Installation - $100             │
│ ☑ Formal Dinner - $150                  │
│                                         │
│ Selected: 1 ticket                $150  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Order Summary                           │
│ 2 Attendees • 3 Tickets                │
│ Total: $450                             │
└─────────────────────────────────────────┘

[Previous]              [Review Order]
```

### Desktop View
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Select Tickets                                                          │
│ ─────────────                                                          │
│ Please select tickets for each attendee                                 │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────┬────────────────────────────────┐
│ ┌──────────────────────────────────┐  │ ┌──────────────────────────┐   │
│ │ 👤 Mr John Smith [Mason]     [▼] │  │ │ Order Summary            │   │
│ │    Past Master                    │  │ │ 2 Attendees • 3 Tickets  │   │
│ ├──────────────────────────────────┤  │ │ Total: $450              │   │
│ │ Ceremony - $100                   │  │ └──────────────────────────┘   │
│ │ Dinner - $150                     │  │                                │
│ │ ─────────────                    │  │ [Review Order]                 │
│ │ TOTAL                      $250   │  │                                │
│ └──────────────────────────────────┘  │ [Previous]                     │
│                                        │                                │
│ ┌──────────────────────────────────┐  │                                │
│ │ 👤 Mrs Jane Smith [Guest]     [▲] │  │                                │
│ ├──────────────────────────────────┤  │                                │
│ │ Package & Ticket Selection...     │  │                                │
│ └──────────────────────────────────┘  │                                │
└────────────────────────────────────────┴────────────────────────────────┘
```

## Implementation Benefits

1. **Better Mobile Experience**: No more table layouts, proper responsive design
2. **Improved Touch Targets**: All interactive elements meet 44px minimum
3. **Efficient Desktop Layout**: Sticky sidebar for order summary
4. **Clear Visual Hierarchy**: Better separation of content sections
5. **Flexible Content**: Adapts to different content lengths
6. **Accessibility**: Proper button roles and touch areas

## Migration Path

1. Replace table layouts with flexbox/grid
2. Implement responsive breakpoints
3. Add sticky sidebar for desktop
4. Enhance touch targets
5. Test across all device sizes
6. Ensure keyboard navigation works