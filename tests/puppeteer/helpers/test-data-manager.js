const { createClient } = require('@supabase/supabase-js');
const config = require('../config/puppeteer.config');

/**
 * Test data management for Puppeteer tests
 * Handles creation and cleanup of test data in Supabase
 */
class TestDataManager {
  constructor() {
    this.supabase = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey || config.supabase.anonKey
    );
    
    this.testPrefix = 'puppeteer_test_';
    this.createdRecords = {
      events: [],
      registrations: [],
      attendees: [],
      tickets: []
    };
  }

  /**
   * Create test event
   */
  async createTestEvent(customData = {}) {
    const eventData = {
      name: `${this.testPrefix}Grand Installation ${Date.now()}`,
      slug: `${this.testPrefix}event-${Date.now()}`,
      description: 'Test event for Puppeteer E2E testing',
      start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      end_date: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
      venue_name: 'Test Masonic Centre',
      venue_address: '123 Test Street, Sydney NSW 2000',
      status: 'published',
      ...customData
    };

    const { data, error } = await this.supabase
      .from('events')
      .insert([eventData])
      .select()
      .single();

    if (error) {
      console.error('Failed to create test event:', error);
      throw error;
    }

    this.createdRecords.events.push(data.id);
    return data;
  }

  /**
   * Create test packages for event
   */
  async createTestPackages(eventId) {
    const packages = [
      {
        event_id: eventId,
        name: 'General Admission',
        description: 'Standard entry to the event',
        price: 150.00,
        capacity: 100,
        available: 100,
        is_active: true
      },
      {
        event_id: eventId,
        name: 'VIP Package',
        description: 'Premium experience with dinner',
        price: 350.00,
        capacity: 20,
        available: 20,
        is_active: true
      },
      {
        event_id: eventId,
        name: 'Lodge Package',
        description: 'Special rate for lodge members',
        price: 120.00,
        capacity: 50,
        available: 50,
        is_active: true,
        eligibility_criteria: { type: 'lodge_member' }
      }
    ];

    const { data, error } = await this.supabase
      .from('packages')
      .insert(packages)
      .select();

    if (error) {
      console.error('Failed to create test packages:', error);
      throw error;
    }

    return data;
  }

  /**
   * Create test user
   */
  async createTestUser(type = 'mason') {
    const timestamp = Date.now();
    const userData = {
      email: `${this.testPrefix}${type}_${timestamp}@example.com`,
      first_name: 'Test',
      last_name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${timestamp}`,
      phone: '0400000000'
    };

    // Create customer record
    const { data: customer, error: customerError } = await this.supabase
      .from('customers')
      .insert([userData])
      .select()
      .single();

    if (customerError) {
      console.error('Failed to create test customer:', error);
      throw customerError;
    }

    // If mason, create masonic profile
    if (type === 'mason') {
      const { data: profile, error: profileError } = await this.supabase
        .from('masonic_profiles')
        .insert([{
          customer_id: customer.id,
          member_number: `TEST${timestamp}`,
          lodge_number: '1234',
          lodge_name: 'Test Lodge No. 1234',
          rank: 'Master Mason',
          grand_lodge_id: 1 // Assuming NSW
        }])
        .select()
        .single();

      if (profileError) {
        console.error('Failed to create masonic profile:', profileError);
      }
    }

    return {
      ...customer,
      password: 'TestPassword123!',
      type
    };
  }

  /**
   * Create test registration
   */
  async createTestRegistration(eventId, customerId, status = 'draft') {
    const registrationData = {
      event_id: eventId,
      customer_id: customerId,
      registration_type: 'individual',
      status: status,
      total_amount_paid: 0,
      created_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('registrations')
      .insert([registrationData])
      .select()
      .single();

    if (error) {
      console.error('Failed to create test registration:', error);
      throw error;
    }

    this.createdRecords.registrations.push(data.id);
    return data;
  }

  /**
   * Create test attendee
   */
  async createTestAttendee(registrationId, customerData) {
    const attendeeData = {
      registration_id: registrationId,
      first_name: customerData.first_name,
      last_name: customerData.last_name,
      email: customerData.email,
      phone: customerData.phone,
      attendee_type: customerData.type || 'guest',
      is_primary: true
    };

    const { data, error } = await this.supabase
      .from('attendees')
      .insert([attendeeData])
      .select()
      .single();

    if (error) {
      console.error('Failed to create test attendee:', error);
      throw error;
    }

    this.createdRecords.attendees.push(data.id);
    return data;
  }

  /**
   * Create complete test scenario
   */
  async setupCompleteTestScenario() {
    try {
      // Create event
      const event = await this.createTestEvent();
      console.log('Created test event:', event.slug);

      // Create packages
      const packages = await this.createTestPackages(event.id);
      console.log('Created test packages:', packages.length);

      // Create test users
      const mason = await this.createTestUser('mason');
      const guest = await this.createTestUser('guest');
      console.log('Created test users:', mason.email, guest.email);

      return {
        event,
        packages,
        users: { mason, guest },
        urls: {
          eventPage: `/events/${event.slug}`,
          registrationStart: `/events/${event.slug}/register`
        }
      };
    } catch (error) {
      console.error('Failed to setup test scenario:', error);
      throw error;
    }
  }

  /**
   * Clean up all test data
   */
  async cleanup() {
    console.log('Cleaning up test data...');

    // Delete in reverse order of dependencies
    const tables = [
      { name: 'tickets', ids: this.createdRecords.tickets },
      { name: 'attendees', ids: this.createdRecords.attendees },
      { name: 'registrations', ids: this.createdRecords.registrations },
      { name: 'packages', filter: { event_id: this.createdRecords.events } },
      { name: 'events', ids: this.createdRecords.events }
    ];

    for (const { name, ids, filter } of tables) {
      if (ids && ids.length > 0) {
        const { error } = await this.supabase
          .from(name)
          .delete()
          .in('id', ids);

        if (error) {
          console.error(`Failed to clean up ${name}:`, error);
        } else {
          console.log(`Cleaned up ${ids.length} ${name}`);
        }
      } else if (filter) {
        const { error } = await this.supabase
          .from(name)
          .delete()
          .match(filter);

        if (error) {
          console.error(`Failed to clean up ${name}:`, error);
        }
      }
    }

    // Also clean up by prefix
    await this.cleanupByPrefix();
  }

  /**
   * Clean up data by test prefix
   */
  async cleanupByPrefix() {
    // Clean up events
    const { error: eventError } = await this.supabase
      .from('events')
      .delete()
      .like('slug', `${this.testPrefix}%`);

    if (eventError) {
      console.error('Failed to clean up prefixed events:', eventError);
    }

    // Clean up customers
    const { error: customerError } = await this.supabase
      .from('customers')
      .delete()
      .like('email', `${this.testPrefix}%`);

    if (customerError) {
      console.error('Failed to clean up prefixed customers:', customerError);
    }

    console.log('Cleaned up test data by prefix');
  }

  /**
   * Reset test database to clean state
   */
  async resetTestDatabase() {
    // Only run in test environment
    if (!process.env.CI && !process.env.TEST_ENV) {
      console.warn('Database reset only allowed in test environment');
      return;
    }

    await this.cleanupByPrefix();
    console.log('Test database reset complete');
  }

  /**
   * Seed database with specific test scenarios
   */
  async seedScenario(scenario) {
    const scenarios = {
      'sold-out-event': async () => {
        const event = await this.createTestEvent({ name: 'Sold Out Event' });
        const packages = await this.createTestPackages(event.id);
        
        // Mark all packages as sold out
        for (const pkg of packages) {
          await this.supabase
            .from('packages')
            .update({ available: 0 })
            .eq('id', pkg.id);
        }
        
        return { event, packages };
      },
      
      'multi-ticket-types': async () => {
        const event = await this.createTestEvent({ name: 'Multi Ticket Event' });
        
        // Create various ticket types
        const ticketTypes = [
          { name: 'Early Bird', price: 100 },
          { name: 'Regular', price: 150 },
          { name: 'Late', price: 200 },
          { name: 'Student', price: 50 },
          { name: 'Group (10+)', price: 120 }
        ];
        
        const packages = [];
        for (const type of ticketTypes) {
          const { data } = await this.supabase
            .from('packages')
            .insert([{
              event_id: event.id,
              name: type.name,
              price: type.price,
              capacity: 50,
              available: 50,
              is_active: true
            }])
            .select()
            .single();
          
          packages.push(data);
        }
        
        return { event, packages };
      },
      
      'registration-in-progress': async () => {
        const { event, packages, users } = await this.setupCompleteTestScenario();
        
        // Create a registration in progress
        const registration = await this.createTestRegistration(
          event.id,
          users.mason.id,
          'in_progress'
        );
        
        // Add an attendee
        await this.createTestAttendee(registration.id, users.mason);
        
        return {
          event,
          packages,
          users,
          registration,
          continueUrl: `/events/${event.slug}/register/${registration.id}/tickets`
        };
      }
    };

    if (scenarios[scenario]) {
      return await scenarios[scenario]();
    } else {
      throw new Error(`Unknown scenario: ${scenario}`);
    }
  }
}

// Export for use in tests
module.exports = TestDataManager;