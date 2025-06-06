#!/usr/bin/env tsx
/**
 * Script to seed website content into REMOTE database
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function seedRemoteDatabase() {
  console.log('🌱 Seeding REMOTE Website Content\n')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing environment variables:')
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
    console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseAnonKey)
    return false
  }
  
  // Create client using anon key (which respects RLS)
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  try {
    // Use the function ID from .env
    const functionId = 'eebddef5-6833-43e3-8d32-700508b1c089'
    
    // Verify function exists in remote
    const { data: functionExists, error: funcError } = await supabase
      .from('functions')
      .select('function_id, name')
      .eq('function_id', functionId)
      .single()
      
    if (funcError || !functionExists) {
      console.error('❌ Function not found in remote database:', functionId)
      console.error('Error:', funcError)
      return false
    }
    
    console.log('✅ Found function:', functionExists.name)

    // 1. Meta Tags
    console.log('\n📝 Seeding meta tags...')
    const { data: metaData, error: metaError } = await supabase
      .from('website.meta_tags')
      .upsert({
        function_id: functionId,
        page_path: '/',
        title: 'Grand Proclamation 2025 | United Grand Lodge of NSW & ACT',
        description: 'Created with v0',
        og_title: 'Grand Proclamation 2025',
        og_description: 'The official gathering of the United Grand Lodge of NSW & ACT',
        keywords: ['freemasonry', 'masonic', 'grand lodge', 'nsw', 'act', 'proclamation', '2025'],
        robots: 'index,follow',
        is_active: true
      }, {
        onConflict: 'function_id,page_path'
      })
      .select()
    
    if (metaError) {
      console.error('❌ Meta tags error:', metaError)
    } else {
      console.log('✅ Meta tags seeded:', metaData)
    }

    // 2. Hero Section
    console.log('\n📝 Seeding hero section...')
    const { data: heroData, error: heroError } = await supabase
      .from('website.hero_sections')
      .insert({
        function_id: functionId,
        title: 'Grand Proclamation 2025',
        subtitle: 'Celebrating Excellence in Freemasonry',
        description: 'Join us for the most prestigious Masonic event of the year, where tradition meets fellowship in the heart of Sydney.',
        primary_cta_text: 'Register Now',
        primary_cta_link: '/functions',
        secondary_cta_text: 'Learn More',
        secondary_cta_link: '/functions',
        image_url: '/placeholder.svg?height=600&width=800&text=Grand+Proclamation+2025',
        image_alt: 'Grand Proclamation 2025',
        show_dates: true,
        show_location: true,
        is_active: true
      })
      .select()
    
    if (heroError) {
      console.error('❌ Hero error:', heroError)
    } else {
      console.log('✅ Hero section seeded')
    }

    // 3. Sponsor Section Config
    console.log('\n📝 Seeding sponsor section config...')
    const { error: sponsorConfigError } = await supabase
      .from('website.sponsor_sections')
      .insert({
        function_id: functionId,
        title: 'Our Distinguished Sponsors',
        subtitle: 'Supporting Masonic Excellence and Tradition',
        show_tiers: true,
        layout: 'grid',
        is_active: true
      })
    
    if (sponsorConfigError) {
      console.error('❌ Sponsor config error:', sponsorConfigError)
    } else {
      console.log('✅ Sponsor section config seeded')
    }

    // 4. Sponsors
    console.log('\n📝 Seeding sponsors...')
    const sponsors = [
      { name: 'Grand Lodge of NSW & ACT', tier: 'grand', logo_url: '/placeholder.svg?height=100&width=200&text=Grand+Lodge', sort_order: 1 },
      { name: 'Major Sponsor', tier: 'major', logo_url: '/placeholder.svg?height=100&width=200&text=Major+Sponsor', sort_order: 2 },
      { name: 'Gold Sponsor', tier: 'gold', logo_url: '/placeholder.svg?height=100&width=200&text=Gold+Sponsor', sort_order: 3 },
      { name: 'Silver Sponsor', tier: 'silver', logo_url: '/placeholder.svg?height=100&width=200&text=Silver+Sponsor', sort_order: 4 }
    ]
    
    for (const sponsor of sponsors) {
      const { error } = await supabase
        .from('website.sponsors')
        .insert({
          function_id: functionId,
          ...sponsor,
          logo_alt: sponsor.name,
          is_active: true
        })
      if (error) {
        console.error(`❌ Sponsor error (${sponsor.name}):`, error)
      }
    }
    console.log('✅ All sponsors seeded')

    // 5. Location Info
    console.log('\n📝 Seeding location info...')
    const { error: locationError } = await supabase
      .from('website.location_info')
      .insert({
        function_id: functionId,
        venue_name: 'Sydney Masonic Centre',
        venue_badge: 'Premium Venue',
        address_line_1: '279 Castlereagh Street',
        city: 'Sydney',
        state: 'NSW',
        postal_code: '2000',
        country: 'Australia',
        features: [
          { icon: 'Building2', title: 'Historic Venue', description: 'A landmark of Masonic tradition' },
          { icon: 'Train', title: 'Central Location', description: 'Easy access via public transport' },
          { icon: 'Wifi', title: 'Modern Facilities', description: 'State-of-the-art amenities' },
          { icon: 'Car', title: 'Secure Parking', description: 'Ample parking available' }
        ],
        parking_info: 'Ample parking available',
        is_active: true
      })
    
    if (locationError) {
      console.error('❌ Location error:', locationError)
    } else {
      console.log('✅ Location info seeded')
    }

    // 6. CTA Section
    console.log('\n📝 Seeding CTA section...')
    const { error: ctaError } = await supabase
      .from('website.cta_sections')
      .upsert({
        function_id: functionId,
        section_key: 'homepage_bottom',
        title: 'Ready to Join Us?',
        subtitle: 'Secure Your Place at the Grand Proclamation 2025',
        description: "Don't miss this historic gathering of Freemasons from across New South Wales and the Australian Capital Territory.",
        primary_cta_text: 'Register Now',
        primary_cta_link: '/functions',
        info_text: 'Limited places available • Secure online payment • Instant confirmation',
        background_style: 'gradient',
        is_active: true
      }, {
        onConflict: 'function_id,section_key'
      })
    
    if (ctaError) {
      console.error('❌ CTA error:', ctaError)
    } else {
      console.log('✅ CTA section seeded')
    }

    // 7. Navigation Links (Global - no function_id)
    console.log('\n📝 Seeding navigation links...')
    const navLinks = [
      { menu_location: 'header', label: 'Home', url: '/', sort_order: 1 },
      { menu_location: 'header', label: 'Functions', url: '/functions', sort_order: 2 },
      { menu_location: 'header', label: 'About', url: '/about', sort_order: 3 },
      { menu_location: 'header', label: 'Contact', url: '/contact', sort_order: 4 },
      { menu_location: 'footer_quick_links', label: 'Events', url: '/functions', sort_order: 1 },
      { menu_location: 'footer_quick_links', label: 'About', url: '/about', sort_order: 2 },
      { menu_location: 'footer_quick_links', label: 'Contact', url: '/contact', sort_order: 3 },
      { menu_location: 'footer_quick_links', label: 'Help', url: '/help', sort_order: 4 },
      { menu_location: 'footer_legal', label: 'Privacy Policy', url: '/privacy', sort_order: 1 },
      { menu_location: 'footer_legal', label: 'Terms of Service', url: '/terms', sort_order: 2 },
      { menu_location: 'footer_legal', label: 'Refund Policy', url: '/refund-policy', sort_order: 3 }
    ]
    
    let navSuccess = 0
    for (const link of navLinks) {
      const { error } = await supabase
        .from('website.navigation_links')
        .insert({
          ...link,
          is_active: true
        })
      if (!error || (error.code === '23505')) { // Duplicate key is ok
        navSuccess++
      } else {
        console.error(`❌ Nav link error (${link.label}):`, error)
      }
    }
    console.log(`✅ Navigation links seeded (${navSuccess}/${navLinks.length})`)

    // 8. Footer Content (Global)
    console.log('\n📝 Seeding footer content...')
    const { error: footerError } = await supabase
      .from('website.footer_content')
      .insert({
        company_name: 'LodgeTix',
        company_description: 'The official ticketing platform for the United Grand Lodge of NSW & ACT',
        copyright_text: '© 2024 LodgeTix. All rights reserved.',
        external_links: [
          { label: 'Visit United Grand Lodge of NSW & ACT', url: 'https://masons.au', icon: 'ExternalLink' }
        ],
        is_active: true
      })
    
    if (footerError && footerError.code !== '23505') {
      console.error('❌ Footer error:', footerError)
    } else {
      console.log('✅ Footer content seeded')
    }

    // 9. Scripts (Global)
    console.log('\n📝 Seeding scripts...')
    const { error: scriptError } = await supabase
      .from('website.scripts')
      .insert({
        name: 'Cloudflare Turnstile',
        script_url: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
        load_position: 'head',
        is_active: true
      })
    
    if (scriptError && scriptError.code !== '23505') {
      console.error('❌ Script error:', scriptError)
    } else {
      console.log('✅ Scripts seeded')
    }

    console.log('\n✨ Remote database seeding complete!\n')
    
    // Verify what was created
    console.log('📊 Verifying seeded data...')
    const tables = [
      'meta_tags',
      'hero_sections',
      'sponsors',
      'sponsor_sections',
      'location_info',
      'cta_sections',
      'navigation_links',
      'footer_content',
      'scripts'
    ]
    
    for (const table of tables) {
      const { count } = await supabase
        .from(`website.${table}`)
        .select('*', { count: 'exact', head: true })
      console.log(`   ${table}: ${count || 0} records`)
    }
    
    return true

  } catch (error) {
    console.error('❌ Seeding error:', error)
    return false
  }
}

// Main execution
seedRemoteDatabase()
  .then(success => {
    if (success) {
      console.log('\n🎉 Success! Website content has been seeded to the remote database.')
      console.log('You can now update the homepage components to use this data.')
    } else {
      console.error('\n❌ Seeding failed. Please check the errors above.')
    }
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('Unexpected error:', error)
    process.exit(1)
  })