/**
 * Test script to verify confirmation email functionality
 * Run with: npx tsx scripts/test-confirmation-email.ts
 */

const testEmailData = {
  confirmationNumber: "TEMP-TEST123",
  functionData: {
    name: "Grand Proclamation 2025",
    startDate: "2025-06-15T09:00:00Z",
    endDate: "2025-06-15T17:00:00Z",
    organiser: {
      name: "United Grand Lodge of NSW & ACT"
    },
    location: {
      place_name: "Sydney Masonic Centre",
      street_address: "279 Castlereagh Street",
      suburb: "Sydney",
      state: "NSW",
      postal_code: "2000",
      country: "Australia"
    }
  },
  billingDetails: {
    firstName: "John",
    lastName: "Smith",
    emailAddress: "john.smith@example.com",
    mobileNumber: "+61400000000",
    addressLine1: "123 Test Street",
    suburb: "Sydney",
    stateTerritory: { name: "NSW" },
    postcode: "2000",
    country: { name: "Australia" }
  },
  attendees: [
    {
      title: "Mr",
      firstName: "John",
      lastName: "Smith",
      attendeeType: "mason",
      primaryEmail: "john.smith@example.com",
      primaryPhone: "+61400000000",
      dietaryRequirements: "No dietary requirements",
      contactPreference: "email",
      suffix: "PM",
      isPrimary: true,
      attendeeId: "attendee-1"
    }
  ],
  tickets: [
    {
      ticketName: "Grand Proclamation Ceremony",
      ticketPrice: 20.00,
      attendeeId: "attendee-1",
      ticketId: "ticket-1"
    }
  ],
  subtotal: 20.00,
  stripeFee: 0.66,
  totalAmount: 20.66
};

async function testConfirmationEmail() {
  try {
    console.log('🧪 Testing confirmation email API...');
    
    const response = await fetch('http://localhost:3000/api/emails/individual-confirmation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEmailData),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Email sent successfully!');
      console.log('📧 Email ID:', result.emailId);
      console.log('📬 Recipient:', result.recipient);
    } else {
      console.error('❌ Email failed to send:');
      console.error('Status:', response.status);
      console.error('Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test if this script is executed directly
if (require.main === module) {
  testConfirmationEmail();
}

export { testEmailData, testConfirmationEmail };