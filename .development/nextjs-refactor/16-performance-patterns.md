# Performance Patterns and Optimization

## Immutable Performance Laws

### 1. Image Optimization

#### Always Use Next.js Image Component
```typescript
import Image from 'next/image'

// ✅ Good: Optimized image loading
export function EventCard({ event }: { event: Event }) {
  return (
    <div>
      <Image
        src={event.imageUrl}
        alt={event.title}
        width={300}
        height={200}
        placeholder="blur"
        blurDataURL={event.blurDataURL}
        loading="lazy"
      />
    </div>
  )
}

// ❌ Bad: Unoptimized image
export function BadEventCard({ event }: { event: Event }) {
  return <img src={event.imageUrl} alt={event.title} />
}
```

### 2. Bundle Size Optimization

#### Dynamic Imports for Code Splitting
```typescript
import dynamic from 'next/dynamic'

// Load heavy component only when needed
const RichTextEditor = dynamic(() => import('./RichTextEditor'), {
  loading: () => <EditorSkeleton />,
  ssr: false // Disable SSR for client-only components
})

export function EventForm() {
  const [showEditor, setShowEditor] = useState(false)
  
  return (
    <div>
      <button onClick={() => setShowEditor(true)}>
        Add Description
      </button>
      {showEditor && <RichTextEditor />}
    </div>
  )
}
```

### 3. Component Memoization

#### Using React.memo
```typescript
// ✅ Good: Memoized component prevents unnecessary re-renders
const EventCard = memo(function EventCard({ event }: { event: Event }) {
  return (
    <div>
      <h3>{event.title}</h3>
      <p>{event.description}</p>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function
  return prevProps.event.id === nextProps.event.id &&
         prevProps.event.updatedAt === nextProps.event.updatedAt
})
```

#### Using useMemo and useCallback
```typescript
'use client'

export function EventList({ events }: { events: Event[] }) {
  // Memoize expensive computations
  const sortedEvents = useMemo(() => 
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [events]
  )
  
  // Memoize callbacks to prevent child re-renders
  const handleEventClick = useCallback((eventId: string) => {
    router.push(`/events/${eventId}`)
  }, [router])
  
  return (
    <div>
      {sortedEvents.map(event => (
        <EventCard
          key={event.id}
          event={event}
          onClick={() => handleEventClick(event.id)}
        />
      ))}
    </div>
  )
}
```

### 4. List Virtualization

#### For Long Lists
```typescript
'use client'

import { FixedSizeList as List } from 'react-window'

export function VirtualEventList({ events }: { events: Event[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <EventCard event={events[index]} />
    </div>
  )
  
  return (
    <List
      height={600}
      itemCount={events.length}
      itemSize={100}
      width="100%"
    >
      {Row}
    </List>
  )
}
```

### 5. Font Optimization

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google'

// Optimize font loading
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
```

### 6. Script Optimization

```typescript
import Script from 'next/script'

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* Load non-critical scripts after page is interactive */}
        <Script
          src="https://www.googletagmanager.com/gtag/js"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GA_MEASUREMENT_ID');
          `}
        </Script>
      </body>
    </html>
  )
}
```

### 7. API Route Optimization

```typescript
// app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Implement pagination
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  
  // Cache the response
  const events = await getEvents({ page, limit })
  
  return NextResponse.json(events, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
    }
  })
}
```

### 8. Database Query Optimization

```typescript
// Use select to fetch only needed fields
export async function getEventList() {
  return await prisma.event.findMany({
    select: {
      id: true,
      title: true,
      date: true,
      thumbnail: true
      // Don't fetch description, content, etc. for list views
    },
    take: 10,
    orderBy: { date: 'desc' }
  })
}

// Use include wisely
export async function getEventWithVenue(id: string) {
  return await prisma.event.findUnique({
    where: { id },
    include: {
      venue: true // Only include when needed
    }
  })
}
```

### 9. Progressive Enhancement

```typescript
// Start with server-rendered content
export default async function EventsPage() {
  const events = await getEvents()
  
  return (
    <div>
      <EventList events={events} />
      <ClientSideFilters /> {/* Enhance with client-side features */}
    </div>
  )
}

// Client component for enhanced interactivity
'use client'

export function ClientSideFilters() {
  const [filters, setFilters] = useState({})
  
  // Only loads on client, doesn't block initial render
  return <FilterPanel onChange={setFilters} />
}
```

### 10. Lazy Loading Patterns

```typescript
'use client'

import { useInView } from 'react-intersection-observer'

export function LazyEventSection({ eventId }: { eventId: string }) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  })
  
  return (
    <div ref={ref}>
      {inView ? <EventDetails eventId={eventId} /> : <EventSkeleton />}
    </div>
  )
}
```

### 11. Prefetching Strategies

```typescript
import Link from 'next/link'

export function Navigation() {
  return (
    <nav>
      {/* Prefetch on hover (default) */}
      <Link href="/events">Events</Link>
      
      {/* Prefetch immediately */}
      <Link href="/popular" prefetch={true}>
        Popular
      </Link>
      
      {/* Don't prefetch */}
      <Link href="/admin" prefetch={false}>
        Admin
      </Link>
    </nav>
  )
}
```

### 12. Static Generation

```typescript
// Generate static pages at build time
export async function generateStaticParams() {
  const events = await getTopEvents(100)
  
  return events.map(event => ({
    id: event.id
  }))
}

export default async function EventPage({ params }: { params: { id: string } }) {
  const event = await getEvent(params.id)
  return <EventDetails event={event} />
}
```

### 13. Response Streaming

```typescript
// app/events/page.tsx
import { Suspense } from 'react'

// This component can start rendering immediately
export default function EventsPage() {
  return (
    <div>
      <h1>Events</h1>
      <Suspense fallback={<EventsSkeleton />}>
        <EventList /> {/* This streams in when ready */}
      </Suspense>
    </div>
  )
}

async function EventList() {
  const events = await fetchEvents() // This can take time
  return <EventGrid events={events} />
}
```

### 14. Client Hints and Responsive Images

```typescript
export function ResponsiveEventImage({ event }: { event: Event }) {
  return (
    <Image
      src={event.imageUrl}
      alt={event.title}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      fill
      style={{ objectFit: 'cover' }}
    />
  )
}
```

### 15. Performance Monitoring

```typescript
// app/layout.tsx
export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Monitor Core Web Vitals
    if (typeof window !== 'undefined') {
      import('web-vitals').then(({ getCLS, getFID, getLCP }) => {
        getCLS(console.log)
        getFID(console.log)
        getLCP(console.log)
      })
    }
  }, [])
  
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

### Performance Checklist

- [ ] Use Next.js Image component for all images
- [ ] Implement code splitting with dynamic imports
- [ ] Memoize expensive computations
- [ ] Virtualize long lists
- [ ] Optimize fonts with next/font
- [ ] Load scripts with appropriate strategy
- [ ] Implement proper caching headers
- [ ] Optimize database queries
- [ ] Use progressive enhancement
- [ ] Implement lazy loading
- [ ] Prefetch critical routes
- [ ] Use static generation where possible
- [ ] Stream responses for better perceived performance
- [ ] Provide responsive images
- [ ] Monitor performance metrics