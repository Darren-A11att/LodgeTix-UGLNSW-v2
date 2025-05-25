# Stripe Connect Requirements Document
## Custom Accounts for Masonic Organizations

---

## 1. Executive Summary

LodgeTix will implement **Stripe Connect Custom** accounts to process payments for Masonic events. This approach allows complete control over the KYC process, immediate payouts, and a white-label experience tailored to Masonic organizations' unique requirements.

### Key Business Requirements
- **Custom KYC Process**: Handle verification for Masonic lodges with specific documentation
- **White-Label Experience**: No Stripe branding visible to organizers
- **Immediate Payouts**: Money in = money out (no funds held)
- **Platform Fee**: 2.5% automatically deducted from each transaction
- **Tax Compliance**: Platform manages all tax forms and reporting
- **Australian Focus**: Optimized for Australian banking and regulations

---

## 2. User Stories

### 2.1 Organizer Onboarding

**As a** Lodge Secretary  
**I want to** connect my lodge's bank account to receive event payments  
**So that** ticket sales can be deposited directly into our lodge account  

**Acceptance Criteria:**
- Can create Stripe Connect account without seeing Stripe branding
- Can upload lodge-specific documents (charter, Grand Lodge certificate)
- Can add multiple authorized signatories
- Receive clear status updates during verification
- See estimated payout timing

### 2.2 KYC Verification Process

**As a** Platform Administrator  
**I want to** verify lodge credentials and bank accounts  
**So that** we ensure compliance while understanding Masonic structure  

**Acceptance Criteria:**
- Review uploaded lodge documents
- Verify lodge is in good standing with Grand Lodge
- Confirm authorized signatories match lodge records
- Approve/reject applications with clear reasoning
- Track verification history

### 2.3 Payment Processing

**As an** Event Attendee  
**I want to** pay for tickets with my credit card  
**So that** I can secure my registration immediately  

**Acceptance Criteria:**
- See clear breakdown of fees before payment
- Receive immediate confirmation
- Platform fee is transparent but included in total
- Payment goes directly to lodge (minus platform fee)

### 2.4 Automatic Payouts

**As a** Lodge Treasurer  
**I want to** receive ticket payments immediately  
**So that** funds are available for event expenses without delay  

**Acceptance Criteria:**
- Payouts triggered automatically after successful payment
- Net amount (minus 2.5% platform fee) deposited
- Receive notification of incoming funds
- Can track all payouts in dashboard
- Next-day arrival for Australian banks

### 2.5 Tax and Compliance

**As a** Lodge Treasurer  
**I want to** receive proper tax documentation for all transactions  
**So that** our lodge can maintain accurate financial records  

**Acceptance Criteria:**
- Receive monthly transaction summaries
- Annual tax statements available before June 30
- GST-compliant invoices for all fees
- Export data for accounting software
- Clear audit trail for all transactions

### 2.6 Refund Processing

**As an** Event Organizer  
**I want to** process refunds for cancelled registrations  
**So that** attendees can receive their money back promptly  

**Acceptance Criteria:**
- Can initiate refunds from organizer dashboard
- Platform fee is automatically adjusted
- Refund reflected in payout calculations
- Email notification sent to attendee
- Refund history tracked and exportable

---

## 3. Functional Requirements

### 3.1 Onboarding Flow

**Requirement**: Multi-step onboarding wizard for lodge bank account connection

**Steps**:
1. **Welcome Screen**
   - Explain benefits of connecting bank account
   - Show example of payment flow
   - Display security assurances

2. **Lodge Information**
   - Lodge name and number
   - Grand Lodge jurisdiction
   - ABN (Australian Business Number)
   - Lodge meeting address

3. **Bank Account Details**
   - Account holder name (must match lodge name)
   - BSB number
   - Account number
   - Confirm account is in lodge's name

4. **Authorized Officers**
   - Current Master details
   - Secretary details
   - Treasurer details
   - Additional authorized signatories

5. **Document Upload**
   - Lodge charter or warrant
   - Current Grand Lodge certificate
   - Recent bank statement (showing lodge name)
   - Current officers list from Grand Lodge

6. **Terms Acceptance**
   - Platform terms of service
   - Stripe Connected Account agreement
   - Fee structure acknowledgment (2.5%)

7. **Verification Status**
   - Show pending verification
   - Estimated timeline (24-48 hours)
   - What happens next

### 3.2 KYC Verification Requirements

**Requirement**: Platform-managed verification process for Masonic lodges

