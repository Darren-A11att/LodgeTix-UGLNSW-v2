# Component-Based Data Requirements

## Homepage Components

### Featured Events Section
**Component**: `components/featured-events-section.tsx`

**Operations**:
- **FETCH**: Published featured events with availability
- **Filters**: `featured = true`, `is_published = true`, `event_start > now()`
- **Modifiers**: `order('event_start')`, `limit(3)`
- **RLS**: Public read for published events

**Data Required**:
```typescript
{
  event_id: string
  slug: string
  title: string
  subtitle?: string
  description: string // First 150 chars
  event_start: Date
  event_end?: Date
  location: string // Simple text
  image_url?: string
  min_price: number // Calculated from tickets
  is_sold_out: boolean // Calculated from availability
  parent_event_id?: string // To determine URL structure
  parent_slug?: string // For child events
}
```
**Query**: Top 3 featured events where `featured = true` and `is_published = true`

### Event Card Component
**Component**: `components/event-card.tsx`
**Data Required**:
```typescript
{
  id: string
  slug: string
  title: string
  description: string
  date: string // Formatted
  location: string
  imageUrl?: string
  price: string // Formatted with currency
  parentEventId?: string
  parentEventSlug?: string
  isSoldOut: boolean
  ticketsRemaining?: number // Optional urgency indicator
}
```

## Events List Page
**Route**: `/events`
**Components**: List of Event Cards
**Data Required**:
```typescript
{
  parentEvents: Array<{
    event_id: string
    slug: string
    title: string
    subtitle?: string
    description: string
    event_start: Date
    location: string
    image_url?: string
    min_price: number
    total_capacity: number
    tickets_sold: number
    child_events_count: number
  }>
  
  childEvents: Array<{
    // Same as parent but includes:
    parent_event_id: string
    parent_event_title: string
    parent_event_slug: string
  }>
}
```
**Filters**: 
- Separate parent events (parent_event_id IS NULL)
- Only published events
- Order by event_start ASC

## Parent Event Detail Page
**Route**: `/events/[slug]`
**Data Required**:
```typescript
{
  event: {
    event_id: string
    slug: string
    title: string
    subtitle?: string
    description: string
    long_description?: string
    event_start: Date
    event_end?: Date
    is_multi_day: boolean
    
    // Location
    location: string // Simple
    location_details?: {
      place_name: string
      street_address: string
      suburb: string
      state: string
      postal_code: string
      latitude?: number
      longitude?: number
    }
    
    // Media
    image_url?: string
    banner_image_url?: string
    
    // Event details
    dress_code?: string
    regalia?: string
    regalia_description?: string
    important_information?: string[]
    event_includes?: string[]
    
    // Organization
    organizer: {
      organisation_id: string
      name: string
      type: string
      stripe_onbehalfof?: string // For payment routing
    }
    
    // Status
    is_published: boolean
    is_sold_out: boolean
    total_capacity: number
    tickets_available: number
  }
  
  childEvents: Array<{
    event_id: string
    slug: string
    title: string
    subtitle?: string
    description: string
    event_start: Date
    location: string
    image_url?: string
    min_price: number
    is_sold_out: boolean
    tickets_available: number
  }>
  
  packages?: Array<{
    package_id: string
    name: string
    description: string
    package_price: number
    original_price?: number
    discount_percentage?: number
    includes_description: string[]
    eligibility_criteria?: any
  }>
}
```

## Child Event Detail Page
**Route**: `/events/[parentSlug]/[childSlug]`
**Data Required**:
```typescript
{
  event: {
    // All fields from parent event detail
    // Plus:
    parent_event: {
      event_id: string
      slug: string
      title: string
    }
  }
  
  tickets: Array<{
    id: string
    name: string
    description?: string
    price: number
    total_capacity?: number
    available_count: number
    reserved_count: number
    sold_count: number
    eligibility_criteria?: {
      rules: Array<{
        type: 'attendee_type' | 'registration_type' | 'grand_lodge' | 'mason_rank'
        operator: 'in' | 'equals' | 'not_in'
        value: string | string[]
      }>
      operator: 'AND' | 'OR'
    }
    status: 'Active' | 'Inactive'
    is_active: boolean
  }>
  
  relatedEvents?: Array<{
    // Other child events of same parent
    event_id: string
    slug: string
    title: string
    event_start: Date
  }>
}
```

## Registration Flow Pages

### Registration Type Selection
**Route**: `/events/[slug]/register`
**Data Required**:
```typescript
{
  event: {
    event_id: string
    title: string
    event_start: Date
  }
  
  registrationTypes: Array<{
    id: 'individuals' | 'lodge' | 'delegation'
    title: string
    description: string
    icon: string
    available: boolean
    requirements?: string[]
  }>
  
  // Check if user has existing draft
  existingDraft?: {
    registration_id: string
    registration_type: string
    last_saved: Date
    current_step: string
  }
}
```

