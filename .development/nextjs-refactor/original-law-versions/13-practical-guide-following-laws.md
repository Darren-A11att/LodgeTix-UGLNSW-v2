# Practical Guide: Following the Immutable Laws

This guide provides step-by-step instructions for applying the immutable laws during daily development.

## Before You Start Coding

### 1. Identify Your Task Type
```
Question: What am I building?
├─ Bug Fix → See "Fixing Bugs" section
├─ Enhancement → See "Enhancing Features" section  
├─ New Feature → See "Building New Features" section
└─ Refactor → See "Refactoring Code" section
```

### 2. Check Your Environment
- [ ] You're in the correct branch
- [ ] Your dependencies are up to date (`npm install`)
- [ ] The project builds successfully (`npm run build`)
- [ ] Tests pass (`npm test`)

## Fixing Bugs

### Step 1: Locate the Problem
```bash
# Find the problematic file
rg "error message" --type tsx --type ts
# or
npm run dev # Check browser console for component stack
```

### Step 2: Verify Component Type
```typescript
// Check the file header
// ❌ WRONG: Adding "use client" to fix a bug in a server component
// ✅ RIGHT: Fix the root cause that requires client functionality
```

### Step 3: Apply the Fix
1. **For Server Components:**
   - Fix data fetching issues at the source
   - Update server actions if mutations are involved
   - Check error.tsx boundaries

2. **For Client Components:**
   - Ensure the "use client" directive is justified
   - Fix event handlers or browser API usage
   - Update local state management

### Step 4: Test the Fix
```bash
# Test locally
npm run dev

# Run related tests
npm test -- path/to/test

# Verify build
npm run build
```

## Enhancing Features

### Step 1: Find the Feature Location
```
Current feature is in: app/(customer)/events/[id]/page.tsx
Enhancement type: Add search functionality

Decision tree:
├─ Is search interactive? → YES
├─ Can it be progressive? → YES  
└─ Solution: Add client search component with server fallback
```

### Step 2: Create Enhancement Structure
```typescript
// 1. Create server search function
// app/(customer)/events/[id]/search.ts
export async function searchEvents(query: string) {
  'use server'
  // Database query
  return await db.events.search(query)
}

// 2. Create client enhancement
// app/(customer)/events/[id]/components/search-bar.tsx
'use client'
export function SearchBar({ serverResults }) {
  // Client-side filtering enhancement
}

// 3. Integrate with page
// app/(customer)/events/[id]/page.tsx
export default async function EventsPage({ searchParams }) {
  const results = searchParams.q 
    ? await searchEvents(searchParams.q)
    : await getAllEvents()
    
  return (
    <>
      <SearchBar serverResults={results} />
      <EventsList events={results} />
    </>
  )
}
```

### Step 3: Follow Co-location Rules
```
app/(customer)/events/[id]/
├── page.tsx              # Main page
├── components/
│   ├── search-bar.tsx    # Client search component
│   └── events-list.tsx   # Server component
├── actions/
│   └── search.ts         # Server actions
└── utils/
    └── search-helpers.ts # Shared utilities
```

## Building New Features

### Step 1: Plan the Architecture
```
Feature: User Dashboard
Required: Data display, real-time updates, user interactions

Architecture Plan:
├─ Route: app/(app)/dashboard/
├─ Layout: Shared navigation
├─ Pages: Overview, Settings, Analytics
└─ Components: Mix of server and client
```

### Step 2: Create the Route Structure
```bash
# Create route structure
mkdir -p app/'(app)'/dashboard/{components,actions,utils}
touch app/'(app)'/dashboard/{page,layout,loading,error}.tsx
```

### Step 3: Implement Server-First
```typescript
// 1. Start with layout.tsx (server component)
export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard-layout">
      <ServerSideNav />
      {children}
    </div>
  )
}

// 2. Create page.tsx (server component)
export default async function DashboardPage() {
  const data = await fetchDashboardData()
  
  return (
    <>
      <DashboardMetrics data={data} />
      <ActivityFeed activities={data.activities} />
      <ClientInteractions /> {/* Only this needs "use client" */}
    </>
  )
}

// 3. Add client interactivity where needed
// components/client-interactions.tsx
'use client'
export function ClientInteractions() {
  const [filter, setFilter] = useState('all')
  // Interactive features only
}
```

### Step 4: Add Loading and Error States
```typescript
// loading.tsx
export default function DashboardLoading() {
  return <DashboardSkeleton />
}

// error.tsx
'use client'
export default function DashboardError({ error, reset }) {
  return <ErrorBoundary error={error} retry={reset} />
}
```

## Refactoring Code

### Step 1: Identify Refactoring Scope
```
Target: components/register/payment/CheckoutForm.tsx
Issues: 
- Client-heavy with server data
- Mixed concerns
- Poor performance

Plan:
1. Extract server data fetching
2. Split into server/client components
3. Optimize bundle size
```

