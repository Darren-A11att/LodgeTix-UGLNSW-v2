# Product Requirements Document: Organizer Portal (v2)
## LodgeTix-UGLNSW-v2 - Hierarchical Event System with Stripe Connect

### Document Information
- **Version**: 2.0
- **Date**: January 2025
- **Author**: Development Team
- **Status**: Updated with Parent-Child Event Structure & Stripe Connect

---

## 1. Executive Summary

The Organizer Portal is a comprehensive event management system for LodgeTix that enables event organizers to **host functions** (parent events) with multiple child events, manage attendee registrations, process payments through Stripe Connect, and monitor event performance. This system supports the unique structure of Masonic events where a single function encompasses multiple ceremonies and activities.

## 2. Business Context

### 2.1 Problem Statement
Masonic events are typically multi-event functions (e.g., "Grand Proclamation 2025" with multiple ceremonies, or "Leichhardt Lodge Installation 2025" with an Installation Ceremony and Festive Board). Current systems don't properly support this hierarchical structure where:
- **Parent Events (Functions)** act as containers for multiple child events
- **Child Events** have the actual tickets
- **Registrations** are made at the function level
- **Attendees** select tickets for specific child events

Additionally, organizers need to:
- Manage their own payment processing through Stripe Connect
- Have full control over their event structure
- Track attendance across multiple related events

### 2.2 Goals
- Enable organizers to "Host a Function" with multiple child events
- Integrate Stripe Connect for distributed payment processing
- Provide intuitive management of hierarchical event structures
- Support the complete lifecycle of multi-event functions

## 3. Event Structure & Terminology

### 3.1 Hierarchy
```
Function (Parent Event)
├── Child Event 1
│   ├── Ticket Type A
│   └── Ticket Type B
├── Child Event 2
│   ├── Ticket Type C
│   └── Ticket Type D
└── Registration
    ├── Attendee 1
    │   ├── Ticket to Child Event 1
    │   └── Ticket to Child Event 2
    └── Attendee 2
        └── Ticket to Child Event 2
```

### 3.2 Terminology Updates
- **"Host a Function"** - Create a parent event
- **"Function"** - Parent event container
- **"Events"** - Child events within a function
- **"Registration"** - A booking for a function
- **"Attendees"** - People within a registration

## 4. User Personas

### 4.1 Primary: Function Organizer
- **Role**: Lodge Secretary, Event Committee Member
- **Technical Skill**: Basic to intermediate
- **Needs**: 
  - Easy function creation with multiple events
  - Stripe Connect onboarding
  - Attendee management across events
  - Financial tracking and payouts

### 4.2 Secondary: Grand Lodge Administrator
- **Role**: Grand Lodge staff overseeing multiple functions
- **Technical Skill**: Intermediate to advanced
- **Needs**:
  - Oversight of all functions
  - Platform-wide reporting
  - Organizer management
  - Stripe Connect platform administration

## 5. Functional Requirements (MoSCoW)

### 5.1 MUST Have

#### 5.1.1 Authentication & Stripe Connect Onboarding
- [ ] Secure login using existing Supabase Auth
- [ ] **Stripe Connect Express onboarding flow**
- [ ] **Bank account and payout management**
- [ ] **KYC (Know Your Customer) compliance**
- [ ] Dashboard showing Stripe account status

#### 5.1.2 Function Management (Parent Events)
- [ ] **"Host a Function" wizard** for creating parent events
- [ ] Set function-wide details (name, dates, description)
- [ ] Add multiple child events within a function
- [ ] Manage function lifecycle (draft, published, closed, archived)
- [ ] Duplicate entire functions as templates

#### 5.1.3 Child Event Management
- [ ] Create events within a function (Installation, Festive Board, etc.)
- [ ] Set individual event times and locations
- [ ] **Create, update, close, archive child events**
- [ ] Define capacity per child event
- [ ] Manage event-specific settings

#### 5.1.4 Ticket Management (Child Event Level)
- [ ] Define ticket types per child event
- [ ] Set pricing and eligibility rules
- [ ] Manage inventory per ticket type
- [ ] Enable/disable ticket sales per event
- [ ] Cross-event ticket packages

#### 5.1.5 Registration & Attendee Management
- [ ] View registrations at function level
- [ ] See attendee distribution across child events
- [ ] Manage individual attendee tickets
- [ ] Process refunds through Stripe Connect
- [ ] Export attendee lists per event or function-wide

