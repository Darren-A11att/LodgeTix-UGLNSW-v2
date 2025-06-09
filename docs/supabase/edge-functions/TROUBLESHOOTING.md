# Edge Functions Troubleshooting Guide

## Overview
This guide helps diagnose and resolve common issues with Supabase Edge Functions in the LodgeTix UGLNSW project. It covers development, deployment, and runtime problems with practical solutions.

## Table of Contents
1. [Quick Diagnostics](#quick-diagnostics)
2. [Development Issues](#development-issues)
3. [Deployment Problems](#deployment-problems)
4. [Runtime Errors](#runtime-errors)
5. [Performance Issues](#performance-issues)
6. [Database Connection Issues](#database-connection-issues)
7. [Third-Party Integration Issues](#third-party-integration-issues)
8. [Debugging Tools & Techniques](#debugging-tools--techniques)
9. [Common Error Messages](#common-error-messages)
10. [Emergency Procedures](#emergency-procedures)

## Quick Diagnostics

### Health Check Script

```bash
#!/bin/bash
# edge-functions-health.sh

echo "🏥 Edge Functions Health Check"
echo "============================="

# Check Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not installed"
    exit 1
fi
echo "✅ Supabase CLI: $(supabase --version)"

# Check Deno
if ! command -v deno &> /dev/null; then
    echo "❌ Deno not installed"
    exit 1
fi
echo "✅ Deno: $(deno --version | head -n 1)"

# Check Docker
if ! docker info &> /dev/null; then
    echo "❌ Docker not running"
    exit 1
fi
echo "✅ Docker: Running"

# Check local Supabase
if supabase status &> /dev/null; then
    echo "✅ Local Supabase: Running"
    supabase status
else
    echo "❌ Local Supabase: Not running"
    echo "  Run: supabase start"
fi

# Check functions
echo "\n📁 Functions found:"
ls -1 supabase/functions/ | grep -v _shared
```

### Quick Fix Commands

```bash
# Reset everything
supabase stop && supabase start

# Clear Deno cache
deno cache --reload supabase/functions/*/index.ts

# Restart functions server
supabase functions serve --restart

# Check function logs
docker logs -f supabase_deno_relay_[function-name]

# Verify function deployment
curl http://localhost:54321/functions/v1/[function-name]/health
```

## Development Issues

### Issue: Function Not Found

**Symptoms:**
```
Error: Function [name] not found
404 Not Found
```

**Causes & Solutions:**

1. **Function not created properly**
   ```bash
   # Verify function structure
   ls -la supabase/functions/[function-name]/
   # Should contain index.ts
   
   # Create if missing
   supabase functions new [function-name]
   ```

2. **Functions server not running**
   ```bash
   # Start functions server
   supabase functions serve
   
   # Or serve specific function
   supabase functions serve [function-name]
   ```

3. **Wrong URL path**
   ```bash
   # Correct URL format
   http://localhost:54321/functions/v1/[function-name]
   
   # Not:
   # http://localhost:54321/[function-name]
   # http://localhost:54321/functions/[function-name]
   ```

### Issue: Module Import Errors

**Symptoms:**
```
Error: Module not found "https://deno.land/..."
Uncaught TypeError: Failed to fetch dynamically imported module
```

**Solutions:**

1. **Clear Deno cache**
   ```bash
   # Clear all cache
   deno cache --reload supabase/functions/*/index.ts
   
   # Clear specific function
   deno cache --reload supabase/functions/[function-name]/index.ts
   ```

2. **Fix import URLs**
   ```typescript
   // ❌ Wrong - old version
   import { serve } from "https://deno.land/std@0.131.0/http/server.ts"
   
   // ✅ Correct - stable version
   import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
   ```

3. **Use import map**
   ```json
   // supabase/functions/import_map.json
   {
     "imports": {
       "std/": "https://deno.land/std@0.168.0/",
       "@supabase/": "https://esm.sh/@supabase/"
     }
   }
   ```

### Issue: Environment Variables Not Loading

**Symptoms:**
```
Deno.env.get('KEY') returns undefined
Error: Missing required environment variable
```

**Solutions:**

1. **Create .env file**
   ```bash
   # Create supabase/functions/.env.local
   echo "MY_SECRET=secret_value" > supabase/functions/.env.local
   ```

2. **Serve with env file**
   ```bash
   supabase functions serve --env-file ./supabase/functions/.env.local
   ```

3. **Check variable names**
   ```typescript
   // Debug environment variables
   console.log('Available env vars:', Object.keys(Deno.env.toObject()))
   ```

### Issue: CORS Errors

**Symptoms:**
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**Solution:**
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

serve(async (req) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Your logic here
    const data = { message: 'Success' }
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
```

## Deployment Problems

### Issue: Deployment Authentication Failed

**Symptoms:**
```
Error: Invalid access token
Error: Not authenticated
```

**Solutions:**

1. **Re-authenticate**
   ```bash
   # Login again
   supabase login
   
   # Verify authentication
   supabase projects list
   ```

2. **Use access token**
   ```bash
   # Set environment variable
   export SUPABASE_ACCESS_TOKEN=your-token
   
   # Or in GitHub Actions
   env:
     SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
   ```

3. **Check project linking**
   ```bash
   # Re-link project
   supabase link --project-ref your-project-ref
   
   # Verify link
   supabase status
   ```

### Issue: Function Size Limit Exceeded

**Symptoms:**
```
Error: Function size exceeds 50MB limit
```

**Solutions:**

1. **Check function size**
   ```bash
   # Check sizes
   du -sh supabase/functions/*
   
   # Find large files
   find supabase/functions -type f -size +1M
   ```

2. **Optimize imports**
   ```typescript
   // ❌ Import entire library
   import _ from "npm:lodash"
   
   // ✅ Import specific functions
   import { debounce } from "npm:lodash-es/debounce"
   ```

3. **Use dynamic imports**
   ```typescript
   // Load heavy dependencies only when needed
   if (needsPDF) {
     const { PDFDocument } = await import("npm:pdf-lib")
     // Use PDFDocument
   }
   ```

### Issue: Secrets Not Available in Production

**Symptoms:**
```
Error: Environment variable X not found
Production function fails but local works
```

**Solutions:**

1. **Set production secrets**
   ```bash
   # List current secrets
   supabase secrets list --project-ref prod-ref
   
   # Set missing secrets
   supabase secrets set KEY=value --project-ref prod-ref
   
   # Set from file
   supabase secrets set --env-file .env.production --project-ref prod-ref
   ```

2. **Verify secrets in function**
   ```typescript
   // Add startup check
   const requiredEnvVars = ['STRIPE_KEY', 'RESEND_KEY']
   
   for (const envVar of requiredEnvVars) {
     if (!Deno.env.get(envVar)) {
       throw new Error(`Missing required environment variable: ${envVar}`)
     }
   }
   ```

## Runtime Errors

### Issue: Function Timeout

**Symptoms:**
```
Error: Function execution exceeded timeout
503 Service Unavailable
```

**Solutions:**

1. **Optimize long-running operations**
   ```typescript
   // Use streaming for large responses
   serve(async (req) => {
     const stream = new ReadableStream({
       async start(controller) {
         for (const chunk of largeData) {
           controller.enqueue(chunk)
           // Allow other operations
           await new Promise(resolve => setTimeout(resolve, 0))
         }
         controller.close()
       }
     })
     
     return new Response(stream)
   })
   ```

2. **Implement request queuing**
   ```typescript
   // Return immediately, process async
   serve(async (req) => {
     const jobId = crypto.randomUUID()
     
     // Queue job
     await supabase.from('job_queue').insert({
       id: jobId,
       payload: await req.json(),
       status: 'pending'
     })
     
     // Process async
     processJobAsync(jobId)
     
     return new Response(JSON.stringify({ jobId }), {
       status: 202 // Accepted
     })
   })
   ```

### Issue: Memory Limit Exceeded

**Symptoms:**
```
Error: Function exceeded memory limit
Deno process killed
```

**Solutions:**

1. **Stream large files**
   ```typescript
   // ❌ Loading entire file
   const file = await Deno.readFile('large.json')
   
   // ✅ Streaming
   const file = await Deno.open('large.json')
   for await (const chunk of file.readable) {
     // Process chunk
   }
   ```

2. **Clear unused references**
   ```typescript
   // Process in batches
   async function processBatches(items: any[]) {
     const batchSize = 100
     
     for (let i = 0; i < items.length; i += batchSize) {
       const batch = items.slice(i, i + batchSize)
       await processBatch(batch)
       
       // Clear references
       batch.length = 0
       
       // Allow garbage collection
       await new Promise(resolve => setTimeout(resolve, 10))
     }
   }
   ```

### Issue: Cold Start Performance

**Symptoms:**
```
First request takes 5-10 seconds
Subsequent requests are fast
```

**Solutions:**

1. **Minimize global scope**
   ```typescript
   // ❌ Heavy initialization in global scope
   const heavyClient = await initializeHeavyClient()
   
   serve(async (req) => {
     // Use heavyClient
   })
   
   // ✅ Lazy initialization
   let heavyClient: HeavyClient | null = null
   
   serve(async (req) => {
     if (!heavyClient) {
       heavyClient = await initializeHeavyClient()
     }
     // Use heavyClient
   })
   ```

2. **Implement warming**
   ```yaml
   # GitHub Action to warm functions
   name: Warm Functions
   on:
     schedule:
       - cron: '*/15 * * * *' # Every 15 minutes
   
   jobs:
     warm:
       runs-on: ubuntu-latest
       steps:
         - name: Warm functions
           run: |
             curl https://your-project.supabase.co/functions/v1/your-function/health
   ```

## Database Connection Issues

### Issue: Connection Pool Exhausted

**Symptoms:**
```
Error: remaining connection slots are reserved
Error: too many clients already
```

**Solutions:**

1. **Use connection pooling**
   ```typescript
   // Global connection pool
   import postgres from "https://deno.land/x/postgresjs/mod.js"
   
   const sql = postgres(Deno.env.get('DATABASE_URL')!, {
     max: 20,         // Max connections
     idle_timeout: 20,
     connect_timeout: 10,
   })
   
   // Use in function
   serve(async (req) => {
     const result = await sql`SELECT * FROM users LIMIT 10`
     return new Response(JSON.stringify(result))
   })
   ```

2. **Use Supabase client (recommended)**
   ```typescript
   // Supabase handles pooling
   const supabase = createClient(
     Deno.env.get('SUPABASE_URL')!,
     Deno.env.get('SUPABASE_ANON_KEY')!
   )
   ```

### Issue: RLS Policies Blocking Access

**Symptoms:**
```
Error: new row violates row-level security policy
Empty results when data exists
```

**Solutions:**

1. **Use service role for admin operations**
   ```typescript
   // Admin client bypasses RLS
   const supabaseAdmin = createClient(
     Deno.env.get('SUPABASE_URL')!,
     Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
     {
       auth: {
         persistSession: false
       }
     }
   )
   ```

2. **Pass user context**
   ```typescript
   // User client respects RLS
   const supabaseUser = createClient(
     Deno.env.get('SUPABASE_URL')!,
     Deno.env.get('SUPABASE_ANON_KEY')!,
     {
       global: {
         headers: {
           Authorization: req.headers.get('Authorization')!
         }
       }
     }
   )
   ```

## Third-Party Integration Issues

### Issue: External API Rate Limits

**Symptoms:**
```
Error: 429 Too Many Requests
Error: Rate limit exceeded
```

**Solutions:**

1. **Implement rate limiting**
   ```typescript
   class RateLimiter {
     private requests: Map<string, number[]> = new Map()
     
     constructor(
       private windowMs: number,
       private maxRequests: number
     ) {}
     
     async checkLimit(key: string): Promise<boolean> {
       const now = Date.now()
       const requests = this.requests.get(key) || []
       
       // Remove old requests
       const recent = requests.filter(time => now - time < this.windowMs)
       
       if (recent.length >= this.maxRequests) {
         return false
       }
       
       recent.push(now)
       this.requests.set(key, recent)
       return true
     }
   }
   
   const limiter = new RateLimiter(60000, 10) // 10 per minute
   ```

2. **Implement retry with backoff**
   ```typescript
   async function retryWithBackoff<T>(
     fn: () => Promise<T>,
     maxRetries = 3
   ): Promise<T> {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await fn()
       } catch (error) {
         if (i === maxRetries - 1) throw error
         
         const delay = Math.min(1000 * Math.pow(2, i), 10000)
         await new Promise(resolve => setTimeout(resolve, delay))
       }
     }
     throw new Error('Max retries exceeded')
   }
   ```

### Issue: Webhook Signature Verification Failed

**Symptoms:**
```
Error: Invalid webhook signature
Error: Signature verification failed
```

**Solution:**
```typescript
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts"

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  // Timing-safe comparison
  if (signature.length !== expectedSignature.length) {
    return false
  }
  
  let match = true
  for (let i = 0; i < signature.length; i++) {
    if (signature[i] !== expectedSignature[i]) {
      match = false
    }
  }
  
  return match
}

serve(async (req) => {
  const signature = req.headers.get('x-webhook-signature')
  const body = await req.text()
  
  if (!verifyWebhookSignature(body, signature!, Deno.env.get('WEBHOOK_SECRET')!)) {
    return new Response('Invalid signature', { status: 401 })
  }
  
  // Process webhook
})
```

## Debugging Tools & Techniques

### Enhanced Logging

```typescript
interface LogContext {
  requestId: string
  functionName: string
  userId?: string
  [key: string]: any
}

class Logger {
  constructor(private context: LogContext) {}
  
  private log(level: string, message: string, data?: any) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...data
    }))
  }
  
  info(message: string, data?: any) {
    this.log('info', message, data)
  }
  
  error(message: string, error?: any) {
    this.log('error', message, {
      error: error?.message,
      stack: error?.stack,
      ...error
    })
  }
  
  time(label: string) {
    console.time(`${this.context.requestId}:${label}`)
  }
  
  timeEnd(label: string) {
    console.timeEnd(`${this.context.requestId}:${label}`)
  }
}

// Usage
serve(async (req) => {
  const requestId = crypto.randomUUID()
  const logger = new Logger({
    requestId,
    functionName: 'my-function'
  })
  
  logger.info('Request received', {
    method: req.method,
    url: req.url
  })
  
  try {
    logger.time('processing')
    const result = await processRequest(req)
    logger.timeEnd('processing')
    
    logger.info('Request completed')
    return new Response(JSON.stringify(result))
  } catch (error) {
    logger.error('Request failed', error)
    throw error
  }
})
```

### Request/Response Debugging

```typescript
// Debug middleware
async function debugMiddleware(req: Request, handler: (req: Request) => Promise<Response>) {
  // Clone request for debugging
  const debugReq = req.clone()
  const body = await debugReq.text()
  
  console.log('🔵 REQUEST', {
    url: req.url,
    method: req.method,
    headers: Object.fromEntries(req.headers),
    body: body ? JSON.parse(body) : null
  })
  
  const response = await handler(req)
  
  // Clone response for debugging
  const debugRes = response.clone()
  const resBody = await debugRes.text()
  
  console.log('🟢 RESPONSE', {
    status: response.status,
    headers: Object.fromEntries(response.headers),
    body: resBody ? JSON.parse(resBody) : null
  })
  
  return response
}

// Usage
serve((req) => debugMiddleware(req, handleRequest))
```

### Performance Profiling

```typescript
class PerformanceTracker {
  private marks: Map<string, number> = new Map()
  
  mark(name: string) {
    this.marks.set(name, performance.now())
  }
  
  measure(name: string, startMark: string, endMark?: string) {
    const start = this.marks.get(startMark)
    const end = endMark ? this.marks.get(endMark) : performance.now()
    
    if (!start) return
    
    const duration = end! - start
    console.log(`⏱ ${name}: ${duration.toFixed(2)}ms`)
    
    return duration
  }
  
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    try {
      return await fn()
    } finally {
      const duration = performance.now() - start
      console.log(`⏱ ${name}: ${duration.toFixed(2)}ms`)
    }
  }
}

// Usage
const perf = new PerformanceTracker()

perf.mark('request-start')
const data = await perf.measureAsync('database-query', async () => {
  return await supabase.from('users').select('*')
})
perf.measure('total-request', 'request-start')
```

## Common Error Messages

### Quick Reference Table

| Error Message | Likely Cause | Solution |
|---------------|--------------|----------|
| `Module not found` | Import URL issue | Clear Deno cache |
| `Function not found` | Missing function | Check function name/structure |
| `Invalid access token` | Auth expired | Re-authenticate with `supabase login` |
| `Connection slots reserved` | DB connection limit | Use connection pooling |
| `CORS policy blocked` | Missing CORS headers | Add proper CORS headers |
| `Rate limit exceeded` | Too many requests | Implement rate limiting |
| `Function size exceeds limit` | Bundle too large | Optimize imports |
| `Timeout exceeded` | Long operation | Implement async processing |
| `Invalid signature` | Webhook auth fail | Check signature algorithm |
| `RLS policy violation` | Permission denied | Use service role or fix policy |

## Emergency Procedures

### Function Rollback

```bash
#!/bin/bash
# emergency-rollback.sh

FUNCTION=$1
COMMIT=$2

if [ -z "$FUNCTION" ] || [ -z "$COMMIT" ]; then
    echo "Usage: ./emergency-rollback.sh <function-name> <commit-hash>"
    exit 1
fi

echo "🚑 Emergency rollback for $FUNCTION to $COMMIT"

# Checkout previous version
git checkout $COMMIT -- supabase/functions/$FUNCTION

# Deploy immediately
supabase functions deploy $FUNCTION --project-ref $PRODUCTION_PROJECT_REF

# Verify
curl -f https://your-project.supabase.co/functions/v1/$FUNCTION/health || exit 1

echo "✅ Rollback complete"
```

### Disable Function

```typescript
// Add kill switch to function
serve(async (req) => {
  // Check kill switch
  const { data: config } = await supabase
    .from('function_config')
    .select('enabled')
    .eq('name', 'my-function')
    .single()
  
  if (!config?.enabled) {
    return new Response('Function temporarily disabled', {
      status: 503,
      headers: {
        'Retry-After': '3600' // 1 hour
      }
    })
  }
  
  // Normal processing
})
```

### Emergency Contacts

```typescript
// Alert on critical errors
async function alertOnError(error: Error, context: any) {
  if (error.message.includes('CRITICAL')) {
    // Send to monitoring service
    await fetch('https://monitoring.example.com/alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: 'edge-functions',
        error: error.message,
        context,
        timestamp: new Date().toISOString()
      })
    })
  }
}
```

## Best Practices Summary

1. **Always handle errors gracefully** - Never expose internal errors to users
2. **Log everything important** - Use structured logging for easier debugging
3. **Monitor performance** - Track execution times and resource usage
4. **Test error scenarios** - Include error cases in your test suite
5. **Document issues** - Keep a log of resolved issues for future reference
6. **Have rollback plans** - Be prepared to revert quickly if needed
7. **Use health checks** - Implement health endpoints for monitoring
8. **Rate limit external calls** - Protect against API limit breaches
9. **Cache when possible** - Reduce load on external services
10. **Keep functions focused** - Single responsibility for easier debugging

For development setup, see [DEVELOPMENT-GUIDE.md](./DEVELOPMENT-GUIDE.md)
For deployment help, see [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)