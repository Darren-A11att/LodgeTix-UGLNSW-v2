# Migration Plan: Transitioning from Mock Data to Supabase

## Overview

This document outlines a structured approach to migrating the LodgeTix application from using hard-coded mock event data to fully utilizing Supabase as the data source. The plan focuses on a phased, low-risk approach that maintains application functionality throughout the transition process.

## Current Architecture

- `event-facade.ts` provides a unified interface for event data
- Feature flag `USE_EVENTS_SCHEMA` controls the data source
- Hard-coded mock data in `event-utils.ts` serves as the fallback
- When enabled, Supabase integration via `events-schema-service.ts`

## Phase 1: Preparation and Infrastructure (1-2 weeks)

### 1.1 Schema Validation and Finalization
- [ ] Review and finalize Supabase Events table schema
- [ ] Document all required fields and their data types
- [ ] Create database migration scripts for schema updates
- [ ] Update TypeScript interfaces to match the schema

### 1.2 Setup Development and Testing Environments
- [ ] Create separate Supabase instances for development and testing
- [ ] Configure environment variables for each environment
- [ ] Document connection parameters for all environments
- [ ] Setup test data sets

### 1.3 Implement Data Import Tools
- [ ] Create scripts to import mock data into Supabase
- [ ] Develop data validation for import process
- [ ] Test import/export functionality
- [ ] Document data importing process

## Phase 2: Data Migration (1 week)

### 2.1 Preparing Mock Data for Import
- [ ] Clean and normalize mock event data
- [ ] Add required fields that might be missing
- [ ] Ensure all IDs are properly formatted as UUIDs
- [ ] Generate appropriate timestamps

### 2.2 Database Population
- [ ] Import mock events into development database
- [ ] Verify data integrity after import
- [ ] Generate additional test data as needed
- [ ] Document any data transformations performed

### 2.3 Initial Testing
- [ ] Test all event queries with real database
- [ ] Compare query performance between mock and database
- [ ] Identify and fix any data discrepancies
- [ ] Document test results and findings

## Phase 3: Feature Flag Implementation (1-2 weeks)

### 3.1 Feature Flag Strategy
- [ ] Document the feature flag approach in detail
- [ ] Configure feature flags for different environments
- [ ] Set up easy toggling mechanism for developers
- [ ] Create a monitoring dashboard for feature usage

### 3.2 Fallback Mechanism Enhancement
- [ ] Implement robust error handling in facade
- [ ] Ensure mock data fallback works correctly
- [ ] Add detailed logging for fallback scenarios
- [ ] Test various failure conditions

### 3.3 Validation
- [ ] Create validation tests for both data sources
- [ ] Implement data consistency checks
- [ ] Document validation process
- [ ] Setup monitoring for database errors

## Phase 4: Controlled Rollout (2-3 weeks)

### 4.1 Developer Testing
- [ ] Enable feature flag for development environment
- [ ] Have developers test with real database
- [ ] Collect feedback on performance and functionality
- [ ] Fix any issues discovered

### 4.2 Staging Deployment
- [ ] Deploy to staging with feature flag enabled
- [ ] Run full test suite against staging
- [ ] Test with realistic load patterns
- [ ] Monitor for errors and performance issues

### 4.3 Gradual Production Rollout
- [ ] Enable for internal users first (if applicable)
- [ ] Roll out to 10% of production users
- [ ] Monitor error rates and performance
- [ ] Gradually increase to 25%, 50%, 75%, 100%

## Phase 5: Full Transition and Cleanup (1 week)

### 5.1 Complete Migration
- [ ] Enable feature flag for all environments
- [ ] Remove conditional logic when stability is confirmed
- [ ] Update documentation to reference database only
- [ ] Archive migration-specific code

### 5.2 Performance Optimization
- [ ] Analyze query performance with production data
- [ ] Optimize database indexes
- [ ] Fine-tune caching strategy
- [ ] Document database maintenance procedures

### 5.3 Technical Debt Cleanup
- [ ] Remove unused mock data code
- [ ] Refactor any redundant logic
- [ ] Update tests to focus on database scenarios
- [ ] Clean up outdated documentation

## Migration Validation Checklist

### Functional Testing
- [ ] All pages load correctly with database data
- [ ] Events are displayed with correct information
- [ ] Search and filtering work properly
- [ ] Related events functionality works as expected
- [ ] Ticket information displays correctly

