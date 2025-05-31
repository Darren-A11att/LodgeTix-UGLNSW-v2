# Secure Database Access Patterns

## Overview

This document explains the secure database access patterns used in the LodgeTix application after removing service role bypass functionality. All database operations now respect Row Level Security (RLS) policies.

## Migration Summary

We've removed all service role bypass code to improve security:

### What Was Removed
- `createAdminClient()` from `/utils/supabase/admin.ts` 
- `getServerClient()` and `getSupabaseAdmin()` from `/lib/supabase-singleton.ts`
- All direct usage of `SUPABASE_SERVICE_ROLE_KEY`

### What to Use Instead
- `createClient()` from `@/utils/supabase/server` for server-side operations
- `createBrowserClient()` from `@/utils/supabase/client` for client-side operations

## Server-Side Access Patterns

### API Routes

```typescript
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  
  // All queries now respect RLS
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('registration_id', id);
}
```

### Server Components

```typescript
import { createClient } from '@/utils/supabase/server';

export default async function EventPage() {
  const supabase = await createClient();
  
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('is_published', true);
    
  return <EventList events={events} />;
}
```

### Service Classes with Lazy Initialization

For service classes that need database access:

```typescript
import { createClient } from '@/utils/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export class EventService {
  private clientPromise: Promise<SupabaseClient> | null = null;
  
  private async getClient() {
    if (!this.clientPromise) {
      this.clientPromise = createClient();
    }
    return this.clientPromise;
  }
  
  async getEvents() {
    const supabase = await this.getClient();
    return supabase.from('events').select('*');
  }
}
```

## Client-Side Access Patterns

```typescript
import { createBrowserClient } from '@/utils/supabase/client';

export function useEvents() {
  const [events, setEvents] = useState([]);
  
  useEffect(() => {
    const fetchEvents = async () => {
      const supabase = createBrowserClient();
      const { data } = await supabase
        .from('events')
        .select('*');
      setEvents(data || []);
    };
    
    fetchEvents();
  }, []);
  
  return events;
}
```

## Authentication Context

The `createClient()` function automatically handles authentication context:
- It reads authentication cookies from the request
- All queries are executed in the context of the authenticated user
- RLS policies enforce data access based on the user's role

## RLS Policy Requirements

For this secure access pattern to work properly, ensure your RLS policies are configured:

### Example RLS Policies

```sql
-- Allow authenticated users to read their own registrations
CREATE POLICY "Users can view own registrations" ON registrations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow anonymous users to read published events
CREATE POLICY "Anyone can view published events" ON events
  FOR SELECT
  TO anon
  USING (is_published = true);

-- Allow authenticated users to insert registrations
CREATE POLICY "Authenticated users can create registrations" ON registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

## Migration Checklist

When migrating code from service role to authenticated access:

1. **Replace imports**:
   ```typescript
   // Before
   import { createAdminClient } from '@/utils/supabase/admin';
   
   // After
   import { createClient } from '@/utils/supabase/server';
   ```

2. **Update client creation**:
   ```typescript
   // Before
   const adminClient = createAdminClient();
   
   // After
   const supabase = await createClient();
   ```

3. **Ensure proper RLS policies** are in place for all tables

4. **Test access patterns** with different user roles

5. **Handle authorization errors** gracefully in the UI

## Common Patterns

### Webhook Handlers

For Stripe webhooks and similar services that need to perform operations:

```typescript
export async function POST(request: Request) {
  // Verify webhook signature first
  const isValid = verifyWebhookSignature(request);
  if (!isValid) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Use authenticated client
  const supabase = await createClient();
  
  // Perform operations with proper user context
  // You may need to use Supabase's auth.admin features
  // for operations that need elevated permissions
}
```

### Background Jobs

For background jobs that need to run without user context, consider:
1. Using Supabase Edge Functions with proper authentication
2. Implementing a job queue with proper authorization
3. Using database triggers for automated operations

## Security Best Practices

1. **Never bypass RLS** in production code
2. **Always authenticate webhook requests** before processing
3. **Use proper error handling** for authorization failures
4. **Log security-relevant events** for auditing
5. **Regularly review RLS policies** for completeness
6. **Test with different user roles** to ensure proper access control

## Troubleshooting

### Common Issues

1. **"Permission denied" errors**: Check RLS policies for the table
2. **"User not authenticated"**: Ensure cookies are properly set
3. **Missing data**: Verify RLS policies allow access for the user's role
4. **Webhook failures**: Implement proper authentication for external services

### Debug Tips

```typescript
// Log the authenticated user
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
console.log('Authenticated as:', user?.id);

// Check if RLS is enabled
// Run in Supabase SQL editor:
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

## Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js + Supabase Integration](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)