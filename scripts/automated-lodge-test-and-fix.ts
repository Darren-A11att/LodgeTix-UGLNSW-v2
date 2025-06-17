#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL environment variable is required');
  process.exit(1);
}
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TestPayload {
  logEntries: Array<{
    type: string;
    message: string;
    data: any;
  }>;
}

interface ErrorAnalysis {
  errorType: string;
  errorMessage: string;
  suggestedFix: string;
  sqlFix?: string;
  codeFix?: string;
}

class LodgeRegistrationTester {
  private testPayload: any;
  private maxAttempts = 10;
  private currentAttempt = 0;
  private errors: ErrorAnalysis[] = [];

  constructor() {
    this.loadTestPayload();
  }

  private loadTestPayload() {
    try {
      const payloadPath = path.join(process.cwd(), 'docs', 'lodge-rego-test.json');
      const rawData = fs.readFileSync(payloadPath, 'utf8');
      const testData: TestPayload = JSON.parse(rawData);
      
      // Extract the request body from the log entries
      const requestBodyEntry = testData.logEntries.find(entry => entry.type === 'request_body');
      const requestDataEntry = testData.logEntries.find(entry => entry.type === 'request_received');
      
      if (!requestBodyEntry || !requestDataEntry) {
        throw new Error('Could not find request data in test payload');
      }

      // Convert the API payload to RPC parameters
      const { data: requestInfo } = requestDataEntry;
      const { data: requestBody } = requestBodyEntry;

      this.testPayload = {
        p_function_id: requestInfo.functionId,
        p_package_id: requestInfo.packageId,
        p_table_count: requestBody.tableCount,
        p_booking_contact: {
          firstName: requestBody.bookingContact.firstName,
          lastName: requestBody.bookingContact.lastName,
          email: requestBody.bookingContact.email,
          mobile: requestBody.bookingContact.mobile,
          addressLine1: requestBody.billingDetails.addressLine1,
          suburb: requestBody.billingDetails.suburb,
          stateTerritory: requestBody.billingDetails.stateTerritory?.name || 'NSW',
          postcode: requestBody.billingDetails.postcode,
          country: requestBody.billingDetails.country?.isoCode || 'AU',
          title: requestBody.bookingContact.title,
          rank: requestBody.bookingContact.rank,
          authUserId: '550e8400-e29b-41d4-a716-446655440000' // Mock auth user ID
        },
        p_lodge_details: {
          lodgeName: requestBody.lodgeDetails.lodgeName,
          lodge_id: requestBody.lodgeDetails.lodgeId,
          organisation_id: requestBody.lodgeDetails.lodgeId
        },
        p_payment_status: 'completed',
        p_stripe_payment_intent_id: 'pi_test_automated_' + Date.now(),
        p_total_amount: requestBody.amount / 100, // Convert from cents
        p_subtotal: requestBody.subtotal / 100, // Convert from cents
        p_stripe_fee: requestBody.stripeFee / 100, // Convert from cents
        p_metadata: {
          test: true,
          source: 'automated-test',
          originalPaymentMethod: requestBody.paymentMethodId
        }
      };

      console.log('✅ Test payload loaded successfully');
      console.log('📋 Test data:', JSON.stringify(this.testPayload, null, 2));
      
    } catch (error) {
      console.error('❌ Failed to load test payload:', error);
      process.exit(1);
    }
  }

  private analyzeError(error: any): ErrorAnalysis {
    const errorMessage = error.message || error.toString();
    const errorCode = error.code;

    console.log(`🔍 Analyzing error: ${errorMessage}`);
    console.log(`🔍 Error code: ${errorCode}`);

    // Enum value errors
    if (errorMessage.includes('invalid input value for enum contact_type')) {
      return {
        errorType: 'ENUM_CONTACT_TYPE',
        errorMessage,
        suggestedFix: 'The contacts.type field only accepts "person" or "organisation" values',
        sqlFix: 'UPDATE RPC function to use "person" instead of "customer" for contact type'
      };
    }

    if (errorMessage.includes('invalid input value for enum')) {
      const enumMatch = errorMessage.match(/enum (\w+).*?value.*?"([^"]+)"/);
      if (enumMatch) {
        const enumName = enumMatch[1];
        const invalidValue = enumMatch[2];
        return {
          errorType: 'ENUM_VALUE_ERROR',
          errorMessage,
          suggestedFix: `Invalid enum value "${invalidValue}" for enum "${enumName}". Check valid enum values in database.`,
          sqlFix: `SELECT unnest(enum_range(NULL::"${enumName}")) AS valid_values;`
        };
      }
    }

