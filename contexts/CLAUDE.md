# Contexts Documentation

## Featured Function Context

### Overview
The Featured Function Context provides global access to featured function data throughout the application.

### File: `featured-function-context.tsx`

### Usage
```typescript
'use client'

import { useFeaturedFunction } from '@/contexts/featured-function-context';

export function MyComponent() {
  const { function: functionData, events, packages, isLoading, error } = useFeaturedFunction();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h1>{functionData?.name}</h1>
      <p>{events.length} events available</p>
    </div>
  );
}
```

### Provider Setup
Wrap your app or specific sections:
```typescript
import { FeaturedFunctionProvider } from '@/contexts/featured-function-context';

export function Layout({ children }) {
  return (
    <FeaturedFunctionProvider>
      {children}
    </FeaturedFunctionProvider>
  );
}
```

### Context Value
```typescript
interface FeaturedFunctionContextType {
  function: FunctionType | null;    // Featured function details
  events: EventType[];              // Function events
  packages: PackageType[];          // Function packages
  isLoading: boolean;               // Loading state
  error: Error | null;              // Error state
  refetch: () => Promise<void>;     // Manual refetch
}
```

### Features
- Automatic data fetching on mount
- Parallel loading of function, events, and packages
- Error handling and loading states
- Manual refetch capability
- Uses featured function API service

### Important Notes
1. This is a **client-side context** (note the `'use client'` directive)
2. Uses `FEATURED_FUNCTION_ID` from environment
3. Data is fetched once and cached in context
4. All child components share the same data instance

### When to Use
- Components that need featured function data
- Avoiding prop drilling for function information
- Ensuring consistent function data across components
- Client-side components only

### When NOT to Use
- Server components (use direct service calls instead)
- Components that need different function data
- One-off data fetches