#### 5.1.6 Financial Management via Stripe Connect
- [ ] **View Stripe Connect dashboard**
- [ ] **Track payments and payouts**
- [ ] **Manage refunds directly**
- [ ] **Download financial reports**
- [ ] **Set up bank transfers**

#### 5.1.7 Sidebar Layout Application
- [ ] Fixed sidebar navigation (based on example)
- [ ] Responsive mobile menu
- [ ] Quick access to functions
- [ ] User profile and settings
- [ ] Notification center

### 5.2 SHOULD Have

#### 5.2.1 Advanced Function Features
- [ ] Function series (recurring annual events)
- [ ] Child event dependencies
- [ ] Attendee flow management between events
- [ ] Venue management across events
- [ ] Custom branding per function

#### 5.2.2 Stripe Connect Advanced Features
- [ ] Custom payout schedules
- [ ] Multi-currency support
- [ ] Tax reporting integration
- [ ] Platform fee configuration
- [ ] Dispute management

#### 5.2.3 Communication Tools
- [ ] Email attendees by event or function-wide
- [ ] Event-specific announcements
- [ ] Automated reminder sequences
- [ ] Check-in notifications

### 5.3 COULD Have

#### 5.3.1 Analytics & Insights
- [ ] Cross-event attendance patterns
- [ ] Revenue optimization suggestions
- [ ] Historical function comparisons
- [ ] Attendee journey mapping

#### 5.3.2 Integration Features
- [ ] Calendar sync for multi-event functions
- [ ] Lodge management system integration
- [ ] Accommodation booking integration
- [ ] Transport coordination tools

### 5.4 MAY Have (Future)

#### 5.4.1 Advanced Platform Features
- [ ] White-label options for Grand Lodges
- [ ] Multi-organizer collaboration
- [ ] AI-powered event scheduling
- [ ] Virtual event support

## 6. User Workflows

### 6.1 Host a Function Workflow
```
1. Login → Dashboard
2. Click "Host a Function"
3. EventCreationWizard launches
   Step 1: Function Details
   - Function name (e.g., "Leichhardt Lodge Installation 2025")
   - Overall date range
   - Description and branding
   
   Step 2: Add Child Events
   - Event 1: Installation Ceremony (2pm-4pm)
   - Event 2: Festive Board (6pm-10pm)
   - Set individual capacities
   
   Step 3: Configure Tickets
   - For Installation: Mason-only tickets
   - For Festive Board: Mason & Guest tickets
   - Set pricing per ticket type
   
   Step 4: Stripe Connect Setup (if first time)
   - Complete onboarding
   - Verify bank details
   - Set payout preferences
   
   Step 5: Review & Publish
   - Preview function structure
   - Confirm all events
   - Publish function
```

### 6.2 Manage Child Events Workflow
```
1. Dashboard → Select Function
2. View child events list
3. Actions per child event:
   - Edit: Update times, capacity
   - Close: Stop new registrations
   - Archive: Hide from public
   - Duplicate: Copy for next year
4. Add new child event
5. Reorder events
6. Update cross-event settings
```

### 6.3 Stripe Connect Onboarding Flow
```
1. First function creation triggers onboarding
2. Redirect to Stripe Connect Express
3. Complete business information
4. Verify identity (KYC)
5. Add bank account
6. Return to LodgeTix
7. Dashboard shows connected status
8. Can now accept payments
```

## 7. Technical Requirements

