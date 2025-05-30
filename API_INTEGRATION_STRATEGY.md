# LodgeTix API Integration Strategy

## Core Principle
**Business-critical data MUST be written to the database. UI state and preferences stay in localStorage.**

## Revised Supabase Integration Approach

### 1. Edge Functions - REQUIRED FOR STRIPE CONNECT

#### Stripe Connect Sync Edge Function (CRITICAL)
**Purpose**: Sync events and tickets with Stripe Connect accounts
```typescript
// supabase/functions/stripe-sync/index.ts
- Sync events → Stripe Products on connected accounts
- Sync ticket types → Stripe Prices
- Update product/price metadata
- Handle multi-account scenarios
```

**Why Edge Function**: 
- Runs asynchronously after event/ticket creation
- Handles Stripe API rate limits
- Manages connected account authentication
- Provides retry logic for failed syncs

#### Stripe Webhook Handler (OPTIONAL)
Could remain in Next.js API routes, but Edge Function provides:
- Isolated execution environment
- Better error handling
- Automatic retries
- Separate from main application

### 2. Document Generation Strategy
- **When**: After successful payment confirmation only
- **What**: PDF tickets with embedded QR codes
- **How**: Generated on-demand in application after payment
- **Delivery**: Email attachment or download link
- **Storage**: Not stored, generated fresh each time
- **Email**: Use existing application infrastructure

### 2. Anonymous Authentication - Already Implemented ✓

Current implementation in `/app/api/verify-turnstile-and-anon-auth/route.ts`:
- Creates anonymous session for registration
- Converts to full account after payment
- Maintains registration continuity

**Enhancement Opportunities**:
- Link anonymous sessions to abandoned carts
- Track conversion rates
- Implement session recovery

### 3. Realtime Functionality - High Value Use Cases

#### A. Ticket Availability (Postgres Changes)
**Implementation**:
```typescript
// Real-time ticket availability updates
const ticketChannel = supabase
  .channel('ticket-availability')
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'event_tickets',
      filter: `event_id=eq.${eventId}`
    }, 
    (payload) => {
      // Update UI with new availability
      updateTicketAvailability(payload.new)
    }
  )
  .subscribe()
```

**Benefits**:
- Live "tickets remaining" counter
- Instant sold-out notifications
- Prevent overselling

#### B. Registration Queue (Presence)
**Implementation**:
```typescript
// Track users in registration process
const presenceChannel = supabase.channel('registration-queue')
  .on('presence', { event: 'sync' }, () => {
    const state = presenceChannel.presenceState()
    // Show "X people looking at this event"
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await presenceChannel.track({
        user_id: userId,
        event_id: eventId,
        online_at: new Date().toISOString(),
      })
    }
  })
```

**Benefits**:
- Social proof ("5 people viewing")
- Queue management for high-demand events
- Abandonment tracking

#### C. Live Event Updates (Broadcast)
**Implementation**:
```typescript
// Broadcast event changes to all viewers
const eventChannel = supabase.channel('event-updates')
  .on('broadcast', { event: 'event-update' }, (payload) => {
    // Update event details in real-time
    updateEventInfo(payload)
  })
  .subscribe()

// Admin broadcasts updates
await supabase.channel('event-updates')
  .send({
    type: 'broadcast',
    event: 'event-update',
    payload: { 
      event_id: eventId,
      update_type: 'capacity_change',
      new_capacity: 500
    }
  })
```

### 4. Email Integration Strategy

#### Transactional Emails via Edge Function
```typescript
// Edge function structure
export async function sendEmail(type: EmailType, data: EmailData) {
  switch(type) {
    case 'registration_confirmation':
      return sendRegistrationConfirmation(data)
    case 'payment_receipt':
      return sendPaymentReceipt(data)
    case 'ticket_delivery':
      return sendTicketDelivery(data)
    // ... more email types
  }
}
```

#### Email Templates
- Store in database for easy updates
- Support multiple languages
- Include merge fields for personalization
- Track delivery and open rates

