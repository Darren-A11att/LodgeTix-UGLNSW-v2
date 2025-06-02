# Revised Frontend Refactoring Tasks - Direct Implementation

## Overview
Complete replacement of parent-child event UI with functions-based UI. No backward compatibility, clean implementation.

---

## FE-001: Replace Route Structure (REVISED)

**Priority:** Critical  
**Time:** 3 hours

### Delete Old Routes
```bash
# Delete these files
rm -rf app/events/[slug]/[childSlug]
rm app/events/[slug]/register/route.ts
```

### Create New Routes
```typescript
// app/functions/page.tsx
export default async function FunctionsPage() {
  const functions = await functionService.getAllFunctions()
  
  return (
    <div>
      <h1>All Functions</h1>
      <div className="grid grid-cols-3 gap-4">
        {functions.map(fn => (
          <FunctionCard key={fn.id} function={fn} />
        ))}
      </div>
    </div>
  )
}

// app/functions/[functionSlug]/page.tsx
export default async function FunctionPage({ 
  params 
}: { 
  params: { functionSlug: string } 
}) {
  const fn = await functionService.getFunctionBySlug(params.functionSlug)
  
  return <FunctionDetails function={fn} />
}

// app/functions/[functionSlug]/events/[eventSlug]/page.tsx
export default async function EventPage({ 
  params 
}: { 
  params: { functionSlug: string; eventSlug: string } 
}) {
  const event = await eventService.getEvent(params.eventSlug)
  
  return <EventDetails event={event} functionSlug={params.functionSlug} />
}

// app/functions/[functionSlug]/register/page.tsx
export default function RegisterPage({ 
  params 
}: { 
  params: { functionSlug: string } 
}) {
  return <RegistrationWizard functionSlug={params.functionSlug} />
}
```

---

## FE-002: Create Function Components (REVISED)

**Priority:** Critical  
**Time:** 4 hours

### FunctionCard Component
```typescript
// components/function-card.tsx
interface FunctionCardProps {
  function: FunctionType
}

export function FunctionCard({ function: fn }: FunctionCardProps) {
  return (
    <Link href={`/functions/${fn.slug}`}>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <img src={fn.imageUrl} alt={fn.name} className="w-full h-48 object-cover" />
        </CardHeader>
        <CardContent>
          <h3 className="text-xl font-bold">{fn.name}</h3>
          <p className="text-sm text-gray-600">
            {format(fn.startDate, 'MMM d')} - {format(fn.endDate, 'MMM d, yyyy')}
          </p>
          <p className="mt-2">{fn.description}</p>
          <div className="mt-4 flex justify-between">
            <span className="text-sm">{fn.events.length} events</span>
            <span className="text-sm font-bold">From ${fn.minPrice}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
```

### FunctionDetails Component
```typescript
// components/function-details.tsx
interface FunctionDetailsProps {
  function: FunctionType
}

export function FunctionDetails({ function: fn }: FunctionDetailsProps) {
  return (
    <div>
      {/* Hero Section */}
      <div className="relative h-96">
        <img src={fn.imageUrl} alt={fn.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-white text-center">
            <h1 className="text-5xl font-bold">{fn.name}</h1>
            <p className="text-xl mt-2">
              {format(fn.startDate, 'MMMM d')} - {format(fn.endDate, 'MMMM d, yyyy')}
            </p>
          </div>
        </div>
      </div>
      
      {/* Function Navigation */}
      <FunctionNavigation function={fn} />
      
      {/* Events Grid */}
      <div className="container mx-auto py-8">
        <h2 className="text-3xl font-bold mb-6">Events</h2>
        <div className="grid grid-cols-2 gap-6">
          {fn.events.map(event => (
            <EventCard 
              key={event.id} 
              event={event} 
              functionSlug={fn.slug}
            />
          ))}
        </div>
        
        {/* Register Button */}
        <div className="mt-8 text-center">
          <Link href={`/functions/${fn.slug}/register`}>
            <Button size="lg" className="px-8">
              Register for {fn.name}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
```

---

## FE-003: Update Event Components (REVISED)

**Priority:** High  
**Time:** 2 hours

### Remove Parent-Child Logic
```typescript
// components/event-card.tsx
interface EventCardProps {
  event: EventType
  functionSlug: string // Always required
}

export function EventCard({ event, functionSlug }: EventCardProps) {
  return (
    <Link href={`/functions/${functionSlug}/events/${event.slug}`}>
      <Card>
        <CardContent>
          <h3 className="font-bold">{event.title}</h3>
          <p className="text-sm text-gray-600">
            {format(event.date, 'EEEE, MMMM d')} at {event.time}
          </p>
          <p className="text-sm mt-2">{event.description}</p>
          <div className="mt-4 flex justify-between">
            <span>{event.venue}</span>
            <span className="font-bold">${event.price}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// DELETE: ParentEventCard
// DELETE: ChildEventsList
// DELETE: EventHierarchy components
```

