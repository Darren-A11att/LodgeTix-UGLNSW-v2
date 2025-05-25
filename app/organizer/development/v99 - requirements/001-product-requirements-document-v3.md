# Product Requirements Document: Organizer Portal (v3)
## LodgeTix-UGLNSW-v2 - Complete Feature Set

### Document Information
- **Version**: 3.0
- **Date**: January 2025
- **Author**: Development Team
- **Status**: Final - Includes all identified requirements

---

## 1. Executive Summary

The Organizer Portal is a comprehensive event management system for LodgeTix that enables event organizers to **host functions** (parent events) with multiple child events, manage attendee registrations, process payments through Stripe Connect, provide customer service tools, and monitor event performance. This system supports the unique structure of Masonic events where a single function encompasses multiple ceremonies and activities.

## 2. Business Context

### 2.1 Problem Statement
Masonic events are typically multi-event functions requiring:
- **Hierarchical Event Structure**: Parent events containing multiple child events
- **Distributed Payment Processing**: Each organizer manages their own payments
- **Customer Service Tools**: Re-issue tickets, process refunds, modify registrations
- **Communication Management**: Bulk emails, templates, automated reminders
- **Operational Support**: Print management, invoicing, check-in systems

### 2.2 Goals
- Enable organizers to "Host a Function" with complete event lifecycle management
- Integrate Stripe Connect for distributed payment processing
- Provide comprehensive customer service capabilities
- Support sophisticated email communication and template management
- Enable efficient operations with printing, reporting, and analytics

---

## 3. Event Structure & Components

### 3.1 Hierarchy
```
Function (Parent Event)
├── Child Event 1
│   ├── Ticket Type A
│   └── Ticket Type B
├── Child Event 2
│   ├── Ticket Type C
│   └── Ticket Type D
├── Event Packages (Cross-event bundles)
│   └── Package includes tickets from multiple child events
└── Registration
    ├── Attendee 1
    │   ├── Ticket to Child Event 1
    │   └── Ticket to Child Event 2
    └── Attendee 2
        └── Package (includes multiple event tickets)
```

### 3.2 Event Components
- **Event Details**: Title, description (rich text), images, location
- **Event Media**: Banner images, gallery, documents
- **Event Settings**: Capacity, eligibility rules, dress code
- **Event Templates**: Reusable event structures

---

## 4. Functional Requirements (MoSCoW)

### 4.1 MUST Have

#### 4.1.1 Authentication & Stripe Connect
- [x] Secure login using existing Supabase Auth
- [x] Stripe Connect Express onboarding flow
- [x] Bank account and payout management
- [ ] Stripe dashboard integration
- [ ] Financial reporting with platform fees

#### 4.1.2 Sidebar Layout & Navigation
- [x] Fixed sidebar (desktop) / Mobile slide-out
- [x] Function quick-access list
- [ ] Search functionality
- [ ] Notification center
- [ ] Stripe status indicator

#### 4.1.3 Function & Event Management
- [ ] "Host a Function" wizard with multi-step creation
- [ ] Event media upload and management
- [ ] Rich text editor for descriptions
- [ ] Event templates and duplication
- [ ] Child event CRUD (create, update, close, archive)
- [ ] Cross-event package builder

#### 4.1.4 Customer Service Tools
- [ ] **Ticket Re-issue System**
  - Generate new QR codes
  - Email updated tickets
  - Track re-issue reasons
- [ ] **Refund Processing**
  - Full and partial refunds
  - Stripe Connect integration
  - Refund reason tracking
- [ ] **Registration Modifications**
  - Edit attendee details
  - Transfer tickets between attendees
  - Change event selections
- [ ] **Support Dashboard**
  - Registration search
  - Detailed registration view
  - Action history/audit trail

#### 4.1.5 Email & Communication
- [ ] **Email Template Manager**
  - Create/edit templates
  - Rich text editor
  - Variable substitution
  - Template categories