    // Foreign key constraint errors
    if (errorMessage.includes('violates foreign key constraint')) {
      const constraintMatch = errorMessage.match(/constraint "([^"]+)"/);
      const constraint = constraintMatch ? constraintMatch[1] : 'unknown';
      return {
        errorType: 'FOREIGN_KEY_VIOLATION',
        errorMessage,
        suggestedFix: `Foreign key constraint "${constraint}" violated. Referenced record may not exist.`,
        sqlFix: `Check that referenced IDs exist in their respective tables before insertion.`
      };
    }

    // Column does not exist errors
    if (errorMessage.includes('column') && errorMessage.includes('does not exist')) {
      const columnMatch = errorMessage.match(/column "([^"]+)"/);
      const column = columnMatch ? columnMatch[1] : 'unknown';
      return {
        errorType: 'COLUMN_NOT_EXISTS',
        errorMessage,
        suggestedFix: `Column "${column}" does not exist in the target table.`,
        sqlFix: `ALTER TABLE to add missing column or update RPC function to remove reference to non-existent column.`
      };
    }

    // Function does not exist
    if (errorMessage.includes('function') && errorMessage.includes('does not exist')) {
      return {
        errorType: 'FUNCTION_NOT_EXISTS',
        errorMessage,
        suggestedFix: 'The RPC function does not exist or is not accessible.',
        sqlFix: 'Create or recreate the upsert_lodge_registration function.'
      };
    }

    // Permission errors
    if (errorMessage.includes('permission denied') || errorMessage.includes('insufficient privilege')) {
      return {
        errorType: 'PERMISSION_ERROR',
        errorMessage,
        suggestedFix: 'Insufficient permissions to execute the operation.',
        sqlFix: 'Grant necessary permissions or use SECURITY DEFINER for RPC function.'
      };
    }

    // Data type errors
    if (errorMessage.includes('invalid input syntax') || errorMessage.includes('type')) {
      return {
        errorType: 'DATA_TYPE_ERROR',
        errorMessage,
        suggestedFix: 'Data type mismatch or invalid input format.',
        sqlFix: 'Check data types and casting in the RPC function parameters.'
      };
    }

    // Generic error
    return {
      errorType: 'UNKNOWN_ERROR',
      errorMessage,
      suggestedFix: 'Unknown error occurred. Manual investigation required.',
      sqlFix: 'Review error logs and database schema for inconsistencies.'
    };
  }

  private async validatePrerequisites(): Promise<boolean> {
    console.log('🔍 Validating prerequisites...');

    try {
      // Check if function exists, if not use any available function
      let { data: functions, error: funcError } = await supabase
        .from('functions')
        .select('function_id, title')
        .eq('function_id', this.testPayload.p_function_id)
        .single();

      if (funcError || !functions) {
        console.log(`⚠️ Function ${this.testPayload.p_function_id} not found, searching for any available function...`);
        
        const { data: allFunctions, error: allFuncError } = await supabase
          .from('functions')
          .select('function_id, title')
          .limit(1);

        if (allFuncError || !allFunctions || allFunctions.length === 0) {
          console.log(`❌ No functions found in database`);
          return false;
        }

        functions = allFunctions[0];
        this.testPayload.p_function_id = functions.function_id;
        console.log(`✅ Using available function: ${functions.title} (${functions.function_id})`);
      } else {
        console.log(`✅ Function found: ${functions.title}`);
      }

      // Check if package exists, if not find a lodge package
      let { data: packages, error: pkgError } = await supabase
        .from('packages')
        .select('package_id, package_name, package_price, eligible_registration_types')
        .eq('package_id', this.testPayload.p_package_id)
        .single();

      if (pkgError || !packages) {
        console.log(`⚠️ Package ${this.testPayload.p_package_id} not found, searching for lodge packages...`);
        
        const { data: lodgePackages, error: lodgePkgError } = await supabase
          .from('packages')
          .select('package_id, package_name, package_price, eligible_registration_types')
          .contains('eligible_registration_types', ['lodges'])
          .limit(1);

        if (lodgePkgError || !lodgePackages || lodgePackages.length === 0) {
          console.log(`❌ No lodge packages found in database`);
          return false;
        }

        packages = lodgePackages[0];
        this.testPayload.p_package_id = packages.package_id;
        console.log(`✅ Using available lodge package: ${packages.package_name} ($${packages.package_price})`);
      } else {
        console.log(`✅ Package found: ${packages.package_name} ($${packages.package_price})`);
      }

      // Check if RPC function exists
      const { data: rpcCheck, error: rpcError } = await supabase.rpc('upsert_lodge_registration', {
        p_function_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID to test function existence
        p_package_id: '00000000-0000-0000-0000-000000000000',
        p_table_count: 0,
        p_booking_contact: {},
        p_lodge_details: {}
      });

      // We expect this to fail, but if it fails because function doesn't exist, that's a problem
      if (rpcError && rpcError.message?.includes('does not exist')) {
        console.log(`❌ RPC function upsert_lodge_registration does not exist`);
        return false;
      }
      console.log(`✅ RPC function exists (test call failed as expected)`);

      return true;
    } catch (error) {
      console.log('❌ Prerequisite validation failed:', error);
      return false;
    }
  }

  private async testRegistration(): Promise<{ success: boolean; data?: any; error?: any }> {
    console.log(`\n🧪 Test Attempt ${this.currentAttempt + 1}/${this.maxAttempts}`);
    console.log('🚀 Calling upsert_lodge_registration...');

    try {
      const { data, error } = await supabase.rpc('upsert_lodge_registration', this.testPayload);

      if (error) {
        console.log('❌ RPC call failed:', error);
        return { success: false, error };
      }

      console.log('✅ RPC call succeeded!');
      console.log('📋 Result:', JSON.stringify(data, null, 2));
      return { success: true, data };

    } catch (error) {
      console.log('❌ Unexpected error:', error);
      return { success: false, error };
    }
  }

  private async verifyRegistration(registrationId: string): Promise<boolean> {
    console.log(`🔍 Verifying registration ${registrationId}...`);

    try {
      // Check registration
      const { data: registration, error: regError } = await supabase
        .from('registrations')
        .select('*')
        .eq('registration_id', registrationId)
        .single();

      if (regError || !registration) {
        console.log('❌ Registration not found in database');
        return false;
      }

      console.log('✅ Registration verified');
      console.log(`   Type: ${registration.registration_type}`);
      console.log(`   Status: ${registration.status}`);
      console.log(`   Payment: ${registration.payment_status}`);
      console.log(`   Total: $${registration.total_amount_paid}`);

      // Check contacts
      const { data: contacts, error: contactError } = await supabase
        .from('contacts')
        .select('contact_id, type, first_name, last_name, email')
        .eq('auth_user_id', this.testPayload.p_booking_contact.authUserId);

      if (contactError) {
        console.log('❌ Error verifying contacts:', contactError);
        return false;
      }

      console.log(`✅ ${contacts.length} contact(s) created`);
      contacts.forEach(contact => {
        console.log(`   Contact: ${contact.first_name} ${contact.last_name} (${contact.type})`);
      });

      // Check tickets
      const { data: tickets, error: ticketError } = await supabase
        .from('tickets')
        .select('ticket_id, status, price_paid')
        .eq('registration_id', registrationId);

      if (ticketError) {
        console.log('❌ Error verifying tickets:', ticketError);
        return false;
      }

      console.log(`✅ ${tickets.length} tickets created`);
      const totalTicketValue = tickets.reduce((sum, ticket) => sum + parseFloat(ticket.price_paid), 0);
      console.log(`   Total ticket value: $${totalTicketValue.toFixed(2)}`);

      return true;

    } catch (error) {
      console.log('❌ Verification failed:', error);
      return false;
    }
  }

  private generateFixReport(): void {
    console.log('\n📊 ERROR ANALYSIS REPORT');
    console.log('=' .repeat(50));

    this.errors.forEach((error, index) => {
      console.log(`\n${index + 1}. ${error.errorType}`);
      console.log(`   Error: ${error.errorMessage}`);
      console.log(`   Fix: ${error.suggestedFix}`);
      if (error.sqlFix) {
        console.log(`   SQL Fix: ${error.sqlFix}`);
      }
      if (error.codeFix) {
        console.log(`   Code Fix: ${error.codeFix}`);
      }
    });

    if (this.errors.length === 0) {
      console.log('No errors encountered! ✅');
    }
  }

  public async run(): Promise<void> {
    console.log('🚀 AUTOMATED LODGE REGISTRATION TESTER');
    console.log('=' .repeat(50));

    // Validate prerequisites
    const prerequisitesOk = await this.validatePrerequisites();
    if (!prerequisitesOk) {
      console.log('❌ Prerequisites not met. Exiting.');
      process.exit(1);
    }

    // Test loop
    while (this.currentAttempt < this.maxAttempts) {
      const result = await this.testRegistration();

      if (result.success && result.data) {
        console.log('🎉 SUCCESS! Lodge registration completed successfully!');
        
        // Verify the registration
        const verified = await this.verifyRegistration(result.data.registrationId);
        if (verified) {
          console.log('🎉 VERIFICATION PASSED! All data correctly stored.');
          break;
        } else {
          console.log('⚠️ Registration succeeded but verification failed');
        }
      } else if (result.error) {
        const analysis = this.analyzeError(result.error);
        this.errors.push(analysis);
        
        console.log(`\n🔍 ERROR ANALYSIS:`);
        console.log(`   Type: ${analysis.errorType}`);
        console.log(`   Fix: ${analysis.suggestedFix}`);
        if (analysis.sqlFix) {
          console.log(`   SQL: ${analysis.sqlFix}`);
        }
      }

      this.currentAttempt++;

      if (this.currentAttempt < this.maxAttempts) {
        console.log(`\n⏳ Waiting 2 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Generate final report
    this.generateFixReport();

    if (this.currentAttempt >= this.maxAttempts) {
      console.log(`\n❌ FAILED: Maximum attempts (${this.maxAttempts}) reached`);
      console.log('📋 Review the error analysis above to fix the issues');
      process.exit(1);
    }
  }
}

// Run the tester
const tester = new LodgeRegistrationTester();
tester.run().catch(error => {
  console.error('💥 Tester crashed:', error);
  process.exit(1);
});