/**
 * Test data for E2E tests
 */

export const testData = {
  mason: {
    firstName: 'John',
    lastName: 'Smith',
    rank: 'MM',
    email: 'john.smith@test.com',
    phone: '0400000000',
    lodge: 'Test Lodge No. 123',
    grandLodge: 'United Grand Lodge of NSW & ACT',
  },
  
  guest: {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@test.com',
    phone: '0411111111',
  },
  
  creditCard: {
    number: '4242424242424242',
    expiry: '12/25',
    cvc: '123',
    zip: '2000',
  },
};

export const testUrls = {
  registration: '/events/grand-installation/register',
  individualRegistration: '/events/grand-installation/register/individual',
  lodgeRegistration: '/events/grand-installation/register/lodge',
  delegationRegistration: '/events/grand-installation/register/delegation',
};

/**
 * Generate unique test data to avoid conflicts in parallel tests
 */
export function generateUniqueTestData() {
  const timestamp = Date.now();
  return {
    guest: {
      firstName: `TestGuest${timestamp}`,
      lastName: `User${timestamp}`,
      email: `guest${timestamp}@example.com`,
      phone: `0400${timestamp.toString().substring(0, 6)}`,
    },
    mason: {
      firstName: `TestMason${timestamp}`,
      lastName: `User${timestamp}`,
      email: `mason${timestamp}@example.com`,
      phone: `0400${timestamp.toString().substring(0, 6)}`,
      rank: 'MM',
      lodge: `Test Lodge No. ${timestamp.toString().substring(0, 3)}`,
      grandLodge: 'United Grand Lodge of NSW & ACT',
    }
  };
}