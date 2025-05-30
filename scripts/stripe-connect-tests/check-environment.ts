import dotenv from 'dotenv';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface EnvironmentCheck {
  name: string;
  check: () => Promise<{ passed: boolean; message: string; details?: any }>;
  required: boolean;
}

const ENVIRONMENT_CHECKS: EnvironmentCheck[] = [
  {
    name: 'Environment Variables',
    required: true,
    check: async () => {
      const required = [
        'STRIPE_SECRET_KEY',
        'STRIPE_PUBLISHABLE_KEY',
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'STRIPE_PLATFORM_FEE_PERCENTAGE',
      ];
      
      const missing = required.filter(key => !process.env[key]);
      
      if (missing.length > 0) {
        return {
          passed: false,
          message: `Missing required environment variables`,
          details: { missing },
        };
      }
      
      return {
        passed: true,
        message: 'All required environment variables present',
      };
    },
  },
  {
    name: 'Stripe Test Mode',
    required: true,
    check: async () => {
      const key = process.env.STRIPE_SECRET_KEY;
      
      if (!key) {
        return {
          passed: false,
          message: 'STRIPE_SECRET_KEY not set',
        };
      }
      
      if (!key.startsWith('sk_test_')) {
        return {
          passed: false,
          message: 'Not using test Stripe keys',
          details: { keyPrefix: key.substring(0, 10) },
        };
      }
      
      return {
        passed: true,
        message: 'Using test Stripe keys',
      };
    },
  },
  {
    name: 'Stripe API Connection',
    required: true,
    check: async () => {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
          apiVersion: '2024-11-20.acacia',
        });
        
        // Try to list a single account to test connection
        const accounts = await stripe.accounts.list({ limit: 1 });
        
        return {
          passed: true,
          message: 'Successfully connected to Stripe API',
          details: { accountCount: accounts.data.length },
        };
      } catch (error) {
        return {
          passed: false,
          message: 'Failed to connect to Stripe API',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        };
      }
    },
  },
  {
    name: 'Supabase Connection',
    required: true,
    check: async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        // Try a simple query
        const { data, error } = await supabase
          .from('organisations')
          .select('count')
          .limit(1);
        
        if (error) {
          return {
            passed: false,
            message: 'Failed to query Supabase',
            details: { error: error.message },
          };
        }
        
        return {
          passed: true,
          message: 'Successfully connected to Supabase',
        };
      } catch (error) {
        return {
          passed: false,
          message: 'Failed to connect to Supabase',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        };
      }
    },
  },
  {
    name: 'Platform Fee Configuration',
    required: true,
    check: async () => {
      const feeStr = process.env.STRIPE_PLATFORM_FEE_PERCENTAGE;
      
      if (!feeStr) {
        return {
          passed: false,
          message: 'STRIPE_PLATFORM_FEE_PERCENTAGE not set',
        };
      }
      
      const fee = parseFloat(feeStr);
      
      if (isNaN(fee) || fee < 0 || fee > 1) {
        return {
          passed: false,
          message: 'Invalid platform fee percentage',
          details: { value: feeStr, parsed: fee },
        };
      }
      
      return {
        passed: true,
        message: `Platform fee set to ${fee * 100}%`,
        details: { percentage: fee * 100 },
      };
    },
  },
  {
    name: 'Test Organizations',
    required: false,
    check: async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        const { data, error } = await supabase
          .from('organisations')
          .select('organisation_id, name, stripe_onbehalfof')
          .not('stripe_onbehalfof', 'is', null)
          .limit(5);
        
        if (error) {
          return {
            passed: false,
            message: 'Failed to query organizations',
            details: { error: error.message },
          };
        }
        
        if (!data || data.length === 0) {
          return {
            passed: false,
            message: 'No organizations with Stripe accounts found',
            details: { hint: 'Run npm run test:stripe:setup first' },
          };
        }
        
        return {
          passed: true,
          message: `Found ${data.length} organizations with Stripe accounts`,
          details: { organizations: data.map(o => ({ name: o.name, stripeId: o.stripe_onbehalfof })) },
        };
      } catch (error) {
        return {
          passed: false,
          message: 'Error checking organizations',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        };
      }
    },
  },
  {
    name: 'Test Events',
    required: false,
    check: async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        const { data, error } = await supabase
          .from('events')
          .select(`
            event_id,
            title,
            organisations!inner(
              organisation_id,
              name,
              stripe_onbehalfof
            )
          `)
          .not('organisations.stripe_onbehalfof', 'is', null)
          .limit(5);
        
        if (error) {
          return {
            passed: false,
            message: 'Failed to query events',
            details: { error: error.message },
          };
        }
        
        if (!data || data.length === 0) {
          return {
            passed: false,
            message: 'No events with connected organizations found',
            details: { hint: 'Create test events linked to organizations with Stripe accounts' },
          };
        }
        
        return {
          passed: true,
          message: `Found ${data.length} events with connected organizations`,
          details: { events: data.map(e => ({ title: e.title, organization: e.organisations.name })) },
        };
      } catch (error) {
        return {
          passed: false,
          message: 'Error checking events',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        };
      }
    },
  },
];

async function checkEnvironment() {
  console.log('🔍 Stripe Connect Environment Check\n');
  console.log('=' .repeat(50));
  console.log('\n');
  
  const results: Array<{
    name: string;
    passed: boolean;
    message: string;
    details?: any;
  }> = [];
  
  for (const check of ENVIRONMENT_CHECKS) {
    console.log(`Checking: ${check.name}...`);
    
    try {
      const result = await check.check();
      results.push({
        name: check.name,
        ...result,
      });
      
      if (result.passed) {
        console.log(`✅ ${result.message}`);
      } else {
        console.log(`❌ ${result.message}`);
      }
      
      if (result.details) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }
      
      console.log('');
    } catch (error) {
      results.push({
        name: check.name,
        passed: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      console.log(`❌ Check failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }
  }
  
  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Environment Check Summary\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const requiredFailed = results.filter((r, i) => !r.passed && ENVIRONMENT_CHECKS[i].required).length;
  
  console.log(`Total checks: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed} (${requiredFailed} required)`);
  
  if (requiredFailed > 0) {
    console.log('\n⚠️  Required checks failed. Please fix these before running tests.');
  } else if (failed > 0) {
    console.log('\n⚠️  Some optional checks failed. Tests may have limited functionality.');
  } else {
    console.log('\n✅ Environment is fully configured for testing!');
  }
  
  // Save results
  const fs = await import('fs');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `./scripts/stripe-connect-tests/environment-check-${timestamp}.json`;
  
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      passed,
      failed,
      requiredFailed,
    },
    results,
  }, null, 2));
  
  console.log(`\n💾 Report saved to: ${reportPath}`);
  
  return requiredFailed === 0;
}

// Run if called directly
if (require.main === module) {
  checkEnvironment()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Environment check failed:', error);
      process.exit(1);
    });
}

export { checkEnvironment };