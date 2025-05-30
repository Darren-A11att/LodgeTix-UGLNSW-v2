#!/usr/bin/env node

/**
 * Script to initialize Supabase storage buckets
 * Run this once to set up all required storage buckets
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface BucketConfig {
  name: string;
  public: boolean;
  fileSizeLimit?: number;
  allowedMimeTypes?: string[];
}

const buckets: BucketConfig[] = [
  {
    name: 'ticket-qr-codes',
    public: true,
    fileSizeLimit: 1048576, // 1MB
    allowedMimeTypes: ['image/png'],
  },
  {
    name: 'confirmations',
    public: false,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['application/pdf'],
  },
  {
    name: 'event-images',
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  },
  {
    name: 'email-templates',
    public: false,
    fileSizeLimit: 1048576, // 1MB
    allowedMimeTypes: ['text/html', 'text/plain'],
  },
];

async function initializeBuckets() {
  console.log('🚀 Initializing Supabase storage buckets...\n');
  
  for (const bucket of buckets) {
    try {
      console.log(`Creating bucket: ${bucket.name}`);
      console.log(`- Public: ${bucket.public}`);
      console.log(`- File size limit: ${bucket.fileSizeLimit ? `${bucket.fileSizeLimit / 1024 / 1024}MB` : 'Default'}`);
      console.log(`- Allowed MIME types: ${bucket.allowedMimeTypes?.join(', ') || 'All'}`);
      
      const { data, error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes,
      });
      
      if (error) {
        if (error.message === 'The resource already exists') {
          console.log(`✓ Bucket '${bucket.name}' already exists\n`);
        } else {
          console.error(`✗ Failed to create bucket '${bucket.name}':`, error.message, '\n');
        }
      } else {
        console.log(`✓ Successfully created bucket '${bucket.name}'\n`);
      }
    } catch (error) {
      console.error(`✗ Error creating bucket '${bucket.name}':`, error, '\n');
    }
  }
  
  // Set up bucket policies
  console.log('Setting up bucket policies...\n');
  
  // Public read policy for ticket-qr-codes
  try {
    const { error: policyError } = await supabase.rpc('create_storage_policy', {
      bucket_name: 'ticket-qr-codes',
      policy_name: 'Public read access',
      definition: `(bucket_id = 'ticket-qr-codes'::text)`,
      check_expression: 'true',
      using_expression: 'true',
    }).single();
    
    if (!policyError) {
      console.log('✓ Set up public read policy for ticket-qr-codes\n');
    }
  } catch (error) {
    console.log('Note: Storage policies may need to be configured manually in Supabase dashboard\n');
  }
  
  console.log('🎉 Storage bucket initialization complete!\n');
  console.log('Next steps:');
  console.log('1. Go to your Supabase dashboard');
  console.log('2. Navigate to Storage > Policies');
  console.log('3. Verify the bucket policies are set correctly');
  console.log('4. For private buckets (confirmations, email-templates), ensure authenticated users have appropriate access');
}

// Run the initialization
initializeBuckets().catch(console.error);