# Supabase Utilities Documentation

## Overview
Supabase client utilities provide the correct client instance based on the execution context (server or browser).

## Client Types

### Server Client (`server.ts`)
```typescript
import { createClient } from '@/utils/supabase/server';

// In server components or API routes
const supabase = await createClient();
```
- Used in: Server Components, API Routes, Server Actions
- Respects RLS policies
- Uses cookies for auth

### Browser Client (`client.ts`)
```typescript
import { createClient } from '@/utils/supabase/client';

// In client components
const supabase = createClient();
```
- Used in: Client Components, Browser-side code
- Uses localStorage for auth
- Real-time subscriptions available

## Important Security Notice

### Deprecated Functions
**Never use these functions** (they throw security errors):
- `getSupabaseClient()` from `@/lib/supabase-singleton`
- `getServerClient()` 
- `getSupabaseAdmin()`

These have been removed for security reasons as they bypass RLS.

## Migration Guide

### Old Pattern (Deprecated)
```typescript
import { getSupabaseClient } from '@/lib/supabase-singleton';
const supabase = getSupabaseClient(true); // server
const supabase = getSupabaseClient(false); // client
```

### New Pattern (Required)
```typescript
// Server-side
import { createClient } from '@/utils/supabase/server';
const supabase = await createClient();

// Client-side
import { createClient } from '@/utils/supabase/client';
const supabase = createClient();
```

## Common Use Cases

### API Routes
```typescript
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('table')
    .select('*');
}
```

### Server Components
```typescript
export default async function Page() {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('table')
    .select('*');
}
```

### Client Components
```typescript
'use client'

export function Component() {
  const supabase = createClient();
  
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('table')
        .select('*');
    };
  }, []);
}
```

## Troubleshooting

### Common Errors
1. **"Server-side Supabase client...removed for security"**
   - You're using deprecated `getSupabaseClient`
   - Update imports as shown above

2. **"createClient is not a function"**
   - Check you're importing from the correct path
   - Server: `@/utils/supabase/server`
   - Client: `@/utils/supabase/client`

3. **Authentication issues**
   - Server client uses cookies
   - Client uses localStorage
   - Ensure middleware is configured correctly