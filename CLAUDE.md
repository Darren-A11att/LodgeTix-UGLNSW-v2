# LodgeTix-UGLNSW-v2

## Role and Purpose
LodgeTix is a ticketing platform for Masonic events, specifically built for the United Grand Lodge of NSW & ACT. This Next.js application handles event registration, ticket sales, and payment processing for Masonic events including Grand Installations and other ceremonial occasions.

## Tech Stack
- **Framework**: Next.js 15.2.4 with React 19
- **Styling**: TailwindCSS with shadcn/ui components
- **State Management**: Zustand for client-side state
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payment Processing**: Stripe
- **Form Handling**: React Hook Form with Zod validation

## Key Directories
- `/app`: Next.js App Router pages and API routes
- `/components`: React components (UI elements, forms, registration flow)
- `/contexts`: React context providers (auth, registration)
- `/lib`: Utility functions, API services, and Supabase client
- `/shared`: Shared types, components, and utilities
- `/supabase`: Database migrations and schema definitions

## Commands and Workflows

### Development
```bash
# Start development server
npm run dev

# Build the application
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

### Database
The application uses Supabase for database and authentication. Migrations are stored in `/supabase/migrations/`.

### API
API routes are in `/app/api/` with endpoints for:
- Authentication
- Stripe payment processing

## Key Features
1. **Event Registration System**: Multi-step wizard for attendee registration
2. **Masonic-specific Forms**: Special fields for Masonic rank, lodge information
3. **Ticket Management**: Selection and payment for different ticket types
4. **Payment Processing**: Stripe integration for secure payments
5. **Authentication**: Login for organizers and attendees
6. **Responsive Design**: Mobile-friendly UI with Tailwind CSS

## Special Patterns and Conventions

### Database Schema
- Tables use PascalCase (e.g., `Events`, `Tickets`, `Registrations`)
- Helper functions in `/lib/supabase.ts` ensure consistent table name casing

### Code Organization
- UI components in `/components/ui/` use shadcn/ui conventions
- Form components organized by entity type (mason, guest)
- Registration flow is a multi-step wizard with state managed via Zustand

### UUID Migration
The system is transitioning to UUIDs for primary keys, with compatibility layer in `id-transition-utils.ts`.

## Special Notes and Gotchas
1. **Environment Variables**: The app requires Supabase and Stripe environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `STRIPE_SECRET_KEY`

2. **Authentication Flow**: Middleware restricts access to organizer routes

3. **Form Validation**: Complex validation logic for different attendee types (mason vs guest)

4. **Lazy Loading**: Component-heavy sections use dynamic imports for better performance

5. **Data Normalization**: Helper functions ensure consistent data format between legacy and new schemas