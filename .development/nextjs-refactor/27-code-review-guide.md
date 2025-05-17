# Code Review Guide: Enforcing the Immutable Laws

This guide helps reviewers systematically check code against the immutable laws. Use this checklist for every PR review.

## Pre-Review Setup

### 1. Pull the Branch Locally
```bash
git fetch origin
git checkout feature-branch
npm install
npm run build  # Must pass
npm test      # Must pass
```

### 2. Understand the Change
- [ ] Read PR description
- [ ] Check linked issue/ticket
- [ ] Identify change type: Bug Fix / Enhancement / New Feature
- [ ] Note affected areas

## Review Checklist

### Law 1: Server Components by Default

**Check Every Component File:**
```typescript
// 🔍 LOOK FOR: Unnecessary "use client" directives

// ❌ VIOLATION - Client directive without justification
'use client'
export function UserProfile({ user }) {
  return <div>{user.name}</div>  // No client features!
}

// ✅ CORRECT - Server component (no directive)
export function UserProfile({ user }) {
  return <div>{user.name}</div>
}

// ✅ CORRECT - Client directive with clear need
'use client'
export function InteractiveForm() {
  const [input, setInput] = useState('')  // Needs state
  return <form>...</form>
}
```

**Review Questions:**
- [ ] Is "use client" justified by hooks, handlers, or browser APIs?
- [ ] Could this component work without client-side JS?
- [ ] Are there server components unnecessarily wrapped in client components?

### Law 2: Co-location is King

**Check File Organization:**
```
// 🔍 LOOK FOR: Scattered related files

// ❌ VIOLATION - Related files in different locations
app/dashboard/page.tsx
components/dashboard/DashboardChart.tsx  // Should be co-located
lib/dashboard-utils.ts                   // Should be co-located

// ✅ CORRECT - Co-located structure
app/dashboard/
  ├── page.tsx
  ├── components/
  │   └── dashboard-chart.tsx
  └── utils/
      └── data-helpers.ts
```

**Review Questions:**
- [ ] Are components used only by this route in the route folder?
- [ ] Are utilities specific to this feature co-located?
- [ ] Is the folder structure logical and maintainable?

### Law 3: File-based Routing is Sacred

**Check Route Implementation:**
```typescript
// 🔍 LOOK FOR: Custom routing logic

// ❌ VIOLATION - Manual routing
export function CustomRouter() {
  const path = window.location.pathname
  switch(path) {
    case '/dashboard': return <Dashboard />
    case '/profile': return <Profile />
  }
}

// ✅ CORRECT - File-based routing
app/
  dashboard/
    page.tsx
  profile/
    page.tsx
```

**Review Questions:**
- [ ] Does the PR use Next.js routing conventions?
- [ ] Are dynamic routes properly structured ([id], [...slug])?
- [ ] Are route groups used appropriately?

### Law 4: Data Fetching Follows Gravity

**Check Data Flow:**
```typescript
// 🔍 LOOK FOR: Client-side data fetching

// ❌ VIOLATION - Fetching in client component
'use client'
export function ProductList() {
  const [products, setProducts] = useState([])
  useEffect(() => {
    fetch('/api/products').then(...)  // Bad!
  }, [])
}

// ✅ CORRECT - Server-side fetching
// page.tsx
export default async function ProductPage() {
  const products = await fetchProducts()  // Server-side
  return <ProductList products={products} />
}

// components/product-list.tsx
'use client'
export function ProductList({ products }) {
  // Just display, no fetching
}
```

**Review Questions:**
- [ ] Is data fetched at the page/layout level?
- [ ] Are server actions used for mutations?
- [ ] Is client-side fetching avoided?

### Law 5: Client-Server Boundary is Explicit

