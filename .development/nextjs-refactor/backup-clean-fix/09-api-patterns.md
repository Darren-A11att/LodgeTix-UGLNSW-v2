# Data Fetching Patterns

## Immutable Data Fetching Laws

### 1. Server Components for Data Fetching

#### Direct Fetching in Server Components
```typescript
// ✅ Preferred: Fetch directly in server components
interface Event {
  id: string
  title: string
  date: string
}

type ApiResponse<T> = {
  data: T
  error?: string
}

async function fetchEvents(): Promise<Event[]> {
  const response = await fetch('https://api.example.com/events', {
    cache: 'force-cache' // Default caching
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  const result: ApiResponse<Event[]> = await response.json()
  return result.data
}

export default async function EventsPage() {
  const events = await fetchEvents()
  
  return (
    <div>
      {events.map((event: Event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  )
}
```

### 2. Fetch Caching Strategies

#### Static Data (Default)
```typescript
// This data is cached and reused across requests
const events = await fetch('https://api.example.com/events')
```

#### Dynamic Data
```typescript
// This data is fetched on every request
const events = await fetch('https://api.example.com/events', {
  cache: 'no-store'
})
```

#### Revalidated Data
```typescript
// This data is cached and revalidated every 60 seconds
const events = await fetch('https://api.example.com/events', {
  next: { revalidate: 60 }
})
```

### 3. Parallel Data Fetching

#### Sequential (Avoid)
```typescript
// ❌ Bad: Sequential fetching
export default async function Page() {
  const user = await fetchUser()
  const events = await fetchEvents() // Waits for user to complete
  
  return <div>...</div>
}
```

#### Parallel (Preferred)
```typescript
// ✅ Good: Parallel fetching
export default async function Page() {
  const [user, events] = await Promise.all([
    fetchUser(),
    fetchEvents()
  ])
  
  return <div>...</div>
}
```

### 4. Data Fetching with Suspense

```typescript
// app/events/page.tsx
import { Suspense } from 'react'

async function EventList() {
  const events = await fetchEvents()
  return <EventGrid events={events} />
}

export default function EventsPage() {
  return (
    <div>
      <h1>Events</h1>
      <Suspense fallback={<EventsSkeleton />}>
        <EventList />
      </Suspense>
    </div>
  )
}
```

### 5. Server Actions

#### Form Submission with Server Actions
```typescript
// app/events/new/page.tsx
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const createEventSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000)
})

type CreateEventResult = 
  | { success: true; event: Event }
  | { success: false; error: string }

async function createEvent(formData: FormData): Promise<CreateEventResult> {
  'use server'
  
  const parsed = createEventSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description')
  })
  
  if (!parsed.success) {
    return { success: false, error: parsed.error.message }
  }
  
  try {
    const event = await db.event.create({
      data: parsed.data
    })
    
    revalidatePath('/events')
    redirect(`/events/${event.id}`)
    
    // This won't be reached due to redirect
    return { success: true, event }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export default function NewEventPage() {
  return (
    <form action={createEvent}>
      <input name="title" required minLength={3} maxLength={100} />
      <textarea name="description" required minLength={10} maxLength={1000} />
      <button type="submit">Create Event</button>
    </form>
  )
}
```

### 6. API Route Handlers

```typescript
// app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

interface ApiResponse<T> {
  data?: T
  error?: string
  status: 'success' | 'error'
}

const createEventSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.string().datetime()
})

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Event[]>>> {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    
    const events = await db.event.findMany({
      where: category ? { category } : undefined
    })
    
    return NextResponse.json({
      status: 'success',
      data: events
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Event>>> {
  try {
    const body = await request.json()
    const parsed = createEventSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        {
          status: 'error',
          error: parsed.error.message
        },
        { status: 400 }
      )
    }
    
    const event = await db.event.create({ data: parsed.data })
    
    return NextResponse.json(
      {
        status: 'success',
        data: event
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
```

### 7. Client-Side Data Fetching

#### When You MUST Use Client-Side Fetching
```typescript
'use client'

import { useEffect, useState } from 'react'

type LoadingState<T> = 
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }

interface User {
  id: string
  name: string
  email: string
}

export function UserProfile() {
  const [state, setState] = useState<LoadingState<User>>({ status: 'loading' })
  
  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/user/profile')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const user: User = await response.json()
        setState({ status: 'success', data: user })
      } catch (error) {
        setState({ 
          status: 'error', 
          error: error instanceof Error ? error : new Error('Unknown error')
        })
      }
    }
    
    fetchUser()
  }, [])
  
  switch (state.status) {
    case 'loading':
      return <ProfileSkeleton />
    case 'error':
      return <ErrorMessage error={state.error} />
    case 'success':
      return <ProfileView user={state.data} />
  }
}
```

### 8. Data Fetching with Static Generation

