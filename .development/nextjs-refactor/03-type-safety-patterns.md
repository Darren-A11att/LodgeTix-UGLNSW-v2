# Type Safety Patterns

## Immutable Type Safety Laws

### 1. Strict TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
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
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### 2. Component Props Types

#### Always Define Explicit Props
```typescript
// ❌ Bad: No type safety
export function EventCard(props: any) {
  return <div>{props.event.title}</div>
}

// ✅ Good: Full type safety
interface EventCardProps {
  event: Event
  onSelect?: (event: Event) => void
  variant?: 'default' | 'compact' | 'featured'
  className?: string
}

export function EventCard({ 
  event, 
  onSelect, 
  variant = 'default',
  className 
}: EventCardProps) {
  return (
    <div className={cn(variants[variant], className)}>
      <h3>{event.title}</h3>
      {onSelect && (
        <button onClick={() => onSelect(event)}>Select</button>
      )}
    </div>
  )
}
```

### 3. API Response Types

#### Type-Safe API Calls
```typescript
// types/api.ts
export interface ApiResponse<T> {
  data: T
  error: string | null
  status: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// lib/api/events.ts
export async function fetchEvents(): Promise<ApiResponse<Event[]>> {
  try {
    const response = await fetch('/api/events')
    const data = await response.json()
    
    return {
      data,
      error: null,
      status: response.status
    }
  } catch (error) {
    return {
      data: [],
      error: error.message,
      status: 500
    }
  }
}
```

### 4. Form Types with Zod

```typescript
import { z } from 'zod'

// Define schema
export const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  date: z.string().datetime(),
  venue: z.object({
    name: z.string(),
    address: z.string(),
    capacity: z.number().positive()
  }),
  tickets: z.array(z.object({
    type: z.enum(['general', 'vip', 'student']),
    price: z.number().positive(),
    quantity: z.number().int().positive()
  }))
})

// Infer types from schema
export type EventFormData = z.infer<typeof eventSchema>

// Type-safe form validation
export function validateEventForm(data: unknown): EventFormData {
  return eventSchema.parse(data)
}
```

### 5. Database Types

```typescript
// types/database.ts
export interface DbEvent {
  id: string
  title: string
  description: string
  date: Date
  createdAt: Date
  updatedAt: Date
  venueId: string
}

export interface DbVenue {
  id: string
  name: string
  address: string
  capacity: number
  events?: DbEvent[]
}

// Type mappers
export function mapDbEventToEvent(dbEvent: DbEvent): Event {
  return {
    id: dbEvent.id,
    title: dbEvent.title,
    description: dbEvent.description,
    date: dbEvent.date.toISOString(),
    createdAt: dbEvent.createdAt.toISOString(),
    updatedAt: dbEvent.updatedAt.toISOString()
  }
}
```

### 6. Route Parameters Types

```typescript
// Type-safe route params
interface EventPageProps {
  params: {
    id: string
  }
  searchParams: {
    preview?: string
    ticket?: string
  }
}

export default async function EventPage({ params, searchParams }: EventPageProps) {
  const isPreview = searchParams.preview === 'true'
  const event = await fetchEvent(params.id)
  
  return <EventDetails event={event} preview={isPreview} />
}

// Dynamic routes with catch-all
interface DocPageProps {
  params: {
    slug: string[]
  }
}

export default function DocPage({ params }: DocPageProps) {
  const path = params.slug.join('/')
  return <DocumentViewer path={path} />
}
```

### 7. Server Action Types

```typescript
// Type-safe server actions
import { z } from 'zod'

const createEventSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.string()
})

export async function createEvent(
  prevState: { message: string } | null,
  formData: FormData
): Promise<{ message: string; success: boolean }> {
  'use server'
  
  const validatedFields = createEventSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    date: formData.get('date')
  })
  
  if (!validatedFields.success) {
    return {
      message: 'Invalid form data',
      success: false
    }
  }
  
  try {
    await db.event.create({
      data: validatedFields.data
    })
    
    return {
      message: 'Event created successfully',
      success: true
    }
  } catch (error) {
    return {
      message: 'Failed to create event',
      success: false
    }
  }
}
```

### 8. Context Types

```typescript
// Type-safe context
interface AuthContextType {
  user: User | null
  loading: boolean
  error: Error | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateUser: (updates: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Type-safe hook
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

### 9. Generic Component Types

```typescript
// Generic list component
interface ListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  keyExtractor: (item: T) => string
  emptyMessage?: string
  className?: string
}

