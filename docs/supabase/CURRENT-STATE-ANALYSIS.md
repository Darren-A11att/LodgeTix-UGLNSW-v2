# LodgeTix UGLNSW - Current State Analysis

## Executive Summary

This document provides a comprehensive analysis of the current implementation state of the LodgeTix UGLNSW project, identifying what's already built versus what needs to be created or enhanced.

## ✅ What's Already Implemented

### 1. Core Financial Infrastructure

**Fee Calculation System** (`/lib/utils/stripe-fee-calculator.ts`)
- Complete Stripe fee calculation with domestic/international rates
- Platform fee calculation (2% capped at $20)
- Geolocation-based fee determination
- Comprehensive validation and testing
- Fee display components for UI transparency

**Database Schema**
- All financial fields exist: `booking_contact_id`, `connected_account_id`, `platform_fee_amount`
- Organisation table with `stripe_onbehalfof` for Stripe Connect
- RLS policies for secure organisation management
- Complete migration history

**Backend RPC Functions**
- `upsert_lodge_registration` accepts connected account ID
- Proper financial field handling
- Return values include all necessary data for payment processing

**API Routes**
- Lodge registration API fully supports Stripe Connect parameters
- Payment intent creation with correct fee calculations
- Proper error handling and validation

### 2. Edge Functions

**Existing Functions**
- `generate-attendee-qr` - QR code generation for attendees
- `generate-confirmation` - Confirmation number generation
- `generate-ticket-qr` - QR code generation for tickets
- `send-confirmation-email` - Email sending functionality
- `send-email` - Generic email sending service

**Infrastructure**
- Basic Supabase configuration (`config.toml`)
- Function directory structure
- Deno runtime configuration files

### 3. Frontend Components

**Payment Display**
- `OrderSummaryWithFees` component shows processing fees
- Fee breakdown with tooltips
- Conditional display based on fee mode

**Registration Flow**
- Complete lodge registration form
- Package selection with fee calculations
- Attendee management
- Basic payment processing

## ❌ What's Missing

### 1. Frontend Stripe Connect Integration

**Organisation Management**
- No organisation selection UI in lodge registration
- No organisation creation flow
- Connected account ID not captured from frontend
- Missing link between organisation and payment

**Required Components**
- `OrganisationSelector` - Dropdown to select/create organisations
- `CreateOrganisationModal` - Form to create new organisations
- Registration store updates to track organisation/connected account
- Payment step integration with connected account ID

### 2. Edge Functions Development Infrastructure

**Local Development**
- No documented local development setup
- Missing hot reload configuration
- No debugging setup for edge functions
- Limited testing capabilities

**CI/CD Pipeline**
- No automated deployment for edge functions
- No GitHub Actions workflow
- Manual deployment process
- No environment management

**Documentation**
- Missing development guide for edge functions
- No deployment procedures
- No troubleshooting documentation
- Limited examples and patterns

### 3. Monitoring & Operations

**Edge Functions**
- No health check endpoints
- No performance monitoring
- No error tracking
- No rollback procedures

**Stripe Connect**
- No onboarding status tracking
- Missing reconciliation tools
- No dashboard for financial overview

## 🔄 What Needs Enhancement

### 1. Registration Flow

**Current**: Lodge registration works but doesn't capture organisation
**Enhancement**: Add organisation selection step after lodge selection

**Current**: Payment processes without Stripe Connect
**Enhancement**: Pass connected account ID to enable automatic transfers

### 2. Edge Functions

**Current**: Functions exist but difficult to develop/test
**Enhancement**: Add local development environment with hot reload

**Current**: Manual deployment only
**Enhancement**: Implement CI/CD pipeline with GitHub Actions

### 3. Documentation

**Current**: Basic project documentation
**Enhancement**: Comprehensive guides for edge functions and Stripe Connect

## Implementation Priority

### Priority 1: Frontend Stripe Connect (1-2 weeks)
1. Create organisation selection components
2. Update registration store
3. Integrate with payment flow
4. Test end-to-end

### Priority 2: Edge Functions Infrastructure (2-3 weeks)
1. Set up local development environment
2. Create CI/CD pipeline
3. Write comprehensive documentation
4. Migrate existing functions

### Priority 3: Monitoring & Polish (1 week)
1. Add health checks
2. Implement error tracking
3. Create operational dashboards
4. Performance optimization

## Technical Debt

### Current Issues
1. Manual edge function deployments
2. No organisation management UI
3. Limited testing coverage for edge functions
4. Missing operational visibility

### Recommended Solutions
1. Automate all deployments
2. Build comprehensive organisation features
3. Add testing framework for edge functions
4. Implement monitoring stack

## Resource Requirements

### Frontend Development
- 40 hours for Stripe Connect integration
- 20 hours for testing and polish

### Infrastructure Development  
- 80 hours for edge functions setup
- 30 hours for documentation

### Total Estimate
- 170 hours (4-5 weeks with 1-2 developers)

## Conclusion

The core business logic and database infrastructure are solid and working. The main gaps are:

1. **Frontend Integration**: Organisation selection for Stripe Connect
2. **Developer Experience**: Edge functions local development and CI/CD
3. **Operations**: Monitoring and visibility tools

These enhancements will complete the platform's capabilities and improve developer productivity significantly.