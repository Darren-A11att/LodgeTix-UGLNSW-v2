# Backend Refactoring Tasks: Parent-Child Events to Functions-Based Architecture

## Overview
This document outlines the backend refactoring tasks required to migrate from the current parent-child event hierarchy (using `parent_event_id`) to a functions-based architecture with environment-based filtering.

## Prerequisites
- Database migration to add functions table must be completed
- Environment variables FILTER_TO and FUNCTION_ID must be configured
- Feature flag system must be in place

---

## BE-001: Create Functions Table and Database Schema

**Priority:** High  
**Dependencies:** None  
**Estimated Time:** 2 hours

### Tasks:
1. Create new database migration for functions table
2. Add foreign key relationships between events and functions
3. Create indexes for performance optimization
4. Add RLS policies for functions table

### Files to Create:
- `/supabase/migrations/[timestamp]_create_functions_table.sql`

### Schema Definition:
```sql
CREATE TABLE public.functions (
    function_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    location TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    organisation_id UUID REFERENCES organisations(organisation_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add function_id to events table
ALTER TABLE public.events 
ADD COLUMN function_id UUID REFERENCES functions(function_id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX idx_events_function_id ON events(function_id);
CREATE INDEX idx_functions_slug ON functions(slug);
CREATE INDEX idx_functions_active ON functions(is_active);
```

---

## BE-002: Update TypeScript Type Definitions

**Priority:** High  
**Dependencies:** BE-001  
**Estimated Time:** 3 hours

### Tasks:
1. Update database types to include functions table
2. Add function_id to event types
3. Create new function-related interfaces
4. Update existing event interfaces to support both architectures

### Files to Modify:
- `/shared/types/database.ts`
- `/shared/types/event.ts`
- `/lib/api/types.ts`

### New Type Definitions:
```typescript
// In database.ts
export interface Database {
  public: {
    Tables: {
      functions: {
        Row: {
          function_id: UUID
          name: string
          slug: string
          description: string | null
          start_date: string | null
          end_date: string | null
          location: string | null
          image_url: string | null
          is_active: boolean
          metadata: Json
          organisation_id: UUID | null
          created_at: string
          updated_at: string
        }
        Insert: {
          function_id?: UUID
          name: string
          slug: string
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          location?: string | null
          image_url?: string | null
          is_active?: boolean
          metadata?: Json
          organisation_id?: UUID | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          function_id?: UUID
          name?: string
          slug?: string
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          location?: string | null
          image_url?: string | null
          is_active?: boolean
          metadata?: Json
          organisation_id?: UUID | null
          created_at?: string
          updated_at?: string
        }
      }
      // Update events table type to include function_id
    }
  }
}

// In event.ts
export interface EventType {
  // ... existing fields ...
  parentEventId: string | null; // Keep for backward compatibility
  functionId: string | null; // New field
  functionName?: string | null; // Denormalized for performance
  functionSlug?: string | null; // Denormalized for performance
}

export interface FunctionType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  imageUrl: string | null;
  isActive: boolean;
  metadata: Record<string, any>;
  organisationId: string | null;
  events?: EventType[]; // Related events
}
```

---

## BE-003: Create Function Service Layer

**Priority:** High  
**Dependencies:** BE-002  
**Estimated Time:** 4 hours

### Tasks:
1. Create new function service for CRUD operations
2. Implement function-based event filtering
3. Add caching for function lookups
4. Create environment-based filtering logic

### Files to Create:
- `/lib/services/function-service.ts`
- `/lib/api/function-crud-service.ts`