### Attendee Details Forms

#### Individual Registration Form
**Component**: `components/register/Forms/attendee/IndividualsForm.tsx`
**Data Required**:
```typescript
{
  // Form state
  attendees: Array<{
    attendee_id: string
    is_primary: boolean
    attendee_type: 'mason' | 'guest'
    
    // Personal
    title?: string
    first_name: string
    last_name: string
    
    // Contact
    email?: string
    phone?: string
    contact_preference: 'directly' | 'primaryattendee' | 'providelater'
    
    // Mason specific
    mason_rank?: string
    grand_lodge_id?: string
    grand_lodge_name?: string
    lodge_id?: string
    lodge_name?: string
    grand_officer_status?: string
    grand_officer_role?: string
    
    // Additional
    dietary_requirements?: string
    special_needs?: string
    
    // Partner
    has_partner: boolean
    partner?: {
      title?: string
      first_name: string
      last_name: string
      relationship: string
      dietary_requirements?: string
      special_needs?: string
    }
  }>
  
  // Reference data needed
  grandLodges: Array<{
    grand_lodge_id: string
    name: string
    abbreviation: string
    country: string
  }>
  
  lodges: Array<{
    lodge_id: string
    name: string
    number: number
    grand_lodge_id: string
  }> // Filtered by selected grand lodge
  
  masonicRanks: string[]
  titles: string[]
  relationshipTypes: string[]
}
```

#### Lodge Registration Form
**Component**: `components/register/Forms/attendee/LodgesForm.tsx`
**Data Required**:
```typescript
{
  // Lodge details
  lodge: {
    grand_lodge_id: string
    lodge_id: string
    lodge_name: string
    lodge_number?: number
  }
  
  // Booking contact (not attendee)
  bookingContact: {
    title?: string
    first_name: string
    last_name: string
    email: string
    mobile_number: string
    
    // Mason details
    rank?: string
    grand_officer_status?: string
    grand_officer_role?: string
    
    // Additional
    dietary_requirements?: string
    additional_info?: string
  }
  
  // Order details
  tableCount: number // Each table = 10 seats
  specialRequests?: string
  
  // Reference data
  grandLodges: Array<{
    grand_lodge_id: string
    name: string
    abbreviation: string
  }>
  
  lodges: Array<{
    lodge_id: string
    name: string
    number: number
    display_name?: string
  }> // Filtered by grand lodge
}
```

#### Delegation Registration Forms
**Component**: `components/register/Forms/attendee/DelegationsForm.tsx`
**Data Required**:
```typescript
{
  delegationType: 'grand_lodge' | 'masonic_order'
  
  // Delegation info
  delegation: {
    name: string
    order_number?: string
    
    // For Grand Lodge delegation
    grand_lodge_id?: string
    
    // For Masonic Order
    formal_name?: string
    abbreviation?: string
    known_as?: string
  }
  
  // Head of delegation (primary attendee)
  headOfDelegation: {
    // Same fields as Individual attendee
    is_head_of_delegation: true
  }
  
  // Delegation members
  members: Array<{
    // Same structure as Individual attendees
    // All inherit grand_lodge from delegation
  }>
  
  // Reference data
  grandLodges: Array<{...}>
  masonicOrders?: Array<{
    id: string
    name: string
    abbreviation: string
  }>
}
```

### Ticket Selection Page
**Route**: `/events/[slug]/register/[registrationId]/tickets`
**Data Required**:
```typescript
{
  event: {
    event_id: string
    title: string
    is_parent: boolean
  }
  
  // For parent events - show child events
  childEvents?: Array<{
    event_id: string
    title: string
    subtitle?: string
    event_start: Date
    tickets: Array<TicketType>
  }>
  
  // For single events
  tickets?: Array<TicketType>
  
  // Current registration context
  registration: {
    registration_id: string
    registration_type: string
    attendees: Array<{
      attendee_id: string
      name: string
      attendee_type: string
      selected_tickets: Array<{
        ticket_id: string
        event_id: string
      }>
    }>
  }
  
  // Real-time availability
  availability: Map<ticket_id, {
    available_count: number
    reserved_count: number
    sold_count: number
  }>
}

interface TicketType {
  id: string
  name: string
  description?: string
  price: number
  available_count: number
  eligibility_criteria?: any
  
  // Eligibility check result
  eligible_attendees: string[] // attendee_ids who can select this
}
```

