#!/usr/bin/env bun

/**
 * Update the RPC function on remote database to fix syntax errors
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://pwwpcjbbxotmiqrisjvf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3d3BjamJieG90bWlxcmlzanZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTU0ODU2OCwiZXhwIjoyMDYxMTI0NTY4fQ.pJ3CEbhkGpWX8mYL-AyJKahsZywuRz6PkQmnNuLYsZk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateRPCFunction() {
  try {
    console.log('🔧 Updating RPC function on remote database...');
    
    // Read the RPC function SQL
    const sqlContent = fs.readFileSync('scripts/fix-rpc-syntax-error.sql', 'utf-8');
    
    // Execute the SQL to update the function using the REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify({
        query: sqlContent
      })
    });
    
    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    console.log('✅ RPC function updated successfully');
    
    // Test the function with a simple call
    console.log('🧪 Testing updated RPC function...');
    
    const testPayload = {
      authUserId: '123e4567-e89b-12d3-a456-426614174000',
      functionId: 'eebddef5-6833-43e3-8d32-700508b1c089',
      registrationId: crypto.randomUUID(),
      primaryAttendee: {
        attendeeId: crypto.randomUUID(),
        firstName: 'Test',
        lastName: 'User',
        attendeeType: 'guest',
        isPrimary: true,
        email: 'test@example.com',
        mobileNumber: '0123456789'
      },
      billingDetails: {
        firstName: 'Test',
        lastName: 'User',
        emailAddress: 'test@example.com',
        mobileNumber: '0123456789'
      },
      paymentStatus: 'pending',
      totalAmount: 100.00,
      subtotal: 90.00,
      stripeFee: 10.00
    };
    
    const { data: testResult, error: testError } = await supabase.rpc('upsert_individual_registration', {
      p_registration_data: testPayload
    });
    
    if (testError) {
      console.error('❌ RPC function test failed:', testError);
      throw testError;
    }
    
    console.log('✅ RPC function test passed:', testResult);
    console.log('🎉 Remote database RPC function is now working!');
    
  } catch (error: any) {
    console.error('💥 Failed to update RPC function:', error.message);
    process.exit(1);
  }
}

updateRPCFunction();