# TODO: Complete Zustand Registration Store State Capture

## Research Phase

### 1. Zustand Store Discovery
- [ ] **Find registration Zustand store files**
  - Search for Zustand store implementations in codebase
  - Identify store files in `/store/`, `/contexts/`, or `/lib/` directories
  - Look for registration-related store definitions

- [ ] **Analyze store structure**
  - Document complete store interface/type definitions
  - Map all fields and nested objects in registration state
  - Identify computed/derived values vs direct inputs

- [ ] **Trace store usage in components**
  - Find where registration store is accessed in payment flow
  - Identify optimal capture points (form completion, payment submission)
  - Document current store access patterns

### 2. Current Implementation Analysis
- [ ] **Review existing raw_registrations implementation**
  - Compare current captured fields vs Zustand store fields
  - Identify gaps in data capture
  - Document transformation logic that filters data

- [ ] **Analyze payment-step.tsx integration**
  - Review how payment step accesses store state
  - Identify where full store state is available
  - Document current data extraction logic

## Implementation Planning

### 3. Test Development Strategy
- [ ] **Create test data structures**
  - Define complete Zustand store mock data
  - Include all fields from real store interface
  - Cover edge cases (empty arrays, null values, computed fields)

- [ ] **Design test scenarios**
  - Individual registration with complete store state
  - Lodge registration with complete store state  
  - Delegation registration with complete store state
  - Pricing calculation validation tests

- [ ] **Create failing tests first**
  - Tests for complete store state capture
  - Tests for pricing data accuracy
  - Tests for field coverage completeness
  - Tests for data type preservation

### 4. Implementation Tasks
- [ ] **Create store state capture utility**
  - Function to serialize complete Zustand store state
  - Handle circular references and complex objects
  - Exclude sensitive payment data while preserving structure

- [ ] **Integrate with payment flow**
  - Add store state capture to payment submission
  - Capture at optimal timing (after all calculations)
  - Ensure minimal performance impact

- [ ] **Update API endpoints**
  - Modify individual registration route
  - Modify lodge registration route
  - Modify delegation registration route
  - Preserve existing functionality while adding complete capture

- [ ] **Database storage optimization**
  - Ensure JSONB storage handles large state objects
  - Add indexes if needed for query performance
  - Consider data retention policies

## Testing & Validation

### 5. Test Implementation
- [ ] **Unit tests for store capture utility**
  - Test complete state serialization
  - Test edge case handling
  - Test performance with large state objects

- [ ] **Integration tests for API endpoints**
  - Test complete state capture in each registration type
  - Validate captured data matches store structure
  - Test backward compatibility

- [ ] **End-to-end validation**
  - Test with real Zustand store data
  - Validate pricing calculations are preserved
  - Ensure no data loss during capture

### 6. Production Validation
- [ ] **Deploy to staging environment**
  - Test with real registration flows
  - Validate complete data capture
  - Monitor performance impact

- [ ] **Compare before/after data**
  - Analyze raw_registrations data quality
  - Validate pricing accuracy improvements
  - Confirm complete field coverage

## Documentation & Cleanup

### 7. Documentation Updates
- [ ] **Update implementation documentation**
  - Document new capture mechanism
  - Update API documentation
  - Add troubleshooting guides

- [ ] **Code cleanup**
  - Remove temporary files
  - Clean up commented code
  - Optimize performance if needed

## Success Validation

### 8. Final Verification
- [ ] **Data completeness check**
  - Compare captured data with Zustand store structure
  - Validate 100% field coverage
  - Confirm pricing accuracy

- [ ] **Test suite completion**
  - All tests passing
  - Coverage meets requirements
  - No regression in existing functionality

- [ ] **Production readiness**
  - Performance acceptable
  - Error handling robust
  - Monitoring in place

## Risk Mitigation

### 9. Edge Case Handling
- [ ] **Handle incomplete store state**
  - What if store is partially loaded?
  - How to handle missing computed values?
  - Fallback strategies for data capture

- [ ] **Performance considerations**
  - Large state object serialization impact
  - Database storage implications
  - Network payload size optimization

- [ ] **Backward compatibility**
  - Ensure existing raw_registrations queries work
  - Maintain API response format compatibility
  - Support both old and new data formats