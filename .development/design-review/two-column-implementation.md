# Two-Column Layout Implementation Guide

## Current Layout Issues

### 1. Attendee Cards (AttendeeCard)
- Currently uses full width on mobile with small text
- Long lines of text are hard to read
- Limited space for buttons and metadata
- Poor information hierarchy on small screens

### 2. Ticket Selection Cards (AttendeeTicketCard)
- Cramped collapsed view with poor text alignment
- Table layouts don't scale well on mobile
- Expanded view is overwhelming with full-width content
- Price information gets lost in the layout

### 3. Order Review Cards (AttendeeReviewCard)
- Horizontal space constraints for edit/remove buttons
- Mixed alignment of content and actions
- Poor use of vertical space on mobile
- Ticket lists extend too far horizontally

## Two-Column Responsive Grid System

### Core Principles

1. **Mobile-First Design**
   - Start with 2 columns on mobile (>=320px)
   - Expand to 3-4 columns on tablets and desktops
   - Use CSS Grid for robust layout control

2. **Touch-Friendly Spacing**
   - Minimum 44px touch targets
   - 16px gaps between columns on mobile
   - 24px gaps on larger screens

3. **Visual Hierarchy**
   - Left column for primary information
   - Right column for actions/metadata
   - Clear vertical separation between sections

4. **Consistent Breakpoints**
   ```css
   /* Mobile: 2 columns */
   @media (min-width: 320px)
   
   /* Tablet: 3 columns */
   @media (min-width: 768px)
   
   /* Desktop: 4 columns or flexible */
   @media (min-width: 1024px)
   ```

## Implementation Examples

### 1. Attendee Card - Two Column Layout

