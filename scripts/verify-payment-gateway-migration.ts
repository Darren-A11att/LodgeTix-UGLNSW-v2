#!/usr/bin/env node

/**
 * Script to verify payment gateway migration is working correctly
 * Compares environment variable configuration with database configuration
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { paymentGatewayService } from '../lib/services/payment-gateway-service';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function verifyMigration() {
  console.log('🔍 Verifying Payment Gateway Migration...\n');

  // 1. Check environment variables
  console.log('📋 Current Environment Variables:');
  console.log('--------------------------------');
  const envVars = {
    SQUARE_PLATFORM_FEE_PERCENTAGE: process.env.SQUARE_PLATFORM_FEE_PERCENTAGE,
    SQUARE_PLATFORM_FEE_CAP: process.env.SQUARE_PLATFORM_FEE_CAP,
    SQUARE_PLATFORM_FEE_MINIMUM: process.env.SQUARE_PLATFORM_FEE_MINIMUM,
    STRIPE_PLATFORM_FEE_PERCENTAGE: process.env.STRIPE_PLATFORM_FEE_PERCENTAGE,
    STRIPE_PLATFORM_FEE_CAP: process.env.STRIPE_PLATFORM_FEE_CAP,
    STRIPE_PLATFORM_FEE_MINIMUM: process.env.STRIPE_PLATFORM_FEE_MINIMUM,
    PAYMENT_GATEWAY: process.env.PAYMENT_GATEWAY,
  };

  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`${key}: ${value || '(not set)'}`);
  });

  // 2. Check database configuration
  console.log('\n📊 Database Configuration:');
  console.log('-------------------------');
  
  try {
    const config = await paymentGatewayService.getActiveConfiguration();
    
    if (!config) {
      console.log('❌ No active configuration found in database');
      console.log('   Run the migration: npm run db:migrate');
      return;
    }

    console.log('✅ Active configuration found:');
    console.log(`   Gateway: ${config.payment_gateway}`);
    console.log(`   Fee Mode: ${config.fee_mode}`);
    console.log(`   Domestic: ${config.domestic_card_percentage}% + $${config.domestic_card_fixed}`);
    console.log(`   International: ${config.international_card_percentage}% + $${config.international_card_fixed}`);
    console.log(`   Platform Fee: ${config.platform_fee_percentage}% (min: $${config.platform_fee_min}, cap: $${config.platform_fee_cap})`);
    console.log(`   Active Since: ${config.enabled_on}`);

    // 3. Test fee calculation
    console.log('\n🧮 Test Fee Calculation:');
    console.log('------------------------');
    
    const testAmount = 100.00;
    const feeValues = await paymentGatewayService.getFeeCalculationValues();
    
    console.log(`Test amount: $${testAmount}`);
    console.log(`Platform fee: ${(feeValues.platform_fee_percentage * 100).toFixed(2)}% = $${(testAmount * feeValues.platform_fee_percentage).toFixed(2)}`);
    console.log(`Domestic card fee: ${(feeValues.domestic_card_percentage * 100).toFixed(2)}% + $${feeValues.domestic_card_fixed}`);
    
    // 4. Compare with env vars if they exist
    if (envVars.SQUARE_PLATFORM_FEE_PERCENTAGE) {
      console.log('\n⚠️  Warning: Environment variables still present');
      console.log('   These should be removed after migration is verified');
      
      const envPercentage = parseFloat(envVars.SQUARE_PLATFORM_FEE_PERCENTAGE || '0');
      const dbPercentage = feeValues.platform_fee_percentage;
      
      if (Math.abs(envPercentage - dbPercentage) > 0.0001) {
        console.log(`   ❌ Mismatch: Env says ${envPercentage * 100}%, DB says ${dbPercentage * 100}%`);
      } else {
        console.log(`   ✅ Values match: ${dbPercentage * 100}%`);
      }
    }

    console.log('\n✅ Migration verification complete!');
    
  } catch (error) {
    console.error('\n❌ Error verifying migration:', error);
    process.exit(1);
  }
}

// Run verification
verifyMigration().catch(console.error);