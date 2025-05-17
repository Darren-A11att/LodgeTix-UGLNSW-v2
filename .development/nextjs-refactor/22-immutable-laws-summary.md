# Immutable Laws Summary - Next.js Development

## The 13 Commandments of Next.js Development

### 1. **Thou Shalt Use Server Components by Default**
Client components only when explicit interactivity is required. This is the way.

### 2. **Thou Shalt Honor the File-Based Routing**
The `app/` directory structure is sacred. Routes reflect files, files reflect routes.

### 3. **Thou Shalt Co-locate Religiously**
Components, styles, tests, and utilities that work together, live together.

### 4. **Thou Shalt Follow Naming Conventions**
- `page.tsx` for pages
- `_components/` for route components
- PascalCase for components
- camelCase for utilities
- Never deviate

### 5. **Thou Shalt Type Everything**
TypeScript is not optional. `any` is forbidden without written justification.

### 6. **Thou Shalt Fetch Data in Server Components**
Data fetching belongs on the server. Client fetching is the exception, not the rule.

### 7. **Thou Shalt Separate Concerns**
- Business logic → services/utilities
- UI logic → components
- Data fetching → server components
- State → appropriate level only

### 8. **Thou Shalt Build Progressively**
Server-first, enhance with client features. JavaScript should enhance, not be required.

### 9. **Thou Shalt Optimize Performance**
- Next.js Image for all images
- Dynamic imports for code splitting
- Proper caching strategies
- Minimize client JavaScript

### 10. **Thou Shalt Be Consistent**
Follow patterns even when you think you know better. Consistency trumps cleverness.

### 11. **Thou Shalt Match Extensions to Content**
Use `.tsx` only for JSX. Use `.ts` for everything else. The extension reveals the content.

### 12. **Thou Shalt Follow TypeScript Laws**
Strict configuration. Type safety. No `any`. See the patterns documentation.

### 13. **Thou Shalt Create Laws Properly**
Laws must be necessary, enforceable, and integrated. Follow the SOP.

## Quick Reference Structure

```
app/
├── (customer)/          # Public routes
├── (admin)/            # Protected routes
├── (auth)/             # Auth routes
├── api/                # API endpoints
└── _components/        # Global shared components

Each route folder MUST contain:
├── page.tsx            # Route page
├── loading.tsx         # Loading state
├── error.tsx           # Error boundary
├── layout.tsx          # Layout (if needed)
└── _components/        # Route-specific components
```

## The Golden Rules

1. **Start with Server Components** - Only add 'use client' when you must
2. **Co-locate Everything** - Keep related files together
3. **Type Everything** - No exceptions
4. **Follow Conventions** - Even when it feels redundant
5. **Test Behavior** - Not implementation
6. **Document Decisions** - Especially deviations
7. **Performance First** - Every decision should consider performance
8. **Accessibility Always** - It's not optional
9. **Error Handling Everywhere** - Expect the unexpected
10. **Consistency Over Cleverness** - Boring is better

## File Organization Pattern

```typescript
// 1. Framework imports (React, Next.js)
import { useState } from 'react'
import Image from 'next/image'

// 2. External libraries
import { format } from 'date-fns'

// 3. Internal imports (absolute paths)
import { Button } from '@/components/ui/button'

// 4. Types
import type { Event } from '@/shared/types'

// 5. Component/Function
export function Component() {
  // Implementation
}
```

## Component Pattern

```typescript
// 1. Types
interface Props {
  // Define all props
}

// 2. Component
export function Component({ prop }: Props) {
  // 3. State
  const [state, setState] = useState()
  
  // 4. Hooks
  const data = useCustomHook()
  
  // 5. Effects
  useEffect(() => {}, [])
  
  // 6. Handlers
  const handleEvent = () => {}
  
  // 7. Early returns
  if (loading) return <Loading />
  
  // 8. Main render
  return <div>...</div>
}
```

## Data Fetching Pattern

```typescript
// Server Component (default)
export default async function Page() {
  const data = await fetchData() // Direct fetching
  return <ClientComponent data={data} />
}

// Client Component (only when needed)
'use client'
export function InteractiveComponent() {
  const [state, setState] = useState()
  // Interactive logic
}
```

## Remember

**These are LAWS, not suggestions. They ensure:**
- Consistency across the entire codebase
- Optimal performance by default
- Maintainable code for teams
- Type safety throughout
- Accessibility for all users
- Testable architecture

**When in doubt, check the laws. When certain, check the laws anyway.**