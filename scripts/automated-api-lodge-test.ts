#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';

interface TestPayload {
  logEntries: Array<{
    type: string;
    message: string;
    data: any;
  }>;
  baseUrl: string;
}

interface ErrorAnalysis {
  errorType: string;
  errorMessage: string;
  suggestedFix: string;
  statusCode?: number;
}

class LodgeAPITester {
  private testPayload: any;
  private baseUrl: string;
  private maxAttempts = 10;
  private currentAttempt = 0;
  private errors: ErrorAnalysis[] = [];
  private endpoint: string;

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
      const responseEntry = testData.logEntries.find(entry => entry.type === 'response');
      
      if (!requestBodyEntry || !requestDataEntry || !responseEntry) {
        throw new Error('Could not find complete request data in test payload');
      }

      const { data: requestInfo } = requestDataEntry;
      const { data: requestBody } = requestBodyEntry;
      const { data: responseInfo } = responseEntry;

      this.baseUrl = testData.baseUrl || 'http://localhost:3001'; // Use port 3001 as per dev server
      this.endpoint = responseInfo.endpoint;
      this.testPayload = requestBody;

      console.log('✅ Test payload loaded successfully');
      console.log(`🌐 Base URL: ${this.baseUrl}`);
      console.log(`🎯 Endpoint: ${this.endpoint}`);
      console.log('📋 Test payload:', JSON.stringify(this.testPayload, null, 2));
      
    } catch (error) {
      console.error('❌ Failed to load test payload:', error);
      process.exit(1);
    }
  }

  private analyzeError(statusCode: number, response: any): ErrorAnalysis {
    const errorMessage = response?.error || response?.message || 'Unknown error';

    console.log(`🔍 Analyzing error: Status ${statusCode}`);
    console.log(`🔍 Error message: ${errorMessage}`);

    // Enum value errors
    if (errorMessage.includes('invalid input value for enum contact_type')) {
      return {
        errorType: 'ENUM_CONTACT_TYPE',
        errorMessage,
        suggestedFix: 'The contacts.type field only accepts "individual" or "organisation" values. The RPC function is still using "customer".',
        statusCode
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
          statusCode
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
        statusCode
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
        statusCode
      };
    }

    // Function does not exist
    if (errorMessage.includes('function') && errorMessage.includes('does not exist')) {
      return {
        errorType: 'FUNCTION_NOT_EXISTS',
        errorMessage,
        suggestedFix: 'The RPC function does not exist or is not accessible.',
        statusCode
      };
    }

    // Permission errors
    if (statusCode === 401 || statusCode === 403) {
      return {
        errorType: 'PERMISSION_ERROR',
        errorMessage,
        suggestedFix: 'Authentication or authorization failed.',
        statusCode
      };
    }

    // Server errors
    if (statusCode === 500) {
      return {
        errorType: 'INTERNAL_SERVER_ERROR',
        errorMessage,
        suggestedFix: 'Internal server error. Check server logs and database state.',
        statusCode
      };
    }

    // Bad request
    if (statusCode === 400) {
      return {
        errorType: 'BAD_REQUEST',
        errorMessage,
        suggestedFix: 'Invalid request format or missing required fields.',
        statusCode
      };
    }

    // Not found
    if (statusCode === 404) {
      return {
        errorType: 'NOT_FOUND',
        errorMessage,
        suggestedFix: 'Endpoint not found or resource does not exist.',
        statusCode
      };
    }

    // Generic error
    return {
      errorType: 'UNKNOWN_ERROR',
      errorMessage,
      suggestedFix: 'Unknown error occurred. Manual investigation required.',
      statusCode
    };
  }

  private async testAPICall(): Promise<{ success: boolean; data?: any; error?: any; statusCode?: number }> {
    console.log(`\n🧪 Test Attempt ${this.currentAttempt + 1}/${this.maxAttempts}`);
    console.log(`🚀 POST ${this.baseUrl}${this.endpoint}`);

    try {
      const response = await fetch(`${this.baseUrl}${this.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.testPayload)
      });

      const data = await response.json();
      const statusCode = response.status;

      console.log(`📊 Status: ${statusCode}`);

      if (!response.ok) {
        console.log('❌ API call failed');
        console.log('📋 Response:', JSON.stringify(data, null, 2));
        return { success: false, error: data, statusCode };
      }

      console.log('✅ API call succeeded!');
      console.log('📋 Response:', JSON.stringify(data, null, 2));
      return { success: true, data, statusCode };

    } catch (error: any) {
      console.log('❌ Network error:', error.message);
      return { success: false, error: { message: error.message }, statusCode: 0 };
    }
  }

  private generateFixReport(): void {
    console.log('\n📊 ERROR ANALYSIS REPORT');
    console.log('=' .repeat(50));

    this.errors.forEach((error, index) => {
      console.log(`\n${index + 1}. ${error.errorType} (HTTP ${error.statusCode})`);
      console.log(`   Error: ${error.errorMessage}`);
      console.log(`   Fix: ${error.suggestedFix}`);
    });

    if (this.errors.length === 0) {
      console.log('No errors encountered! ✅');
    } else {
      console.log('\n🔧 SUGGESTED ACTIONS:');
      
      // Check for enum errors
      const enumErrors = this.errors.filter(e => e.errorType.includes('ENUM'));
      if (enumErrors.length > 0) {
        console.log('1. Fix enum value errors in the RPC function');
        console.log('   - Update contact type from "customer" to "individual"');
        console.log('   - Verify all enum values match database schema');
      }

      // Check for foreign key errors
      const fkErrors = this.errors.filter(e => e.errorType === 'FOREIGN_KEY_VIOLATION');
      if (fkErrors.length > 0) {
        console.log('2. Fix foreign key constraint violations');
        console.log('   - Ensure referenced records exist before insertion');
        console.log('   - Check function_id and package_id validity');
      }

      // Check for column errors
      const colErrors = this.errors.filter(e => e.errorType === 'COLUMN_NOT_EXISTS');
      if (colErrors.length > 0) {
        console.log('3. Fix column reference errors');
        console.log('   - Remove references to non-existent columns');
        console.log('   - Update table schema if columns are needed');
      }
    }
  }

  public async run(): Promise<void> {
    console.log('🚀 AUTOMATED LODGE API TESTER');
    console.log('=' .repeat(50));

    // Test loop
    while (this.currentAttempt < this.maxAttempts) {
      const result = await this.testAPICall();

      if (result.success && result.data) {
        console.log('🎉 SUCCESS! Lodge registration API call completed successfully!');
        
        if (result.data.success && result.data.registrationId) {
          console.log(`✅ Registration ID: ${result.data.registrationId}`);
          console.log('🎉 VERIFICATION: Registration was created successfully!');
        }
        break;
      } else if (result.error && result.statusCode) {
        const analysis = this.analyzeError(result.statusCode, result.error);
        this.errors.push(analysis);
        
        console.log(`\n🔍 ERROR ANALYSIS:`);
        console.log(`   Type: ${analysis.errorType}`);
        console.log(`   Status: ${analysis.statusCode}`);
        console.log(`   Fix: ${analysis.suggestedFix}`);

        // If it's the same enum error, no point in retrying
        if (analysis.errorType === 'ENUM_CONTACT_TYPE') {
          console.log('\n⚠️ ENUM ERROR DETECTED - This requires a code fix, stopping retries');
          break;
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

    if (this.currentAttempt >= this.maxAttempts && this.errors.length > 0) {
      console.log(`\n❌ FAILED: Maximum attempts (${this.maxAttempts}) reached`);
      console.log('📋 Review the error analysis above to fix the issues');
      process.exit(1);
    } else if (this.errors.length > 0 && this.errors[this.errors.length - 1].errorType === 'ENUM_CONTACT_TYPE') {
      console.log('\n❌ FAILED: Enum error requires code fix');
      console.log('📋 The RPC function still uses "customer" instead of "individual"');
      process.exit(1);
    }
  }
}

// Run the tester
const tester = new LodgeAPITester();
tester.run().catch(error => {
  console.error('💥 Tester crashed:', error);
  process.exit(1);
});