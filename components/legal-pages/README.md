# Legal Pages Components

This directory contains legally binding terms and conditions components for the LodgeTix platform. These components must be handled with care as they contain enforceable legal obligations.

## Components Overview

### Event Organiser Terms

#### `event-organiser-terms.tsx`
Comprehensive Terms of Service specifically for Event Organisers using the LodgeTix platform.

**Key Features:**
- Complete Stripe Connect compliance requirements
- KYC/KYB verification obligations for Australian businesses
- Event organiser responsibilities and obligations
- Financial terms, payment processing, and refund policies
- Australian regulatory compliance (AUSTRAC, ASIC, Consumer Law)
- Masonic-specific terms and protocols
- Dispute resolution and governing law provisions

**Usage:**
```tsx
import { EventOrganiserTerms } from '@/components/legal-pages'

export default function OrganiserTermsPage() {
  return <EventOrganiserTerms />
}
```

#### `organiser-terms-summary.tsx`
User-friendly summary of key organiser terms for onboarding flows.

**Key Features:**
- Concise overview of critical obligations
- Visual priority indicators (critical, important, standard)
- Stripe Connect integration notices
- Interactive acceptance/decline options
- Links to complete terms

**Usage:**
```tsx
import { OrganiserTermsSummary } from '@/components/legal-pages'

export default function OnboardingStep() {
  const handleAccept = () => {
    // Process acceptance
  }

  const handleDecline = () => {
    // Handle decline
  }

  return (
    <OrganiserTermsSummary 
      showActions={true}
      onAccept={handleAccept}
      onDecline={handleDecline}
    />
  )
}
```

## Legal Compliance Requirements

### Stripe Connect Integration

All Event Organiser terms include mandatory Stripe Connect compliance:

1. **Connected Account Agreement**: Organisers must agree to Stripe's Connected Account Agreement
2. **KYC/KYB Verification**: Australian business verification requirements
3. **Payment Processing Terms**: Standard Stripe payment processing obligations
4. **Data Sharing**: Acknowledgment of data sharing with Stripe for compliance

### Australian Regulatory Compliance

The terms include compliance with:

- **AUSTRAC**: Anti-Money Laundering and Counter-Terrorism Financing
- **ASIC**: Australian Securities and Investments Commission requirements
- **Australian Consumer Law**: Consumer protection obligations
- **Privacy Act 1988**: Data protection and privacy requirements
- **Corporations Act 2001**: Corporate compliance obligations

### Masonic-Specific Requirements

For Masonic events and lodges:

- **Grand Lodge Protocols**: Compliance with applicable Grand Lodge regulations
- **Ceremonial Requirements**: Proper protocols for ceremonial events
- **Visitor Verification**: Appropriate visitor admission procedures
- **Confidentiality**: Maintenance of Masonic confidentiality
- **Fraternal Dispute Resolution**: Masonic principles in dispute resolution

## Critical Organiser Obligations

### Financial Responsibilities

1. **Refund Processing**: 
   - Days 1-3: LodgeTix handles cancellation refunds
   - Day 4+: Event Organiser responsible for ALL refunds
   - Must maintain sufficient account balance

2. **Payment Settlement**:
   - Complete KYC/KYB verification required
   - Australian bank account mandatory
   - Processing fees automatically deducted

3. **Dispute Liability**:
   - Liable for chargebacks and payment disputes
   - Must participate in dispute resolution
   - Cover all associated costs and fees

### Event Management

1. **Service Delivery**: Deliver all promised services and experiences
2. **Customer Service**: Respond to inquiries within 48 hours
3. **Safety Compliance**: Maintain appropriate safety standards
4. **Information Accuracy**: Keep event details current and accurate

### Legal Compliance

1. **Verification Requirements**: Complete and maintain KYC/KYB compliance
2. **Regulatory Compliance**: Adhere to all applicable Australian laws
3. **Platform Rules**: Follow acceptable use policies
4. **Professional Conduct**: Maintain professional standards

## Implementation Guidelines

### For Developers

1. **Terms Display**: Always display complete terms before organiser signup
2. **Acceptance Tracking**: Record explicit acceptance with timestamps
3. **Updates**: Notify organisers of any terms changes
4. **Accessibility**: Ensure terms are accessible and readable

### For Legal Team

1. **Regular Review**: Review terms quarterly for regulatory changes
2. **Compliance Monitoring**: Monitor for new Australian regulatory requirements
3. **Stripe Updates**: Track Stripe Connect agreement changes
4. **Industry Standards**: Benchmark against competitor terms

### For Product Team

1. **User Experience**: Balance legal requirements with usability
2. **Onboarding Flow**: Integrate terms acceptance smoothly
3. **Support Integration**: Link to appropriate support channels
4. **Mobile Compatibility**: Ensure terms are mobile-friendly

## Maintenance and Updates

### Regular Maintenance

- **Quarterly Review**: Legal team review for regulatory changes
- **Stripe Monitoring**: Track Stripe Connect agreement updates
- **Compliance Updates**: Monitor AUSTRAC, ASIC, and consumer law changes
- **Industry Benchmarking**: Compare with competitor terms

### Update Process

1. **Legal Review**: Legal team reviews proposed changes
2. **Stakeholder Approval**: Management approval for significant changes
3. **Implementation**: Development team updates components
4. **Notification**: Notify existing organisers of material changes
5. **Documentation**: Update this README and related documentation

## Support and Escalation

### Legal Issues
- **Email**: legal@lodgetix.io
- **Phone**: +61 408 925 926
- **Escalation**: Senior management and legal counsel

### Platform Issues
- **Support**: support@lodgetix.io
- **Emergency**: emergency@lodgetix.io
- **Business Hours**: Standard Australian business hours

### Compliance Issues
- **Immediate**: Contact legal team immediately
- **Documentation**: Preserve all relevant documentation
- **Cooperation**: Full cooperation with regulatory authorities

## Testing and Validation

### Component Testing

```bash
# Test legal components
npm run test:legal

# Test accessibility
npm run test:a11y components/legal-pages/

# Test mobile compatibility
npm run test:mobile legal-pages
```

### Legal Validation

1. **Content Review**: Legal team content validation
2. **Compliance Check**: Regulatory compliance verification
3. **User Testing**: Usability testing with real organisers
4. **Accessibility Audit**: WCAG compliance verification

## Change Log

### Version 1.0.0 (Current)
- Initial comprehensive Event Organiser Terms
- Stripe Connect compliance integration
- Australian regulatory compliance
- Masonic-specific requirements
- User-friendly summary component

---

**Important**: These components contain legally binding terms. Any changes must be reviewed by qualified legal counsel and approved by appropriate stakeholders before implementation.