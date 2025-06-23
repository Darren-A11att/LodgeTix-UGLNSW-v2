# Product Requirements Document: Sponsorship Management System

## Executive Summary

The Sponsorship Management System transforms LodgeTix from a ticketing-only platform into a comprehensive event revenue management solution. This feature enables function organisers to systematically manage sponsorship packages, track revenue beyond ticket sales, automate invoice generation, and provide sponsors with professional ROI reporting - replacing manual spreadsheet processes with an integrated digital solution.

### Business Impact
- **Revenue Diversification**: Creates systematic sponsorship revenue streams beyond ticket sales
- **Professional Presentation**: Replaces spreadsheets with branded sponsorship packages and automated workflows
- **ROI Transparency**: Provides sponsors with detailed analytics and performance tracking
- **Operational Efficiency**: Automates invoice generation, payment tracking, and sponsor management

---

## Core Components

### 1. Sponsorship Package Builder
**Technical Function**: Dynamic package creation system with tiered benefits and pricing
**Concrete Outcomes**: Function organisers can create multiple sponsorship tiers (Grand, Major, Gold, Silver, Bronze) with customised benefits, pricing, and availability limits

**How It Works**:
- Template-based package creation with drag-and-drop benefit assignment
- Integration with existing function/event data for automatic context population
- Real-time availability tracking and automatic tier closure when limits reached
- Package comparison views for sponsor decision-making

**Data Storage**: 
- Extends existing `website.sponsors` table with package definitions
- Links to function_id for multi-event sponsorship tracking
- JSONB fields for flexible benefit configurations

### 2. Sponsor Portal & Application System
**Technical Function**: Self-service sponsor onboarding with application review workflow
**Concrete Outcomes**: Potential sponsors can browse packages, submit applications with company details, and track approval status while organisers review and approve applications

**How It Works**:
- Public-facing sponsor package catalogue with tier comparisons
- Application forms with company verification and documentation upload
- Organiser dashboard for application review and approval/rejection
- Automated email notifications for status changes
- Integration with existing Supabase auth for secure sponsor access

**Data Models**:
- `sponsorship_applications` table with application status workflow
- `sponsor_companies` table for verified sponsor organisation data
- Integration with existing `customers` table where `customer_type = 'sponsor'`

### 3. Contract & Invoice Management
**Technical Function**: Automated contract generation and Square-integrated invoice processing
**Concrete Outcomes**: Approved sponsors receive professional contracts with payment terms, automated invoice generation, and integrated payment tracking through existing Square infrastructure

**How It Works**:
- Contract template system with legal terms and sponsor-specific details
- Integration with existing Square payment processing for invoice payments
- Automated payment reminder system with configurable schedules
- Payment status tracking with webhook integration for real-time updates
- PDF generation service for contracts and invoices using existing PDF infrastructure

**Integration Points**:
- Leverages existing `unified-square-payment-service.ts` for payment processing
- Uses existing PDF service for document generation
- Integrates with email service for automated communications
- Links to existing webhook system for payment confirmation

### 4. Sponsor ROI Dashboard & Analytics
**Technical Function**: Real-time analytics dashboard measuring sponsor exposure and engagement
**Concrete Outcomes**: Sponsors receive branded dashboard showing logo impressions, website traffic attribution, social media mentions, and detailed ROI metrics with downloadable reports

**How It Works**:
- Integration with website analytics to track sponsor logo impressions
- Social media monitoring for sponsor mention tracking
- Custom UTM parameter generation for traffic attribution
- Automated monthly reporting with branded PDF generation
- Real-time dashboard with sponsor-specific authentication

**Technical Implementation**:
- Analytics service integration with existing website infrastructure
- Custom tracking pixels for impression measurement
- API integrations for social media monitoring
- Scheduled report generation using existing edge functions
- Branded PDF reports using existing PDF service

### 5. Revenue Tracking & Financial Reporting
**Technical Function**: Comprehensive financial dashboard integrating sponsorship revenue with ticket sales
**Concrete Outcomes**: Function organisers see unified revenue dashboard showing ticket sales, sponsorship income, pending payments, and financial projections with automated accounting integration