- [ ] **Bulk Email System**
  - Recipient filtering
  - Schedule sending
  - Track delivery/opens
  - Resend integration
- [ ] **Automated Emails**
  - Confirmation emails
  - Reminder sequences
  - Event updates

#### 4.1.6 Print Management
- [ ] **Ticket Printing**
  - Batch print tickets
  - Custom layouts
  - QR code inclusion
- [ ] **Badge Generation**
  - Name badges for check-in
  - Role/access indicators
- [ ] **Attendee Manifests**
  - Formatted lists
  - Dietary requirements
  - Check-in sheets

#### 4.1.7 Financial Operations
- [ ] **Invoice Generation**
  - Tax invoices/receipts
  - GST handling
  - Custom templates
  - Bulk generation
- [ ] **Financial Reports**
  - Revenue by event
  - Platform fee tracking
  - Payout reconciliation
  - Export formats

### 4.2 SHOULD Have

#### 4.2.1 Advanced Event Features
- [ ] Event series management
- [ ] Venue database and management
- [ ] Seating chart integration
- [ ] Capacity optimization tools
- [ ] Dynamic pricing rules

#### 4.2.2 Enhanced Customer Service
- [ ] In-app messaging system
- [ ] Support ticket integration
- [ ] Customer history view
- [ ] Bulk operations (refunds, modifications)
- [ ] Automated issue resolution

#### 4.2.3 Advanced Email Features
- [ ] A/B testing for templates
- [ ] Personalization engine
- [ ] Email analytics dashboard
- [ ] Unsubscribe management
- [ ] Bounce handling

#### 4.2.4 Check-in System
- [ ] QR code scanner interface
- [ ] Manual search check-in
- [ ] Real-time attendance tracking
- [ ] Badge printing on check-in
- [ ] Offline mode support

### 4.3 COULD Have

#### 4.3.1 Analytics & Insights
- [ ] Conversion funnel analysis
- [ ] Attendee demographics
- [ ] Revenue optimization AI
- [ ] Predictive attendance modeling
- [ ] Custom report builder

#### 4.3.2 Integration Features
- [ ] Calendar sync (Google, Outlook)
- [ ] Accounting software export
- [ ] SMS notifications
- [ ] Social media integration
- [ ] Lodge management systems

#### 4.3.3 Advanced Operations
- [ ] Mobile app for organizers
- [ ] Kiosk mode for self-check-in
- [ ] RFID/NFC support
- [ ] Live streaming integration
- [ ] Virtual event support

---

## 5. Component Reuse Strategy

### 5.1 From Registration System
- **Forms**: All form components (BasicInfo, ContactInfo, etc.)
- **Validation**: Existing validation logic and patterns
- **Components**: AttendeeCard, OrderSummary, PaymentStatus
- **Services**: Email service, PDF generation, QR code generation

### 5.2 New Components Required
- **OrganizerLayout**: Sidebar navigation system
- **EventCreationWizard**: Multi-step function creation
- **CustomerServiceDashboard**: Support interface
- **EmailTemplateManager**: Template CRUD and editor
- **BulkEmailComposer**: Campaign creation
- **RefundModal**: Refund processing interface
- **PrintManager**: Batch print operations

---

## 6. Technical Requirements

### 6.1 Database Schema Additions
```sql
-- Email management
CREATE TABLE email_templates (...);
CREATE TABLE email_campaigns (...);
CREATE TABLE template_usage (...);

-- Customer service
CREATE TABLE refunds (...);
CREATE TABLE ticket_reissues (...);
CREATE TABLE support_tickets (...);
CREATE TABLE audit_logs (...);

-- Event enhancements
CREATE TABLE event_packages (...);
CREATE TABLE event_media (...);
CREATE TABLE event_templates (...);
```

### 6.2 API Endpoints
- **Customer Service**: `/api/registrations/:id/refund`, `/api/tickets/:id/reissue`
- **Email**: `/api/functions/:id/email/send`, `/api/templates/email`
- **Print**: `/api/functions/:id/print/tickets`, `/api/functions/:id/print/badges`
- **Reports**: `/api/functions/:id/reports/generate`

