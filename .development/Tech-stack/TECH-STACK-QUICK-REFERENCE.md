# LodgeTix Tech Stack Quick Reference

## 🚀 Core Technologies

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Framework | Next.js | 15.2.4 | Full-stack React framework |
| UI Library | React | 19 | Component library |
| Language | TypeScript | 5 | Type safety |
| Styling | TailwindCSS | 3.4.17 | Utility-first CSS |
| Components | shadcn/ui | - | UI primitives |
| State | Zustand | 5.0.4 | Client state management |
| Database | Supabase | 2.49.4 | PostgreSQL + Auth |
| Payments | Stripe | 18.1.0 | Payment processing |
| Forms | React Hook Form | 7.54.1 | Form management |
| Validation | Zod | 3.24.1 | Schema validation |
| Icons | Lucide React | 0.454.0 | Icon library |
| Testing | Vitest | 3.1.3 | Unit testing |
| Monitoring | Sentry | 9.19.0 | Error tracking |

## 📁 Directory Structure

```
/app                → Next.js pages (App Router)
/components         → React components
  /ui              → shadcn/ui components
  /register        → Registration flow
/contexts          → React Context providers
/hooks             → Custom React hooks  
/lib               → Utilities & services
  /api             → API service modules
/shared            → Shared types & utils
```

## 🎨 Styling Guidelines

```tsx
// ✅ DO: Use Tailwind utilities
<button className="px-4 py-2 bg-primary text-white rounded">

// ❌ DON'T: Use inline styles or CSS-in-JS
<button style={{ padding: '8px 16px' }}>
```

## 🔧 Common Patterns

### Component Definition
```tsx
// With proper TypeScript types
interface ButtonProps {
  children: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}

export function Button({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled = false 
}: ButtonProps): JSX.Element {
  return (
    <button 
      className={cn(
        'px-4 py-2 rounded font-medium transition-colors',
        {
          'bg-primary text-white hover:bg-primary-dark': variant === 'primary',
          'bg-secondary text-black hover:bg-secondary-dark': variant === 'secondary',
          'bg-red-500 text-white hover:bg-red-600': variant === 'danger',
          'opacity-50 cursor-not-allowed': disabled
        }
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
```

### State Management
```tsx
// Zustand store
const useStore = create<State>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 }))
}))
```

### API Calls
```tsx
// Supabase query
const { data, error } = await supabase
  .from('events')
  .select('*')
  .eq('id', eventId)
```

### Form Handling
```tsx
// React Hook Form + Zod
const schema = z.object({
  email: z.string().email()
})

const form = useForm({
  resolver: zodResolver(schema)
})
```

## 🚫 Don't Use

- ❌ React Router → Use Next.js routing
- ❌ React Icons → Use Lucide React
- ❌ Heroicons → Use Lucide React  
- ❌ Headless UI → Use shadcn/ui
- ❌ CSS Modules → Use Tailwind
- ❌ Multiple Supabase clients → Use single instance

## 🔑 Environment Variables

```env
# Client-side (public)
NEXT_PUBLIC_SUPABASE_URL=(refer to .env)
NEXT_PUBLIC_SUPABASE_ANON_KEY=(refer to .env)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=(refer to .env)

# Server-side (secret)
STRIPE_SECRET_KEY=(refer to .env)
DATABASE_URL=(refer to .env)
```

## 📝 Naming Conventions

- **Components**: `PascalCase` (UserProfile.tsx)
- **Functions**: `camelCase` (getUserData)
- **Files**: `kebab-case` (user-profile.tsx)
- **Constants**: `UPPER_SNAKE_CASE` (API_URL)
- **Types/Interfaces**: `PascalCase` (UserData)

## 🛠️ CLI Commands

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm test          # Run tests
```

## 🔒 Type Safety Patterns

### API Response Types
```tsx
// Type-safe API calls
type ApiResponse<T> = 
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: ApiError }

async function fetchUser(id: string): Promise<ApiResponse<User>> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return { success: true, data, error: null }
  } catch (error) {
    return { 
      success: false, 
      data: null, 
      error: { message: 'Failed to fetch user', code: 'FETCH_ERROR' }
    }
  }
}
```

### Type Guards
```tsx
// Check types at runtime
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value
  )
}

// Discriminated unions
type LoadingState<T> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'success'; data: T }

function isSuccess<T>(state: LoadingState<T>): state is { status: 'success'; data: T } {
  return state.status === 'success'
}
```

### Server Components
```tsx
// Server Component with data fetching
export default async function EventPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const event = await fetchEvent(params.id)
  
  return <EventDetails event={event} />
}

// Client Component with server data
'use client'

interface EventDetailsProps {
  event: Event
}

export function EventDetails({ event }: EventDetailsProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  
  return (
    <div>
      <h1>{event.title}</h1>
      <button onClick={() => setIsBookmarked(!isBookmarked)}>
        {isBookmarked ? 'Bookmarked' : 'Bookmark'}
      </button>
    </div>
  )
}
```

## 🚀 Performance Tips

- Use `next/dynamic` for code splitting
- Implement `loading.tsx` for route transitions
- Use `next/image` for all images
- Prefetch data in Server Components
- Minimize client-side state
- Use React.memo() sparingly and correctly
- Implement proper caching strategies
```

## 📚 Key Resources

- [Tech Stack Standard](./TECH-STACK-STANDARD.md)
- [Architecture Diagram](./TECH-STACK-DIAGRAM.md)
- [Conflict Resolution](./000-summary-tech-stack-conflicts.md)
- [shadcn/ui Docs](https://ui.shadcn.com)