# Technical Architecture Document (v2)
## Organizer Portal - Hierarchical Events with Stripe Connect

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Client Layer (Browser)                         │
├─────────────────────────────────────────────────────────────────┤
│  Next.js App Router  │  Sidebar Layout  │  React 19  │  Zustand │
├─────────────────────────────────────────────────────────────────┤
│                    API Layer (Next.js)                            │
├─────────────────────────────────────────────────────────────────┤
│  Route Handlers  │  Server Actions  │  Stripe Webhooks  │  Auth  │
├─────────────────────────────────────────────────────────────────┤
│                 External Services                                 │
├─────────────────────────────────────────────────────────────────┤
│  Stripe Connect  │  Supabase  │  Email Service  │  File Storage │
├─────────────────────────────────────────────────────────────────┤
│                 Data Layer (Supabase)                            │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL  │  Stored Procedures  │  RLS  │  Realtime  │  Auth │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

- **Frontend**: Next.js 15.2.4, React 19, TypeScript 5
- **UI Framework**: TailwindCSS + shadcn/ui (converting HeadlessUI example)
- **State Management**: Zustand for complex state, React Context for auth
- **Data Fetching**: Tanstack Query + Supabase Realtime
- **Forms**: React Hook Form + Zod validation
- **Backend**: Supabase + Stripe Connect
- **Payments**: Stripe Connect Express
- **Deployment**: Vercel

---

## 2. Component Architecture

### 2.1 Directory Structure

```
/app/organizer/
├── (auth)/                      # Auth-protected routes with sidebar
│   ├── layout.tsx              # Sidebar layout wrapper
│   ├── dashboard/              # Main dashboard
│   │   └── page.tsx
│   ├── functions/              # Function management
│   │   ├── new/               # Host a Function wizard
│   │   │   └── page.tsx
│   │   ├── [slug]/            # Function details
│   │   │   ├── page.tsx       # Overview
│   │   │   ├── events/        # Child events
│   │   │   ├── attendees/     # Registrations
│   │   │   ├── reports/       # Analytics
│   │   │   └── settings/      # Function settings
│   │   └── page.tsx           # Functions list
│   ├── stripe/                 # Stripe Connect
│   │   ├── onboarding/        # Connect flow
│   │   ├── dashboard/         # Payments overview
│   │   └── settings/          # Bank details
│   └── profile/               # User settings
├── login/                      # Public login
├── components/                 # Organizer components
│   ├── layout/
│   │   ├── OrganizerSidebar.tsx
│   │   ├── OrganizerHeader.tsx
│   │   └── MobileNav.tsx
│   ├── functions/
│   │   ├── EventCreationWizard.tsx
│   │   ├── FunctionCard.tsx
│   │   └── ChildEventManager.tsx
│   └── stripe/
│       ├── ConnectOnboarding.tsx
│       └── PaymentsDashboard.tsx
├── hooks/                      # Custom hooks
├── lib/                        # Utilities
├── stores/                     # Zustand stores
└── development/               # Documentation
```

### 2.2 Sidebar Layout Component (Based on Example)

```typescript
// components/layout/OrganizerLayout.tsx
export function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  
  const navigation = [
    { name: 'Dashboard', href: '/organizer/dashboard', icon: HomeIcon },
    { name: 'My Functions', href: '/organizer/functions', icon: CalendarDaysIcon },
    { name: 'Reports', href: '/organizer/reports', icon: ChartBarIcon },
    { name: 'Payments', href: '/organizer/stripe/dashboard', icon: CreditCardIcon },
    { name: 'Settings', href: '/organizer/settings', icon: CogIcon },
  ];
  
  const functions = useFunctionsList(); // Quick access to recent functions
  
  return (
    <>
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SidebarContent 
            navigation={navigation} 
            functions={functions}
            pathname={pathname}
          />
        </SheetContent>
      </Sheet>
      
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <MasonicLogo className="h-8 w-auto" />
          </div>
          <SidebarContent 
            navigation={navigation} 
            functions={functions}
            pathname={pathname}
          />
        </div>
      </div>
      
      {/* Main content area */}
      <div className="lg:pl-72">
        <OrganizerHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
```

### 2.3 Component Hierarchy

```
OrganizerLayout (Sidebar)
├── OrganizerSidebar
│   ├── Navigation Items
│   ├── Functions Quick List
│   ├── Stripe Status Indicator
│   └── User Profile Section
├── OrganizerHeader
│   ├── Breadcrumbs
│   ├── Search
│   ├── Notifications
│   └── User Menu
└── Main Content Area
    ├── Dashboard
    │   ├── FunctionMetrics
    │   ├── RecentRegistrations
    │   ├── StripeBalance
    │   └── QuickActions
    ├── EventCreationWizard
    │   ├── Step1: FunctionDetails
    │   ├── Step2: ChildEvents
    │   ├── Step3: TicketConfiguration
    │   ├── Step4: StripeSetup
    │   └── Step5: Review
    └── FunctionManager
        ├── FunctionOverview
        ├── ChildEventsList
        ├── AttendeeMatrix
        └── FinancialReports
```

