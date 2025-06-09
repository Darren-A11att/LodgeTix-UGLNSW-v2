# Edge Functions Development Guide

## Introduction

This guide provides step-by-step instructions for developing Supabase Edge Functions locally. Edge Functions are TypeScript functions that run on Deno Deploy, providing serverless compute at the edge.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Creating Your First Function](#creating-your-first-function)
4. [Local Development Workflow](#local-development-workflow)
5. [Working with Dependencies](#working-with-dependencies)
6. [Database Integration](#database-integration)
7. [Testing Functions](#testing-functions)
8. [Debugging](#debugging)
9. [Best Practices](#best-practices)
10. [Common Patterns](#common-patterns)

## Prerequisites

### Required Software

1. **Deno Runtime** (v1.40+)
   ```bash
   # macOS
   brew install deno
   
   # Windows (PowerShell)
   irm https://deno.land/install.ps1 | iex
   
   # Linux
   curl -fsSL https://deno.land/install.sh | sh
   ```

2. **Docker Desktop**
   - Download from [docker.com](https://www.docker.com/products/docker-desktop)
   - Ensure at least 4GB RAM allocated

3. **Supabase CLI** (latest)
   ```bash
   # macOS
   brew install supabase/tap/supabase
   
   # npm/npx
   npx supabase --version
   ```

4. **VSCode** (recommended)
   - Install [Deno extension](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno)

### Verify Installation

```bash
# Check all tools
deno --version
docker --version
supabase --version

# Expected output
# deno 1.40.0+
# Docker version 24.0+
# Supabase CLI 1.120+
```

## Environment Setup

### Step 1: Initialize Supabase Project

```bash
# In your project root
supabase init

# Start local Supabase stack
supabase start
```

This starts:
- PostgreSQL database (port 54322)
- Auth server (port 54321)
- Storage server
- Realtime server
- Edge Functions server (port 54321)

### Step 2: Configure VSCode

Create `.vscode/settings.json`:

```json
{
  "deno.enable": true,
  "deno.lint": true,
  "deno.unstable": true,
  "deno.enablePaths": ["supabase/functions"],
  "deno.importMap": "./supabase/functions/import_map.json",
  "[typescript]": {
    "editor.defaultFormatter": "denoland.vscode-deno"
  }
}
```

### Step 3: Set Up Environment Variables

Create `supabase/functions/.env.local`:

```env
# Local development secrets
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-key

# Third-party services
STRIPE_SECRET_KEY=sk_test_...
RESEND_API_KEY=re_test_...
CUSTOM_API_KEY=your-api-key
```

Get local keys:
```bash
supabase status
# Copy anon key and service_role key
```

## Creating Your First Function

### Step 1: Generate Function

```bash
# Create new function
supabase functions new hello-world

# This creates:
# supabase/functions/hello-world/index.ts
```

### Step 2: Basic Function Structure

```typescript
// supabase/functions/hello-world/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request
    const { name } = await req.json()
    
    // Business logic
    const data = {
      message: `Hello ${name || 'World'}!`,
      timestamp: new Date().toISOString(),
    }

    // Return response
    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    // Error handling
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
```

### Step 3: Add Type Definitions

Create `supabase/functions/hello-world/types.ts`:

```typescript
export interface HelloRequest {
  name?: string
  age?: number
}

export interface HelloResponse {
  message: string
  timestamp: string
}

export interface ErrorResponse {
  error: string
  details?: unknown
}
```

Update function with types:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import type { HelloRequest, HelloResponse, ErrorResponse } from "./types.ts"

serve(async (req) => {
  try {
    const body: HelloRequest = await req.json()
    
    const response: HelloResponse = {
      message: `Hello ${body.name || 'World'}!`,
      timestamp: new Date().toISOString(),
    }
    
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: error.message,
      details: error.stack
    }
    
    return new Response(JSON.stringify(errorResponse), {
      headers: { 'Content-Type': 'application/json' },
      status: 400
    })
  }
})
```

## Local Development Workflow

### Step 1: Start Development Server

```bash
# Serve all functions
supabase functions serve

# Serve specific function with hot reload
supabase functions serve hello-world --no-verify-jwt

# With environment variables
supabase functions serve --env-file ./supabase/functions/.env.local
```

### Step 2: Test Your Function

```bash
# Using curl
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/hello-world' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"name": "Developer"}'

# Using HTTPie (prettier output)
http POST localhost:54321/functions/v1/hello-world \
  Authorization:"Bearer YOUR_ANON_KEY" \
  name="Developer"
```

### Step 3: Hot Reload Workflow

1. Make changes to your function
2. Save the file
3. Function automatically reloads
4. Test again immediately

### Step 4: View Logs

```bash
# In another terminal
docker logs -f supabase_deno_relay_hello-world

# Or use Supabase Dashboard
# Visit http://localhost:54323
```

## Working with Dependencies

### Import Maps

Create `supabase/functions/import_map.json`:

```json
{
  "imports": {
    "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2",
    "date-fns": "https://esm.sh/date-fns@2.30.0",
    "zod": "https://deno.land/x/zod@v3.22.4/mod.ts",
    "@/": "./",
    "shared/": "../_shared/"
  }
}
```

### Using npm Packages

```typescript
// Direct npm imports
import { format } from "npm:date-fns@2.30.0"

// With types
// @deno-types="npm:@types/lodash@4.14.199"
import _ from "npm:lodash@4.17.21"
```

### Deno Standard Library

```typescript
// Recommended versions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts"
import { join } from "https://deno.land/std@0.168.0/path/mod.ts"
```

### Shared Code

Create shared utilities in `supabase/functions/_shared/`:

```typescript
// supabase/functions/_shared/supabase.ts
import { createClient } from "@supabase/supabase-js"

export const getSupabaseClient = (req: Request) => {
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: {
          Authorization: authHeader || ''
        }
      }
    }
  )
}

// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}
```

## Database Integration

### Connecting to Database

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "@supabase/supabase-js"

serve(async (req) => {
  // Create client with service role for admin access
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Or use user's token for RLS
  const authHeader = req.headers.get('Authorization')
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: { headers: { Authorization: authHeader! } }
    }
  )

  // Query example
  const { data, error } = await supabaseClient
    .from('users')
    .select('*')
    .limit(10)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ users: data }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### Direct Database Connection

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import postgres from "https://deno.land/x/postgresjs/mod.js"

const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!)

serve(async (req) => {
  try {
    // Direct SQL query
    const users = await sql`
      SELECT id, email, created_at 
      FROM auth.users 
      WHERE created_at > NOW() - INTERVAL '7 days'
      LIMIT 10
    `

    return new Response(JSON.stringify({ users }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

## Testing Functions

### Unit Testing

Create `supabase/functions/hello-world/index.test.ts`:

```typescript
import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts"
import { createClient } from "@supabase/supabase-js"

Deno.test("hello function returns greeting", async () => {
  const client = createClient(
    "http://localhost:54321",
    "your-anon-key"
  )

  const { data, error } = await client.functions.invoke('hello-world', {
    body: { name: 'Test' }
  })

  assertEquals(error, null)
  assertEquals(data.message, 'Hello Test!')
})

Deno.test("hello function handles missing name", async () => {
  const client = createClient(
    "http://localhost:54321",
    "your-anon-key"
  )

  const { data, error } = await client.functions.invoke('hello-world', {
    body: {}
  })

  assertEquals(error, null)
  assertEquals(data.message, 'Hello World!')
})
```

Run tests:
```bash
# Run all tests
deno test --allow-net --allow-env supabase/functions

# Run specific test file
deno test --allow-net --allow-env supabase/functions/hello-world/index.test.ts

# With coverage
deno test --allow-net --allow-env --coverage=coverage supabase/functions
```

### Integration Testing

```typescript
// supabase/functions/_tests/integration.test.ts
import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  "http://localhost:54321",
  "your-anon-key"
)

Deno.test("end-to-end registration flow", async () => {
  // 1. Create registration
  const { data: registration } = await supabase.functions.invoke('create-registration', {
    body: {
      userId: 'test-user-id',
      eventId: 'test-event-id'
    }
  })

  // 2. Generate confirmation
  const { data: confirmation } = await supabase.functions.invoke('generate-confirmation', {
    body: {
      registrationId: registration.id
    }
  })

  // 3. Send email
  const { data: email } = await supabase.functions.invoke('send-confirmation-email', {
    body: {
      registrationId: registration.id,
      confirmationNumber: confirmation.number
    }
  })

  // Assertions
  assertEquals(registration.status, 'pending')
  assertEquals(confirmation.number.length, 8)
  assertEquals(email.sent, true)
})
```

## Debugging

### Local Debugging with Console

```typescript
serve(async (req) => {
  // Use console for debugging
  console.log('Request method:', req.method)
  console.log('Request headers:', Object.fromEntries(req.headers))
  
  const body = await req.json()
  console.log('Request body:', body)
  
  // Use console.time for performance
  console.time('database-query')
  const result = await someAsyncOperation()
  console.timeEnd('database-query')
  
  return new Response(JSON.stringify(result))
})
```

View logs:
```bash
# Follow function logs
docker logs -f supabase_deno_relay_[function-name]

# Or in Supabase Studio
# http://localhost:54323 → Functions → Logs
```

### VSCode Debugging

1. Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "request": "launch",
      "name": "Debug Deno Function",
      "type": "node",
      "program": "${workspaceFolder}/supabase/functions/hello-world/index.ts",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "deno",
      "runtimeArgs": [
        "run",
        "--inspect-brk",
        "--allow-all",
        "--watch"
      ],
      "attachSimplePort": 9229
    }
  ]
}
```

2. Set breakpoints in VSCode
3. Press F5 to start debugging

### Common Debugging Techniques

```typescript
// Error debugging helper
function debugError(error: unknown, context: string) {
  console.error(`Error in ${context}:`, {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    error: error
  })
}

// Request debugging helper
async function debugRequest(req: Request) {
  const clone = req.clone()
  const body = await clone.text()
  
  console.log('Debug Request:', {
    url: req.url,
    method: req.method,
    headers: Object.fromEntries(req.headers),
    body: body
  })
}

// Response debugging helper
function debugResponse(response: Response) {
  console.log('Debug Response:', {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers)
  })
}
```

## Best Practices

### 1. Error Handling

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Custom error class
class FunctionError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'FunctionError'
  }
}

serve(async (req) => {
  try {
    // Validate input
    const body = await req.json()
    if (!body.userId) {
      throw new FunctionError('userId is required', 'MISSING_USER_ID')
    }

    // Business logic
    const result = await processRequest(body)
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    // Structured error response
    if (error instanceof FunctionError) {
      return new Response(
        JSON.stringify({
          error: error.message,
          code: error.code
        }),
        {
          status: error.statusCode,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Unexpected errors
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})
```

### 2. Input Validation

Using Zod for validation:

```typescript
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"

// Define schema
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().min(0).max(150).optional(),
  preferences: z.object({
    newsletter: z.boolean().default(false),
    theme: z.enum(['light', 'dark']).default('light')
  }).optional()
})

type CreateUserInput = z.infer<typeof CreateUserSchema>

serve(async (req) => {
  try {
    const body = await req.json()
    
    // Validate input
    const validatedData = CreateUserSchema.parse(body)
    
    // validatedData is fully typed
    console.log(validatedData.email) // string
    console.log(validatedData.age) // number | undefined
    
    return new Response(JSON.stringify({ success: true }))
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: error.errors
        }),
        { status: 400 }
      )
    }
    throw error
  }
})
```

### 3. Performance Optimization

```typescript
// Global scope for reusable resources
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Cache expensive operations
const cache = new Map<string, { data: any, expiry: number }>()

