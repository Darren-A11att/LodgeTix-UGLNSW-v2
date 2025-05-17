# State Management Patterns

## Immutable State Management Laws

### 1. State Hierarchy

#### Level 1: Component State (useState)
Use for local, ephemeral state that doesn't need to be shared

```typescript
'use client'

export function SearchInput() {
  const [query, setQuery] = useState('')
  
  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  )
}
```

#### Level 2: Context (Global Client State)
Use for state that needs to be shared across multiple components

```typescript
'use client'

// contexts/ThemeContext.tsx
const ThemeContext = createContext<{
  theme: 'light' | 'dark'
  toggleTheme: () => void
}>({
  theme: 'light',
  toggleTheme: () => {}
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
```

#### Level 3: URL State (Search Params)
Use for state that should be shareable via URL

```typescript
'use client'

import { useSearchParams, useRouter } from 'next/navigation'

export function FilterControls() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set(key, value)
    router.push(`?${params.toString()}`)
  }
  
  return (
    <select 
      value={searchParams.get('category') || ''}
      onChange={(e) => updateFilter('category', e.target.value)}
    >
      <option value="">All Categories</option>
      <option value="workshop">Workshop</option>
      <option value="ceremony">Ceremony</option>
    </select>
  )
}
```

#### Level 4: Server State (Database)
Use Server Actions or API routes for persistent state

```typescript
// Server Component
export default async function EventPage({ params }: { params: { id: string } }) {
  const event = await fetchEvent(params.id)
  
  return <EventDetails event={event} />
}

// Server Action for mutations
async function updateEvent(eventId: string, data: FormData) {
  'use server'
  
  const title = data.get('title') as string
  await db.event.update({
    where: { id: eventId },
    data: { title }
  })
  
  revalidatePath(`/events/${eventId}`)
}
```

### 2. Form State Management

#### React Hook Form Pattern
```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const eventSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  date: z.string().datetime()
})

type EventForm = z.infer<typeof eventSchema>

export function EventForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<EventForm>({
    resolver: zodResolver(eventSchema)
  })
  
  const onSubmit = async (data: EventForm) => {
    await fetch('/api/events', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title')} />
      {errors.title && <span>{errors.title.message}</span>}
      
      <textarea {...register('description')} />
      {errors.description && <span>{errors.description.message}</span>}
      
      <input type="datetime-local" {...register('date')} />
      {errors.date && <span>{errors.date.message}</span>}
      
      <button type="submit">Create Event</button>
    </form>
  )
}
```

### 3. Complex State with useReducer

```typescript
'use client'

type CartState = {
  items: CartItem[]
  total: number
}

type CartAction = 
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM':
      return {
        items: [...state.items, action.payload],
        total: state.total + action.payload.price
      }
    case 'REMOVE_ITEM':
      const item = state.items.find(i => i.id === action.payload)
      return {
        items: state.items.filter(i => i.id !== action.payload),
        total: state.total - (item?.price || 0)
      }
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      }
    case 'CLEAR_CART':
      return { items: [], total: 0 }
    default:
      return state
  }
}

export function ShoppingCart() {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 })
  
  return (
    <div>
      {state.items.map(item => (
        <CartItem
          key={item.id}
          item={item}
          onRemove={() => dispatch({ type: 'REMOVE_ITEM', payload: item.id })}
          onUpdateQuantity={(quantity) => 
            dispatch({ type: 'UPDATE_QUANTITY', payload: { id: item.id, quantity } })
          }
        />
      ))}
      <div>Total: ${state.total}</div>
    </div>
  )
}
```

### 4. Zustand for Client State

```typescript
'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserStore {
  user: User | null
  setUser: (user: User | null) => void
  preferences: UserPreferences
  updatePreferences: (prefs: Partial<UserPreferences>) => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      preferences: {
        theme: 'light',
        notifications: true
      },
      updatePreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs }
        }))
    }),
    {
      name: 'user-storage'
    }
  )
)

// Usage in component
export function UserProfile() {
  const { user, setUser } = useUserStore()
  
  return <div>{user?.name}</div>
}
```

### 5. Server State with SWR/React Query

```typescript
'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function EventList() {
  const { data, error, isLoading, mutate } = useSWR('/api/events', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  })
  
  if (isLoading) return <EventsSkeleton />
  if (error) return <ErrorMessage />
  
  return (
    <div>
      {data.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
      <button onClick={() => mutate()}>Refresh</button>
    </div>
  )
}
```

### 6. Optimistic Updates

```typescript
'use client'

export function LikeButton({ eventId, initialLikes }: { eventId: string; initialLikes: number }) {
  const [isLiking, setIsLiking] = useState(false)
  const [likes, setLikes] = useState(initialLikes)
  
  const handleLike = async () => {
    setIsLiking(true)
    setLikes(prev => prev + 1) // Optimistic update
    
    try {
      const response = await fetch(`/api/events/${eventId}/like`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        setLikes(prev => prev - 1) // Revert on error
      }
    } catch {
      setLikes(prev => prev - 1) // Revert on error
    } finally {
      setIsLiking(false)
    }
  }
  
  return (
    <button onClick={handleLike} disabled={isLiking}>
      ❤️ {likes}
    </button>
  )
}
```

### 7. State Synchronization

```typescript
'use client'

// Sync local state with server state
export function EditableTitle({ eventId, initialTitle }: { eventId: string; initialTitle: string }) {
  const [title, setTitle] = useState(initialTitle)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const saveTitle = async () => {
    setIsSaving(true)
    
    try {
      await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title })
      })
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }
  
  if (isEditing) {
    return (
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={saveTitle}
        disabled={isSaving}
      />
    )
  }
  
  return (
    <h1 onClick={() => setIsEditing(true)}>{title}</h1>
  )
}
```

### 8. State Composition Pattern

```typescript
'use client'

// Compose multiple state sources
export function useEventState(eventId: string) {
  // Server state
  const { data: event, mutate } = useSWR(`/api/events/${eventId}`)
  
  // Local UI state
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const form = useForm({
    defaultValues: event
  })
  
  const save = async (data: EventData) => {
    setIsSaving(true)
    try {
      await updateEvent(eventId, data)
      await mutate()
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }
  
  return {
    event,
    isEditing,
    isSaving,
    form,
    actions: {
      save,
      edit: () => setIsEditing(true),
      cancel: () => setIsEditing(false)
    }
  }
}
```

### 9. State Persistence Patterns

```typescript
'use client'

// Custom hook for persisted state
export function usePersistedState<T>(key: string, defaultValue: T) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue
    
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  })
  
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(state))
  }, [key, state])
  
  return [state, setState] as const
}
```

### 10. Best Practices

1. **Start with Component State**: Use useState for local state
2. **Elevate When Needed**: Move to Context or URL state when sharing is required
3. **Server State is Truth**: Treat server data as the source of truth
4. **Optimistic Updates**: Improve UX with immediate feedback
5. **Error Handling**: Always handle loading and error states
6. **Type Safety**: Use TypeScript for all state interfaces
7. **Minimize Client State**: Prefer server state when possible
8. **State Colocation**: Keep state close to where it's used
9. **Avoid Prop Drilling**: Use Context or composition
10. **Performance**: Use memo/callback when necessary