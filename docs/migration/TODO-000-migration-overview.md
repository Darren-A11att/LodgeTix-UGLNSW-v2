# Database Migration Overview

## Migration Strategy
This document outlines the complete migration path from the current complex schema to the new simplified schema. The migration is organized in reverse order (from payment back to registration start) to ensure we understand all dependencies.

## Migration Files
1. **TODO-001**: Payment Processing - Update payment completion flow
2. **TODO-002**: Registration Creation - Migrate to single RPC call
3. **TODO-003**: Payment Form & Billing - Simplify billing details
4. **TODO-004**: Order Review - Update summary displays
5. **TODO-005**: Ticket Selection - New availability system
6. **TODO-006**: Attendee Details - Unified contact forms
7. **TODO-007**: Registration Type - Simplified type selection
8. **TODO-008**: Registration Wizard - Container updates
9. **TODO-009**: Database Services - API layer migration
10. **TODO-010**: Type Definitions - TypeScript updates

## Key Benefits
- **75% reduction** in person-related tables
- **80% simpler** registration flow
- **100% consistent** naming conventions
- **50-80% reduction** in code complexity

## Migration Approach
1. Set up new Supabase project with proposed schema
2. Update TypeScript types (TODO-010)
3. Create new service layer (TODO-009)
4. Migrate UI components (TODO-008 through TODO-001)
5. Test thoroughly in staging
6. Plan data migration
7. Execute cutover

## Timeline Estimate
- **Phase 1** (Infrastructure): 2-3 days
  - New project setup
  - Type definitions
  - Service layer

- **Phase 2** (UI Migration): 3-4 days
  - Component updates
  - Form migrations
  - Flow testing

- **Phase 3** (Testing): 2-3 days
  - End-to-end testing
  - Performance testing
  - Bug fixes

- **Phase 4** (Cutover): 1-2 days
  - Data migration
  - DNS updates
  - Monitoring

**Total: 8-12 days**

## Critical Success Factors
1. **No data loss** during migration
2. **Minimal downtime** (< 30 minutes)
3. **Full feature parity** 
4. **Improved performance**
5. **Simplified maintenance**

## Risk Mitigation
- Keep old system running in parallel
- Implement feature flags for gradual rollout
- Comprehensive backup strategy
- Rollback plan ready
- Thorough testing at each stage

## Next Steps
1. Review and approve migration plan
2. Set up new Supabase project
3. Begin with TODO-010 (Type Definitions)
4. Work through TODOs sequentially