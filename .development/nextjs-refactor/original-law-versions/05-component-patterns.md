# Component Patterns and Best Practices

## Immutable Component Laws

### 1. Server vs Client Components

#### Server Components (Default)
```typescript
// ✅ Server Component - No 'use client' directive
interface Event {
  id: string
  title: string
  date: string
}

export default async function EventList(): Promise<React.ReactElement> {
  const events = await fetchEvents() // Direct data fetching with typed response
  
  return (
    <div>
      {events.map((event: Event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  )
}
```

#### Client Components (Only When Needed)
```typescript
'use client' // Explicit directive required

import { useState, type ChangeEvent } from 'react'

interface InteractiveFormProps {
  initialValue?: string
  onSubmit?: (value: string) => void
}

export function InteractiveForm({ 
  initialValue = '', 
  onSubmit 
}: InteractiveFormProps): React.ReactElement {
  const [value, setValue] = useState<string>(initialValue)
  
  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setValue(e.target.value)
  }
  
  return (
    <input value={value} onChange={handleChange} />
  )
}
```

### 2. Component Structure Patterns

#### Pattern 1: Container/Presentation Separation
```typescript
// EventListContainer.tsx (Server Component)
import type { Event } from '@/types/event'

export default async function EventListContainer(): Promise<React.ReactElement> {
  const events = await fetchEvents()
  return <EventListView events={events} />
}

// EventListView.tsx (Can be Server Component)
interface EventListViewProps {
  events: Event[]
  className?: string
}

export function EventListView({ events, className }: EventListViewProps): React.ReactElement {
  return (
    <div className="grid gap-4">
      {events.map(event => <EventCard key={event.id} event={event} />)}
    </div>
  )
}
```

#### Pattern 2: Compound Components
```typescript
// Card.tsx
export function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg shadow">{children}</div>
}

Card.Header = function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="p-4 border-b">{children}</div>
}

Card.Body = function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="p-4">{children}</div>
}

// Usage
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
</Card>
```

### 3. Props and Type Patterns

#### Always Define Explicit Props Types
```typescript
// ❌ Bad
export function Button(props: any) {
  return <button {...props} />
}

// ✅ Good
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  children: React.ReactNode
  disabled?: boolean
}

export function Button({ 
  variant = 'primary',
  size = 'md',
  children,
  ...props 
}: ButtonProps) {
  return (
    <button className={cn(variants[variant], sizes[size])} {...props}>
      {children}
    </button>
  )
}
```

### 4. Hook Patterns

#### Custom Hook Structure
```typescript
// hooks/useEventData.ts
export function useEventData(eventId: string) {
  const [data, setData] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchEvent(eventId)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [eventId])

  return { data, loading, error }
}
```

### 5. Form Component Patterns

#### Controlled Form Pattern
```typescript
'use client'

interface FormData {
  name: string
  email: string
}

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: ''
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    // Handle submission
  }

  const handleChange = (field: keyof FormData) => (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.name}
        onChange={handleChange('name')}
        placeholder="Name"
      />
      <input
        value={formData.email}
        onChange={handleChange('email')}
        placeholder="Email"
        type="email"
      />
      <button type="submit">Submit</button>
    </form>
  )
}
```

### 6. Loading and Error States

#### Consistent Loading Pattern
```typescript
// loading.tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner />
    </div>
  )
}

// Component with loading state
export function DataComponent() {
  const { data, loading, error } = useData()

  if (loading) return <LoadingSkeleton />
  if (error) return <ErrorMessage error={error} />
  if (!data) return <EmptyState />

  return <DataView data={data} />
}
```

### 7. Component Composition Rules

#### Rule 1: Single Responsibility
Each component should do one thing well

#### Rule 2: Composition Over Inheritance
Use component composition instead of inheritance

#### Rule 3: Props Drilling Prevention
Use composition or context for deeply nested props

```typescript
// ❌ Bad - Props Drilling
<Parent user={user}>
  <Child user={user}>
    <GrandChild user={user} />
  </Child>
</Parent>

// ✅ Good - Composition
<Parent>
  <Child>
    <UserContext.Provider value={user}>
      <GrandChild />
    </UserContext.Provider>
  </Child>
</Parent>
```

### 8. Component Naming Conventions

1. **PascalCase** for components: `EventCard`, `UserProfile`
2. **Descriptive names**: `NavigationMenu` not `Menu`
3. **Action-based for handlers**: `handleClick`, `onSubmit`
4. **Boolean props with is/has**: `isLoading`, `hasError`
5. **Index files for exports**: Use `index.tsx` for cleaner imports

### 9. Performance Patterns

#### Memoization When Necessary
```typescript
'use client'

import { memo, useMemo } from 'react'

// Memoize expensive computations
export function ExpensiveComponent({ data }: { data: Item[] }) {
  const processedData = useMemo(() => 
    data.map(item => processItem(item)), 
    [data]
  )

  return <DisplayComponent data={processedData} />
}

// Memoize components to prevent unnecessary re-renders
export const OptimizedChild = memo(function OptimizedChild({ value }: { value: string }) {
  return <div>{value}</div>
})
```

### 10. Component Testing Pattern

```typescript
// EventCard.test.tsx
import { render, screen } from '@testing-library/react'
import { EventCard } from './EventCard'

describe('EventCard', () => {
  it('renders event title', () => {
    const event = { id: '1', title: 'Test Event' }
    render(<EventCard event={event} />)
    expect(screen.getByText('Test Event')).toBeInTheDocument()
  })
})
```

### 11. Accessibility Patterns

Always include proper ARIA labels and semantic HTML:

```typescript
export function Modal({ isOpen, onClose, children }: ModalProps) {
  return (
    <dialog
      open={isOpen}
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <button
        onClick={onClose}
        aria-label="Close modal"
        className="absolute top-4 right-4"
      >
        <X className="w-4 h-4" />
      </button>
      {children}
    </dialog>
  )
}