function getCached<T>(key: string, ttlSeconds = 300): T | null {
  const cached = cache.get(key)
  if (cached && cached.expiry > Date.now()) {
    return cached.data as T
  }
  cache.delete(key)
  return null
}

function setCache(key: string, data: any, ttlSeconds = 300) {
  cache.set(key, {
    data,
    expiry: Date.now() + (ttlSeconds * 1000)
  })
}

serve(async (req) => {
  const { userId } = await req.json()
  
  // Check cache first
  const cacheKey = `user:${userId}`
  const cachedUser = getCached(cacheKey)
  if (cachedUser) {
    return new Response(JSON.stringify(cachedUser))
  }
  
  // Fetch from database
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  // Cache result
  setCache(cacheKey, user)
  
  return new Response(JSON.stringify(user))
})
```

### 4. Security Best Practices

```typescript
serve(async (req) => {
  // 1. Always validate JWT
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!jwt) {
    return new Response('Unauthorized', { status: 401 })
  }

  // 2. Rate limiting
  const clientIp = req.headers.get('x-forwarded-for') || 'unknown'
  if (isRateLimited(clientIp)) {
    return new Response('Too many requests', { status: 429 })
  }

  // 3. Input sanitization
  const body = await req.json()
  const sanitizedInput = sanitizeHtml(body.content)

  // 4. Use least privilege
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!, // Not service role
    {
      global: { headers: { Authorization: `Bearer ${jwt}` } }
    }
  )

  // 5. Never log sensitive data
  console.log('Processing request for user') // Don't log JWT, passwords, etc.

  return new Response('OK')
})
```

## Common Patterns

### 1. Webhook Handler

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts"

serve(async (req) => {
  // Verify webhook signature
  const signature = req.headers.get('x-webhook-signature')
  const body = await req.text()
  
  const expectedSignature = createHmac('sha256', Deno.env.get('WEBHOOK_SECRET')!)
    .update(body)
    .digest('hex')
  
  if (signature !== expectedSignature) {
    return new Response('Invalid signature', { status: 401 })
  }
  
  // Process webhook
  const data = JSON.parse(body)
  console.log('Webhook received:', data.event)
  
  // Acknowledge receipt immediately
  setTimeout(async () => {
    // Process async
    await processWebhookEvent(data)
  }, 0)
  
  return new Response('OK', { status: 200 })
})
```