### Implementation:
```typescript
// function-service.ts
import { createClient } from '@/utils/supabase/server'
import { FunctionType } from '@/shared/types'

export class FunctionService {
  async getFunctionBySlug(slug: string): Promise<FunctionType | null> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('functions')
      .select(`
        *,
        events!function_id(*)
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
    
    if (error) {
      console.error('Error fetching function:', error)
      return null
    }
    
    return this.mapToFunctionType(data)
  }
  
  async getEventsByFunction(functionId: string): Promise<EventType[]> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('function_id', functionId)
      .eq('is_published', true)
      .order('event_start', { ascending: true })
    
    if (error) {
      console.error('Error fetching events by function:', error)
      return []
    }
    
    return data.map(event => this.mapToEventType(event))
  }
  
  // Environment-based filtering
  async getFilteredEvents(): Promise<EventType[]> {
    const filterTo = process.env.FILTER_TO
    const functionId = process.env.FUNCTION_ID
    
    if (filterTo === 'function' && functionId) {
      return this.getEventsByFunction(functionId)
    }
    
    // Fallback to all events
    return this.getAllEvents()
  }
}
```

---

## BE-004: Update Event Services for Dual Architecture Support

**Priority:** High  
**Dependencies:** BE-003  
**Estimated Time:** 6 hours

### Tasks:
1. Update event services to support both parent_event_id and function_id
2. Implement feature flag checking
3. Add backward compatibility layer
4. Update event queries to include function data

### Files to Modify:
- `/lib/services/event-service.ts`
- `/lib/services/event-service-optimized.ts`
- `/lib/api/event-crud-service.ts`
- `/lib/api/event-rpc-service.ts`

### Implementation Updates:
```typescript
// In event-service.ts
export async function getEventByIdOrSlug(idOrSlug: string): Promise<Event | null> {
  const supabase = await createClient()
  const useFunctionsArchitecture = process.env.USE_FUNCTIONS_ARCHITECTURE === 'true'
  
  let query = supabase
    .from('events')
    .select(`
      *,
      tickets:Tickets(*),
      ${useFunctionsArchitecture ? 'function:functions!function_id(*)' : ''}
    `)
  
  // ... rest of implementation
}

