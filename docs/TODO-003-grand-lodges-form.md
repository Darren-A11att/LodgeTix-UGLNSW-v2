# TODO-003: Create GrandLodgesForm from Duplicated LodgesForm

## Objective
Transform the duplicated LodgesForm into GrandLodgesForm with specific modifications for Grand Lodge delegations.

## Requirements
1. Remove Lodge selection (redundant for Grand Lodges)
2. Change "Table Order" to "Delegation Order"
3. Add two tabs: "Purchase Tickets Only" and "Register Delegation"
4. Implement delegation member management
5. Add Grand Office autocomplete functionality

## Implementation Details

### 1. Removed Lodge Selection
- Kept only Grand Lodge selection
- Removed all Lodge-related UI components
- Updated validation to only require Grand Lodge

### 2. Two-Tab Interface
**Purchase Tickets Only Tab:**
- Changed from tables of 10 to individual ticket purchases
- User selects "Number of Tickets" instead of "Number of Tables"
- Direct navigation to payment step (sets step to 3)
- Shows individual ticket pricing ($195 per ticket)

**Register Delegation Tab:**
- Delegation order field for ordering multiple delegations
- Delegate management table with inline editing
- Add buttons for Mason, Partner, and Guest

### 3. Delegate Member Management
**Mason Fields:**
- Title (dropdown with Masonic titles)
- First Name
- Last Name
- Grand Rank (defaulted to GKL)
- Grand Officer checkbox
- Grand Office (autocomplete with free text)
- Add partner icon

**Guest Fields:**
- Title (guest titles)
- First Name
- Last Name
- Relationship dropdown (Guest as first option)
- Partner Of dropdown (if not Guest)
- Add partner icon (if Guest)

**Partner Handling:**
- If added via button: Shows guest form with Partner preselected
- If added via icon: Shows guest row with Partner relationship and preselected "Partner Of"

### 4. Grand Office Autocomplete
- Uses existing AutocompleteInput component
- Searches from GRAND_OFFICER_ROLES constant
- Allows free text entry if no match selected
- Integrated with Grand Officer checkbox

### 5. Contact Preferences
- Assumes "booking contact" preference
- Inherits Grand Lodge from selected delegation

## Key Features Implemented
- Complete delegate CRUD operations
- Partner relationship management
- Inline editing with validation
- Proper state management with Zustand
- Responsive design
- Skip to payment for Purchase Tickets Only

## Status: ✅ COMPLETED

The GrandLodgesForm has been successfully implemented with all requested features.