```typescript
// Generate static params for dynamic routes
export async function generateStaticParams() {
  const events = await fetchEvents()
  
  return events.map(event => ({
    id: event.id.toString()
  }))
}

// Pre-render pages at build time
export default async function EventPage({ params }: { params: { id: string } }) {
  const event = await fetchEvent(params.id)
  
  return <EventDetails event={event} />
}
```

### 9. Incremental Static Regeneration

```typescript
// app/events/[id]/page.tsx
export const revalidate = 3600 // Revalidate every hour

export default async function EventPage({ params }: { params: { id: string } }) {
  const event = await fetchEvent(params.id)
  
  return <EventDetails event={event} />
}
```

### 10. Optimistic Updates

```typescript
'use client'

import { useOptimistic } from 'react'

export function LikeButton({ eventId, initialLikes }) {
  const [likes, setOptimisticLikes] = useOptimistic(
    initialLikes,
    (state, newLikes) => newLikes
  )
  
  async function handleLike() {
    setOptimisticLikes(likes + 1)
    await fetch(`/api/events/${eventId}/like`, { method: 'POST' })
  }
  
  return (
    <button onClick={handleLike}>
      Likes: {likes}
    </button>
  )
}
```

### 11. Data Revalidation Patterns

#### On-Demand Revalidation
```typescript
// Server Action
async function updateEvent(eventId: string, data: any) {
  'use server'
  
  await db.event.update({ where: { id: eventId }, data })
  
  // Revalidate specific paths
  revalidatePath(`/events/${eventId}`)
  revalidatePath('/events')
}
```

#### Tag-Based Revalidation
```typescript
// Fetch with tags
const events = await fetch('https://api.example.com/events', {
  next: { tags: ['events'] }
})

// Revalidate by tag
import { revalidateTag } from 'next/cache'

async function updateEvent() {
  'use server'
  // Update event...
  revalidateTag('events')
}
```

### 12. Error Handling in Data Fetching

```typescript
// Using Result type pattern
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

async function fetchEvent(id: string): Promise<Result<Event>> {
  try {
    const response = await fetch(`/api/events/${id}`)
    if (!response.ok) {
      return { 
        success: false, 
        error: new Error(`HTTP error! status: ${response.status}`)
      }
    }
    const event = await response.json()
    return { success: true, data: event }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}

export default async function EventPage({ params }: { params: { id: string } }) {
  const result = await fetchEvent(params.id)
  
  if (!result.success) {
    // Handle different error types
    if (result.error.message.includes('404')) {
      notFound()
    }
    throw result.error // Let error boundary handle
  }
  
  return <EventDetails event={result.data} />
}

// Type guard for API errors
interface ApiError extends Error {
  statusCode: number
  code: string
}

function isApiError(error: unknown): error is ApiError {
  return (
    error instanceof Error &&
    'statusCode' in error &&
    'code' in error
  )
}

// With specific error handling
export async function EventsPage() {
  try {
    const events = await fetchEvents()
    return <EventList events={events} />
  } catch (error) {
    if (isApiError(error)) {
      switch (error.statusCode) {
        case 401:
          redirect('/login')
        case 403:
          return <Forbidden />
        default:
          throw error
      }
    }
    throw error
  }
}
```

### 13. Loading States Best Practices

```typescript
// Granular loading states
export default function EventsPage() {
  return (
    <div>
      <Header />
      <Suspense fallback={<FiltersSkeleton />}>
        <Filters />
      </Suspense>
      <Suspense fallback={<EventGridSkeleton />}>
        <EventGrid />
      </Suspense>
    </div>
  )
}
```

### 14. Data Fetching Anti-Patterns

#### ❌ Fetching in Client Components When Not Needed
```typescript
'use client'
// Bad: This could be a server component
export function EventList() {
  const [events, setEvents] = useState([])
  
  useEffect(() => {
    fetch('/api/events').then(res => res.json()).then(setEvents)
  }, [])
  
  return <div>...</div>
}
```

#### ❌ Over-Fetching
```typescript
// Bad: Fetching entire user object when only need name
const user = await fetchUser()
return <span>{user.name}</span>
```

#### ❌ Waterfall Requests
```typescript
// Bad: Each request waits for the previous
const user = await fetchUser()
const events = await fetchUserEvents(user.id)
const venues = await fetchEventVenues(events)
```

### 15. Data Fetching Checklist

- [ ] Use Server Components for data fetching when possible
- [ ] Implement proper caching strategies
- [ ] Parallelize independent data fetches
- [ ] Use Suspense for better loading states
- [ ] Handle errors gracefully
- [ ] Implement optimistic updates for better UX
- [ ] Use appropriate revalidation strategies
- [ ] Avoid waterfall requests
- [ ] Consider static generation for performance
- [ ] Monitor and optimize fetch performance