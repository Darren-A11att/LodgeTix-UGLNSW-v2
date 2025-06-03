# Services Documentation

## Overview
Services provide centralized business logic and data access patterns. They abstract database queries and API calls from components.

## Key Services

### Function Service (`function-service.ts`)
- **Purpose**: Handle all function-related operations
- **Key Methods**:
  - `getFunctionById(functionId: string)` - Get function by UUID
  - `getEventsForFunction(functionId: string)` - Get all events
  - `getPackagesForFunction(functionId: string)` - Get all packages
- **Note**: Always use UUIDs, not slugs

### Featured Function Service (`featured-function-service.ts`)
- **Purpose**: Specialized service for featured function operations
- **Uses**: `FEATURED_FUNCTION_ID` from environment
- **Key Methods**:
  - `getDetails()` - Get featured function details
  - `getEvents()` - Get featured function events
  - `getPackages()` - Get featured function packages
- **Pattern**: Singleton instance exported as `featuredFunctionApi`

### Function Tickets Service (`function-tickets-service.ts`)
- **Purpose**: Handle ticket and package operations
- **Features**:
  - Input validation (checks for missing functionId)
  - Uses API routes to bypass RLS
  - Transforms database format to frontend format
- **Key Methods**:
  - `getFunctionTickets(functionId: string)`
  - `getFunctionPackages(functionId: string)`
  - `getFunctionTicketsAndPackages(functionId: string)`

## Service Patterns

### Server vs Client Services
```typescript
// Server-side service (uses server Supabase client)
import { createServerFunctionService } from '@/lib/services/function-service-server';
const service = await createServerFunctionService();

// Client-side service (uses browser Supabase client)
import { FunctionService } from '@/lib/services/function-service';
const service = new FunctionService();
```

### Error Handling
All services should:
1. Validate input parameters
2. Provide clear error messages
3. Log errors for debugging
4. Return typed responses

### Caching
- Services may implement caching for performance
- Cache keys should use UUIDs, not slugs
- Clear cache on data mutations

## Migration Notes
- All slug-based methods have been deprecated
- Use `getFunctionById` instead of `getFunctionBySlug`
- Function IDs are UUIDs in format: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'