### 7.1 Database Schema (Hierarchical Events)
```sql
-- Parent Events (Functions)
CREATE TABLE functions (
    id UUID PRIMARY KEY,
    organizer_id UUID REFERENCES users(id),
    stripe_account_id TEXT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    date_start DATE,
    date_end DATE,
    status TEXT, -- draft, published, closed, archived
    created_at TIMESTAMP
);

-- Child Events
CREATE TABLE events (
    id UUID PRIMARY KEY,
    function_id UUID REFERENCES functions(id),
    name TEXT NOT NULL,
    event_start TIMESTAMP,
    event_end TIMESTAMP,
    location TEXT,
    capacity INTEGER,
    status TEXT, -- active, closed, archived
    display_order INTEGER
);

-- Tickets (Child Event Level)
CREATE TABLE ticket_definitions (
    id UUID PRIMARY KEY,
    event_id UUID REFERENCES events(id),
    name TEXT,
    price DECIMAL,
    eligibility TEXT[],
    quantity INTEGER
);

-- Registrations (Function Level)
CREATE TABLE registrations (
    id UUID PRIMARY KEY,
    function_id UUID REFERENCES functions(id),
    customer_id UUID,
    stripe_payment_intent_id TEXT,
    status TEXT,
    total_amount DECIMAL
);

-- Attendees with Tickets
CREATE TABLE attendees (
    id UUID PRIMARY KEY,
    registration_id UUID REFERENCES registrations(id),
    person_id UUID,
    attendee_type TEXT
);

CREATE TABLE tickets (
    id UUID PRIMARY KEY,
    attendee_id UUID REFERENCES attendees(id),
    ticket_definition_id UUID REFERENCES ticket_definitions(id),
    event_id UUID REFERENCES events(id),
    status TEXT
);
```

### 7.2 Stripe Connect Integration
- Use Stripe Connect Express for onboarding
- Implement OAuth flow for account connection
- Store `stripe_account_id` per organizer
- Use destination charges for payments
- Implement platform fees
- Handle refunds through connected accounts

### 7.3 API Design (Supabase Stored Procedures)
Key procedures for hierarchical events:
- `sp_create_function` - Create parent with initial child events
- `sp_manage_child_event` - CRUD for child events
- `sp_get_function_overview` - Aggregated function data
- `sp_process_stripe_connect` - Handle Stripe webhooks
- `sp_generate_function_report` - Cross-event reporting

## 8. UI/UX Requirements

### 8.1 Sidebar Layout Structure
Based on the provided example:
- Fixed sidebar (desktop) / Slide-out (mobile)
- Navigation sections:
  - Dashboard
  - My Functions
  - Reports
  - Stripe Payments
  - Settings
- Function quick-access list
- User profile section

### 8.2 Key Screens
1. **Dashboard** - Overview of all functions
2. **Host a Function Wizard** - Multi-step creation
3. **Function Manager** - Parent event with child events
4. **Event Editor** - Individual child event management
5. **Stripe Connect Dashboard** - Payment overview
6. **Reports Hub** - Cross-event analytics

## 9. Security Requirements

### 9.1 Stripe Connect Security
- Secure OAuth flow for account connection
- Encrypted storage of Stripe account IDs
- PCI compliance for payment handling
- Webhook signature verification
- Secure API key management

### 9.2 Data Access Control
- Organizers see only their functions
- RLS policies enforce data isolation
- Audit trail for financial operations
- Secure file uploads for KYC documents

## 10. Success Metrics

### 10.1 Adoption Metrics
- Number of functions hosted
- Stripe Connect activation rate
- Average child events per function
- Cross-event ticket sales

### 10.2 Financial Metrics
- Total payment volume processed
- Average function revenue
- Platform fee collection
- Refund rates

### 10.3 Operational Metrics
- Time to create a function
- Child event management efficiency
- Support ticket reduction
- User satisfaction scores

## 11. Implementation Priorities

### Phase 1: Foundation & Stripe Connect
1. Sidebar layout implementation
2. Authentication with organizer roles
3. Stripe Connect Express integration
4. Basic function creation

### Phase 2: Hierarchical Events
1. Parent-child event structure
2. EventCreationWizard
3. Child event management
4. Ticket configuration

### Phase 3: Operations
1. Registration management
2. Cross-event reporting
3. Financial dashboards
4. Communication tools

## 12. Open Questions

1. How should platform fees be structured for Stripe Connect?
2. Should child events inherit settings from parent functions?
3. What happens to registrations if a child event is cancelled?
4. How do we handle attendees who only want tickets to some child events?
5. Should organizers be able to transfer functions to other organizers?

---

## Appendix A: Stripe Connect Requirements
- Express account type for simplified onboarding
- Platform fee: 2.5% + Stripe fees
- Weekly payouts by default
- Support for AU bank accounts
- Refund capability through platform

## Appendix B: Event Examples
1. **Grand Proclamation 2025**
   - Investiture Ceremony
   - Grand Banquet
   - Ladies Program
   - Partners Lunch

2. **Leichhardt Lodge Installation 2025**
   - Installation Ceremony
   - Festive Board