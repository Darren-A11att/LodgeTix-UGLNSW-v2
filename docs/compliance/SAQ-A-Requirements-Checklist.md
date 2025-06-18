# PCI DSS SAQ-A Requirements Checklist - LodgeTix UGLNSW

## Self-Assessment Questionnaire A (SAQ-A) Overview

**SAQ-A** is for merchants who have **fully outsourced** all cardholder data functions to PCI DSS validated third-party service providers, with no electronic storage, processing, or transmission of cardholder data on the merchant's systems or premises.

### SAQ-A Eligibility Criteria ✅

Your system **qualifies for SAQ-A** because:

- ✅ All payment processing is outsourced to Stripe (PCI DSS Level 1 compliant)
- ✅ No cardholder data is stored, processed, or transmitted by your systems
- ✅ Payment card data is only entered on Stripe's secure payment pages
- ✅ No cardholder data is retained on your servers or databases

## SAQ-A Requirements Checklist

### Requirement 2: Apply Secure Configurations to All System Components

**2.1** - Document and implement secure configuration standards
- [ ] **Action Required**: Document server and application configuration standards
- [ ] **Current Status**: Needs documentation
- [ ] **Evidence**: Configuration management documentation

**2.2** - Change vendor-supplied defaults before installing systems
- ✅ **Current Status**: COMPLIANT - Using secure defaults for all systems
- ✅ **Evidence**: No default passwords in use

### Requirement 6: Develop and Maintain Secure Systems and Software

**6.1** - Manage vulnerabilities
- [ ] **Action Required**: Implement vulnerability management process
- [ ] **Current Status**: Needs formal process
- [ ] **Evidence**: Vulnerability scanning reports, patch management records

**6.2** - Ensure all system components are protected from known vulnerabilities
- ✅ **Current Status**: COMPLIANT - Dependencies managed via package.json
- ✅ **Evidence**: Regular npm audit, Dependabot updates

**6.3** - Develop software in accordance with PCI DSS and secure coding practices
- ✅ **Current Status**: COMPLIANT - Secure coding practices in use
- ✅ **Evidence**: Code uses Stripe APIs, no direct card handling

### Requirement 8: Identify Users and Authenticate Access to System Components

**8.1** - Define and document access control
- [ ] **Action Required**: Document access control policies
- [ ] **Current Status**: Needs documentation
- [ ] **Evidence**: User access management procedures

**8.2** - Authenticate all access to system components
- ✅ **Current Status**: COMPLIANT - Authentication required for all admin access
- ✅ **Evidence**: GitHub/deployment authentication

**8.3** - Implement strong authentication for all access
- ✅ **Current Status**: COMPLIANT - Strong passwords and 2FA where available
- ✅ **Evidence**: GitHub 2FA, strong deployment credentials

### Requirement 9: Protect Stored Cardholder Data

**9.1-9.4** - Physical access controls
- ✅ **Current Status**: NOT APPLICABLE - No cardholder data stored
- ✅ **Evidence**: Stripe handles all cardholder data storage

### Requirement 10: Log and Monitor All Access to System Resources and Cardholder Data

**10.1** - Implement audit logging
- [ ] **Action Required**: Enhance logging and monitoring
- [ ] **Current Status**: Basic application logging in place
- [ ] **Evidence**: Application logs, access logs

**10.2** - Automate audit log collection
- [ ] **Action Required**: Implement automated log collection
- [ ] **Current Status**: Manual log review
- [ ] **Evidence**: Log aggregation system

### Requirement 11: Test Security of Systems and Network Regularly

**11.1** - Test network security
- [ ] **Action Required**: Regular security scanning
- [ ] **Current Status**: Ad-hoc testing only
- [ ] **Evidence**: Vulnerability scan reports

**11.2** - Monitor and test networks
- [ ] **Action Required**: Network monitoring implementation
- [ ] **Current Status**: Basic monitoring
- [ ] **Evidence**: Network monitoring reports

### Requirement 12: Support Information Security with Organizational Policies and Programs

**12.1** - Establish information security policy
- [ ] **Action Required**: Create formal security policy
- [ ] **Current Status**: Informal practices
- [ ] **Evidence**: Written information security policy

**12.2** - Implement risk assessment process
- [ ] **Action Required**: Formal risk assessment
- [ ] **Current Status**: Informal risk management
- [ ] **Evidence**: Risk assessment documentation

