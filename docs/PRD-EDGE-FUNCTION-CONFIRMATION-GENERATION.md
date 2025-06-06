# PRD: Fix Edge Function Confirmation Number Generation

## Problem Statement
The edge function for generating confirmation numbers is not being triggered after successful payment completion. The payment process completes successfully, but the system times out waiting for a confirmation number to be generated, resulting in a poor user experience.

## Current Behavior
1. Payment is processed successfully
2. Registration is created with status='completed' and payment_status='completed'
3. System waits for confirmation number (30 attempts, ~30 seconds)
4. Timeout occurs - no confirmation number is generated
5. User sees error: "Timeout waiting for confirmation number"

## Expected Behavior
1. Payment is processed successfully
2. Registration is updated with status='completed' and payment_status='completed'
3. Database webhook triggers edge function
4. Edge function generates confirmation number
5. Confirmation number is stored in registration
6. User proceeds to confirmation page

## Technical Context
- Edge function exists at `/supabase/functions/generate-confirmation/`
- Function expects POST request with: registration_id, status, payment_status
- Database has trigger function `should_generate_confirmation()` 
- Webhook logs table exists with proper columns
- Previous fixes addressed column reference issues

## Success Criteria
1. Edge function is triggered automatically on payment completion
2. Confirmation numbers are generated within 2-3 seconds
3. No timeout errors occur
4. Webhook logs show successful invocations
5. Users see confirmation page with valid confirmation number

## Root Cause Hypothesis
1. Database webhook not configured to call edge function
2. Webhook configuration missing or incorrect
3. Edge function URL not properly set
4. Authentication/permissions issue
5. Trigger function not calling webhook properly

## TODO Checklist
- [ ] Verify edge function is deployed and accessible
- [ ] Check database webhook configuration
- [ ] Verify trigger function is creating webhook logs
- [ ] Check if webhook is configured to call edge function
- [ ] Test edge function manually to ensure it works
- [ ] Configure database webhook if missing
- [ ] Test end-to-end payment flow
- [ ] Monitor webhook logs for successful invocations
- [ ] Update documentation

## Questions for Clarification
1. Has the edge function been deployed to Supabase? (`supabase functions deploy generate-confirmation`)
2. Are there any database webhooks configured in the Supabase dashboard?
3. Should the confirmation number generation happen via database webhook or direct API call?
4. Is there a specific format for confirmation numbers beyond incrementing integers?
5. Should we implement a fallback mechanism if the edge function fails?