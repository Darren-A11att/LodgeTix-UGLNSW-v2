# TODO: Optimize Supabase API Calls

## Overview
Implement efficient data fetching strategies to minimize API calls and improve performance.

## Optimization Strategies

### 1. Replace Multiple Calls with Views
- [ ] Homepage: Use event_display_view instead of separate event + tickets calls
- [ ] Event Detail: Single RPC call instead of event + tickets + packages
- [ ] Registration List: Use registration_detail_view
- [ ] Replace nested loops with joined queries

### 2. Implement Smart Caching
**Static Data** (cache indefinitely):
- [ ] Grand Lodges list
- [ ] Masonic ranks/titles
- [ ] Countries/states
- [ ] Relationship types

**Semi-Static** (cache with TTL):
- [ ] Lodge lists (5 min TTL)
- [ ] Event lists (1 min TTL)
- [ ] Organization data (10 min TTL)

**Real-time** (no cache):
- [ ] Ticket availability
- [ ] Registration data
- [ ] Payment status

### 3. Batch Operations
- [ ] Batch insert attendees in one call
- [ ] Batch update ticket statuses
- [ ] Batch fetch events by IDs
- [ ] Use transactions for multi-table updates

### 4. Optimize Queries
- [ ] Select only needed columns
- [ ] Use proper indexes
- [ ] Avoid N+1 queries
- [ ] Use aggregate functions in DB

### 5. Real-time Subscriptions
- [ ] Only subscribe to ticket availability
- [ ] Unsubscribe when component unmounts
- [ ] Use specific filters
- [ ] Batch subscription updates

## Implementation Tasks

### API Service Updates
- [ ] Create centralized cache manager
- [ ] Implement view-based queries
- [ ] Add query result memoization
- [ ] Create batch operation helpers

### Component Updates  
- [ ] Update data fetching to use views
- [ ] Implement proper loading states
- [ ] Add error boundaries
- [ ] Remove redundant API calls

### Performance Monitoring
- [ ] Add API call logging
- [ ] Track query performance
- [ ] Monitor cache hit rates
- [ ] Set up slow query alerts

## Specific Optimizations by Page

### Homepage
- [ ] Single query for featured events
- [ ] Lazy load non-critical data
- [ ] Prefetch on hover

### Event List
- [ ] Paginate results
- [ ] Virtual scrolling for long lists
- [ ] Progressive image loading

### Registration Flow
- [ ] Prefetch all reference data on start
- [ ] Keep data in memory during flow
- [ ] Only save on step completion
- [ ] Batch attendee operations

### Admin Dashboard
- [ ] Use aggregated views
- [ ] Implement data tables with server-side filtering
- [ ] Export data in background

## Success Metrics
- [ ] Reduce API calls by 50%
- [ ] Page load time under 2s
- [ ] Time to interactive under 3s
- [ ] Zero unnecessary re-renders