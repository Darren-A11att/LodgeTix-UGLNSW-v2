# TODO Checklist: Registration System Update

## Research & Analysis
- [ ] Investigate current lodge and grand_lodge table schemas to confirm organisation_id columns
- [ ] Analyze current ticket creation logic in upsert_lodge_registration RPC
- [ ] Review edge function trigger conditions in database
- [ ] Examine current views that return confirmation numbers
- [ ] Research best practices for Stripe payment flow with status updates

## Lodge/Grand Lodge Data Enhancement
- [ ] Update lodge lookup queries to include organisation_id
- [ ] Update grand lodge lookup queries to include organisation_id
- [ ] Modify LodgeSelection component to pass organisation_id
- [ ] Modify GrandLodgeSelection component to handle organisation_id
- [ ] Update lodge registration store to track organisation_id

## Raw Payloads Logging
- [ ] Add raw_payloads table creation to new route
- [ ] Implement logging at start of request (raw request data)
- [ ] Implement logging before RPC call (transformed data)
- [ ] Ensure error handling doesn't prevent logging

## Ticket Creation for Lodge Registrations
- [ ] Analyze current ticket creation in upsert_lodge_registration
- [ ] Determine event_id source for lodge tickets
- [ ] Implement ticket creation based on table_count * 10
- [ ] Ensure tickets link to registration_id properly

## Organisation ID Mapping
- [ ] Update upsert_individual_registration to set organisation_id from primary attendee's lodge
- [ ] Update upsert_lodge_registration to use lodge's organisation_id
- [ ] Ensure organisation_id is properly extracted from lodge details

## Confirmation Number Handling
- [ ] Remove any confirmation number generation from RPC functions
- [ ] Create or update views to include confirmation_number
- [ ] Update API responses to read confirmation from views
- [ ] Implement polling or view query after payment success

## Payment Flow Updates
- [ ] Modify registration creation to use status='pending'
- [ ] Ensure payment_status='pending' on initial creation
- [ ] Update status='completed' and payment_status='completed' after Stripe success
- [ ] Add view query to fetch confirmation after status update
- [ ] Handle timeout if confirmation not available immediately

## Testing
- [ ] Write tests for lodge organisation_id mapping
- [ ] Write tests for individual organisation_id mapping  
- [ ] Write tests for raw_payloads logging
- [ ] Write tests for ticket creation without attendees
- [ ] Write tests for payment flow status updates
- [ ] Write tests for confirmation number retrieval from views

## API Response Updates
- [ ] Update individual registration API response format
- [ ] Update lodge registration API response format
- [ ] Ensure confirmation_number only included when available
- [ ] Add appropriate error handling for missing confirmations

## Documentation Updates
- [ ] Update API documentation with new response formats
- [ ] Update field mapping documents with organisation_id flows
- [ ] Document the payment status flow for edge function triggers