**Information to Collect**:
1. **Lodge Details**
   - Official lodge name (as per charter)
   - Lodge number
   - Grand Lodge jurisdiction
   - Year of constitution/warrant
   - Meeting location

2. **Required Documents**
   - Lodge charter/warrant (PDF/image)
   - Current Grand Lodge certificate
   - Bank statement showing lodge name
   - List of current officers from Grand Lodge
   - ABN certificate (if applicable)

3. **Officer Verification**
   - Verify Master, Secretary, Treasurer against Grand Lodge records
   - Collect ID for primary contact (driver's license or passport)
   - Phone verification for primary contact

4. **Verification Process**
   - Admin reviews submitted documents
   - Cross-check with Grand Lodge records
   - Verify bank account name matches lodge
   - Approve or request additional information
   - Notify organizer of status

### 3.3 Payment Flow Requirements

**Requirement**: Seamless payment with automatic fee deduction and immediate payout

**Process**:
1. **Customer Payment**
   - Shows total price (includes platform fee)
   - Platform fee not shown separately to customer
   - Payment processed via platform's Stripe account

2. **Fee Deduction**
   - 2.5% automatically deducted
   - Fee recorded for reporting
   - Net amount calculated

3. **Automatic Payout**
   - Triggered immediately on successful payment
   - Net amount sent to lodge bank account
   - Next business day arrival (Australian banks)
   - Email notification to treasurer

4. **Reconciliation**
   - Daily summary of transactions
   - Monthly statements available
   - Export for accounting software

### 3.4 Dashboard Requirements

**Requirement**: Comprehensive financial dashboard for lodge treasurers

**Features**:
1. **Overview**
   - Total revenue (current month)
   - Pending payouts
   - Recent transactions
   - Upcoming events

2. **Transaction History**
   - Date, event, amount, status
   - Search and filter options
   - Export to CSV/Excel
   - Print-friendly format

3. **Payout Tracking**
   - Expected arrival dates
   - Bank account details
   - Historical payouts
   - Failed payout alerts

4. **Reports**
   - Monthly financial summary
   - Event-by-event breakdown
   - Platform fee summary
   - Year-end tax report

---

## 4. Non-Functional Requirements

### 4.1 Performance
- Onboarding completion < 10 minutes
- Payment processing < 3 seconds
- Dashboard load time < 2 seconds
- Payout initiation < 30 seconds after payment

### 4.2 Security
- PCI compliance maintained by Stripe
- No storage of sensitive payment data
- Encrypted document uploads
- Two-factor authentication for financial access

### 4.3 Compliance
- Australian banking regulations
- AML/CTF requirements
- GST handling for platform fees
- Data retention per legal requirements

### 4.4 Usability
- Mobile-responsive onboarding
- Clear error messages
- Progress indicators
- Help documentation

---

## 5. Implementation Tasks

### Phase 1: Foundation (Week 1-2)
1. Design database schema for KYC tracking
2. Create API endpoints for account creation
3. Build document upload system
4. Implement webhook handlers

### Phase 2: Onboarding Flow (Week 3-4)
1. Create multi-step onboarding wizard UI
2. Build document upload interface
3. Implement form validation
4. Add progress tracking

### Phase 3: Verification System (Week 5-6)
1. Build admin verification dashboard
2. Create document review interface
3. Implement approval/rejection workflow
4. Add email notifications

### Phase 4: Payment Integration (Week 7-8)
1. Update payment flow for Custom accounts
2. Implement automatic fee deduction
3. Create payout triggering system
4. Build transaction recording

### Phase 5: Financial Dashboard (Week 9-10)
1. Design treasurer dashboard
2. Build transaction history
3. Create report generation
4. Add export functionality

### Phase 6: Testing & Launch (Week 11-12)
1. End-to-end testing
2. Security audit
3. Performance optimization
4. Pilot with select lodges

---

## 6. Success Metrics

### Onboarding
- 90% completion rate
- < 48 hour verification time
- < 5% rejection rate

### Payments
- 99.9% payment success rate
- 100% same-day payout initiation
- < 0.1% payout failures

### User Satisfaction
- > 4.5/5 treasurer satisfaction
- < 2% support tickets
- 95% would recommend

---

## 7. Risks and Mitigations

### Risk 1: KYC Complexity
**Mitigation**: Clear documentation, help videos, live chat support

### Risk 2: Payout Delays
**Mitigation**: Monitor payout status, automatic retry, escalation process

### Risk 3: Document Fraud
**Mitigation**: Cross-reference with Grand Lodge, require multiple documents

### Risk 4: Technical Failures
**Mitigation**: Redundant systems, manual backup process, 24/7 monitoring