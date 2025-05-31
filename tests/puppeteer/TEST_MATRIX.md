# LodgeTix Registration Test Matrix

## Executive Summary

This document provides a comprehensive mathematical analysis of all possible registration variations in the LodgeTix system and our strategic approach to testing them. Due to the exponential complexity of combinations, we employ industry-standard test design techniques to achieve maximum coverage with optimal test cases.

## Mathematical Analysis of Variations

### 1. Individual Registration (Myself & Others)

#### Mason Attendee Variations
- **Titles**: 5 options (W.Bro., Bro., V.W.Bro., R.W.Bro., M.W.Bro.)
- **Ranks**: 4 options (MM, FC, EA, GL)
- **Contact Preferences**: 3 options (PrimaryAttendee, Directly, ProvideLater)
- **Partner**: 2 options (with/without)
- **Primary vs Non-Primary**: 2 options
- **Lodge Selection**: 2 options (same lodge/different lodge)
- **Grand Officer Fields** (when Rank=GL):
  - Status: 2 options (Present, Past)
  - Roles: ~20 options
  - Other Role: Free text

**Base Mason Combinations**: 5 × 4 × 3 × 2 × 2 × 2 = **480 variations**
**With GL Rank Additions**: 480 + (5 × 1 × 3 × 2 × 2 × 2 × 2 × 20) = **2,880 variations**

#### Guest Attendee Variations
- **Titles**: 7 options (Mr., Mrs., Ms., Miss, Dr., Prof., Rev.)
- **Contact Preferences**: 3 options
- **Partner**: 2 options (with/without)
- **Partner Relationships**: 4 options (Wife, Husband, Partner, Other)

**Guest Combinations**: 7 × 3 × 2 = **42 base variations**
**With Partners**: 42 + (7 × 3 × 1 × 4) = **126 total guest variations**

#### Combined Attendee Scenarios
- **Maximum Configuration**: 5 Masons + 5 Guests = 10 primary attendees
- **Each can have a partner**: Up to 20 total attendees
- **Possible Combinations**: C(2,880, 0-5) × C(126, 0-5) = **Billions of combinations**

### 2. Lodge Registration Variations
- **Mode**: 2 options (bulk tickets, individual tickets)
- **Tables**: 1-10 tables
- **Seats per Table**: 10 fixed
- **Attendee Details**: Optional until closer to event

**Lodge Combinations**: 2 × 10 = **20 base variations**

### 3. Delegation Registration
- Similar to Individual but with special delegation fields
- **Delegation Types**: Official/Unofficial
- **Grand Lodges**: Dynamic list

### 4. Ticket Selection Variations
- **Ticket Types**: Variable per event (typically 5-10)
- **Package Options**: Variable per event (typically 2-5)
- **Eligibility Rules**: Based on attendee type
- **Availability**: Real-time with sold-out scenarios

**Ticket Combinations**: For 10 attendees with 8 ticket options = 8^10 = **1,073,741,824 combinations**

## Test Reduction Strategy

### 1. Equivalence Partitioning
Group similar inputs that should be processed the same way:
- **Title Groups**: Traditional (Mr./Mrs./Ms./Miss) vs Professional (Dr./Prof./Rev.)
- **Rank Groups**: Regular (MM/FC/EA) vs Special (GL)
- **Contact Groups**: Primary-dependent vs Independent

### 2. Boundary Value Analysis
Test at the limits:
- **Minimum**: 1 attendee (no partner)
- **Maximum**: 10 primary + 10 partners = 20 total
- **Character Limits**: Names, dietary requirements, special needs

### 3. Decision Table Testing
For complex conditional logic:
- Grand Officer field dependencies
- Contact preference impact on required fields
- Partner eligibility rules

### 4. Pairwise Testing
Cover interactions between features without testing all combinations:
- Mason rank × Partner status
- Contact preference × Attendee position
- Ticket type × Attendee type

### 5. Risk-Based Testing
Prioritize based on:
- **Critical**: Payment processing, data persistence
- **High**: Contact information accuracy, ticket eligibility
- **Medium**: UI variations, optional fields
- **Low**: Cosmetic issues, rare combinations

## Test Coverage Matrix

### Test File Organization