```tsx
// AttendeeCardView.tsx - Updated with two-column layout
export function AttendeeCardView(props: AttendeeCardViewProps) {
  return (
    <Card className="border-masonic-lightgold">
      <CardContent className="p-4">
        {/* Mobile: 2-column grid, Desktop: flexible */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-12">
          
          {/* Left Column: Primary Info */}
          <div className="col-span-1 md:col-span-8">
            <div className="space-y-2">
              {/* Name & Type */}
              <div className="flex items-start gap-2">
                <Icon className={iconClassName} />
                <div className="flex-1">
                  <h3 className="font-medium text-sm md:text-base leading-tight">
                    {title} {firstName} {lastName}
                  </h3>
                  <Badge variant="outline" className="text-xs mt-1">
                    {label}
                  </Badge>
                </div>
              </div>
              
              {/* Lodge/Relationship Info */}
              {showLodgeInfo && (
                <p className="text-xs md:text-sm text-gray-600 ml-7">
                  {attendee.lodgeName}
                  {attendee.lodgeNumber && ` No. ${attendee.lodgeNumber}`}
                </p>
              )}
            </div>
          </div>
          
          {/* Right Column: Actions */}
          <div className="col-span-1 md:col-span-4 flex items-start justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 p-2"
              onClick={() => onRemove(attendee.id)}
            >
              <Trash2 className="h-4 w-4" />
              <span className="ml-1 hidden md:inline">Remove</span>
            </Button>
          </div>
        </div>
        
        {/* Partner Info - Full Width */}
        {showPartnerSection && attendee.partner && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-masonic-navy" />
                <p className="text-sm">
                  <span className="font-medium">Partner:</span>
                  {' '}{attendee.partner.title} {attendee.partner.firstName} {attendee.partner.lastName}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

### 2. Ticket Selection Card - Two Column Layout

```tsx
// AttendeeTicketCard.tsx - Updated collapsed view with two columns
export function AttendeeTicketCard(props: AttendeeTicketCardProps) {
  return (
    <Card className="border-masonic-navy overflow-hidden">
      <CardHeader 
        className="bg-masonic-lightblue py-3 px-4 cursor-pointer"
        onClick={onToggleExpand}
      >
        {/* 2-column header layout */}
        <div className="grid grid-cols-2 gap-4 items-center">
          {/* Left: Name & Type */}
          <div className="col-span-1">
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-masonic-navy flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">
                  {renderAttendeeName(attendee)}
                </p>
                <Badge variant="outline" className="text-xs mt-1">
                  {getAttendeeType(attendee)}
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Right: Status & Chevron */}
          <div className="col-span-1 flex items-center justify-end gap-2">
            <span className="text-xs text-gray-600">
              {attendeeTickets.length} tickets
            </span>
            <ChevronIcon className={isExpanded ? "" : "rotate-180"} />
          </div>
        </div>
      </CardHeader>
      
      {/* Collapsed ticket view - 2 column */}
      {!isExpanded && attendeeTickets.length > 0 && (
        <CardContent className="p-3 cursor-pointer" onClick={onToggleExpand}>
          <div className="space-y-2">
            {attendeeTickets.map((ticket) => (
              <div key={ticket.id} className="grid grid-cols-2 gap-2 text-xs">
                <div className="col-span-1">
                  <p className="font-medium">{ticket.name}</p>
                  <p className="text-gray-600 truncate">{ticket.description}</p>
                </div>
                <div className="col-span-1 text-right font-medium">
                  ${ticket.price}
                </div>
              </div>
            ))}
            
            {/* Total row */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              <div className="col-span-1 font-bold text-sm">TOTAL</div>
              <div className="col-span-1 text-right font-bold text-sm">
                ${attendeeTotal}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
```

### 3. Order Review Card - Two Column Layout

```tsx
// AttendeeReviewCard.tsx - Updated with two-column mobile layout
export function AttendeeReviewCard(props: AttendeeReviewCardProps) {
  return (
    <Card className="border-masonic-lightgold overflow-hidden">
      <CardHeader className="bg-masonic-lightgold/10 p-4">
        <div className="grid grid-cols-2 gap-4 md:flex md:items-center md:justify-between">
          {/* Left: Attendee Info */}
          <div className="col-span-2 md:col-span-1">
            <CardTitle className="text-base md:text-lg text-masonic-navy">
              {masonicTitle} {attendee.firstName} {attendee.lastName}
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              {attendee.isPrimary ? "Primary Attendee" : "Additional Attendee"}
              <span className="ml-1">({attendeeTypeLabel})</span>
            </CardDescription>
          </div>
          
          {/* Right: Actions - Stacked on mobile */}
          <div className="col-span-2 md:col-span-1 flex gap-2 md:justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onEdit} 
              className="flex-1 md:flex-initial h-9"
            >
              <Edit3 className="mr-1 h-3 w-3" /> Edit
            </Button>
            {!attendee.isPrimary && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={onRemove} 
                className="flex-1 md:flex-initial h-9"
              >
                <Trash2 className="mr-1 h-3 w-3" /> Remove
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {/* Details Section */}
        {(attendee.dietaryRequirements || attendee.specialNeeds) && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {attendee.dietaryRequirements && (
              <div className="col-span-2 md:col-span-1">
                <span className="font-medium">Dietary:</span>
                <p className="text-gray-600">{attendee.dietaryRequirements}</p>
              </div>
            )}
            {attendee.specialNeeds && (
              <div className="col-span-2 md:col-span-1">
                <span className="font-medium">Special Needs:</span>
                <p className="text-gray-600">{attendee.specialNeeds}</p>
              </div>
            )}
          </div>
        )}
        
        <Separator className="my-3" />
        
        {/* Tickets Section */}
        <div>
          <h4 className="font-medium text-masonic-navy mb-2">Tickets</h4>
          <TicketList 
            tickets={tickets} 
            onRemoveTicket={onRemoveTicket}
            className="grid grid-cols-1 gap-2"
          />
        </div>
        
        <Separator className="my-3" />
        
        {/* Subtotal - Right aligned on all screens */}
        <div className="grid grid-cols-2">
          <div className="col-span-1">Attendee Subtotal</div>
          <div className="col-span-1 text-right font-bold text-masonic-navy">
            ${attendeeTotal.toFixed(2)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

## Mobile-First Approach

### Key Strategies

1. **Start with 2 Columns on Mobile**
   - Optimal for 320px-767px screens
   - Prevents horizontal scrolling
   - Improves readability

2. **Progressive Enhancement**
   - Add columns as screen size increases
   - Adjust spacing and typography
   - Show/hide secondary information

3. **Touch Optimization**
   ```css
   /* Minimum touch target sizes */
   .touch-target {
     min-height: 44px;
     min-width: 44px;
   }
   
   /* Increased padding for mobile */
   .mobile-padding {
     padding: 16px;
   }
   ```

## Touch-Friendly Considerations

### 1. Button Sizing and Spacing
```tsx
// Touch-friendly button component
<Button
  className="min-h-[44px] px-4 py-2 md:min-h-[36px] md:px-3 md:py-1"
  onClick={handleClick}
>
  <Icon className="h-4 w-4 md:h-3 md:w-3" />
  <span className="ml-2">Action</span>
</Button>
```

### 2. Click Areas
- Entire card headers should be clickable
- Clear visual feedback on touch
- Adequate spacing between interactive elements

### 3. Gesture Support
- Swipe to expand/collapse (optional)
- Tap anywhere to interact
- Long press for additional actions

## Visual Hierarchy and Spacing

### 1. Typography Scale
```css
/* Mobile-first typography */
.heading-primary {
  font-size: 1rem;     /* 16px on mobile */
  line-height: 1.25;
}

@media (min-width: 768px) {
  .heading-primary {
    font-size: 1.125rem; /* 18px on tablet+ */
  }
}
```

### 2. Spacing System
```css
/* Consistent spacing scale */
:root {
  --space-xs: 0.25rem;  /* 4px */
  --space-sm: 0.5rem;   /* 8px */
  --space-md: 1rem;     /* 16px */
  --space-lg: 1.5rem;   /* 24px */
  --space-xl: 2rem;     /* 32px */
}
```

### 3. Color Contrast
- Maintain WCAG AA compliance
- Clear visual separation between sections
- Consistent use of brand colors

## Code Examples for Each Step

### Step 1: Update Core Components

1. Create a shared two-column grid component:

```tsx
// components/register/core/TwoColumnGrid.tsx
import { cn } from '@/lib/utils'

interface TwoColumnGridProps {
  children: React.ReactNode
  className?: string
  mobileColumns?: 1 | 2
  tabletColumns?: 2 | 3 | 4
  desktopColumns?: 2 | 3 | 4 | 6
}

export function TwoColumnGrid({
  children,
  className,
  mobileColumns = 2,
  tabletColumns = 3,
  desktopColumns = 4
}: TwoColumnGridProps) {
  return (
    <div className={cn(
      `grid gap-4`,
      `grid-cols-${mobileColumns}`,
      `md:grid-cols-${tabletColumns}`,
      `lg:grid-cols-${desktopColumns}`,
      className
    )}>
      {children}
    </div>
  )
}
```

### Step 2: Implement in Components

```tsx
// Updated AttendeeCardContainer.tsx
export function AttendeeCardContainer({ attendees, onRemove }: Props) {
  return (
    <TwoColumnGrid mobileColumns={1} tabletColumns={2} desktopColumns={3}>
      {attendees.map((attendee) => (
        <AttendeeCardView key={attendee.id} {...props} />
      ))}
    </TwoColumnGrid>
  )
}
```

### Step 3: Update Touch Targets

```tsx
// components/register/core/TouchButton.tsx
import { Button, ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function TouchButton({ 
  className, 
  size = 'default',
  ...props 
}: ButtonProps) {
  return (
    <Button
      size={size}
      className={cn(
        'min-h-[44px] px-4',
        'md:min-h-[36px] md:px-3',
        className
      )}
      {...props}
    />
  )
}
```

## Testing Considerations

### 1. Device Testing
- Test on real devices (iPhone SE, iPhone 15, Android)
- Use browser DevTools mobile emulation
- Test with different text sizes

### 2. Accessibility Testing
- Keyboard navigation
- Screen reader compatibility
- Touch target size verification

### 3. Performance Testing
- Minimize layout shifts
- Optimize render performance
- Test with slower network speeds

## Migration Plan

### Phase 1: Core Components
1. Update AttendeeCard with two-column layout
2. Test thoroughly on mobile devices
3. Gather user feedback

### Phase 2: Ticket Selection
1. Update AttendeeTicketCard collapsed view
2. Improve touch targets for expand/collapse
3. Optimize ticket list display

### Phase 3: Order Review
1. Update AttendeeReviewCard layout
2. Improve button placement and sizing
3. Optimize for one-handed use

### Phase 4: Finalization
1. Cross-browser testing
2. Performance optimization
3. Documentation updates

## Conclusion

Implementing two-column layouts will significantly improve the mobile experience by:
- Better utilizing available screen space
- Improving readability and scanability
- Creating consistent touch targets
- Maintaining visual hierarchy
- Supporting one-handed operation

The mobile-first approach ensures that the most constrained environment gets the best experience, with progressive enhancement for larger screens.