---

## 3. State Management Architecture

### 3.1 Zustand Store Structure

```typescript
// stores/organizerStore.ts
interface OrganizerStore {
  // User & Stripe State
  user: OrganizerUser | null;
  stripeAccount: StripeConnectAccount | null;
  stripeStatus: 'not_connected' | 'pending' | 'active' | 'restricted';
  
  // Functions State (Parent Events)
  functions: Function[];
  selectedFunction: Function | null;
  functionFilters: FunctionFilters;
  
  // UI State
  sidebarOpen: boolean;
  activeView: string;
  
  // Actions
  loadFunctions: () => Promise<void>;
  selectFunction: (slug: string) => void;
  updateFunction: (id: string, data: Partial<Function>) => Promise<void>;
  initializeStripeConnect: () => Promise<string>; // Returns onboarding URL
}

// stores/eventCreationStore.ts
interface EventCreationStore {
  // Wizard State
  currentStep: number;
  functionData: Partial<Function>;
  childEvents: ChildEvent[];
  ticketsByEvent: Map<string, TicketDefinition[]>;
  
  // Validation State
  errors: Record<string, string>;
  isDirty: boolean;
  
  // Actions
  updateFunctionData: (data: Partial<Function>) => void;
  addChildEvent: (event: ChildEvent) => void;
  removeChildEvent: (eventId: string) => void;
  updateChildEvent: (eventId: string, data: Partial<ChildEvent>) => void;
  addTicketToEvent: (eventId: string, ticket: TicketDefinition) => void;
  validateCurrentStep: () => boolean;
  createFunction: () => Promise<{ functionId: string; slug: string }>;
}
```

### 3.2 Hierarchical Data Models

```typescript
// Parent Event (Function)
interface Function {
  id: string;
  organizerId: string;
  stripeAccountId: string;
  name: string;
  slug: string;
  description: string;
  bannerImage?: string;
  dateStart: Date;
  dateEnd: Date;
  status: 'draft' | 'published' | 'closed' | 'archived';
  childEvents: ChildEvent[];
  registrationCount: number;
  totalRevenue: number;
  settings: FunctionSettings;
}

// Child Event
interface ChildEvent {
  id: string;
  functionId: string;
  name: string;
  description?: string;
  eventStart: DateTime;
  eventEnd: DateTime;
  location: string;
  capacity: number;
  status: 'active' | 'closed' | 'archived';
  displayOrder: number;
  ticketDefinitions: TicketDefinition[];
  attendeeCount: number;
}

// Stripe Connect Account
interface StripeConnectAccount {
  id: string;
  stripeAccountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  onboardingCompleted: boolean;
  defaultCurrency: string;
  platformFeePercent: number;
}
```

---

## 4. Stripe Connect Integration

### 4.1 Onboarding Flow Architecture

```typescript
// lib/stripe/connect.ts
export class StripeConnectService {
  async createAccount(userId: string): Promise<string> {
    // Create Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'AU',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'non_profit',
      metadata: { userId },
    });
    
    // Store in database
    await supabase.rpc('sp_create_stripe_connect_account', {
      stripe_account_id: account.id,
    });
    
    // Generate onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/organizer/stripe/onboarding`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/organizer/stripe/onboarding/complete`,
      type: 'account_onboarding',
    });
    
    return accountLink.url;
  }
  
  async createLoginLink(accountId: string): Promise<string> {
    const loginLink = await stripe.accounts.createLoginLink(accountId);
    return loginLink.url;
  }
}
```

### 4.2 Webhook Handler Architecture

```typescript
// app/api/stripe/webhooks/route.ts
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response('Webhook Error', { status: 400 });
  }
  
  switch (event.type) {
    case 'account.updated':
      await handleAccountUpdate(event.data.object as Stripe.Account);
      break;
      
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
      break;
      
    case 'transfer.created':
      await handleTransferCreated(event.data.object as Stripe.Transfer);
      break;
      
    case 'payout.paid':
      await handlePayoutPaid(event.data.object as Stripe.Payout);
      break;
  }
  
  return new Response('OK', { status: 200 });
}
```

### 4.3 Payment Flow with Platform Fees

