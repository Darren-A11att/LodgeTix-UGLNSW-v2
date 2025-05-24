# Attendee Count Double-Counting Partners

## Issue Description
The step summary is incorrectly counting partners as guests in the attendee totals, resulting in inflated guest counts and confusing summaries.

## Example Scenario
Registration with:
- Mason + Partner
- Mason + Partner  
- Guest + Partner
- Guest (solo)
- Mason (solo)

### Current (Incorrect) Count:
- Total Attendees: 8 ✓
- Masons: 3 ✓
- Guests: 5 ✗ (should be 2)
- Partners: 3 ✓

### Expected Count:
- Total Attendees: 8
- Masons: 3
- Guests: 2 (only actual guests, not partners)
- Partners: 3

## Root Cause
Partners are being counted both as:
1. Partners (correct)
2. Guests (incorrect - while partners are technically guests, they should have separate counts)

## Impact
- Confusing attendee summaries
- Incorrect guest counts for event planning
- Potential issues with ticket allocation
- Misleading information for organizers

## Affected Components
- Attendee counting logic
- Summary display components
- Registration type calculations

## Priority
High - Affects data accuracy and event planning

## Suggested Fix
- Separate partner counting from guest counting
- Ensure partners are only counted in the "Partners" category
- Update counting logic to differentiate between standalone guests and partners