// Add new method for function-based queries
export async function getEventsByFunctionSlug(functionSlug: string): Promise<Event[]> {
  const supabase = await createClient()
  
  const { data: functionData, error: functionError } = await supabase
    .from('functions')
    .select('function_id')
    .eq('slug', functionSlug)
    .single()
  
  if (functionError || !functionData) {
    return []
  }
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('function_id', functionData.function_id)
    .eq('is_published', true)
    .order('event_start', { ascending: true })
  
  // ... rest of implementation
}
```

---

## BE-005: Update RPC Functions for Functions Architecture

**Priority:** High  
**Dependencies:** BE-004  
**Estimated Time:** 4 hours

### Tasks:
1. Update get_event_with_details RPC to include function data
2. Create new RPC functions for function-based queries
3. Update existing RPC functions to support both architectures
4. Add performance optimizations for function queries

### Files to Create/Modify:
- `/supabase/migrations/[timestamp]_update_rpc_functions.sql`

### RPC Function Updates:
```sql
-- Update get_event_with_details to include function data
CREATE OR REPLACE FUNCTION get_event_with_details(p_event_id UUID)
RETURNS TABLE (
  -- ... existing columns ...
  function_id UUID,
  function_name TEXT,
  function_slug TEXT,
  -- ... rest of columns ...
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.*,
    f.function_id,
    f.name as function_name,
    f.slug as function_slug
  FROM events e
  LEFT JOIN functions f ON e.function_id = f.function_id
  WHERE e.event_id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- New RPC function for function-based queries
CREATE OR REPLACE FUNCTION get_events_by_function(p_function_id UUID)
RETURNS TABLE (
  event_id UUID,
  title TEXT,
  slug TEXT,
  event_start TIMESTAMPTZ,
  -- ... other columns ...
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.event_id,
    e.title,
    e.slug,
    e.event_start
    -- ... other columns ...
  FROM events e
  WHERE e.function_id = p_function_id
    AND e.is_published = true
  ORDER BY e.event_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## BE-006: Update API Routes for Functions Support

**Priority:** Medium  
**Dependencies:** BE-005  
**Estimated Time:** 4 hours

### Tasks:
1. Add new API routes for function operations
2. Update existing event routes to support function filtering
3. Implement proper error handling for function queries
4. Add validation for function-based requests

### Files to Create/Modify:
- `/app/api/functions/route.ts` (new)
- `/app/api/functions/[slug]/route.ts` (new)
- `/app/api/events/[slug]/route.ts` (modify)

### New API Route Implementation:
```typescript
// /app/api/functions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { FunctionService } from '@/lib/services/function-service'

export async function GET(request: NextRequest) {
  try {
    const functionService = new FunctionService()
    const functions = await functionService.getAllFunctions()
    
    return NextResponse.json({ 
      success: true, 
      data: functions 
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch functions' 
    }, { status: 500 })
  }
}

// /app/api/functions/[slug]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const functionService = new FunctionService()
    const functionData = await functionService.getFunctionBySlug(params.slug)
    
    if (!functionData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Function not found' 
      }, { status: 404 })
    }
    
    return NextResponse.json({ 
      success: true, 
      data: functionData 
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch function' 
    }, { status: 500 })
  }
}
```

---

## BE-007: Implement Environment Variable Configuration

**Priority:** Medium  
**Dependencies:** BE-006  
**Estimated Time:** 2 hours

### Tasks:
1. Add environment variable definitions
2. Create configuration service for environment-based filtering
3. Update .env.example with new variables
4. Add validation for environment variables

### Files to Create/Modify:
- `/lib/config/environment.ts` (new)
- `/.env.example` (modify)
- `/lib/services/config-service.ts` (new)

### Environment Configuration:
```typescript
// /lib/config/environment.ts
export interface EnvironmentConfig {
  filterTo: 'all' | 'function' | 'organization' | null
  functionId: string | null
  organizationId: string | null
  useFunctionsArchitecture: boolean
}

export function getEnvironmentConfig(): EnvironmentConfig {
  return {
    filterTo: process.env.FILTER_TO as any || null,
    functionId: process.env.FUNCTION_ID || null,
    organizationId: process.env.ORGANIZATION_ID || null,
    useFunctionsArchitecture: process.env.USE_FUNCTIONS_ARCHITECTURE === 'true'
  }
}

// Validation
export function validateEnvironmentConfig(config: EnvironmentConfig): void {
  if (config.filterTo === 'function' && !config.functionId) {
    throw new Error('FUNCTION_ID must be set when FILTER_TO=function')
  }
  
  if (config.filterTo === 'organization' && !config.organizationId) {
    throw new Error('ORGANIZATION_ID must be set when FILTER_TO=organization')
  }
}
```

### .env.example Updates:
```bash
# Event Filtering Configuration
# Options: 'all', 'function', 'organization'
FILTER_TO=all

# Required when FILTER_TO=function
FUNCTION_ID=

# Required when FILTER_TO=organization
ORGANIZATION_ID=

# Feature flag for functions architecture
USE_FUNCTIONS_ARCHITECTURE=false
```

---

## BE-008: Update Homepage and Event Display Services

**Priority:** Medium  
**Dependencies:** BE-007  
**Estimated Time:** 4 hours

### Tasks:
1. Update homepage service to respect function filtering
2. Modify featured events logic for function context
3. Update event display components to show function information
4. Add function-based navigation breadcrumbs

### Files to Modify:
- `/lib/services/homepage-service.ts`
- `/lib/services/homepage-service-optimized.ts`
- `/lib/services/content-service.ts`

### Implementation Updates:
```typescript
// In homepage-service.ts
export async function getFeaturedEvents(): Promise<EventType[]> {
  const config = getEnvironmentConfig()
  
  if (config.filterTo === 'function' && config.functionId) {
    // Get featured events only from the specified function
    return getFeaturedEventsByFunction(config.functionId)
  }
  
  // Original logic for all events
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_featured', true)
    .eq('is_published', true)
    .order('event_start', { ascending: true })
    .limit(6)
  
  // ... rest of implementation
}

// New function-specific method
async function getFeaturedEventsByFunction(functionId: string): Promise<EventType[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      function:functions!function_id(
        name,
        slug
      )
    `)
    .eq('function_id', functionId)
    .eq('is_featured', true)
    .eq('is_published', true)
    .order('event_start', { ascending: true })
    .limit(6)
  
  // ... rest of implementation
}
```

---

## BE-009: Update Ticket and Package Services

**Priority:** Medium  
**Dependencies:** BE-008  
**Estimated Time:** 3 hours

### Tasks:
1. Update ticket eligibility to consider function context
2. Modify package queries to support function filtering
3. Update ticket availability checks for function scope
4. Add function-based pricing strategies

### Files to Modify:
- `/lib/services/ticket-service-optimized.ts`
- `/lib/api/ticketService.ts`
- `/lib/api/packageAdminService.ts`
- `/lib/packageService.ts`

### Implementation Updates:
```typescript
// In ticket-service-optimized.ts
export async function getAvailableTickets(eventId: string): Promise<Ticket[]> {
  const config = getEnvironmentConfig()
  const supabase = await createClient()
  
  let query = supabase
    .from('event_tickets')
    .select(`
      *,
      event:events!event_id(
        event_id,
        title,
        function_id,
        ${config.useFunctionsArchitecture ? 'function:functions!function_id(*)' : ''}
      )
    `)
    .eq('event_id', eventId)
    .eq('is_active', true)
  
  // Apply function-based filtering if needed
  if (config.filterTo === 'function' && config.functionId) {
    query = query.eq('event.function_id', config.functionId)
  }
  
  const { data, error } = await query
  
  // ... rest of implementation
}
```

---

## BE-010: Create Data Migration Scripts

**Priority:** High  
**Dependencies:** BE-001  
**Estimated Time:** 3 hours

### Tasks:
1. Create script to populate function_id based on parent_event_id
2. Create validation script to ensure data integrity
3. Create rollback script for emergency scenarios
4. Document migration process

### Files to Create:
- `/scripts/migrate-to-functions.ts`
- `/scripts/validate-function-migration.ts`
- `/scripts/rollback-function-migration.ts`

### Migration Script:
```typescript
// /scripts/migrate-to-functions.ts
import { createClient } from '@supabase/supabase-js'