**Check Component Boundaries:**
```typescript
// 🔍 LOOK FOR: Unclear boundaries

// ❌ VIOLATION - Mixed concerns
'use client'
export function MixedComponent() {
  // Server data processing mixed with client interaction
  const processedData = complexServerOperation(data)
  const [state, setState] = useState()
  
  return <div>...</div>
}

// ✅ CORRECT - Clear separation
// Server component
export async function DataContainer() {
  const processedData = await complexServerOperation()
  return <InteractiveView data={processedData} />
}

// Client component  
'use client'
export function InteractiveView({ data }) {
  const [state, setState] = useState()
  return <div>...</div>
}
```

**Review Questions:**
- [ ] Is there a clear separation between server and client logic?
- [ ] Are props passed cleanly from server to client?
- [ ] Is the "use client" boundary as deep as possible?

### Law 6: Progressive Enhancement Always

**Test Without JavaScript:**
```bash
# Disable JavaScript in browser and test:
1. Does the page load?
2. Can you navigate?
3. Do forms submit?
4. Is content readable?
```

**Check Form Implementation:**
```typescript
// 🔍 LOOK FOR: JS-dependent forms

// ❌ VIOLATION - Only works with JS
'use client'
export function JSOnlyForm() {
  const handleSubmit = (e) => {
    e.preventDefault()
    // API call
  }
  return <form onSubmit={handleSubmit}>...</form>
}

// ✅ CORRECT - Progressive enhancement
export function ProgressiveForm() {
  return (
    <form action="/api/submit" method="POST">
      <input name="email" required />
      <button type="submit">Submit</button>
      <ClientEnhancements />  {/* Optional JS features */}
    </form>
  )
}
```

**Review Questions:**
- [ ] Do forms work without JavaScript?
- [ ] Is core functionality available without JS?
- [ ] Are client features truly enhancements?

### Law 7: Route Groups for Organization

**Check Route Structure:**
```
// 🔍 LOOK FOR: Logical grouping opportunities

// ❌ VIOLATION - Flat structure
app/
  login/
  register/
  reset-password/
  dashboard/
  settings/
  profile/

// ✅ CORRECT - Grouped structure  
app/
  (auth)/
    login/
    register/
    reset-password/
  (app)/
    dashboard/
    settings/
    profile/
```

**Review Questions:**
- [ ] Are related routes grouped appropriately?
- [ ] Do groups share layouts when sensible?
- [ ] Is the grouping logical for the feature?

### Law 8: Loading and Error States are First-class

**Check Error Handling:**
```typescript
// 🔍 LOOK FOR: Missing error boundaries

// ❌ VIOLATION - No error handling
export default async function DataPage() {
  const data = await fetchData()  // Could throw
  return <DataView data={data} />
}

// ✅ CORRECT - Proper error handling
// error.tsx
'use client'
export default function Error({ error, reset }) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}

// loading.tsx
export default function Loading() {
  return <Skeleton />
}
```

**Review Questions:**
- [ ] Does the route have error.tsx?
- [ ] Does the route have loading.tsx?
- [ ] Are Suspense boundaries used for granular loading?

### Law 9: Metadata is Declarative

**Check Metadata Implementation:**
```typescript
// 🔍 LOOK FOR: Manual head manipulation

// ❌ VIOLATION - Direct head manipulation
'use client'
export function BadComponent() {
  useEffect(() => {
    document.title = 'New Title'  // Wrong!
  }, [])
}

// ✅ CORRECT - Declarative metadata
export const metadata = {
  title: 'Page Title',
  description: 'Page description',
}

// Or dynamic
export async function generateMetadata({ params }) {
  const data = await fetchData(params.id)
  return {
    title: data.title,
    description: data.description,
  }
}
```

**Review Questions:**
- [ ] Is metadata exported properly?
- [ ] Are dynamic routes using generateMetadata?
- [ ] No manual DOM manipulation for meta tags?

### Law 10: Performance is Architecture

**Check Performance Impact:**
```bash
# Run bundle analysis
npm run build
npm run analyze  # Check bundle size
```