**How It Works**:
- Real-time revenue aggregation from multiple sources (tickets + sponsorships)
- Financial forecasting based on committed sponsorships and ticket sales trends
- Integration with existing Square payment processing for unified financial view
- Automated accounting entries for sponsorship revenue recognition
- Customizable financial reports for stakeholder communication

**Data Integration**:
- Aggregates data from existing ticket sales tracking
- Integrates with sponsorship payment processing
- Uses existing Square webhook infrastructure for payment updates
- Extends existing financial reporting with sponsorship metrics

---

## User Stories & Acceptance Criteria

### Epic 1: Sponsorship Package Management

#### Story 1.1: Create Sponsorship Packages
**As a** function organiser
**I want** to create tiered sponsorship packages with customised benefits and pricing
**So that** I can offer structured sponsorship opportunities that align with my event's needs

**Acceptance Criteria**:
- **Given** I am logged in as a function organiser
- **When** I navigate to the sponsorship management section
- **Then** I can create new sponsorship packages with tier selection (Grand, Major, Gold, Silver, Bronze)
- **And** I can define custom benefits for each tier using a drag-and-drop interface
- **And** I can set pricing, availability limits, and application deadlines
- **And** I can preview how packages appear to potential sponsors
- **And** packages are automatically linked to my function ID

#### Story 1.2: Manage Package Availability
**As a** function organiser
**I want** to automatically control package availability and tier closures
**So that** I maintain exclusivity and prevent overselling sponsorship opportunities

**Acceptance Criteria**:
- **Given** I have set availability limits for sponsorship tiers
- **When** a tier reaches its limit through approved applications
- **Then** that tier is automatically marked as "sold out" and hidden from new applications
- **And** I receive a notification when tiers are approaching capacity
- **And** I can manually close or reopen tiers regardless of availability
- **And** sponsors see real-time availability status when browsing packages

### Epic 2: Sponsor Application & Onboarding

#### Story 2.1: Browse Available Sponsorship Packages
**As a** potential sponsor
**I want** to browse available sponsorship packages with detailed benefit comparisons
**So that** I can make an informed decision about which tier meets my marketing objectives

**Acceptance Criteria**:
- **Given** I visit a function's sponsorship page
- **When** I view available packages
- **Then** I see a clear comparison of all available tiers with benefits, pricing, and availability
- **And** I can filter packages by price range or benefit type
- **And** I see example placements of logo positioning and marketing opportunities
- **And** I can access detailed package descriptions and terms
- **And** packages that are sold out are clearly marked but remain visible for reference

#### Story 2.2: Submit Sponsorship Application
**As a** potential sponsor
**I want** to submit a comprehensive application with company details and preferences
**So that** organisers can evaluate my suitability and process my sponsorship request

**Acceptance Criteria**:
- **Given** I have selected a sponsorship package
- **When** I complete the application form
- **Then** I provide company information, contact details, and marketing objectives
- **And** I can upload required documents (logos, company information, marketing materials)
- **And** I can specify particular requirements or customisation requests
- **And** I receive immediate confirmation of my application submission
- **And** I can track my application status through a dedicated portal
- **And** my application data is securely stored and linked to the selected package

### Epic 3: Contract & Payment Processing

#### Story 3.1: Generate Sponsorship Contracts
**As a** function organiser
**I want** to automatically generate professional contracts for approved sponsors
**So that** I can provide clear terms and legal protection while maintaining professional presentation

**Acceptance Criteria**:
- **Given** I have approved a sponsorship application
- **When** I initiate contract generation
- **Then** a professional contract is created with sponsor details, package benefits, and payment terms
- **And** the contract includes all legal protections and terms specific to the sponsorship tier
- **And** I can customise contract terms before finalising
- **And** the contract is automatically sent to the sponsor for electronic signature
- **And** contract status is tracked through the management dashboard
- **And** signed contracts are securely stored and accessible to both parties

#### Story 3.2: Process Sponsorship Payments
**As a** sponsor
**I want** to receive automated invoices and pay securely through the platform
**So that** I can complete my sponsorship commitment with professional payment processing

**Acceptance Criteria**:
- **Given** I have signed a sponsorship contract
- **When** payment terms trigger invoice generation
- **Then** I receive a professional invoice with clear payment instructions
- **And** I can pay securely through the platform using existing Square integration
- **And** I receive immediate payment confirmation and receipt
- **And** my payment status is updated in real-time across all systems
- **And** automatic reminders are sent for overdue payments
- **And** organisers see real-time payment status in their dashboard

