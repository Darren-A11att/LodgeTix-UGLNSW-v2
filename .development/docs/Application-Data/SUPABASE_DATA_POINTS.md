# LodgeTix Data Points for Supabase Integration

This document serves as a comprehensive collection of data points for integrating the LodgeTix front-end with Supabase. It maps out the needed data structures, types, and relationships required for the backend.

## Events

### Event Data
```typescript
interface Event {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  startDate: string; // ISO date format
  endDate: string; // ISO date format
  startTime: string; // Format: "2:00 PM"
  endTime: string; // Format: "5:00 PM"
  category: "lodge-meeting" | "degree-ceremony" | "installation" | "festive-board" | "lecture" | "charity" | "ladies-night" | "social";
  degreeType?: "none" | "first" | "second" | "third"; // For degree ceremonies
  location: {
    name: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    mapUrl?: string;
  };
  attendance?: {
    expected: number;
    description: string; // e.g., "500+ Brethren"
  };
  dressCode?: "dark" | "morning" | "casual" | "white" | "black"; // e.g., "Morning Suit or Dark Lounge Suit"
  regalia?: "craft" | "provincial" | "royal-arch" | "other" | "none"; // e.g., "Full Regalia according to rank"
  regaliaDescription?: string; // Additional regalia details
  imageSrc: string; // path to banner/image
  organizerId: string; // reference to organization
  organizerName: string;
  organizerContact: {
    email: string;
    phone?: string;
  };
  isPublished: boolean;
  publishOption: "publish_now" | "members_only" | "save_draft";
  eligibilityRequirements?: string[]; // e.g., ["Master Mason in good standing"]
  sections?: {
    about?: string; // HTML/Markdown content
    schedule?: ScheduleItem[];
    details?: DetailSection[];
  };
  documents?: EventDocument[];
  relatedEvents?: string[]; // array of related event ids
  customFields?: Record<string, any>; // For event-specific data
  createdAt: string;
  updatedAt: string;
}

interface ScheduleItem {
  date: string; // ISO date format
  items: ScheduleDayItem[];
}

interface ScheduleDayItem {
  time: string; // Format: "12:30 PM"
  title: string;
  location?: string;
  description?: string;
}

interface DetailSection {
  title: string; // e.g., "Dress Code", "Regalia Requirements"
  content: string; // HTML/Markdown content
}

interface EventDocument {
  title: string;
  fileUrl: string;
  documentType: string; // e.g., "Program", "Accommodation Guide"
}

// Dashboard statistics for events
interface EventStatistics {
  eventId: string;
  ticketsSold: number;
  revenue: number;
  attendeeCount: number;
  status: "Published" | "Draft";
  salesProgress: number; // Percentage of tickets sold
}
```

### Ticket Types
```typescript
interface TicketDefinition {
  id: string;
  eventId: string;
  name: string;
  price: number;
  description: string;
  available: boolean;
  isPackage: boolean;
  includedTicketTypes?: string[]; // If this is a package, which individual events does it include
  capacity?: number;
  soldCount?: number;
  allowedAttendeeTypes?: string[]; // Restrict tickets to certain attendee types
  salesEndDate?: string; // When tickets stop being available
  createdAt: string;
  updatedAt: string;
}
```

## Registration

### Registration Types
```typescript
type RegistrationType = "individual" | "lodge" | "delegation" | "myself-others";

interface Registration {
  id: string;
  draftId?: string; // For draft registrations (auto-saved)
  registrationType: RegistrationType;
  eventId: string;
  status: "draft" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
  lastSaved?: string; // Timestamp for draft auto-save
  confirmationNumber?: string;
  billingDetails?: BillingDetails;
  totalPrice: number;
  paymentStatus: "pending" | "paid" | "refunded" | "failed";
  paymentMethod?: string;
  paymentIntentId?: string; // Stripe payment intent ID
  userId?: string; // May be null for guest checkouts
  agreeToTerms: boolean; // Required for submission
}
```

