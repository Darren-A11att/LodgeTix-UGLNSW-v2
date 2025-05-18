# Immutable Security Laws

## Core Principles

These are the non-negotiable security laws that MUST be followed in all Next.js development:

### Law 1: Zero Trust Architecture
- **NEVER** trust any input from any source
- Validate and sanitize all user inputs
- Verify authentication on every request
- Implement least privilege access

### Law 2: Defense in Depth
- Multiple security layers are mandatory
- Security at application AND infrastructure level
- Redundant security controls required
- Regular security audits and penetration testing

### Law 3: Secure by Default
- All new features must be secure by default
- Opt-in for risky operations
- Fail securely when errors occur
- Minimize attack surface area

### Law 4: Data Protection
- Encrypt sensitive data at rest and in transit
- Use industry-standard encryption algorithms
- Implement proper key management
- Follow data privacy regulations (GDPR, CCPA)

### Law 5: Authentication & Authorization
- Multi-factor authentication for sensitive operations
- Session management must be bulletproof
- Role-based access control (RBAC)
- Regular permission audits

### Law 6: Input Validation
- Whitelist validation approach only
- Validate on both client and server
- Parametrized queries for database access
- Content Security Policy (CSP) headers

### Law 7: Output Encoding
- Encode all output based on context
- Prevent XSS through proper escaping
- Use framework security features
- Regular security header reviews

### Law 8: Error Handling
- Never expose sensitive information in errors
- Log security events for monitoring
- Generic error messages to users
- Detailed logs for administrators only

### Law 9: Third-Party Security
- Audit all dependencies regularly
- Monitor for known vulnerabilities
- Implement dependency updates process
- Minimize third-party code usage

### Law 10: Security Monitoring
- Real-time security event monitoring
- Automated vulnerability scanning
- Incident response procedures
- Regular security training for developers

## Implementation Patterns

### Authentication Implementation
```typescript
// lib/auth/index.ts
import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { roles: true },
        });
        
        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }
        
        // Check if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error('Account is locked');
        }
        
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        
        if (!isPasswordValid) {
          // Increment failed attempts
          await prisma.user.update({
            where: { id: user.id },
            data: { 
              failedAttempts: { increment: 1 },
              lockedUntil: user.failedAttempts >= 4 
                ? new Date(Date.now() + 15 * 60 * 1000) // Lock for 15 minutes
                : null,
            },
          });
          throw new Error('Invalid credentials');
        }
        
        // Reset failed attempts on successful login
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            failedAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          },
        });
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles.map(r => r.name),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.roles = user.roles;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId;
        session.user.roles = token.roles;
      }
      return session;
    },
  },
};

// Password hashing utility
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Secure token generation
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

// CSRF token validation
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken;
}
```

### Input Validation
```typescript
// lib/validation/index.ts
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

// Common validation schemas
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .transform(val => val.toLowerCase())
  .refine(val => validator.isEmail(val), 'Invalid email format');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const phoneSchema = z
  .string()
  .refine(val => validator.isMobilePhone(val), 'Invalid phone number');

// Sanitization utilities
export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'],
  });
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9.-]/gi, '_')
    .replace(/^\.+/, '')
    .substring(0, 255);
}

// SQL injection prevention
export function escapeSQLIdentifier(identifier: string): string {
  return identifier.replace(/[^a-zA-Z0-9_]/g, '');
}

// XSS prevention
export function escapeHTML(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```

### Security Headers
```typescript
// middleware/security.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function securityMiddleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 
    'camera=(), microphone=(), geolocation=(), payment=()'
  );
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self'",
    "connect-src 'self' https://api.stripe.com",
    "frame-src 'self' https://js.stripe.com",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  // Strict Transport Security
  if (request.nextUrl.protocol === 'https:') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  return response;
}
```

