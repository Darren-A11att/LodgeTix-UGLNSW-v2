#!/usr/bin/env node

/**
 * Test Registration Flows - Individual and Lodge
 * Tests the complete registration flow through the Square payment system
 */

const puppeteer = require('puppeteer');
const crypto = require('crypto');

// Test card details provided
const TEST_CARD = {
  number: '4111111111111111',
  expiry: '12/26',
  cvv: '111',
  postalCode: '90210'
};

// Test data based on CSV analysis
const INDIVIDUAL_TEST_DATA = {
  raw_id: crypto.randomBytes(8).toString('hex'),
  bookingContact: {
    title: 'Bro',
    firstName: 'John',
    lastName: 'TestUser',
    email: 'test@allatt.me', // Will be updated with raw_id
    mobile: '0412345678',
    addressLine1: '123 Test Street',
    suburb: 'Sydney',
    postcode: '2000',
    state: 'NSW',
    country: 'AU'
  },
  attendee: {
    title: 'Bro',
    firstName: 'John',
    lastName: 'TestUser',
    rank: 'MM',
    attendeeType: 'mason',
    lodgeNameNumber: 'Lodge Canoblas Lewis No. 806',
    grandLodgeName: 'United Grand Lodge of New South Wales & Australian Capital Territory'
  }
};

const LODGE_TEST_DATA = {
  raw_id: crypto.randomBytes(8).toString('hex'),
  bookingContact: {
    title: 'W Bro',
    firstName: 'Jane',
    lastName: 'TestSecretary',
    email: 'lodge@allatt.me', // Will be updated with raw_id
    mobile: '0412345679',
    rank: 'IM'
  },
  lodge: {
    lodgeName: 'Test Lodge No. 999',
    tableCount: 1 // 1 table = 10 attendees
  }
};

// Function to wait for element and interact
async function waitAndFill(page, selector, value, options = {}) {
  console.log(`  Filling ${selector} with: ${value}`);
  await page.waitForSelector(selector, { timeout: 10000 });
  await page.fill(selector, value);
  if (options.delay) {
    await page.waitForTimeout(options.delay);
  }
}

async function waitAndClick(page, selector, description = '') {
  console.log(`  Clicking: ${description || selector}`);
  await page.waitForSelector(selector, { timeout: 10000 });
  await page.click(selector);
}