export function List<T>({ 
  items, 
  renderItem, 
  keyExtractor,
  emptyMessage = 'No items found',
  className 
}: ListProps<T>) {
  if (items.length === 0) {
    return <div className="text-gray-500">{emptyMessage}</div>
  }
  
  return (
    <ul className={className}>
      {items.map((item, index) => (
        <li key={keyExtractor(item)}>
          {renderItem(item, index)}
        </li>
      ))}
    </ul>
  )
}

// Usage
<List
  items={events}
  renderItem={(event) => <EventCard event={event} />}
  keyExtractor={(event) => event.id}
/>
```

### 10. Utility Types

```typescript
// Common utility types
export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type Maybe<T> = T | null | undefined

// Deep partial type
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Omit multiple keys
export type OmitMultiple<T, K extends keyof T> = Omit<T, K>

// Pick nullable
export type PickNullable<T, K extends keyof T> = {
  [P in K]: T[P] | null
}

// Async function type
export type AsyncFunction<T = void> = () => Promise<T>

// React component with children
export type PropsWithRequiredChildren<P = {}> = P & {
  children: React.ReactNode
}
```

### 11. Discriminated Unions

```typescript
// Type-safe state management
type LoadingState = {
  status: 'loading'
}

type ErrorState = {
  status: 'error'
  error: Error
}

type SuccessState<T> = {
  status: 'success'
  data: T
}

type DataState<T> = LoadingState | ErrorState | SuccessState<T>

export function useData<T>(fetcher: () => Promise<T>): DataState<T> {
  const [state, setState] = useState<DataState<T>>({ status: 'loading' })
  
  useEffect(() => {
    fetcher()
      .then(data => setState({ status: 'success', data }))
      .catch(error => setState({ status: 'error', error }))
  }, [])
  
  return state
}

// Type-safe consumption
function DataComponent() {
  const state = useData(fetchEvents)
  
  switch (state.status) {
    case 'loading':
      return <LoadingSpinner />
    case 'error':
      return <ErrorMessage error={state.error} />
    case 'success':
      return <EventList events={state.data} />
  }
}
```

### 12. Type Guards

```typescript
// Type guard functions
export function isEvent(obj: unknown): obj is Event {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'title' in obj &&
    'date' in obj
  )
}

export function isApiError(error: unknown): error is ApiError {
  return (
    error instanceof Error &&
    'statusCode' in error &&
    'message' in error
  )
}

// Usage
try {
  const data = await fetchData()
  if (isEvent(data)) {
    // TypeScript knows data is Event here
    console.log(data.title)
  }
} catch (error) {
  if (isApiError(error)) {
    // TypeScript knows error is ApiError here
    console.log(error.statusCode)
  }
}
```

### 13. Branded Types

```typescript
// Create branded types for type safety
type UserId = string & { __brand: 'UserId' }
type EventId = string & { __brand: 'EventId' }

function createUserId(id: string): UserId {
  return id as UserId
}

function createEventId(id: string): EventId {
  return id as EventId
}

// Type-safe function signatures
function getUser(id: UserId): Promise<User> {
  // Can only pass UserId, not regular string
  return fetchUser(id)
}

// Usage
const userId = createUserId('123')
const eventId = createEventId('456')

getUser(userId) // ✅ Works
getUser(eventId) // ❌ Type error
```

### 14. Template Literal Types

```typescript
// Type-safe event names
type EventName = `on${Capitalize<string>}`

interface EventHandlers {
  onClick: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}

// Type-safe CSS units
type CSSUnit = 'px' | 'rem' | 'em' | '%'
type CSSValue = `${number}${CSSUnit}`

interface StyleProps {
  width?: CSSValue
  height?: CSSValue
  margin?: CSSValue
}

// Usage
const styles: StyleProps = {
  width: '100px',  // ✅ Valid
  height: '2rem',  // ✅ Valid
  margin: '10'     // ❌ Type error
}
```

### 15. Type Safety Checklist

- [ ] Enable strict TypeScript configuration
- [ ] Define explicit types for all props
- [ ] Type all API responses
- [ ] Use Zod for runtime validation
- [ ] Type database queries and responses
- [ ] Define types for route parameters
- [ ] Type server actions properly
- [ ] Create type-safe contexts
- [ ] Use generics for reusable components
- [ ] Create utility types for common patterns
- [ ] Use discriminated unions for state
- [ ] Implement type guards
- [ ] Consider branded types for IDs
- [ ] Leverage template literal types
- [ ] Never use `any` without justification