### Epic 4: ROI Tracking & Analytics

#### Story 4.1: Track Sponsor Exposure Metrics
**As a** sponsor
**I want** to see detailed analytics about my sponsorship performance
**So that** I can measure ROI and justify sponsorship investments

**Acceptance Criteria**:
- **Given** I am an active sponsor with confirmed placement
- **When** I access my sponsor dashboard
- **Then** I see real-time metrics including logo impressions, website traffic attribution, and social media mentions
- **And** I can view historical data trends and compare performance over time
- **And** I can download detailed reports for internal reporting
- **And** metrics are updated in real-time as my sponsorship materials are displayed
- **And** I can set up automated alerts for significant metric changes

#### Story 4.2: Generate Sponsorship ROI Reports
**As a** sponsor
**I want** to receive automated monthly reports showing sponsorship performance
**So that** I can demonstrate value to stakeholders and plan future sponsorships

**Acceptance Criteria**:
- **Given** I am an active sponsor
- **When** monthly reporting cycles execute
- **Then** I receive a branded PDF report with comprehensive sponsorship metrics
- **And** the report includes executive summary, detailed analytics, and performance comparisons
- **And** reports are customised to my specific sponsorship tier and benefits
- **And** I can access historical reports through my sponsor portal
- **And** reports include actionable insights and recommendations for optimisation

### Epic 5: Financial Integration & Reporting

#### Story 5.1: Unified Revenue Dashboard
**As a** function organiser
**I want** to see combined revenue from ticket sales and sponsorships
**So that** I can track total event revenue and make informed financial decisions

**Acceptance Criteria**:
- **Given** I have both ticket sales and sponsorship revenue
- **When** I access my financial dashboard
- **Then** I see unified revenue reporting combining all income sources
- **And** I can view revenue breakdowns by source (tickets vs. sponsorships)
- **And** I can track payment status for all revenue streams
- **And** I see financial projections based on confirmed commitments
- **And** I can generate comprehensive financial reports for stakeholders
- **And** all data integrates seamlessly with existing payment processing systems

---

## Data Models

### Primary Tables

#### `sponsorship_packages`
```sql
CREATE TABLE sponsorship_packages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    function_id UUID REFERENCES functions(function_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- "Grand Sponsor", "Gold Package", etc.
    tier sponsorship_tier NOT NULL, -- enum: grand, major, gold, silver, bronze
    description TEXT,
    price_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'AUD',
    availability_limit INTEGER, -- NULL = unlimited
    benefits JSONB NOT NULL DEFAULT '[]', -- Array of benefit objects
    terms_and_conditions TEXT,
    application_deadline TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### `sponsorship_applications`
```sql
CREATE TABLE sponsorship_applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    package_id UUID REFERENCES sponsorship_packages(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    company_website VARCHAR(500),
    business_number VARCHAR(100),
    company_description TEXT,
    marketing_objectives TEXT,
    additional_requirements TEXT,
    documents_uploaded JSONB DEFAULT '[]', -- Array of uploaded file references
    application_status sponsorship_application_status DEFAULT 'pending',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    internal_notes TEXT
);
```

#### `sponsorship_contracts`
```sql
CREATE TABLE sponsorship_contracts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    application_id UUID REFERENCES sponsorship_applications(id) ON DELETE CASCADE,
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    contract_template_id UUID,
    contract_content TEXT NOT NULL, -- Generated contract HTML/text
    contract_pdf_url VARCHAR(500), -- Signed PDF storage
    payment_terms JSONB NOT NULL, -- Payment schedule and terms
    contract_status contract_status DEFAULT 'draft',
    sent_at TIMESTAMP WITH TIME ZONE,
    signed_at TIMESTAMP WITH TIME ZONE,
    effective_date DATE,
    expiry_date DATE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### `sponsorship_payments`