---

## FE-004: Update Registration Wizard (REVISED)

**Priority:** Critical  
**Time:** 4 hours

### Function-Based Registration
```typescript
// components/register/RegistrationWizard/registration-wizard.tsx
interface RegistrationWizardProps {
  functionSlug: string
}

export function RegistrationWizard({ functionSlug }: RegistrationWizardProps) {
  const [function, setFunction] = useState<FunctionType | null>(null)
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  
  useEffect(() => {
    // Load function data
    functionService.getFunctionBySlug(functionSlug)
      .then(setFunction)
  }, [functionSlug])
  
  const steps = [
    {
      id: 'registration-type',
      title: 'Registration Type',
      component: <RegistrationTypeStep />
    },
    {
      id: 'event-selection',
      title: 'Select Events',
      component: <EventSelectionStep 
        function={function}
        selectedEvents={selectedEvents}
        onEventsChange={setSelectedEvents}
      />
    },
    {
      id: 'attendees',
      title: 'Attendee Details',
      component: <AttendeeDetailsStep 
        functionId={function?.id}
        selectedEvents={selectedEvents}
      />
    },
    {
      id: 'review',
      title: 'Review & Pay',
      component: <ReviewStep functionId={function?.id} />
    }
  ]
  
  // No parent/child logic
  // No backward compatibility checks
  // Direct function registration only
}
```

### Event Selection Within Function
```typescript
// components/register/Steps/event-selection-step.tsx
interface EventSelectionStepProps {
  function: FunctionType
  selectedEvents: string[]
  onEventsChange: (events: string[]) => void
}

export function EventSelectionStep({ 
  function: fn, 
  selectedEvents, 
  onEventsChange 
}: EventSelectionStepProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">
        Select Events for {fn.name}
      </h2>
      
      <div className="space-y-4">
        {fn.events.map(event => (
          <label key={event.id} className="flex items-start space-x-3 p-4 border rounded-lg">
            <input
              type="checkbox"
              checked={selectedEvents.includes(event.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  onEventsChange([...selectedEvents, event.id])
                } else {
                  onEventsChange(selectedEvents.filter(id => id !== event.id))
                }
              }}
            />
            <div className="flex-1">
              <h3 className="font-bold">{event.title}</h3>
              <p className="text-sm text-gray-600">
                {format(event.date, 'EEEE, MMMM d')} at {event.time}
              </p>
              <p className="text-sm mt-1">{event.description}</p>
              <p className="text-sm font-bold mt-2">${event.price}</p>
            </div>
          </label>
        ))}
      </div>
      
      {selectedEvents.length === 0 && (
        <Alert className="mt-4">
          <AlertDescription>
            Please select at least one event to continue
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
```

---

## FE-005: Update Navigation Components (REVISED)

**Priority:** High  
**Time:** 2 hours

### Function-Based Navigation
```typescript
// components/navigation/main-nav.tsx
export function MainNav() {
  return (
    <nav className="flex space-x-6">
      <Link href="/">Home</Link>
      <Link href="/functions">Functions</Link>
      <Link href="/about">About</Link>
      <Link href="/contact">Contact</Link>
    </nav>
  )
}

// components/navigation/function-navigation.tsx
interface FunctionNavigationProps {
  function: FunctionType
  currentEventId?: string
}

export function FunctionNavigation({ 
  function: fn, 
  currentEventId 
}: FunctionNavigationProps) {
  return (
    <div className="bg-gray-100 border-b">
      <div className="container mx-auto py-4">
        <div className="flex items-center justify-between">
          <nav className="flex space-x-6">
            <Link 
              href={`/functions/${fn.slug}`}
              className="font-medium hover:text-blue-600"
            >
              Overview
            </Link>
            <Link 
              href={`/functions/${fn.slug}#events`}
              className="font-medium hover:text-blue-600"
            >
              All Events ({fn.events.length})
            </Link>
            <Link 
              href={`/functions/${fn.slug}#packages`}
              className="font-medium hover:text-blue-600"
            >
              Packages
            </Link>
          </nav>
          
          <Link href={`/functions/${fn.slug}/register`}>
            <Button>Register Now</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

