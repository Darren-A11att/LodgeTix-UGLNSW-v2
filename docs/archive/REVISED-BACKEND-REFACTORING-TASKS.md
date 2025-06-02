# Revised Backend Refactoring Tasks - Direct Implementation

## Overview
Update all backend services to use functions architecture exclusively. No backward compatibility, no dual support.

---

## BE-001: Update TypeScript Types (REVISED)

**Priority:** Critical  
**Time:** 2 hours

### Remove All Parent-Child References

```typescript
// shared/types/database.ts
export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          event_id: string
          function_id: string // NOT NULL
          // REMOVE: parent_event_id
          // ... other fields
        }
      }
      registrations: {
        Row: {
          registration_id: string
          function_id: string // NOT NULL
          // REMOVE: event_id
          // ... other fields
        }
      }
      packages: {
        Row: {
          package_id: string
          function_id: string // NOT NULL
          // REMOVE: parent_event_id
          // ... other fields
        }
      }
      functions: {
        Row: {
          function_id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          start_date: string
          end_date: string
          location_id: string | null
          organiser_id: string
          metadata: Json
          is_published: boolean
          created_at: string
          updated_at: string
        }
      }
    }
  }
}

// shared/types/event.ts
export interface EventType {
  id: string
  functionId: string // REQUIRED
  functionName: string
  functionSlug: string
  // REMOVE: parentEventId
  // REMOVE: childEvents
  // ... rest of fields
}

export interface FunctionType {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  startDate: string
  endDate: string
  locationId: string | null
  organiserId: string
  events: EventType[]
  packages: PackageType[]
  registrationCount: number
  metadata: Record<string, any>
}
```

---

## BE-002: Create Function Service (REVISED)

**Priority:** Critical  
**Time:** 3 hours

### Direct Implementation Only

```typescript
// lib/services/function-service.ts
import { getSupabaseClient } from '@/lib/supabase-singleton'
import type { FunctionType } from '@/shared/types'

export class FunctionService {
  private supabase
  
  constructor(isServer: boolean = false) {
    this.supabase = getSupabaseClient(isServer)
  }
  
  async getAllFunctions(): Promise<FunctionType[]> {
    const { data, error } = await this.supabase
      .from('functions')
      .select(`
        *,
        events!function_id(*),
        packages!function_id(*),
        location:locations!location_id(*)
      `)
      .eq('is_published', true)
      .order('start_date', { ascending: true })
    
    if (error) throw error
    return this.transformFunctions(data)
  }
  
  async getFunctionBySlug(slug: string): Promise<FunctionType> {
    const { data, error } = await this.supabase
      .rpc('get_function_details', { p_function_slug: slug })
    
    if (error) throw error
    if (!data) throw new Error('Function not found')
    
    return this.transformFunction(data)
  }
  
  async getEventsForFunction(functionId: string): Promise<EventType[]> {
    const { data, error } = await this.supabase
      .from('events')
      .select('*')
      .eq('function_id', functionId)
      .eq('is_published', true)
      .order('event_start', { ascending: true })
    
    if (error) throw error
    return data
  }
  
  // NO getFunctionByParentEventId
  // NO compatibility methods
  // NO fallback logic
}
```

---

## BE-003: Update Event Service (REVISED)

**Priority:** Critical  
**Time:** 2 hours

### Remove All Parent-Child Logic

```typescript
// lib/services/event-service.ts
export class EventService {
  async getEvent(eventSlug: string): Promise<EventType> {
    const { data, error } = await this.supabase
      .from('events')
      .select(`
        *,
        function:functions!function_id(*),
        tickets:event_tickets(*),
        location:locations!location_id(*)
      `)
      .eq('slug', eventSlug)
      .single()
    
    if (error) throw error
    
    // Event MUST have a function
    if (!data.function_id) {
      throw new Error('Event missing function association')
    }
    
    return this.transformEvent(data)
  }
  
  // REMOVE: getChildEvents()
  // REMOVE: getParentEvent()
  // REMOVE: getEventHierarchy()
  
  async getEventsByFunction(functionId: string): Promise<EventType[]> {
    const { data, error } = await this.supabase
      .from('events')
      .select('*')
      .eq('function_id', functionId)
      .order('event_start')
    
    if (error) throw error
    return data.map(e => this.transformEvent(e))
  }
}
```

---

## BE-004: Update Registration Service (REVISED)

**Priority:** Critical  
**Time:** 3 hours

### Function-Based Registration Only

```typescript
// lib/services/registration-service.ts
export interface CreateRegistrationInput {
  functionId: string // REQUIRED
  attendees: AttendeeInput[]
  selectedEvents: string[] // Event IDs within the function
  packages: PackageSelection[]
  contactInfo: ContactInfo
}

export class RegistrationService {
  async createRegistration(input: CreateRegistrationInput): Promise<Registration> {
    // Validate function exists
    const { data: functionData, error: functionError } = await this.supabase
      .from('functions')
      .select('*')
      .eq('function_id', input.functionId)
      .single()
    
    if (functionError || !functionData) {
      throw new Error('Invalid function')
    }
    
    // Validate selected events belong to function
    const { data: events } = await this.supabase
      .from('events')
      .select('event_id')
      .eq('function_id', input.functionId)
      .in('event_id', input.selectedEvents)
    
    if (events?.length !== input.selectedEvents.length) {
      throw new Error('Invalid events for function')
    }
    
    // Create registration for function
    const registration = {
      function_id: input.functionId,
      // NO event_id field
      attendees: input.attendees,
      selected_events: input.selectedEvents,
      metadata: {
        function_name: functionData.name,
        function_slug: functionData.slug
      }
    }
    
    // ... create registration
  }
  
  // REMOVE: createRegistrationForEvent()
  // REMOVE: createRegistrationForParentEvent()
}
```

