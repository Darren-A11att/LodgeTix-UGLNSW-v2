# Task 003: Add Rate Limiting Middleware

**Priority**: Critical  
**Category**: Security  
**Dependencies**: None  
**Estimated Time**: 2 hours  

## Problem

The application has no rate limiting on critical endpoints, making it vulnerable to:
- Brute force attacks on authentication endpoints
- API abuse on payment endpoints
- Denial of service attacks
- Resource exhaustion from registration spam

## Critical Endpoints Requiring Protection

1. `/api/stripe/create-payment-intent` - Payment processing
2. `/api/registrations` - Registration creation
3. `/api/verify-turnstile-and-anon-auth` - Authentication
4. `/api/send-confirmation-email` - Email sending
5. `/organizer/login` - Admin login

## Solution

Implement rate limiting using a middleware approach with different limits for different endpoint types.

## Implementation Options

### Option 1: Edge Runtime Rate Limiting (Recommended)
Use Vercel Edge Middleware with upstash/ratelimit for distributed rate limiting.

### Option 2: Application-Level Rate Limiting
Use express-rate-limit or custom implementation with in-memory store.

## Implementation Steps

### 1. Install Dependencies

```bash
npm install @upstash/ratelimit @upstash/redis
```

### 2. Create Rate Limiter Utility

Create `lib/rate-limiter.ts`:

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Define rate limiters for different endpoint types
export const rateLimiters = {
  // Strict limit for payment endpoints
  payment: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 requests per minute
    analytics: true,
  }),
  
  // Moderate limit for registration
  registration: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "5 m"), // 10 requests per 5 minutes
    analytics: true,
  }),
  
  // Standard API limit
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1 m"), // 60 requests per minute
    analytics: true,
  }),
  
  // Strict limit for auth endpoints
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 attempts per 15 minutes
    analytics: true,
  }),
  
  // Email sending limit
  email: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "1 h"), // 3 emails per hour
    analytics: true,
  }),
};

// Helper to get client identifier
export function getClientId(request: Request): string {
  // Try to get real IP from headers
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  
  // Fallback to a hash of user agent + other headers
  const ua = request.headers.get("user-agent") || "unknown";
  const lang = request.headers.get("accept-language") || "unknown";
  return `${ua}-${lang}`.substring(0, 64);
}
```

### 3. Update Middleware

Update `middleware.ts`:

```typescript
import { rateLimiters, getClientId } from '@/lib/rate-limiter';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Determine which rate limiter to use
  let limiter = null;
  if (pathname.startsWith('/api/stripe/')) {
    limiter = rateLimiters.payment;
  } else if (pathname === '/api/registrations') {
    limiter = rateLimiters.registration;
  } else if (pathname.includes('/auth') || pathname.includes('/login')) {
    limiter = rateLimiters.auth;
  } else if (pathname.includes('/email')) {
    limiter = rateLimiters.email;
  } else if (pathname.startsWith('/api/')) {
    limiter = rateLimiters.api;
  }
  
  // Apply rate limiting if applicable
  if (limiter) {
    const clientId = getClientId(request);
    const { success, limit, reset, remaining } = await limiter.limit(clientId);
    
    if (!success) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': new Date(reset).toISOString(),
          'Retry-After': Math.floor((reset - Date.now()) / 1000).toString(),
        },
      });
    }
  }
  
  // Continue with existing middleware logic...
}

export const config = {
  matcher: [
    '/api/:path*',
    '/organizer/:path*',
    '/account/:path*',
  ],
};
```

### 4. Add Rate Limit Headers to Responses

Create middleware wrapper for API routes:

```typescript
export function withRateLimit(
  handler: NextApiHandler,
  limiterType: keyof typeof rateLimiters = 'api'
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const limiter = rateLimiters[limiterType];
    const clientId = getClientId(req);
    
    const { success, limit, reset, remaining } = await limiter.limit(clientId);
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', new Date(reset).toISOString());
    
    if (!success) {
      res.setHeader('Retry-After', Math.floor((reset - Date.now()) / 1000).toString());
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.floor((reset - Date.now()) / 1000),
      });
    }
    
    return handler(req, res);
  };
}
```

### 5. Update Environment Variables

Add to `.env.example`:

```bash
# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

## Alternative: In-Memory Rate Limiting

For development or if Redis is not available:

```typescript
import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, number[]>({
  max: 10000, // Maximum number of items
  ttl: 1000 * 60 * 15, // 15 minutes
});

export function inMemoryRateLimit(
  clientId: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  const timestamps = cache.get(clientId) || [];
  const recentTimestamps = timestamps.filter(t => t > windowStart);
  
  if (recentTimestamps.length >= limit) {
    return { success: false, remaining: 0 };
  }
  
  recentTimestamps.push(now);
  cache.set(clientId, recentTimestamps);
  
  return { 
    success: true, 
    remaining: limit - recentTimestamps.length 
  };
}
```

## Testing

1. Create test script to verify rate limiting:
   ```bash
   # Test payment endpoint
   for i in {1..10}; do
     curl -X POST http://localhost:3000/api/stripe/create-payment-intent \
       -H "Content-Type: application/json" \
       -d '{"amount": 1000, "currency": "usd"}'
     echo
   done
   ```

2. Verify 429 responses after limit exceeded
3. Check rate limit headers in responses
4. Test different client identification methods

## Monitoring

Add logging for rate limit violations:

```typescript
if (!success) {
  console.warn('Rate limit exceeded', {
    clientId,
    endpoint: pathname,
    limiterType,
    timestamp: new Date().toISOString(),
  });
}
```

## Security Considerations

- Use distributed rate limiting for production (Redis)
- Consider IP-based and user-based rate limiting
- Implement exponential backoff for repeated violations
- Monitor for patterns of abuse
- Consider CAPTCHA integration for repeated failures