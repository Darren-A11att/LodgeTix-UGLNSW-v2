# Package.json Dependencies

## Overview
This document provides a comprehensive breakdown of all dependencies used in the LodgeTix-UGLNSW-v2 project, their purposes, and version information.

## Package Manager
- **Bun**: Primary package manager (bun.lock file present)
- **npm**: Version 8.0.0+ required (packageManager field)
- **Node.js**: Minimum npm version 8.0.0 required

## Core Dependencies

### Framework & React Ecosystem

#### Next.js Stack
- **next** (15.2.4): React framework with App Router
- **react** (^19): UI library
- **react-dom** (^19): React DOM rendering

### UI Components & Styling

#### Radix UI Components
Complete suite of unstyled, accessible components:
- **@radix-ui/react-accordion** (1.2.2): Collapsible content sections
- **@radix-ui/react-alert-dialog** (1.1.4): Modal alerts
- **@radix-ui/react-avatar** (1.1.2): User avatars
- **@radix-ui/react-checkbox** (1.1.3): Checkbox inputs
- **@radix-ui/react-dialog** (1.1.4): Modal dialogs
- **@radix-ui/react-dropdown-menu** (2.1.4): Dropdown menus
- **@radix-ui/react-label** (2.1.1): Form labels
- **@radix-ui/react-popover** (1.1.4): Popover containers
- **@radix-ui/react-progress** (1.1.6): Progress indicators
- **@radix-ui/react-select** (2.1.4): Select dropdowns
- **@radix-ui/react-tabs** (1.1.2): Tab navigation
- **@radix-ui/react-toast** (1.2.4): Toast notifications
- And many more...

#### Styling & Animation
- **tailwindcss** (^3.4.17): Utility-first CSS framework
- **tailwindcss-animate** (^1.0.7): Animation utilities
- **tailwind-merge** (^2.5.5): Merge Tailwind classes safely
- **clsx** (^2.1.1): Conditional className utility
- **class-variance-authority** (^0.7.1): Component variant management

### Form Handling & Validation

- **react-hook-form** (^7.54.1): Form state management
- **@hookform/resolvers** (^3.9.1): Schema validation resolvers
- **zod** (^3.24.1): TypeScript-first schema validation

### State Management

- **zustand** (^5.0.4): Lightweight state management

### Payment Processing

- **stripe** (^18.1.0): Stripe Node.js library
- **@stripe/stripe-js** (^7.3.0): Stripe.js loader
- **@stripe/react-stripe-js** (^3.7.0): React components for Stripe

### Database & Authentication

- **@supabase/supabase-js** (^2.49.4): Supabase client
- **@supabase/ssr** (^0.6.1): SSR-compatible Supabase client

### Date & Time

- **date-fns** (3.6.0): Modern date utility library
- **react-day-picker** (8.10.1): Date picker component

### Utilities

#### Data Processing
- **uuid** (11.1.0): UUID generation
- **qrcode** (^1.5.3): QR code generation
- **pdf-lib** (^1.17.1): PDF creation and manipulation

#### Phone Number Handling
- **libphonenumber-js** (^1.12.8): Phone number parsing/formatting
- **react-phone-input-2** (^2.15.1): Phone input component

#### UI Utilities
- **cmdk** (1.0.4): Command menu component
- **sonner** (^1.7.1): Toast notifications
- **canvas-confetti** (^1.9.2): Confetti animations
- **embla-carousel-react** (8.5.1): Carousel component
- **recharts** (2.15.0): Chart library
- **vaul** (^0.9.6): Drawer component
- **input-otp** (1.4.1): OTP input component

#### Other Utilities
- **use-debounce** (^10.0.4): Debounce hook
- **react-resizable-panels** (^2.1.7): Resizable panel layouts
- **react-country-state-city** (^1.1.12): Location dropdowns

### Monitoring & Analytics

- **@sentry/nextjs** (^9.19.0): Error tracking and performance monitoring

### Email

- **resend** (^2.0.0): Email sending service

### Build Tools

- **autoprefixer** (^10.4.20): PostCSS plugin for vendor prefixes
- **postcss** (^8): CSS processing

## Development Dependencies

### Testing

