# Product Requirements Document: LodgeTix Registrations Feature

## Executive Summary

The LodgeTix Registrations feature is a comprehensive event registration system designed specifically for fraternal organizations, replacing manual signup processes with an automated, scalable digital solution. The system handles complex scenarios including masonic hierarchies, dietary requirements, partner registrations, and multi-tier pricing structures while maintaining the ceremonial protocols and traditions important to fraternal organizations.

## Core Components

### 1. Registration Wizard System

**Purpose**: Multi-step guided registration process that adapts to different registration types and requirements.

**Technical Functionality**:
- **Step-by-step navigation** with progress indicators and validation gates
- **Dynamic form rendering** based on registration type selection
- **Real-time validation** with contextual error messages
- **Auto-save functionality** with session recovery for incomplete registrations
- **Responsive design** optimized for mobile and desktop experiences

**Concrete Outcomes**:
- Reduces registration abandonment by 60-70% through guided process
- Eliminates data entry errors through real-time validation
- Provides consistent user experience across all registration types
- Enables partial completion and later resumption of registrations

### 2. Registration Type Management

**Purpose**: Handles three distinct registration pathways with specific business logic and requirements.

**Technical Functionality**:

#### Individual Registration
- **Attendee Management**: Create and manage individual attendees with masonic profiles
- **Partner/Guest Handling**: Add partners and guests with relationship tracking
- **Contact Preferences**: Flexible communication settings per attendee
- **Masonic Profile Integration**: Rank, lodge affiliation, and grand officer status tracking

#### Lodge Registration
- **Group Booking**: Register multiple members under single lodge entity
- **Table Management**: Allocate seating and table assignments
- **Lodge Hierarchy**: Respect masonic precedence and protocols
- **Bulk Operations**: Efficient handling of large member groups

#### Delegation Registration
- **Dual Mode**: Ticket-only purchases or full attendee registration
- **Booking Contact**: Designated contact for delegation coordination
- **Mixed Attendee Types**: Handle both mason and guest attendees
- **Delegation Metadata**: Track delegation size and composition

**Concrete Outcomes**:
- Supports 100% of fraternal organization registration scenarios
- Eliminates manual data entry for lodge secretaries
- Maintains organizational hierarchy and protocols
- Provides clear audit trail for all registration activities

### 3. Attendee Data Management

**Purpose**: Comprehensive attendee profile system with fraternal organization-specific data requirements.

**Technical Functionality**:
- **Masonic Profile System**: Titles, ranks, lodge affiliations, grand officer status
- **Contact Management**: Multi-channel contact preferences with validation
- **Dietary/Accessibility**: Special requirements tracking and reporting
- **Partner Relationships**: Spouse, partner, and guest relationship management
- **Data Validation**: Real-time validation against masonic directories

**Data Models**:
```typescript
interface MasonAttendee {
  id: string
  firstName: string
  lastName: string
  title: MasonicTitle // "Bro" | "W Bro" | "VW Bro" | "RW Bro" | "MW Bro"
  rank: MasonicRank // "EAF" | "FCF" | "MM" | "IM" | "GL"
  grandRank?: string
  grandOfficerStatus?: "Past" | "Present"
  presentGrandOfficerRole?: string
  grandLodge: string
  lodgeName: string
  lodgeNumber?: string
  mobile: string
  email: string
  contactPreference: ContactPreference
  dietaryRequirements?: string
  specialNeeds?: string
  hasPartner: boolean
  partner?: PartnerAttendee
}

interface PartnerAttendee {
  id: string
  firstName: string
  lastName: string
  title: string
  relationship: "Wife" | "Partner" | "Fiancée" | "Husband" | "Fiancé"
  contactPreference: ContactPreference
  mobile?: string
  email?: string
  dietaryRequirements?: string
  specialNeeds?: string
  relatedAttendeeId: string
}

interface GuestAttendee {
  id: string
  firstName: string
  lastName: string
  title: string
  contactPreference: ContactPreference
  mobile?: string
  email?: string
  dietaryRequirements?: string
  specialNeeds?: string
  relatedAttendeeId?: string
}
```