### Step 2: Extract Server Logic
```typescript
// Before (all client-side)
'use client'
export function CheckoutForm() {
  const [prices, setPrices] = useState([])
  
  useEffect(() => {
    fetchPrices().then(setPrices)
  }, [])
  
  return <form>...</form>
}

// After (server + client split)
// page.tsx
export default async function PaymentPage() {
  const prices = await fetchPrices() // Server-side
  return <CheckoutForm prices={prices} />
}

// components/checkout-form.tsx
'use client'
export function CheckoutForm({ prices }) {
  // Only client interactivity
  return <form>...</form>
}
```

### Step 3: Optimize Component Tree
```typescript
// Extract interactive leaves
// ❌ WRONG: Entire form is client component
'use client'
export function BigForm() {
  return (
    <form>
      <StaticFields />
      <InteractiveField />
    </form>
  )
}

// ✅ RIGHT: Only interactive parts are client
export function BigForm() {
  return (
    <form>
      <StaticFields />      {/* Server component */}
      <InteractiveField />  {/* Client component */}
    </form>
  )
}
```

## Common Patterns

### Data Fetching Pattern
```typescript
// Always fetch at the page/layout level
export default async function Page() {
  // Parallel fetching for performance
  const [users, posts] = await Promise.all([
    fetchUsers(),
    fetchPosts()
  ])
  
  return <ClientComponent data={{ users, posts }} />
}
```

### Form Handling Pattern
```typescript
// Server action approach
export default function ContactForm() {
  async function submitForm(formData: FormData) {
    'use server'
    // Validation and processing
    const result = await processFormData(formData)
    revalidatePath('/contact')
    redirect('/thank-you')
  }
  
  return (
    <form action={submitForm}>
      <input name="email" type="email" required />
      <SubmitButton /> {/* Client component for UX */}
    </form>
  )
}
```

### Error Handling Pattern
```typescript
// Graceful degradation
export default async function DataSection() {
  let data = null
  
  try {
    data = await fetchData()
  } catch (error) {
    // Log but don't crash
    console.error('Data fetch failed:', error)
  }
  
  return data ? (
    <DataDisplay data={data} />
  ) : (
    <FallbackContent />
  )
}
```

## Quick Decision Guide

### "Should this be a client component?"
1. Does it use useState, useEffect, or other hooks? → YES
2. Does it have onClick, onChange handlers? → YES  
3. Does it use browser APIs (window, document)? → YES
4. Does it use third-party client libraries? → YES
5. None of the above? → NO (keep as server component)

### "Where should I put this code?"
1. Used only in this route? → `/app/route/components/`
2. Shared within route group? → `/app/(group)/_components/`
3. Used app-wide? → `/app/_components/`
4. Pure utility function? → `/lib/utils/`
5. Business logic? → `/lib/services/`

### "Should this be .ts or .tsx?"
1. Contains JSX elements (`<div>`, `<Component />`)? → `.tsx`
2. Returns React elements? → `.tsx`
3. Just TypeScript logic? → `.ts`
4. Type definitions? → `.ts`
5. Server actions? → `.ts`
6. API routes? → `.ts`

### "How should I handle this data?"
1. Static content? → Hardcode or static import
2. Dynamic but slow-changing? → Cache with revalidation
3. User-specific? → Server-side fetch with auth
4. Real-time? → Server-sent events or polling
5. Form submission? → Server actions

## Debugging Common Issues

### Issue: "Component renders on server but fails on client"
```typescript
// Check for server-only code in client components
// ❌ WRONG
'use client'
import { cookies } from 'next/headers' // Server only!

// ✅ RIGHT - Pass from server component
export default async function Page() {
  const cookieData = cookies().get('session')
  return <ClientComponent sessionData={cookieData} />
}
```

### Issue: "Hydration mismatch errors"
```typescript
// Ensure consistent rendering
// ❌ WRONG
function Component() {
  return <div>{new Date().toISOString()}</div>
}

// ✅ RIGHT
function Component({ timestamp }) {
  return <div>{timestamp}</div>
}
```

### Issue: "Can't use hooks in server component"
```typescript
// ❌ WRONG - Trying to use state in server component
export default function ServerComponent() {
  const [state, setState] = useState() // Error!
}

// ✅ RIGHT - Extract to client component
// components/interactive-part.tsx
'use client'
export function InteractivePart() {
  const [state, setState] = useState()
  return <div>{state}</div>
}

// page.tsx (server component)
export default function Page() {
  return <InteractivePart />
}
```

## Performance Checklist

Before committing code, verify:

- [ ] Server components used by default
- [ ] Data fetched at highest level
- [ ] Client components minimized
- [ ] Loading states implemented
- [ ] Error boundaries in place
- [ ] Bundle size optimized
- [ ] Proper caching strategy
- [ ] No unnecessary re-renders
- [ ] Progressive enhancement works
- [ ] Accessibility standards met

## Next Steps

1. Run `npm run build` to check for errors
2. Test with JavaScript disabled
3. Check bundle analysis
4. Review with team using the code review guide
5. Monitor performance metrics post-deployment