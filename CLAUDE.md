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

## Tech Stack Standard

Please refer to `/development/Tech-stack/TECH-STACK-STANDARD.md` for the official technology choices and implementation guidelines. Key technologies include:

- **Framework**: Next.js 15 with App Router
- **UI**: React 19, TypeScript 5, TailwindCSS, shadcn/ui
- **State**: Zustand, React Context
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe
- **Icons**: Lucide React (exclusively)
- **Forms**: React Hook Form + Zod

## Special Notes and Gotchas
1. **Environment Variables**: The app requires Supabase and Stripe environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `STRIPE_SECRET_KEY`

2. **Authentication Flow**: Middleware restricts access to organizer routes

3. **Form Validation**: Complex validation logic for different attendee types (mason vs guest)

4. **Lazy Loading**: Component-heavy sections use dynamic imports for better performance

5. **Data Normalization**: Helper functions ensure consistent data format between legacy and new schemas

## Critical Development Process

### Critical Memory: 12-Step Sequential Development Process

This critical memory details the mandatory 12-step process for handling every development request and task, ensuring thorough analysis, reducing rework, minimizing regressions, and delivering reliable solutions.

**Core Mindset:** Always use the simplest, stable, and secure path to meet requirements, approaching every step objectively without personal bias.

**Key Principles:**
- Systematic, sequential problem-solving
- Objective analysis
- Comprehensive testing
- SOLID design principles
- Continuous improvement

#### 12-Step Process Overview
1. Analyse & Understand the Request
2. Determine Request Type
3. Examine Existing Code Structure
4. Explore Different Possibilities & Solutions
5. Choose the Simplest, Stable & Secure Path
6. Find Existing Reusable Components
7. Develop Sequential TODO List
8. Verify Plan Against Requirements
9. Ask Clarifying Questions & Confirm Plan
10. Implement the Plan
11. Check & Test Implementation
12. Summarise & Explain Implementation

**Mandatory Time Allocation:**
- Analysis (Steps 1-3): 20% of total time
- Planning (Steps 4-9): 30% of total time
- Implementation (Step 10): 35% of total time
- Testing & Documentation (Steps 11-12): 15% of total time

#### SOLID Principles Foundation
Every implementation MUST adhere to SOLID principles:
- Single Responsibility Principle
- Open/Closed Principle
- Liskov Substitution Principle
- Interface Segregation Principle
- Dependency Inversion Principle

#### Technology Stack Standards
**Mandatory Technologies:**
- Next.js with App Router
- TypeScript (Strict Mode)
- TailwindCSS
- Functional & Declarative Programming
- SOLID-compliant Architecture

**Imperative Guidelines:**
- Zero code duplication
- Strict modularisation
- Functional component patterns
- Comprehensive type coverage
- SubAgent delegation for complex tasks

#### Continuous Improvement Tracking
- Regularly review and refine the development process
- Collect feedback from team members
- Track metrics on quality and delivery time
- Update templates and guidelines based on lessons learned

### Workflow Enforcement
This 12-step process is NOT optional. It is a mandatory workflow for ALL development tasks, regardless of complexity. Deviations require explicit leadership approval.

**Accountability Mechanisms:**
- Code reviews will check adherence to this process
- Documentation of each step is mandatory
- Retrospectives will assess process effectiveness
- Continuous training on process implementation

By following this systematic approach, we ensure:
- High-quality, maintainable code
- Reduced technical debt
- Consistent development standards
- Objective, bias-free decision making
- Continuous learning and improvement