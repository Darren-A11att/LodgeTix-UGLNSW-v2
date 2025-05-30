import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TestAccount {
  name: string;
  email: string;
  type: 'express' | 'standard';
  mcc?: string;
}

const TEST_ACCOUNTS: TestAccount[] = [
  {
    name: 'Test Grand Lodge of NSW',
    email: 'test-grand-lodge@lodgetix.test',
    type: 'express',
    mcc: '8398', // Non-profit organizations
  },
  {
    name: 'Test Lodge No. 123',
    email: 'test-lodge-123@lodgetix.test',
    type: 'express',
    mcc: '8398',
  },
  {
    name: 'Test Masonic Centre',
    email: 'test-masonic-centre@lodgetix.test',
    type: 'express',
    mcc: '8398',
  },
  {
    name: 'Test District Grand Lodge',
    email: 'test-district-grand-lodge@lodgetix.test',
    type: 'express',
    mcc: '8398',
  },
];

async function createTestConnectedAccount(account: TestAccount) {
  try {
    console.log(`Creating test account for ${account.name}...`);
    
    const stripeAccount = await stripe.accounts.create({
      type: account.type,
      country: 'AU',
      email: account.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'non_profit',
      business_profile: {
        name: account.name,
        mcc: account.mcc,
        url: 'https://lodgetix.test',
      },
      metadata: {
        test_account: 'true',
        organisation_name: account.name,
        created_by: 'test_script',
        created_at: new Date().toISOString(),
      },
      tos_acceptance: {
        date: Math.floor(Date.now() / 1000),
        ip: '127.0.0.1',
      },
    });
    
    console.log(`✅ Created Stripe account: ${stripeAccount.id}`);
    
    // Update the test organization in the database
    const { data: org, error: orgError } = await supabase
      .from('organisations')
      .select('*')
      .ilike('name', account.name.replace('Test ', ''))
      .single();
    
    if (org && !orgError) {
      const { error: updateError } = await supabase
        .from('organisations')
        .update({
          stripe_onbehalfof: stripeAccount.id,
          stripe_account_status: 'active',
          stripe_payouts_enabled: true,
          stripe_details_submitted: true,
          stripe_charges_enabled: true,
          updated_at: new Date().toISOString(),
        })
        .eq('organisation_id', org.organisation_id);
      
      if (updateError) {
        console.error(`❌ Failed to update organization in database: ${updateError.message}`);
      } else {
        console.log(`✅ Updated organization in database`);
      }
    } else if (!org) {
      // Create new test organization if it doesn't exist
      const { error: insertError } = await supabase
        .from('organisations')
        .insert({
          name: account.name.replace('Test ', ''),
          stripe_onbehalfof: stripeAccount.id,
          stripe_account_status: 'active',
          stripe_payouts_enabled: true,
          stripe_details_submitted: true,
          stripe_charges_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      
      if (insertError) {
        console.error(`❌ Failed to create organization in database: ${insertError.message}`);
      } else {
        console.log(`✅ Created new test organization in database`);
      }
    }
    
    return stripeAccount;
  } catch (error) {
    console.error(`❌ Failed to create account for ${account.name}:`, error);
    throw error;
  }
}

async function setupTestAccounts() {
  console.log('🚀 Starting test account setup...\n');
  
  const results = [];
  
  for (const account of TEST_ACCOUNTS) {
    try {
      const stripeAccount = await createTestConnectedAccount(account);
      results.push({
        name: account.name,
        accountId: stripeAccount.id,
        status: 'success',
      });
    } catch (error) {
      results.push({
        name: account.name,
        accountId: null,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  console.log('\n📋 Test Account Setup Summary:');
  console.log('================================');
  results.forEach(result => {
    if (result.status === 'success') {
      console.log(`✅ ${result.name}: ${result.accountId}`);
    } else {
      console.log(`❌ ${result.name}: Failed - ${result.error}`);
    }
  });
  
  // Save results to a file for reference
  const fs = await import('fs');
  const resultsPath = './scripts/stripe-connect-tests/test-accounts.json';
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${resultsPath}`);
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupTestAccounts()
    .then(() => {
      console.log('\n✅ Test account setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test account setup failed:', error);
      process.exit(1);
    });
}

export { createTestConnectedAccount, setupTestAccounts };