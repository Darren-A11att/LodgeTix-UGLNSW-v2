# Issue: Misleading Route Parameter Naming [id] vs Slug

**Status:** 🟡 YELLOW  
**Severity:** Low  
**Category:** Frontend Routing

## Problem Description
The event routes use `[id]` as the parameter name but actually receive and expect slugs. This creates confusion about what type of value should be passed.

## Evidence
- Route structure: `/app/events/[id]/page.tsx`
- URLs use slugs: `/events/grand-proclamation-2025`
- `generateStaticParams()` returns slugs for the `id` parameter
- Code handles both via `getEventByIdOrSlug()` but naming suggests UUID only

## Impact
- Developer confusion about parameter type
- Potential for bugs if someone assumes it's always a UUID
- Inconsistent with RESTful conventions
- Makes debugging harder

## Root Cause
Historical naming - the route was likely created when events used numeric IDs, then adapted to use slugs without renaming the route parameter.

## Fix Plan

### Immediate Action
No immediate action needed - system works correctly despite naming issue.

### Long-term Solution
1. Rename route from `[id]` to `[slug]`:
   ```
   /app/events/[id]/ → /app/events/[slug]/
   ```
2. Update all references to use `params.slug` instead of `params.id`
3. Keep `getEventByIdOrSlug()` for backwards compatibility
4. Add clear comments about parameter expectations

### Alternative (Less Disruptive)
Add clear documentation/comments in the route files:
```typescript
// Note: Despite being named 'id', this parameter receives slugs
// The getEventByIdOrSlug function handles both formats
```

## Verification Steps
```bash
# Find all references to the route parameter
grep -r "params.id" app/events/

# Check for any hardcoded UUID assumptions
grep -r "uuid" app/events/[id]/
```