# Product Requirements Document: Functions-Based Architecture Refactor

## Executive Summary

This document outlines the architectural refactoring of the LodgeTix application from a parent-child event model to a functions-based model. This change introduces a new "functions" table as the primary container for events, replacing the current parent event concept, and enables application-wide filtering based on function or organisation scope.

## Current State

- **Parent-Child Events**: Parent events serve as containers for child events
- **Single Organiser**: Application currently serves one organiser
- **Mixed Concerns**: Parent events mix container logic with event logic
- **Limited Scoping**: No clear mechanism for filtering entire application to specific contexts

## Proposed State

### Core Changes

1. **Functions Table**: New primary container replacing parent events
2. **Clear Separation**: Distinct roles for organisations, functions, and events
3. **Environment-Based Filtering**: Application-wide scoping via environment variables
4. **Simplified CRUD**: More straightforward data operations

### Feature Flags (Environment Variables)

```
FILTER_TO: 'function' | 'organisation'
FUNCTION_ID: UUID (when FILTER_TO='function')
ORGANISATION_ID: UUID (when FILTER_TO='organisation')
```

## Database Schema Changes

### New Tables

#### functions
```sql
- function_id (UUID, PK)
- name (VARCHAR)
- slug (VARCHAR, UNIQUE)
- description (TEXT)
- image_url (VARCHAR)
- start_date (TIMESTAMP)
- end_date (TIMESTAMP)
- organiser_id (UUID, FK -> organisations.organisation_id)
- location_id (UUID, FK -> locations.location_id)
- metadata (JSONB) -- For homepage, registration wizard data
- is_published (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Modified Tables

#### organisations
```sql
ADD:
- hosting_functions (via relationship)
- registrations_made (via relationship)
```

#### events
```sql
REMOVE:
- parent_event_id
- organiser-related fields (inherit from function)

ADD:
- function_id (UUID, FK -> functions.function_id)

MODIFY:
- Now represent individual events only
```

#### registrations
```sql
REMOVE:
- event_id

ADD:
- function_id (UUID, FK -> functions.function_id)
```

#### attendees
```sql
ADD:
- attending_events (UUID[], FK -> events.event_id)
- is_partner_of (UUID, FK -> attendees.attendee_id)
- has_partner (UUID, FK -> attendees.attendee_id)
```

### Relationships

```
organisations (1) -----> (n) functions
functions (1) ---------> (n) events
functions (1) ---------> (n) registrations
functions (1) ---------> (n) packages
events (1) ------------> (n) event_tickets
events (1) ------------> (n) tickets (through attendees)
registrations (1) -----> (n) attendees
attendees (1) ---------> (n) tickets
attendees (n) ---------> (n) events (attending_events)
```

## Business Logic Changes

### Filtering Logic

1. **Function-Scoped Mode**:
   - All queries filter by function_id
   - Events shown only for that function
   - Registrations scoped to function
   - Packages specific to function

2. **Organisation-Scoped Mode** (Future):
   - All queries filter by organisation_id
   - All functions for organisation visible
   - Cross-function operations possible

### Data Access Patterns

1. **Homepage**: Shows function details instead of parent event
2. **Registration**: Registers for a function, selects events within
3. **Tickets**: Associated with specific events within a function
4. **Packages**: Belong to functions, apply to contained events

## Migration Strategy

### Phase 1: Database Migration
1. Create new tables (functions)
2. Migrate parent event data to functions
3. Update foreign keys and relationships
4. Remove deprecated columns

### Phase 2: Code Refactoring
1. Update data models and types
2. Refactor API services
3. Update UI components
4. Modify business logic

### Phase 3: Testing & Validation
1. Data integrity checks
2. Feature parity testing
3. Performance validation
4. User acceptance testing

## Impact Analysis

### Affected Components

**Backend**:
- Database schema
- RPC functions
- API services
- Data access layers
- Business logic

**Frontend**:
- Registration wizard
- Event listings
- Package selection
- Navigation structure

**Infrastructure**:
- Environment configuration
- Deployment scripts
- Monitoring queries

## Success Criteria

1. **Data Integrity**: All existing data successfully migrated
2. **Feature Parity**: All current functionality maintained
3. **Performance**: No degradation in query performance
4. **Flexibility**: Easy to switch between function/organisation modes
5. **Maintainability**: Clearer code structure and data flow

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during migration | High | Comprehensive backups, staged rollout |
| Breaking API changes | High | Versioned APIs, compatibility layer |
| Performance degradation | Medium | Query optimization, indexing strategy |
| User confusion | Medium | Clear communication, training |

## Timeline Estimate

- **Planning & Design**: 2 days
- **Database Migration**: 3 days
- **Code Refactoring**: 5 days
- **Testing & QA**: 3 days
- **Deployment**: 1 day
- **Total**: ~14 days

## Rollback Plan

1. Database snapshots before migration
2. Feature flags for gradual rollout
3. Compatibility layer for transition period
4. Clear rollback procedures documented

## Future Considerations

1. **Multi-Organisation Support**: Foundation for full multi-tenancy
2. **Cross-Function Operations**: Ability to register across functions
3. **Function Templates**: Reusable function configurations
4. **Advanced Filtering**: Complex organisation hierarchies

## Approval & Sign-off

- [ ] Technical Lead
- [ ] Product Owner
- [ ] Database Administrator
- [ ] QA Lead
- [ ] Operations Team