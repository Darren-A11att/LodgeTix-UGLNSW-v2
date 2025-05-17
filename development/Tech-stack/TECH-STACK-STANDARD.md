# LodgeTix Tech Stack Standard

This document defines the official technology stack for LodgeTix. All development should adhere to these standards to ensure consistency, maintainability, and optimal performance.

## Core Framework

### Next.js 15.2.4 (App Router)
- **Purpose**: Full-stack React framework with server-side rendering
- **Why**: SEO optimization, file-based routing, built-in optimizations, server components
- **Where Used**: Entire application structure
- **Implementation**:
  - `/app` directory for App Router
  - Server Components by default
  - Client Components with `"use client"` directive
  - API routes in `/app/api/*`

### React 19
- **Purpose**: UI component library
- **Why**: Industry standard, large ecosystem, server component support
- **Where Used**: All UI components
- **Implementation**:
  - Functional components with hooks
  - Server Components for data fetching
  - Client Components for interactivity

### TypeScript 5
- **Purpose**: Type safety and developer experience
- **Why**: Catches errors at compile time, better IDE support, self-documenting code
- **Where Used**: Entire codebase (`.ts` and `.tsx` files)
- **Implementation**:
  - Strict mode enabled
  - Interface definitions for all data shapes
  - Type guards for runtime safety

## TypeScript Configuration

Our TypeScript configuration enforces maximum type safety:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    },
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## Type Patterns

### API Response Types
```typescript
// Consistent API response format
export type ApiResponse<T> = 
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: ApiError }

export interface ApiError {
  message: string
  code: string
  details?: unknown
}

// Usage
async function fetchEvent(id: string): Promise<ApiResponse<Event>> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return { success: true, data, error: null }
  } catch (error) {
    return { success: false, data: null, error: formatError(error) }
  }
}
```

### Discriminated Unions
```typescript
// State management with discriminated unions
type LoadingState<T> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'success'; data: T }

// Type guards
function isSuccess<T>(state: LoadingState<T>): state is { status: 'success'; data: T } {
  return state.status === 'success'
}

function isError<T>(state: LoadingState<T>): state is { status: 'error'; error: string } {
  return state.status === 'error'
}
```

### Branded Types
```typescript
// Type-safe IDs
type UserId = string & { __brand: 'UserId' }
type EventId = string & { __brand: 'EventId' }
type TicketId = string & { __brand: 'TicketId' }

// Constructor functions
export function UserId(id: string): UserId {
  return id as UserId
}

export function EventId(id: string): EventId {
  return id as EventId
}

export function TicketId(id: string): TicketId {
  return id as TicketId
}

// Usage prevents mixing IDs
function getTicketsForEvent(eventId: EventId): Promise<Ticket[]> {
  // TypeScript ensures you can't pass a UserId here
  return fetchTickets(eventId)
}
```

### Form Types
```typescript
// Generic form props
interface FormProps<T extends Record<string, any>> {
  initialValues: T
  onSubmit: (values: T) => Promise<void>
  validation: ZodType<T>
  isLoading?: boolean
}

// Event handler types
type ClickHandler = React.MouseEventHandler<HTMLButtonElement>
type SubmitHandler<T> = (data: T) => void | Promise<void>
type ChangeHandler<T = string> = (value: T) => void
```

## Styling

### TailwindCSS 3.4.17
- **Purpose**: Utility-first CSS framework
- **Why**: Rapid development, consistent design system, excellent performance
- **Where Used**: All component styling
- **Implementation**:
  - Utility classes directly in components
  - Custom theme in `tailwind.config.ts`
  - Masonic color scheme (Navy, Gold, Red)

### shadcn/ui
- **Purpose**: Component library built on Radix UI
- **Why**: Accessible, customizable, copy-paste components
- **Where Used**: All UI primitives (buttons, dialogs, forms)
- **Implementation**:
  - Components in `/components/ui/*`
  - Customized with Tailwind utilities
  - Consistent with design system

### PostCSS
- **Purpose**: CSS processing
- **Why**: Required for Tailwind, enables modern CSS features
- **Where Used**: Build pipeline
- **Implementation**: `postcss.config.mjs`

## State Management

