#!/usr/bin/env node

/**
 * Script to set up an organiser portal user from an existing contact
 * 
 * This script:
 * 1. Creates an auth user for the contact
 * 2. Links the contact to the auth user
 * 3. Adds appropriate roles
 * 4. Links to the organisation
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const CONTACT_ID = 'c08bb67c-8391-4da9-8a9f-6f121e83c8f9'
const ORGANISATION_ID = '3e893fa6-2cc2-448c-be9c-e3858cc90e11'
const FUNCTION_ID = 'eebddef5-6833-43e3-8d32-700508b1c089'

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupOrganiserUser() {
  try {
    console.log('Setting up organiser user...')

    // 1. Get contact details
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('contact_id', CONTACT_ID)
      .single()

    if (contactError || !contact) {
      throw new Error(`Failed to fetch contact: ${contactError?.message}`)
    }

    console.log(`Found contact: ${contact.first_name} ${contact.last_name} (${contact.email})`)

    // 2. Check if auth user already exists
    let authUserId: string
    
    // First, try to find existing user by email
    const { data: existingUsers, error: searchError } = await supabase.auth.admin.listUsers({
      filter: `email.eq.${contact.email}`
    })

    if (existingUsers && existingUsers.users.length > 0) {
      // User already exists
      authUserId = existingUsers.users[0].id
      console.log(`Found existing auth user with ID: ${authUserId}`)
    } else {
      // Create new auth user
      const temporaryPassword = `LodgeTix${new Date().getFullYear()}!`
      
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: contact.email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          first_name: contact.first_name,
          last_name: contact.last_name,
          contact_id: contact.contact_id
        }
      })

      if (authError) {
        throw new Error(`Failed to create auth user: ${authError.message}`)
      }

      authUserId = authUser.user.id
      console.log(`Created auth user with ID: ${authUserId}`)
      console.log(`Temporary Password: ${temporaryPassword}`)
    }

    // 3. Update contact with auth_user_id
    const { error: updateContactError } = await supabase
      .from('contacts')
      .update({ auth_user_id: authUserId })
      .eq('contact_id', CONTACT_ID)

    if (updateContactError) {
      throw new Error(`Failed to update contact: ${updateContactError.message}`)
    }

    // 4. Add user role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: authUserId,
        role: 'organiser_admin'
      })

    if (roleError) {
      console.warn(`Failed to add user role: ${roleError.message}`)
    }

    // 5. Link user to organisation
    const { error: orgLinkError } = await supabase
      .from('organisation_users')
      .insert({
        user_id: authUserId,
        organisation_id: ORGANISATION_ID,
        role: 'admin'
      })

    if (orgLinkError) {
      console.warn(`Failed to link user to organisation: ${orgLinkError.message}`)
    }

    console.log('\n✅ Organiser user setup complete!')
    console.log('\n📧 Login credentials:')
    console.log(`   Email: ${contact.email}`)
    console.log('   Password: [Use existing password]')
    console.log('\n🔗 Organiser Portal URL: /organiser')

    // 6. Verify the setup
    const { data: orgUser } = await supabase
      .from('organisation_users')
      .select(`
        *,
        organisations(name),
        user:auth.users(email)
      `)
      .eq('user_id', authUserId)
      .single()

    if (orgUser) {
      console.log('\n✅ Verification successful:')
      console.log(`   User linked to organisation: ${orgUser.organisations?.name}`)
    }

  } catch (error) {
    console.error('❌ Error setting up organiser user:', error)
    process.exit(1)
  }
}

// Run the setup
setupOrganiserUser()