### Attendee Data
```typescript
type AttendeeType = "mason" | "lady_partner" | "guest" | "guest_partner" | "delegation_member" | "individual" | "lodge_contact" | "delegation_contact";

type MasonicTitle = "Bro" | "W Bro" | "VW Bro" | "RW Bro" | "MW Bro";
type MasonicRank = "EAF" | "FCF" | "MM" | "IM" | "WM" | "PM" | "GO" | "PGO" | "DGM" | "PGM";
type GrandOfficerStatus = "Past" | "Present";
type ContactPreference = "Directly" | "PrimaryAttendee" | "ProvideLater" | "Mason/Guest";

interface BaseAttendee {
  attendeeId: string;
  registrationId: string;
  personId?: string; // If linking to a separate persons table
  relatedAttendeeId?: string; // Link to primary Mason/Guest for partners
  attendeeType: AttendeeType;
  isPrimary: boolean;
  
  // Personal Info
  title: string;
  firstName: string;
  lastName: string;
  primaryEmail?: string;
  primaryPhone?: string;
  dietaryRequirements?: string[];
  specialNeeds?: string;
  relationship?: string; // For partner types
  notes?: string;
  
  // Contact Preferences
  contactPreference?: ContactPreference;
  contactConfirmed: boolean;
  
  // Ticket selection
  ticketDefinitionId?: string; // Selected ticket/package
  selectedEvents?: string[]; // Selected individual events if not package
}

interface MasonAttendee extends BaseAttendee {
  attendeeType: "mason";
  title: MasonicTitle;
  
  // Mason-specific fields
  memberNumber?: string;
  rank: MasonicRank;
  grandRank?: string;
  grandLodgeId: string;
  lodgeId?: string;
  lodgeNameNumber?: string; // Display name for the lodge (formatted)
  grandOfficer?: GrandOfficerStatus;
  grandOffice?: string;
  grandOfficeOther?: string;
  pastGrandOffice?: string;
  isPastGrandMaster: boolean;
  honours?: string;
  
  // Partner indicator
  hasLadyPartner: boolean;
}

interface GuestAttendee extends BaseAttendee {
  attendeeType: "guest";
  
  // Partner indicator
  hasGuestPartner: boolean;
}

interface PartnerAttendee extends BaseAttendee {
  attendeeType: "lady_partner" | "guest_partner";
  relatedAttendeeId: string; // Required for partners
  relationship: string; // e.g., "Spouse", "Partner"
}
```

