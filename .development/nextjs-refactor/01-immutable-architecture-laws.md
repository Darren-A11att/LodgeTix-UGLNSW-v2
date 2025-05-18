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
- Use strict TypeScript configuration with all strict flags enabled
- Never use `any` type - use `unknown` for truly unknown types
- Implement type guards for runtime validation of external data
- Use discriminated unions for complex state management
- Prefer `readonly` and `as const` for immutable data
- Export types from dedicated type files
- All function parameters and return types must be explicit
- Use Result types for error handling instead of try/catch

### Law 6: Data Fetching at the Right Level
- Fetch data at the highest possible component level
- Use Server Components for data fetching when possible
- Implement proper loading and error states with discriminated unions
- Cache appropriately using Next.js caching mechanisms
- Type all API responses with explicit interfaces
- Use type guards to validate external data at runtime
- Return Result types from data fetching functions for type-safe error handling

### Law 7: Separation of Concerns
- Business logic stays in services/utilities (`.ts` files)
- UI logic stays in components (`.tsx` files)
- Data fetching logic stays in server components or API routes
- State management logic stays in appropriate state solutions
- Type definitions stay in dedicated `types/` directories
- Use named exports only - avoid default exports for better refactoring
- Export types separately from implementations using `export type`

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

### Law 11: File Extensions Match Content
- Use `.tsx` ONLY for files containing JSX elements (components, pages, layouts)
- Use `.ts` for all other TypeScript files:
  - Server actions (`actions.ts`)
  - Type definitions (`types.ts`)
  - Utility functions (`utils.ts`)
  - API routes (`route.ts`)
  - Configuration files (`config.ts`)
  - Services and business logic (`service.ts`)
- This distinction improves clarity, tooling, and bundle optimization
- Configuration files at root level always use `.ts` (middleware.ts, instrumentation.ts)

### Law 12: Type Safety Patterns Must Be Followed
- All TypeScript code must follow the established type safety patterns
- Strict configuration is mandatory in tsconfig.json
- Type safety is non-negotiable - no exceptions
- See [Type Safety Patterns](./02-type-safety-patterns.md) for comprehensive patterns and examples

### Law 13: Law Creation Follows Process
- New laws must be created following the established SOP
- Laws must be necessary, not nice-to-have
- Laws must be enforceable and measurable
- Laws must integrate with existing laws, not duplicate
- See [SOP-001-How-To-Write-Laws.md](./SOP-001-How-To-Write-Laws.md) for the process

### Law 14: Domain-Specific Laws Are Mandatory
- UI components must follow [UI Design Laws](./02-immutable-ui-design-laws.md)
- Themes must adhere to [Theme Design Laws](./13-theme-design-laws.md)
- Internationalization follows [i18n Laws](./14-i18n-laws.md)
- Accessibility enforced by [Accessibility Laws](./15-accessibility-laws.md)
- Error handling complies with [Error Handling Laws](./17-error-handling-laws.md)
- Logging adheres to [Logging Laws](./18-logging-laws.md)
- Deployments follow [Deployment Laws](./20-deployment-laws.md)
- Security enforced by [Security Laws](./21-security-laws.md)