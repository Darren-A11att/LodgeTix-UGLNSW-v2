# File Extension Patterns: When to Use .ts vs .tsx

## Core Rule: Use .tsx Only When JSX is Present

### The Fundamental Principle
```
File contains JSX elements? → .tsx
File contains only TypeScript? → .ts
```

## Detailed Guidelines

### Use .tsx When:
1. **Component files with JSX**
   ```typescript
   // components/button.tsx
   export function Button({ children }) {
     return <button>{children}</button>  // JSX = .tsx
   }
   ```

2. **Page and layout files**
   ```typescript
   // app/dashboard/page.tsx
   export default function Page() {
     return <div>Dashboard</div>  // JSX = .tsx
   }
   ```

3. **Any file returning JSX fragments**
   ```typescript
   // components/list.tsx
   export function List({ items }) {
     return (
       <>  {/* JSX fragment = .tsx */}
         {items.map(item => <li>{item}</li>)}
       </>
     )
   }
   ```

### Use .ts When:
1. **Server actions**
   ```typescript
   // actions/user.ts
   'use server'
   
   export async function createUser(data: FormData) {
     // No JSX, just logic = .ts
     const user = await db.user.create({ data })
     return user
   }
   ```

2. **Utility functions**
   ```typescript
   // utils/formatters.ts
   export function formatCurrency(amount: number): string {
     return new Intl.NumberFormat('en-US', {
       style: 'currency',
       currency: 'USD'
     }).format(amount)
   }
   ```

3. **Type definitions**
   ```typescript
   // types/user.ts
   export interface User {
     id: string
     name: string
     email: string
   }
   
   export type UserRole = 'admin' | 'user' | 'guest'
   ```

4. **Service modules**
   ```typescript
   // services/api.ts
   export async function fetchData(endpoint: string) {
     const response = await fetch(endpoint)
     return response.json()
   }
   ```

5. **Configuration files**
   ```typescript
   // config/database.ts
   export const dbConfig = {
     host: process.env.DB_HOST,
     port: process.env.DB_PORT,
     database: process.env.DB_NAME
   }
   ```

6. **Middleware**
   ```typescript
   // middleware.ts (always .ts, even at root)
   import { NextResponse } from 'next/server'
   
   export function middleware(request: NextRequest) {
     // Logic only, no JSX
     return NextResponse.next()
   }
   ```

## File Organization Patterns

### Typical Component Directory
```
components/
  user-profile/
    index.tsx           # Re-export with JSX
    user-profile.tsx    # Main component with JSX
    types.ts           # Type definitions
    utils.ts           # Helper functions
    constants.ts       # Constants
```

### API Route Organization
```
app/
  api/
    users/
      route.ts         # API handler (no JSX)
      validation.ts    # Request validation
      types.ts         # API types
```

### Action Organization
```
app/
  dashboard/
    page.tsx           # Page with JSX
    actions.ts         # Server actions (no JSX)
    components/
      chart.tsx        # Component with JSX
      utils.ts         # Chart calculations
```

## Common Mistakes

### ❌ Wrong: Using .tsx for non-JSX files
```typescript
// utils/calculator.tsx - WRONG!
export function calculate(a: number, b: number) {
  return a + b  // No JSX, should be .ts
}
```

### ❌ Wrong: Using .ts for component files
```typescript
// components/button.ts - WRONG!
export function Button({ children }) {
  return <button>{children}</button>  // Has JSX, should be .tsx
}
```

### ✅ Correct: Proper separation
```typescript
// components/button.tsx
export function Button({ children, onClick }) {
  return <button onClick={onClick}>{children}</button>
}

// components/button-utils.ts
export function getButtonClasses(variant: string) {
  return `btn btn-${variant}`
}
```

## Server Components vs Client Components

Both follow the same rule - extension based on JSX presence:

```typescript
// Server component with JSX
// app/posts/page.tsx
export default async function PostsPage() {
  const posts = await fetchPosts()
  return <div>{posts.map(p => <Post {...p} />)}</div>
}

// Server action without JSX
// app/posts/actions.ts
'use server'
export async function createPost(data: FormData) {
  return await db.post.create({ data })
}

// Client component with JSX
// components/like-button.tsx
'use client'
export function LikeButton() {
  const [liked, setLiked] = useState(false)
  return <button onClick={() => setLiked(!liked)}>♥</button>
}

// Client hook without JSX
// hooks/use-likes.ts
'use client'
export function useLikes(postId: string) {
  return useQuery({ queryKey: ['likes', postId] })
}
```

## Special Cases

### 1. Root config files (always .ts)
```
next.config.ts          # Not .tsx
middleware.ts          # Not .tsx
instrumentation.ts     # Not .tsx
```

### 2. Test files
```typescript
// Follow the same rule as source files
button.test.tsx        # If testing JSX rendering
utils.test.ts          # If testing pure functions
```

### 3. Barrel exports
```typescript
// components/index.ts (usually .ts)
export { Button } from './button'
export { Input } from './input'
export { Card } from './card'

// But if you transform JSX:
// components/index.tsx
export function ComponentLibrary({ children }) {
  return <div className="lib">{children}</div>
}
```

## Migration Guide

When refactoring existing code:

1. **Audit current files**
   ```bash
   # Find .tsx files without JSX
   grep -L "return.*<\|=.*<" --include="*.tsx" -r .
   
   # Find .ts files that might have JSX
   grep -l "return.*<\|=.*<" --include="*.ts" -r .
   ```

2. **Rename files appropriately**
   ```bash
   # Rename .tsx to .ts if no JSX
   mv components/utils.tsx components/utils.ts
   
   # Rename .ts to .tsx if has JSX
   mv components/card.ts components/card.tsx
   ```

3. **Update imports**
   - Most bundlers handle extension changes automatically
   - But verify imports still resolve correctly

## Benefits of Proper Extension Usage

1. **Clarity**: Immediately know if file contains components
2. **Performance**: Smaller parser needed for .ts files
3. **Tooling**: Better IDE intelligence and linting
4. **Bundle size**: Potential optimizations for non-JSX files
5. **Developer experience**: Clearer project structure

## Quick Decision Chart

```
Does the file return JSX elements?
├─ YES → .tsx
└─ NO
   ├─ Is it a type definition? → .ts
   ├─ Is it a utility function? → .ts
   ├─ Is it a server action? → .ts
   ├─ Is it an API route? → .ts
   ├─ Is it configuration? → .ts
   └─ Is it middleware? → .ts
```

## Enforcement

Add to your code review checklist:
- [ ] .tsx files contain JSX
- [ ] .ts files don't contain JSX
- [ ] File extensions match content
- [ ] Imports updated after renames

Consider adding ESLint rules:
```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'react/jsx-filename-extension': [
      'error',
      { extensions: ['.tsx'] }
    ]
  }
}
```