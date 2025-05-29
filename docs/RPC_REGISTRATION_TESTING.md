# RPC Registration Testing Guide

## Overview
This guide explains how to test the new RPC-based registration system alongside the existing direct insert approach.

## Feature Flag
The RPC registration is controlled by the `NEXT_PUBLIC_USE_RPC_REGISTRATION` environment variable in `.env.local`.

- `false` (default): Uses existing direct table insert approach
- `true`: Uses new RPC function `create_registration`

## Testing Steps

### 1. Enable RPC Registration
```bash
# Edit .env.local and set:
NEXT_PUBLIC_USE_RPC_REGISTRATION=true

# Restart the development server
npm run dev
```

### 2. Test Scenarios

#### A. Individual Registration
1. Go to an event page
2. Click "Get Tickets"
3. Select "Register Myself"
4. Fill in attendee details
5. Select tickets
6. Complete payment
7. Verify registration is created successfully

#### B. Lodge Registration (Multiple Attendees)
1. Select "Register my Lodge"
2. Add multiple lodge members
3. Select tickets for each member
4. Complete payment
5. Verify all attendees are created

#### C. Error Scenarios
1. Invalid event ID
2. Non-existent ticket ID
3. Duplicate registration attempt

### 3. Monitoring

When RPC is enabled, look for these console logs:
- `🚀 Using RPC registration function`
- `📝 RPC Registration Data:` (shows transformed data)
- `✅ RPC Success:` (successful creation)
- `❌ RPC Error:` (if errors occur)

### 4. Database Verification

After successful registration, verify in Supabase:
1. `registrations` table has the new registration
2. `people` table has person records
3. `attendees` table has attendee records
4. `tickets` table has ticket assignments
5. `customers` table is updated

## RPC Function Benefits

1. **Atomic Transactions**: All operations succeed or fail together
2. **Data Integrity**: Database-level validation
3. **Performance**: Single database round-trip
4. **Consistency**: Business logic centralized in database

## Rollback

To disable RPC and revert to direct inserts:
```bash
# Edit .env.local and set:
NEXT_PUBLIC_USE_RPC_REGISTRATION=false

# Restart the development server
```

## Troubleshooting

### Common Issues

1. **RPC function not found**
   - Ensure the SQL function exists in Supabase
   - Check function permissions

2. **Data transformation errors**
   - Check console logs for transformed data structure
   - Verify all required fields are present

3. **Permission errors**
   - Verify RLS policies allow RPC execution
   - Check user authentication status

### Debug Mode

To enable detailed logging, the RPC wrapper already includes comprehensive logging:
- Input data transformation
- RPC response details
- Error messages with context

## Production Deployment

1. Deploy with feature flag disabled initially
2. Test in staging environment
3. Enable for small percentage of users
4. Monitor error rates and performance
5. Gradually increase rollout percentage
6. Full rollout when confident

## Performance Comparison

Monitor these metrics:
- Registration creation time
- Database query count
- Error rates
- User success rates

The RPC approach should show:
- Faster overall completion time
- Fewer database queries
- Better error handling
- More consistent data state