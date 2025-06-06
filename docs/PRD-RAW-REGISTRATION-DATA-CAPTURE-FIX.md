# PRD: Raw Registration Data Capture Fix

## Problem Statement
When submitting registrations to the database, the `raw_registrations` table's `raw_data` column is not capturing all registration data points collected during the registration process. The stored raw data is missing critical attendee details that are present in the frontend registration flow.

## Current State Analysis

### Data Currently Stored in raw_registrations.raw_data
- eventId
- tickets (array with basic ticket info)
- customerId
- functionId
- totalAmount
- functionSlug
- billingDetails (complete billing information)
- selectedEvents (empty array)
- primaryAttendee (partial data)
- registrationType
- additionalAttendees (empty array)

### Missing Data Points (Present in Console Logs)
Based on console log analysis, the following data points are captured in the frontend but not stored in raw_registrations:

#### Attendee Details Missing:
- Complete attendee validation data
- Enhanced masonic organization details
- Detailed contact preferences and confirmations
- Full lodge and grand lodge relationship mappings
- Comprehensive dietary and special needs information
- Complete contact confirmation status
- First-time attendee status details
- Rank and post-nominal details
- Table assignment information
- Payment status tracking
- Partner relationship details
- Guest relationship information

#### System Metadata Missing:
- Validation step tracking
- Form submission timestamps
- User interaction logs
- Error state information
- Step completion status

## Business Requirements

### Primary Requirement
All data points captured during the registration process must be stored in the `raw_registrations.raw_data` column as a complete JSON payload.

### Acceptance Criteria
1. The raw_data column must contain 100% of registration data collected in the frontend
2. No data loss between frontend collection and database storage
3. Raw data must be queryable for audit and debugging purposes
4. Implementation must maintain backward compatibility
5. Performance impact must be minimal

## Technical Requirements

### Data Integrity
- All attendee details captured in registration forms
- Complete billing and contact information
- Full masonic organization relationships
- Comprehensive preference and requirement data
- System metadata and validation states

### Storage Requirements
- JSON format in raw_data column
- Maintain referential integrity with existing registration tables
- Support for large payloads (attendee data can be extensive)

## Success Metrics
1. Raw registration data includes all fields present in console logs
2. No data discrepancies between frontend collection and database storage
3. Successful audit trail for all registration submissions
4. Zero data loss incidents

## Implementation Considerations
- Identify where registration data is filtered/transformed before database insertion
- Ensure all registration API endpoints capture complete payloads
- Maintain data privacy and security requirements
- Consider performance implications of storing larger JSON payloads

## Timeline
- Investigation: 1-2 hours
- Implementation: 2-4 hours  
- Testing and validation: 1-2 hours
- Total estimated effort: 4-8 hours

## Risk Assessment
- **Low Risk**: Data structure changes (additive only)
- **Medium Risk**: Performance impact from larger JSON payloads
- **Low Risk**: Backward compatibility (existing data remains unchanged)

## Dependencies
- Access to registration API endpoints
- Understanding of current data transformation pipeline
- Database migration capabilities if schema changes needed