```typescript
// lib/stripe/payments.ts
export async function createPaymentWithPlatformFee(
  registration: Registration,
  amount: number,
  stripeAccountId: string
) {
  const platformFee = Math.round(amount * 0.025); // 2.5% platform fee
  
  // Create payment intent with destination charge
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Convert to cents
    currency: 'aud',
    payment_method_types: ['card'],
    application_fee_amount: platformFee * 100,
    transfer_data: {
      destination: stripeAccountId,
    },
    metadata: {
      registrationId: registration.id,
      functionId: registration.functionId,
    },
  });
  
  return paymentIntent;
}
```

---

## 5. Data Flow Architecture

### 5.1 Function Creation Flow

```
User Action → EventCreationWizard → Validation → API Call → Database → Response
     ↓                                              ↓
Stripe Check ←────────────────────────────── Stripe Status
     ↓
Create Function → Create Child Events → Create Tickets → Publish
```

### 5.2 Real-time Updates

```typescript
// hooks/useFunctionSubscription.ts
export function useFunctionSubscription(functionId: string) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const channels = [
      // Registration updates
      supabase
        .channel(`function:${functionId}:registrations`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'registrations',
          filter: `function_id=eq.${functionId}`
        }, (payload) => {
          queryClient.invalidateQueries(['function', functionId, 'registrations']);
        }),
        
      // Stripe payment updates
      supabase
        .channel(`function:${functionId}:payments`)
        .on('broadcast', {
          event: 'payment_update'
        }, (payload) => {
          queryClient.invalidateQueries(['function', functionId, 'financials']);
        })
    ];
    
    channels.forEach(channel => channel.subscribe());
    
    return () => {
      channels.forEach(channel => channel.unsubscribe());
    };
  }, [functionId]);
}
```

---

## 6. Security Architecture

### 6.1 Authentication & Authorization

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const session = await getSession();
  
  // Check authentication
  if (!session?.user) {
    return NextResponse.redirect('/organizer/login');
  }
  
  // Check organizer role
  const { data: role } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .single();
    
  if (role?.role !== 'organizer' && role?.role !== 'admin') {
    return NextResponse.redirect('/unauthorized');
  }
  
  // Check Stripe Connect status for payment routes
  if (request.nextUrl.pathname.startsWith('/organizer/functions/new')) {
    const { data: stripeAccount } = await supabase
      .from('organizer_stripe_accounts')
      .select('charges_enabled')
      .eq('user_id', session.user.id)
      .single();
      
    if (!stripeAccount?.charges_enabled) {
      return NextResponse.redirect('/organizer/stripe/onboarding');
    }
  }
  
  return NextResponse.next();
}
```

### 6.2 Stripe Security

- Webhook signature verification
- OAuth for account connections
- PCI compliance via Stripe Elements
- No card data stored locally
- Encrypted account IDs in database

---

## 7. Performance Architecture

### 7.1 Component Optimization

```typescript
// Lazy load heavy components
const EventCreationWizard = dynamic(
  () => import('@/components/functions/EventCreationWizard'),
  { 
    loading: () => <WizardSkeleton />,
    ssr: false 
  }
);

const AttendeeMatrix = dynamic(
  () => import('@/components/attendees/AttendeeMatrix'),
  { 
    loading: () => <MatrixSkeleton />,
    ssr: false 
  }
);