async function testIndividualRegistration() {
  console.log('🧑 Testing Individual Registration Flow...\n');
  
  // Update email with raw_id
  const testEmail = `${INDIVIDUAL_TEST_DATA.raw_id}@allatt.me`;
  INDIVIDUAL_TEST_DATA.bookingContact.email = testEmail;
  
  console.log(`📧 Test Email: ${testEmail}`);
  console.log(`🆔 Raw ID: ${INDIVIDUAL_TEST_DATA.raw_id}\n`);

  const browser = await puppeteer.launch({ 
    headless: false, // Set to true for CI
    devtools: false,
    args: ['--no-sandbox', '--disable-web-security']
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1200, height: 800 });
    
    console.log('1️⃣ Navigating to registration page...');
    await page.goto('http://localhost:3001/functions/grand-proclamation-2025/register', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    console.log('2️⃣ Starting individual registration...');
    await waitAndClick(page, '[data-testid="individuals-button"]', 'Individuals button');
    await page.waitForTimeout(2000);
    
    console.log('3️⃣ Filling booking contact details...');
    // Fill booking contact form
    await waitAndFill(page, '[name="title"]', INDIVIDUAL_TEST_DATA.bookingContact.title);
    await waitAndFill(page, '[name="firstName"]', INDIVIDUAL_TEST_DATA.bookingContact.firstName);
    await waitAndFill(page, '[name="lastName"]', INDIVIDUAL_TEST_DATA.bookingContact.lastName);
    await waitAndFill(page, '[name="email"]', testEmail);
    await waitAndFill(page, '[name="mobile"]', INDIVIDUAL_TEST_DATA.bookingContact.mobile);
    await waitAndFill(page, '[name="addressLine1"]', INDIVIDUAL_TEST_DATA.bookingContact.addressLine1);
    await waitAndFill(page, '[name="suburb"]', INDIVIDUAL_TEST_DATA.bookingContact.suburb);
    await waitAndFill(page, '[name="postcode"]', INDIVIDUAL_TEST_DATA.bookingContact.postcode);
    
    // Select state
    await waitAndClick(page, '[name="stateTerritory"]', 'State dropdown');
    await waitAndClick(page, `option[value="NSW"]`, 'NSW option');
    
    // Select country
    await waitAndClick(page, '[name="country"]', 'Country dropdown');
    await waitAndClick(page, `option[value="AU"]`, 'Australia option');
    
    console.log('4️⃣ Proceeding to attendee details...');
    await waitAndClick(page, '[data-testid="next-step-button"]', 'Next step button');
    await page.waitForTimeout(2000);
    
    console.log('5️⃣ Filling attendee details...');
    // Fill attendee details
    await waitAndFill(page, '[name="attendees[0].title"]', INDIVIDUAL_TEST_DATA.attendee.title);
    await waitAndFill(page, '[name="attendees[0].firstName"]', INDIVIDUAL_TEST_DATA.attendee.firstName);
    await waitAndFill(page, '[name="attendees[0].lastName"]', INDIVIDUAL_TEST_DATA.attendee.lastName);
    await waitAndFill(page, '[name="attendees[0].rank"]', INDIVIDUAL_TEST_DATA.attendee.rank);
    
    // Select attendee type
    await waitAndClick(page, '[name="attendees[0].attendeeType"]', 'Attendee type dropdown');
    await waitAndClick(page, `option[value="mason"]`, 'Mason option');
    
    console.log('6️⃣ Proceeding to ticket selection...');
    await waitAndClick(page, '[data-testid="next-step-button"]', 'Next step button');
    await page.waitForTimeout(2000);
    
    console.log('7️⃣ Selecting tickets...');
    // Select a ticket (assuming there's at least one available)
    await waitAndClick(page, '[data-testid="select-ticket-button"]:first-child', 'First ticket option');
    await page.waitForTimeout(1000);
    
    console.log('8️⃣ Proceeding to payment...');
    await waitAndClick(page, '[data-testid="next-step-button"]', 'Next step button');
    await page.waitForTimeout(3000);
    
    console.log('9️⃣ Processing payment with Square...');
    
    // Wait for Square payment form to load
    await page.waitForSelector('#sq-card-number', { timeout: 15000 });
    console.log('  Square payment form loaded');
    
    // Fill Square payment form
    await waitAndFill(page, '#sq-card-number', TEST_CARD.number, { delay: 500 });
    await waitAndFill(page, '#sq-expiration-date', TEST_CARD.expiry, { delay: 500 });
    await waitAndFill(page, '#sq-cvv', TEST_CARD.cvv, { delay: 500 });
    await waitAndFill(page, '#sq-postal-code', TEST_CARD.postalCode, { delay: 500 });
    
    console.log('🔟 Submitting payment...');
    await waitAndClick(page, '[data-testid="complete-payment-button"]', 'Complete payment button');
    
    // Wait for payment processing
    console.log('⏳ Waiting for payment processing...');
    await page.waitForSelector('[data-testid="payment-success"]', { timeout: 60000 });
    
    console.log('✅ Individual registration completed successfully!');
    
    // Get confirmation details
    const confirmationNumber = await page.$eval('[data-testid="confirmation-number"]', el => el.textContent);
    console.log(`🎫 Confirmation Number: ${confirmationNumber}`);
    
    return { success: true, confirmationNumber, email: testEmail, raw_id: INDIVIDUAL_TEST_DATA.raw_id };
    
  } catch (error) {
    console.error('❌ Individual registration failed:', error.message);
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

async function testLodgeRegistration() {
  console.log('🏛️ Testing Lodge Registration Flow...\n');
  
  // Update email with raw_id
  const testEmail = `${LODGE_TEST_DATA.raw_id}@allatt.me`;
  LODGE_TEST_DATA.bookingContact.email = testEmail;
  
  console.log(`📧 Test Email: ${testEmail}`);
  console.log(`🆔 Raw ID: ${LODGE_TEST_DATA.raw_id}\n`);

  const browser = await puppeteer.launch({ 
    headless: false, // Set to true for CI
    devtools: false,
    args: ['--no-sandbox', '--disable-web-security']
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1200, height: 800 });
    
    console.log('1️⃣ Navigating to registration page...');
    await page.goto('http://localhost:3001/functions/grand-proclamation-2025/register', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    console.log('2️⃣ Starting lodge registration...');
    await waitAndClick(page, '[data-testid="lodge-button"]', 'Lodge button');
    await page.waitForTimeout(2000);
    
    console.log('3️⃣ Filling lodge details...');
    // Fill lodge form
    await waitAndFill(page, '[name="lodgeName"]', LODGE_TEST_DATA.lodge.lodgeName);
    await waitAndFill(page, '[name="tableCount"]', LODGE_TEST_DATA.lodge.tableCount.toString());
    
    // Fill booking contact
    await waitAndFill(page, '[name="bookingContact.title"]', LODGE_TEST_DATA.bookingContact.title);
    await waitAndFill(page, '[name="bookingContact.firstName"]', LODGE_TEST_DATA.bookingContact.firstName);
    await waitAndFill(page, '[name="bookingContact.lastName"]', LODGE_TEST_DATA.bookingContact.lastName);
    await waitAndFill(page, '[name="bookingContact.email"]', testEmail);
    await waitAndFill(page, '[name="bookingContact.mobile"]', LODGE_TEST_DATA.bookingContact.mobile);
    await waitAndFill(page, '[name="bookingContact.rank"]', LODGE_TEST_DATA.bookingContact.rank);
    
    console.log('4️⃣ Processing payment with Square...');
    
    // Wait for Square payment form to load
    await page.waitForSelector('#sq-card-number', { timeout: 15000 });
    console.log('  Square payment form loaded');
    
    // Fill Square payment form
    await waitAndFill(page, '#sq-card-number', TEST_CARD.number, { delay: 500 });
    await waitAndFill(page, '#sq-expiration-date', TEST_CARD.expiry, { delay: 500 });
    await waitAndFill(page, '#sq-cvv', TEST_CARD.cvv, { delay: 500 });
    await waitAndFill(page, '#sq-postal-code', TEST_CARD.postalCode, { delay: 500 });
    
    console.log('5️⃣ Submitting lodge registration and payment...');
    await waitAndClick(page, '[data-testid="complete-lodge-payment-button"]', 'Complete lodge payment button');
    
    // Wait for payment processing
    console.log('⏳ Waiting for payment processing...');
    await page.waitForSelector('[data-testid="payment-success"]', { timeout: 60000 });
    
    console.log('✅ Lodge registration completed successfully!');
    
    // Get confirmation details
    const confirmationNumber = await page.$eval('[data-testid="confirmation-number"]', el => el.textContent);
    console.log(`🎫 Confirmation Number: ${confirmationNumber}`);
    
    return { success: true, confirmationNumber, email: testEmail, raw_id: LODGE_TEST_DATA.raw_id };
    
  } catch (error) {
    console.error('❌ Lodge registration failed:', error.message);
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

async function runTests() {
  console.log('🚀 Starting Square Payment Integration Tests\n');
  console.log('=' .repeat(60) + '\n');
  
  const results = {
    individual: null,
    lodge: null
  };
  
  try {
    // Test Individual Registration
    results.individual = await testIndividualRegistration();
    
    console.log('\n' + '=' .repeat(60) + '\n');
    
    // Test Lodge Registration
    results.lodge = await testLodgeRegistration();
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
  }
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  
  console.log('\n🧑 Individual Registration:');
  if (results.individual?.success) {
    console.log(`  ✅ SUCCESS`);
    console.log(`  📧 Email: ${results.individual.email}`);
    console.log(`  🆔 Raw ID: ${results.individual.raw_id}`);
    console.log(`  🎫 Confirmation: ${results.individual.confirmationNumber}`);
  } else {
    console.log(`  ❌ FAILED: ${results.individual?.error || 'Unknown error'}`);
  }
  
  console.log('\n🏛️ Lodge Registration:');
  if (results.lodge?.success) {
    console.log(`  ✅ SUCCESS`);
    console.log(`  📧 Email: ${results.lodge.email}`);
    console.log(`  🆔 Raw ID: ${results.lodge.raw_id}`);
    console.log(`  🎫 Confirmation: ${results.lodge.confirmationNumber}`);
  } else {
    console.log(`  ❌ FAILED: ${results.lodge?.error || 'Unknown error'}`);
  }
  
  const successCount = (results.individual?.success ? 1 : 0) + (results.lodge?.success ? 1 : 0);
  console.log(`\n🎯 Overall: ${successCount}/2 tests passed`);
  
  if (successCount === 2) {
    console.log('🎉 All Square payment tests passed successfully!');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().then(() => {
    console.log('\n✨ Test suite completed!');
    process.exit(0);
  }).catch((error) => {
    console.error('\n💥 Test suite crashed:', error);
    process.exit(1);
  });
}

module.exports = { testIndividualRegistration, testLodgeRegistration, runTests };