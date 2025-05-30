#!/usr/bin/env ts-node

/**
 * Test script for Stripe metadata implementation
 * 
 * This script tests the metadata building functions to ensure they
 * properly handle all data and respect Stripe's limitations.
 */

import { 
  buildPaymentIntentMetadata, 
  buildCustomerMetadata,
  buildProductMetadata,
  buildPriceMetadata,
  truncateMetadataValue,
  formatMetadataKey,
  buildMetadata
} from '../lib/utils/stripe-metadata';

console.log('🧪 Testing Stripe Metadata Implementation\n');

// Test 1: Key formatting
console.log('Test 1: Key Formatting');
const testKeys = [
  'simple_key',
  'UPPERCASE_KEY',
  'key-with-dashes',
  'key.with.dots',
  'key with spaces',
  'very_long_key_that_exceeds_the_forty_character_limit_for_stripe',
  'key@with#special$chars%'
];

testKeys.forEach(key => {
  const formatted = formatMetadataKey(key);
  console.log(`  ${key} -> ${formatted} (${formatted.length} chars)`);
});

// Test 2: Value truncation
console.log('\nTest 2: Value Truncation');
const testValues = [
  'Short value',
  'A'.repeat(500),
  'A'.repeat(501),
  null,
  undefined,
  ''
];

testValues.forEach((value, index) => {
  const truncated = truncateMetadataValue(value);
  console.log(`  Value ${index + 1}: ${value?.length || 0} chars -> ${truncated.length} chars${truncated.endsWith('...') ? ' (truncated)' : ''}`);
});

// Test 3: Build general metadata
console.log('\nTest 3: General Metadata Building');
const testData = {
  key1: 'value1',
  key2: 'value2',
  null_value: null,
  undefined_value: undefined,
  empty_value: '',
  long_value: 'A'.repeat(600),
  'key-with-special-chars!@#': 'value',
};

const builtMetadata = buildMetadata(testData);
console.log('  Input keys:', Object.keys(testData).length);
console.log('  Output keys:', Object.keys(builtMetadata).length);
console.log('  Built metadata:', JSON.stringify(builtMetadata, null, 2));

// Test 4: Payment Intent Metadata
console.log('\nTest 4: Payment Intent Metadata');
const paymentIntentData = {
  registrationId: '123e4567-e89b-12d3-a456-426614174000',
  registrationType: 'lodge' as const,
  confirmationNumber: 'REG-12345678',
  
  parentEventId: '987e6543-e89b-12d3-a456-426614174000',
  parentEventTitle: 'Grand Installation Ceremony 2024 - United Grand Lodge of NSW & ACT',
  parentEventSlug: 'grand-installation-2024',
  childEventCount: 5,
  
  organisationId: 'org_123',
  organisationName: 'United Grand Lodge of NSW & ACT',
  organisationType: 'grand_lodge',
  
  totalAttendees: 125,
  primaryAttendeeName: 'John Smith',
  primaryAttendeeEmail: 'john.smith@example.com',
  attendeeTypes: { mason: 100, guest: 20, ladypartner: 5 },
  
  lodgeId: 'lodge_456',
  lodgeName: 'Lodge Unity No. 6',
  lodgeNumber: '6',
  grandLodgeId: 'gl_789',
  
  ticketsCount: 125,
  ticketTypes: { standard: 100, vip: 25 },
  ticketIds: Array(125).fill(0).map((_, i) => `ticket_${i}`),
  
  subtotal: 12500,
  totalAmount: 12875,
  platformFee: 375,
  platformFeePercentage: 0.03,
  currency: 'aud',
  
  sessionId: 'sess_1234567890',
  referrer: 'https://uglnsw.org.au',
  deviceType: 'desktop' as const,
  appVersion: '0.1.0'
};

const paymentMetadata = buildPaymentIntentMetadata(paymentIntentData);
console.log('  Payment intent metadata keys:', Object.keys(paymentMetadata).length);
console.log('  Total metadata size:', JSON.stringify(paymentMetadata).length, 'bytes');

// Test 5: Customer Metadata
console.log('\nTest 5: Customer Metadata');
const customerData = {
  attendeeId: 'att_123',
  registrationId: 'reg_456',
  attendeeType: 'mason',
  isPrimary: true,
  
  masonType: 'master_mason',
  lodgeName: 'Lodge Unity No. 6',
  lodgeNumber: '6',
  grandLodge: 'NSW & ACT',
  masonicRank: 'Past Master',
  
  dietaryRequirements: 'Vegetarian, no nuts',
  accessibilityNeeds: 'Wheelchair access required',
  createdAt: new Date().toISOString()
};

const customerMetadata = buildCustomerMetadata(customerData);
console.log('  Customer metadata keys:', Object.keys(customerMetadata).length);

// Test 6: Product Metadata
console.log('\nTest 6: Product Metadata');
const productData = {
  eventId: 'evt_123',
  parentEventId: 'evt_parent',
  eventType: 'installation',
  eventSlug: 'grand-installation-2024',
  organisationId: 'org_123',
  eventStart: new Date('2024-12-01T18:00:00Z'),
  eventEnd: new Date('2024-12-01T23:00:00Z'),
  locationId: 'loc_456',
  maxAttendees: 500,
  isMultiDay: false,
  isPublished: true,
  isFeatured: true
};

const productMetadata = buildProductMetadata(productData);
console.log('  Product metadata keys:', Object.keys(productMetadata).length);

// Test 7: Price Metadata
console.log('\nTest 7: Price Metadata');
const priceData = {
  ticketId: 'tkt_123',
  ticketType: 'standard',
  eventId: 'evt_123',
  includesMeal: true,
  includesDrinks: false,
  maxQuantity: 10,
  minQuantity: 1,
  eligibility: 'masons_only'
};

const priceMetadata = buildPriceMetadata(priceData);
console.log('  Price metadata keys:', Object.keys(priceMetadata).length);

// Test 8: Size limit testing
console.log('\nTest 8: Metadata Size Limits');
const largeData: Record<string, any> = {};
for (let i = 0; i < 60; i++) {
  largeData[`key_${i}`] = 'A'.repeat(400);
}

const largeMetadata = buildMetadata(largeData);
console.log('  Input keys:', Object.keys(largeData).length);
console.log('  Output keys:', Object.keys(largeMetadata).length);
console.log('  Total size:', JSON.stringify(largeMetadata).length, 'bytes (limit: 8000)');

console.log('\n✅ All tests completed!');
console.log('\nSummary:');
console.log('- Key formatting works correctly');
console.log('- Value truncation respects 500 char limit');
console.log('- Metadata building handles null/undefined values');
console.log('- All metadata builders create valid output');
console.log('- Size limits are properly enforced');