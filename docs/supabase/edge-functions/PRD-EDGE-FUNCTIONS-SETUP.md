# PRD: Edge Functions Development & Deployment Setup

## Executive Summary

This PRD outlines the implementation of a comprehensive development and deployment infrastructure for Supabase Edge Functions in the LodgeTix UGLNSW project. The goal is to establish a professional, scalable workflow that enables rapid development, thorough testing, and reliable deployment of serverless functions.

## Problem Statement

### Current State

**Existing Edge Functions:**
- `generate-attendee-qr` - QR code generation for attendees
- `generate-confirmation` - Confirmation number generation  
- `generate-ticket-qr` - QR code generation for tickets
- `send-confirmation-email` - Email sending functionality
- `send-email` - Generic email sending service (newly created)

**Infrastructure Gaps:**
- No automated testing framework for edge functions
- Manual deployment process prone to errors
- Lack of CI/CD pipeline for function deployments
- Missing comprehensive development documentation
- No environment-specific configuration management
- Limited local development capabilities

**What Already Works:**
- ✅ Core business logic (fee calculations, Stripe integration)
- ✅ Database schema and RPC functions fully support financial operations
- ✅ Basic edge function structure exists
- ✅ Supabase project configuration in place

### Impact
- Slow development cycle (30+ minutes per change)
- High risk of production errors in edge functions
- Difficult onboarding for new developers to edge functions
- Inconsistent deployment practices
- Limited visibility into function performance
- No rollback capabilities for function deployments

## Proposed Solution

### Overview
Implement a complete edge functions infrastructure including:
1. Local development environment with hot reload
2. Automated testing framework
3. CI/CD pipeline via GitHub Actions
4. Comprehensive documentation
5. Environment management strategy
6. Monitoring and debugging tools

### Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Local Dev      │ --> │  GitHub Actions │ --> │  Production     │
│  Environment    │     │  CI/CD Pipeline │     │  Edge Network   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        ↓                        ↓                        ↓
   Deno + Docker           Testing + Deploy         Global CDN
