# LodgeTix-UGLNSW-v2

Event ticketing platform for the United Grand Lodge of NSW & ACT.

## Tech Stack

- **Framework**: Next.js 15.2.4 with React 19
- **Styling**: TailwindCSS with shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe with Connect platform
- **Testing**: Puppeteer with Claude Code integration
- **State**: Zustand

## Getting Started

### Prerequisites

- Node.js 20+
- npm 8+
- Supabase account
- Stripe account

### Installation

```bash
# Install dependencies
npm install

# Install Puppeteer test dependencies
cd tests/puppeteer && npm install && cd ../..

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your credentials
```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm run test:e2e

# Run specific test suites
npm run test:e2e:smoke
npm run test:e2e:critical
```

## Testing

This project uses Puppeteer with Claude Code integration for E2E testing.

### Test Structure

```
tests/puppeteer/
├── specs/
│   ├── smoke/        # Quick validation tests
│   ├── critical/     # Payment and auth tests
│   ├── functional/   # Feature tests
│   └── e2e/         # Full workflows
├── helpers/          # Self-healing framework
└── dashboard/        # Test monitoring
```

### Key Features

- **AI-Powered**: Claude Code generates and maintains tests
- **Self-Healing**: Tests adapt to UI changes automatically
- **Monitoring**: Real-time dashboard at http://localhost:3001

### Running Tests

```bash
# All tests
cd tests/puppeteer && npm test

# Specific suite
npm run test:smoke

# With browser visible
npm run test:headed

# Debug mode
npm run test:debug
```

### Claude Code Commands

Use Claude Code to generate and maintain tests:

```bash
claude > generate E2E test for payment flow
claude > fix failing test registration-workflow.spec.js
claude > analyze test coverage for ticketing
```

## Project Structure

```
├── app/                 # Next.js app router
├── components/          # React components
│   ├── register/       # Registration wizard
│   └── ui/            # shadcn/ui components
├── lib/                # Utilities and services
├── supabase/           # Database migrations
└── tests/puppeteer/    # E2E tests
```

## Environment Variables

Required environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PLATFORM_FEE_PERCENTAGE=

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Deployment

The application is deployed on Vercel with automatic deployments from the main branch.

## CI/CD

GitHub Actions runs E2E tests on every push and PR:

- Parallel test execution
- Screenshot artifacts on failure
- Automatic test data cleanup

## Contributing

1. Create a feature branch
2. Write tests for new features
3. Ensure all tests pass
4. Submit a pull request

## License

Private - All rights reserved