const StripeConnectDashboard = dynamic(
  () => import('@/components/stripe/PaymentsDashboard'),
  { 
    loading: () => <DashboardSkeleton />,
    ssr: false 
  }
);
```

### 7.2 Data Caching Strategy

```typescript
// hooks/useFunctionData.ts
export function useFunctionData(functionSlug: string) {
  return useQuery({
    queryKey: ['function', functionSlug],
    queryFn: () => supabase.rpc('sp_get_function_details', { 
      p_function_slug: functionSlug 
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: false, // Use real-time for updates
  });
}

// Prefetch on hover
export function usePrefetchFunction() {
  const queryClient = useQueryClient();
  
  return (functionSlug: string) => {
    queryClient.prefetchQuery({
      queryKey: ['function', functionSlug],
      queryFn: () => supabase.rpc('sp_get_function_details', { 
        p_function_slug: functionSlug 
      }),
    });
  };
}
```

---

## 8. Mobile Responsiveness

### 8.1 Sidebar Behavior

- **Desktop**: Fixed 72rem sidebar
- **Tablet**: Collapsible sidebar
- **Mobile**: Full-screen slide-out menu

### 8.2 Touch Optimizations

```typescript
// components/functions/ChildEventCard.tsx
export function ChildEventCard({ event, onEdit, onClose }: Props) {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  
  const handleTouchStart = (e: TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const handleTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 150) {
      // Swipe left - show actions
      setShowActions(true);
    }
    if (touchStart - touchEnd < -150) {
      // Swipe right - hide actions
      setShowActions(false);
    }
  };
  
  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Event content */}
    </div>
  );
}
```

---

## 9. Error Handling Architecture

### 9.1 Global Error Boundary

```typescript
// app/organizer/(auth)/layout.tsx
export default function AuthLayout({ children }: Props) {
  return (
    <ErrorBoundary
      fallback={<OrganizerErrorFallback />}
      onError={(error, errorInfo) => {
        // Log to Sentry
        captureException(error, {
          contexts: { react: errorInfo },
          tags: { section: 'organizer' }
        });
      }}
    >
      <OrganizerLayout>
        <StripeConnectGuard>
          {children}
        </StripeConnectGuard>
      </OrganizerLayout>
    </ErrorBoundary>
  );
}
```

### 9.2 Stripe Error Handling

```typescript
// lib/stripe/errorHandler.ts
export function handleStripeError(error: StripeError) {
  switch (error.type) {
    case 'StripeCardError':
      return { message: 'Card was declined', recoverable: true };
    case 'StripeRateLimitError':
      return { message: 'Too many requests', recoverable: true, retry: 60 };
    case 'StripeInvalidRequestError':
      return { message: 'Invalid request', recoverable: false };
    case 'StripeAPIError':
      return { message: 'Payment service unavailable', recoverable: true };
    default:
      return { message: 'Payment error occurred', recoverable: false };
  }
}
```

---

## 10. Testing Architecture

### 10.1 Component Testing

```typescript
// __tests__/EventCreationWizard.test.tsx
describe('EventCreationWizard', () => {
  it('validates function details before proceeding', async () => {
    const { getByRole, getByText } = render(<EventCreationWizard />);
    
    // Try to proceed without filling required fields
    fireEvent.click(getByRole('button', { name: /next/i }));
    
    expect(getByText('Function name is required')).toBeInTheDocument();
    expect(getByText('Start date is required')).toBeInTheDocument();
  });
  
  it('requires at least one child event', async () => {
    const { getByRole, getByText } = render(<EventCreationWizard />);
    
    // Fill function details and go to child events step
    // ... fill form
    fireEvent.click(getByRole('button', { name: /next/i }));
    
    // Try to proceed without adding child events
    fireEvent.click(getByRole('button', { name: /next/i }));
    
    expect(getByText('At least one event is required')).toBeInTheDocument();
  });
});
```

### 10.2 Stripe Integration Testing

```typescript
// __tests__/stripe-connect.test.ts
describe('Stripe Connect Integration', () => {
  it('redirects to onboarding if not connected', async () => {
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => ({ data: null })
        })
      })
    });
    
    const { result } = renderHook(() => useStripeConnect());
    
    expect(result.current.status).toBe('not_connected');
    expect(router.push).toHaveBeenCalledWith('/organizer/stripe/onboarding');
  });
});
```

---

## 11. Deployment Architecture

### 11.1 Environment Configuration

```env
# Stripe Connect
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_CONNECT_CLIENT_ID=ca_xxx

# Platform Settings
PLATFORM_FEE_PERCENT=2.5
PLATFORM_NAME="LodgeTix"

# Supabase
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

### 11.2 CI/CD Pipeline

```yaml
# .github/workflows/deploy-organizer.yml
name: Deploy Organizer Portal

on:
  push:
    branches: [main]
    paths:
      - 'app/organizer/**'
      - 'components/organizer/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Run tests
        run: |
          npm run test:organizer
          npm run test:stripe
          
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: |
          vercel --prod
          
      - name: Run E2E tests
        run: |
          npm run test:e2e:organizer
```

---

## 12. Monitoring & Analytics

### 12.1 Key Metrics

```typescript
// lib/analytics/organizer.ts
export const trackOrganizerEvent = (event: string, properties?: any) => {
  // Track in multiple systems
  posthog.capture(event, {
    ...properties,
    section: 'organizer',
    timestamp: new Date().toISOString(),
  });
  
  // Custom metrics for Stripe
  if (event.startsWith('stripe_')) {
    trackStripeMetric(event, properties);
  }
};

// Key events to track
trackOrganizerEvent('function_created', { childEventCount, ticketCount });
trackOrganizerEvent('stripe_connected', { accountId });
trackOrganizerEvent('payment_received', { amount, functionId });
trackOrganizerEvent('child_event_closed', { reason, attendeeCount });
```

### 12.2 Error Monitoring

```typescript
// Sentry configuration
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  beforeSend(event) {
    // Sanitize Stripe data
    if (event.request?.data) {
      delete event.request.data.stripe_account_id;
    }
    return event;
  },
});
```