# Product Requirements Document: Confirmation Email Edge Functions

## Executive Summary
Implement a Supabase Edge Function system to automatically send confirmation emails for different registration types and contact preferences in the LodgeTix platform. The system will handle four distinct email types with consistent branding and professional presentation suitable for Masonic events.

## Background
Currently, confirmation emails are sent through API routes. Moving to Edge Functions provides:
- Better scalability and reliability
- Separation of concerns
- Consistent email delivery
- Easier maintenance and updates
- Direct database integration

## Email Types

### 1. Individual Registration Confirmation Email
**Recipients**: Individuals who complete registration
**Content**:
- Personal greeting with attendee name
- Registration confirmation number
- Function (event series) details
- Selected events and tickets
- Payment summary
- Personal QR code for check-in
- Important dates and venue information

### 2. Lodge Registration Confirmation Email
**Recipients**: Lodge booking contact
**Content**:
- Lodge name and registration details
- Complete member list with their roles
- Package and ticket selections
- Payment breakdown including fees
- QR codes for all lodge members
- Lodge-specific instructions
- Booking contact responsibilities

### 3. Attendee Direct Contact Ticket Email
**Recipients**: Individual attendees who selected "contact me directly"
**Content**:
- Personal ticket information
- Event details they're attending
- Individual QR code
- Venue and timing information
- Contact details for queries
- What to bring/dress code

### 4. Primary Contact Ticket Email
**Recipients**: Primary attendee when other attendees selected "contact primary"
**Content**:
- List of attendees under their responsibility
- All ticket details for the group
- QR codes for each attendee
- Instructions for distributing tickets
- Group coordination information

## Technical Architecture

### Edge Function Structure
```
supabase/functions/send-confirmation-email/
├── index.ts                    # Main handler logic
├── templates/
│   ├── layout.tsx             # Shared email layout
│   ├── individual-confirmation.tsx
│   ├── lodge-confirmation.tsx
│   ├── attendee-ticket.tsx
│   └── primary-contact-tickets.tsx
├── types/
│   └── email-types.ts         # TypeScript definitions
└── utils/
    ├── data-fetcher.ts        # Database queries
    └── email-sender.ts        # Email sending logic
```

### Data Flow
1. Triggered after successful payment processing
2. Fetch complete registration data including:
   - Registration details
   - Function and event information
   - Attendee list with contact preferences
   - Tickets and packages
   - QR code URLs
3. Determine email types to send based on:
   - Registration type (individual/lodge)
   - Contact preferences per attendee
4. Generate and send appropriate emails
5. Log email status for tracking

## Design Requirements

### Branding Consistency
- **Colors**: Match application theme
  - Primary: Deep blue (#1e3a8a)
  - Secondary: Gold accents (#f59e0b)
  - Background: Light gray (#f9fafb)
- **Typography**: 
  - Headers: System font stack with serif fallback
  - Body: Clean sans-serif
- **Logo**: Masonic square and compass logo
- **Footer**: Include UGLNSW branding

### Email Layout Structure
```html
<EmailLayout>
  <Header>
    - Logo
    - Event/Function Name
    - Confirmation Number
  </Header>
  
  <Body>
    - Greeting
    - Main content (varies by email type)
    - Action buttons (Add to Calendar, View Tickets)
  </Body>
  
  <Footer>
    - Contact Information
    - Terms & Conditions link
    - Unsubscribe link (where applicable)
  </Footer>
</EmailLayout>
```

### Content Guidelines
- Professional tone appropriate for Masonic events
- Clear, concise information
- Prominent display of important details
- Mobile-responsive design
- Accessibility compliant (alt text, contrast ratios)

## Email Templates

### Individual Confirmation Template
```tsx
Subject: "Confirmation: {FunctionName} - Registration #{ConfirmationNumber}"

Content sections:
1. Welcome message
2. Registration summary box
3. Event schedule table
4. Payment receipt
5. QR code with instructions
6. What's next section
7. Contact support
```

### Lodge Confirmation Template
```tsx
Subject: "Lodge Registration Confirmed: {LodgeName} - {FunctionName}"

Content sections:
1. Lodge greeting
2. Registration overview
3. Member roster table
4. Package details
5. Financial summary
6. QR codes grid
7. Lodge coordinator notes
8. Important deadlines
```

### Attendee Ticket Template
```tsx
Subject: "Your Ticket: {EventName} - {FunctionName}"

Content sections:
1. Personal greeting
2. Ticket details card
3. Event information
4. QR code prominently displayed
5. Venue details with map link
6. What to expect
7. Contact information
```

### Primary Contact Tickets Template
```tsx
Subject: "Tickets for Your Group: {FunctionName}"

Content sections:
1. Group coordinator greeting
2. Attendee summary
3. Ticket distribution table
4. QR codes for all attendees
5. Coordinator responsibilities
6. Group meeting suggestions
7. Support contacts
```

## Data Requirements

### Required Data Points
```typescript
interface EmailData {
  registration: {
    id: string
    type: 'individuals' | 'lodges'
    confirmationNumber: string
    createdAt: Date
    totalAmount: number
    stripeFees: number
    applicationFees: number
  }
  
  function: {
    id: string
    name: string
    slug: string
    startDate: Date
    endDate: Date
    location: LocationDetails
  }
  
  events: EventDetails[]
  
  attendees: Array<{
    id: string
    firstName: string
    lastName: string
    email?: string
    contactPreference: 'directly' | 'primary_attendee' | 'booking_contact'
    attendeeType: 'mason' | 'guest'
    qrCodeUrl?: string
  }>
  
  tickets: Array<{
    id: string
    attendeeId: string
    eventId: string
    ticketType: string
    price: number
    qrCodeUrl?: string
  }>
  
  packages?: PackageDetails[]
  
  bookingContact?: ContactDetails
  primaryAttendee?: ContactDetails
  lodge?: LodgeDetails
}
```

## Integration Requirements

### Trigger Points
1. **Post-payment webhook**: Primary trigger after successful payment
2. **Manual resend**: API endpoint for resending emails
3. **Bulk operations**: Admin ability to resend for multiple registrations

### API Interface
```typescript
// Invoke from application
const { data, error } = await supabase.functions.invoke('send-confirmation-email', {
  body: { 
    registrationId: string,
    emailTypes?: EmailType[], // Optional: specific emails to send
    resend?: boolean // Flag for resend operations
  }
})
```

### Error Handling
- Retry logic for transient failures
- Fallback to queue for persistent failures
- Comprehensive error logging
- Admin notifications for critical failures

## Security & Compliance

### Data Security
- No sensitive payment information in emails
- QR codes contain only UUIDs
- Secure storage of email logs
- PII handling compliance

### Email Compliance
- CAN-SPAM compliance
- Privacy policy links
- Unsubscribe mechanism where required
- Data retention policies

## Performance Requirements
- Email generation: < 2 seconds
- Email sending: < 5 seconds total
- Support for concurrent processing
- Rate limiting compliance with email provider

## Success Metrics
- Email delivery rate > 98%
- Open rate tracking
- Click-through on QR codes
- Support ticket reduction
- User satisfaction scores

## Testing Requirements
- Unit tests for each template
- Integration tests for data fetching
- Visual regression tests for email rendering
- Load testing for bulk operations
- Cross-client email testing

## Future Enhancements
1. SMS notifications option
2. Calendar integration (.ics files)
3. Multi-language support
4. Email preference management
5. Advanced analytics dashboard