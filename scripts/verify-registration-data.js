#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyRegistrationData() {
    console.log('🔍 Verifying Registration Data Integrity');
    console.log('='.repeat(50));
    
    // The registration ID from our latest test
    const testRegistrationId = '4d717662-b0f0-4efa-b98f-d46c46f9d351';
    
    try {
        // Check registration
        const { data: registration, error: regError } = await supabase
            .from('registrations')
            .select('*')
            .eq('registration_id', testRegistrationId)
            .single();
            
        if (regError) {
            console.log('❌ Registration query error:', regError.message);
            return;
        }
        
        if (!registration) {
            console.log('ℹ️ No registration found with that ID');
            return;
        }
        
        console.log('✅ Registration:', {
            id: registration.registration_id,
            confirmation: registration.confirmation_number,
            type: registration.registration_type,
            status: registration.payment_status
        });
        
        // Check attendees
        const { data: attendees, error: attendeeError } = await supabase
            .from('attendees')
            .select('*')
            .eq('registration_id', testRegistrationId);
            
        if (attendeeError) {
            console.log('❌ Attendees query error:', attendeeError.message);
        } else {
            console.log(`✅ Attendees: ${attendees.length} found`);
            attendees.forEach((attendee, index) => {
                console.log(`   ${index + 1}. ${attendee.first_name} ${attendee.last_name} (${attendee.attendee_type}) - Primary: ${attendee.is_primary}`);
            });
        }
        
        // Check tickets
        const { data: tickets, error: ticketError } = await supabase
            .from('tickets')
            .select('*')
            .eq('registration_id', testRegistrationId);
            
        if (ticketError) {
            console.log('❌ Tickets query error:', ticketError.message);
        } else {
            console.log(`✅ Tickets: ${tickets.length} found`);
            tickets.forEach((ticket, index) => {
                console.log(`   ${index + 1}. Ticket ID: ${ticket.ticket_id}, Attendee: ${ticket.attendee_id}, Status: ${ticket.status}`);
            });
        }
        
        // Check contacts
        const { data: contacts, error: contactError } = await supabase
            .from('contacts')
            .select('*')
            .eq('auth_user_id', registration.auth_user_id);
            
        if (contactError) {
            console.log('❌ Contacts query error:', contactError.message);
        } else {
            console.log(`✅ Contacts: ${contacts.length} found`);
        }
        
        // Check raw registrations
        const { data: rawRegs, error: rawError } = await supabase
            .from('raw_registrations')
            .select('*')
            .eq('registration_id', testRegistrationId);
            
        if (rawError) {
            console.log('❌ Raw registrations query error:', rawError.message);
        } else {
            console.log(`✅ Raw Registration: ${rawRegs.length} found, Processed: ${rawRegs[0]?.processed || 'N/A'}`);
        }
        
        console.log('\n🎉 Data integrity verification complete!');
        
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
    }
}

verifyRegistrationData();