```sql
CREATE TABLE sponsorship_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contract_id UUID REFERENCES sponsorship_contracts(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'AUD',
    payment_due_date DATE NOT NULL,
    payment_status payment_status DEFAULT 'pending',
    square_payment_id VARCHAR(255), -- Integration with Square
    square_invoice_id VARCHAR(255),
    payment_method VARCHAR(50),
    paid_at TIMESTAMP WITH TIME ZONE,
    reminder_count INTEGER DEFAULT 0,
    last_reminder_sent TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### `sponsor_analytics`
```sql
CREATE TABLE sponsor_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contract_id UUID REFERENCES sponsorship_contracts(id) ON DELETE CASCADE,
    metric_type analytics_metric_type NOT NULL, -- logo_impression, website_click, social_mention
    metric_value INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}', -- Additional context (page_url, referrer, etc.)
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100)
);
```

### Enum Types

```sql
CREATE TYPE sponsorship_tier AS ENUM ('grand', 'major', 'gold', 'silver', 'bronze');
CREATE TYPE sponsorship_application_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'withdrawn');
CREATE TYPE contract_status AS ENUM ('draft', 'sent', 'signed', 'executed', 'expired', 'terminated');
CREATE TYPE analytics_metric_type AS ENUM ('logo_impression', 'website_click', 'social_mention', 'email_open', 'brochure_download');
```

### Integration Extensions

#### Extend `customers` table
```sql
-- Add sponsorship-specific fields to existing customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS sponsorship_tier sponsorship_tier;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS sponsorship_value_cents INTEGER;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES sponsorship_contracts(id);
```

#### Integration with existing `website.sponsors`
```sql
-- Link existing website sponsors table to sponsorship management
ALTER TABLE website.sponsors ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES sponsorship_contracts(id);
ALTER TABLE website.sponsors ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES sponsorship_packages(id);
```

---

## Integration Points

### 1. Square Payment Processing
**Integration Method**: Extends existing `unified-square-payment-service.ts`
**Data Flow**: Sponsorship payments flow through existing Square infrastructure with sponsorship-specific metadata
**Technical Details**:
- Sponsorship payments tagged with `customer_type = 'sponsor'` in Square metadata
- Integration with existing webhook system for payment status updates
- Automated invoice generation using Square's invoice API
- Payment tracking through existing payment confirmation workflows

### 2. PDF Generation Service
**Integration Method**: Utilises existing `pdf-service.ts` for contract and report generation
**Data Flow**: Contract templates and analytics reports generated using existing PDF infrastructure
**Technical Details**:
- Contract templates stored as HTML with dynamic data injection
- ROI reports generated using existing chart and report components
- Branded PDF generation with function-specific styling
- Document storage using existing file upload infrastructure

### 3. Email Service
**Integration Method**: Extends existing email infrastructure for sponsor communications
**Data Flow**: Automated emails for application status, payment reminders, and analytics reports
**Technical Details**:
- Integration with existing email templates and delivery system
- Sponsor-specific email templates for professional communication
- Automated email sequences for application workflow
- Newsletter integration for sponsor updates and announcements

### 4. Analytics & Tracking
**Integration Method**: Extends existing website tracking with sponsor-specific metrics
**Data Flow**: Logo impressions and sponsor interactions tracked through existing analytics infrastructure
**Technical Details**:
- Custom tracking pixels for sponsor logo impressions
- UTM parameter generation for sponsor traffic attribution
- Integration with existing Google Analytics setup
- Real-time metric collection and aggregation

### 5. File Storage
**Integration Method**: Uses existing Supabase storage for sponsor assets and documents
**Data Flow**: Sponsor logos, contracts, and supporting documents stored in existing file infrastructure
**Technical Details**:
- Dedicated storage buckets for sponsor assets
- Integration with existing file upload and management system
- Automated file organisation by sponsor and contract
- Secure document access with sponsor authentication

---

## Business Rules

### Package Management Rules
1. **Tier Exclusivity**: Grand and Major tiers limited to 1 sponsor each per function
2. **Package Availability**: Automatic tier closure when availability limits reached
3. **Pricing Validation**: Minimum pricing thresholds based on tier (Grand ≥ $10,000, Major ≥ $5,000, etc.)
4. **Benefit Hierarchy**: Higher tiers automatically include all lower tier benefits
5. **Application Deadlines**: No new applications accepted after deadline, existing applications remain valid

### Application Workflow Rules
1. **Review Timeline**: Applications must be reviewed within 14 business days
2. **Automatic Rejection**: Applications incomplete after 7 days automatically marked as withdrawn
3. **Duplicate Prevention**: One active application per company per function
4. **Document Requirements**: Mandatory company registration documents for applications over $5,000
5. **Status Notifications**: Automatic email notifications for all status changes

### Contract & Payment Rules
1. **Payment Terms**: Standard terms: 50% deposit on signing, 50% 30 days before event
2. **Late Payment**: 5% penalty applied to overdue payments after 30 days
3. **Cancellation Policy**: 90-day notice required, 50% refund before 60 days, 25% before 30 days
4. **Force Majeure**: Full refund for event cancellation due to force majeure events
5. **Contract Expiry**: Contracts automatically expire 90 days after event conclusion

### Analytics & Reporting Rules
1. **Impression Counting**: Unique impressions per IP per 24-hour period
2. **Attribution Window**: 30-day attribution window for sponsor traffic tracking
3. **Report Generation**: Monthly reports generated on the 1st of each month
4. **Data Retention**: Analytics data retained for 24 months
5. **Privacy Compliance**: All tracking complies with GDPR and privacy regulations

### Financial Integration Rules
1. **Revenue Recognition**: Sponsorship revenue recognised 50% on contract signing, 50% on event completion
2. **Refund Processing**: Automated refund processing through existing Square infrastructure
3. **Fee Allocation**: 5% platform fee applied to sponsorship revenue (vs 0% on ticket sales)
4. **Currency Handling**: Multi-currency support with automatic conversion to AUD for reporting
5. **Tax Compliance**: Automatic GST calculation and reporting for Australian sponsors

---

## Success Metrics

### Business Metrics
- **Revenue Growth**: 25% increase in total function revenue through sponsorship integration
- **Sponsorship Adoption**: 70% of functions utilise sponsorship packages within 6 months
- **Average Sponsorship Value**: $3,500 average sponsorship package value
- **Sponsor Retention**: 60% sponsor retention rate across multiple functions
- **Time to Payment**: Reduce sponsor payment processing time from 30 days to 7 days

### Operational Metrics
- **Application Processing**: 90% of applications reviewed within 7 business days
- **Contract Generation**: Automated contract generation within 24 hours of approval
- **Payment Success Rate**: 95% first-attempt payment success rate
- **Analytics Accuracy**: 99% uptime for sponsor analytics tracking
- **Report Delivery**: 100% on-time delivery of monthly sponsor reports

### User Experience Metrics
- **Sponsor Satisfaction**: 8.5/10 average sponsor satisfaction score
- **Application Completion Rate**: 85% of started applications completed
- **Dashboard Usage**: 70% of sponsors actively use ROI dashboard monthly
- **Support Ticket Reduction**: 50% reduction in sponsorship-related support tickets
- **Organiser Efficiency**: 60% reduction in manual sponsorship management time

### Technical Performance Metrics
- **System Uptime**: 99.9% uptime for sponsorship management system
- **Page Load Times**: <2 seconds for sponsor portal pages
- **API Response Times**: <500ms for sponsorship data retrieval
- **Data Accuracy**: 99.5% accuracy in financial reporting and analytics
- **Security Compliance**: 100% compliance with PCI DSS requirements for sponsor payments

---

## Future Considerations

### Phase 2 Enhancements
- **Multi-Function Sponsorships**: Enable sponsors to purchase packages across multiple functions
- **Dynamic Pricing**: Implement demand-based pricing for sponsorship tiers
- **Advanced Analytics**: Machine learning-powered ROI predictions and optimisation recommendations
- **Mobile App Integration**: Native mobile app for sponsor management and analytics

### Scalability Considerations
- **Multi-Organisation Support**: Extend system to support multiple event organisers
- **International Expansion**: Multi-currency and multi-language support
- **Enterprise Features**: White-label solutions for large event management companies
- **API Ecosystem**: Public API for third-party integrations and custom solutions

### Technology Evolution
- **Blockchain Integration**: Smart contracts for automated sponsorship agreements
- **AI-Powered Matching**: Machine learning sponsor-event matching recommendations
- **Virtual/Hybrid Events**: Enhanced digital sponsorship opportunities for virtual events
- **Sustainability Tracking**: Carbon footprint and sustainability metrics for eco-conscious sponsors