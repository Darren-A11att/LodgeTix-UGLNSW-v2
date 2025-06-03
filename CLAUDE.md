# LodgeTix UGLNSW - Project Documentation

## Project Overview
LodgeTix is a ticketing and registration platform for the United Grand Lodge of NSW & ACT. The application operates in "featured function mode" where it's dedicated to a single function (event series) at a time.

## Architecture Decisions

### UUID-Based API Architecture
**Important**: All API routes use UUIDs (`functionId`) as the source of truth, NOT slugs. Slugs are only used for customer-facing URLs.

- **API Routes**: `/api/functions/[functionId]/*` 
- **Frontend Routes**: `/functions/[slug]/*`
- **Featured Function ID**: Stored in `FEATURED_FUNCTION_ID` environment variable

### Supabase Client Usage
- **Server Components**: Use `createClient` from `@/utils/supabase/server`
- **Client Components**: Use `createClient` from `@/utils/supabase/client`
- **Never use**: The deprecated `getSupabaseClient` function (throws security error)

### Function Resolution
- **Server-side**: Use `function-slug-resolver.ts` 
- **Client-side**: Use `function-slug-resolver-client.ts`
- Both resolve slugs to UUIDs when needed

## Key Services

### Featured Function Service
Located at `/lib/services/featured-function-service.ts`
- Centralized service for all featured function operations
- Uses environment variable `FEATURED_FUNCTION_ID`
- Provides methods for getting function details, events, and packages

### Function Tickets Service
Located at `/lib/services/function-tickets-service.ts`
- Handles ticket and package operations
- Validates functionId before making API calls
- Uses API routes to bypass RLS issues

## Database Schema

### RPC Functions
- `get_function_details(p_function_id UUID)` - Fetches function details by UUID
- `create_function_registration` - Creates registrations with function UUID

### Key Tables
- `functions` - Main function table with UUID primary key
- `events` - Events linked to functions via `function_id`
- `packages` - Packages linked to functions
- `registrations` - User registrations linked to functions

## Component Architecture

### Registration Wizard
- Props: `functionSlug`, `functionId`, `registrationId`, `isNewRegistration`
- Resolves slug to UUID if functionId not provided
- Handles both new and existing registrations

### Lodge Registration
- Requires `functionId` prop (not optional)
- Uses function tickets service to fetch packages
- Integrated payment processing with Stripe

## Common Patterns

### API Route Pattern
```typescript
// Always use functionId parameter
export async function GET(
  request: NextRequest,
  { params }: { params: { functionId: string } }
) {
  const supabase = await createClient();
  // Use params.functionId for queries
}
```

### Component Pattern
```typescript
// Server component fetching function data
const functionService = await createServerFunctionService();
const functionData = await functionService.getFunctionById(FEATURED_FUNCTION_ID);

// Client component resolving slugs
const functionId = await resolveFunctionSlug(slug);
```

## Testing
- All tests updated to use UUIDs instead of slugs
- Mock data uses actual UUID format
- API tests validate UUID parameters

## Troubleshooting

### Common Issues
1. **"No function ID provided"** - Ensure functionId prop is passed through component hierarchy
2. **Supabase client error** - Check you're using the correct import for server/client context
3. **404 on API calls** - Verify you're using functionId (UUID) not slug in API routes

### Debug Commands
- Check function details: `curl /api/functions/{uuid}`
- List packages: `curl /api/functions/{uuid}/packages`
- Test registration: Check browser console for prop validation

## Environment Variables
- `FEATURED_FUNCTION_ID` - UUID of the featured function
- `NEXT_PUBLIC_FEATURED_FUNCTION_ID` - Client-side access to featured function ID
- Standard Supabase vars for API access