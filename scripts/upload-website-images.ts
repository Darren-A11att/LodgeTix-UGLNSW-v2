#!/usr/bin/env tsx
/**
 * Script to upload website images to Supabase Storage
 * 
 * Usage: npx tsx scripts/upload-website-images.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Define image mappings
const imageUploads = [
  {
    localPath: './public/images/hero-grand-proclamation-2025.jpg', // You'll need to add these
    storagePath: 'website/heroes/hero-grand-proclamation-2025.jpg',
    component: 'hero',
    description: 'Main hero image for Grand Proclamation 2025'
  },
  {
    localPath: './public/images/sponsor-grand-lodge.png',
    storagePath: 'website/sponsors/sponsor-grand-lodge.png',
    component: 'sponsors',
    description: 'Grand Lodge of NSW & ACT logo'
  },
  {
    localPath: './public/images/sponsor-major.png',
    storagePath: 'website/sponsors/sponsor-major.png',
    component: 'sponsors',
    description: 'Major sponsor logo'
  },
  {
    localPath: './public/images/sponsor-gold.png',
    storagePath: 'website/sponsors/sponsor-gold.png',
    component: 'sponsors',
    description: 'Gold sponsor logo'
  },
  {
    localPath: './public/images/sponsor-silver.png',
    storagePath: 'website/sponsors/sponsor-silver.png',
    component: 'sponsors',
    description: 'Silver sponsor logo'
  }
]

async function uploadImages() {
  console.log('🚀 Starting image upload to Supabase Storage...\n')

  for (const image of imageUploads) {
    try {
      // Check if file exists locally
      if (!fs.existsSync(image.localPath)) {
        console.log(`⚠️  Skipping ${image.localPath} - file not found`)
        continue
      }

      // Read file
      const fileBuffer = fs.readFileSync(image.localPath)
      const fileName = path.basename(image.storagePath)
      const contentType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg'

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('public-events')
        .upload(image.storagePath, fileBuffer, {
          contentType,
          upsert: true // Replace if exists
        })

      if (error) {
        console.error(`❌ Error uploading ${image.localPath}:`, error.message)
        continue
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('public-events')
        .getPublicUrl(image.storagePath)

      console.log(`✅ Uploaded ${image.component} image`)
      console.log(`   Path: ${image.storagePath}`)
      console.log(`   URL: ${urlData.publicUrl}\n`)

      // Update the database with the new URL
      await updateDatabaseUrls(image.component, urlData.publicUrl)

    } catch (error) {
      console.error(`❌ Error processing ${image.localPath}:`, error)
    }
  }

  console.log('✨ Image upload complete!')
}

async function updateDatabaseUrls(component: string, url: string) {
  const functionId = process.env.FEATURED_FUNCTION_ID

  if (!functionId) {
    console.log('   ⚠️  FEATURED_FUNCTION_ID not set, skipping database update')
    return
  }

  try {
    switch (component) {
      case 'hero':
        await supabase
          .from('website.hero_sections')
          .update({ image_url: url })
          .eq('function_id', functionId)
        break

      case 'sponsors':
        // You'd need to match specific sponsors by name or tier
        console.log('   ℹ️  Sponsor URLs need manual update in database')
        break
    }
  } catch (error) {
    console.error('   ❌ Error updating database:', error)
  }
}

// Create placeholder images for testing (optional)
async function createPlaceholderImages() {
  const placeholderDir = './public/images'
  
  if (!fs.existsSync(placeholderDir)) {
    fs.mkdirSync(placeholderDir, { recursive: true })
    console.log(`📁 Created directory: ${placeholderDir}`)
  }

  // Create a simple placeholder using canvas (requires canvas package)
  console.log('\n📝 Placeholder images should be added manually to:')
  imageUploads.forEach(img => {
    console.log(`   - ${img.localPath}`)
  })
}

// Run the script
async function main() {
  console.log('🏗️  Website Image Upload Script\n')
  
  // Check if images exist
  const missingImages = imageUploads.filter(img => !fs.existsSync(img.localPath))
  
  if (missingImages.length > 0) {
    console.log('⚠️  Missing images detected:\n')
    await createPlaceholderImages()
    console.log('\nPlease add the images and run this script again.')
    return
  }

  // Upload images
  await uploadImages()
}

main().catch(console.error)