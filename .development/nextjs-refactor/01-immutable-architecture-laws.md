# Immutable Architecture Laws for Next.js Projects

## Core Principles

These are the non-negotiable architectural laws that MUST be followed in all Next.js development:

### Law 1: Server Components by Default
- **Always** use Server Components unless client-side interactivity is explicitly required
- Client Components should be marked with `'use client'` directive ONLY when necessary
- Minimize the JavaScript bundle by keeping components on the server

### Law 2: File-Based Routing is Sacred
- The app directory structure directly maps to URL paths
- Never circumvent the file-based routing system
- Use route groups `(groupname)` for logical organization without affecting URLs

### Law 3: Co-location is King
- Components, styles, tests, and utilities that are used together MUST live together
- Keep files as close as possible to where they are used
- Only elevate to shared directories when used in multiple routes

### Law 4: Convention Over Configuration
- Follow Next.js naming conventions strictly:
  - `page.tsx` for route pages
  - `layout.tsx` for layouts
  - `loading.tsx` for loading states
  - `error.tsx` for error boundaries
  - `not-found.tsx` for 404 pages
  - `_components/` for route-specific components

### Law 5: Type Safety is Mandatory
- TypeScript is required, not optional
- All components, functions, and data structures MUST be properly typed
- Use strict TypeScript configuration
- Never use `any` type without explicit justification

### Law 6: Data Fetching at the Right Level
- Fetch data at the highest possible component level
- Use Server Components for data fetching when possible
- Implement proper loading and error states
- Cache appropriately using Next.js caching mechanisms

### Law 7: Separation of Concerns
- Business logic stays in services/utilities
- UI logic stays in components
- Data fetching logic stays in server components or API routes
- State management logic stays in appropriate state solutions

### Law 8: Progressive Enhancement
- Build features that work without JavaScript first
- Add client-side enhancements progressively
- Ensure core functionality works with JavaScript disabled

### Law 9: Performance by Design
- Use dynamic imports for code splitting
- Implement proper image optimization with Next.js Image
- Use appropriate rendering strategies (SSR, SSG, ISR)
- Minimize client-side JavaScript

### Law 10: Consistency Above Cleverness
- Follow established patterns even if you think you have a better way
- Document any necessary deviations with strong justification
- Maintain consistency across the entire codebase