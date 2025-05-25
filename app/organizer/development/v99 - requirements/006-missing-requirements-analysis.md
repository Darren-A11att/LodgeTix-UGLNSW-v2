# Missing Requirements Analysis
## Components & Features Not Covered in Initial Documentation

---

## 1. Event Management Components

### 1.1 What We Have (Can Reuse)
- **EventCard** & **FeaturedEvent** components for display
- Event data structure with all necessary fields
- **EventAdminService** with CRUD operations
- Mock data system via Event Facade

### 1.2 What's Missing
- **Event Media Management**:
  ```typescript
  interface EventMediaManager {
    uploadBanner: (file: File) => Promise<string>
    uploadGalleryImages: (files: File[]) => Promise<string[]>
    generateThumbnails: () => void
    validateImageSizes: () => boolean
  }
  ```

- **Event Description Editor**:
  - Rich text editor for descriptions
  - Markdown support
  - Preview mode
  - Template snippets

- **Event Templates**:
  - Save successful events as templates
  - Template marketplace
  - Quick-start templates

---

## 2. Package Management System

### 2.1 Current State
- Basic PackageService exists with reservations
- Stripe Connect references present
- Real-time capacity updates

### 2.2 Missing Package Features
```typescript
interface EventPackage {
  id: string
  functionId: string
  name: string
  description: string
  childEventTickets: {
    eventId: string
    ticketTypeId: string
    quantity: number
  }[]
  price: number
  savings: number
  maxQuantity: number
  validFrom?: Date
  validUntil?: Date
}
```

**Required Components**:
- PackageBuilder UI
- Cross-event ticket bundling
- Dynamic pricing calculator
- Package availability rules

---

## 3. Customer Service Tools

### 3.1 Ticket Management
**Re-issue Tickets Component**:
```typescript
interface TicketReissueModal {
  registrationId: string
  attendeeId: string
  reasons: string[]
  generateNewQR: boolean
  sendEmail: boolean
  addNote: string
}
```

**Print Management**:
- Batch ticket printing
- Custom print layouts
- Badge generation
- Wristband integration

### 3.2 Financial Operations
**Refund Processing**:
```typescript
interface RefundManager {
  processRefund: (amount: number, reason: string) => Promise<void>
  partialRefund: (items: RefundItem[]) => Promise<void>
  cancelAndRefund: (registrationId: string) => Promise<void>
  refundHistory: RefundRecord[]
}
```

**Invoice Generation**:
- Tax invoices/receipts
- Custom invoice templates
- Bulk invoice generation
- GST handling

---

## 4. Email & Communication System

### 4.1 Email Template Management
```typescript
interface EmailTemplateManager {
  templates: {
    confirmation: EmailTemplate
    reminder: EmailTemplate
    announcement: EmailTemplate
    cancellation: EmailTemplate
    custom: EmailTemplate[]
  }
  variables: TemplateVariable[]
  preview: (template: EmailTemplate, data: any) => string
  schedule: (template: EmailTemplate, recipients: string[], sendAt: Date) => void
}
```

### 4.2 Bulk Communication
**Required Components**:
- Recipient selector (by event, ticket type, status)
- Email composer with rich text
- Template selection
- Merge tags support
- Send scheduling
- Delivery tracking

### 4.3 Resend Integration Enhancement
```typescript
// Existing: Basic send functionality
// Need to add:
interface ResendBulkOperations {
  createBroadcast: (params: BroadcastParams) => Promise<void>
  trackDelivery: (broadcastId: string) => DeliveryStats
  manageBounces: (emails: string[]) => void
  unsubscribeHandling: () => void
}
```

---

## 5. Attendee Management Interface

### 5.1 Components to Expose to Organizers
From Registration Wizard:
- **AttendeeCard** - For viewing/editing
- **AttendeeEditModal** - Full edit capabilities
- **AttendeeEventAccess** - Event assignment
- **DietaryRequirements** - Special needs tracking

### 5.2 New Components Needed
**Attendee Search & Filter**:
```typescript
interface AttendeeSearchPanel {
  filters: {
    name: string
    email: string
    lodge: string
    eventId: string
    ticketType: string
    dietaryRequirements: string[]
    status: RegistrationStatus
    dateRange: DateRange
  }
  sortBy: 'name' | 'registrationDate' | 'lodge'
  exportSelected: () => void
}
```

**Check-in Interface**:
```typescript
interface CheckInSystem {
  scanQR: () => Promise<Attendee>
  manualCheckIn: (searchTerm: string) => void
  checkInStats: {
    total: number
    checkedIn: number
    byEvent: Record<string, number>
  }
  printBadge: (attendee: Attendee) => void
}
```

