# Utilities Documentation

## Function Slug Resolver

### Overview
Utilities for resolving function slugs to UUIDs in featured function mode. Separate implementations for server and client contexts.

### Files
- `function-slug-resolver.ts` - Server-side implementation
- `function-slug-resolver-client.ts` - Client-side implementation

### Usage

#### Server-Side
```typescript
import { resolveFunctionSlug, getFeaturedFunctionInfo } from '@/lib/utils/function-slug-resolver';

// Resolve slug to UUID
const functionId = await resolveFunctionSlug(slug, true); // isServerSide = true

// Get featured function info
const { id, slug } = await getFeaturedFunctionInfo(true);
```

#### Client-Side
```typescript
import { resolveFunctionSlug, getFeaturedFunctionInfo } from '@/lib/utils/function-slug-resolver-client';

// Resolve slug to UUID (no isServerSide parameter needed)
const functionId = await resolveFunctionSlug(slug);

// Get featured function info
const { id, slug } = await getFeaturedFunctionInfo();
```

### Key Functions

#### `resolveFunctionSlug(slug: string)`
- Resolves a function slug to its UUID
- Returns featured function ID if slug not found
- Caches results for performance

#### `getFeaturedFunctionInfo()`
- Returns both ID and slug for featured function
- Useful for components needing both values

#### `isFeaturedFunction(slug: string)`
- Checks if given slug is the featured function

### Environment Variables
- `FEATURED_FUNCTION_ID` - Server-side featured function UUID
- `NEXT_PUBLIC_FEATURED_FUNCTION_ID` - Client-side featured function UUID

### Important Notes
1. Always use the client version in components with `'use client'`
2. Server version requires `await createClient()` 
3. Client version uses `createClient()` (no await)
4. Both versions cache results to minimize database queries

## Other Utilities

### UUID/Slug Utils (`uuid-slug-utils.ts`)
- Helper functions for UUID and slug operations
- Validation and formatting utilities

### Formatters (`formatters.ts`)
- Currency formatting
- Date formatting
- Other display formatters

### Cache Manager (`cache-manager.ts`)
- In-memory caching utilities
- Used by various services for performance