### 2. File Upload Handler

```typescript
serve(async (req) => {
  const formData = await req.formData()
  const file = formData.get('file') as File
  
  if (!file) {
    return new Response('No file uploaded', { status: 400 })
  }
  
  // Validate file
  const MAX_SIZE = 10 * 1024 * 1024 // 10MB
  if (file.size > MAX_SIZE) {
    return new Response('File too large', { status: 400 })
  }
  
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  if (!ALLOWED_TYPES.includes(file.type)) {
    return new Response('Invalid file type', { status: 400 })
  }
  
  // Upload to Supabase Storage
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  const fileName = `${crypto.randomUUID()}-${file.name}`
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(fileName, file)
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    })
  }
  
  return new Response(JSON.stringify({ 
    url: data.path,
    size: file.size,
    type: file.type
  }))
})
```

### 3. Scheduled Task Pattern

```typescript
// Function to be called by pg_cron
serve(async (req) => {
  // Verify it's called by Supabase
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  const { task } = await req.json()
  
  switch (task) {
    case 'cleanup-expired-sessions':
      await cleanupExpiredSessions()
      break
    case 'send-reminder-emails':
      await sendReminderEmails()
      break
    default:
      return new Response('Unknown task', { status: 400 })
  }
  
  return new Response('Task completed')
})

async function cleanupExpiredSessions() {
  const supabase = getAdminClient()
  const { error } = await supabase
    .from('sessions')
    .delete()
    .lt('expires_at', new Date().toISOString())
  
  if (error) throw error
  console.log('Cleaned up expired sessions')
}
```

