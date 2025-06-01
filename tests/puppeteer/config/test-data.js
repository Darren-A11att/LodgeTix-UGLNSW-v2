/**
 * Test data for Puppeteer E2E tests
 */

const testData = {
  // Function data
  functionSlug: 'grand-installation', // Update this to match your actual function slug
  eventSlug: 'grand-proclamation-2025', // Specific event within the function
  
  // Mason test data
  mason: {
    firstName: 'John',
    lastName: 'Smith',
    rank: 'MM',
    email: 'john.smith@test.com',
    phone: '0400000000',
    lodge: 'Test Lodge No. 123',
    lodgeNumber: '123',
    grandLodge: 'United Grand Lodge of NSW & ACT',
    title: 'Bro',
    dietaryRequirements: '',
    accessibilityRequirements: ''
  },
  
  // Guest test data
  guest: {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@test.com',
    phone: '0411111111',
    dietaryRequirements: '',
    accessibilityRequirements: ''
  },
  
  // Grand Officer test data
  grandOfficer: {
    firstName: 'James',
    lastName: 'Wilson',
    rank: 'GL',
    title: 'RWBro',
    currentOffice: 'Deputy Grand Master',
    pastOffice: 'Grand Secretary',
    email: 'james.wilson@test.com',
    phone: '0422222222',
    lodge: 'Grand Lodge',
    lodgeNumber: 'GL',
    grandLodge: 'United Grand Lodge of NSW & ACT'
  },
  
  // Credit card test data
  creditCard: {
    number: '4242424242424242',
    expiry: '12/25',
    cvc: '123',
    zip: '2000',
    name: 'Test User'
  },
  
  // Lodge details for Lodge registration
  lodgeDetails: {
    lodgeName: 'Test Lodge No. 123',
    lodgeNumber: '123',
    grandLodge: 'United Grand Lodge of NSW & ACT',
    bookingContact: {
      firstName: 'Lodge',
      lastName: 'Secretary',
      email: 'secretary@testlodge.com',
      phone: '0433333333'
    }
  },
  
  // Delegation details
  delegationDetails: {
    lodgeName: 'Delegation Lodge No. 456',
    lodgeNumber: '456',
    grandLodge: 'United Grand Lodge of NSW & ACT',
    delegationSize: 5,
    bookingContact: {
      firstName: 'Delegation',
      lastName: 'Leader',
      email: 'leader@delegation.com',
      phone: '0444444444'
    }
  },

  // Mason titles
  masonTitles: ['Bro', 'WBro', 'VWBro', 'RWBro', 'MWBro'],
  
  // Mason ranks
  masonRanks: ['MM', 'FC', 'EA', 'GL'],
  
  // Contact preferences
  contactPreferences: ['PrimaryAttendee', 'Directly', 'ProvideLater'],
  
  // Grand Officer offices
  grandOfficerOffices: [
    'Grand Master',
    'Deputy Grand Master',
    'Assistant Grand Master',
    'Grand Secretary',
    'Grand Treasurer',
    'Grand Director of Ceremonies',
    'Grand Chaplain',
    'Grand Organist',
    'Grand Pursuivant',
    'Grand Standard Bearer',
    'Grand Sword Bearer',
    'Grand Herald',
    'Grand Lecturer',
    'Grand Librarian',
    'Grand Historian',
    'Grand Charity Steward',
    'Grand Almoner',
    'Grand Registrar',
    'Grand Tyler'
  ]
};

/**
 * Generate unique test data to avoid conflicts in parallel tests
 */
function generateUniqueTestData() {
  const timestamp = Date.now();
  return {
    guest: {
      ...testData.guest,
      firstName: `TestGuest${timestamp}`,
      lastName: `User${timestamp}`,
      email: `guest${timestamp}@example.com`,
      phone: `04${timestamp.toString().substring(0, 8)}`,
    },
    mason: {
      ...testData.mason,
      firstName: `TestMason${timestamp}`,
      lastName: `User${timestamp}`,
      email: `mason${timestamp}@example.com`,
      phone: `04${timestamp.toString().substring(0, 8)}`,
      lodge: `Test Lodge No. ${timestamp.toString().substring(0, 3)}`,
    }
  };
}

module.exports = {
  testData,
  generateUniqueTestData
};