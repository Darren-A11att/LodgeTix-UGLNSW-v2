# TryBooking Comprehensive Analysis

## 1. Company, Brand and Product Position

### Company Overview
- **Founded**: 2008 in Melbourne, Australia
- **Headquarters**: Melbourne, Australia
- **Market Position**: "Australia's favourite event ticketing system" and "Australia's number one self-service ticketing engine"
- **Scale**: 
  - $1 billion+ in ticket sales (as of 2017)
  - 15,000+ events per week
  - 661+ LinkedIn followers
  - Expanded to New Zealand in 2018

### Brand Positioning
- **Core Value Proposition**: "Australia's leading event ticketing platform, easy-to-use and with the lowest ticket booking fees for event creation and fundraising pages"
- **Mission**: "Built on the idea that anyone, anywhere in the world wanting to organise an event should have the tools to simply do so"
- **Brand Promise**: "We're here to help you sell more tickets and have a successful event"

### Target Audience
- **Primary**: Community organizations and non-profits
- **Key Segments**:
  - Associations
  - Charities
  - Schools (K-12, PTAs)
  - Sporting Clubs
  - Theatres and Performing Arts
  - Dance Studios
  - Small to Large Enterprises
  - Freelancers

### Unique Selling Points
1. **No Customer Login Required**: Frictionless ticket buying experience
2. **Data Privacy**: No third-party data sharing or cross-event marketing
3. **Free for Free Events**: Complete platform access for free events
4. **Local Support**: Australian-based support team via email, phone, and live chat
5. **All Features Included**: No feature tiers or limits based on pricing

## 2. Product Suite and Offering

### Core Products

#### 1. Event Ticketing System
- Online ticket sales (general admission and reserved seating)
- In-person ticket sales via Box Office App
- Custom ticket types and pricing
- Event page customization and white labeling
- Password-protected events

#### 2. Mobile Applications
- **Box Office App** (iOS/Android)
  - Sell tickets, merchandise, and accept donations in-person
  - Tap To Pay functionality - no hardware required
  - Accept cash and contactless payments
- **Scanning App**
  - QR code and manual check-in
  - Volunteer Mode for restricted access
  - Real-time entry management

#### 3. Event Management Tools
- Custom forms for attendee information
- Promotion codes and discounts
- Real-time sales tracking and reporting
- Marketing reports
- Door lists and data exports
- Seating plan customization

#### 4. Payment Processing
- Multiple payment methods (Visa, MasterCard, PayPal, Google Pay, Apple Pay)
- Refund processing capabilities
- Fee management options (organizer or buyer pays)
- Integration with own Stripe accounts

#### 5. Additional Solutions
- **Registrations**: For conferences, workshops, classes
- **Donations**: Fundraising pages with multiple campaigns
- **Merchandise Sales**: Through Box Office App
- **Parking Management**: Ticket-based parking solutions

### Integration Capabilities
- Website widgets for embedding
- Social media event sharing
- Xero accounting integration
- Stripe payment integration
- Google Analytics 4 (GA4)
- Salesforce CRM
- Facebook
- Schoolbox LMS
- Custom API for third-party integrations

## 3. Solutions by Industry

### Schools Solution
- **Key Features**:
  - Integration with academic event calendar
  - Student volunteer scanning mode
  - Collection of emergency contacts and dietary requirements
  - Support for school productions, sports days, fundraisers
  - PTA/Parent group support
- **Benefits**: Reduced admin work, secure student data handling, easy parent communication

### Charities & Non-Profits Solution
- **Key Features**:
  - Multiple simultaneous fundraising pages
  - General donations or specific campaign goals
  - Same low fees as commercial events
  - Option to pass fees to donors
- **Benefits**: Community support focus, transparent fundraising, low-cost operations

### Sports Clubs Solution
- **Key Features**:
  - Season ticket management
  - Game day ticket sales
  - Merchandise sales integration
  - Registration management
  - Box office for match day sales
- **Benefits**: Multiple revenue streams, member management, event day flexibility

### Theatres & Performing Arts Solution
- **Key Features**:
  - Partnership with ArtsPay (50% profits support arts)
  - Reserved seating with interactive seating plans
  - Tabled/dinner theatre configurations
  - Box office integration
  - Performance series management
- **Benefits**: Arts-focused payment gateway, sophisticated seating management

## 4. Pricing Structure (AUD)

### Fee Structure

#### Paid Events
- **Ticket Fee**: 
  - 50¢ per ticket (standard)
  - 15¢ per ticket for items $5.00 or less
- **Processing Fee**: 2.5% of ticket price
- **Total Example**: On a $250 ticket = $6.75 total fees (2.5% + $0.50)

#### Free Events
- **Completely Free**: No fees for free events
- Full platform access included

#### Donations
- **Fee**: 2.5% of donation amount

#### Payment Method Surcharges
- **PayPal**: Additional 0.5% surcharge
- **Credit/Debit Cards**: No additional surcharge
- **Google Pay/Apple Pay**: No additional surcharge

### Pricing Philosophy
- No sign-up or account maintenance fees
- No lock-in contracts
- No hidden fees
- Same fees for all account types (including non-profits)
- Option to absorb fees or pass to customers

### Stripe Integration Pricing
If using own Stripe account:
- **Stripe Fee**: 1.7% + $0.30 per transaction
- **TryBooking Fee**: 1% processing fee
- **Note**: Cannot pass Stripe fees to customers

