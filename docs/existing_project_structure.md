# LodgeTix-UGLNSW-v2 Project Structure

## Overview
LodgeTix-UGLNSW-v2 is a Next.js 15 application built for the United Grand Lodge of NSW & ACT, providing a comprehensive ticketing platform for Masonic events.

## Technology Stack
- **Framework**: Next.js 15.2.4 with App Router
- **UI**: React 19, TypeScript 5, TailwindCSS
- **Component Library**: shadcn/ui
- **State Management**: Zustand, React Context
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payment Processing**: Stripe
- **Form Handling**: React Hook Form with Zod validation
- **Testing**: Playwright for E2E tests
- **Icons**: Lucide React

## Directory Structure

### Root Configuration Files
```
├── bun.lock                    # Bun package manager lock file
├── components.json             # shadcn/ui configuration
├── middleware.ts              # Next.js middleware for route protection
├── next.config.mjs            # Next.js configuration
├── package.json               # Project dependencies and scripts
├── playwright.config.ts       # Playwright test configuration
├── postcss.config.mjs         # PostCSS configuration for TailwindCSS
├── tailwind.config.ts         # TailwindCSS configuration
├── tsconfig.json              # TypeScript configuration
├── vitest.config.ts           # Vitest test configuration
```

### Core Application Structure

#### `/app` - Next.js App Router
```
├── app/
│   ├── layout.tsx             # Root layout wrapper
│   ├── page.tsx               # Homepage
│   ├── global-error.tsx       # Global error handling
│   ├── not-found.tsx          # 404 page
│   ├── loading.tsx            # Loading states
│   ├── about/                 # About page
│   ├── account/               # Account management
│   │   └── tickets/           # User ticket history
│   ├── api/                   # API Routes
│   │   ├── check-tables/      # Database verification
│   │   ├── clear-cache/       # Cache management
│   │   ├── registrations/     # Registration endpoints
│   │   │   ├── route.ts       # Main registration API
│   │   │   ├── lodge/         # Lodge-specific registration
│   │   │   └── [id]/          # Individual registration management
│   │   │       ├── payment/   # Payment processing
│   │   │       └── verify-payment/
│   │   ├── send-confirmation-email/
│   │   ├── stripe/            # Stripe integration
│   │   │   ├── create-payment-intent/
│   │   │   └── webhook/
│   │   └── verify-turnstile-and-anon-auth/
│   ├── contact/               # Contact page
│   ├── events/                # Event pages and registration
│   │   ├── [slug]/            # Dynamic event pages
│   │   │   ├── [childSlug]/   # Sub-event pages
│   │   │   │   └── register/  # Registration flow
│   │   │   └── register/      # Main event registration
│   │   └── page.tsx           # Events listing
│   ├── help/                  # Help/support page
│   ├── privacy/               # Privacy policy
│   ├── registrations/         # Registration management
│   └── test-events/           # Test event pages
```

#### `/components` - React Components
```
├── components/
│   ├── about/                 # About page components
│   ├── auth/                  # Authentication components
│   ├── ui/                    # shadcn/ui components library
│   ├── register/              # Registration flow components
│   │   ├── Forms/             # Form components
│   │   │   ├── attendee/      # Attendee-specific forms
│   │   │   ├── basic-details/ # Basic information forms
│   │   │   ├── guest/         # Guest registration forms
│   │   │   ├── mason/         # Mason-specific forms
│   │   │   ├── shared/        # Shared form components
│   │   │   └── types/         # Form type definitions
│   │   ├── Functions/         # Utility components
│   │   ├── RegistrationWizard/# Multi-step registration wizard
│   │   │   ├── Attendees/     # Attendee management
│   │   │   ├── Layouts/       # Layout components
│   │   │   ├── Steps/         # Wizard steps
│   │   │   ├── Summary/       # Summary components
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   ├── migration/     # Migration helpers
│   │   │   └── payment/       # Payment components
│   │   └── layout.tsx         # Registration layout
│   ├── event-card.tsx         # Event display card
│   ├── event-timeline.tsx     # Event timeline display
│   ├── featured-events-*.tsx  # Featured events components
│   ├── grand-installation-hero.tsx
│   ├── location-initializer.tsx
│   └── masonic-logo.tsx
```

