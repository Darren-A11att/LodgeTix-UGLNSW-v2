# Step 10: Database Integration and Test Data Management

## Objective
Integrate Puppeteer tests with Supabase database for test data management, including seeding, cleanup, and isolation.

## Tasks

### 10.1 Test Database Setup
- [ ] Create test database configuration
- [ ] Set up database isolation strategy
- [ ] Implement connection pooling
- [ ] Configure transaction rollback

### 10.2 Test Data Management
- [ ] Create data factory patterns
- [ ] Build seed data generators
- [ ] Implement cleanup strategies
- [ ] Design data snapshot system

### 10.3 Supabase Integration
- [ ] Create test-specific Supabase client
- [ ] Implement RLS bypass for tests
- [ ] Build data verification utilities
- [ ] Design state management helpers

### 10.4 Test Data Factories
- [ ] Create user data factories
- [ ] Build event data generators
- [ ] Implement ticket factories
- [ ] Design registration builders

## Implementation Examples

### Test Database Client
```typescript
import { createClient } from '@supabase/supabase-js';

export const testDb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Bypass RLS
  {
    db: { schema: 'test' }
  }
);
```

### Data Factory Pattern
```typescript
export class TestDataFactory {
  static async createMason(overrides?: Partial<Mason>) {
    const mason = {
      id: uuid(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      lodgeNumber: faker.number.int({ min: 1, max: 999 }),
      ...overrides
    };
    
    const { data } = await testDb
      .from('masonic_profiles')
      .insert(mason)
      .select()
      .single();
      
    return data;
  }

  static async createEvent(overrides?: Partial<Event>) {
    // Event creation logic
  }

  static async cleanup(tables: string[]) {
    for (const table of tables) {
      await testDb.from(table).delete().neq('id', '');
    }
  }
}
```

### Test Lifecycle Hooks
```typescript
beforeEach(async () => {
  // Start transaction
  await testDb.rpc('begin_test_transaction');
});

afterEach(async () => {
  // Rollback transaction
  await testDb.rpc('rollback_test_transaction');
});
```

## Expected Outputs
- Test database configuration
- Data factory implementations
- Cleanup utilities
- Integration documentation

## Success Criteria
- Isolated test environments
- Fast test data creation
- Reliable cleanup
- No test data pollution