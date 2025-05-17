# Attendee Card Two-Column Layout Implementation

## Current Layout Problems

The current `AttendeeCard` component has several layout issues on mobile:

### 1. Cramped Information Display
```tsx
// Current implementation - Everything is horizontally aligned
<div className="flex items-start">
  <div className="mr-3">{getAttendeeIcon()}</div>
  <div>
    <div className="flex items-center gap-2">
      <h3 className="font-medium">
        {getAttendeeTitle()} {attendee.firstName} {attendee.lastName}
      </h3>
      <Badge variant="outline" className="text-xs">
        {getAttendeeTypeLabel()}
      </Badge>
    </div>
    {/* Lodge info cramped below */}
  </div>
</div>
```

### 2. Small Touch Target for Remove Button
- Remove button is absolutely positioned in top-right
- Small target area for mobile users
- Competes with content for space

### 3. Partner Information Placement
- Partner info is appended at bottom
- Creates unbalanced layout
- No clear visual hierarchy

## New Two-Column Responsive Implementation

### Desktop/Tablet Layout (sm and up)
```tsx
export function AttendeeCard({ attendee, onRemove }: AttendeeCardProps) {
  return (
    <Card className="border-masonic-lightgold">
      <CardContent className="p-4 sm:p-6">
        {/* Two-column grid on larger screens */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
          
          {/* Main Content Column */}
          <div className="space-y-3">
            {/* Header with icon and name */}
            <div className="flex items-center gap-3">
              {getAttendeeIcon()}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-lg">
                    {getAttendeeTitle()} {attendee.firstName} {attendee.lastName}
                  </h3>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {getAttendeeTypeLabel()}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Additional info */}
            {attendee.type === "mason" && (
              <p className="text-sm text-gray-600 pl-8">
                {attendee.lodgeName}
                {attendee.lodgeNumber && ` No. ${attendee.lodgeNumber}`}
              </p>
            )}
            
            {attendee.type === "partner" && (
              <p className="text-sm text-gray-600 pl-8">
                {attendee.relationship}
              </p>
            )}
            
            {/* Partner info if applicable */}
            {attendee.type !== "partner" && attendee.hasPartner && attendee.partner && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-masonic-navy" />
                  <p className="text-sm">
                    <span className="font-medium">Partner:</span> {attendee.partner.title}{" "}
                    {attendee.partner.firstName} {attendee.partner.lastName}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Actions Column */}
          <div className="flex sm:flex-col justify-end items-end sm:items-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-red-600 px-4 py-2"
              onClick={() => onRemove(attendee.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### Mobile Layout Implementation

```tsx
// Mobile-specific adjustments
<div className="space-y-4">
  {/* Stacked layout on mobile */}
  <div className="flex flex-col gap-4">
    
    {/* Header section */}
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3 flex-1">
        {getAttendeeIcon()}
        <div className="flex-1">
          <h3 className="font-medium text-base">
            {getAttendeeTitle()} {attendee.firstName} {attendee.lastName}
          </h3>
          <Badge variant="outline" className="text-xs mt-1">
            {getAttendeeTypeLabel()}
          </Badge>
        </div>
      </div>
      
      {/* Mobile remove button - better touch target */}
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 text-gray-500 hover:text-red-600 rounded-full"
        onClick={() => onRemove(attendee.id)}
      >
        <Trash2 className="h-5 w-5" />
      </Button>
    </div>
    
    {/* Details section */}
    <div className="pl-8 space-y-2">
      {attendee.type === "mason" && (
        <p className="text-sm text-gray-600">
          {attendee.lodgeName}
          {attendee.lodgeNumber && ` No. ${attendee.lodgeNumber}`}
        </p>
      )}
    </div>
  </div>
</div>
```

## Mobile-First Responsive Behavior

### Touch Target Improvements
```css
/* Ensure minimum 44px touch targets */
.touch-button {
  min-height: 44px;
  min-width: 44px;
  padding: 12px;
}

/* Increase spacing on mobile */
@media (max-width: 640px) {
  .card-spacing {
    padding: 16px;
    gap: 16px;
  }
}
```

### Breakpoint Strategy
- **Mobile (< 640px)**: Single column, stacked elements
- **Tablet (≥ 640px)**: Two-column layout begins
- **Desktop (≥ 1024px)**: Optimized spacing and sizing

## Visual Mockup

### Mobile View
```
┌─────────────────────────────────────────┐
│ [🔷] Mason John Smith            [ 🗑 ] │
│      [Mason]                           │
│                                        │
│      Lodge Name No. 123                │
│                                        │
│ ┌───────────────────────────────────┐  │
│ │ 👥 Partner: Mrs Jane Smith       │  │
│ └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Desktop View
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  [🔷] Mason John Smith [Mason]            [Remove]   │
│       Lodge Name No. 123                             │
│                                                      │
│  ┌────────────────────────────────────┐              │
│  │ 👥 Partner: Mrs Jane Smith         │              │
│  └────────────────────────────────────┘              │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## Implementation Benefits

1. **Better Touch Targets**: Remove button is now a proper icon button with 44px minimum size
2. **Improved Hierarchy**: Clear separation between primary and secondary information
3. **Responsive Layout**: Adapts gracefully from mobile to desktop
4. **Partner Info**: Better visual treatment as a sub-card
5. **Accessibility**: Proper spacing and touch areas for all interactive elements

## Migration Path

1. Update the component structure to use responsive grid
2. Replace absolute positioning with flexbox/grid
3. Enhance touch targets for mobile
4. Test across device sizes
5. Ensure accessibility compliance