### 6.3 External Integrations
- **Stripe Connect**: OAuth, webhooks, dashboard API
- **Resend**: Email sending, tracking, templates
- **File Storage**: Supabase Storage for images/documents
- **PDF Generation**: Enhanced for invoices, manifests

---

## 7. User Experience Requirements

### 7.1 Dashboard Views
- **Main Dashboard**: Function overview, quick stats, recent activity
- **Function Dashboard**: Child events, registrations, revenue
- **Support Dashboard**: Recent issues, pending actions
- **Email Dashboard**: Campaign performance, template usage

### 7.2 Mobile Considerations
- Responsive sidebar navigation
- Touch-optimized interfaces
- Mobile-friendly email composer
- Simplified check-in interface

### 7.3 Performance Requirements
- Batch operations for bulk actions
- Pagination for large datasets
- Real-time updates via websockets
- Offline support for critical features

---

## 8. Security & Compliance

### 8.1 Permission Levels
- `can_process_refunds`
- `can_send_bulk_emails`
- `can_export_attendee_data`
- `can_modify_registrations`
- `can_access_financial_reports`

### 8.2 Audit Requirements
- All financial transactions logged
- Email sends tracked with recipients
- Data exports recorded
- Registration modifications tracked
- Login/access logging

### 8.3 Data Protection
- PII encryption at rest
- Secure file uploads
- GDPR compliance for emails
- Data retention policies
- Access control lists

---

## 9. Success Metrics

### 9.1 Operational Efficiency
- Time to resolve customer issues < 5 minutes
- Email template reuse rate > 80%
- Bulk operation success rate > 99%
- Check-in processing time < 10 seconds

### 9.2 Financial Accuracy
- Invoice generation accuracy 100%
- Refund processing success > 99.9%
- Financial report accuracy 100%
- Platform fee collection > 99%

### 9.3 User Satisfaction
- Organizer NPS > 8/10
- Support ticket resolution < 24 hours
- Email delivery rate > 98%
- Feature adoption > 70%

---

## 10. Implementation Phases

### Phase 1: Foundation (Weeks 1-4)
- Sidebar layout and navigation
- Stripe Connect integration
- Basic function creation
- Core database schema

### Phase 2: Event Management (Weeks 5-8)
- Event Creation Wizard
- Child event management
- Package builder
- Media management

### Phase 3: Customer Service (Weeks 9-12)
- Ticket re-issue system
- Refund processing
- Registration modifications
- Support dashboard

### Phase 4: Communication (Weeks 13-16)
- Email template manager
- Bulk email system
- Automated emails
- Delivery tracking

### Phase 5: Operations (Weeks 17-20)
- Print management
- Invoice generation
- Check-in system
- Reporting suite

### Phase 6: Polish & Launch (Weeks 21-24)
- Performance optimization
- Security audit
- User training
- Phased rollout

---

## 11. Risk Mitigation

### 11.1 Technical Risks
- **Email Deliverability**: Use established provider (Resend), monitor reputation
- **Stripe Complexity**: Thorough testing, sandbox environment, support escalation
- **Performance at Scale**: Caching, pagination, database optimization
- **Data Loss**: Backups, audit trails, soft deletes

### 11.2 Business Risks
- **Feature Overload**: Phased rollout, user training, intuitive UI
- **Adoption Resistance**: Clear benefits, migration support, hands-on training
- **Support Burden**: Comprehensive docs, video tutorials, chat support

---

## Appendices

### Appendix A: Component Specifications
- See 007-customer-service-components.md
- See 008-email-template-system.md

### Appendix B: Missing Requirements Analysis
- See 006-missing-requirements-analysis.md

### Appendix C: API Specifications
- See 003-api-specifications-v2.md

### Appendix D: Technical Architecture
- See 004-technical-architecture-v2.md