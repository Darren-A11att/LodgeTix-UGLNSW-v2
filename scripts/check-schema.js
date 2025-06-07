#!/usr/bin/env node

const https = require('https');

const SUPABASE_URL = 'https://pwwpcjbbxotmiqrisjvf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3d3BjamJieG90bWlxcmlzanZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1NDg1NjgsImV4cCI6MjA2MTEyNDU2OH0.Ep3pzGlPgXbnTrcE84dIIbBxk-OsnXq7BSwL7vG-p3Q';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'pwwpcjbbxotmiqrisjvf.supabase.co',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          resolve(data);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function checkDatabaseSchema() {
  console.log('🔍 Checking Database Schema');
  console.log('='.repeat(50));

  try {
    // Check tickets table structure by selecting limited rows
    console.log('\n📋 Checking tickets table structure...');
    const ticketsResult = await makeRequest('/rest/v1/tickets?limit=1');
    if (Array.isArray(ticketsResult) && ticketsResult.length > 0) {
      console.log('✅ Tickets table columns:', Object.keys(ticketsResult[0]));
    } else {
      console.log('⚠️ No tickets found or access denied');
    }

    // Check event_tickets table structure  
    console.log('\n📋 Checking event_tickets table structure...');
    const eventTicketsResult = await makeRequest('/rest/v1/event_tickets?limit=1');
    if (Array.isArray(eventTicketsResult) && eventTicketsResult.length > 0) {
      console.log('✅ Event_tickets table columns:', Object.keys(eventTicketsResult[0]));
    } else {
      console.log('⚠️ No event_tickets found or access denied');
    }

    // Check specific event_tickets we're using in test
    console.log('\n📋 Checking test event_tickets...');
    const testEventTicket1 = await makeRequest('/rest/v1/event_tickets?event_ticket_id=eq.d586ecc1-e410-4ef3-a59c-4a53a866bc33');
    console.log('Test event_ticket 1:', testEventTicket1);

    const testEventTicket2 = await makeRequest('/rest/v1/event_tickets?event_ticket_id=eq.7196514b-d4b8-4fe0-93ac-deb4c205dd09');
    console.log('Test event_ticket 2:', testEventTicket2);

  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
  }
}

checkDatabaseSchema();