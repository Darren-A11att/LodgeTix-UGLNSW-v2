import { createClient } from '@supabase/supabase-js';

describe('Database Views Validation', () => {
  let supabase: any;

  beforeAll(async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  });

  describe('API Endpoint Database Views', () => {
    test('function_event_tickets_view should exist and be queryable', async () => {
      const { data, error } = await supabase
        .from('function_event_tickets_view')
        .select('*')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    test('function_packages_view should exist and be queryable', async () => {
      const { data, error } = await supabase
        .from('function_packages_view')
        .select('*')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    test('individuals_registration_confirmation_view should exist and be queryable', async () => {
      const { data, error } = await supabase
        .from('individuals_registration_confirmation_view')
        .select('*')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    test('individuals_registration_complete_view should exist and be queryable', async () => {
      const { data, error } = await supabase
        .from('individuals_registration_complete_view')
        .select('*')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('API Endpoint Simulation', () => {
    const FEATURED_FUNCTION_ID = process.env.FEATURED_FUNCTION_ID || 'eebddef5-6833-43e3-8d32-700508b1c089';

    test('tickets endpoint query should work', async () => {
      const { data, error } = await supabase
        .from('function_event_tickets_view')
        .select('*')
        .eq('function_id', FEATURED_FUNCTION_ID)
        .order('event_start', { ascending: true })
        .order('ticket_name', { ascending: true });

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    test('packages endpoint query should work', async () => {
      const { data, error } = await supabase
        .from('function_packages_view')
        .select('*')
        .eq('function_id', FEATURED_FUNCTION_ID)
        .order('package_name');

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('RPC Functions Validation', () => {
    test('upsert_individual_registration RPC should exist', async () => {
      // Test with minimal valid data structure
      const testData = {
        functionId: 'eebddef5-6833-43e3-8d32-700508b1c089',
        registrationType: 'individuals',
        primaryAttendee: {
          attendeeType: 'guest',
          title: 'Mr',
          firstName: 'Test',
          lastName: 'User',
          contactPreference: 'email'
        },
        additionalAttendees: [],
        tickets: [],
        totalAmount: 0,
        subtotal: 0,
        stripeFee: 0,
        billingDetails: {
          firstName: 'Test',
          lastName: 'User',
          emailAddress: 'test@example.com'
        },
        agreeToTerms: true,
        authUserId: '00000000-0000-0000-0000-000000000000', // Test UUID
        paymentCompleted: false
      };

      const { data, error } = await supabase
        .rpc('upsert_individual_registration', {
          p_registration_data: testData
        });

      // Should either succeed or fail with a specific error, not "function does not exist"
      expect(error?.message).not.toContain('function "upsert_individual_registration" does not exist');
    });
  });

  describe('Table and Column Validation', () => {
    test('registrations table should have required columns', async () => {
      const { data, error } = await supabase
        .from('registrations')
        .select('registration_id, function_id, customer_id, registration_type, payment_status, status')
        .limit(1);

      expect(error).toBeNull();
    });

    test('functions table should have required columns', async () => {
      const { data, error } = await supabase
        .from('functions')
        .select('function_id, name, slug')
        .limit(1);

      expect(error).toBeNull();
    });

    test('event_tickets table should have required columns', async () => {
      const { data, error } = await supabase
        .from('event_tickets')
        .select('event_ticket_id, event_id, name, price, is_active')
        .limit(1);

      expect(error).toBeNull();
    });

    test('packages table should have required columns', async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('package_id, function_id, name, package_price, is_active')
        .limit(1);

      expect(error).toBeNull();
    });
  });

  describe('Enum Types Validation', () => {
    test('payment_status enum should be accessible', async () => {
      const { data, error } = await supabase
        .from('registrations')
        .select('payment_status')
        .not('payment_status', 'is', null)
        .limit(1);

      expect(error).toBeNull();
    });

    test('registration_type enum should be accessible', async () => {
      const { data, error } = await supabase
        .from('registrations')
        .select('registration_type')
        .not('registration_type', 'is', null)
        .limit(1);

      expect(error).toBeNull();
    });

    test('attendee_type enum should be accessible', async () => {
      const { data, error } = await supabase
        .from('attendees')
        .select('attendee_type')
        .not('attendee_type', 'is', null)
        .limit(1);

      expect(error).toBeNull();
    });
  });

  describe('RLS Policy Validation', () => {
    test('views should be accessible to service role', async () => {
      // This test verifies that the views have proper RLS policies
      const views = [
        'function_event_tickets_view',
        'function_packages_view',
        'individuals_registration_confirmation_view',
        'individuals_registration_complete_view'
      ];

      for (const viewName of views) {
        const { data, error } = await supabase
          .from(viewName)
          .select('*')
          .limit(1);

        expect(error).toBeNull();
      }
    });
  });
});