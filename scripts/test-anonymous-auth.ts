import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

async function testAnonymousAuth() {
  console.log('🔐 Testing anonymous authentication...')
  
  const supabase = createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Test 1: Check current session
    console.log('\n📋 Test 1: Checking current session...')
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    console.log('Session:', sessionData?.session ? 'Found' : 'None')
    if (sessionError) console.error('Session error:', sessionError)

    // Test 2: Try to sign in anonymously
    console.log('\n📋 Test 2: Signing in anonymously...')
    const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously()
    
    if (anonError) {
      console.error('❌ Anonymous sign-in error:', anonError)
      console.error('Error details:', JSON.stringify(anonError, null, 2))
    } else if (anonData.user && anonData.session) {
      console.log('✅ Anonymous sign-in successful!')
      console.log('User ID:', anonData.user.id)
      console.log('Is Anonymous:', anonData.user.is_anonymous)
      console.log('Session expires at:', new Date(anonData.session.expires_at! * 1000).toLocaleString())
    }

    // Test 3: Verify the user exists in the database
    if (anonData?.user) {
      console.log('\n📋 Test 3: Verifying user in database...')
      const { data: userData, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('❌ Get user error:', userError)
      } else {
        console.log('✅ User verified:', userData.user?.id)
      }
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

testAnonymousAuth()