### Ticket Assignment
```typescript
interface AttendeeTicket {
  id: string;
  attendeeId: string;
  registrationId: string;
  ticketDefinitionId: string;
  isPackage: boolean;
  packageTicketIds?: string[]; // If package, list of individual event tickets this includes
  price: number;
  status: "reserved" | "confirmed" | "cancelled";
  ticketNumber?: string; // For physical/digital ticket
  checkInStatus?: "not_checked_in" | "checked_in";
  checkInTime?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Billing Details
```typescript
interface BillingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  paymentMethod: "card" | "paypal";
  cardName?: string; // Name on card if paying by card
  createdAt: string;
  updatedAt: string;
}
```

## Organizations & Reference Data

### Organizations
```typescript
interface Organization {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  email?: string;
  phone?: string;
  type: "masonic_lodge" | "grand_lodge" | "association" | "other";
  createdAt: string;
  updatedAt: string;
}
```

### Grand Lodges
```typescript
interface GrandLodge {
  id: string;
  name: string; // e.g., "United Grand Lodge of NSW & ACT"
  code: string; // e.g., "UGLNSW"
  country: string;
  region?: string; // State/province
  logoUrl?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Lodges
```typescript
interface Lodge {
  id: string;
  name: string;
  number: string;
  formattedName: string; // e.g., "Lodge Commonwealth No. 400"
  grandLodgeId: string; // Foreign key to grand lodge
  meetingLocation?: string;
  city?: string;
  region?: string; // State/province
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## Payment Data

### Payment Information
```typescript
interface Payment {
  id: string;
  registrationId: string;
  amount: number;
  currency: string; // e.g., "AUD"
  status: "pending" | "succeeded" | "failed" | "refunded";
  paymentMethod: "card" | "paypal" | "bank_transfer" | "other";
  paymentProcessor: "stripe" | "paypal" | "manual" | "other";
  processorPaymentId?: string; // e.g., Stripe payment intent ID
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
```

## User Accounts

### User
```typescript
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  masonicInfo?: {
    grandLodgeId?: string;
    lodgeId?: string;
    memberNumber?: string;
    rank?: MasonicRank;
    title?: MasonicTitle;
  };
  registrations?: string[]; // Array of registration IDs
  createdAt: string;
  updatedAt: string;
  lastSignIn?: string;
}

// Authentication specific data
interface AuthSession {
  userId: string;
  sessionId: string;
  createdAt: string;
  expiresAt: string;
  userAgent?: string;
  ipAddress?: string;
}
```

## Organizer Data

### Organizer Account
```typescript
interface OrganizerAccount {
  id: string;
  userId: string; // Link to user account
  organizationId: string; // Link to organization
  role: "admin" | "editor" | "viewer";
  permissions: string[];
  dashboardStats?: {
    totalEvents: number;
    ticketsSold: number;
    totalRevenue: number;
    attendees: number;
  };
  createdAt: string;
  updatedAt: string;
}
```

## Analytics Data

```typescript
interface EventAnalytics {
  eventId: string;
  views: number;
  registrationStarts: number;
  registrationCompletions: number;
  conversionRate: number;
  ticketsSoldByType: Record<string, number>;
  revenueByType: Record<string, number>;
  attendeeDemographics?: {
    grandLodgeBreakdown: Record<string, number>;
    rankBreakdown: Record<string, number>;
  };
  timeSeriesData: {
    date: string;
    sales: number;
    revenue: number;
  }[];
}
```

## Reservation System

```typescript
interface TicketReservation {
  id: string;
  registrationId: string;
  ticketDefinitionId: string;
  quantity: number;
  reservedAt: string;
  expiresAt: string;
  status: "active" | "expired" | "converted" | "cancelled";
}
```

## Value Added Services

```typescript
interface ValueAddedService {
  id: string;
  name: string;
  description: string;
  price: number;
  eventId?: string; // If specific to an event
  isAvailable: boolean;
  maxQuantity?: number;
}

interface RegistrationValueAddedService {
  id: string;
  registrationId: string;
  valueAddedServiceId: string;
  quantity: number;
  price: number; // Price at time of purchase
  attendeeId?: string; // If assigned to specific attendee
}
```

## Location & Check-in Services

```typescript
interface EventVenue {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  mapUrl?: string;
  directions?: string;
  parkingInfo?: string;
  accessibilityInfo?: string;
}

interface CheckInRecord {
  id: string;
  attendeeId: string;
  ticketId: string;
  eventId: string;
  checkedInAt: string;
  checkedInBy?: string; // staff user ID
  notes?: string;
}
```

## Database Relationships

### Primary Relationships
1. **Events** have many **TicketDefinitions**
2. **Registrations** belong to an **Event**
3. **Attendees** belong to a **Registration**
4. **AttendeeTickets** connect **Attendees** with **TicketDefinitions**
5. **Events** belong to an **Organization**
6. **Lodges** belong to a **GrandLodge**
7. **PartnerAttendees** are related to a primary **Attendee** (Mason or Guest)
8. **Users** can have many **Registrations**
9. **OrganizerAccounts** connect **Users** with **Organizations**
10. **Payments** belong to **Registrations**
11. **TicketReservations** belong to **Registrations** and reference **TicketDefinitions**
12. **EventVenues** can be related to many **Events**
13. **ValueAddedServices** can be related to **Events** or available globally
14. **RegistrationValueAddedServices** connect **Registrations** with **ValueAddedServices**

### Secondary Relationships
1. **TicketDefinitions** can include other **TicketDefinitions** (for packages)
2. **Events** can have related **Events** (for multi-day events)
3. **Attendees** can reference **Lodges** and **GrandLodges**
4. **Users** can have **MasonicInfo** that references **Lodges** and **GrandLodges**
5. **CheckInRecords** reference **Attendees**, **AttendeeTickets**, and **Events**

## Example Supabase SQL Schema

```sql
-- Schema setup
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS stripe;
CREATE SCHEMA IF NOT EXISTS log;

-- Organizations and References
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE grand_lodges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT,
  logo_url TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE lodges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  number TEXT NOT NULL,
  formatted_name TEXT NOT NULL,
  grand_lodge_id UUID REFERENCES grand_lodges(id),
  meeting_location TEXT,
  city TEXT,
  region TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Venues
CREATE TABLE event_venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT,
  country TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  map_url TEXT,
  directions TEXT,
  parking_info TEXT,
  accessibility_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TEXT,
  end_time TEXT,
  category TEXT NOT NULL,
  degree_type TEXT,
  venue_id UUID REFERENCES event_venues(id),
  location JSONB NOT NULL,
  attendance JSONB,
  dress_code TEXT,
  regalia TEXT,
  regalia_description TEXT,
  image_src TEXT,
  organizer_id UUID REFERENCES organizations(id),
  organizer_name TEXT,
  organizer_contact JSONB,
  is_published BOOLEAN DEFAULT FALSE,
  publish_option TEXT DEFAULT 'save_draft',
  eligibility_requirements JSONB,
  sections JSONB,
  documents JSONB,
  related_events JSONB,
  custom_fields JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tickets
CREATE TABLE ticket_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  available BOOLEAN DEFAULT TRUE,
  is_package BOOLEAN DEFAULT FALSE,
  included_ticket_types JSONB,
  capacity INTEGER,
  sold_count INTEGER DEFAULT 0,
  allowed_attendee_types JSONB,
  sales_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Value Added Services
CREATE TABLE value_added_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  event_id UUID REFERENCES events(id),
  is_available BOOLEAN DEFAULT TRUE,
  max_quantity INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users and Auth
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  masonic_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sign_in TIMESTAMP WITH TIME ZONE
);