**12.3** - Develop usage policies for critical technologies
- [ ] **Action Required**: Technology usage policies
- [ ] **Current Status**: Needs documentation
- [ ] **Evidence**: Usage policy documentation

**12.4** - Ensure security responsibilities are defined
- [ ] **Action Required**: Define security roles and responsibilities
- [ ] **Current Status**: Informal assignments
- [ ] **Evidence**: Role definition documentation

**12.5** - Assign information security responsibilities
- [ ] **Action Required**: Formally assign security responsibilities
- [ ] **Current Status**: Informal assignments
- [ ] **Evidence**: Assignment documentation

**12.6** - Implement security awareness program
- [ ] **Action Required**: Security training program
- [ ] **Current Status**: Ad-hoc training
- [ ] **Evidence**: Training records

**12.8** - Maintain information about service providers
- ✅ **Current Status**: COMPLIANT - Stripe relationship documented
- ✅ **Evidence**: Stripe service agreement and PCI compliance documentation

**12.9** - Service providers acknowledge responsibility
- ✅ **Current Status**: COMPLIANT - Stripe is PCI DSS Level 1 compliant
- ✅ **Evidence**: Stripe's AOC (Attestation of Compliance)

## Implementation Priority Matrix

### High Priority (Complete First)
1. **Requirement 12.1** - Information security policy
2. **Requirement 8.1** - Access control documentation  
3. **Requirement 2.1** - Configuration standards
4. **Requirement 12.4** - Security responsibilities

### Medium Priority
1. **Requirement 6.1** - Vulnerability management
2. **Requirement 10.1** - Audit logging enhancement
3. **Requirement 12.2** - Risk assessment process
4. **Requirement 12.6** - Security awareness program

### Lower Priority (Can be phased)
1. **Requirement 11.1** - Network security testing
2. **Requirement 10.2** - Automated log collection
3. **Requirement 11.2** - Network monitoring

## Completion Timeline

| Week | Activities | Deliverables |
|------|------------|--------------|
| Week 1 | Requirements 12.1, 8.1, 2.1 | Security policies, access controls |
| Week 2 | Requirements 12.4, 6.1 | Role definitions, vulnerability process |
| Week 3 | Requirements 10.1, 12.2 | Enhanced logging, risk assessment |
| Week 4 | Requirements 12.6, 11.1 | Training program, security testing |

## Evidence Collection

### Documents Required for SAQ-A Submission
1. **Completed SAQ-A questionnaire**
2. **Attestation of Compliance (AOC)**
3. **Information Security Policy**
4. **Risk Assessment Documentation**
5. **Vulnerability Management Process**
6. **Access Control Procedures**
7. **Security Training Records**
8. **Stripe PCI Compliance Documentation**

### Technical Evidence
1. **Network diagram** showing payment flows
2. **Code review documentation** showing secure practices
3. **Vulnerability scan reports**
4. **Configuration documentation**
5. **Access logs and monitoring reports**

## SAQ-A Submission Process

1. **Complete Questionnaire** - Answer all SAQ-A questions
2. **Gather Evidence** - Collect supporting documentation
3. **Executive Sign-off** - Obtain management approval
4. **Submit AOC** - File with acquiring bank/payment processor
5. **Annual Review** - Schedule next year's assessment

## Maintenance Schedule

| Frequency | Activity | Responsible |
|-----------|----------|-------------|
| Monthly | Vulnerability scans | IT Team |
| Quarterly | Security policy review | Security Officer |
| Annually | Complete SAQ-A | Compliance Team |
| As needed | Security training | HR/IT Team |

## Resources and Tools

### Official PCI DSS Resources
- [PCI Security Standards Council](https://www.pcisecuritystandards.org/)
- [SAQ-A Download](https://www.pcisecuritystandards.org/documents/SAQ_A_v4-0.pdf)
- [PCI DSS Quick Reference](https://www.pcisecuritystandards.org/documents/PCI_DSS-QRG-v3_2_1.pdf)

### Implementation Tools
- Vulnerability scanning: OpenVAS, Nessus, or Qualys
- Log management: ELK Stack, Splunk, or DataDog
- Documentation: Confluence, Notion, or SharePoint
- Policy templates: SANS, NIST frameworks

---

*This checklist is based on PCI DSS v4.0.1 SAQ-A requirements. Regular updates should be made as standards evolve.*