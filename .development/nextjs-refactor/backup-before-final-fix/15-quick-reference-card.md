# Next.js Immutable Laws - Quick Reference Card

## The 10 Laws (At a Glance)

1. **Server Components by Default** - No "use client" unless needed
2. **Co-location is King** - Keep related files together  
3. **File-based Routing is Sacred** - Use Next.js conventions
4. **Data Fetching Follows Gravity** - Fetch high, pass down
5. **Client-Server Boundary is Explicit** - Clear separation
6. **Progressive Enhancement Always** - Works without JS
7. **Route Groups for Organization** - Use (folders) to group
8. **Loading and Error States** - Always provide fallbacks
9. **Metadata is Declarative** - Export, don't manipulate
10. **Performance is Architecture** - Design for speed

## Decision Trees

### "Should this be a client component?"
```
Uses hooks? ────────────────────────┐
Has event handlers? ────────────────┤
Uses browser APIs? ─────────────────┤ YES → 'use client'
Uses client libraries? ─────────────┤
                                   │
None of the above? ────────────────┴─ NO → Server component
```

### "Where does this file go?"
```
Route-specific? → /app/route/components/
Group-shared?   → /app/(group)/_components/  
App-shared?     → /app/_components/
Utility?        → /lib/utils/
Service?        → /lib/services/
```

### "How do I fetch data?"
```
Static?         → Import or hardcode
Slow-changing?  → Cache with revalidate  
User-specific?  → Server-side with auth
Real-time?      → SSE or polling
Form submit?    → Server actions
```

## Code Patterns

### Server Component Pattern
```typescript
// ✅ Correct
export default async function Page() {
  const data = await fetchData()
  return <ClientComponent data={data} />
}
```

### Form Pattern
```typescript
// ✅ Progressive form
export default function Form() {
  async function submit(formData: FormData) {
    'use server'
    // Process...
  }
  
  return (
    <form action={submit}>
      <input name="field" required />
      <button>Submit</button>
    </form>
  )
}
```

### Loading Pattern
```typescript
// loading.tsx
export default function Loading() {
  return <Skeleton />
}

// error.tsx  
'use client'
export default function Error({ error, reset }) {
  return <ErrorUI error={error} retry={reset} />
}
```

### Dynamic Import Pattern
```typescript
// ✅ Optimize bundle
const HeavyComponent = dynamic(
  () => import('./heavy'),
  { loading: () => <Loading /> }
)
```

## Common Mistakes

### ❌ Client-side fetching
```typescript
'use client'
useEffect(() => {
  fetch('/api/data')  // Bad!
}, [])
```

### ❌ Unnecessary client
```typescript
'use client'  // Not needed!
export function Static({ data }) {
  return <div>{data}</div>
}
```

### ❌ Manual routing
```typescript
onClick={() => {
  window.location.href = '/page'  // Bad!
}}
```

### ❌ Direct meta tags
```typescript
useEffect(() => {
  document.title = 'Title'  // Bad!
}, [])
```

## File Structure Template
```
app/
  (auth)/               # Auth routes
    login/
      page.tsx
      components/
      actions/
  (app)/                # App routes  
    dashboard/
      page.tsx
      layout.tsx
      loading.tsx
      error.tsx
      components/
      actions/
      utils/
  _components/          # Shared
  api/                  # API routes
    
lib/
  services/             # Server logic
  utils/                # Helpers
  types/                # TypeScript

public/                 # Static files
```

## Performance Checklist

- [ ] Server components by default
- [ ] Data fetched at top level
- [ ] Client boundaries minimized  
- [ ] Loading states present
- [ ] Error boundaries added
- [ ] Images optimized
- [ ] Code split where needed
- [ ] Caching strategy defined

## Testing Checklist

- [ ] Works without JavaScript
- [ ] Forms submit correctly
- [ ] Loading states show
- [ ] Errors handled gracefully
- [ ] Build succeeds
- [ ] No hydration errors
- [ ] Bundle size acceptable
- [ ] Lighthouse score good

## Review Red Flags 🚩

1. "use client" everywhere
2. useEffect + fetch combos
3. No error.tsx files
4. Giant client bundles
5. Manual DOM updates
6. Custom routing logic
7. Missing loading states
8. State in server components

## Helpful Commands

```bash
# Check build
npm run build

# Analyze bundle
npm run analyze

# Type check
npm run type-check

# Run tests  
npm test

# Check specific route
npm run dev
# Visit: /_next/static/chunks/pages/[route]
```

## Links to Full Guides

- [Following the Laws](/docs/practical-guide)
- [Code Review Guide](/docs/review-guide)
- [Architecture Patterns](/docs/patterns)
- [Performance Guide](/docs/performance)

---

**Remember:** When in doubt, start with a server component!