CREATE TABLE auth.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  user_agent TEXT,
  ip_address TEXT
);

-- Organizers
CREATE TABLE organizer_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  role TEXT NOT NULL,
  permissions JSONB,
  dashboard_stats JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Registrations
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draft_id TEXT,
  registration_type TEXT NOT NULL,
  event_id UUID REFERENCES events(id) NOT NULL,
  status TEXT NOT NULL,
  confirmation_number TEXT,
  billing_details JSONB,
  total_price DECIMAL(10, 2) NOT NULL,
  payment_status TEXT NOT NULL,
  payment_method TEXT,
  payment_intent_id TEXT,
  user_id UUID REFERENCES users(id),
  agree_to_terms BOOLEAN DEFAULT FALSE,
  last_saved TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendees
CREATE TABLE attendees (
  attendee_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID REFERENCES registrations(id) NOT NULL,
  person_id UUID,
  related_attendee_id UUID,
  attendee_type TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  
  -- Personal Info
  title TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  primary_email TEXT,
  primary_phone TEXT,
  dietary_requirements JSONB,
  special_needs TEXT,
  relationship TEXT,
  notes TEXT,
  
  -- Contact Preferences
  contact_preference TEXT,
  contact_confirmed BOOLEAN DEFAULT FALSE,
  
  -- Mason-specific fields
  member_number TEXT,
  rank TEXT,
  grand_rank TEXT,
  grand_lodge_id UUID REFERENCES grand_lodges(id),
  lodge_id UUID REFERENCES lodges(id),
  lodge_name_number TEXT,
  grand_officer TEXT,
  grand_office TEXT,
  grand_office_other TEXT,
  past_grand_office TEXT,
  is_past_grand_master BOOLEAN DEFAULT FALSE,
  honours TEXT,
  
  -- Partner indicators
  has_lady_partner BOOLEAN DEFAULT FALSE,
  has_guest_partner BOOLEAN DEFAULT FALSE,
  
  -- Ticket selection
  ticket_definition_id UUID REFERENCES ticket_definitions(id),
  selected_events JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assign tickets to attendees
CREATE TABLE attendee_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendee_id UUID REFERENCES attendees(attendee_id) NOT NULL,
  registration_id UUID REFERENCES registrations(id) NOT NULL,
  ticket_definition_id UUID REFERENCES ticket_definitions(id) NOT NULL,
  is_package BOOLEAN DEFAULT FALSE,
  package_ticket_ids JSONB,
  price DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL,
  ticket_number TEXT,
  check_in_status TEXT DEFAULT 'not_checked_in',
  check_in_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Registration value added services
CREATE TABLE registration_value_added_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID REFERENCES registrations(id) NOT NULL,
  value_added_service_id UUID REFERENCES value_added_services(id) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  attendee_id UUID REFERENCES attendees(attendee_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reservations
CREATE TABLE ticket_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID REFERENCES registrations(id) NOT NULL,
  ticket_definition_id UUID REFERENCES ticket_definitions(id) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  reserved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments and stripe integration
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID REFERENCES registrations(id) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'AUD',
  status TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  payment_processor TEXT NOT NULL,
  processor_payment_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check-in system
CREATE TABLE check_in_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendee_id UUID REFERENCES attendees(attendee_id) NOT NULL,
  ticket_id UUID REFERENCES attendee_tickets(id) NOT NULL,
  event_id UUID REFERENCES events(id) NOT NULL,
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checked_in_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics
CREATE TABLE event_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) NOT NULL,
  views INTEGER DEFAULT 0,
  registration_starts INTEGER DEFAULT 0,
  registration_completions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5, 2),
  ticket_sales_by_type JSONB,
  revenue_by_type JSONB,
  attendee_demographics JSONB,
  time_series_data JSONB,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_registrations_event_id ON registrations(event_id);