### 4. API Gateway Pattern

```typescript
serve(async (req) => {
  const url = new URL(req.url)
  const path = url.pathname.replace('/functions/v1/api-gateway', '')
  
  // Route to different handlers
  switch (path) {
    case '/users':
      return handleUsers(req)
    case '/orders':
      return handleOrders(req)
    case '/products':
      return handleProducts(req)
    default:
      return new Response('Not found', { status: 404 })
  }
})

async function handleUsers(req: Request) {
  switch (req.method) {
    case 'GET':
      return getUserList(req)
    case 'POST':
      return createUser(req)
    case 'PUT':
      return updateUser(req)
    case 'DELETE':
      return deleteUser(req)
    default:
      return new Response('Method not allowed', { status: 405 })
  }
}
```

## Troubleshooting

### Common Issues

1. **Function not found**
   ```
   Error: Function not found
   ```
   - Check function name matches directory name
   - Ensure `index.ts` exists
   - Restart functions server

2. **Module not found**
   ```
   Error: Module not found "https://deno.land/..."
   ```
   - Check import URL is correct
   - Try updating to latest version
   - Clear Deno cache: `deno cache --reload`

3. **Environment variable undefined**
   ```
   Error: Deno.env.get('KEY') is undefined
   ```
   - Check `.env.local` file exists
   - Verify key names match
   - Restart with `--env-file` flag

4. **CORS errors**
   ```
   CORS policy: No 'Access-Control-Allow-Origin'
   ```
   - Add CORS headers to response
   - Handle OPTIONS requests
   - Check allowed origins

5. **Type errors**
   ```
   Type 'unknown' is not assignable to type 'string'
   ```
   - Add proper type annotations
   - Validate input types
   - Use type guards

### Debug Commands

```bash
# Clear Deno cache
deno cache --reload supabase/functions/[function-name]/index.ts

# Check function health
curl http://localhost:54321/functions/v1/[function-name]/health

# View Docker logs
docker logs supabase_deno_relay_[function-name] --tail 50 --follow

# Restart functions
supabase functions serve --restart

# Check Supabase status
supabase status
```

## Next Steps

1. **Create your first function** following this guide
2. **Add tests** using the testing patterns
3. **Set up CI/CD** with the [Deployment Guide](./DEPLOYMENT-GUIDE.md)
4. **Learn troubleshooting** from the [Troubleshooting Guide](./TROUBLESHOOTING.md)

## Additional Resources

- [Deno Manual](https://deno.land/manual)
- [Supabase Functions Examples](https://github.com/supabase/supabase/tree/master/examples/edge-functions)
- [Deno by Example](https://examples.deno.land/)
- [Edge Functions Discord Channel](https://discord.supabase.com)