- **@playwright/test** (^1.52.0): E2E testing framework
- **vitest** (^3.1.3): Unit testing framework
- **expect-playwright** (^0.8.0): Playwright assertions
- **jest-playwright-preset** (^4.0.0): Jest preset for Playwright

### Type Definitions

- **typescript** (^5): TypeScript compiler
- **@types/node** (^22): Node.js type definitions
- **@types/react** (^19): React type definitions
- **@types/react-dom** (^19): React DOM type definitions
- **@types/qrcode** (^1.5.5): QR code type definitions

### Development Tools

- **dotenv** (^16.5.0): Environment variable management
- **tsx** (^4.19.4): TypeScript execution
- **supabase** (^2.23.4): Supabase CLI

## Script Commands

### Development
```json
"dev": "next dev"                    // Start development server
"build": "next build"                // Build for production
"build:clean": "rm -rf .next && next build" // Clean build
"start": "next start"                // Start production server
"lint": "next lint"                  // Run ESLint
```

### Testing
```json
"test": "vitest"                     // Run unit tests
"test:watch": "vitest --watch"       // Watch mode
"test:coverage": "vitest --coverage" // Coverage report
"test:forms": "vitest components/register/Forms" // Test forms only
"test:e2e": "playwright test"        // Run E2E tests
"test:e2e:ui": "playwright test --ui" // UI mode
"test:e2e:debug": "playwright test --debug" // Debug mode
```

### Database & Migration
```json
"migrate:events": "tsx scripts/migrate-events-to-supabase.ts"
"verify:events": "tsx scripts/verify-events-migration.ts"
"db:rename-convention": "node scripts/apply-database-naming-standards.js"
```

### Stripe Testing
```json
"test:stripe:setup": "Create test Stripe accounts"
"test:stripe:payment": "Test basic payment flow"
"test:stripe:metadata": "Test metadata validation"
"test:stripe:webhooks": "Test webhook handling"
"test:stripe:fees": "Test fee calculations"
"test:stripe:all": "Run all Stripe tests"
"test:stripe:analyze": "Analyze test results"
```

## Version Management

### Semantic Versioning
- **Exact versions**: Critical UI components (Radix UI)
- **Caret (^)**: Allow minor updates (most dependencies)
- **No prefix**: Exact version required (date-fns, uuid)

### Update Strategy
1. **Security updates**: Apply immediately
2. **Minor updates**: Test in development first
3. **Major updates**: Careful migration planning
4. **UI components**: Test visual regressions

## Dependency Groups

### 1. Essential Runtime
- Next.js, React, React DOM
- Supabase client
- Stripe integration
- Core UI components

### 2. Development Only
- TypeScript and types
- Testing frameworks
- Build tools
- Linting/formatting

### 3. Optional Features
- Charts (recharts)
- Animations (canvas-confetti)
- Advanced UI (vaul, embla)

## Security Considerations

### Known Vulnerabilities
- Run `npm audit` regularly
- Check for security advisories
- Update dependencies promptly

### Sensitive Dependencies
- **Stripe**: Payment processing
- **Supabase**: Authentication/Database
- **Sentry**: Error tracking (may contain PII)

## Performance Impact

### Large Dependencies
1. **recharts** (2.15.0): ~500KB - Consider lazy loading
2. **pdf-lib** (^1.17.1): ~300KB - Load on demand
3. **libphonenumber-js**: ~200KB - Consider lighter alternatives

### Bundle Optimization
- Dynamic imports for heavy components
- Tree shaking enabled
- Code splitting configured

## Maintenance Notes

### Regular Updates Needed
- **Security patches**: Monthly
- **Framework updates**: Quarterly
- **UI components**: As needed
- **Dev tools**: Bi-annually

### Deprecated/Legacy
- Watch for React 19 compatibility
- Monitor Radix UI v2 migration
- Check Stripe API version alignment

## Future Considerations

### Potential Additions
1. **Testing**: Consider adding React Testing Library
2. **Validation**: Evaluate Yup vs Zod performance
3. **State**: Consider Redux Toolkit if complexity grows
4. **Analytics**: Add analytics package

### Potential Removals
1. **Unused Radix components**: Audit usage
2. **Duplicate functionality**: Phone input libraries
3. **Development cruft**: Clean unused dev dependencies