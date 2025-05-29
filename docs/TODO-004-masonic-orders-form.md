# TODO-004: Create MasonicOrdersForm from Duplicated LodgesForm

## Objective
Transform the duplicated LodgesForm into MasonicOrdersForm, adapting it for Masonic Order delegations instead of Grand Lodge delegations.

## Requirements
1. Remove Lodge selection (redundant for Masonic Orders)
2. Adapt all UI text from "Grand Lodge" to "Masonic Order"
3. Maintain same functionality as GrandLodgesForm
4. Support same two-tab structure

## Implementation Details

### 1. UI Text Updates
- Card title: "Your Lodge" → "Your Masonic Order"
- Alert messages: "Please select a Grand Lodge" → "Please select a Masonic Order"
- Summary titles: "Masonic Order Ticket Purchase" and "Masonic Order Delegation"
- Description text updated to reference Masonic Orders

### 2. Lodge Selection Removal
- Completely removed Lodge selection components
- Removed Lodge-related validation
- Simplified form to only require Masonic Order selection

### 3. Maintained Features
- Same two-tab structure as GrandLodgesForm
- Purchase Tickets Only functionality
- Register Delegation with delegate management
- Same delegate fields and validation
- Partner relationship management

### 4. Component Structure
```typescript
// Key sections maintained:
- Masonic Order selection (using Grand Lodge selector)
- Booking contact details
- Two-tab interface
- Delegate management table
- Summary components
```

## Result
The MasonicOrdersForm provides identical functionality to GrandLodgesForm but is properly contextualized for Masonic Order delegations rather than Grand Lodge delegations.

## Status: ✅ COMPLETED

Successfully adapted the form for Masonic Orders while maintaining all required functionality.