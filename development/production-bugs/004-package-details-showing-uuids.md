# Package Details Displaying UUIDs Instead of Names

## Issue Description
On the Review Order step, the package details section shows raw UUIDs instead of human-readable package names in the "Package including: ..." text.

## Location
- Review Order Step
- "Tickets for This Attendee" section
- Package details display

## Current Behavior
Package including: [UUID-1], [UUID-2], [UUID-3]

## Expected Behavior
Package including: Welcome Reception, Gala Dinner, Installation Ceremony

## Impact
- Poor user experience
- Confusion about what's included in packages
- Unprofessional appearance
- Users cannot verify their selections

## Root Cause
Likely displaying raw database IDs instead of resolving to package names/titles.

## Affected Components
- Order review display logic
- Package data resolution
- Ticket/package name mapping

## Priority
High - Directly affects user ability to review and confirm orders

## Suggested Fix
- Resolve package UUIDs to their display names
- Ensure proper data joining/lookup when displaying package contents
- Add fallback handling if package names cannot be resolved