### Performance Testing
- [ ] Page load times are acceptable
- [ ] Database query times are within limits
- [ ] Caching is functioning properly
- [ ] Application remains responsive under load

### Error Handling
- [ ] Database connection errors are handled gracefully
- [ ] Missing data is handled with appropriate defaults
- [ ] Data validation errors are properly reported
- [ ] Client-side error reporting works correctly

## Rollback Plan

In case of critical issues during the migration, this rollback plan provides steps to quickly restore system stability:

1. **Immediate Rollback**:
   - Disable the `USE_EVENTS_SCHEMA` feature flag
   - Revert to hard-coded data
   - Communicate status to stakeholders

2. **Issue Investigation**:
   - Collect error logs and diagnostics
   - Identify root cause of issues
   - Document findings in the issue tracker

3. **Resolution Planning**:
   - Develop fixes for identified issues
   - Test fixes in development environment
   - Update the migration plan with new learnings

4. **Retry Migration**:
   - Apply fixes to staging environment
   - Verify resolution of previous issues
   - Return to the migration plan at appropriate phase

## Data Consistency Tools

To help ensure consistency between mock data and database data during the transition, we will implement the following tools:

### Event Data Comparison Tool

```typescript
// To be implemented in tools/data-comparison.ts
export async function compareEventData() {
  // Get events from both sources
  const mockEvents = getHardCodedEvents();
  
  // Temporarily enable Supabase regardless of feature flag
  const eventService = getNewEventService();
  const dbEvents = await eventService.getPublishedEvents();
  
  // Compare event counts
  console.log(`Mock events: ${mockEvents.length}, DB events: ${dbEvents.length}`);
  
  // Check for missing events in either source
  const mockIds = new Set(mockEvents.map(e => e.id));
  const dbIds = new Set(dbEvents.map(e => e.id));
  
  const missingInDb = mockEvents.filter(e => !dbIds.has(e.id));
  const missingInMock = dbEvents.filter(e => !mockIds.has(e.id));
  
  console.log(`Events missing in DB: ${missingInDb.length}`);
  console.log(`Events missing in mock data: ${missingInMock.length}`);
  
  // Check for data discrepancies in common events
  const commonEvents = mockEvents.filter(e => dbIds.has(e.id));
  
  for (const mockEvent of commonEvents) {
    const dbEvent = dbEvents.find(e => e.id === mockEvent.id)!;
    const discrepancies = compareEventFields(mockEvent, dbEvent);
    
    if (discrepancies.length > 0) {
      console.log(`Discrepancies for event ${mockEvent.id} (${mockEvent.title}):`);
      discrepancies.forEach(d => console.log(`  - ${d}`));
    }
  }
}

function compareEventFields(mockEvent: Event, dbEvent: EventType): string[] {
  const discrepancies: string[] = [];
  const fieldsToCompare = [
    'title', 'description', 'location', 'imageUrl', 
    'featured', 'category', 'type'
  ];
  
  for (const field of fieldsToCompare) {
    if (mockEvent[field] !== dbEvent[field]) {
      discrepancies.push(
        `Field "${field}": Mock=${mockEvent[field]}, DB=${dbEvent[field]}`
      );
    }
  }
  
  return discrepancies;
}
```

## Timeline and Milestones

| Phase | Duration | Key Milestones | Success Criteria |
|-------|----------|----------------|------------------|
| 1: Preparation | 1-2 weeks | Schema finalized, Environments ready | Schema documentation complete, Test environments functional |
| 2: Data Migration | 1 week | Mock data imported, Initial testing completed | All data successfully imported with no integrity issues |
| 3: Feature Flags | 1-2 weeks | Flag system implemented, Fallback logic tested | Feature flag controls data source with 100% reliability |
| 4: Rollout | 2-3 weeks | Dev testing, Staging deployment, Gradual production | Successful rollout with minimal issues reported |
| 5: Completion | 1 week | Full transition, Optimizations, Cleanup | All systems using database with improved performance |

## Conclusion

This migration plan provides a structured, phased approach to safely transition from mock data to Supabase. By focusing on preparation, testing, and gradual rollout, we minimize risks while ensuring application stability throughout the process.

The feature flag architecture already in place gives us a powerful mechanism for controlled migration, and the thorough testing strategy helps identify and address issues early. With proper execution of this plan, the transition should be smooth and transparent to end users.