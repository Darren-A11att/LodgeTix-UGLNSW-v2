Comprehensive Registration Workflow Checklist

  1. Infrastructure & Environment Setup

  1.1 Environment Variables

  - NEXT_PUBLIC_SUPABASE_URL - Set and accessible
  - NEXT_PUBLIC_SUPABASE_ANON_KEY - Set and accessible
  - SUPABASE_SERVICE_ROLE_KEY - Set for server-side operations
  - STRIPE_SECRET_KEY - Set for payment processing
  - STRIPE_PUBLISHABLE_KEY - Set for client-side Stripe
  - NEXT_PUBLIC_APP_URL - Set for absolute URL generation
  - NEXT_PUBLIC_TURNSTILE_SITE_KEY - Set if using Turnstile
  - TURNSTILE_SECRET_KEY - Set if using Turnstile

  1.2 Database Setup

  - Supabase project created and accessible
  - All migrations applied successfully
  - RLS policies configured correctly
  - Anonymous user permissions set up
  - Tables exist: events, tickets, registrations, customers, attendees

  2. Database Schema Validation

  2.1 Events Table

  - id column is UUID type
  - slug column exists and has unique constraint
  - parent_event_id column references events.id (FK)
  - status column with values: 'draft', 'published', 'archived'
  - Check constraint: slug format validation
  - Index on slug for fast lookups
  - Index on parent_event_id for child queries

  2.2 Registrations Table

  - id column is UUID type
  - event_id column is UUID type with FK to events.id
  - customer_id column is UUID type with FK to customers.id
  - user_id column allows anonymous users (nullable)
  - Proper indexes on foreign keys

  3. Frontend Routing & Navigation

  3.1 Route Structure

  - /events - Lists all events
  - /events/[slug] - Event detail page (slug in URL)
  - /events/[slug]/register - Registration start (slug in URL)
  - /events/[slug]/register/[step] - Registration steps (slug in URL)
  - /events/[slug]/confirmation - Confirmation page (slug in URL)

  3.2 Event Loading Flow

  - Route receives slug parameter
  - getEventByIdOrSlug() called with slug
  - Function queries by slug first, then UUID if needed
  - Event object returned contains both id (UUID) and slug
  - Event data stored in Zustand with UUID as key

  4. State Management (Zustand)

  4.1 Registration Store Structure

  {
    currentEventId: string,        // Must be UUID
    currentEventSlug: string,      // For URL construction
    registrationType: string,
    attendees: {
      individuals: [],
      delegations: [],
      lodges: []
    },
    tickets: {
      [attendeeId]: ticketId     // Both UUIDs
    },
    registration: {
      id: string,                // UUID
      eventId: string,           // UUID
      customerId: string         // UUID
    }
  }

  4.2 State Validation Points

  - Event setter validates UUID format for eventId
  - Event setter stores slug separately
  - Registration creation uses eventId (UUID) not slug
  - Ticket selection uses UUID references

  5. API Endpoints & Validation

  5.1 GET /api/registrations/[id]

  - Expects UUID registration ID
  - Returns registration with event UUID
  - Includes event details via join

  5.2 POST /api/registrations

  - Request body validation:
  {
    eventId: string,           // MUST be UUID
    customerId: string,        // MUST be UUID  
    attendees: [],
    tickets: {}
  }
  - UUID validation on eventId before any database operation
  - If non-UUID provided, attempt resolution via getEventByIdOrSlug
  - Clear error message if event not found
  - Insert uses validated UUID

  5.3 POST /api/registrations/[id]/payment

  - Validates registration ID is UUID
  - Verifies registration exists
  - Creates Stripe payment intent
  - Updates registration with payment details

  6. Critical Data Flow Points

  6.1 Homepage to Event Selection

  - User clicks event card/link
  - Link contains slug: /events/grand-proclamation-2025
  - Next.js router extracts slug from URL
  - Page component receives slug as param

  6.2 Event Page to Registration

  - Event page loads event by slug
  - Stores event UUID in Zustand
  - "Register" button links to /events/[slug]/register
  - Registration page verifies event in store matches URL

  6.3 Registration Type Selection

  - Component reads eventId (UUID) from store
  - Validates user has anonymous session
  - On continue, navigates to /events/[slug]/register/attendee-details
  - State persisted with UUID references

  6.4 Attendee Details Collection

  - Form collects attendee information
  - Each attendee gets temporary UUID
  - Event reference remains UUID
  - Navigation uses slug for URLs

  6.5 Ticket Selection

  - Loads tickets by event UUID
  - Associates tickets (UUID) with attendees (UUID)
  - Calculates pricing
  - Stores selections with UUID references

  6.6 Payment Processing

  - Creates registration via POST /api/registrations
  - CRITICAL: Must send eventId as UUID, not slug
  - Receives registration UUID back
  - Creates payment intent with registration UUID
  - Redirects to confirmation with registration UUID

  7. Authentication & Permissions

  7.1 Anonymous User Flow

  - SessionGuard creates anonymous session
  - Session stored in Supabase auth
  - Session ID available in API routes
  - RLS policies allow anonymous users to:
    - Read published events
    - Create registrations
    - Read own registrations

  7.2 Permission Checks

  - Events API checks event.status === 'published'
  - Registration creation checks event exists
  - Payment updates check registration ownership

  8. Error Handling & Recovery

  8.1 Slug Resolution Failures

  - If slug not found, check legacy mappings
  - If still not found, return 404
  - Log resolution attempts

  8.2 Registration Save Failures

  - Validate all UUIDs before database insert
  - Catch foreign key violations
  - Return user-friendly error messages
  - Preserve form data for retry

  9. Testing Procedures

  9.1 Unit Tests

  - getEventByIdOrSlug handles both formats
  - UUID validation functions work correctly
  - Slug validation allows valid formats
  - State management preserves UUID/slug separation

  9.2 Integration Tests

  - Full registration flow with slug URLs
  - API endpoints handle UUID validation
  - Database constraints prevent invalid data
  - Payment processing with correct IDs

  9.3 E2E Tests

  - Navigate from homepage to confirmation
  - Verify URLs use slugs throughout
  - Verify API calls use UUIDs
  - Test browser back/forward navigation
  - Test page refresh at each step

  10. Common Issues & Solutions

  10.1 Slug Used as ID

  - Symptom: "Invalid UUID" errors
  - Cause: Frontend sending slug instead of UUID
  - Fix: Ensure state management separates eventId and eventSlug
  - Validation: Add UUID format check before API calls

  10.2 Event Not Found

  - Symptom: 404 or "Invalid event specified"
  - Cause: Slug doesn't exist or event not published
  - Fix: Verify event exists and is published
  - Validation: Check event status in queries

  10.3 Registration Creation Fails

  - Symptom: 400 Bad Request on POST /api/registrations
  - Cause: eventId is slug not UUID
  - Fix: Frontend must send UUID from store
  - Validation: API validates UUID format