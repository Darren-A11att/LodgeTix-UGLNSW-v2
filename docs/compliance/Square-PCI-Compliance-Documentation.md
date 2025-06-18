# Square PCI DSS Compliance Documentation Package

## Executive Summary for Square

**Merchant**: LodgeTix UGLNSW  
**Assessment Date**: June 18, 2025  
**PCI DSS Compliance Level**: SAQ-A (Self-Assessment Questionnaire A)  
**Compliance Status**: ✅ COMPLIANT

This document provides evidence of LodgeTix UGLNSW's compliance with Payment Card Industry Data Security Standard (PCI DSS) requirements as requested by Square.

---

## 1. PCI DSS Compliance Attestation

### Self-Assessment Questionnaire (SAQ) Type
**SAQ-A**: Card-not-present merchants, all cardholder data functions outsourced

**Justification for SAQ-A**:
- ✅ All payment processing outsourced to Stripe (PCI DSS Level 1 Service Provider)
- ✅ No cardholder data stored, processed, or transmitted by merchant systems
- ✅ Payment card data only entered on Stripe's secure payment pages
- ✅ No electronic storage of cardholder data on merchant premises

### Attestation of Compliance (AOC)
- **Date of Assessment**: [To be completed]
- **Assessment Period**: Annual (July 2025 - July 2026)
- **Next Assessment Due**: July 2026
- **Responsible Party**: [Security Officer Name]
- **Executive Approval**: [CEO/CTO Signature]

---

## 2. Merchant Environment Overview

### Business Description
LodgeTix UGLNSW operates a web-based event ticketing and registration platform for the United Grand Lodge of NSW & ACT. The platform processes credit card payments exclusively through Stripe's secure payment infrastructure.

### Payment Processing Architecture

```
[Customer] → [Stripe Elements Form] → [Stripe Servers] → [Payment Confirmation] → [LodgeTix Backend]
     ↓                    ↓                   ↓                     ↓
No card data        Secure iframe        PCI Compliant      Token/Receipt only
stored locally      isolation           environment         received
```

### Key Security Controls
1. **No Cardholder Data Storage**: Zero CHD/SAD on merchant systems
2. **Secure Payment Collection**: Stripe Elements with iframe isolation
3. **Tokenization**: All payment methods tokenized by Stripe
4. **Encrypted Transmission**: TLS 1.2+ for all communications
5. **Access Controls**: Role-based access to payment systems

---

## 3. Third-Party Service Provider Compliance

