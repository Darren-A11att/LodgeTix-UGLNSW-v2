# Agile Development Roadmap - Organizer Portal

## Overview
This roadmap prioritizes organizer needs based on their "jobs to be done". Each version delivers immediate value, with Version 1 being useful from day one for managing existing events.

---

## Version 1: "See and Export" - Attendee Management (2 weeks)
**Goal**: Help organizers know who's coming and report to their committee

### Core Features:
- View all registrations for my events
- See detailed attendee information (dietary, special needs)
- Filter by event, payment status, attendee type
- Export attendee lists (CSV/Excel)
- Export financial summaries
- Print-friendly attendee lists
- Basic dashboard with key metrics

### Key Outcomes:
- **Immediate value** for current events
- Can replace manual spreadsheets
- Committee reporting solved
- Catering lists available

---

## Version 2: "Communicate and Support" - Customer Service (2 weeks)
**Goal**: Enable organizers to communicate with attendees and handle common issues

### Core Features:
- Send emails to individual attendees
- Send bulk emails to event attendees
- Process refunds
- Re-issue tickets
- Update attendee information
- View/resend confirmation emails
- Basic email templates

### Key Outcomes:
- Reduced phone calls
- Self-service problem resolution
- Better attendee experience
- Audit trail of communications

---

## Version 3: "Get Paid" - Financial Operations (4 weeks)
**Goal**: Connect bank accounts and automate payment processing

### Core Features:
- Stripe Connect Custom account setup
- KYC verification workflow
- Bank account connection
- View payment details
- Track payouts
- Financial reconciliation reports
- Platform fee transparency
- GST-compliant invoices

### Key Outcomes:
- Automated payment flow
- Money in = money out
- Clear financial records
- Trust through transparency

---

## Version 4: "Create and Manage" - Event Creation (3 weeks)
**Goal**: Enable self-service event creation and management

### Core Features:
- Create parent events (Functions)
- Add child events with schedules
- Set up ticket types and pricing
- Manage capacity
- Create packages
- Publish/unpublish events
- Clone previous events
- Preview before publishing

### Key Outcomes:
- Full event lifecycle management
- Reduced platform support
- Faster event setup
- Consistent event quality

---

## Version 5: "Scale and Professionalize" - Advanced Tools (3 weeks)
**Goal**: Provide professional tools for efficient operations

### Core Features:
- Email template library
- Bulk operations (emails, updates)
- Advanced analytics dashboard
- Check-in system (QR codes)
- Badge printing
- Seating management
- Automated reminders
- Integration with accounting software

### Key Outcomes:
- Professional operations
- Time savings through automation
- Data-driven decisions
- Scalable processes

---

## Development Principles

### Sequential Dependencies:
1. **Authentication before anything** - Can't show data without knowing who the user is
2. **Read before write** - Understand data before modifying it
3. **Events before payments** - Need something to sell before accepting money
4. **Payments before refunds** - Can't refund what hasn't been paid
5. **Core before advanced** - Email templates come after basic email works

### Technical Approach:
- Use existing Supabase schema where possible
- Minimize database changes in early versions
- Build on proven patterns from existing codebase
- Progressive enhancement
- Mobile-first design

### Success Metrics:
- Version 1: 5 organizers using dashboard daily
- Version 2: First event created and published
- Version 3: First successful payment processed
- Version 4: 50% reduction in support tickets
- Version 5: 95% feature adoption rate

---

## Risk Mitigation:
- Each version is independently valuable
- Can pause at any version and still have a working system
- Regular user feedback between versions
- Rollback plan for each version
- Comprehensive testing at each stage