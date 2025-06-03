# Functions API Routes Documentation

## Overview
All function API routes use UUIDs (`functionId`) as parameters, NOT slugs. This prevents conflicts between function and event identifiers.

## Route Structure
```
/api/functions/
├── route.ts                    # GET all functions
└── [functionId]/              # Dynamic route using UUID
    ├── route.ts               # GET function details
    ├── events/
    │   └── route.ts          # GET events for function
    ├── packages/
    │   └── route.ts          # GET packages for function
    └── register/
        └── route.ts          # POST create registration

```

## Important Notes

### Parameter Usage
- **Always use**: `params.functionId` (UUID format)
- **Never use**: `params.slug` or slug-based lookups in API routes
- **Database queries**: Use `function_id` column with UUID value

### Supabase Client
```typescript
import { createClient } from '@/utils/supabase/server';

// In route handler
const supabase = await createClient();
```

### Example Route Handler
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { functionId: string } }
) {
  const supabase = await createClient();
  
  // Use RPC for complex queries
  const { data, error } = await supabase
    .rpc('get_function_details', { p_function_id: params.functionId });
    
  // Or direct table query
  const { data, error } = await supabase
    .from('functions')
    .select('*')
    .eq('function_id', params.functionId)
    .single();
}
```

## RPC Functions
- `get_function_details(p_function_id UUID)` - Returns complete function data
- `create_function_registration` - Creates new registration with attendees

## Error Handling
Always validate the functionId parameter and return appropriate error responses:
- 404 if function not found
- 500 for database errors
- Include error details in development mode only