src/
├── app/
│   ├── (public)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                              # Homepage with hero function
│   │   ├── functions/
│   │   │   ├── page.tsx                          # All functions
│   │   │   └── [functionId]/
│   │   │       ├── page.tsx                      # Function details
│   │   │       ├── events/
│   │   │       │   ├── page.tsx                  # All events for this function
│   │   │       │   └── [eventId]/
│   │   │       │       ├── page.tsx              # Event details
│   │   │       │       └── tickets/
│   │   │       │           └── page.tsx          # Event tickets
│   │   │       ├── packages/
│   │   │       │   ├── page.tsx                  # All packages for this function
│   │   │       │   └── [packageId]/
│   │   │       │       └── page.tsx              # Package details
│   │   │       └── register/
│   │   │           ├── layout.tsx                # Registration wizard layout
│   │   │           ├── page.tsx                  # Step 1: Registration type
│   │   │           ├── details/
│   │   │           │   └── page.tsx              # Step 2: Registration details
│   │   │           ├── attendees/
│   │   │           │   └── page.tsx              # Step 3: Add attendees
│   │   │           ├── tickets/
│   │   │           │   └── page.tsx              # Step 4: Select tickets/packages
│   │   │           ├── review/
│   │   │           │   └── page.tsx              # Step 5: Review
│   │   │           └── payment/
│   │   │               └── page.tsx              # Step 6: Payment
│   │   │
│   │   ├── (portals)/
│   │   │   ├── organiser/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx                      # Dashboard
│   │   │   │   ├── functions/
│   │   │   │   │   ├── page.tsx                  # My functions
│   │   │   │   │   ├── new/
│   │   │   │   │   │   └── page.tsx              # Create function
│   │   │   │   │   └── [functionId]/
│   │   │   │   │       ├── page.tsx              # Manage function
│   │   │   │   │       ├── edit/
│   │   │   │   │       │   └── page.tsx
│   │   │   │   │       ├── events/
│   │   │   │   │       │   ├── page.tsx          # Manage events
│   │   │   │   │       │   ├── new/
│   │   │   │   │       │   │   └── page.tsx      # Create event
│   │   │   │   │       │   └── [eventId]/
│   │   │   │   │       │       ├── page.tsx      # Manage event
│   │   │   │   │       │       ├── edit/
│   │   │   │   │       │       │   └── page.tsx
│   │   │   │   │       │       └── tickets/
│   │   │   │   │       │           ├── page.tsx  # Manage event tickets
│   │   │   │   │       │           └── new/
│   │   │   │   │       │               └── page.tsx
│   │   │   │   │       ├── packages/
│   │   │   │   │       │   ├── page.tsx          # Manage packages
│   │   │   │   │       │   ├── new/
│   │   │   │   │       │   │   └── page.tsx
│   │   │   │   │       │   └── [packageId]/
│   │   │   │   │       │       └── edit/
│   │   │   │   │       │           └── page.tsx
│   │   │   │   │       ├── registrations/
│   │   │   │   │       │   ├── page.tsx          # View registrations
│   │   │   │   │       │   └── [registrationId]/
│   │   │   │   │       │       └── page.tsx
│   │   │   │   │       └── reports/
│   │   │   │   │           └── page.tsx
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── customer/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx                      # Customer dashboard
│   │   │   │   ├── registrations/
│   │   │   │   │   ├── page.tsx                  # My registrations
│   │   │   │   │   └── [registrationId]/
│   │   │   │   │       ├── page.tsx              # Registration details
│   │   │   │   │       ├── edit/
│   │   │   │   │       │   └── page.tsx          # Edit registration
│   │   │   │   │       ├── attendees/
│   │   │   │   │       │   ├── page.tsx          # Manage attendees
│   │   │   │   │       │   ├── new/
│   │   │   │   │       │   │   └── page.tsx      # Add attendee
│   │   │   │   │       │   └── [attendeeId]/
│   │   │   │   │       │       ├── page.tsx      # Attendee details
│   │   │   │   │       │       ├── edit/
│   │   │   │   │       │       │   └── page.tsx
│   │   │   │   │       │       └── tickets/
│   │   │   │   │       │           └── page.tsx  # Manage attendee tickets
│   │   │   │   │       └── tickets/
│   │   │   │   │           └── page.tsx          # All tickets for registration
│   │   │   │   ├── profile/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   └── attendee/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx                      # Attendee dashboard
│   │   │       ├── tickets/
│   │   │       │   ├── page.tsx                  # My tickets
│   │   │       │   └── [ticketId]/
│   │   │       │       └── page.tsx              # Ticket details/QR code
│   │   │       ├── events/
│   │   │       │   └── page.tsx                  # My events schedule
│   │   │       ├── profile/
│   │   │       │   └── page.tsx
│   │   │       └── settings/
│   │   │           └── page.tsx
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts
│   │       ├── functions/
│   │       │   ├── route.ts                      # GET all, POST new
│   │       │   └── [functionId]/
│   │       │       ├── route.ts                  # GET, PUT, DELETE function
│   │       │       ├── events/
│   │       │       │   ├── route.ts              # GET all, POST new
│   │       │       │   └── [eventId]/
│   │       │       │       ├── route.ts          # GET, PUT, DELETE event
│   │       │       │       └── tickets/
│   │       │       │           ├── route.ts      # GET all, POST new
│   │       │       │           └── [ticketId]/
│   │       │       │               └── route.ts  # GET, PUT, DELETE ticket
│   │       │       ├── packages/
│   │       │       │   ├── route.ts              # GET all, POST new
│   │       │       │   └── [packageId]/
│   │       │       │       └── route.ts          # GET, PUT, DELETE package
│   │       │       └── registrations/
│   │       │           ├── route.ts              # GET all, POST new
│   │       │           └── [registrationId]/
│   │       │               ├── route.ts          # GET, PUT, DELETE
│   │       │               └── attendees/
│   │       │                   ├── route.ts      # GET all, POST new
│   │       │                   └── [attendeeId]/
│   │       │                       ├── route.ts  # GET, PUT, DELETE
│   │       │                       └── tickets/
│   │       │                           └── route.ts
│   │       ├── registrations/
│   │       │   └── route.ts                      # GET user's registrations
│   │       ├── attendees/
│   │       │   └── route.ts                      # GET user's attendee profiles
│   │       └── tickets/
│   │           └── route.ts                      # GET user's tickets
│   │
│   ├── components/
│   │   ├── ui/                                   # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── form.tsx
│   │   │   └── ...
│   │   ├── forms/
│   │   │   ├── registration/
│   │   │   │   ├── RegistrationTypeSelector.tsx
│   │   │   │   ├── IndividualForm.tsx
│   │   │   │   ├── LodgeForm.tsx
│   │   │   │   └── OfficialDelegationForm.tsx
│   │   │   ├── AttendeeForm.tsx
│   │   │   ├── TicketSelectionForm.tsx
│   │   │   └── PaymentForm.tsx
│   │   ├── wizards/
│   │   │   ├── RegistrationWizard.tsx
│   │   │   └── RegistrationSteps.tsx
│   │   ├── portals/
│   │   │   ├── organiser/
│   │   │   │   ├── FunctionCard.tsx
│   │   │   │   ├── EventList.tsx
│   │   │   │   ├── RegistrationStats.tsx
│   │   │   │   └── ReportsChart.tsx
│   │   │   ├── customer/
│   │   │   │   ├── RegistrationCard.tsx
│   │   │   │   ├── AttendeeList.tsx
│   │   │   │   └── TicketSummary.tsx
│   │   │   └── attendee/
│   │   │       ├── TicketCard.tsx
│   │   │       ├── EventSchedule.tsx
│   │   │       └── QRCodeDisplay.tsx
│   │   ├── layout/
│   │   │   ├── PublicHeader.tsx
│   │   │   ├── PortalSidebar.tsx
│   │   │   └── Footer.tsx
│   │   └── common/
│   │       ├── HeroFunction.tsx
│   │       ├── FunctionCard.tsx
│   │       ├── EventCard.tsx
│   │       ├── PackageCard.tsx
│   │       └── LoadingSpinner.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                         # Browser client
│   │   │   ├── server.ts                         # Server client (App Router)
│   │   │   ├── middleware.ts                     # Middleware client
│   │   │   ├── types.ts                          # Database types
│   │   │   └── queries/
│   │   │       ├── functions.ts
│   │   │       ├── events.ts
│   │   │       ├── registrations.ts
│   │   │       ├── attendees.ts
│   │   │       └── tickets.ts
│   │   ├── auth/
│   │   │   ├── actions.ts                        # Server actions for auth
│   │   │   └── hooks.ts                          # useUser, useAuth hooks
│   │   └── storage/
│   │       └── helpers.ts                        # Storage utilities
│   │
│   ├── services/
│   │   ├── database/                             # Database services using Supabase
│   │   │   ├── functions.service.ts
│   │   │   ├── events.service.ts
│   │   │   └── ...
│   │   └── storage/
│   │       └── upload.service.ts
│   │
│   └── middleware.ts                             # Supabase auth middleware
│
├── supabase/
│   ├── migrations/                               # SQL migrations
│   │   ├── 00001_initial_schema.sql
│   │   ├── 00002_auth_setup.sql
│   │   ├── 00003_rls_policies.sql
│   │   └── 00004_storage_buckets.sql
│   ├── functions/                                # Edge Functions
│   │   ├── send-confirmation-email/
│   │   │   └── index.ts
│   │   ├── process-payment/
│   │   │   └── index.ts
│   │   ├── generate-tickets/
│   │   │   └── index.ts
│   │   └── _shared/
│   │       └── cors.ts
│   └── seed.sql                                  # Seed data
│
├── .env.local
├── package.json
└── tsconfig.json