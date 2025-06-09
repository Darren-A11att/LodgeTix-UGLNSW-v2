# LodgeTix UGLNSW - Implementation Roadmap

## Overview

Based on the current state analysis, this roadmap outlines the practical steps to complete the platform's missing features. The focus is on two main areas: Frontend Stripe Connect integration and Edge Functions infrastructure.

## Phase 1: Frontend Stripe Connect Integration (Week 1-2)

### Week 1: Organisation Components

**Day 1-2: Create Organisation Selector**
```typescript
// Components to build:
- OrganisationSelector.tsx
- OrganisationCard.tsx
- OrganisationDropdown.tsx
```

**Day 3-4: Create Organisation Modal**
```typescript
// Components to build:
- CreateOrganisationModal.tsx
- OrganisationForm.tsx
- ABNValidator.tsx
```

**Day 5: Integration**
- Add to LodgesForm.tsx
- Update registration store
- Test organisation flow

### Week 2: Payment Integration

**Day 1-2: Store Updates**
- Add organisationId and connectedAccountId to store
- Create organisation hooks
- Update type definitions

**Day 3-4: Payment Flow**
- Pass connectedAccountId to payment
- Update confirmation display
- Test Stripe Connect transfers

**Day 5: End-to-End Testing**
- Full registration flow testing
- Edge case handling
- Performance optimization

## Phase 2: Edge Functions Infrastructure (Week 3-5)

### Week 3: Local Development Setup

**Day 1: Environment Setup**
```bash
# Tasks:
- Install Deno
- Configure VSCode
- Set up Docker
- Create .env files
```

**Day 2-3: Development Workflow**
- Configure hot reload
- Set up debugging
- Create function templates
- Test existing functions

**Day 4-5: Documentation**
- Write development guide
- Create quick start
- Document common patterns

### Week 4: CI/CD Pipeline

**Day 1-2: GitHub Actions**
```yaml
# Create workflows for:
- Test on PR
- Deploy on merge
- Manual deployment
```

**Day 3-4: Environment Management**
- Set up secrets
- Configure environments
- Test deployment pipeline

**Day 5: Testing Framework**
- Unit test setup
- Integration tests
- Coverage reporting

### Week 5: Polish & Training

**Day 1-2: Monitoring**
- Health check endpoints
- Error tracking
- Performance monitoring

**Day 3-4: Documentation**
- Deployment guide
- Troubleshooting guide
- Video tutorials

**Day 5: Team Training**
- Hands-on workshop
- Q&A session
- Knowledge transfer

## Quick Wins (Can Start Immediately)

### 1. Database Cleanup Script
```sql
-- Update existing lodge registrations
UPDATE registrations
SET booking_contact_id = customer_id
WHERE registration_type = 'lodge' 
AND booking_contact_id IS NULL;
```

### 2. Basic Health Checks
```typescript
// Add to each edge function
if (req.url.endsWith('/health')) {
  return new Response('OK', { status: 200 })
}
```

### 3. Environment Files
```bash
# Create templates
cp .env.example .env.local
# Document all required variables
```

## Parallel Workstreams

### Stream 1: Frontend (Developer A)
- Week 1-2: Organisation components
- Week 3: Testing & polish

### Stream 2: Infrastructure (Developer B)
- Week 1: Local dev setup
- Week 2: CI/CD pipeline
- Week 3: Documentation

### Stream 3: Operations (DevOps)
- Week 1: Monitoring setup
- Week 2: Deployment automation
- Week 3: Production readiness

## Definition of Done

### Frontend Stripe Connect ✅
- [ ] Users can select/create organisations
- [ ] Payments route to connected accounts
- [ ] Platform fees correctly calculated
- [ ] All tests passing
- [ ] Documentation complete

### Edge Functions Infrastructure ✅
- [ ] Local development with hot reload
- [ ] Automated deployments via GitHub
- [ ] All functions have tests
- [ ] Monitoring active
- [ ] Team trained

## Risk Mitigation

### Risk 1: Stripe Connect Complexity
**Mitigation**: Start with manual onboarding, automate later

### Risk 2: Edge Function Deployment Issues
**Mitigation**: Keep manual deployment as backup

### Risk 3: Team Learning Curve
**Mitigation**: Pair programming, extensive docs

## Success Metrics

### Week 1
- Organisation selector integrated
- Deno installed on all machines

### Week 2
- First Stripe Connect payment processed
- Edge functions running locally

### Week 3
- CI/CD pipeline operational
- All documentation complete

### Week 4
- First automated deployment
- Monitoring dashboard live

### Week 5
- Team independently deploying
- Zero manual steps remaining

## Budget

### Time Investment
- Frontend: 60 hours
- Infrastructure: 80 hours
- Documentation: 20 hours
- Training: 10 hours
- **Total**: 170 hours

### Tools (No Additional Cost)
- Deno: Free
- GitHub Actions: Free tier
- Monitoring: Existing Supabase

## Next Steps

1. **Assign developers** to workstreams
2. **Create GitHub issues** for all tasks
3. **Set up daily standups** for coordination
4. **Begin with quick wins** while planning main work
5. **Schedule review meetings** at end of each week

## Conclusion

This roadmap transforms the current working system into a production-ready platform with automated deployments and proper financial routing. The phased approach allows for continuous delivery while maintaining system stability.