**Concrete Outcomes**:
- Maintains complete attendee profiles with fraternal context
- Enables targeted communication based on preferences
- Supports event planning with dietary and accessibility requirements
- Provides membership verification and protocol adherence

### 4. Payment Processing Integration

**Purpose**: Secure, compliant payment processing with transparent fee handling and multi-account support.

**Technical Functionality**:
- **Square Integration**: PCI-compliant payment processing with Square Web Payments SDK
- **Fee Transparency**: Clear breakdown of event costs, processing fees, and taxes
- **Multi-Account Support**: Separate connected accounts for different organizations
- **Payment Methods**: Credit cards, debit cards, and alternative payment methods
- **Refund Management**: Automated refund processing with event-specific policies

**Payment Flow**:
1. **Price Calculation**: Dynamic pricing based on package selection and attendee count
2. **Fee Calculation**: Transparent Square processing fee calculation
3. **Payment Intent**: Secure payment intent creation with metadata
4. **Processing**: Real-time payment processing with error handling
5. **Confirmation**: Automated confirmation and receipt generation

**Concrete Outcomes**:
- 99.9% payment success rate with comprehensive error handling
- Full PCI compliance with no stored payment data
- Transparent fee structure builds user trust
- Automated reconciliation reduces administrative overhead

### 5. Confirmation and Communications System

**Purpose**: Automated confirmation generation and multi-channel communication system.

**Technical Functionality**:
- **Confirmation Numbers**: Unique identifiers with registration type prefixes (IND-, LDG-, DEL-)
- **Email Templates**: Branded, responsive email templates with QR codes
- **PDF Generation**: Printable confirmation documents with event details
- **QR Code Integration**: Unique QR codes for check-in and validation
- **Communication Preferences**: Respect individual communication preferences

**Confirmation Flow**:
1. **Payment Success**: Webhook triggers confirmation generation
2. **Confirmation Number**: Unique identifier generated with type prefix
3. **Email Delivery**: Branded confirmation email with PDF attachment
4. **QR Code Generation**: Unique QR codes for each attendee
5. **Data Sync**: Update all systems with confirmation status

**Concrete Outcomes**:
- Immediate confirmation reduces customer service inquiries
- QR codes enable efficient event check-in process
- Professional branded communications enhance organization image
- Automated process eliminates manual administrative tasks

## User Stories & Acceptance Criteria

### Individual Registration User Stories

#### Story 1: Mason Individual Registration
**As a** Mason member  
**I want** to register myself and my partner for a lodge function  
**So that** we can attend the event with proper protocols observed  

**Acceptance Criteria**:
- **Given** I am a Mason member with valid credentials
- **When** I select "Individual Registration" and enter my masonic details
- **Then** The system validates my lodge affiliation and displays appropriate pricing
- **And** I can add my partner with relationship details
- **And** I receive confirmation with proper masonic protocols acknowledged

#### Story 2: Guest Registration
**As a** non-Mason guest  
**I want** to register for a public lodge function  
**So that** I can attend as a guest of a Mason member  

**Acceptance Criteria**:
- **Given** I am invited by a Mason member
- **When** I select guest registration and provide my sponsor's details
- **Then** The system validates the sponsor's membership
- **And** I can complete registration with guest-specific pricing
- **And** I receive confirmation with guest protocols outlined

### Lodge Registration User Stories

#### Story 3: Lodge Group Registration
**As a** Lodge Secretary  
**I want** to register multiple lodge members for a function  
**So that** we can secure group seating and manage member attendance  

**Acceptance Criteria**:
- **Given** I am authorized to register for my lodge
- **When** I select "Lodge Registration" and enter lodge details
- **Then** The system validates lodge credentials and displays group pricing
- **And** I can specify table count and seating preferences
- **And** I can choose to provide attendee details now or later
- **And** I receive confirmation with lodge-specific protocols

