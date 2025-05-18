# Next.js App Router Cheat Sheet

## The 10 Immutable Laws

### 1. Server Components by Default
```typescript
// ✅ DEFAULT (no directive)
export default function Component() {
  return <div>Server Component</div>
}

// ❌ ONLY when needed
'use client'
export default function Interactive() {
  const [state, setState] = useState()
  return <button onClick={...}>Client</button>
}
```

### 2. Co-location is King  
```
app/dashboard/
  ├── page.tsx
  ├── components/
  ├── actions/
  └── utils/
```

### 3. File-based Routing
```
page.tsx → Route UI
layout.tsx → Shared wrapper
loading.tsx → Loading state
error.tsx → Error boundary
```

### 4. Data Fetching High
```typescript
// Page level (TOP)
export default async function Page() {
  const data = await fetchData()
  return <Child data={data} />
}
```

### 5. Clear Boundaries
```typescript
// Server → Client (ONE WAY)
<ServerComponent>
  <ClientComponent data={serverData} />
</ServerComponent>
```

### 6. Progressive Enhancement
```html
<!-- Works without JS -->
<form action="/api/submit" method="POST">
  <input name="email" required />
  <button>Submit</button>
</form>
```

### 7. Route Groups
```
(auth)/     → Authentication
(app)/      → Application  
(marketing)/→ Public pages
```

### 8. Loading & Error States
```typescript
// Always provide
loading.tsx
error.tsx
not-found.tsx
```

### 9. Declarative Metadata
```typescript
export const metadata = {
  title: 'Page Title',
  description: 'Description'
}
```

### 10. Performance First
```typescript
// Dynamic imports
const Heavy = dynamic(() => import('./heavy'))

// Parallel fetch
const [a, b] = await Promise.all([
  fetchA(),
  fetchB()
])
```

---

## Quick Decisions

**Need Client Component?**
- Uses useState/useEffect? → YES
- Has onClick/onChange? → YES  
- Uses window/document? → YES
- Otherwise → NO

**Where to Put File?**
- Route only → /route/components/
- Group shared → /(group)/_components/
- App shared → /app/_components/

**Data Fetching Method?**
- Page data → Server component
- User action → Server action
- Real-time → Polling/SSE

---

## Common Patterns

**Server Action**
```typescript
async function action(formData: FormData) {
  'use server'
  // Validate & save
  revalidatePath('/path')
}
```

**Error Boundary**
```typescript
'use client'
export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div>
      <h2>Error!</h2>
      <button onClick={reset}>Retry</button>
    </div>
  )
}
```

**Progressive Form**
```typescript
<form action={serverAction}>
  <input name="field" />
  <button>Submit</button>
  <ClientEnhancement />
</form>
```

---

## Do's and Don'ts

### ✅ DO
- Start with server components
- Fetch data at page level
- Use loading/error states
- Code split large imports
- Test without JavaScript

### ❌ DON'T  
- Add "use client" by default
- Fetch in useEffect
- Manipulate DOM directly
- Create custom routing
- Mix server/client logic

---

## File Structure
```
app/
  (groups)/
    route/
      page.tsx
      layout.tsx  
      loading.tsx
      error.tsx
      components/
      actions/
lib/
  services/
  utils/
```

---

## Commands
```bash
npm run dev      # Development
npm run build    # Check build
npm run analyze  # Bundle size
```

---

**Golden Rule: Start server, add client only when needed!**