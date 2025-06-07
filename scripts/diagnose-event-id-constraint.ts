#!/usr/bin/env node

/**
 * Diagnose whether the event_id constraint is in the database schema or RPC function
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pwwpcjbbxotmiqrisjvf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3d3BjamJieG90bWlxcmlzanZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTU0ODU2OCwiZXhwIjoyMDYxMTI0NTY4fQ.pJ3CEbhkGpWX8mYL-AyJKahsZywuRz6PkQmnNuLYsZk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseConstraint() {
  try {
    console.log('🔍 DIAGNOSING EVENT_ID CONSTRAINT...');
    
    // Test 1: Check database schema constraints on tickets table
    console.log('\n1. Checking database schema constraints...');
    
    const { data: constraints, error: constraintError } = await supabase
      .rpc('exec', {
        sql: `
          SELECT 
            conname as constraint_name,
            contype as constraint_type,
            a.attname as column_name,
            a.attnotnull as is_not_null
          FROM pg_constraint c
          JOIN pg_class t ON c.conrelid = t.oid
          JOIN pg_attribute a ON a.attrelid = t.oid
          WHERE t.relname = 'tickets' 
          AND a.attname = 'event_id'
          AND a.attnum > 0;
        `
      });
    
    if (constraintError) {
      console.log('Could not check constraints via exec, trying alternative...');
      
      // Alternative: Check if we can insert a ticket with NULL event_id directly
      console.log('\n2. Testing direct database insert with NULL event_id...');
      
      const { data: authData } = await supabase.auth.signInAnonymously();
      
      const testTicket = {
        ticket_id: crypto.randomUUID(),
        attendee_id: crypto.randomUUID(),
        event_id: null, // Test NULL
        registration_id: crypto.randomUUID(),
        status: 'Active',
        payment_status: 'Unpaid',
        price_paid: 0,
        original_price: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: insertResult, error: insertError } = await supabase
        .from('tickets')
        .insert(testTicket);
      
      if (insertError) {
        console.error('❌ Direct database insert with NULL event_id fails:', insertError);
        
        if (insertError.message?.includes('null value in column "event_id"')) {
          console.log('\n💡 DIAGNOSIS: DATABASE CONSTRAINT');
          console.log('The database table "tickets" has a NOT NULL constraint on event_id');
          console.log('You need to run: ALTER TABLE tickets ALTER COLUMN event_id DROP NOT NULL;');
        }
      } else {
        console.log('✅ Direct database insert with NULL event_id succeeds');
        console.log('Database allows NULL event_id');
        
        // Clean up test ticket
        await supabase.from('tickets').delete().eq('ticket_id', testTicket.ticket_id);
      }
      
    } else {
      console.log('Schema constraints:', constraints);
    }
    
    // Test 3: Test RPC function with minimal ticket payload
    console.log('\n3. Testing RPC function with NULL event_id ticket...');
    
    const { data: authData2 } = await supabase.auth.signInAnonymously();
    
    const rpcTestPayload = {
      registrationId: crypto.randomUUID(),
      functionId: 'eebddef5-6833-43e3-8d32-700508b1c089',
      registrationType: 'individuals',
      primaryAttendee: {
        attendeeId: crypto.randomUUID(),
        attendeeType: "guest",
        firstName: "Test",
        lastName: "User"
      },
      additionalAttendees: [],
      tickets: [
        {
          id: "test-ticket",
          attendeeId: crypto.randomUUID(),
          price: 100
          // No eventId or eventTicketId - should result in NULL
        }
      ],
      billingDetails: {
        firstName: "Test",
        lastName: "User",
        emailAddress: "test@example.com",
        mobileNumber: "0123456789"
      },
      authUserId: authData2.user.id,
      paymentCompleted: false
    };
    
    // Make sure attendee mapping works
    rpcTestPayload.tickets[0].attendeeId = rpcTestPayload.primaryAttendee.attendeeId;
    
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('upsert_individual_registration', {
        p_registration_data: rpcTestPayload
      });
    
    if (rpcError) {
      console.error('❌ RPC function fails with NULL event_id:', rpcError);
      
      if (rpcError.message?.includes('null value in column "event_id"')) {
        console.log('\n💡 DIAGNOSIS: DATABASE CONSTRAINT (via RPC)');
        console.log('The RPC function fails because the database enforces NOT NULL on event_id');
      } else {
        console.log('\n💡 DIAGNOSIS: RPC FUNCTION ISSUE');
        console.log('The RPC function has other issues processing tickets');
      }
    } else {
      console.log('✅ RPC function succeeds with NULL event_id:', rpcResult);
      console.log('Both database and RPC function work correctly');
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('- If direct insert fails: DATABASE has NOT NULL constraint');
    console.log('- If RPC fails but direct insert works: RPC FUNCTION issue');
    console.log('- If both work: Something else is causing the API error');
    
  } catch (error: any) {
    console.error('💥 Diagnosis failed:', error.message);
  }
}

diagnoseConstraint();