#### Story 4: Lodge Attendee Management
**As a** Lodge Secretary  
**I want** to add specific attendee details to my lodge registration  
**So that** I can ensure proper seating and dietary accommodations  

**Acceptance Criteria**:
- **Given** I have an existing lodge registration
- **When** I access the attendee management interface
- **Then** I can add member details with masonic profiles
- **And** I can specify dietary requirements and special needs
- **And** The system validates masonic titles and ranks
- **And** Changes are reflected in the confirmation and catering reports

### Delegation Registration User Stories

#### Story 5: Delegation Booking Contact
**As a** Delegation Booking Contact  
**I want** to register a delegation from my grand lodge  
**So that** we can attend as an official representation  

**Acceptance Criteria**:
- **Given** I am authorized to book for my grand lodge
- **When** I select "Delegation Registration" and provide grand lodge details
- **Then** The system validates grand lodge credentials
- **And** I can choose between ticket-only or full registration
- **And** I can specify delegation size and composition
- **And** I receive confirmation with delegation protocols

## Data Models

### Core Registration Data

```typescript
interface Registration {
  id: string                    // Unique registration identifier
  functionId: string           // Associated function UUID
  registrationType: "individuals" | "lodge" | "delegation"
  status: "pending" | "confirmed" | "cancelled"
  paymentStatus: "pending" | "completed" | "failed" | "refunded"
  totalAmount: number          // Total amount paid
  confirmationNumber: string   // Unique confirmation identifier
  createdAt: string           // Registration creation timestamp
  updatedAt: string           // Last modification timestamp
  contactInfo: ContactInfo    // Primary contact information
  metadata: RegistrationMetadata // Type-specific metadata
}

interface ContactInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  preferredContact: "email" | "phone"
  address?: AddressInfo
}

interface AddressInfo {
  street: string
  city: string
  state: string
  postcode: string
  country: string
}

interface RegistrationMetadata {
  functionName: string
  functionSlug: string
  selectedEvents: string[]     // Event IDs within function
  packages: PackageSelection[] // Selected packages
  specialRequirements?: string
  organizationId: string       // Associated organization
  organizationName: string
}
```

### Package and Pricing Data

```typescript
interface Package {
  id: string
  name: string
  description: string
  price: number
  includedEvents: string[]     // Event IDs included in package
  maxAttendees?: number        // Maximum attendees per package
  restrictions?: string[]      // Eligibility restrictions
  isActive: boolean
}

interface PackageSelection {
  packageId: string
  quantity: number
  attendeeIds: string[]        // Attendees assigned to this package
  unitPrice: number           // Price at time of selection
  totalPrice: number          // Total for this selection
}
```

### Payment and Transaction Data

```typescript
interface PaymentTransaction {
  id: string
  registrationId: string
  amount: number
  stripeFee: number
  netAmount: number           // Amount after fees
  paymentMethod: string
  stripePaymentIntentId: string
  status: "pending" | "succeeded" | "failed"
  processedAt?: string
  refundedAt?: string
  refundAmount?: number
}
```

## Integration Points

### 1. Supabase Database Integration

**Purpose**: Persistent data storage with real-time updates and row-level security.

**Technical Implementation**:
- **Database Schema**: Comprehensive relational schema with proper foreign keys
- **RLS Policies**: Row-level security for multi-tenant data access
- **Real-time Updates**: Live updates for availability and booking status
- **Audit Logging**: Complete audit trail for all registration changes

**Integration Details**:
- **Registration Storage**: Complete registration data with relationships
- **Attendee Profiles**: Masonic profiles with validation
- **Payment Records**: Transaction history and reconciliation
- **Confirmation Tracking**: Status updates and delivery confirmation

### 2. Square Payment Processing

**Purpose**: Secure, PCI-compliant payment processing with transparent fees.

