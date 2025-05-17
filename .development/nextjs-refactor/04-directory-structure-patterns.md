# Directory Structure Patterns

## Immutable Directory Laws

### 1. App Directory Structure

```
app/
├── (routes)/                    # Route groups for logical organization
│   ├── (customer)/             # Public-facing routes
│   │   ├── layout.tsx          # Customer layout
│   │   ├── page.tsx            # Home page
│   │   ├── events/
│   │   │   ├── page.tsx        # Events listing
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx    # Event detail
│   │   │   │   ├── loading.tsx
│   │   │   │   ├── error.tsx
│   │   │   │   └── _components/
│   │   │   │       ├── EventHeader.tsx
│   │   │   │       └── EventDetails.tsx
│   │   │   └── _components/
│   │   │       └── EventCard.tsx
│   │   └── register/
│   │       └── [eventId]/
│   │           ├── layout.tsx   # Registration wizard layout
│   │           ├── _registrionwizard/     # pages for each individual steps
│   │           ├── attendees/
│   │           ├── tickets/
│   │           ├── payment/
│   │           └── _components/
│   │
│   ├── (admin)/                # Protected admin routes
│   │   ├── layout.tsx          # Admin layout with auth
│   │   ├── dashboard/
│   │   └── _components/
│   │
│   └── (auth)/                 # Authentication routes
│       ├── login/
│       └── signup/
│
├── api/                        # API routes
│   ├── stripe/
│   └── auth/
│
└── _components/                # Global shared components
    ├── layouts/
    └── ui/
```

### 2. Component Organization Rules

#### Rule 1: Component Placement Hierarchy
1. **Route-specific**: `app/path/to/route/_components/`
2. **Feature-shared**: `app/(group)/_components/`
3. **Global-shared**: `app/_components/`

#### Rule 2: Component Naming Conventions
- PascalCase for all components
- Descriptive names that indicate purpose
- Prefix with context when needed (e.g., `EventCard`, `AdminSidebar`)

#### Rule 3: File Organization Within Routes
```
route-folder/
├── page.tsx                    # Main route component
├── loading.tsx                 # Loading state
├── error.tsx                   # Error boundary
├── not-found.tsx              # 404 handler
├── layout.tsx                 # Route layout
├── _components/               # Route-specific components
│   ├── Feature.tsx
│   ├── Feature.module.css
│   └── hooks/
│       └── useFeature.ts
├── _actions/                  # Server actions
├── _lib/                      # Route utilities
└── _types/                    # Route-specific types
```

### 3. Shared Code Organization

```
├── components/                 # DELETE - use app/_components
├── lib/                       # Global utilities
│   ├── api/                   # API clients
│   ├── db/                    # Database utilities
│   ├── services/              # Business logic
│   └── utils/                 # Helper functions
├── shared/                    # Shared across entire app
│   ├── types/                 # Global types
│   ├── constants/             # Global constants
│   └── schemas/               # Validation schemas
└── public/                    # Static assets
```

### 4. Import Path Rules

#### Always use path aliases:
```typescript
// ❌ Bad
import { Button } from '../../../components/ui/button'

// ✅ Good
import { Button } from '@/app/_components/ui/button'
```

#### Path alias configuration:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["app/_components/*"],
      "@/lib/*": ["lib/*"],
      "@/shared/*": ["shared/*"]
    }
  }
}
```

### 5. Route Group Rules

1. **Customer Routes**: `(customer)` - all public-facing pages
2. **Admin Routes**: `(admin)` - protected administrative pages
3. **Auth Routes**: `(auth)` - authentication flows
4. **API Routes**: No grouping needed, use `app/api/`

### 6. Component Co-location Patterns

```
_components/
├── ComponentName/
│   ├── index.tsx              # Main component
│   ├── ComponentName.tsx      # Component implementation
│   ├── ComponentName.test.tsx # Tests
│   ├── ComponentName.module.css # Styles (if not using Tailwind)
│   ├── hooks/                 # Component-specific hooks
│   └── utils/                 # Component utilities
```

### 7. Migration Strategy

When moving from legacy structure:
1. Move route pages first
2. Co-locate components with their routes
3. Elevate truly shared components last
4. Update imports progressively
5. Delete empty legacy directories

### 8. Forbidden Patterns

Never do these:
- ❌ Components outside of `_components` folders
- ❌ Business logic in components
- ❌ Deep nesting beyond 3 levels
- ❌ Duplicate components in multiple locations
- ❌ Generic names like `utils` or `helpers` at route level
- ❌ Mixing server and client code improperly