### Zustand 5.0.4
- **Purpose**: Client-side state management
- **Why**: Simple API, TypeScript support, persistence
- **Where Used**: Registration flow, location data
- **Implementation**:
  - Store files in `/lib/*Store.ts`
  - Persisted state for draft recovery
  - Typed selectors and actions

### React Context API
- **Purpose**: Component tree state sharing
- **Why**: Built into React, perfect for auth state
- **Where Used**: Authentication provider
- **Implementation**: `/contexts/auth-provider.tsx`

## Database & Backend

### Supabase
- **Purpose**: PostgreSQL database with realtime subscriptions
- **Why**: Built-in auth, realtime updates, type generation
- **Where Used**: All data persistence
- **Implementation**:
  - Single client instance in `/lib/supabase-browser.ts`
  - TypeScript types from database schema
  - Row-level security policies

## Authentication

### Supabase Auth
- **Purpose**: User authentication and session management
- **Why**: Integrated with database, supports multiple providers
- **Where Used**: Login, registration, protected routes
- **Implementation**:
  - Auth context provider
  - Middleware for route protection
  - Session persistence

## Payment Processing

### Stripe
- **Purpose**: Payment processing
- **Why**: Industry standard, PCI compliance, excellent API
- **Where Used**: Ticket purchases, payment forms
- **Implementation**:
  - Server: `stripe` package for API calls
  - Client: `@stripe/react-stripe-js` for Elements
  - Webhook handling for payment events

## Forms & Validation

### React Hook Form 7.54.1
- **Purpose**: Form state management
- **Why**: Performance, minimal re-renders, great DX
- **Where Used**: All forms (registration, payment)
- **Implementation**:
  - Controller components for custom inputs
  - Integration with Zod validation

### Zod 3.24.1
- **Purpose**: Schema validation
- **Why**: TypeScript inference, composable schemas
- **Where Used**: Form validation, API validation
- **Implementation**:
  - Schema definitions near forms
  - Type inference for form data

## Icons

### Lucide React
- **Purpose**: Icon library
- **Why**: Consistent design, tree-shakeable, customizable
- **Where Used**: Throughout UI
- **Implementation**:
  - Direct imports: `import { Icon } from 'lucide-react'`
  - Consistent sizing with Tailwind classes

## Development Tools

### ESLint
- **Purpose**: Code linting
- **Why**: Maintains code quality, catches errors
- **Where Used**: Pre-commit hooks, CI/CD
- **Implementation**: Next.js built-in config

### Prettier (Recommended)
- **Purpose**: Code formatting
- **Why**: Consistent code style
- **Where Used**: Editor integration
- **Implementation**: `.prettierrc` configuration

## Testing

### Vitest 3.1.3
- **Purpose**: Unit testing framework
- **Why**: Fast, ESM support, Jest compatible, built-in TypeScript support
- **Where Used**: Component tests, utility tests, integration tests
- **Implementation**:
  - Test files: `*.test.ts(x)` or in `__tests__` directories
  - Coverage reports in `/coverage`
  - Minimum 80% code coverage requirement

### Testing Patterns
```typescript
// Component test example
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EventCard } from './event-card'

describe('EventCard', () => {
  const mockEvent = {
    id: '1',
    title: 'Grand Installation',
    date: '2024-12-01',
    location: 'Sydney'
  }

  it('should display event information', () => {
    render(<EventCard event={mockEvent} />)
    
    expect(screen.getByText('Grand Installation')).toBeInTheDocument()
    expect(screen.getByText('Sydney')).toBeInTheDocument()
  })

  it('should handle click events', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    render(<EventCard event={mockEvent} onClick={handleClick} />)
    
    await user.click(screen.getByRole('article'))
    expect(handleClick).toHaveBeenCalledWith(mockEvent)
  })
})

// Hook test example
import { renderHook, act } from '@testing-library/react'
import { useCounter } from './use-counter'

describe('useCounter', () => {
  it('should increment counter', () => {
    const { result } = renderHook(() => useCounter())
    
    expect(result.current.count).toBe(0)
    
    act(() => {
      result.current.increment()
    })
    
    expect(result.current.count).toBe(1)
  })
})
```

