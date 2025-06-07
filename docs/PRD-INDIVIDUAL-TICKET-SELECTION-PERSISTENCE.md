# PRD: Individual Registration Ticket Selection Persistence

## Overview
Enhance the individual registration system to persist attendee ticket selections in the database when moving between wizard steps, maintaining the nested structure of packages and individual tickets per attendee.

## Requirements

### 1. Data Structure
Persist ticket selections nested under each attendee with the following structure:
```typescript
{
  attendees: [
    {
      attendeeId: "uuid",
      ticketSelections: {
        packages: [
          {
            packageId: "uuid",
            quantity: 1,
            tickets: [
              { ticketId: "uuid", quantity: 1 },
              { ticketId: "uuid", quantity: 2 }
            ]
          }
        ],
        individualTickets: [
          { ticketId: "uuid", quantity: 1 }
        ]
      }
    }
  ]
}
```

### 2. Persistence Behavior
- **When**: Persist when moving to next step (current behavior)
- **Where**: 
  - Insert tickets into `tickets` table
  - Update `attendees.attendee_data` JSONB column with `selected_tickets` field containing ticketSelections payload

### 3. Business Logic
- Apply current frontend logic: attendee can select EITHER packages OR individual tickets (not both)
- Frontend handles validation logic (no backend validation changes needed)
- No session persistence (clear selections on new browser session)
- No visual indicators to user about persistence

### 4. Integration Points
- Enhance existing Zustand registration store
- Update step validation logic to handle new persistence
- No real-time updates for other users

## Database Changes

### Tickets Table Inserts
For each attendee's ticket selections, create records in `tickets` table:
- `attendee_id`: Reference to attendee
- `ticket_type_id`: Reference to event ticket
- `package_id`: Reference to package (if from package selection)
- `quantity`: Number of tickets selected
- `status`: 'confirmed' (for now, 'reserved' will be future enhancement)

### Attendees Table Updates
Update `attendee_data` JSONB column:
```json
{
  "existing_fields": "...",
  "selected_tickets": {
    "packages": [...],
    "individualTickets": [...]
  }
}
```

## API Changes

### Individual Registration API Enhancement
Enhance `/api/registrations/individuals/route.ts` to:
1. Process ticketSelections from request payload
2. Insert ticket records into `tickets` table
3. Update `attendee_data` with `selected_tickets` field

### RPC Function Enhancement
Update `create_individual_registration_jsonb` to handle:
1. Ticket creation logic
2. Attendee data updates with selected_tickets

## Frontend Changes

### Zustand Store Enhancement
Update registration store to:
1. Maintain current package selection structure
2. Add persistence logic when moving between steps
3. Clear selections on new session (no localStorage for tickets)

### Step Validation Updates
Update wizard step validation to:
1. Verify ticket selections are properly structured
2. Ensure either packages OR individual tickets (not both)
3. Validate against available inventory

## Testing Requirements

### Unit Tests
- Test ticket selection data structure validation
- Test persistence logic for packages vs individual tickets
- Test attendee_data JSONB updates

### Integration Tests
- Test full registration flow with ticket persistence
- Test step transitions with ticket data
- Test API payload processing

### Edge Cases
- Empty ticket selections
- Package with no tickets selected
- Mixed package/individual selections (should fail validation)

## Success Criteria

1. ✅ Attendee ticket selections persist when moving between wizard steps
2. ✅ Tickets inserted into `tickets` table with correct relationships
3. ✅ `attendee_data.selected_tickets` contains complete ticket selection payload
4. ✅ Current frontend validation logic maintained
5. ✅ No session persistence (clear on new browser session)
6. ✅ All existing registration flows continue to work

## Future Enhancements (Separate PRDs)
- 30-minute ticket reservation system with background cleanup tasks
- Real-time inventory updates
- Visual persistence indicators
- Session recovery mechanisms