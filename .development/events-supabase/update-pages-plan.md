# Plan: Update Remaining Pages to Use Supabase Events

## Overview
This plan details the steps needed to update all remaining pages from using hard-coded events to fetching events from Supabase through the event facade.

## Current Status
✅ **Already Updated**: 
- `/app/page.tsx` (homepage)
- `/app/test-events/page.tsx` (test page)
- `/app/events/[id]/page.tsx` (event detail)

🔄 **Needs Update**:
1. `/app/events/[id]/tickets/page.tsx`
2. `/app/events/[id]/confirmation/page.tsx`
3. `/app/events/[id]/tickets/components/order-summary.tsx`
4. `/app/events/[id]/tickets/components/ticket-selection.tsx`
5. `/app/organizer/dashboard/page.tsx`
6. `/app/events/grand-installation/page.tsx`
7. `/app/events/grand-installation/register/page.tsx`
8. `/app/events/grand-installation/tickets/page.tsx`
9. `/app/events/grand-installation/confirmation/page.tsx`

## Update Strategy

### Phase 1: Core Event Pages
Update pages that directly display event data.

#### 1. Update Ticket Pages
- `/app/events/[id]/tickets/page.tsx`
- Replace direct `event-utils` imports with `event-facade`
- Convert to async server component if needed
- Update event fetching to use `getEventById`

#### 2. Update Confirmation Pages
- `/app/events/[id]/confirmation/page.tsx`
- Replace direct `event-utils` imports with `event-facade`
- Ensure order data properly references database events

#### 3. Update Ticket Components
- `/app/events/[id]/tickets/components/order-summary.tsx`
- `/app/events/[id]/tickets/components/ticket-selection.tsx`
- Move from direct imports to prop passing
- Parent components fetch events and pass down

### Phase 2: Special Event Pages
Handle legacy event pages that might have hard-coded references.

#### 1. Grand Installation Pages
- `/app/events/grand-installation/page.tsx`
- `/app/events/grand-installation/register/page.tsx`
- `/app/events/grand-installation/tickets/page.tsx`
- `/app/events/grand-installation/confirmation/page.tsx`
- Update to fetch event by slug 'grand-installation-2025' or redirect to `/events/[id]`

### Phase 3: Admin/Dashboard Pages
Update pages that list or manage events.

#### 1. Organizer Dashboard
- `/app/organizer/dashboard/page.tsx`
- Update to fetch events via facade
- Add proper error handling for database failures

### Phase 4: Shared Components
Update any shared components that directly import event data.

#### 1. Event Card Component
- Check `/components/event-card.tsx`
- Ensure it receives events as props rather than importing directly

#### 2. Featured Event Component
- Check `/components/featured-event.tsx`
- Update to receive event data as props

## Implementation Tasks

### Task 1: Update Ticket Pages
```typescript
// Before
import { getEventByIdOrSlug } from '@/lib/event-utils'

// After
import { getEventById } from '@/lib/event-facade'

// Convert to async if needed
export default async function TicketsPage({ params }: { params: { id: string } }) {
  const event = await getEventById(params.id)
  //...
}
```

### Task 2: Update Components
```typescript
// Component should receive event as prop
interface OrderSummaryProps {
  event: Event
  // ... other props
}

// Parent component fetches event
const event = await getEventById(params.id)
<OrderSummary event={event} />
```

### Task 3: Handle Special Routes
For grand-installation pages, either:
1. Redirect to UUID-based route
2. Fetch by slug using facade

### Task 4: Add Error Boundaries
Wrap database calls with try-catch to handle failures:
```typescript
try {
  const event = await getEventById(id)
  if (!event) notFound()
  return event
} catch (error) {
  console.error('Failed to fetch event:', error)
  // Optionally redirect or show error
}
```

## Testing Plan

1. **Unit Testing**
   - Test facade with flag on/off
   - Verify fallback behavior

2. **Integration Testing**
   - Test each updated page
   - Verify data loads correctly
   - Check error handling

3. **E2E Testing**
   - Full user flows through ticket purchase
   - Admin dashboard functionality
   - Special event page navigation

## Rollout Strategy

1. **Phase 1**: Update one page at a time with feature flag off
2. **Phase 2**: Enable flag and test thoroughly
3. **Phase 3**: Deploy to staging for UAT
4. **Phase 4**: Production deployment with monitoring
5. **Phase 5**: Remove hard-coded data once stable

## Success Criteria

- [ ] All pages load events from Supabase when flag is enabled
- [ ] Graceful fallback to hard-coded data on errors
- [ ] No breaking changes to user experience
- [ ] Performance remains acceptable
- [ ] Admin can manage events via dashboard

## Final Cleanup

Once all pages are updated and stable:
1. Remove `getEvents()` from `event-utils.ts`
2. Remove hard-coded event data
3. Remove feature flag
4. Update documentation

## Timeline

- Phase 1: 2-3 hours
- Phase 2: 1-2 hours
- Phase 3: 1 hour
- Phase 4: 1 hour
- Testing: 2-3 hours
- Total: ~8-10 hours

This plan ensures a safe, gradual migration from hard-coded events to database-driven events across the entire application.