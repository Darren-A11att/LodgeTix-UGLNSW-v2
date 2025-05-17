# Data Fetching Patterns

## Immutable Data Fetching Laws

### 1. Server Components for Data Fetching

#### Direct Fetching in Server Components
```typescript
// ✅ Preferred: Fetch directly in server components
export default async function EventsPage() {
  const events = await fetch('https://api.example.com/events', {
    cache: 'force-cache' // Default caching
  }).then(res => res.json())
  
  return (
    <div>
      {events.map(event => (
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
async function createEvent(formData: FormData) {
  'use server'
  
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  
  // Validate and save to database
  await db.event.create({
    data: { title, description }
  })
  
  revalidatePath('/events')
  redirect('/events')
}

export default function NewEventPage() {
  return (
    <form action={createEvent}>
      <input name="title" required />
      <textarea name="description" required />
      <button type="submit">Create Event</button>
    </form>
  )
}
```

### 6. API Route Handlers

```typescript
// app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const category = searchParams.get('category')
  
  const events = await db.event.findMany({
    where: category ? { category } : undefined
  })
  
  return NextResponse.json(events)
}

export async function POST(request: NextRequest) {
  const data = await request.json()
  
  const event = await db.event.create({ data })
  
  return NextResponse.json(event, { status: 201 })
}
```

### 7. Client-Side Data Fetching

#### When You MUST Use Client-Side Fetching
```typescript
'use client'

import { useEffect, useState } from 'react'

export function UserProfile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetch('/api/user/profile')
      .then(res => res.json())
      .then(setUser)
      .finally(() => setLoading(false))
  }, [])
  
  if (loading) return <ProfileSkeleton />
  
  return <ProfileView user={user} />
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
// With try-catch
export default async function EventPage({ params }: { params: { id: string } }) {
  try {
    const event = await fetchEvent(params.id)
    return <EventDetails event={event} />
  } catch (error) {
    notFound() // Show 404 page
  }
}

// With error boundaries
export default async function EventsPage() {
  const events = await fetchEvents() // Throws on error
  return <EventList events={events} />
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