### 5. API Architecture Recommendations

#### A. RPC Functions for Complex Operations
Continue using RPC for:
- Multi-table transactions
- Complex calculations
- Atomic operations

#### B. REST API for Simple CRUD
Use Supabase auto-generated APIs for:
- Basic reads/writes
- Single table operations
- Simple filters

#### C. GraphQL for Complex Queries (Optional)
Consider for:
- Mobile app if developed
- Complex nested data requirements
- Reducing API calls

### 6. Data Capture Strategy

#### Every Interaction Tracked
```typescript
// Example: Track every UI interaction
async function trackInteraction(action: string, context: any) {
  await supabase.from('user_interactions').insert({
    user_id: userId,
    action,
    context,
    timestamp: new Date().toISOString(),
    session_id: sessionId,
    device_info: getDeviceInfo()
  })
}
```

#### Derived Data Automatically Calculated
- Use database triggers for calculations
- Edge functions for complex aggregations
- Materialized views for performance

### 7. Implementation Priority

#### Phase 1: Critical Path (Immediate)
1. Email Edge Function for confirmations
2. Realtime ticket availability
3. Enhanced error tracking

#### Phase 2: Enhanced Experience (Next Sprint)
1. PDF ticket generation
2. Registration queue presence
3. Live event updates

#### Phase 3: Advanced Features (Future)
1. Analytics edge functions
2. Advanced realtime features
3. Machine learning predictions

### 8. Security Considerations

#### Row Level Security (RLS)
- Currently disabled - needs implementation
- Define policies for each table
- Test thoroughly before enabling

#### API Security
- Rate limiting on Edge Functions
- API key rotation schedule
- Webhook signature verification

### 9. Performance Optimization

#### Caching Strategy
- Edge Function response caching
- Database query result caching
- Static asset caching

#### Connection Pooling
- Optimize Supabase client connections
- Use connection pooling in Edge Functions
- Monitor connection limits

### 10. Monitoring and Observability

#### What to Track
- Edge Function execution times
- Realtime subscription counts
- API response times
- Error rates and types

#### Alerting
- Failed email deliveries
- Payment processing errors
- Capacity threshold warnings
- Performance degradation

## Implementation Checklist

### Immediate Actions
- [ ] Create email Edge Function with templates
- [ ] Implement realtime ticket availability
- [ ] Add comprehensive error tracking
- [ ] Document all data capture points

### Short Term (2-4 weeks)
- [ ] Build PDF generation Edge Function
- [ ] Implement presence for queue management
- [ ] Create analytics Edge Functions
- [ ] Enable basic RLS policies

### Medium Term (1-3 months)
- [ ] Advanced realtime features
- [ ] Performance optimization
- [ ] Complete RLS implementation
- [ ] Monitoring dashboard

## Decision Matrix

| Feature | Complexity | Impact | Priority |
|---------|------------|---------|----------|
| Email Edge Function | Medium | High | Immediate |
| Realtime Availability | Low | High | Immediate |
| PDF Generation | Medium | Medium | Short-term |
| Presence Tracking | Low | Medium | Short-term |
| Analytics Functions | High | Medium | Medium-term |
| Full RLS | High | High | Medium-term |

## Architecture Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│ Supabase Client │────▶│    Database     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                         ▲
         │                       │                         │
         ▼                       ▼                         │
┌─────────────────┐     ┌─────────────────┐              │
│ Edge Functions  │     │    Realtime     │              │
│  - Email        │     │  - Availability │              │
│  - PDF Gen      │     │  - Presence     │──────────────┘
│  - Analytics    │     │  - Broadcast    │
└─────────────────┘     └─────────────────┘
```

## Conclusion

By leveraging Supabase's full capabilities:
1. **Edge Functions** for async processing and integrations
2. **Realtime** for live updates and better UX
3. **Comprehensive data capture** for analytics and optimization
4. **Security-first approach** with RLS and monitoring

This strategy ensures every piece of data is captured while providing a superior user experience through real-time updates and reliable background processing.