## 5. Payments & Ticket Sales Approach

### Payment Processing Options

#### 1. TryBooking Gateway (Default)
- **Structure**: TryBooking acts as agent for event organizers
- **Fund Handling**: 
  - Receives and holds funds as agent
  - Retains fees as payment for services
  - Releases funds upon organizer request
- **Payment Partners**: Stripe, ArtsPay/FatZebra, PayPal

#### 2. Third-Party Gateway
- **Structure**: Organizers use own merchant account (e.g., Stripe)
- **Requirements**: 
  - Must create Stripe account in own name
  - Cannot pass processing fees to customers
  - Cannot charge additional fees on tickets

#### 3. Cash Payments
- **Via**: Box Office App
- **Features**: Manual entry, receipt generation

### Australian Market Compliance
- **Legal Entity**: TryBooking Pty Ltd (Australian company)
- **Data Hosting**: AWS data centers in Sydney, Australia
- **Regulatory Compliance**:
  - Privacy Act 1988 (Commonwealth)
  - Australian Privacy Principles
  - Notifiable Data Breaches (NDB) scheme
  - PCI Level 1 compliance for payment data
  - Anti-Money Laundering compliance where applicable

### Risk Management
- **Security Measures**:
  - No storage of full credit card numbers
  - TLS encryption for all transactions
  - Multi-factor authentication
  - Disk encryption by default
  - Regular security audits

- **Fraud Protection**:
  - Stripe's sophisticated fraud detection (when using Stripe)
  - Real-time transaction monitoring
  - Secure payment tokenization

## 6. Legal Terms

### Legal Positioning
- **Agent Model**: "We agree to act as your agent to provide an online ticket booking service"
- **Platform Provider**: Not a party to transactions between organizers and customers
- **Limited Liability**: Maximum liability capped at lesser of:
  - Amount paid in preceding 12 months
  - $10,000

### Key Terms for Event Organizers
1. **Fund Handling**:
   - TryBooking holds funds as agent
   - Organizer requests fund release
   - Responsible for own tax obligations

2. **Responsibilities**:
   - Event delivery and customer service
   - Refund policies and processing
   - Compliance with local event regulations
   - Customer data protection (as data controller)

3. **Platform Usage**:
   - Services provided "as is"
   - No warranty on uninterrupted service
   - Right to suspend for violations

### Privacy and Data Protection
1. **Data Controller/Processor Model**:
   - Event Organizers = Data Controllers
   - TryBooking = Data Processor
   - Clear separation of responsibilities

2. **Data Collection**:
   - Minimal data collection principle
   - 4-year retention period
   - Australian-based data storage

3. **User Rights**:
   - Access and correction requests
   - Account/data deletion options
   - Marketing opt-out
   - Special protections for users under 13

4. **Data Sharing**:
   - No third-party marketing sharing
   - Limited to event organizers and required services
   - Legal disclosure when required

### Australian Legal Framework
- **Governed by**: Victoria, Australia laws
- **Dispute Resolution**: Victorian courts
- **Consumer Protection**: Acknowledges Australian Consumer Law rights
- **ABN Requirement**: Fundraisers must have valid Australian Business Number

## 7. Integrations

### Payment Provider Integrations
1. **Stripe** (Verified Partner)
   - Direct account connection option
   - Instant payouts available
   - Multiple payment methods support
   - Sophisticated fraud protection

2. **ArtsPay/FatZebra**
   - Arts-focused payment gateway
   - 50% of profits support arts industry
   - Australian-based processor

3. **PayPal**
   - Additional 0.5% surcharge
   - International payment support

### Business System Integrations
1. **Xero**
   - Automated financial reconciliation
   - Invoice and receipt generation
   - Financial reporting integration

2. **Salesforce**
   - CRM synchronization
   - Customer data management
   - Marketing automation

3. **Google Analytics 4**
   - Event tracking
   - Conversion monitoring
   - Customer journey analysis

### Education Integrations
1. **Schoolbox LMS**
   - Direct integration for K-12 schools
   - Student and parent portal access
   - Academic calendar synchronization

### Developer Integration
1. **TryBooking API**
   - REST service connectors
   - Read access to bookings and events
   - Real-time data synchronization
   - Developer documentation available

2. **Website Widgets**
   - Embeddable booking forms
   - Customizable appearance
   - Mobile-responsive design

### Social Media Integration
1. **Facebook**
   - Event creation and promotion
   - Social sharing capabilities
   - Community engagement tools

### Key Integration Benefits
- **No Vendor Lock-in**: Open architecture
- **Data Portability**: Export capabilities
- **Automation**: Reduced manual data entry
- **Real-time Sync**: Up-to-date information across systems

## Summary

TryBooking has established itself as the dominant event ticketing platform in Australia by focusing on:
1. **Community-first approach** with free events truly free
2. **Transparent, low-cost pricing** without hidden fees
3. **Local Australian presence** with responsive support
4. **Comprehensive feature set** without tier restrictions
5. **Strong privacy stance** with no data reselling
6. **Flexible payment options** including own gateway usage
7. **Industry-specific solutions** while maintaining simplicity

Their success stems from understanding the Australian market's need for an affordable, reliable, and locally-supported ticketing solution that prioritizes community events and organizations.