# Billing Form Mason Country Auto-Selection Bug

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