---

## BE-005: Update API Routes (REVISED)

**Priority:** Critical  
**Time:** 2 hours

### Functions-Only Routes

```typescript
// app/api/functions/route.ts
export async function GET() {
  const functionService = new FunctionService()
  const functions = await functionService.getAllFunctions()
  return NextResponse.json(functions)
}

// app/api/functions/[slug]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const functionService = new FunctionService()
  const functionData = await functionService.getFunctionBySlug(params.slug)
  return NextResponse.json(functionData)
}

// app/api/functions/[slug]/events/route.ts
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const functionService = new FunctionService()
  const function = await functionService.getFunctionBySlug(params.slug)
  const events = await functionService.getEventsForFunction(function.id)
  return NextResponse.json(events)
}

// DELETE these routes:
// - /api/events/[parentSlug]/[childSlug]
// - /api/events/[slug]/children
// - Any route with parent/child logic
```

---

## BE-006: Update RPC Service Calls (REVISED)

**Priority:** High  
**Time:** 2 hours

### Update to Functions-Based RPCs

```typescript
// lib/api/rpc-service.ts
export class RPCService {
  async getFunctionDetails(slug: string) {
    const { data, error } = await this.supabase
      .rpc('get_function_details', { p_function_slug: slug })
    
    if (error) throw error
    return data
  }
  
  async createFunctionRegistration(params: {
    functionId: string
    attendees: any[]
    selectedEvents: string[]
  }) {
    const { data, error } = await this.supabase
      .rpc('create_function_registration', params)
    
    if (error) throw error
    return data
  }
  
  // REMOVE all parent-child RPC calls:
  // - get_event_with_children
  // - get_parent_event_details
  // - create_parent_event_registration
}
```

---

## BE-007: Update Package Service (REVISED)

**Priority:** High  
**Time:** 2 hours

### Function-Based Packages Only

```typescript
// lib/services/package-service.ts
export class PackageService {
  async getPackagesForFunction(functionId: string): Promise<Package[]> {
    const { data, error } = await this.supabase
      .from('packages')
      .select(`
        *,
        function:functions!function_id(*)
      `)
      .eq('function_id', functionId)
      .eq('is_active', true)
    
    if (error) throw error
    return data
  }
  
  // REMOVE: getPackagesByParentEvent()
  // Packages now belong to functions, not parent events
}
```

---

## BE-008: Update Email Services (REVISED)

**Priority:** Medium  
**Time:** 2 hours

### Function-Centric Emails

```typescript
// lib/services/email-service.ts
export function generateConfirmationEmail(registration: Registration) {
  const function = registration.function
  
  return {
    subject: `Registration Confirmed - ${function.name}`,
    html: `
      <h1>Welcome to ${function.name}</h1>
      <p>Your registration for the function has been confirmed.</p>
      
      <h2>Function Details</h2>
      <p>Dates: ${function.startDate} - ${function.endDate}</p>
      <p>Location: ${function.location}</p>
      
      <h2>Selected Events</h2>
      ${registration.selectedEvents.map(event => `
        <div>
          <h3>${event.name}</h3>
          <p>${event.date} at ${event.time}</p>
        </div>
      `).join('')}
    `
  }
}
```

---

## BE-009: Update Environment Configuration (REVISED)

**Priority:** High  
**Time:** 1 hour

### Direct Function Filtering

```typescript
// lib/config/environment.ts
export interface EnvironmentConfig {
  filterTo: 'function' | 'organisation'
  functionId?: string
  organisationId?: string
}

export function getEnvironmentConfig(): EnvironmentConfig {
  return {
    filterTo: process.env.FILTER_TO as 'function' | 'organisation',
    functionId: process.env.FUNCTION_ID,
    organisationId: process.env.ORGANISATION_ID
  }
}

// NO feature flags
// NO USE_FUNCTIONS_ARCHITECTURE flag
// NO compatibility mode
```

---

## BE-010: Remove All Legacy Code (REVISED)

**Priority:** Critical  
**Time:** 2 hours

### Files to Delete/Clean

1. **Delete compatibility services**
   - `/lib/services/compatibility-service.ts`
   - `/lib/services/parent-child-service.ts`

2. **Remove parent-child utilities**
   - Remove `getParentEvent` functions
   - Remove `getChildEvents` functions
   - Remove `parent_event_id` references

3. **Clean up types**
   - Remove `ParentChildEvent` interfaces
   - Remove optional function fields (make required)

4. **Update imports**
   - Replace event hierarchy imports with function imports
   - Update all service instantiations

---

## Success Criteria

- [ ] Zero references to `parent_event_id` in codebase
- [ ] Zero references to parent/child event concepts
- [ ] All services use function-based queries
- [ ] All API routes are function-centric
- [ ] No compatibility layers exist
- [ ] No feature flags for architecture
- [ ] All tests updated and passing