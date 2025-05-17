# Application of Laws - Decision Framework

## When and How to Apply the Immutable Laws

### Understanding the Request Type

When a Product Manager says "users want to do _____", first classify the request:

#### 1. Bug Fix
**Definition**: Something that should work but doesn't
**Decision Tree**:
- Is it a display issue? → Fix in the component
- Is it a logic issue? → Fix in the service/utility
- Is it a data issue? → Fix in the API/database layer

**Law Application**:
- Law 7: Fix at the correct separation of concerns
- Law 5: Ensure fix maintains type safety
- Law 8: Verify fix works without JavaScript if applicable

#### 2. Enhancement
**Definition**: Making something that works, work better
**Decision Tree**:
- Is it UI/UX improvement? → Enhance existing component
- Is it performance? → Apply Law 9 optimization patterns
- Is it accessibility? → Update component with proper ARIA

**Law Application**:
- Law 10: Maintain consistency with existing patterns
- Law 6: Keep data fetching on server if possible
- Law 4: Follow existing naming conventions

#### 3. New Feature
**Definition**: Adding completely new functionality
**Decision Tree**:
- Does similar functionality exist? → Reuse and extend
- Is it route-based? → Create new route structure
- Is it a shared capability? → Create in appropriate \_components

**Law Application**:
- Law 2: Honor file-based routing for new pages
- Law 3: Co-locate all related files
- Law 1: Start with server components

#### 4. Improvement
**Definition**: Refactoring or modernizing existing code
**Decision Tree**:
- Is it moving to newer patterns? → Follow migration guidelines
- Is it consolidating duplicated code? → Create shared component
- Is it updating dependencies? → Ensure type safety maintained

**Law Application**:
- All laws apply - this is where consistency matters most
- Focus on Laws 3 (co-location) and 7 (separation of concerns)

## Decision Matrix

| Request Type | Existing Code? | Similar Feature? | Action | Primary Laws |
|-------------|---------------|-----------------|---------|--------------|
| Bug Fix | Yes | N/A | Fix in place | 5, 7, 10 |
| Enhancement | Yes | N/A | Enhance existing | 1, 6, 9, 10 |
| New Feature | No | Yes | Extend similar | 2, 3, 4 |
| New Feature | No | No | Create new | All laws |
| Improvement | Yes | N/A | Refactor | 3, 7, 10 |

## Code Reuse Decision Tree

```
Does similar functionality exist?
├─ YES
│  ├─ Is it in the same route?
│  │  ├─ YES → Extend local component
│  │  └─ NO → Is it used in 3+ places?
│  │     ├─ YES → Move to shared components
│  │     └─ NO → Duplicate and customize
│  └─ Can it be generalized?
│     ├─ YES → Create generic version
│     └─ NO → Create new component
└─ NO → Create new following all laws
```

## Enhancement vs New Feature

### It's an Enhancement when:
- The route already exists
- The component already exists
- You're adding to existing functionality
- You're improving performance/UX
- You're fixing accessibility

### It's a New Feature when:
- New route is needed
- New data model is required
- New user journey is created
- New external integration
- Completely new UI paradigm

## Server vs Client Component Decision

```
Is user interaction required?
├─ NO → Server Component (Law 1)
└─ YES
   ├─ Is it just display logic?
   │  ├─ YES → Server Component
   │  └─ NO → Is data fetching needed?
   │     ├─ YES → Server Component with Client children
   │     └─ NO → Client Component
   └─ Does it need browser APIs?
      ├─ YES → Client Component
      └─ NO → Server Component
```

## File Placement Rules

### New Component Placement
1. **Used in one route**: `app/[route]/_components/`
2. **Used in one route group**: `app/(group)/_components/`
3. **Used across groups**: `app/_components/`
4. **Used with external packages**: `lib/[package-name]/`

### New Utility Placement
1. **Route-specific logic**: `app/[route]/_lib/`
2. **Feature-specific logic**: `lib/[feature]/`
3. **Shared business logic**: `lib/services/`
4. **Generic helpers**: `lib/utils/`

## Type Safety Application

### Always Create Types When:
- New API endpoint
- New database model
- New component props
- New function parameters
- New state management

### Type Placement:
- Route types: `app/[route]/_types/`
- Shared types: `shared/types/`
- API types: With the API route
- Component types: In the component file

## Performance Decisions

### When to Optimize:
1. **Always**: Images (use next/image)
2. **Large Lists**: Virtualization or pagination
3. **Heavy Components**: Dynamic imports
4. **Repeated Calculations**: useMemo
5. **Frequent Re-renders**: memo

### When NOT to Optimize:
- Premature optimization
- Simple components
- Small datasets
- One-time calculations

## Common Scenarios

### Scenario 1: "Add a filter to the events page"
- Type: Enhancement
- Action: Modify existing EventList component
- Laws: Keep filter state in URL (Law 6), maintain type safety (Law 5)

### Scenario 2: "Users need a dashboard"
- Type: New Feature
- Action: Create new route structure
- Laws: All laws apply, start with Law 2 (routing)

### Scenario 3: "Search isn't working"
- Type: Bug Fix
- Action: Fix in existing search component
- Laws: Maintain separation of concerns (Law 7)

### Scenario 4: "Make forms work offline"
- Type: Enhancement/New Feature
- Action: Add service worker, enhance forms
- Laws: Progressive enhancement (Law 8)

## Remember

1. **Start with the laws, not the code**
2. **Classify the request before coding**
3. **Reuse when possible, create when necessary**
4. **Consistency trumps perfection**
5. **When in doubt, check existing patterns**