CREATE INDEX idx_registrations_user_id ON registrations(user_id);
CREATE INDEX idx_registrations_draft_id ON registrations(draft_id);
CREATE INDEX idx_attendees_registration_id ON attendees(registration_id);
CREATE INDEX idx_attendees_related_id ON attendees(related_attendee_id);
CREATE INDEX idx_attendees_type ON attendees(attendee_type);
CREATE INDEX idx_attendee_tickets_attendee_id ON attendee_tickets(attendee_id);
CREATE INDEX idx_attendee_tickets_registration_id ON attendee_tickets(registration_id);
CREATE INDEX idx_attendee_tickets_ticket_def_id ON attendee_tickets(ticket_definition_id);
CREATE INDEX idx_ticket_definitions_event_id ON ticket_definitions(event_id);
CREATE INDEX idx_payments_registration_id ON payments(registration_id);
CREATE INDEX idx_lodges_grand_lodge_id ON lodges(grand_lodge_id);
CREATE INDEX idx_organizer_accounts_user_id ON organizer_accounts(user_id);
CREATE INDEX idx_organizer_accounts_organization_id ON organizer_accounts(organization_id);
CREATE INDEX idx_value_added_services_event_id ON value_added_services(event_id);
CREATE INDEX idx_events_venue_id ON events(venue_id);
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_ticket_reservations_registration_id ON ticket_reservations(registration_id);
CREATE INDEX idx_ticket_reservations_status ON ticket_reservations(status);
CREATE INDEX idx_check_in_records_event_id ON check_in_records(event_id);
CREATE INDEX idx_check_in_records_attendee_id ON check_in_records(attendee_id);
CREATE INDEX idx_event_analytics_event_id ON event_analytics(event_id);
```

## Supabase Functions and Features

### Authentication and User Management
```typescript
// Auth-related functions
interface AuthFunctions {
  signUp(email: string, password: string, options?: { metadata: any }): Promise<{ user: User | null, error: Error | null }>;
  signIn(email: string, password: string): Promise<{ user: User | null, error: Error | null }>;
  signOut(): Promise<{ error: Error | null }>;
  resetPassword(email: string): Promise<{ error: Error | null }>;
  updatePassword(password: string): Promise<{ error: Error | null }>;
  getSession(): Promise<{ session: Session | null, error: Error | null }>;
}
```

### Realtime Requirements
The following functionality might benefit from Supabase's realtime features:
- Ticket availability and counts
- Registration draft saving
- Checkout process
- Reservation system for temporary ticket holds
- Dashboard statistics and analytics
- Check-in system for event staff

### RLS (Row Level Security) Policies
Key security policies to implement:
1. Users can only view/edit their own registrations
2. Organizers can view/edit events and registrations for their organization
3. Public can view published events but not registrations
4. Event staff can check in attendees but not modify registrations
5. Admin users have full access to all data
6. Anonymous users can create registration drafts but need to authenticate to complete them

### Edge Functions
Potential serverless functions needed:
1. Payment processing with Stripe
   ```typescript
   async function createPaymentIntent(registrationId: string): Promise<{ clientSecret: string }>;
   async function confirmPayment(paymentIntentId: string, registrationId: string): Promise<boolean>;
   ```

2. Email confirmations and notifications
   ```typescript
   async function sendRegistrationConfirmation(registrationId: string): Promise<boolean>;
   async function sendEventReminder(eventId: string): Promise<number>; // Returns count of emails sent
   async function sendTicketUpdates(eventId: string, message: string): Promise<number>;
   ```

3. Ticket PDF generation and QR codes
   ```typescript
   async function generateTicketPDF(attendeeTicketId: string): Promise<{ url: string }>;
   async function generateQRCode(attendeeTicketId: string): Promise<{ url: string }>;
   ```

4. Data validation and cleanup
   ```typescript
   async function validateRegistration(registrationId: string): Promise<{ valid: boolean, errors?: string[] }>;
   async function cleanupExpiredReservations(): Promise<number>; // Returns count of removed reservations
   ```

5. Export and reporting
   ```typescript
   async function exportAttendeeList(eventId: string, format: "csv" | "excel"): Promise<{ url: string }>;
   async function generateEventReport(eventId: string): Promise<{ url: string }>;
   ```

### Storage Buckets
Configure the following storage buckets in Supabase:
1. `event-images` - For event banners and promotional images
2. `documents` - For event documents (programs, guides, etc.)
3. `tickets` - For generated ticket PDFs
4. `exports` - For exported data and reports
5. `user-uploads` - For user-uploaded content

### Next Steps
1. Create the Supabase database schema
2. Implement API services in the front-end
   - EventService
   - RegistrationService
   - AttendeeService
   - TicketService
   - PaymentService
   - UserService
   - OrganizerService
3. Set up authentication flow
4. Create RLS policies
5. Implement edge functions
6. Test registration flow end-to-end
7. Integrate Stripe for payments
8. Implement real-time features
9. Create admin dashboard
10. Set up email notification system