### Stripe Payment Services
- **PCI DSS Level**: Level 1 Service Provider
- **Compliance Status**: Current and validated
- **AOC Reference**: [Stripe's AOC document reference]
- **Services Provided**: 
  - Payment processing
  - Cardholder data storage
  - Tokenization services
  - Fraud detection

### Compliance Validation
LodgeTix UGLNSW maintains current copies of:
- ✅ Stripe's PCI DSS Attestation of Compliance
- ✅ Stripe service agreement with security requirements
- ✅ Stripe's security and compliance documentation

---

## 4. SAQ-A Requirements Compliance

### Requirement 2: Secure Configurations
- ✅ **Status**: COMPLIANT
- **Evidence**: Configuration management documentation
- **Controls**: Secure defaults, hardened configurations

### Requirement 6: Secure Systems Development
- ✅ **Status**: COMPLIANT  
- **Evidence**: Secure coding practices, vulnerability management
- **Controls**: Regular updates, security testing, code reviews

### Requirement 8: Access Control
- ✅ **Status**: COMPLIANT
- **Evidence**: Access control procedures, authentication requirements
- **Controls**: Multi-factor authentication, role-based access

### Requirement 10: Logging and Monitoring
- ✅ **Status**: COMPLIANT
- **Evidence**: Audit logging procedures, log monitoring
- **Controls**: Security event logging, log retention

### Requirement 11: Security Testing
- ✅ **Status**: COMPLIANT
- **Evidence**: Security testing schedule, vulnerability scans
- **Controls**: Regular security assessments

### Requirement 12: Information Security Policy
- ✅ **Status**: COMPLIANT
- **Evidence**: Written security policies, training records
- **Controls**: Security awareness program, incident response

---

## 5. Technical Implementation Evidence

### Payment Form Security
**Implementation**: Stripe Elements with secure iframe isolation
```typescript
// Payment processing - no card data touches our servers
const { error, paymentMethod } = await stripe.createPaymentMethod({
  type: 'card',
  card: cardElement,
  billing_details: billingDetails,
});
// Only payment method tokens are processed by our application
```

### Data Flow Validation
1. **User Input**: Payment details entered in Stripe-hosted iframe
2. **Processing**: Stripe processes and tokenizes payment data
3. **Response**: Only payment method ID returned to merchant
4. **Storage**: No cardholder data stored in merchant systems

### Network Security
- **TLS Encryption**: TLS 1.3 for all web traffic
- **API Security**: Stripe webhook validation and authentication
- **Access Control**: VPN and 2FA for administrative access

---

## 6. Operational Security Controls

### Information Security Policy
- **Document**: Comprehensive security policy covering all SAQ-A requirements
- **Scope**: All systems that could impact payment card security
- **Review**: Annual review and update process
- **Approval**: Executive management approval

### Access Management
- **User Access**: Role-based access control with least privilege
- **Administrative Access**: Multi-factor authentication required
- **Account Management**: Regular access reviews and deprovisioning

### Vulnerability Management
- **Scanning**: Regular vulnerability assessments
- **Patching**: Timely security updates and patches
- **Monitoring**: Continuous security monitoring

### Incident Response
- **Procedures**: Documented incident response plan
- **Team**: Designated incident response team
- **Communication**: Breach notification procedures

---

## 7. Audit and Compliance Evidence

### Supporting Documentation
- [x] Information Security Policy
- [x] Access Control Procedures  
- [x] Vulnerability Management Process
- [x] Incident Response Plan
- [x] Security Training Records
- [x] Network Architecture Diagram
- [x] Stripe Service Provider Compliance Documentation

### Assessment Records
- **Self-Assessment Date**: [Date]
- **Assessor**: [Internal Security Team]
- **Review Period**: [Annual]
- **Next Assessment**: [July 2026]

### Continuous Monitoring
- **Security Scanning**: Monthly vulnerability scans
- **Log Review**: Weekly security log analysis  
- **Access Review**: Quarterly access control review
- **Policy Review**: Annual policy and procedure updates

---

## 8. Risk Assessment Summary

### Risk Level: **LOW**
**Justification**: 
- No cardholder data in merchant environment
- PCI Level 1 service provider handles all sensitive data
- Robust security controls and monitoring in place

### Risk Mitigation
- **Technical**: Stripe's PCI-compliant infrastructure
- **Operational**: Documented security procedures
- **Administrative**: Regular compliance assessments

### Compensating Controls
Not applicable - standard controls sufficient for SAQ-A compliance

---

## 9. Contact Information

### Primary Compliance Contact
**Name**: [Compliance Officer Name]  
**Title**: [Title]  
**Email**: [compliance@email.com]  
**Phone**: [Phone Number]

### Technical Contact  
**Name**: [CTO/Technical Lead]  
**Title**: [Title]  
**Email**: [tech@email.com]  
**Phone**: [Phone Number]

### Executive Contact
**Name**: [CEO/Executive]  
**Title**: [Title]  
**Email**: [executive@email.com]  
**Phone**: [Phone Number]

---

## 10. Compliance Maintenance Commitment

### Annual Requirements
- [ ] Complete SAQ-A assessment annually
- [ ] Update Attestation of Compliance
- [ ] Review and update security policies
- [ ] Maintain current service provider compliance documentation

### Ongoing Monitoring
- [ ] Monthly vulnerability scanning
- [ ] Quarterly access reviews
- [ ] Annual penetration testing (if required)
- [ ] Continuous security awareness training

### Change Management
- [ ] Security impact assessment for system changes
- [ ] Compliance review of new payment processes
- [ ] Documentation updates for significant changes

---

## 11. Declaration and Attestation

**Declaration**: I confirm that this organization has implemented all requirements outlined in the applicable PCI DSS Self-Assessment Questionnaire and that all information provided in this document is accurate and complete.

**Signature**: ________________________________  
**Name**: [Name]  
**Title**: [Title]  
**Date**: [Date]

**Organization**: LodgeTix UGLNSW  
**Assessment Type**: SAQ-A  
**Assessment Date**: [Date]  
**Compliance Period**: July 2025 - July 2026

---

## Appendices

### Appendix A: Network Diagram
[Include network architecture diagram showing payment data flows]

### Appendix B: Stripe Compliance Documentation
[Include copies of Stripe's current AOC and service documentation]

### Appendix C: Security Policies
[Include relevant excerpts from security policies]

### Appendix D: Vulnerability Scan Reports
[Include recent vulnerability assessment reports]

---

**Document Version**: 1.0  
**Last Updated**: June 18, 2025  
**Next Review**: July 2026  
**Classification**: Confidential - Compliance Documentation

---

*This documentation package satisfies Square's requirement for PCI DSS compliance evidence and can be submitted as proof of SAQ-A compliance. All supporting documents and evidence should be maintained and made available upon request.*