# Checklist: Update Pages to Use Supabase Events

## Quick Reference Commands
```bash
# Test the changes
npm run dev

# Verify events are loading
open http://localhost:3000/test-events
```

## Pages to Update

### Priority 1: Dynamic Event Pages
- [ ] `/app/events/[id]/tickets/page.tsx`
  - [ ] Import from `event-facade` instead of `event-utils`
  - [ ] Make component async if needed
  - [ ] Update `getEventByIdOrSlug` to `getEventById`
  - [ ] Add error handling

- [ ] `/app/events/[id]/confirmation/page.tsx`
  - [ ] Import from `event-facade` instead of `event-utils`
  - [ ] Make component async if needed
  - [ ] Update event fetching method
  - [ ] Test order confirmation flow

### Priority 2: Event Components
- [ ] `/app/events/[id]/tickets/components/order-summary.tsx`
  - [ ] Remove direct `event-utils` import
  - [ ] Accept event as prop from parent
  - [ ] Update TypeScript interfaces

- [ ] `/app/events/[id]/tickets/components/ticket-selection.tsx`
  - [ ] Remove direct `event-utils` import
  - [ ] Accept event as prop from parent
  - [ ] Update component props

### Priority 3: Static Event Pages
- [ ] `/app/events/grand-installation/page.tsx`
  - [ ] Fetch event by slug 'grand-installation-2025'
  - [ ] Or redirect to `/events/[id]` format
  - [ ] Update imports to use facade

- [ ] `/app/events/grand-installation/register/page.tsx`
  - [ ] Update to fetch from facade
  - [ ] Handle event not found case

- [ ] `/app/events/grand-installation/tickets/page.tsx`
  - [ ] Update to fetch from facade
  - [ ] Ensure ticket flow works

- [ ] `/app/events/grand-installation/confirmation/page.tsx`
  - [ ] Update to fetch from facade
  - [ ] Test confirmation display

### Priority 4: Admin Pages
- [ ] `/app/organizer/dashboard/page.tsx`
  - [ ] Import `getEvents` from facade
  - [ ] Make component async
  - [ ] Add loading state
  - [ ] Handle errors gracefully

## Component Updates

### Update Pattern
```typescript
// OLD - Direct import
import { getEventByIdOrSlug } from '@/lib/event-utils'

// NEW - Facade import
import { getEventById } from '@/lib/event-facade'

// OLD - Sync component
export default function Page({ params }) {
  const event = getEventByIdOrSlug(params.id)
}

// NEW - Async component
export default async function Page({ params }) {
  const event = await getEventById(params.id)
}
```

### Component Props Pattern
```typescript
// OLD - Component imports events
import { getEventByIdOrSlug } from '@/lib/event-utils'
function OrderSummary({ eventId }) {
  const event = getEventByIdOrSlug(eventId)
}

// NEW - Component receives event as prop
interface OrderSummaryProps {
  event: Event
}
function OrderSummary({ event }: OrderSummaryProps) {
  // Use event directly
}
```

## Testing Checklist

### After Each Update
- [ ] Page loads without errors
- [ ] Event data displays correctly
- [ ] Navigation works properly
- [ ] Forms submit successfully

### Full Flow Testing
- [ ] Browse events list
- [ ] View event details
- [ ] Select tickets
- [ ] Complete registration
- [ ] View confirmation
- [ ] Admin dashboard loads

### Error Testing
- [ ] Disable feature flag - should fall back to hard-coded
- [ ] Test with invalid event ID
- [ ] Test with network errors
- [ ] Check console for error messages

## Environment Variables
```bash
# Ensure this is set in .env.local
NEXT_PUBLIC_USE_EVENTS_SCHEMA=true
```

## Common Issues & Solutions

### Issue: "Cannot find module '@/lib/event-facade'"
**Solution**: Check import path is correct

### Issue: "Event is undefined"
**Solution**: Make sure component is async and using await

### Issue: "Type error on event prop"
**Solution**: Import Event type from '@/shared/types/event'

### Issue: "Page not loading"
**Solution**: Check browser console, might need error boundary

## Rollback Plan
If issues occur:
1. Set `NEXT_PUBLIC_USE_EVENTS_SCHEMA=false`
2. Restart dev server
3. Events will use hard-coded data

## Completion Criteria
- [ ] All pages updated to use facade
- [ ] No direct imports of event-utils
- [ ] All tests passing
- [ ] No console errors
- [ ] Feature flag can be toggled without breaking

## Next Steps After Completion
1. Remove hard-coded events from `event-utils.ts`
2. Remove feature flag code
3. Update documentation
4. Deploy to production