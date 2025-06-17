import { createClient } from '@supabase/supabase-js'

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

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