**Look for Performance Issues:**
```typescript
// 🔍 LOOK FOR: Performance problems

// ❌ VIOLATION - Large client bundle
'use client'
import HeavyLibrary from 'heavy-library'  // 500KB!
import AnotherBigLib from 'another-big-lib'  // 300KB!

// ✅ CORRECT - Code splitting
'use client'
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(
  () => import('./heavy-component'),
  { 
    loading: () => <Skeleton />,
    ssr: false  // If not needed on server
  }
)
```

**Review Questions:**
- [ ] Are large libraries dynamically imported?
- [ ] Is the client bundle size reasonable?
- [ ] Are images optimized with next/image?
- [ ] Is data fetched in parallel where possible?

### Law 11: File Extensions Match Content

**Check File Extensions:**
```typescript
// 🔍 LOOK FOR: Incorrect file extensions

// ❌ VIOLATION - .tsx without JSX
// utils/format.tsx
export function formatDate(date: Date) {
  return date.toISOString()  // No JSX!
}

// ✅ CORRECT - .ts for non-JSX
// utils/format.ts
export function formatDate(date: Date) {
  return date.toISOString()
}

// ❌ VIOLATION - .ts with JSX
// components/card.ts
export function Card({ children }) {
  return <div>{children}</div>  // Has JSX!
}

// ✅ CORRECT - .tsx for JSX
// components/card.tsx
export function Card({ children }) {
  return <div>{children}</div>
}
```

**Review Questions:**
- [ ] Do .tsx files contain JSX?
- [ ] Are .ts files free of JSX?
- [ ] Are server actions using .ts?
- [ ] Are components using .tsx?

## Review Comments Template

### For Violations

```markdown
## 🔴 Law Violation: [Law Name]

**Issue:** [Describe the violation]

**Current Code:**
\```typescript
[Problematic code]
\```

**Suggested Fix:**
\```typescript
[Corrected code]
\```

**Why this matters:** [Impact explanation]
```

### For Suggestions

```markdown
## 💡 Suggestion: [Improvement Type]

**Observation:** [What you noticed]

**Alternative Approach:**
\```typescript
[Suggested code]
\```

**Benefits:** [Why this is better]
```

### For Good Practices

```markdown
## ✅ Good Implementation

**What works well:** [Positive feedback]

This follows Law [X] perfectly by [explanation].
```

## Common Violations Quick Reference

### 1. Unnecessary Client Components
- Look for: "use client" without hooks/handlers
- Fix: Remove directive, make server component

### 2. Client-side Data Fetching  
- Look for: useEffect + fetch
- Fix: Move to server component

### 3. Poor Error Handling
- Look for: Missing error.tsx
- Fix: Add error boundaries

### 4. Scattered Files
- Look for: Related files in different folders
- Fix: Co-locate in route folder

### 5. Large Client Bundles
- Look for: Big imports in client components
- Fix: Dynamic imports, code splitting

## Review Workflow

### 1. Initial Check (5 minutes)
- [ ] PR builds successfully
- [ ] Tests pass
- [ ] File structure makes sense
- [ ] No obvious law violations

### 2. Deep Review (15-30 minutes)
- [ ] Check each changed file against laws
- [ ] Verify architectural decisions
- [ ] Test progressive enhancement
- [ ] Review performance impact

### 3. Feedback (5-10 minutes)
- [ ] Write clear, actionable comments
- [ ] Suggest specific improvements
- [ ] Acknowledge good practices
- [ ] Set expectations for fixes

### 4. Follow-up
- [ ] Re-review after changes
- [ ] Verify all issues addressed
- [ ] Approve when laws are followed

## Escalation Path

If you encounter:

1. **Minor violations** → Request changes with suggestions
2. **Major architectural issues** → Discuss with team lead
3. **Repeated violations** → Schedule team education session
4. **Unclear situations** → Consult architecture team

## Review Metrics

Track these metrics for team improvement:

- Common violation types
- Review turnaround time
- Fix implementation time
- Recurring issues by developer
- Law adoption rate

Use these insights to improve team education and tooling.