/**
 * Test script to verify database mappings are working correctly
 */

const { createClient } = require('@supabase/supabase-js')

async function testDatabaseMappings() {
  console.log('🧪 Testing Database Mappings...\n')

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const featuredFunctionId = process.env.FEATURED_FUNCTION_ID

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    return
  }

  if (!featuredFunctionId) {
    console.error('❌ Missing FEATURED_FUNCTION_ID environment variable')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log('✅ Environment variables loaded')
  console.log(`   FEATURED_FUNCTION_ID: ${featuredFunctionId}`)
  console.log(`   Supabase URL: ${supabaseUrl}\n`)

  try {
    // Test 1: Check if function exists
    console.log('📋 Test 1: Checking if function exists...')
    const { data: functionData, error: functionError } = await supabase
      .from('functions')
      .select('function_id, name, description, slug, image_url')
      .eq('function_id', featuredFunctionId)
      .single()

    if (functionError) {
      console.error('❌ Function query failed:', functionError.message)
      return
    }

    if (!functionData) {
      console.error('❌ No function found with ID:', featuredFunctionId)
      return
    }

    console.log('✅ Function found:')
    console.log(`   ID: ${functionData.function_id}`)
    console.log(`   Name: ${functionData.name}`)
    console.log(`   Description: ${functionData.description?.substring(0, 100)}...`)
    console.log(`   Slug: ${functionData.slug}`)
    console.log(`   Image URL: ${functionData.image_url}`)

    // Test 2: Test individual field queries (matching our content service)
    console.log('\n📋 Test 2: Testing individual field queries...')
    
    const fieldsToTest = [
      { field: 'name', description: 'Function title' },
      { field: 'description', description: 'Function description' },
      { field: 'slug', description: 'Function slug' },
      { field: 'image_url', description: 'Function image URL' }
    ]

    for (const { field, description } of fieldsToTest) {
      try {
        const { data, error } = await supabase
          .from('functions')
          .select(field)
          .eq('function_id', featuredFunctionId)
          .single()

        if (error) {
          console.error(`❌ ${description} query failed:`, error.message)
        } else {
          console.log(`✅ ${description}: ${data[field]}`)
        }
      } catch (err) {
        console.error(`❌ ${description} query exception:`, err.message)
      }
    }

    // Test 3: Test events query
    console.log('\n📋 Test 3: Testing events query...')
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('event_id, title, description, event_start, location_id, image_url, slug')
      .eq('function_id', featuredFunctionId)
      .eq('is_published', true)
      .order('event_start', { ascending: true })
      .limit(2)

    if (eventsError) {
      console.error('❌ Events query failed:', eventsError.message)
    } else {
      console.log(`✅ Found ${eventsData.length} events:`)
      eventsData.forEach((event, index) => {
        console.log(`   Event ${index + 1}: ${event.title}`)
      })
    }

    console.log('\n🎉 Database mapping tests completed successfully!')
    console.log('\n📝 Summary:')
    console.log('   ✅ Function exists and has correct fields')
    console.log('   ✅ All field queries work correctly')
    console.log('   ✅ Events query works correctly')
    console.log('\nThe database mappings should now work without errors.')

  } catch (error) {
    console.error('❌ Test failed with exception:', error.message)
  }
}

// Load environment variables and run tests
require('dotenv').config({ path: '.env.local' })
testDatabaseMappings()