### Order Review Page
**Route**: `/events/[slug]/register/[registrationId]/review`
**Data Required**:
```typescript
{
  registration: {
    registration_id: string
    registration_type: string
    event: {
      title: string
      event_start: Date
    }
  }
  
  // Summary by section
  attendeeSummary: {
    total_attendees: number
    by_type: {
      mason: number
      guest: number
      partner: number
    }
    attendees: Array<{
      name: string
      type: string
      lodge?: string
      tickets: Array<{
        event_title: string
        ticket_name: string
        price: number
      }>
    }>
  }
  
  ticketSummary: {
    by_event: Array<{
      event_title: string
      tickets: Array<{
        ticket_name: string
        quantity: number
        unit_price: number
        total_price: number
      }>
    }>
    
    subtotal: number
    discounts?: Array<{
      description: string
      amount: number
    }>
    total: number
  }
  
  // Editable sections
  canEdit: {
    attendees: boolean
    tickets: boolean
  }
}
```

### Payment Page
**Route**: `/events/[slug]/register/[registrationId]/payment`
**Data Required**:
```typescript
{
  registration: {
    registration_id: string
    total_amount: number
    currency: string
  }
  
  // Pre-fill from primary attendee or lodge
  defaultBillingDetails?: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    businessName?: string // For lodge registrations
    
    // Address
    addressLine1?: string
    addressLine2?: string
    suburb?: string
    postcode?: string
    state?: string
    country?: string
  }
  
  // For Stripe
  paymentIntent: {
    client_secret: string
    amount: number
  }
  
  // Countries/states for dropdowns
  countries: Array<{
    name: string
    isoCode: string
  }>
  
  states: Array<{
    name: string
    isoCode: string
  }> // Filtered by country
}
```

### Confirmation Page
**Route**: `/events/[slug]/register/[registrationId]/confirmation`
**Data Required**:
```typescript
{
  registration: {
    registration_id: string
    confirmation_number: string
    status: 'paid'
    total_amount_paid: number
    payment_date: Date
  }
  
  event: {
    title: string
    event_start: Date
    location: string
    
    // For calendar add
    description: string
    venue_details?: {
      place_name: string
      full_address: string
    }
  }
  
  // What they purchased
  purchaseSummary: {
    attendees: Array<{
      name: string
      type: string
      email?: string // For ticket delivery
      tickets: Array<{
        ticket_id: string
        event_title: string
        event_date: Date
        ticket_name: string
        qr_code?: string // If generated
      }>
    }>
    
    // For lodge registrations
    lodgeDetails?: {
      lodge_name: string
      table_count: number
      total_seats: number
    }
  }
  
  // Next steps
  actions: {
    download_tickets: boolean
    add_to_calendar: boolean
    share_event: boolean
  }
  
  // Email confirmation
  emailSent: {
    to: string
    status: 'sent' | 'pending' | 'failed'
  }
}
```

## Admin/Organizer Views

### Registration Management
**Route**: `/registrations`
**Data Required**:
```typescript
{
  registrations: Array<{
    registration_id: string
    confirmation_number: string
    registration_date: Date
    registration_type: string
    status: string
    payment_status: string
    
    event: {
      event_id: string
      title: string
    }
    
    customer: {
      name: string
      email: string
      phone?: string
    }
    
    summary: {
      total_attendees: number
      total_amount: number
      amount_paid: number
    }
  }>
  
  // Filters
  filters: {
    event_id?: string
    status?: string
    date_range?: {
      from: Date
      to: Date
    }
  }
  
  // Pagination
  pagination: {
    total: number
    page: number
    per_page: number
  }
}
```

### Event Facade Pattern
**Service**: `lib/event-facade.ts`
**Purpose**: Transform raw event data into display-ready format
**Transformations**:
```typescript
{
  // Input: Raw event from database
  rawEvent: DatabaseEvent
  
  // Output: Display-ready event
  displayEvent: {
    // Formatted dates
    formattedDate: string // "SAT 21 DEC 2024"
    formattedTime: string // "6:00 PM"
    dateRange?: string // "21-23 DEC 2024"
    
    // Formatted location
    locationDisplay: string // "Sydney Masonic Centre, Sydney"
    venueMapUrl?: string // Google Maps URL
    
    // Pricing
    priceDisplay: string // "From $95" or "Free" or "Sold Out"
    
    // Status badges
    badges: Array<{
      text: string
      variant: 'default' | 'secondary' | 'destructive'
    }>
    
    // Computed properties
    isUpcoming: boolean
    isPast: boolean
    isOnSale: boolean
    daysUntilEvent: number
    
    // SEO/Meta
    metaDescription: string // First 160 chars
    canonicalUrl: string
  }
}
```

## Data Loading Strategies

### Static vs Dynamic Data
**Static (can be cached)**:
- Grand Lodges list
- Masonic ranks
- Titles
- Relationship types
- Countries/States

**Dynamic (real-time)**:
- Event availability
- Ticket counts
- Registration data
- Payment status

### Prefetch Requirements
**On Registration Start**:
1. Load event details
2. Load ticket types and packages
3. Check for existing draft
4. Initialize anonymous session

**Per Step**:
- Only load data needed for current step
- Preserve data from previous steps in store
- Validate data before proceeding

This component-based approach ensures each page and component has exactly the data it needs, when it needs it.