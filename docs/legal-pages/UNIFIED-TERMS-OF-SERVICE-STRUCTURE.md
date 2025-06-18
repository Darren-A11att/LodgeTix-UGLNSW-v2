# LodgeTix Unified Terms of Service Structure

## Overview

This document outlines the comprehensive unified Terms of Service structure for LodgeTix, integrating both Event Attendee and Event Organiser terms into a cohesive legal framework. The structure addresses the complex requirements of a dual-sided marketplace while maintaining Masonic focus and Australian legal compliance.

## Document Architecture

### Part I: General Provisions (Universal Application)
**Applies to:** All users regardless of role
**Sections:** 1-3
**Purpose:** Establishes foundational terms that apply universally

#### 1. Agreement Scope and Definitions
- **Binding Agreement:** Legal framework establishment
- **User Type Definitions:** Clear categorisation of Attendees vs Organisers
- **Term Hierarchy:** How different sections interact and override

#### 2. Universal Eligibility and Account Requirements
- **Basic Eligibility:** Age, capacity, accuracy requirements
- **Masonic Verification Framework:** Universal standards for all users
- **Account Responsibilities:** Security and maintenance obligations

#### 3. Universal Code of Conduct and Masonic Values
- **Masonic Principles:** Applied to all user interactions
- **Prohibited Conduct:** Universal standards across all roles
- **Enforcement:** Consistent sanctioning approach

### Part II: Event Attendee Terms (Role-Specific)
**Applies to:** Users registering for and attending events
**Sections:** A1-A4
**Purpose:** Specific obligations and protections for ticket purchasers

#### A1. Registration and Ticketing
- **Registration Process:** Step-by-step attendee obligations
- **Masonic Event Eligibility:** Category-specific requirements
- **Ticket Terms:** Ownership, transferability, replacement

#### A2. Payment and Financial Obligations
- **Payment Authorization:** Critical legal notice with explicit consent language
- **Processing Framework:** Stripe Connect integration for attendees
- **Pricing Transparency:** Fee disclosure and GST inclusion

#### A3. Cancellation and Refund Rights
- **3-Day Transition:** Clear explanation of refund responsibility shift
- **Standard Policy:** Timeframe-based refund percentages
- **Exceptional Circumstances:** Compassionate refund considerations
- **Event Changes:** Organiser-initiated modification policies

#### A4. Attendee Rights and Protections
- **Consumer Protection:** Australian Consumer Law integration
- **Data Protection:** Privacy and information sharing controls
- **Access and Accommodation:** Disability and dietary considerations

### Part III: Event Organiser Terms (Role-Specific)
**Applies to:** Lodges and authorised individuals creating events
**Sections:** O1-O5
**Purpose:** Specific obligations and requirements for event creators

#### O1. Event Creation and Management
- **Organisational Authority:** Verification and authorisation requirements
- **Event Setup:** Accuracy and compliance obligations
- **Financial Management:** Pricing and record-keeping requirements

#### O2. Stripe Connect and Payment Processing
- **Connected Account Agreement:** Stripe terms incorporation
- **KYC Compliance:** Verification and documentation requirements
- **Payment Processing:** Fee structure and fund transfer protocols
- **Financial Reporting:** Record keeping and tax obligations

#### O3. Refund Management and 3-Day Transition
- **Responsibility Framework:** Critical timeline explanation
- **Policy Requirements:** Minimum standards and consistency
- **Exceptional Circumstances:** Fair assessment procedures

#### O4. Event Delivery and Attendee Management
- **Service Delivery:** Performance and quality obligations
- **Attendee Verification:** Masonic protocol implementation
- **Grand Lodge Compliance:** Regulatory adherence requirements

#### O5. Organiser Liability and Insurance
- **Primary Responsibility:** Event delivery and safety obligations
- **Risk Management:** Assessment and control requirements

### Part IV: Shared Responsibilities (Cross-User Interactions)
**Applies to:** Interactions between Attendees and Organisers
**Sections:** 4, 4B, 4C
**Purpose:** Governs inter-user relationships and platform mediation