async function migrateToFunctions() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  // Step 1: Get all parent events
  const { data: parentEvents, error: parentError } = await supabase
    .from('events')
    .select('*')
    .is('parent_event_id', null)
    .eq('type', 'parent') // or whatever identifies parent events
  
  if (parentError) {
    console.error('Error fetching parent events:', parentError)
    return
  }
  
  // Step 2: Create functions for each parent event
  for (const parentEvent of parentEvents) {
    // Create function
    const { data: functionData, error: functionError } = await supabase
      .from('functions')
      .insert({
        name: parentEvent.title,
        slug: parentEvent.slug,
        description: parentEvent.description,
        start_date: parentEvent.event_start,
        end_date: parentEvent.event_end,
        location: parentEvent.location,
        image_url: parentEvent.image_url,
        organisation_id: parentEvent.organisation_id
      })
      .select()
      .single()
    
    if (functionError) {
      console.error(`Error creating function for ${parentEvent.title}:`, functionError)
      continue
    }
    
    // Step 3: Update parent event with function_id
    await supabase
      .from('events')
      .update({ function_id: functionData.function_id })
      .eq('event_id', parentEvent.event_id)
    
    // Step 4: Update all child events with function_id
    await supabase
      .from('events')
      .update({ function_id: functionData.function_id })
      .eq('parent_event_id', parentEvent.event_id)
  }
  
  console.log('Migration completed')
}

// Run migration
migrateToFunctions().catch(console.error)
```

---

## BE-011: Update Registration and Payment Services

**Priority:** High  
**Dependencies:** BE-010  
**Estimated Time:** 4 hours

### Tasks:
1. Update registration services to include function context
2. Modify payment metadata to include function information
3. Update confirmation emails to show function details
4. Add function-based reporting capabilities

### Files to Modify:
- `/lib/api/registration-rpc-service-v3.ts`
- `/lib/services/registration-service-optimized.ts`
- `/lib/services/post-payment-service.ts`
- `/lib/utils/stripe-metadata.ts`

### Implementation Updates:
```typescript
// In stripe-metadata.ts
export interface StripeMetadata {
  // ... existing fields ...
  function_id?: string
  function_name?: string
  function_slug?: string
}

// In registration-rpc-service-v3.ts
export async function createRegistrationWithFunction(
  registrationData: RegistrationInput
): Promise<RegistrationResponse> {
  const supabase = await createClient()
  const config = getEnvironmentConfig()
  
  // Add function context to registration
  if (config.filterTo === 'function' && config.functionId) {
    registrationData.metadata = {
      ...registrationData.metadata,
      function_id: config.functionId
    }
  }
  
  // ... rest of implementation
}
```

---

## BE-012: Implement Feature Flag System

**Priority:** Medium  
**Dependencies:** None  
**Estimated Time:** 3 hours

### Tasks:
1. Create feature flag service
2. Implement gradual rollout capabilities
3. Add feature flag checks throughout codebase
4. Create admin interface for feature flag management

### Files to Create:
- `/lib/services/feature-flag-service.ts`
- `/lib/config/feature-flags.ts`

### Feature Flag Implementation:
```typescript
// /lib/config/feature-flags.ts
export enum FeatureFlag {
  USE_FUNCTIONS_ARCHITECTURE = 'use_functions_architecture',
  SHOW_FUNCTION_NAVIGATION = 'show_function_navigation',
  ENABLE_FUNCTION_FILTERING = 'enable_function_filtering'
}

