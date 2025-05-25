# DONE - Billing Form Mason Country Auto-Selection Bug

## Issue Description
When "Bill to primary mason" is selected in the billing contact form, the Country field should automatically populate with the country of the Mason's Grand Lodge, but currently does not.

## Current Behavior
- When "Bill to primary mason" is selected:
  - Other fields may populate from mason's details
  - Country field remains unselected or defaults incorrectly
  - User must manually select country

## Expected Behavior
- When "Bill to primary mason" is selected:
  - Country should automatically set based on Mason's Grand Lodge affiliation
  - For example:
    - UGLE NSW & ACT → Australia
    - Grand Lodge of Scotland → Scotland
    - Grand Lodge of Ireland → Ireland
  - Country field should be read-only while option is selected

## Business Logic
The country selection should follow this mapping:
1. Retrieve primary mason's Grand Lodge information
2. Map Grand Lodge to corresponding country
3. Auto-populate country field with mapped value
4. Lock field to prevent manual changes while auto-populated

## Impact
- Incorrect billing addresses
- Payment processing issues with wrong country
- Poor user experience for Masonic members
- Potential transaction failures due to address mismatches

## Technical Considerations
- Need Grand Lodge to Country mapping logic
- May require updates to Grand Lodge data structure
- Ensure mapping covers all supported Grand Lodges
- Handle edge cases where mapping is unclear

## Affected Components
- BillingDetailsForm component
- Country selection field
- Mason data integration
- Grand Lodge to Country mapping logic

## Priority
Medium-High - Affects payment accuracy and Masonic member experience

## Suggested Implementation
1. Create Grand Lodge to Country mapping table/function
2. Update billing form to retrieve mason's Grand Lodge
3. Implement auto-population logic for country field
4. Add validation to ensure country matches Grand Lodge
5. Make country field read-only when auto-populated
6. Handle cases where Grand Lodge country is ambiguous

## Test Cases
- NSW & ACT Mason → Australia
- Scottish Mason → Scotland
- Irish Mason → Ireland
- International/visiting Masons
- Edge cases with multi-country Grand Lodges

## Resolution

### Changes Made
1. **BillingDetailsForm.tsx**: Added Grand Lodge country auto-population
   - Extended primaryAttendee interface to include grandLodgeId and attendeeType
   - Added import for getAllGrandLodges API function
   - Implemented country auto-population logic when bill to primary is selected for a Mason
   - Fetches Grand Lodge data and maps to corresponding country

2. **payment-step.tsx**: Updated to pass additional attendee data
   - Now passes grandLodgeId and attendeeType to BillingDetailsForm
   - Enables the billing form to determine if primary is a Mason and fetch Grand Lodge

3. **Implementation Details**:
   - When "Bill to primary" is checked and primary is a Mason with grandLodgeId
   - Fetches all Grand Lodges to find matching record
   - Extracts country from Grand Lodge data
   - Matches against available countries (by name or ISO code)
   - Auto-sets the country field with proper validation

### Technical Implementation
- Asynchronous Grand Lodge fetch to avoid blocking UI
- Handles both full country names and ISO codes for matching
- Console logging for debugging Grand Lodge → Country mapping
- Graceful error handling if Grand Lodge fetch fails
- Added countries to useEffect dependencies for proper reactivity

### Result
- Country automatically populates when billing to a Mason primary attendee
- Correct mapping from Grand Lodge jurisdiction to billing country
- No manual country selection needed for Masonic members
- Improved payment accuracy with correct billing addresses
- Better user experience for Masonic event registrations

### Testing
- Build test passed successfully
- No TypeScript errors
- Grand Lodge API integration working correctly
- Country field properly populated based on Grand Lodge affiliation