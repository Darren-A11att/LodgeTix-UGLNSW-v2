# Routing Patterns and Best Practices

## Immutable Routing Laws

### 1. File-Based Routing Structure

#### Basic Route Structure
```
app/
├── page.tsx                    # /
├── about/
│   └── page.tsx               # /about
├── events/
│   ├── page.tsx               # /events
│   └── [id]/
│       ├── page.tsx           # /events/[id]
│       └── edit/
│           └── page.tsx       # /events/[id]/edit
```

### 2. Dynamic Routes

#### Single Dynamic Segment
```typescript
// app/events/[id]/page.tsx
export default function EventPage({ params }: { params: { id: string } }) {
  return <div>Event ID: {params.id}</div>
}
```

#### Multiple Dynamic Segments
```typescript
// app/events/[category]/[id]/page.tsx
export default function EventPage({ 
  params 
}: { 
  params: { category: string; id: string } 
}) {
  return (
    <div>
      Category: {params.category}
      Event ID: {params.id}
    </div>
  )
}
```

#### Catch-All Routes
```typescript
// app/docs/[...slug]/page.tsx
export default function DocPage({ 
  params 
}: { 
  params: { slug: string[] } 
}) {
  // /docs/getting-started/installation
  // params.slug = ['getting-started', 'installation']
  return <div>Path: {params.slug.join('/')}</div>
}
```

### 3. Route Groups

#### Organizational Groups (No URL Impact)
```
app/
├── (customer)/
│   ├── layout.tsx             # Shared customer layout
│   ├── events/
│   │   └── page.tsx          # /events
│   └── profile/
│       └── page.tsx          # /profile
├── (admin)/
│   ├── layout.tsx            # Shared admin layout
│   └── dashboard/
│       └── page.tsx          # /dashboard
```

### 4. Layouts

#### Root Layout (Required)
```typescript
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

#### Nested Layouts
```typescript
// app/events/layout.tsx
export default function EventsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <EventsHeader />
      {children}
      <EventsFooter />
    </div>
  )
}
```

### 5. Loading States

#### Route-Level Loading
```typescript
// app/events/loading.tsx
export default function Loading() {
  return <EventsLoadingSkeleton />
}
```

#### Streaming with Suspense
```typescript
// app/events/page.tsx
import { Suspense } from 'react'

export default function EventsPage() {
  return (
    <div>
      <h1>Events</h1>
      <Suspense fallback={<EventListSkeleton />}>
        <EventList />
      </Suspense>
    </div>
  )
}
```

### 6. Error Handling

#### Error Boundaries
```typescript
'use client'

// app/events/error.tsx
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

### 7. Not Found Pages

#### Route-Level 404
```typescript
// app/events/[id]/not-found.tsx
export default function NotFound() {
  return (
    <div>
      <h2>Event Not Found</h2>
      <p>Could not find the requested event.</p>
    </div>
  )
}
```

### 8. Route Handlers (API Routes)

#### GET Request
```typescript
// app/api/events/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const events = await fetchEvents()
  return NextResponse.json(events)
}
```

#### Dynamic API Routes
```typescript
// app/api/events/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const event = await fetchEvent(params.id)
  return NextResponse.json(event)
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const data = await request.json()
  const updated = await updateEvent(params.id, data)
  return NextResponse.json(updated)
}
```

### 9. Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check auth for admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const token = request.cookies.get('token')
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
}
```

### 10. Parallel Routes

```
app/
├── layout.tsx
├── page.tsx
├── @sidebar/
│   └── page.tsx
└── @content/
    └── page.tsx
```

```typescript
// app/layout.tsx
export default function Layout({
  children,
  sidebar,
  content,
}: {
  children: React.ReactNode
  sidebar: React.ReactNode
  content: React.ReactNode
}) {
  return (
    <div>
      <main>{children}</main>
      <aside>{sidebar}</aside>
      <section>{content}</section>
    </div>
  )
}
```

### 11. Route Navigation

#### Link Component
```typescript
import Link from 'next/link'

export function Navigation() {
  return (
    <nav>
      <Link href="/events">Events</Link>
      <Link href="/about">About</Link>
    </nav>
  )
}
```

#### Programmatic Navigation
```typescript
'use client'

import { useRouter } from 'next/navigation'

export function EventForm() {
  const router = useRouter()
  
  const handleSubmit = async () => {
    // Submit form
    router.push('/events')
  }
  
  return <form onSubmit={handleSubmit}>...</form>
}
```

### 12. URL Search Params

```typescript
// Reading search params in Server Components
export default function SearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const search = searchParams.q || ''
  return <div>Search results for: {search}</div>
}

// Client Components
'use client'

import { useSearchParams } from 'next/navigation'

export function SearchInput() {
  const searchParams = useSearchParams()
  const search = searchParams.get('q')
  
  return <input defaultValue={search || ''} />
}
```

### 13. Metadata

```typescript
// Static metadata
export const metadata = {
  title: 'Events',
  description: 'Browse upcoming events',
}

// Dynamic metadata
export async function generateMetadata({ params }: { params: { id: string } }) {
  const event = await fetchEvent(params.id)
  
  return {
    title: event.title,
    description: event.description,
  }
}
```

### 14. Route Protection Patterns

```typescript
// app/(admin)/layout.tsx
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()
  
  if (!user || user.role !== 'admin') {
    redirect('/login')
  }
  
  return <>{children}</>
}
```

### 15. Routing Best Practices

1. **Use Route Groups** for logical organization
2. **Implement Loading States** for better UX
3. **Handle Errors Gracefully** with error boundaries
4. **Use TypeScript** for route params
5. **Optimize with Static Generation** where possible
6. **Implement Proper 404 Pages**
7. **Use Middleware** for cross-cutting concerns
8. **Keep Routes Shallow** (max 3-4 levels)
9. **Name Routes Semantically**
10. **Implement Breadcrumbs** for deep navigation