```

## Detailed Requirements

### 1. Local Development Environment

**Functional Requirements:**
- FR1.1: Install and configure Deno runtime locally
- FR1.2: Set up VSCode with Deno extension for TypeScript support
- FR1.3: Enable hot reload for function development
- FR1.4: Local secrets management via .env files
- FR1.5: Docker-based Supabase stack integration

**Non-Functional Requirements:**
- NFR1.1: Function changes reflect in <2 seconds
- NFR1.2: Support for debugging with breakpoints
- NFR1.3: TypeScript intellisense and type checking
- NFR1.4: Consistent environment across team members

### 2. Testing Framework

**Functional Requirements:**
- FR2.1: Unit testing with Deno's built-in test runner
- FR2.2: Integration testing against local Supabase
- FR2.3: Mock external service dependencies
- FR2.4: Test coverage reporting
- FR2.5: Automated test execution in CI

**Non-Functional Requirements:**
- NFR2.1: Tests complete in <30 seconds
- NFR2.2: Minimum 80% code coverage
- NFR2.3: Clear test output and error messages
- NFR2.4: Parallel test execution support

### 3. CI/CD Pipeline

**Functional Requirements:**
- FR3.1: GitHub Actions workflow for automated deployment
- FR3.2: Deploy on merge to main branch
- FR3.3: Preview deployments for pull requests
- FR3.4: Automated testing before deployment
- FR3.5: Rollback capabilities

**Non-Functional Requirements:**
- NFR3.1: Deployment completes in <5 minutes
- NFR3.2: Zero-downtime deployments
- NFR3.3: Audit trail of all deployments
- NFR3.4: Notification on deployment status

### 4. Environment Management

**Functional Requirements:**
- FR4.1: Separate configurations for local/staging/production
- FR4.2: Environment-specific secrets management
- FR4.3: Consistent function behavior across environments
- FR4.4: Environment promotion workflow

**Non-Functional Requirements:**
- NFR4.1: No secrets in version control
- NFR4.2: Quick environment switching (<10 seconds)
- NFR4.3: Clear environment indicators
- NFR4.4: Fail-safe production deployments

### 5. Documentation

**Functional Requirements:**
- FR5.1: Step-by-step development guide
- FR5.2: Deployment procedures
- FR5.3: Troubleshooting guide
- FR5.4: Function templates and examples
- FR5.5: Architecture decisions record

**Non-Functional Requirements:**
- NFR5.1: Documentation stays in sync with code
- NFR5.2: Clear examples for common patterns
- NFR5.3: Searchable and well-organized
- NFR5.4: Beginner-friendly explanations

## Success Metrics

### Development Velocity
- **Current**: 30-45 minutes per function change
- **Target**: 5-10 minutes per function change
- **Measurement**: Time from code change to tested deployment

### Deployment Reliability
- **Current**: ~70% successful deployments
- **Target**: >95% successful deployments
- **Measurement**: GitHub Actions success rate

### Developer Satisfaction
- **Current**: Unknown (no measurement)
- **Target**: >4/5 developer satisfaction score
- **Measurement**: Quarterly developer survey

### Time to Onboard
- **Current**: 2-3 days for new developer
- **Target**: <4 hours for new developer
- **Measurement**: Time to first successful function deployment

### Production Incidents
- **Current**: ~2-3 per month from edge functions
- **Target**: <1 per month
- **Measurement**: Incident tracking system

## Implementation Plan

### Phase 1: Foundation (Week 1)
1. Install Deno and configure development environment
2. Set up VSCode with extensions
3. Create initial documentation structure
4. Configure local secrets management

### Phase 2: Development Workflow (Week 1-2)
1. Implement hot reload setup
2. Create function templates
3. Set up debugging configuration
4. Write development guide

### Phase 3: Testing Framework (Week 2)
1. Configure Deno test runner
2. Create test utilities and mocks
3. Write tests for existing functions
4. Set up coverage reporting

### Phase 4: CI/CD Pipeline (Week 2-3)
1. Create GitHub Actions workflow
2. Configure deployment secrets
3. Implement staging deployments
4. Add production safeguards

### Phase 5: Documentation & Training (Week 3)
1. Complete all documentation
2. Create video tutorials
3. Conduct team training
4. Gather feedback and iterate

## Risk Analysis

### Technical Risks

**Risk 1: Deno Learning Curve**
- **Impact**: High - Developers unfamiliar with Deno
- **Mitigation**: Comprehensive training, clear examples
- **Owner**: Tech Lead

**Risk 2: Breaking Existing Functions**
- **Impact**: Critical - Production outage
- **Mitigation**: Thorough testing, staged rollout
- **Owner**: DevOps Team

**Risk 3: CI/CD Complexity**
- **Impact**: Medium - Delayed implementation
- **Mitigation**: Start simple, iterate
- **Owner**: DevOps Team

### Operational Risks

**Risk 4: Secret Exposure**
- **Impact**: Critical - Security breach
- **Mitigation**: Secret scanning, access controls
- **Owner**: Security Team

**Risk 5: Adoption Resistance**
- **Impact**: Medium - Slow adoption
- **Mitigation**: Clear benefits communication, training
- **Owner**: Engineering Manager

## Dependencies

### External Dependencies
1. Deno runtime (v1.40+)
2. Docker Desktop
3. Supabase CLI (latest)
4. GitHub Actions

### Internal Dependencies
1. Existing edge functions migration
2. Team training availability
3. GitHub repository access
4. Supabase project credentials

## Alternatives Considered

### Alternative 1: Vercel Functions
- **Pros**: Familiar to team, good Next.js integration
- **Cons**: Vendor lock-in, separate deployment
- **Decision**: Rejected - Stay with Supabase ecosystem

### Alternative 2: AWS Lambda
- **Pros**: Mature, extensive features
- **Cons**: Complex setup, higher learning curve
- **Decision**: Rejected - Overcomplicated for needs

### Alternative 3: Manual Deployment Only
- **Pros**: Simple, no new tools
- **Cons**: Error-prone, slow, no automation
- **Decision**: Rejected - Doesn't solve core problems

## Budget & Resources

### Time Investment
- Development: 80 hours
- Documentation: 20 hours
- Training: 10 hours
- **Total**: 110 hours

### Tool Costs
- Deno: Free
- GitHub Actions: Free (within limits)
- Supabase: Existing subscription
- **Total**: $0 additional cost

### Team Allocation
- Lead Developer: 50% for 3 weeks
- DevOps Engineer: 25% for 3 weeks
- Technical Writer: 20% for 1 week

## Future Enhancements

### Phase 2 Improvements
1. Advanced monitoring and alerting
2. Performance optimization tools
3. A/B testing framework
4. Cost optimization strategies

### Long-term Vision
1. Automated performance testing
2. Canary deployments
3. Multi-region deployment
4. GraphQL edge functions

## Approval & Sign-off

### Stakeholders
- Engineering Manager: [Approval Pending]
- Tech Lead: [Approval Pending]
- DevOps Lead: [Approval Pending]
- Product Manager: [Approval Pending]

### Review Schedule
- Initial Review: [Date]
- Final Approval: [Date]
- Implementation Start: [Date]

## Appendix

### A. Existing Functions Inventory
1. `generate-attendee-qr` - QR code generation
2. `generate-confirmation` - Confirmation numbers
3. `generate-ticket-qr` - Ticket QR codes
4. `send-confirmation-email` - Email notifications

### B. Technology Decisions
- **Runtime**: Deno (Supabase standard)
- **Language**: TypeScript
- **Testing**: Deno test runner
- **CI/CD**: GitHub Actions
- **Monitoring**: Supabase Dashboard + Sentry

### C. Success Criteria Checklist
- [ ] All developers can run functions locally
- [ ] Automated tests for all functions
- [ ] CI/CD pipeline operational
- [ ] Zero manual deployment steps
- [ ] Complete documentation available
- [ ] Team trained and confident
- [ ] Monitoring and alerting active
- [ ] Rollback procedure tested