**Technical Implementation**:
- **Square Web Payments SDK**: Client-side payment form with tokenization
- **Connected Accounts**: Multi-organization payment routing
- **Webhook Processing**: Real-time payment status updates
- **Refund Management**: Automated refund processing

**Integration Details**:
- **Payment Intent Creation**: Secure payment intent with metadata
- **Fee Calculation**: Transparent processing fee calculation
- **Status Webhooks**: Real-time payment confirmation
- **Reconciliation**: Automated financial reconciliation

### 3. Email Delivery System

**Purpose**: Automated email communications with branded templates and attachments.

**Technical Implementation**:
- **Supabase Edge Functions**: Serverless email processing
- **Template Engine**: Dynamic email template generation
- **Attachment Generation**: PDF confirmations and QR codes
- **Delivery Tracking**: Email delivery status and engagement

**Integration Details**:
- **Confirmation Emails**: Immediate post-payment confirmation
- **Reminder Emails**: Pre-event reminders and updates
- **Status Updates**: Registration and payment status changes
- **Custom Communications**: Event-specific announcements

### 4. PDF and QR Code Generation

**Purpose**: Printable confirmations and digital check-in capabilities.

**Technical Implementation**:
- **PDF Generation**: Server-side PDF creation with branding
- **QR Code Creation**: Unique QR codes for each attendee
- **Template System**: Customizable PDF templates
- **Digital Delivery**: Secure PDF delivery and storage

**Integration Details**:
- **Confirmation PDFs**: Detailed event confirmations
- **QR Code Integration**: Check-in and validation codes
- **Print Optimization**: Print-friendly formatting
- **Digital Storage**: Secure PDF storage and retrieval

## Business Rules

### 1. Registration Validation Rules

**Masonic Profile Validation**:
- Masonic titles must match rank progression (EAF → FCF → MM → IM → GL)
- Grand officer status requires appropriate rank verification
- Lodge affiliation must be validated against grand lodge directories
- Contact preferences must be respected for all communications

**Attendee Relationship Rules**:
- Partners must be linked to primary attendees
- Guests must have identified sponsors
- Lodge members must be associated with registered lodge
- Delegation members must be from the same grand lodge jurisdiction

**Payment and Pricing Rules**:
- Pricing is locked at registration time, not payment time
- Refunds follow event-specific policies and timelines
- Processing fees are calculated transparently
- Group discounts apply based on registration type and volume

### 2. Capacity and Availability Rules

**Event Capacity Management**:
- Real-time availability tracking prevents overbooking
- Reserved tickets have 30-minute hold period
- Waitlist functionality for sold-out events
- Package availability based on included event capacity

**Seating and Table Management**:
- Lodge registrations can reserve complete tables
- Masonic protocol seating preferences honored
- Dietary requirements tracked for catering
- Accessibility requirements noted for venue preparation

### 3. Communication and Confirmation Rules

**Confirmation Generation**:
- Confirmation numbers generated only after successful payment
- Type-specific prefixes: IND- (Individual), LDG- (Lodge), DEL- (Delegation)
- QR codes unique per attendee for security
- PDF confirmations include all relevant event information

**Communication Preferences**:
- Individual contact preferences override group settings
- "Provide later" option defers communication until attendee details added
- Primary attendee contact used for payment and confirmation
- Backup contact methods available for critical communications

## Success Metrics

### 1. Registration Completion Metrics

**Conversion Rates**:
- **Registration Completion Rate**: > 85% of started registrations completed
- **Payment Success Rate**: > 99% of attempted payments successful
- **Form Abandonment Reduction**: < 15% abandonment rate per step
- **Mobile Completion Rate**: > 80% of mobile registrations completed

**Performance Metrics**:
- **Page Load Time**: < 2 seconds for all registration pages
- **Form Response Time**: < 500ms for validation and auto-save
- **Payment Processing Time**: < 30 seconds for payment completion
- **Confirmation Generation**: < 5 minutes for confirmation delivery

### 2. User Experience Metrics