#### 4. Cross-References and Interaction Protocols
- **Relationship Framework:** Direct contracting with platform facilitation
- **Information Sharing:** Privacy and necessity-based disclosure
- **Communication Standards:** Professional and fraternal requirements

#### 4B. Conflict Resolution Hierarchy
- **Term Precedence:** Framework for resolving conflicting provisions
- **Dispute Escalation:** Progressive resolution procedures

#### 4C. Shared Data Policies
- **Data Flow Framework:** Information sharing between user types
- **Protection Responsibilities:** Role-based data security obligations

### Part V: Platform Operations (LodgeTix Role Definition)
**Applies to:** Platform-user relationships
**Sections:** 5, 5B, 5C
**Purpose:** Defines LodgeTix's role, capabilities, and limitations

#### 5. LodgeTix Platform Role and Limitations
- **Service Definition:** Technology platform vs event provider clarification
- **Service Availability:** Performance expectations and limitations
- **Content Accuracy:** User responsibility for information

#### 5B. Platform Mediation and Support
- **Customer Support:** Multi-channel assistance framework
- **Dispute Mediation:** Optional intervention services
- **Compliance Enforcement:** Policy monitoring and sanctions

#### 5C. Technical Infrastructure and Security
- **Data Security:** Encryption and protection measures
- **Backup and Recovery:** Business continuity procedures
- **Third-Party Integration:** External service relationships

### Part VI: Legal Framework (Dispute Resolution & Compliance)
**Applies to:** All legal proceedings and compliance matters
**Sections:** 6-9
**Purpose:** Establishes legal jurisdiction and resolution procedures

#### 6. Masonic Dispute Resolution Protocols
- **Fraternal Resolution:** Masonic-specific mediation procedures
- **Complaint Process:** Initial resolution requirements
- **Escalation Procedures:** Progressive formal resolution

#### 7. Governing Law and Jurisdiction
- **Legal Jurisdiction:** NSW law and court system
- **Compliance Requirements:** Australian regulatory adherence
- **International Considerations:** Cross-border user treatment

#### 8. Liability Framework and Limitations
- **Platform Limitations:** Liability caps and exclusions
- **User Responsibility:** Role-based liability allocation
- **Insurance Requirements:** Coverage obligations and indemnification

#### 9. Termination and Enforcement
- **Termination Rights:** User and platform termination powers
- **Effect of Termination:** Post-termination obligations
- **Masonic Coordination:** Grand Lodge discipline integration

## Key Integration Features

### 1. Cross-References and Navigation
- **Quick Navigation:** Section linking for easy reference
- **Hierarchical Structure:** Clear part and section organisation
- **Term Precedence:** Conflict resolution framework

### 2. Unified Definitions
- **Consistent Terminology:** Standardised language throughout
- **Role Clarity:** Clear user type definitions
- **Scope Application:** Explicit section applicability

### 3. 3-Day Refund Responsibility Transition
- **Critical Timeline:** Prominently featured in multiple sections
- **Clear Communication:** Responsibility party identification
- **Process Integration:** Seamless handover procedures

### 4. Stripe Connect Integration
- **Comprehensive Coverage:** All required clauses included
- **Role-Specific Application:** Attendee vs Organiser requirements
- **Compliance Alignment:** KYC and verification procedures

### 5. Masonic Protocol Integration
- **Universal Application:** Principles embedded throughout
- **Specific Requirements:** Role-based Masonic obligations
- **Grand Lodge Coordination:** Disciplinary procedure alignment

## Implementation Considerations

### 1. User Acceptance Mechanisms
```typescript
interface TermsAcceptance {
  userId: string;
  userType: 'attendee' | 'organiser' | 'both';
  sectionsAccepted: string[];
  acceptanceDate: Date;
  ipAddress: string;
  userAgent: string;
}
```

### 2. Version Control Strategy
- **Granular Versioning:** Track changes by section
- **User Notification:** Targeted updates based on applicable sections
- **Acceptance Tracking:** Section-specific consent management

