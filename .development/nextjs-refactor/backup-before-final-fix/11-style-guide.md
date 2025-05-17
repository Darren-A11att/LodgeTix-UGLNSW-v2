# Next.js Development Style Guide

## Comprehensive Style Guide for Consistent Development

### 1. Project Structure

```
project-root/
├── app/                        # Next.js App Router
│   ├── (routes)/              # Route groups
│   ├── api/                   # API routes
│   └── _components/           # Global components
├── lib/                       # Utilities and services
├── shared/                    # Shared types and constants
├── public/                    # Static assets
├── tests/                     # Test files
└── docs/                      # Documentation
```

### 2. Naming Conventions

#### Files and Folders
- **Components**: PascalCase - `EventCard.tsx`
- **Utilities**: camelCase - `formatDate.ts`
- **Types**: PascalCase - `EventTypes.ts`
- **Constants**: UPPER_SNAKE_CASE - `API_ENDPOINTS.ts`
- **Hooks**: camelCase with 'use' prefix - `useEventData.ts`
- **Route folders**: kebab-case - `event-details`

#### Variables and Functions
```typescript
// ✅ Good
const eventTitle = 'Annual Conference'
const getUserById = (id: string) => {...}
const MAX_RETRY_ATTEMPTS = 3

// ❌ Bad
const event_title = 'Annual Conference'
const GetUserById = (id: string) => {...}
const maxRetryAttempts = 3
```

### 3. Component Structure

```typescript
// 1. Imports
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Event } from '@/shared/types'

// 2. Type definitions
interface EventCardProps {
  event: Event
  onSelect?: (event: Event) => void
}

// 3. Component definition
export function EventCard({ event, onSelect }: EventCardProps) {
  // 4. State declarations
  const [isLoading, setIsLoading] = useState(false)
  
  // 5. Hooks
  const router = useRouter()
  
  // 6. Effects
  useEffect(() => {
    // Effect logic
  }, [])
  
  // 7. Event handlers
  const handleClick = () => {
    onSelect?.(event)
  }
  
  // 8. Render logic
  if (isLoading) return <LoadingSpinner />
  
  return (
    <div onClick={handleClick}>
      {event.title}
    </div>
  )
}
```

### 4. TypeScript Usage

#### Always Prefer Interfaces Over Types for Objects
```typescript
// ✅ Good
interface User {
  id: string
  name: string
  email: string
}

// ❌ Avoid (unless needed for unions/intersections)
type User = {
  id: string
  name: string
  email: string
}
```

#### Use Type for Unions and Primitives
```typescript
// ✅ Good
type Status = 'pending' | 'active' | 'completed'
type UserId = string
type AsyncFunction<T> = () => Promise<T>
```

### 5. Import Organization

```typescript
// 1. React and Next.js imports
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

// 2. Third-party libraries
import { format } from 'date-fns'
import { z } from 'zod'

// 3. Local imports - absolute paths
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

// 4. Relative imports (if necessary)
import { formatDate } from './utils'

// 5. Type imports
import type { Event, User } from '@/shared/types'

// 6. Style imports
import styles from './EventCard.module.css'
```

### 6. Comments and Documentation

```typescript
/**
 * Formats an event date with optional time display
 * @param date - The date to format
 * @param includeTime - Whether to include time in output
 * @returns Formatted date string
 */
export function formatEventDate(date: Date, includeTime = false): string {
  // Implementation
}

// Use single-line comments for clarification
const isEligible = user.age >= 18 // Must be adult

// TODO: Implement error handling
// FIXME: Race condition when updating state
// NOTE: This is a temporary workaround
```

### 7. Error Handling

```typescript
// ✅ Good - Explicit error handling
try {
  const data = await fetchEvent(id)
  return { success: true, data }
} catch (error) {
  console.error('Failed to fetch event:', error)
  return { success: false, error: error.message }
}

// ✅ Good - Type-safe error handling
if (error instanceof ApiError) {
  return { error: error.message, code: error.code }
}
```

### 8. API and Data Fetching

```typescript
// ✅ Good - Consistent API structure
export async function fetchEvents({
  page = 1,
  limit = 10,
  category,
}: {
  page?: number
  limit?: number
  category?: string
}): Promise<ApiResponse<Event[]>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(category && { category })
  })
  
  const response = await fetch(`/api/events?${params}`)
  
  if (!response.ok) {
    throw new ApiError('Failed to fetch events', response.status)
  }
  
  return response.json()
}
```

### 9. Component Patterns

#### Container/Presentation Pattern
```typescript
// EventListContainer.tsx - Data fetching
export async function EventListContainer() {
  const events = await fetchEvents()
  return <EventListView events={events} />
}

// EventListView.tsx - Pure presentation
export function EventListView({ events }: { events: Event[] }) {
  return (
    <div>
      {events.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  )
}
```

### 10. State Management Patterns

```typescript
// ✅ Good - Colocated state
function EventSearch() {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Filters>({})
  
  // State is used only in this component
}

// ✅ Good - Lifted state when shared
function EventPage() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  
  return (
    <>
      <EventList onSelect={setSelectedEvent} />
      <EventDetails event={selectedEvent} />
    </>
  )
}
```

### 11. Performance Optimization

```typescript
// ✅ Good - Memoization when needed
const ExpensiveComponent = memo(({ data }: Props) => {
  const processedData = useMemo(
    () => expensiveOperation(data),
    [data]
  )
  
  return <div>{processedData}</div>
})

// ✅ Good - Lazy loading
const HeavyComponent = dynamic(
  () => import('./HeavyComponent'),
  { loading: () => <Skeleton /> }
)
```

### 12. Accessibility

```typescript
// ✅ Good - Semantic HTML and ARIA
<button
  onClick={handleSubmit}
  disabled={isLoading}
  aria-label="Submit event form"
  aria-busy={isLoading}
>
  {isLoading ? 'Submitting...' : 'Submit'}
</button>

// ✅ Good - Keyboard navigation
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
>
```

### 13. Testing Philosophy

```typescript
// ✅ Good - Test behavior, not implementation
it('displays error message when form submission fails', async () => {
  // Setup
  const errorMessage = 'Network error'
  mockSubmit.mockRejectedValue(new Error(errorMessage))
  
  // Act
  render(<EventForm />)
  fireEvent.click(screen.getByRole('button', { name: /submit/i }))
  
  // Assert
  await waitFor(() => {
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })
})
```

### 14. Git Commit Messages

```
# ✅ Good
feat: Add event filtering by category
fix: Correct date formatting in event cards
refactor: Extract event validation logic to utility
docs: Update API documentation for events endpoint
test: Add unit tests for event service
style: Format event components with prettier
chore: Update dependencies to latest versions

# ❌ Bad
Update files
Fix stuff
Changes
WIP
```

### 15. Code Review Checklist

- [ ] Follows naming conventions
- [ ] Has proper TypeScript types
- [ ] Includes error handling
- [ ] Has loading states
- [ ] Is accessible
- [ ] Has tests
- [ ] Updates relevant documentation
- [ ] No console.logs in production code
- [ ] Follows component structure
- [ ] Uses semantic HTML
- [ ] Handles edge cases
- [ ] Optimizes performance where needed

### Summary

This style guide ensures:
1. **Consistency** across the codebase
2. **Readability** for all team members
3. **Maintainability** for long-term development
4. **Type Safety** with proper TypeScript usage
5. **Performance** through best practices
6. **Accessibility** for all users
7. **Testability** with clear patterns

Follow these guidelines to maintain a high-quality, professional Next.js codebase.