**Satisfaction Indicators**:
- **User Satisfaction Score**: > 4.5/5 for registration experience
- **Error Rate**: < 2% of registrations experience technical errors
- **Support Tickets**: < 5% of registrations require support assistance
- **Repeat Usage**: > 90% of organizations use system for multiple events

**Administrative Efficiency**:
- **Manual Processing Reduction**: > 95% reduction in manual data entry
- **Support Inquiry Reduction**: > 80% reduction in pre-event inquiries
- **Reconciliation Time**: < 1 hour for post-event financial reconciliation
- **Report Generation**: < 5 minutes for comprehensive registration reports

### 3. Business Impact Metrics

**Revenue and Growth**:
- **Revenue Processing**: 100% of event revenue processed through system
- **Fee Transparency**: 0 fee-related disputes or chargebacks
- **Organization Adoption**: > 95% of target organizations using system
- **Event Capacity**: > 90% average event capacity utilization

**Operational Excellence**:
- **System Uptime**: > 99.9% availability during registration periods
- **Data Accuracy**: > 99.5% accuracy in attendee data capture
- **Compliance**: 100% PCI compliance with zero security incidents
- **Scalability**: Support for 10,000+ concurrent registrations

## Risk Assessment and Mitigation

### 1. Technical Risks

**Payment Processing Risks**:
- **Risk**: Payment failures or processing delays
- **Mitigation**: Redundant payment processing, comprehensive error handling, real-time monitoring
- **Contingency**: Manual payment processing backup procedures

**Data Security Risks**:
- **Risk**: Unauthorized access to personal or financial data
- **Mitigation**: Encryption at rest and in transit, regular security audits, compliance monitoring
- **Contingency**: Incident response plan with stakeholder notification

**System Availability Risks**:
- **Risk**: System downtime during peak registration periods
- **Mitigation**: Load balancing, auto-scaling, comprehensive monitoring
- **Contingency**: Fallback registration process and communication plan

### 2. Business Risks

**User Adoption Risks**:
- **Risk**: Resistance to digital registration from traditional organizations
- **Mitigation**: Comprehensive training, gradual rollout, dedicated support
- **Contingency**: Hybrid manual/digital registration options

**Compliance Risks**:
- **Risk**: Regulatory compliance issues with payment processing
- **Mitigation**: Regular compliance audits, legal review, industry best practices
- **Contingency**: Immediate compliance remediation procedures

**Scalability Risks**:
- **Risk**: System performance degradation with increased usage
- **Mitigation**: Performance testing, capacity planning, infrastructure scaling
- **Contingency**: Load shedding and priority queuing systems

## Future Enhancements

### 1. Advanced Features

**Mobile App Integration**:
- Native mobile app with offline registration capability
- Push notifications for registration updates and reminders
- Mobile-optimized payment processing
- QR code scanning for event check-in

**Enhanced Reporting**:
- Real-time analytics dashboard for event organizers
- Automated financial reporting and reconciliation
- Attendee engagement analytics and insights
- Predictive analytics for event planning

**Integration Expansion**:
- CRM integration for member management
- Accounting system integration for financial management
- Calendar integration for event scheduling
- Social media integration for event promotion

### 2. Personalization and AI

**Intelligent Recommendations**:
- Package recommendations based on registration history
- Seating preferences based on past events
- Dietary recommendation learning
- Personalized communication timing

**Automated Assistance**:
- Chatbot integration for registration support
- Automated form completion for returning users
- Intelligent error detection and correction
- Proactive issue resolution

### 3. Enhanced User Experience

**Advanced Customization**:
- Organization-specific branding and themes
- Custom registration fields and workflows
- Personalized confirmation templates
- Flexible payment options and installments

**Accessibility Improvements**:
- Enhanced screen reader compatibility
- Keyboard navigation optimization
- Multi-language support
- Voice-activated registration options

---

This comprehensive PRD provides a complete specification for the LodgeTix Registrations feature, covering all technical requirements, user stories, data models, and business rules necessary for successful implementation and operation.