// /lib/services/feature-flag-service.ts
export class FeatureFlagService {
  private static instance: FeatureFlagService
  private flags: Map<string, boolean>
  
  constructor() {
    this.flags = new Map([
      [FeatureFlag.USE_FUNCTIONS_ARCHITECTURE, false],
      [FeatureFlag.SHOW_FUNCTION_NAVIGATION, false],
      [FeatureFlag.ENABLE_FUNCTION_FILTERING, false]
    ])
    
    this.loadFromEnvironment()
  }
  
  private loadFromEnvironment() {
    // Load from environment variables
    if (process.env.USE_FUNCTIONS_ARCHITECTURE === 'true') {
      this.flags.set(FeatureFlag.USE_FUNCTIONS_ARCHITECTURE, true)
    }
  }
  
  static getInstance(): FeatureFlagService {
    if (!this.instance) {
      this.instance = new FeatureFlagService()
    }
    return this.instance
  }
  
  isEnabled(flag: FeatureFlag): boolean {
    return this.flags.get(flag) || false
  }
  
  async checkUserFlag(flag: FeatureFlag, userId?: string): Promise<boolean> {
    // Check if flag is enabled for specific user
    // This could query a database or use a service like LaunchDarkly
    const globalEnabled = this.isEnabled(flag)
    
    if (!userId || !globalEnabled) {
      return globalEnabled
    }
    
    // User-specific logic here
    return globalEnabled
  }
}
```

---

## BE-013: Add Backward Compatibility Layer

**Priority:** High  
**Dependencies:** BE-012  
**Estimated Time:** 4 hours

### Tasks:
1. Create compatibility service for dual architecture support
2. Implement fallback mechanisms
3. Add logging for migration tracking
4. Create deprecation warnings

### Files to Create:
- `/lib/services/compatibility-service.ts`
- `/lib/utils/migration-logger.ts`

### Compatibility Implementation:
```typescript
// /lib/services/compatibility-service.ts
export class CompatibilityService {
  private featureFlags: FeatureFlagService
  
  constructor() {
    this.featureFlags = FeatureFlagService.getInstance()
  }
  
  async getEventHierarchy(eventId: string): Promise<EventHierarchy> {
    const useFunctions = this.featureFlags.isEnabled(
      FeatureFlag.USE_FUNCTIONS_ARCHITECTURE
    )
    
    if (useFunctions) {
      return this.getEventHierarchyByFunction(eventId)
    }
    
    // Fallback to parent_event_id
    return this.getEventHierarchyByParent(eventId)
  }
  
  private async getEventHierarchyByFunction(eventId: string): Promise<EventHierarchy> {
    const supabase = await createClient()
    
    const { data: event } = await supabase
      .from('events')
      .select(`
        *,
        function:functions!function_id(
          *,
          events!function_id(*)
        )
      `)
      .eq('event_id', eventId)
      .single()
    
    // ... implementation
  }
  
  private async getEventHierarchyByParent(eventId: string): Promise<EventHierarchy> {
    console.warn(
      'Using deprecated parent_event_id hierarchy. ' +
      'Please migrate to functions architecture.'
    )
    
    // ... legacy implementation
  }
}
```

---

## BE-014: Update Testing and Documentation

**Priority:** Medium  
**Dependencies:** BE-001 through BE-013  
**Estimated Time:** 6 hours

### Tasks:
1. Update existing tests for dual architecture support
2. Create new tests for functions architecture
3. Update API documentation
4. Create migration guide for developers

### Files to Create/Modify:
- `/tests/api/functions.test.ts` (new)
- `/tests/services/function-service.test.ts` (new)
- `/docs/FUNCTIONS_ARCHITECTURE.md` (new)
- `/docs/MIGRATION_GUIDE.md` (new)

### Documentation Structure:
```markdown
# Functions Architecture Migration Guide

