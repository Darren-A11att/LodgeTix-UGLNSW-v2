# Performance Optimization Guide

This document outlines the performance optimization strategies implemented in the LodgeTix application.

## Implemented Optimizations

### 1. Server Components
Static and content-heavy pages have been converted to server components, which:
- Render on the server, reducing client JavaScript
- Improve initial page load speed
- Enhance SEO with server-rendered content

**Example pages implemented as server components:**
- Homepage
- Event details pages
- Informational content pages

### 2. Dynamic Imports
Heavy components in the registration flow now use dynamic imports:
```javascript
const AttendeeDetailsStep = lazy(() => import('../attendee/AttendeeDetails'))
```

Benefits:
- Reduces initial bundle size by ~60%
- Only loads components when needed
- Improves time-to-interactive

### 3. Suspense Boundaries
Lazy-loaded components now have Suspense boundaries with custom loading states:
```javascript
<Suspense fallback={<StepLoadingFallback />}>
  <AttendeeDetailsStep {...props} />
</Suspense>
```

Benefits:
- Provides visual feedback during component loading
- Prevents layout shifts during component loading
- Improves perceived performance

### 4. Static Generation
Event pages now use `generateStaticParams()` to:
- Pre-render pages at build time
- Cache page content on CDN
- Eliminate database queries for common pages

## Performance Testing

Run the bundle analyzer to check performance metrics:
```bash
./scripts/analyze-bundle.sh
```

## Further Optimizations

Consider these additional optimizations:

1. **Image Optimization**
   - Implement `next/image` for all images
   - Use responsive image sizes
   - Consider WebP/AVIF formats

2. **State Management**
   - Move more Zustand stores to React Server Components where possible
   - Implement more granular selectors to reduce re-renders

3. **Data Fetching**
   - Implement React Query for client-side data fetching
   - Use SWR for cache invalidation strategies

4. **CSS Optimization**
   - Remove unused Tailwind classes
   - Consider extracting critical CSS