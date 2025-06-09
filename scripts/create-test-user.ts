import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestUser() {
  try {
    // Create a test user
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'test@lodgetix.local',
      password: 'testpassword123',
      email_confirm: true
    })

    if (error) {
      console.error('Error creating user:', error)
      return
    }

    console.log('✅ Test user created successfully!')
    console.log('Email:', data.user?.email)
    console.log('User ID:', data.user?.id)
    console.log('\nYou can now login with:')
    console.log('Email: test@lodgetix.local')
    console.log('Password: testpassword123')

  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

createTestUser()