## Overview
This guide explains the migration from parent-child event hierarchy to functions-based architecture.

## Architecture Comparison

### Old Architecture (Parent-Child)
- Events use parent_event_id for hierarchy
- Limited to two-level hierarchy
- Complex queries for related events

### New Architecture (Functions-Based)
- Events belong to functions via function_id
- Unlimited event grouping flexibility
- Environment-based filtering support
- Better performance for grouped queries

## Migration Steps

1. **Enable Feature Flag**
   ```bash
   USE_FUNCTIONS_ARCHITECTURE=true
   ```

2. **Run Migration Script**
   ```bash
   npm run migrate:functions
   ```

3. **Configure Environment Filtering**
   ```bash
   FILTER_TO=function
   FUNCTION_ID=your-function-uuid
   ```

## API Changes

### New Endpoints
- GET /api/functions
- GET /api/functions/[slug]
- GET /api/functions/[slug]/events

### Updated Endpoints
- GET /api/events now supports function filtering
- GET /api/events/[slug] includes function data

## Testing

Run the test suite with both architectures:
```bash
npm run test:compatibility
```
```

---

## BE-015: Performance Optimization and Monitoring

**Priority:** Low  
**Dependencies:** BE-014  
**Estimated Time:** 3 hours

### Tasks:
1. Add performance metrics for function queries
2. Create database indexes for function_id
3. Implement caching strategy for function data
4. Add monitoring dashboards

### Files to Create/Modify:
- `/lib/monitoring/performance-metrics.ts` (new)
- `/lib/cache/function-cache.ts` (new)
- `/supabase/migrations/[timestamp]_add_function_indexes.sql`

### Performance Implementation:
```typescript
// /lib/monitoring/performance-metrics.ts
export class PerformanceMetrics {
  static async trackFunctionQuery(
    functionId: string,
    queryType: string,
    duration: number
  ) {
    // Log to monitoring service (e.g., Sentry, DataDog)
    console.log(`Function query performance: ${queryType}`, {
      functionId,
      duration,
      timestamp: new Date().toISOString()
    })
  }
}

// /lib/cache/function-cache.ts
import { LRUCache } from 'lru-cache'

export class FunctionCache {
  private static cache = new LRUCache<string, any>({
    max: 100,
    ttl: 1000 * 60 * 5 // 5 minutes
  })
  
  static async get<T>(key: string): Promise<T | undefined> {
    return this.cache.get(key)
  }
  
  static async set<T>(key: string, value: T): Promise<void> {
    this.cache.set(key, value)
  }
  
  static invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }
}
```

---

## Implementation Timeline

### Phase 1: Foundation (Week 1)
- BE-001: Create Functions Table
- BE-002: Update TypeScript Types
- BE-003: Create Function Service Layer
- BE-012: Implement Feature Flag System

### Phase 2: Core Services (Week 2)
- BE-004: Update Event Services
- BE-005: Update RPC Functions
- BE-006: Update API Routes
- BE-007: Environment Configuration

### Phase 3: Integration (Week 3)
- BE-008: Update Homepage Services
- BE-009: Update Ticket Services
- BE-011: Update Registration Services
- BE-013: Backward Compatibility

### Phase 4: Migration & Testing (Week 4)
- BE-010: Data Migration Scripts
- BE-014: Testing and Documentation
- BE-015: Performance Optimization

## Rollback Plan

If issues arise during migration:

1. **Disable Feature Flags**
   ```bash
   USE_FUNCTIONS_ARCHITECTURE=false
   ```

2. **Run Rollback Script**
   ```bash
   npm run rollback:functions
   ```

3. **Clear Function Cache**
   ```bash
   npm run cache:clear:functions
   ```

4. **Monitor Error Rates**
   - Check Sentry for increased errors
   - Monitor API response times
   - Verify data integrity

## Success Criteria

- [ ] All existing functionality works with both architectures
- [ ] Performance metrics show no degradation
- [ ] Zero data loss during migration
- [ ] All tests pass with feature flags on/off
- [ ] Documentation is complete and accurate
- [ ] Team is trained on new architecture

## Notes

- Keep parent_event_id column for at least 6 months after migration
- Monitor usage of legacy endpoints
- Plan gradual deprecation of old architecture
- Consider A/B testing for performance comparison