### 3. Navigation and Usability
- **Responsive Design:** Mobile-optimised navigation
- **Search Functionality:** Find relevant sections quickly
- **Progressive Disclosure:** Show relevant sections based on user type

### 4. Educational Support
- **Plain Language Summaries:** Key points in accessible language
- **Visual Aids:** Flowcharts for complex procedures
- **FAQ Integration:** Common questions addressed inline

## Legal Consistency Framework

### 1. Hierarchy Resolution
```
Specific User Terms > General Provisions > Platform Policies
Masonic Protocol > Platform Convenience
Legal Compliance > Operational Preferences
Safety/Security > User Convenience
```

### 2. Conflict Resolution Process
1. **Identify Conflicting Provisions:** Document specific conflicts
2. **Apply Hierarchy Rules:** Use precedence framework
3. **Seek User Intent:** Consider purpose and context
4. **Document Resolution:** Maintain decision rationale

### 3. Amendment Procedures
- **Impact Assessment:** Evaluate changes across all sections
- **User Notification:** Targeted communication strategy
- **Acceptance Collection:** Section-specific consent updates
- **Documentation:** Change rationale and implementation

## Compliance Alignment

### 1. Australian Legal Requirements
- **Australian Consumer Law:** Integrated throughout attendee protections
- **Privacy Act 1988:** Comprehensive data protection framework
- **Competition and Consumer Act:** Fair trading practices
- **Anti-Money Laundering:** KYC and verification procedures

### 2. Industry Standards Comparison
- **Humanitix:** Consumer protection and accessibility features
- **TryBooking:** Payment processing and refund procedures
- **Eventbrite:** Platform liability and user responsibility
- **Stripe Connect:** Payment processing requirements and compliance

### 3. Masonic Compliance
- **Grand Lodge Recognition:** Verification procedures
- **Protocol Requirements:** Ceremonial and event standards
- **Disciplinary Coordination:** Sanctions and restoration procedures
- **Confidentiality Protection:** Information handling requirements

## Benefits of Unified Structure

### 1. Legal Clarity
- **Single Source of Truth:** All terms in one comprehensive document
- **Reduced Ambiguity:** Clear precedence and conflict resolution
- **Comprehensive Coverage:** No gaps between user types

### 2. User Experience
- **Role-Based Navigation:** Users find relevant sections quickly
- **Consistent Language:** Standardised terminology throughout
- **Progressive Disclosure:** Information presented when needed

### 3. Operational Efficiency
- **Unified Maintenance:** Single document to update and maintain
- **Consistent Enforcement:** Standardised policy application
- **Streamlined Training:** Staff learn one comprehensive framework

### 4. Risk Management
- **Comprehensive Protection:** All scenarios covered appropriately
- **Clear Liability Allocation:** Responsibilities clearly defined
- **Dispute Prevention:** Clear expectations reduce conflicts

## Future Enhancements

### 1. Interactive Features
- **Role-Based Views:** Filter content by user type
- **Decision Trees:** Guide users to relevant sections
- **Compliance Checklists:** Help organisers meet requirements

### 2. Integration Opportunities
- **API Documentation:** Technical implementation guides
- **Training Materials:** User education programmes
- **Compliance Tools:** Automated requirement checking

### 3. Monitoring and Improvement
- **Usage Analytics:** Track section engagement
- **User Feedback:** Collect improvement suggestions
- **Legal Updates:** Monitor regulatory changes

## Conclusion

The Unified Terms of Service structure provides LodgeTix with a comprehensive, legally sound framework that:

1. **Addresses Dual-Sided Complexity:** Handles both attendee and organiser requirements cohesively
2. **Maintains Masonic Focus:** Integrates fraternal values and protocols throughout
3. **Ensures Legal Compliance:** Meets Australian regulatory requirements comprehensively
4. **Provides Clear Navigation:** Enables users to find relevant information efficiently
5. **Supports Operational Excellence:** Facilitates consistent policy application and enforcement

This structure positions LodgeTix for scalable growth while maintaining the specialised community focus and legal protections essential for serving the Masonic community effectively.