| Test File | Scenarios | Priority | Coverage Focus |
|-----------|-----------|----------|----------------|
| individual-mason-variations.spec.js | 15+ | High | All Mason field combinations, ranks, titles |
| individual-guest-variations.spec.js | 12+ | High | Guest types, relationships, contact options |
| partner-combinations.spec.js | 10+ | High | Partner eligibility, relationships, data flow |
| contact-preference-scenarios.spec.js | 8+ | High | Email/phone requirements, validation |
| grand-officer-scenarios.spec.js | 10+ | High | GL rank special fields, all roles |
| mixed-attendee-groups.spec.js | 15+ | Medium | Complex multi-attendee scenarios |
| ticket-eligibility-matrix.spec.js | 20+ | Medium | All ticket/attendee type combinations |
| edge-cases-and-limits.spec.js | 10+ | Medium | Boundaries, character limits, max attendees |
| data-persistence-scenarios.spec.js | 8+ | Medium | Draft recovery, session management |
| lodge-registration-advanced.spec.js | 10+ | Medium | Enhanced lodge-specific scenarios |

**Total Planned Scenarios**: 120+ focused test cases

### Coverage by Feature

#### Registration Types
- [x] Individual (Myself & Others) - 80+ scenarios
- [x] Lodge Registration - 10+ scenarios  
- [x] Delegation Registration - 10+ scenarios

#### Attendee Types
- [x] Mason (Primary) - 20+ scenarios
- [x] Mason (Non-Primary) - 15+ scenarios
- [x] Guest (Primary) - 10+ scenarios
- [x] Guest (Non-Primary) - 10+ scenarios
- [x] Mason with Partner - 10+ scenarios
- [x] Guest with Partner - 10+ scenarios

#### Field Variations
- [x] All 5 Mason titles - Covered
- [x] All 4 ranks including GL - Covered
- [x] All 7 Guest titles - Covered
- [x] All contact preferences - Covered
- [x] All partner relationships - Covered
- [x] Grand Officer roles (20+) - Covered

#### Complex Scenarios
- [x] Mixed groups (Masons + Guests) - 15+ scenarios
- [x] Maximum attendees (20 total) - Covered
- [x] Ticket eligibility edge cases - 20+ scenarios
- [x] Draft recovery - 8+ scenarios

## Risk Mitigation

### High-Risk Areas (Extra Coverage)
1. **Payment Processing**: Separate payment-processing.spec.js
2. **Data Loss**: Draft recovery and persistence testing
3. **Ticket Overselling**: Real-time availability checks
4. **Contact Information**: Validation and preference logic

### Medium-Risk Areas
1. **UI Responsiveness**: Mobile vs desktop variations
2. **Browser Compatibility**: Cross-browser testing
3. **Performance**: Load testing for max attendees

### Low-Risk Areas (Basic Coverage)
1. **Cosmetic Issues**: Visual regression tests
2. **Rare Combinations**: Covered by pairwise testing

## Execution Strategy

### Phase 1: Critical Path (Week 1)
- Individual Mason variations
- Individual Guest variations  
- Partner combinations
- Contact preferences
- Payment processing

### Phase 2: Extended Coverage (Week 2)
- Grand Officer scenarios
- Mixed attendee groups
- Ticket eligibility matrix
- Edge cases and limits

### Phase 3: Advanced Scenarios (Week 3)
- Data persistence
- Lodge registration advanced
- Performance testing
- Cross-browser validation

## Success Metrics

### Coverage Goals
- **Statement Coverage**: >90%
- **Branch Coverage**: >85%
- **Critical Path Coverage**: 100%
- **Risk Coverage**: 100% for High, 80% for Medium

### Quality Indicators
- Zero critical bugs in production
- <2% defect escape rate
- All payment scenarios tested
- All data loss scenarios prevented

## Maintenance Strategy

### Regular Updates
- Review matrix quarterly
- Add scenarios for new features
- Remove obsolete test cases
- Update risk assessments

### Continuous Improvement
- Track test execution time
- Identify flaky tests
- Optimize test data
- Enhance self-healing capabilities

## Conclusion

This test matrix ensures comprehensive coverage of the LodgeTix registration system while maintaining practical test execution times. By using strategic test design techniques, we reduce billions of potential combinations to ~120 focused test scenarios that provide maximum coverage of critical paths and high-risk areas.

The mathematical analysis demonstrates the complexity of the system and justifies our strategic approach to testing. Regular reviews and updates of this matrix ensure continued effectiveness as the system evolves.