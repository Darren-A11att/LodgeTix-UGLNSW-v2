# PRD: Fix Edge Function 500 Error on Direct Invocation

## Problem Statement
When invoking the `generate-confirmation` edge function directly via JavaScript API after successful payment, the function returns a 500 error. The error message indicates "Edge Function returned a non-2xx status code" which prevents confirmation number generation.

## Current Behavior
1. Payment completes successfully
2. PaymentCompletionService invokes edge function directly
3. Edge function returns 500 error
4. System falls back to polling but confirmation never generates
5. User sees timeout error after 30 seconds

## Expected Behavior
1. Payment completes successfully
2. Edge function is invoked and returns 200 status
3. Confirmation number is generated immediately
4. User proceeds to confirmation page without delays

## Technical Context
- Edge function URL: `https://pwwpcjbbxotmiqrisjvf.supabase.co/functions/v1/generate-confirmation`
- Invocation method: `supabase.functions.invoke()`
- Payload format: Supabase webhook structure
- Edge function has payload normalization to handle different formats

## Root Cause Analysis Needed
1. Edge function deployment status
2. Edge function error logs
3. Authentication/authorization issues
4. Payload format mismatch
5. Edge function runtime errors

## Success Criteria
1. Edge function returns 200 status on invocation
2. Confirmation numbers generate within 2-3 seconds
3. No 500 errors in production
4. Proper error messages for debugging
5. Fallback mechanism works if edge function fails

## TODO Checklist
- [ ] Check edge function deployment status
- [ ] Review edge function logs for specific error
- [ ] Test edge function with curl/Postman
- [ ] Verify authentication headers
- [ ] Check payload format compatibility
- [ ] Add better error logging to edge function
- [ ] Test with minimal payload
- [ ] Implement proper error handling
- [ ] Add retry logic with exponential backoff
- [ ] Create integration tests

## Questions for Clarification
1. Can you check the Supabase dashboard for edge function logs to see the specific 500 error?
2. Is the edge function properly deployed? (`supabase functions list`)
3. Are there any CORS or authentication requirements for the edge function?
4. Should we use service role key or anon key for edge function invocation?
5. Do you want to implement a fallback to database webhook if edge function fails?
6. What's the expected response format from the edge function?
7. Should we add monitoring/alerting for edge function failures?

## Implementation Approach
1. Debug edge function to find root cause of 500 error
2. Fix the edge function or invocation method
3. Add comprehensive error logging
4. Implement retry logic
5. Add integration tests
6. Deploy and monitor