#### `/lib` - Core Libraries and Services
```
├── lib/
│   ├── api/                   # API service layers
│   │   ├── admin/             # Admin API services
│   │   ├── event-*.ts         # Event-related services
│   │   ├── package-*.ts       # Package services
│   │   ├── registration-*.ts  # Registration services
│   │   ├── grandLodges.ts     # Grand Lodge data
│   │   ├── lodges.ts          # Lodge data
│   │   └── ticketService.ts   # Ticket management
│   ├── services/              # Business logic services
│   │   ├── content-service.ts
│   │   ├── event-service.ts
│   │   ├── event-tickets-service*.ts
│   │   ├── homepage-service.ts
│   │   └── masonic-services.ts
│   ├── constants/             # Application constants
│   ├── supabase*.ts          # Supabase client and utilities
│   ├── stripe.ts             # Stripe configuration
│   ├── database-mappings.ts  # Database field mappings
│   ├── formatters.ts         # Data formatters
│   ├── utils.ts              # General utilities
│   └── *Store.ts             # Zustand stores
```

#### `/shared` - Shared Resources
```
├── shared/
│   ├── components/           # Shared UI components
│   ├── data/                 # Static data (e.g., phoneCountries)
│   ├── types/                # TypeScript type definitions
│   │   ├── customer.ts
│   │   ├── database.ts
│   │   ├── event.ts
│   │   ├── guest.ts
│   │   ├── mason.ts
│   │   ├── register.ts
│   │   └── ticket.ts
│   └── utils/                # Shared utilities
```

#### `/contexts` - React Context Providers
```
├── contexts/
│   ├── auth-provider.tsx     # Authentication context
│   └── registration-context.tsx # Registration state context
```

#### `/hooks` - Custom React Hooks
```
├── hooks/
│   ├── use-mobile.tsx        # Mobile detection hook
│   └── use-toast.ts          # Toast notification hook
```

#### `/supabase` - Database Configuration
```
├── supabase/
│   ├── config.toml           # Supabase configuration
│   ├── migrations/           # SQL migration files
│   ├── supabase.ts          # Supabase utilities
│   └── types.ts             # Generated database types
```

#### `/utils` - Utility Functions
```
├── utils/
│   ├── sentry/              # Error tracking configuration
│   └── supabase/            # Supabase client utilities
│       ├── admin.ts         # Admin client
│       ├── client.ts        # Browser client
│       ├── middleware.ts    # Middleware client
│       └── server.ts        # Server-side client
```

#### `/__tests__` - Test Files
```
├── __tests__/
│   └── e2e/                 # End-to-end tests
│       ├── config/          # Test configuration
│       ├── page-objects/    # Page object models
│       ├── registration/    # Registration flow tests
│       ├── utils/           # Test utilities
│       └── smoke.spec.ts    # Smoke tests
```

#### `/styles` - Global Styles
```
├── styles/
│   └── globals.css          # Global CSS with Tailwind imports
```

#### `/public` - Static Assets
```
├── public/
│   ├── placeholder-*.{jpg,png,svg} # Placeholder images
```

#### `/scripts` - Utility Scripts
```
├── scripts/
│   ├── cleanup-supabase-files.sh
│   ├── consolidate-supabase-files.ts
│   └── supabase-cleanup-backup/
```

#### `/store` - State Management
```
├── store/
│   └── registrationStore.ts  # Main registration store
```

## Key Architectural Patterns

### 1. **Next.js App Router**
- Server Components by default
- Client Components marked with 'use client'
- API routes in `/app/api/`
- Dynamic routing with `[param]` folders

### 2. **Component Organization**
- Feature-based organization (register, events, etc.)
- Shared UI components in `/components/ui/`
- Form components separated by user type (mason, guest)

### 3. **State Management**
- Zustand for complex client state (registration flow)
- React Context for authentication and global state
- Local component state for simple UI interactions

### 4. **Database Architecture**
- Supabase for PostgreSQL database and authentication
- Migration files track schema changes
- PascalCase table names with helper utilities

### 5. **Form Handling**
- React Hook Form for form state management
- Zod schemas for validation
- Multi-step wizard pattern for complex forms

### 6. **API Design**
- RESTful API routes in `/app/api/`
- RPC-style services for complex operations
- Separation between CRUD and business logic services

### 7. **Testing Strategy**
- Playwright for E2E testing
- Page Object Model pattern
- Separate test data configuration

### 8. **Security**
- Middleware for route protection
- Supabase RLS (Row Level Security)
- Environment variables for sensitive data

## Development Workflow
1. Local development with `npm run dev`
2. Database migrations via Supabase CLI
3. E2E testing with Playwright
4. Build verification with `npm run build`
5. Deployment to Vercel (inferred)

## Code Standards
- TypeScript strict mode
- Functional components with hooks
- TailwindCSS for styling
- shadcn/ui for component library
- SOLID principles and clean architecture