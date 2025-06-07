# PRD: Complete Zustand Registration Store State Capture

## Problem Statement

The current raw registration data capture system is incomplete. While we capture some registration data, we are missing the complete Zustand store state that contains all user inputs, calculations, and derived values during the registration process. This results in:

1. **Missing pricing data**: Ticket prices showing as 0 instead of actual calculated values
2. **Missing derived state**: Calculated totals, fees, and other computed values
3. **Incomplete field coverage**: Only capturing ~15-20 fields instead of the complete store state
4. **Loss of temporal data**: Missing intermediate calculations and state transitions

## Objective

Implement a system that captures the **complete, unfiltered Zustand registration store state** directly from the frontend store, ensuring 100% fidelity between what the user sees/inputs and what gets stored in `raw_registrations`.

## Requirements

### Functional Requirements

1. **Registration-Type Specific Store Capture**
   - **Individual Registration**: Capture complete `useRegistrationStore` state
   - **Lodge Registration**: Capture complete `useLodgeRegistrationStore` state  
   - **Delegation Registration**: Capture complete `useDelegationRegistrationStore` state
   - Include all computed/derived values (pricing, totals, fees)
   - Preserve all user inputs and form state
   - Maintain data types and nested object structures

2. **Direct Store Access**
   - Access appropriate Zustand store directly based on registration type
   - Capture state right before payment submission (optimal timing)
   - Ensure timing captures the most complete state available
   - Include calculated pricing data from payment components

3. **Data Fidelity & Security**
   - Zero data loss between frontend store and raw_registrations
   - Preserve exact field names, values, and structure from Zustand
   - **EXCLUDE credit card fields only**: `cardNumber`, `expiryDate`, `cvc`, `cardName`
   - Include `paymentIntentId` and all other fields
   - Maintain referential integrity (IDs, relationships)

4. **Real-time Accuracy**
   - Capture calculated pricing (totalAmount, subtotal, stripeFee) from payment component
   - Include selected events, tickets, and computed totals
   - Preserve all attendee data with complete field sets
   - Capture event_id resolution from packages and selected tickets

### Technical Requirements

1. **Store Integration**
   - Identify the correct Zustand store file/implementation
   - Access store state from payment/submission components
   - Handle store state serialization for database storage

2. **Database Schema**
   - Store complete state in `raw_registrations.raw_data` JSONB column
   - Include metadata about capture point and timestamp
   - Maintain backward compatibility with existing data

3. **Testing Requirements**
   - Test-driven development approach
   - Tests must fail initially, then pass after implementation
   - Validate complete state capture against known Zustand structure
   - Compare captured data with actual store contents

### Non-Functional Requirements

1. **Performance**: State capture should not impact user experience
2. **Security**: Exclude sensitive payment details from stored state
3. **Reliability**: Handle edge cases where store state might be incomplete
4. **Maintainability**: Solution should be robust against Zustand store changes

## Success Criteria

1. **Complete Data Coverage**: 100% of Zustand store fields captured in raw_registrations
2. **Pricing Accuracy**: All ticket prices, totals, and fees match store calculations
3. **Test Coverage**: Comprehensive test suite validates complete state capture
4. **Production Validation**: Real registration data shows complete state information

## Implementation Approach

1. **Research Phase**: Identify Zustand store location and structure
2. **Test Development**: Create failing tests for complete state capture
3. **Implementation**: Build solution to capture full store state
4. **Validation**: Ensure tests pass and production data is complete

## Risk Considerations

1. **Store Structure Changes**: Zustand store may evolve over time
2. **Serialization Issues**: Complex objects may need special handling
3. **Performance Impact**: Large state objects could affect performance
4. **Data Volume**: Complete state capture will increase database storage

## Definition of Done

- [ ] Complete Zustand store state captured in raw_registrations
- [ ] All pricing data accurately reflected in captured state
- [ ] Test suite validates 100% state capture fidelity
- [ ] Production registrations show complete state information
- [ ] Documentation updated with new capture mechanism