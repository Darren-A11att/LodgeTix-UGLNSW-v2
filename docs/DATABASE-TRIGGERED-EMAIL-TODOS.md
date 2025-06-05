# Database-Triggered Email System - Implementation TODOs

## Phase 1: Infrastructure Setup (Priority: High)

### Edge Function Setup
- [ ] Create `supabase/functions/generate-confirmation` directory structure
- [ ] Initialize `generate-confirmation` function with deno.json config
- [ ] Add dependencies (supabase-js, date-fns)
- [ ] Create types for webhook payload and responses
- [ ] Set up error handling utilities

### Configuration
- [ ] Document required environment variables
- [ ] Create development environment setup guide
- [ ] Configure webhook secret for security
- [ ] Set up logging infrastructure

## Phase 2: Core Development (Priority: High)

### Confirmation Number Generation
- [ ] Create confirmation number generator utility
- [ ] Implement pattern: [TYPE][YEAR][MONTH][RANDOM]
- [ ] Add uniqueness validation against database
- [ ] Create retry logic for collision handling
- [ ] Add confirmation number formatting tests

### Edge Function Logic
- [ ] Create main webhook handler function
- [ ] Implement webhook payload validation
- [ ] Add database update logic for confirmation number
- [ ] Implement email type determination logic
- [ ] Create email invocation orchestrator

### Email Orchestration
- [ ] Implement individual registration email logic
- [ ] Implement lodge registration email logic
- [ ] Implement delegation registration email logic
- [ ] Add attendee preference analysis
- [ ] Create batch email invocation handler

## Phase 3: Database Integration (Priority: High)

### Database Webhook
- [ ] Create webhook configuration SQL script
- [ ] Add webhook to registrations table
- [ ] Configure webhook conditions and filters
- [ ] Test webhook triggering locally
- [ ] Add webhook signature validation

### Database Constraints
- [ ] Add unique constraint on confirmation_number
- [ ] Create index on confirmation_number for lookups
- [ ] Add check constraint for confirmation format
- [ ] Update RLS policies if needed

## Phase 4: Error Handling & Resilience (Priority: Medium)

### Error Management
- [ ] Implement comprehensive error logging
- [ ] Create error categorization (retriable vs fatal)
- [ ] Add dead letter queue for failed emails
- [ ] Implement circuit breaker for email service
- [ ] Create manual retry mechanism

### Monitoring
- [ ] Add performance metrics collection
- [ ] Create success/failure tracking
- [ ] Implement alerting for failures
- [ ] Add dashboard queries for monitoring
- [ ] Set up Sentry error tracking

## Phase 5: Testing (Priority: High)

### Unit Tests
- [ ] Test confirmation number generation
- [ ] Test uniqueness validation
- [ ] Test email type determination
- [ ] Test error handling paths
- [ ] Test webhook validation

### Integration Tests
- [ ] Test database trigger flow
- [ ] Test email invocation
- [ ] Test concurrent registrations
- [ ] Test failure scenarios
- [ ] Test retry mechanisms

### End-to-End Tests
- [ ] Test complete payment to email flow
- [ ] Test all registration types
- [ ] Test edge cases (no attendees, etc)
- [ ] Load test with multiple registrations
- [ ] Test in staging environment

## Phase 6: Deployment (Priority: High)

### Staging Deployment
- [ ] Deploy edge function to staging
- [ ] Configure staging webhook
- [ ] Run test registrations
- [ ] Verify email delivery
- [ ] Monitor for 24 hours

### Production Deployment
- [ ] Create deployment checklist
- [ ] Deploy edge function to production
- [ ] Enable webhook with feature flag
- [ ] Gradual rollout (10%, 50%, 100%)
- [ ] Monitor metrics closely

## Phase 7: Migration & Cleanup (Priority: Medium)

### Code Cleanup
- [ ] Remove email invocation from post-payment-service
- [ ] Remove sendEmail parameter from interfaces
- [ ] Update documentation
- [ ] Remove deprecated email code
- [ ] Update API documentation

### Verification
- [ ] Audit last 100 registrations for emails
- [ ] Verify no manual triggers needed
- [ ] Check error logs for issues
- [ ] Confirm performance improvements
- [ ] Document lessons learned

## Phase 8: Documentation (Priority: Medium)

### Technical Documentation
- [ ] Document edge function architecture
- [ ] Create troubleshooting guide
- [ ] Document monitoring procedures
- [ ] Add runbook for common issues
- [ ] Update system architecture diagram

### Operational Documentation
- [ ] Create email delivery SLA
- [ ] Document support procedures
- [ ] Create customer FAQ for emails
- [ ] Update team training materials
- [ ] Document rollback procedure

## Phase 9: Future Enhancements (Priority: Low)

### Improvements
- [ ] Add email preview functionality
- [ ] Implement template versioning
- [ ] Add customer email preferences
- [ ] Create email analytics dashboard
- [ ] Add A/B testing capability

### Performance
- [ ] Optimize database queries
- [ ] Implement caching where appropriate
- [ ] Add connection pooling
- [ ] Profile and optimize hot paths
- [ ] Consider moving to queue-based system

## Success Criteria Checklist
- [ ] All completed registrations have confirmation numbers
- [ ] Emails sent within 30 seconds of payment
- [ ] Zero manual email triggers in production
- [ ] 99.9% email delivery success rate
- [ ] No increase in payment processing time
- [ ] Clean removal of old email code
- [ ] Comprehensive monitoring in place
- [ ] Team trained on new system

## Rollback Plan
1. [ ] Disable database webhook
2. [ ] Re-enable manual email triggers
3. [ ] Deploy hotfix to post-payment-service
4. [ ] Investigate and fix issues
5. [ ] Plan improved deployment