### Test Organization
```
/components/event-card/
  event-card.tsx
  event-card.test.tsx
  event-card.types.ts
  index.ts
  
/lib/utils/
  formatters.ts
  formatters.test.ts
  
/__tests__/
  integration/
    registration-flow.test.tsx
  e2e/
    checkout-process.test.ts
```

### Testing Best Practices
- Test user behavior, not implementation details
- Use Testing Library queries properly
- Mock external dependencies (API calls, modules)
- Test error states and edge cases
- Keep tests focused and isolated
- Use descriptive test names

## Error Tracking

### Sentry
- **Purpose**: Error monitoring and performance tracking
- **Why**: Production error visibility, performance insights
- **Where Used**: Client and server errors
- **Implementation**:
  - `@sentry/nextjs` integration
  - Source map uploads
  - User context tracking

## Performance Optimization

### Code Splitting
```typescript
// Dynamic imports for heavy components
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false // Disable SSR for client-only components
})

// Route-based code splitting happens automatically with Next.js
// Use dynamic imports for conditional components
function Dashboard({ showAnalytics }: { showAnalytics: boolean }) {
  const Analytics = showAnalytics 
    ? dynamic(() => import('./Analytics'))
    : () => null
    
  return (
    <div>
      <Overview />
      {showAnalytics && <Analytics />}
    </div>
  )
}
```

### Image Optimization
```typescript
import Image from 'next/image'

// Responsive images with blur placeholder
<Image
  src="/hero.jpg"
  alt="Event hero image"
  width={1200}
  height={600}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  placeholder="blur"
  blurDataURL={blurDataUrl}
  priority // for above-fold images
  quality={90} // 90 for photos, 100 for graphics
/>

// External images require configuration
<Image
  src={externalUrl}
  alt="External image"
  width={400}
  height={300}
  loader={({ src, width, quality }) => {
    return `${src}?w=${width}&q=${quality || 75}`
  }}
/>
```

### Data Fetching Patterns
```typescript
// Parallel data fetching in Server Components
export default async function EventPage({ params }: { params: { id: string } }) {
  // These requests happen in parallel
  const [event, tickets, reviews] = await Promise.all([
    fetchEvent(params.id),
    fetchTickets(params.id),
    fetchReviews(params.id)
  ])
  
  return <EventDetails event={event} tickets={tickets} reviews={reviews} />
}

// Request deduplication with cache
import { cache } from 'react'

const getUser = cache(async (id: string) => {
  const user = await db.user.findUnique({ where: { id } })
  return user
})

// Streaming with Suspense
import { Suspense } from 'react'

export default function Page() {
  return (
    <div>
      <Header />
      <Suspense fallback={<LoadingSkeleton />}>
        <SlowComponent />
      </Suspense>
    </div>
  )
}
```

### Optimization Techniques
- Use `loading.tsx` for instant navigation feedback
- Implement proper caching headers
- Minimize JavaScript bundle with tree shaking
- Use CSS-in-JS sparingly (prefer Tailwind)
- Lazy load below-the-fold content
- Prefetch critical resources

## Error Handling

### Error Boundaries
```typescript
// app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
      >
        Try again
      </button>
    </div>
  )
}

// Custom error boundary for specific components
import { ErrorBoundary } from 'react-error-boundary'

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div role="alert" className="p-4 border border-red-300 rounded">
      <p>Something went wrong:</p>
      <pre className="text-red-600">{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  )
}

<ErrorBoundary
  FallbackComponent={ErrorFallback}
  onError={(error, errorInfo) => {
    console.error('Error caught by boundary:', error, errorInfo)
  }}
>
  <ComponentThatMightError />
</ErrorBoundary>
```

### Try-Catch Patterns
```typescript
// Consistent error handling
export async function updateUser(id: string, data: UpdateUserInput): Promise<ApiResponse<User>> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .update(data)
      .eq('id', id)
      .single()

    if (error) throw error
    
    return { success: true, data: user, error: null }
  } catch (error) {
    console.error('Failed to update user:', error)
    return { 
      success: false, 
      data: null, 
      error: {
        message: 'Failed to update user',
        code: 'UPDATE_USER_ERROR',
        details: error
      }
    }
  }
}

// Async error handling in components
function MyComponent() {
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: FormData) => {
    setError(null)
    setIsLoading(true)
    
    try {
      await submitForm(data)
      toast.success('Form submitted successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(new Error(message))
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }
  
  if (error) {
    return <ErrorMessage error={error} />
  }
  
  return <Form onSubmit={handleSubmit} isLoading={isLoading} />
}
```

