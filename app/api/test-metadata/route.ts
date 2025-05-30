import { NextResponse } from 'next/server';
import { 
  buildPaymentIntentMetadata,
  buildCustomerMetadata,
  buildProductMetadata,
  buildPriceMetadata
} from '@/lib/utils/stripe-metadata';

export async function GET() {
  try {
    // Test payment intent metadata
    const paymentMetadata = buildPaymentIntentMetadata({
      registrationId: '123e4567-e89b-12d3-a456-426614174000',
      registrationType: 'lodge',
      confirmationNumber: 'REG-12345678',
      
      parentEventId: '987e6543-e89b-12d3-a456-426614174000',
      parentEventTitle: 'Grand Installation Ceremony 2024',
      parentEventSlug: 'grand-installation-2024',
      childEventCount: 3,
      
      organisationId: 'org_123',
      organisationName: 'United Grand Lodge of NSW & ACT',
      organisationType: 'grand_lodge',
      
      totalAttendees: 50,
      primaryAttendeeName: 'John Smith',
      primaryAttendeeEmail: 'john@example.com',
      attendeeTypes: { mason: 40, guest: 10 },
      
      lodgeName: 'Lodge Unity No. 6',
      lodgeNumber: '6',
      
      ticketsCount: 50,
      ticketTypes: { standard: 40, vip: 10 },
      ticketIds: ['tkt_1', 'tkt_2', 'tkt_3'],
      
      subtotal: 5000,
      totalAmount: 5150,
      platformFee: 150,
      platformFeePercentage: 0.03,
      currency: 'aud',
    });
    
    // Test customer metadata
    const customerMetadata = buildCustomerMetadata({
      attendeeId: 'att_123',
      registrationId: 'reg_456',
      attendeeType: 'mason',
      isPrimary: true,
      masonType: 'master_mason',
      lodgeName: 'Lodge Unity No. 6',
      lodgeNumber: '6',
      grandLodge: 'NSW & ACT',
      masonicRank: 'Past Master',
      createdAt: new Date().toISOString()
    });
    
    // Test product metadata
    const productMetadata = buildProductMetadata({
      eventId: 'evt_123',
      eventSlug: 'grand-installation-2024',
      organisationId: 'org_123',
      eventStart: new Date('2024-12-01T18:00:00Z'),
      eventEnd: new Date('2024-12-01T23:00:00Z'),
      maxAttendees: 500,
      isMultiDay: false,
      isPublished: true,
      isFeatured: true
    });
    
    // Test price metadata
    const priceMetadata = buildPriceMetadata({
      ticketId: 'tkt_123',
      ticketType: 'standard',
      eventId: 'evt_123',
      includesMeal: true,
      maxQuantity: 10
    });
    
    return NextResponse.json({
      success: true,
      metadata: {
        paymentIntent: {
          keys: Object.keys(paymentMetadata).length,
          size: JSON.stringify(paymentMetadata).length,
          data: paymentMetadata
        },
        customer: {
          keys: Object.keys(customerMetadata).length,
          size: JSON.stringify(customerMetadata).length,
          data: customerMetadata
        },
        product: {
          keys: Object.keys(productMetadata).length,
          size: JSON.stringify(productMetadata).length,
          data: productMetadata
        },
        price: {
          keys: Object.keys(priceMetadata).length,
          size: JSON.stringify(priceMetadata).length,
          data: priceMetadata
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message || 'Failed to test metadata'
    }, { status: 500 });
  }
}