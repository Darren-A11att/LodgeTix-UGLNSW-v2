# LodgeTix Tech Stack Architecture

## Visual Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Next.js 15 (App Router) + React 19 + TypeScript 5             │
│  ┌─────────────┐ ┌──────────────┐ ┌────────────────┐          │
│  │   Pages     │ │  Components  │ │  State Mgmt    │          │
│  │  /app/*     │ │  shadcn/ui   │ │  Zustand       │          │
│  │            │ │  Custom UI   │ │  Context API   │          │
│  └─────────────┘ └──────────────┘ └────────────────┘          │
│                                                                │
│  ┌─────────────┐ ┌──────────────┐ ┌────────────────┐          │
│  │  Styling    │ │    Forms     │ │    Icons       │          │
│  │  Tailwind   │ │  React Hook  │ │  Lucide React  │          │
│  │  PostCSS    │ │  Form + Zod  │ │               │          │
│  └─────────────┘ └──────────────┘ └────────────────┘          │
├─────────────────────────────────────────────────────────────────┤
│                        API LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  Next.js API Routes (/app/api/*)                               │
│  ┌─────────────┐ ┌──────────────┐ ┌────────────────┐          │
│  │   Auth      │ │   Stripe     │ │   Webhooks     │          │
│  │  Endpoints  │ │  Integration │ │               │          │
│  └─────────────┘ └──────────────┘ └────────────────┘          │
├─────────────────────────────────────────────────────────────────┤
│                      DATA LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  Supabase (PostgreSQL + Auth + Realtime)                       │
│  ┌─────────────┐ ┌──────────────┐ ┌────────────────┐          │
│  │  Database   │ │    Auth      │ │   Realtime     │          │
│  │  Tables     │ │   Provider   │ │  Subscriptions │          │
│  └─────────────┘ └──────────────┘ └────────────────┘          │
├─────────────────────────────────────────────────────────────────┤
│                    EXTERNAL SERVICES                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌──────────────┐ ┌────────────────┐          │
│  │   Stripe    │ │    Sentry    │ │    Vercel      │          │
│  │  Payments   │ │    Error     │ │   Hosting      │          │
│  │            │ │   Tracking   │ │               │          │
│  └─────────────┘ └──────────────┘ └────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
User Interaction
      │
      ▼
React Component (Client)
      │
      ├─── Form Data ──→ React Hook Form + Zod Validation
      │                            │
      ▼                            ▼
Next.js API Route          State Update (Zustand)
      │                            │
      ▼                            ▼
Supabase Client            Local State Update
      │
      ▼
PostgreSQL Database
      │
      ├──→ Row Level Security
      │
      └──→ Realtime Broadcast
             │
             ▼
      Client Subscription
```

## Component Architecture

```
/app (Next.js App Router)
 ├── layout.tsx                 # Root layout with providers
 ├── page.tsx                   # Home page
 ├── api/                       # API routes
 │   ├── auth/                  # Auth endpoints
 │   └── stripe/                # Payment endpoints
 └── events/                    # Event pages
     └── [id]/                  # Dynamic routes

/components
 ├── ui/                        # shadcn/ui components
 │   ├── button.tsx
 │   ├── dialog.tsx
 │   └── form.tsx
 └── register/                  # Registration components
     ├── forms/                 # Form components
     └── steps/                 # Wizard steps

/lib
 ├── supabase-browser.ts        # Supabase client
 ├── stripe.ts                  # Stripe utilities
 └── api/                       # API service modules
```

## Technology Relationships

### Frontend Stack
- **Next.js** provides the framework
- **React** handles UI components
- **TypeScript** adds type safety
- **Tailwind** styles components
- **shadcn/ui** provides base components
- **Zustand** manages client state

### Backend Stack
- **Next.js API Routes** handle server logic
- **Supabase** provides database and auth
- **Stripe** processes payments
- **Sentry** tracks errors

### Development Stack
- **npm** manages packages
- **ESLint** enforces code quality
- **Vitest** runs tests
- **Git** versions code

## Type Safety Flow

```
Database Schema (Supabase)
         ↓
Type Generation (supabase gen types)
         ↓
TypeScript Interfaces
         ↓
┌─────────────────┬─────────────────┬──────────────────┐
│ Server Component│  API Routes     │ Client Component │
│ Props Types     │  Request/Response│ Props Types     │
└─────────────────┴─────────────────┴──────────────────┘
         ↓                ↓                  ↓
    Type Guards     Validation         Runtime Safety
```

## Error Handling Architecture

```
Component Error
      ↓
Error Boundary
      ↓
┌──────────────┬──────────────┬────────────────┐
│   Log Error  │ Show Fallback│ Report to     │
│   Locally    │ UI          │ Sentry        │
└──────────────┴──────────────┴────────────────┘
      ↓              ↓              ↓
   Console      User Message   Error Tracking
```

## Performance Architecture

```
┌────────────────────────────────────────────┐
│           Server Components                │
│  - Data fetching at request time          │
│  - HTML generation on server              │
│  - Automatic code splitting               │
└────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────┐
│             Streaming                      │
│  - Progressive page loading               │
│  - Suspense boundaries                    │
│  - Loading states                         │
└────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────┐
│          Client Hydration                  │
│  - Interactive components                 │
│  - Event handlers                         │
│  - Client-side state                      │
└────────────────────────────────────────────┘
```

## Testing Architecture

```
┌─────────────────────────────────────────────┐
│              Test Pyramid                   │
├─────────────────────────────────────────────┤
│     E2E Tests (Playwright)                  │
│     - Critical user journeys                │
│     - Cross-browser testing                 │
├─────────────────────────────────────────────┤
│   Integration Tests (Vitest)                │
│   - API endpoint testing                    │
│   - Component integration                   │
├─────────────────────────────────────────────┤
│ Unit Tests (Vitest + Testing Library)       │
│ - Component behavior                        │
│ - Utility functions                         │
│ - Custom hooks                              │
└─────────────────────────────────────────────┘
```

## Key Design Decisions

1. **Single Supabase Client**
   - Prevents multiple auth instances
   - Centralized configuration
   - Consistent connection management

2. **Unified Icon Library**
   - Lucide React only
   - Consistent design language
   - Optimal bundle size

3. **Server Components First**
   - Better performance
   - SEO optimization
   - Reduced client bundle

4. **Type Safety Throughout**
   - TypeScript strict mode
   - Zod validation schemas
   - Database type generation

5. **Utility-First CSS**
   - Tailwind for all styling
   - No CSS-in-JS
   - Component-level styles