### Loading States
```typescript
// app/loading.tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  )
}

// Component-specific loading states
function DataList() {
  const { data, isLoading, error } = useQuery(['items'], fetchItems)
  
  if (isLoading) return <LoadingSkeleton />
  if (error) return <ErrorMessage error={error} />
  if (!data) return <EmptyState />
  
  return <ItemList items={data} />
}
```

## Package Management

### npm
- **Purpose**: Dependency management
- **Why**: Default Node.js package manager, widespread support
- **Where Used**: All package installation
- **Implementation**:
  - `package-lock.json` for dependency locking
  - Exact versions preferred

## File Structure Standards

```
/app              - Next.js App Router pages
/components       - React components
  /ui            - shadcn/ui components
  /register      - Registration flow components
/contexts        - React Context providers
/hooks           - Custom React hooks
/lib             - Utility functions and services
  /api           - API service modules
/shared          - Shared types and utilities
/public          - Static assets
```

## Coding Standards

### Components
- Functional components only
- Proper TypeScript interfaces for props
- Co-locate related components

### Naming Conventions
- PascalCase: Components, Types, Interfaces
- camelCase: Functions, variables, hooks
- kebab-case: File names, CSS classes
- UPPER_SNAKE_CASE: Constants

### Imports
- Absolute imports using `@/` prefix
- Organized by category with comments
- Type imports separate
- Auto-sorted with ESLint

```typescript
// Type imports first
import type { FC, ReactNode } from 'react'
import type { User } from '@/types/user'
import type { GetServerSideProps } from 'next'

// React imports
import { useState, useEffect, useMemo } from 'react'

// External packages
import { z } from 'zod'
import { format } from 'date-fns'
import clsx from 'clsx'

// Internal - absolute imports
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

// Internal - relative imports
import { EventCard } from './EventCard'
import { useEventData } from './hooks'
import styles from './styles.module.css'
```

### ESLint Import Rules
```json
{
  "rules": {
    "import/order": [
      "error",
      {
        "groups": [
          "type",
          ["builtin", "external"],
          "internal",
          ["parent", "sibling", "index"]
        ],
        "pathGroups": [
          {
            "pattern": "@/**",
            "group": "internal"
          }
        ],
        "newlines-between": "always",
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true
        }
      }
    ],
    "@typescript-eslint/consistent-type-imports": [
      "error",
      {
        "prefer": "type-imports"
      }
    ]
  }
}
```

## Environment Variables

### Naming Convention
- Server-only: `DATABASE_URL`, `STRIPE_SECRET_KEY`
- Client-side: `NEXT_PUBLIC_*` prefix
- All caps with underscores

### Required Variables
```env
# Database
NEXT_PUBLIC_SUPABASE_URL=(refer to .env)
NEXT_PUBLIC_SUPABASE_ANON_KEY=(refer to .env)

# Payments
STRIPE_SECRET_KEY=(refer to .env)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=(refer to .env)

# Error Tracking
SENTRY_DSN=(refer to .env)
```

## Deprecated Technologies

Do not use:
- ❌ React Router (use Next.js routing)
- ❌ React Icons (use Lucide React)
- ❌ Heroicons (use Lucide React)
- ❌ Headless UI (use shadcn/ui)
- ❌ Multiple Supabase clients
- ❌ CSS-in-JS (use Tailwind)

## Migration Guidelines

When updating or adding new technology:
1. Document the reasoning
2. Update this standard
3. Plan migration strategy
4. Update all relevant code
5. Remove old dependencies

## Version Management

- Pin exact versions for critical packages
- Use `~` for patch updates only
- Never use `latest` in package.json
- Regular dependency audits

This standard ensures consistency across the codebase and provides clear guidelines for all developers working on LodgeTix.