### Rate Limiting
```typescript
// lib/security/rateLimiter.ts
import { Redis } from '@upstash/redis';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix?: string;
}

export class RateLimiter {
  constructor(
    private redis: Redis,
    private options: RateLimitOptions
  ) {}
  
  async checkLimit(identifier: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const key = `${this.options.keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.options.windowMs;
    
    // Remove old entries
    await this.redis.zremrangebyscore(key, 0, windowStart);
    
    // Count requests in current window
    const count = await this.redis.zcard(key);
    
    if (count >= this.options.max) {
      const oldestEntry = await this.redis.zrange(key, 0, 0, {
        withScores: true,
      });
      
      const resetTime = oldestEntry[0]
        ? Number(oldestEntry[0].score) + this.options.windowMs
        : now + this.options.windowMs;
      
      return {
        allowed: false,
        remaining: 0,
        resetTime,
      };
    }
    
    // Add current request
    await this.redis.zadd(key, now, `${now}-${Math.random()}`);
    await this.redis.expire(key, Math.ceil(this.options.windowMs / 1000));
    
    return {
      allowed: true,
      remaining: this.options.max - count - 1,
      resetTime: now + this.options.windowMs,
    };
  }
}

// API route rate limiting
export function withRateLimit(
  handler: NextApiHandler,
  options: RateLimitOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    keyPrefix: 'api',
  }
): NextApiHandler {
  const limiter = new RateLimiter(redis, options);
  
  return async (req, res) => {
    const identifier = req.headers['x-forwarded-for'] || 
                     req.socket.remoteAddress || 
                     'anonymous';
    
    const { allowed, remaining, resetTime } = await limiter.checkLimit(identifier);
    
    res.setHeader('X-RateLimit-Limit', options.max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTime);
    
    if (!allowed) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
      });
    }
    
    return handler(req, res);
  };
}
```

### CORS Configuration
```typescript
// lib/security/cors.ts
import Cors from 'cors';

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'https://lodgetix.com',
];

export const cors = Cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-CSRF-Token',
    'X-Request-ID',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours
});

// Middleware wrapper
export function withCORS(handler: NextApiHandler): NextApiHandler {
  return async (req, res) => {
    await new Promise((resolve, reject) => {
      cors(req, res, (result) => {
        if (result instanceof Error) {
          return reject(result);
        }
        return resolve(result);
      });
    });
    
    return handler(req, res);
  };
}
```

### Data Encryption
```typescript
// lib/security/encryption.ts
import crypto from 'crypto';

export class Encryption {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;
  
  constructor(key: string) {
    this.key = crypto.scryptSync(key, 'salt', 32);
  }
  
  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }
  
  decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  hashWithSalt(text: string, salt: string): string {
    return crypto
      .pbkdf2Sync(text, salt, 100000, 64, 'sha512')
      .toString('hex');
  }
  
  generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }
}

// Usage for sensitive data
export const encryption = new Encryption(process.env.ENCRYPTION_KEY!);
```

### Session Security
```typescript
// lib/security/session.ts
import { SessionOptions } from 'iron-session';

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'lodgetix-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  },
};

declare module 'iron-session' {
  interface IronSessionData {
    user?: {
      id: string;
      email: string;
      roles: string[];
    };
    csrfToken?: string;
  }
}

// CSRF token generation
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Session validation
export function validateSession(session: IronSessionData): boolean {
  if (!session.user) return false;
  
  // Additional validation logic
  const sessionAge = Date.now() - session.createdAt;
  const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
  
  return sessionAge < maxAge;
}
```

### Security Monitoring
```typescript
// lib/security/monitoring.ts
interface SecurityEvent {
  type: 'auth_failure' | 'rate_limit' | 'invalid_input' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ip?: string;
  userAgent?: string;
  details: Record<string, any>;
  timestamp: Date;
}

export class SecurityMonitor {
  async logEvent(event: SecurityEvent): Promise<void> {
    // Log to security monitoring service
    await fetch('/api/security/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    
    // Alert on critical events
    if (event.severity === 'critical') {
      await this.sendAlert(event);
    }
  }
  
  private async sendAlert(event: SecurityEvent): Promise<void> {
    // Send to alerting service
    console.error('CRITICAL SECURITY EVENT:', event);
  }
}

export const securityMonitor = new SecurityMonitor();
```

## Enforcement

These laws are enforced through:
1. Security linting (ESLint security plugin)
2. Dependency vulnerability scanning
3. Regular security audits
4. Penetration testing
5. Security training requirements

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)