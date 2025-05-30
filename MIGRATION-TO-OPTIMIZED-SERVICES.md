# Migration Guide: Optimized API Services

This guide helps you migrate from the old API services to the new optimized services that use database views, RPC functions, and intelligent caching.

## Overview of Changes

1. **View-based queries** - Replace multiple API calls with single view queries
2. **Smart caching** - Automatic caching with appropriate TTLs
3. **Batch operations** - Group similar operations for efficiency
4. **Query optimization** - Select only needed columns
5. **Real-time subscriptions** - Efficient subscription management

## Migration Steps

### 1. Update Import Statements

Replace old imports with optimized versions:

```typescript
// OLD
import { getGrandInstallationEvent } from '@/lib/services/homepage-service';
import { getEventByIdOrSlug } from '@/lib/services/event-service';
import { getAllGrandLodges } from '@/lib/api/grandLodges';
import { getLodgesByGrandLodgeId } from '@/lib/api/lodges';

// NEW
import { 
  homepageService,
  eventService,
  staticDataService,
  getAllGrandLodges,
  getLodgesByGrandLodgeId
} from '@/lib/services/index-optimized';
```

### 2. Homepage Optimization

```typescript
// OLD - Multiple queries
const mainEvent = await getGrandInstallationEvent();
const timeline = await getEventTimeline();
const featured = await getFeaturedEvents();

// NEW - Use optimized service with caching
const mainEvent = await homepageService.getGrandInstallationEvent();
const timeline = await homepageService.getEventTimeline();
const featured = await homepageService.getFeaturedEvents();

// Or prefetch all at once
await prefetchStrategies.homepage();
```

### 3. Event Details Page

```typescript
// OLD - Multiple queries
const event = await getEventByIdOrSlug(slug);
const tickets = await getEventTickets(event.id);

// NEW - Single optimized query
const event = await eventService.getEventByIdOrSlug(slug);
// Tickets are already included in event.tickets
```

### 4. Registration Flow

```typescript
// OLD - Multiple queries throughout the flow
const grandLodges = await getAllGrandLodges();
const lodges = await getLodgesByGrandLodgeId(grandLodgeId);
const titles = TITLES;

// NEW - Prefetch all static data at start
const staticData = await staticDataService.prefetchRegistrationData();
// Data is cached for the entire flow

// Create registration with atomic operation
const result = await registrationService.createRegistration({
  registration: { ... },
  customer: { ... },
  attendees: [ ... ],
  tickets: [ ... ]
});
```

### 5. Batch Operations

```typescript
// OLD - Multiple individual inserts
for (const attendee of attendees) {
  await createAttendee(attendee);
}

// NEW - Single batch operation
const created = await batchOperations.batchInsertAttendees(attendees);
```

### 6. Static Data with Caching

```typescript
// OLD - Fetched every time
const grandLodges = await getAllGrandLodges();
const lodges = await getLodgesByGrandLodgeId(id);

// NEW - Automatically cached
const grandLodges = await staticDataService.getGrandLodges(); // Cached forever
const lodges = await staticDataService.getLodges(id); // Cached 5 min
```

### 7. Real-time Subscriptions

```typescript
// OLD - Manual subscription management
const subscription = supabase
  .from('tickets')
  .on('*', callback)
  .subscribe();

// NEW - Managed subscriptions
const sub = subscriptionManager.subscribeToTickets(eventId, callback);
// Cleanup is handled automatically
```

### 8. Query Optimization

```typescript
// OLD - Fetching all columns
const { data } = await supabase
  .from('events')
  .select('*');

// NEW - Only needed columns via views
const events = await eventService.getPublishedEvents();
// Uses event_display_view with optimized columns
```

## Component-Specific Migrations

### Featured Events Component

```typescript
// components/featured-events-optimized.tsx
import { homepageService } from '@/lib/services/index-optimized';

export async function FeaturedEventsOptimized() {
  // Single optimized query instead of multiple
  const events = await homepageService.getFeaturedEvents();
  
  return <EventGrid events={events} />;
}
```

### Registration Wizard

```typescript
// components/register/registration-wizard.tsx
import { 
  staticDataService,
  registrationService,
  prefetchStrategies 
} from '@/lib/services/index-optimized';

// On wizard mount
useEffect(() => {
  prefetchStrategies.registration(eventId);
}, [eventId]);
```

### Lodge Selection Form

```typescript
// components/register/Forms/attendee/LodgesForm.tsx
import { staticDataService } from '@/lib/services/index-optimized';

// Lodges are cached for 5 minutes
const lodges = await staticDataService.getLodges(grandLodgeId);

// Search doesn't use cache for real-time results
const searchResults = await staticDataService.searchLodges(term, grandLodgeId);
```

## Performance Monitoring

Add performance monitoring to track improvements:

```typescript
import { performanceMonitor } from '@/lib/services/index-optimized';

// Check cache stats
const stats = performanceMonitor.getCacheStats();
console.log(`Cache hit rate: ${stats.hitRate}%`);

// Monitor slow operations
const start = Date.now();
const data = await someOperation();
performanceMonitor.logApiCall('someOperation', start);
```

## Cache Management

```typescript
import { cacheManager } from '@/lib/services/index-optimized';

// Clear specific cache entries
cacheManager.clear(CacheKeys.eventDetail(eventId));

// Clear by pattern
cacheManager.invalidatePattern(/^events:/);

// Clear all (use sparingly)
performanceMonitor.clearAllCaches();
```

## Testing After Migration

1. **Verify data consistency** - Ensure migrated components show same data
2. **Check performance** - Measure page load improvements
3. **Test caching** - Verify cached data is fresh enough
4. **Monitor API calls** - Confirm reduction in database queries
5. **Test real-time updates** - Ensure subscriptions work correctly

## Rollback Plan

If issues arise, you can temporarily use both services:

```typescript
// Use feature flag or environment variable
const useOptimized = process.env.NEXT_PUBLIC_USE_OPTIMIZED_API === 'true';

const eventData = useOptimized 
  ? await eventService.getEventByIdOrSlug(slug)
  : await oldEventService.getEventByIdOrSlug(slug);
```

## Next Steps

1. Start with low-traffic pages (about, help)
2. Move to homepage and event listings
3. Migrate registration flow last (most complex)
4. Monitor performance metrics
5. Remove old services once stable