// DELETE: ParentChildBreadcrumb
// DELETE: EventHierarchyNav
```

---

## FE-006: Update Homepage (REVISED)

**Priority:** Medium  
**Time:** 2 hours

### Feature Functions Instead of Events
```typescript
// app/page.tsx
export default async function HomePage() {
  const featuredFunctions = await functionService.getFeaturedFunctions()
  
  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-screen">
        <FunctionHero function={featuredFunctions[0]} />
      </section>
      
      {/* Featured Functions */}
      <section className="py-16">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            Upcoming Functions
          </h2>
          <div className="grid grid-cols-3 gap-8">
            {featuredFunctions.map(fn => (
              <FunctionCard key={fn.id} function={fn} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

// components/function-hero.tsx
export function FunctionHero({ function: fn }: { function: FunctionType }) {
  return (
    <div className="relative h-full">
      <img src={fn.imageUrl} alt={fn.name} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
        <div className="text-white text-center max-w-4xl">
          <h1 className="text-6xl font-bold mb-4">{fn.name}</h1>
          <p className="text-2xl mb-2">
            {format(fn.startDate, 'MMMM d')} - {format(fn.endDate, 'MMMM d, yyyy')}
          </p>
          <p className="text-xl mb-8">{fn.events.length} events over {fn.durationDays} days</p>
          <Link href={`/functions/${fn.slug}`}>
            <Button size="lg" className="text-lg px-8 py-4">
              View Details & Register
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
```

---

## FE-007: Update State Management (REVISED)

**Priority:** High  
**Time:** 2 hours

### Function-Based State
```typescript
// contexts/registration-context.tsx
interface RegistrationState {
  functionId: string | null
  functionDetails: FunctionType | null
  selectedEvents: string[]
  attendees: Attendee[]
  packages: Package[]
  // REMOVE: eventId
  // REMOVE: parentEventId
}

const RegistrationContext = createContext<{
  state: RegistrationState
  actions: {
    setFunction: (fn: FunctionType) => void
    selectEvent: (eventId: string) => void
    deselectEvent: (eventId: string) => void
    // REMOVE: setParentEvent
    // REMOVE: setChildEvent
  }
}>()

// lib/registrationStore.ts
export const registrationStore = create<RegistrationStore>((set) => ({
  functionId: null,
  functionDetails: null,
  selectedEvents: [],
  
  setFunction: (fn: FunctionType) => 
    set({ functionId: fn.id, functionDetails: fn }),
    
  toggleEvent: (eventId: string) =>
    set((state) => ({
      selectedEvents: state.selectedEvents.includes(eventId)
        ? state.selectedEvents.filter(id => id !== eventId)
        : [...state.selectedEvents, eventId]
    })),
    
  // NO parent/child methods
}))
```

---

## FE-008: Update API Integration (REVISED)

**Priority:** High  
**Time:** 2 hours

### Functions-Only API Calls
```typescript
// lib/api/client-api.ts
export const api = {
  functions: {
    getAll: () => fetch('/api/functions').then(r => r.json()),
    getBySlug: (slug: string) => 
      fetch(`/api/functions/${slug}`).then(r => r.json()),
    getEvents: (functionSlug: string) =>
      fetch(`/api/functions/${functionSlug}/events`).then(r => r.json()),
  },
  
  registrations: {
    create: (data: {
      functionId: string
      selectedEvents: string[]
      attendees: Attendee[]
    }) => fetch('/api/registrations', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    }).then(r => r.json()),
  },
  
  // DELETE: events.getParent
  // DELETE: events.getChildren
  // DELETE: Any parent/child API calls
}
```

---

## FE-009: Clean Up Legacy Components (REVISED)

**Priority:** Critical  
**Time:** 2 hours

### Files to Delete
```bash
# Delete parent-child components
rm components/event-timeline.tsx  # If it shows parent-child hierarchy
rm components/parent-event-*.tsx
rm components/child-event-*.tsx
rm components/event-hierarchy-*.tsx

# Delete compatibility components  
rm components/migration/*
rm components/feature-flag-provider.tsx
rm components/legacy-*

# Delete old registration components
rm components/register/parent-event-*
rm components/register/child-event-*
```

### Update Imports
```typescript
// Replace all imports
// OLD: import { ParentEventCard } from '@/components/parent-event-card'
// NEW: import { FunctionCard } from '@/components/function-card'

// OLD: import { useParentEvent } from '@/hooks/use-parent-event'
// NEW: import { useFunction } from '@/hooks/use-function'
```

---

## FE-010: Update Tests (REVISED)

**Priority:** High  
**Time:** 3 hours

### Test Functions Architecture Only
```typescript
// __tests__/functions.test.tsx
describe('Functions', () => {
  it('displays function details', async () => {
    render(<FunctionDetails function={mockFunction} />)
    expect(screen.getByText(mockFunction.name)).toBeInTheDocument()
    expect(screen.getByText(`${mockFunction.events.length} events`)).toBeInTheDocument()
  })
  
  it('navigates to function registration', async () => {
    const { user } = render(<FunctionCard function={mockFunction} />)
    await user.click(screen.getByText('Register'))
    expect(router.push).toHaveBeenCalledWith(`/functions/${mockFunction.slug}/register`)
  })
  
  // NO parent-child tests
  // NO compatibility tests
})
```

---

## Success Criteria

- [ ] Zero references to parent/child events in UI
- [ ] All routes use /functions pattern
- [ ] No feature flags or compatibility checks
- [ ] Registration works with functions only
- [ ] No conditional rendering for old vs new
- [ ] All imports updated
- [ ] All tests passing with new architecture