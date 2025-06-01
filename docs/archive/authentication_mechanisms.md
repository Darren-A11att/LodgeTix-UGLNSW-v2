# Authentication Mechanisms

## Overview
LodgeTix-UGLNSW-v2 implements a multi-layered authentication system using Supabase Auth with support for both anonymous and authenticated users. The system ensures secure access while maintaining a smooth user experience for event registration.

## Authentication Providers

### 1. Supabase Authentication
- **Provider**: Supabase Auth (built on GoTrue)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Session Management**: JWT tokens with automatic refresh
- **Cookie Management**: Secure httpOnly cookies

### 2. Anonymous Authentication
- **Purpose**: Allow users to register for events without creating an account
- **Implementation**: `supabase.auth.signInAnonymously()`
- **Session Persistence**: Maintained across browser sessions
- **Upgrade Path**: Can convert to full account later

## Authentication Flow

### 1. Initial Registration Flow
```
User visits event page
    ↓
SessionGuard checks for existing session
    ↓
If no session → Create anonymous session
    ↓
User proceeds with registration
    ↓
Anonymous session persists throughout
```

### 2. Returning User Flow
```
User returns to site
    ↓
Middleware checks session cookies
    ↓
If valid session → Continue with existing session
If expired → Refresh tokens automatically
If no session → Create new anonymous session
```

## Key Components

### 1. AuthProvider (`/contexts/auth-provider.tsx`)
**Purpose**: Global authentication context for the application

**Features**:
- Session state management
- User object access
- Authentication methods (signIn, signOut)
- Automatic session refresh
- Auth state change listeners

**Key Methods**:
```typescript
interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any | null }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}
```

### 2. Middleware (`/middleware.ts`)
**Purpose**: Intercept all requests to manage sessions

**Functionality**:
- Updates session on every request
- Refreshes tokens if needed
- Sets secure cookies
- Excludes static assets and API routes

**Configuration**:
```typescript
matcher: [
  '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
]
```

### 3. SessionGuard Component
**Purpose**: Ensure users have a valid session before accessing registration

**Process**:
1. Check store for existing session flag
2. Verify actual Supabase session
3. Create anonymous session if needed
4. Show loading/error states
5. Allow access once session established

**States**:
- Loading: "Initializing registration..."
- Error: Shows retry button
- Success: Renders children

### 4. Turnstile Verification
**Purpose**: Bot protection before session creation

**API Endpoint**: `/api/verify-turnstile-and-anon-auth`

**Flow**:
1. Client requests Turnstile challenge
2. User completes challenge
3. Token sent to API for verification
4. If valid, client proceeds to create session

**Development Mode**:
- Accepts demo token: `XXXX.DUMMY.TOKEN.XXXX`
- Bypasses Cloudflare verification locally

## Supabase Client Configuration

### 1. Browser Client (`/utils/supabase/client.ts`)
- Used in client components
- Manages cookies automatically
- Handles token refresh

### 2. Server Client (`/utils/supabase/server.ts`)
- Used in Server Components
- Reads cookies from Next.js
- Read-only cookie access

### 3. Middleware Client (`/utils/supabase/middleware.ts`)
- Used in middleware
- Can read and write cookies
- Handles session updates

### 4. Admin Client (`/utils/supabase/admin.ts`)
- Service role key for admin operations
- Bypasses RLS
- Server-side only

## Session Management

### 1. Session Storage
**Client Side**:
- Stored in secure httpOnly cookies
- LocalStorage for registration state
- Zustand store for session flags

**Server Side**:
- Cookie-based session validation
- JWT token verification
- Database session records

### 2. Session Lifecycle
**Creation**:
- Anonymous: On first visit to registration
- Authenticated: On successful login

**Maintenance**:
- Automatic refresh before expiry
- Middleware updates on each request
- Client-side listeners for changes

**Expiration**:
- Default: 1 week for anonymous
- Configurable in Supabase dashboard
- Graceful handling of expired sessions

### 3. Registration Store Integration
```typescript
{
  anonymousSessionEstablished: boolean
  draftRecoveryHandled: boolean
  contactId: string // User ID from session
}
```

## Security Features

### 1. Row Level Security (RLS)
- Database-level access control
- Policies based on user ID
- Anonymous users have limited access
- Admin bypass for service operations

### 2. CORS and CSRF Protection
- Supabase handles CORS automatically
- CSRF tokens in forms
- Secure cookie attributes
- SameSite cookie policy

### 3. Token Security
- Short-lived access tokens (1 hour)
- Long-lived refresh tokens (1 week)
- Secure token storage
- Automatic rotation

### 4. Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CLOUDFLARE_TURNSTILE_SECRET_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
```

## API Authentication

### 1. Public APIs
- No authentication required
- Rate limiting applied
- Turnstile verification for sensitive operations

### 2. Protected APIs
- Require valid session
- Extract user from JWT
- Validate permissions
- Return 401 for unauthorized

### 3. Admin APIs
- Service role key required
- Server-side only
- Full database access
- Audit logging

## Error Handling

### 1. Authentication Errors
- Invalid credentials → Clear error message
- Session expired → Automatic refresh attempt
- Network error → Retry with exponential backoff
- Invalid token → Force re-authentication

### 2. User Feedback
- Loading states during auth operations
- Clear error messages
- Retry mechanisms
- Fallback options

## Best Practices

### 1. Session Validation
- Always verify session server-side
- Don't trust client-side state alone
- Use middleware for consistent checks
- Handle edge cases gracefully

### 2. Performance
- Cache session checks
- Minimize auth API calls
- Use optimistic UI updates
- Lazy load auth-dependent content

### 3. Security
- Never expose service role key
- Validate all user inputs
- Use HTTPS in production
- Regular security audits

## Migration and Upgrades

### 1. Anonymous to Authenticated
- Preserve registration data
- Link anonymous records to new account
- Smooth transition flow
- Email verification required

### 2. Account Management
- Password reset flow
- Email change process
- Account deletion
- Data export options

## Monitoring and Logging

### 1. Auth Events
- Login attempts
- Session creation/destruction
- Token refresh events
- Error tracking

### 2. Metrics
- Active sessions
- Authentication success rate
- Session duration
- Error frequency

## Future Enhancements

1. **Social Authentication**: Google, Facebook login
2. **Multi-factor Authentication**: SMS, TOTP
3. **Single Sign-On**: SAML integration
4. **Biometric Authentication**: WebAuthn support
5. **Enhanced Session Management**: Device tracking, concurrent session limits