---

## 6. Reports & Analytics

### 6.1 Financial Reports
- Daily sales reports
- Event P&L statements
- Tax reports (GST)
- Payout reconciliation
- Platform fee reports

### 6.2 Operational Reports
- Attendee manifests
- Dietary requirement summaries
- Lodge representation
- No-show tracking
- Capacity utilization

### 6.3 Export Formats
- CSV for spreadsheets
- PDF for printing
- Excel with formatting
- API endpoints for integrations

---

## 7. Integration Requirements

### 7.1 Stripe Connect Dashboard
**Custom Dashboard Components**:
```typescript
interface StripeConnectDashboard {
  accountStatus: ConnectAccountStatus
  balance: Balance
  payouts: Payout[]
  disputes: Dispute[]
  quickActions: {
    instantPayout: () => void
    updateBankAccount: () => void
    downloadReports: () => void
  }
}
```

### 7.2 File Storage
- Event images/banners
- Email attachments
- Generated reports
- Attendee documents

---

## 8. Implementation Priority Updates

### Phase 1 Additions:
1. Email template system setup
2. Basic refund processing
3. Invoice generation

### Phase 2 Additions:
1. Package builder
2. Bulk email system
3. Check-in interface

### Phase 3 Additions:
1. Advanced reporting
2. Customer service tools
3. Print management

---

## 9. Database Schema Additions

```sql
-- Email Templates
CREATE TABLE email_templates (
    id UUID PRIMARY KEY,
    organizer_id UUID REFERENCES users(id),
    name TEXT NOT NULL,
    subject TEXT,
    body_html TEXT,
    body_text TEXT,
    variables JSONB,
    template_type TEXT,
    created_at TIMESTAMP
);

-- Email Campaigns
CREATE TABLE email_campaigns (
    id UUID PRIMARY KEY,
    function_id UUID REFERENCES functions(id),
    template_id UUID REFERENCES email_templates(id),
    recipients JSONB,
    scheduled_for TIMESTAMP,
    sent_at TIMESTAMP,
    stats JSONB
);

-- Refunds
CREATE TABLE refunds (
    id UUID PRIMARY KEY,
    registration_id UUID REFERENCES registrations(id),
    amount DECIMAL,
    reason TEXT,
    stripe_refund_id TEXT,
    processed_by UUID REFERENCES users(id),
    processed_at TIMESTAMP
);

-- Event Packages
CREATE TABLE event_packages (
    id UUID PRIMARY KEY,
    function_id UUID REFERENCES functions(id),
    name TEXT,
    description TEXT,
    price DECIMAL,
    included_tickets JSONB,
    max_quantity INTEGER,
    valid_from TIMESTAMP,
    valid_until TIMESTAMP
);

-- Support Tickets
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY,
    registration_id UUID REFERENCES registrations(id),
    subject TEXT,
    description TEXT,
    status TEXT,
    priority TEXT,
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMP
);
```

---

## 10. UI Component Library Extensions

### 10.1 Data Tables
- Sortable attendee lists
- Filterable registration tables
- Exportable report tables
- Inline editing support

### 10.2 Financial Components
- Payment status badges
- Revenue charts
- Refund dialogs
- Invoice previews

### 10.3 Communication Components
- Email composer
- Template selector
- Recipient picker
- Delivery tracker

---

## 11. Missing API Endpoints

### 11.1 Customer Service
- `POST /api/registrations/:id/refund`
- `POST /api/tickets/:id/reissue`
- `POST /api/registrations/:id/modify`
- `GET /api/registrations/:id/history`

### 11.2 Bulk Operations
- `POST /api/functions/:id/email/send`
- `POST /api/functions/:id/attendees/export`
- `POST /api/functions/:id/tickets/print`
- `POST /api/functions/:id/reports/generate`

### 11.3 Templates
- `GET /api/templates/email`
- `POST /api/templates/email`
- `GET /api/templates/events`
- `POST /api/templates/functions/create-from/:id`

---

## 12. Security Considerations

### 12.1 Additional Permissions
- `can_process_refunds`
- `can_send_bulk_emails`
- `can_export_attendee_data`
- `can_modify_registrations`

### 12.2 Audit Requirements
- All refunds logged
- Email sends tracked
- Data exports recorded
- Registration modifications audited

---

## 13. Testing Requirements

### 13.1 Email Testing
- Template rendering
- Bulk send queuing
- Delivery tracking
- Bounce handling

### 13.2 Financial Testing
- Refund processing
- Partial refunds
- Invoice accuracy
- Tax calculations

### 13.3 Print Testing
- Ticket formatting
- Batch printing
- Badge generation
- Cross-browser compatibility