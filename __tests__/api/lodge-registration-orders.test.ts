import { POST } from '@/app/api/functions/[functionId]/packages/[packageId]/lodge-registration/route';
import { createClient } from '@/utils/supabase/server';
import { SquareOrdersService } from '@/lib/services/square-orders-service';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/utils/supabase/server');
jest.mock('@/lib/services/square-orders-service');

describe('Lodge Registration API - Square Orders Integration', () => {
  let mockSupabase: any;
  let mockSquareOrdersService: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock Supabase client
    mockSupabase = {
      auth: {
        getSession: jest.fn().mockResolvedValue({ data: { session: { user: { id: 'user123' } } } })
      },
      from: jest.fn(() => ({
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { 
            catalog_object_id: 'CATALOG_123',
            quantity: 10,
            name: 'Lodge Table Package',
            price: 1950
          }, 
          error: null 
        })
      })),
      rpc: jest.fn()
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    // Mock Square Orders Service
    mockSquareOrdersService = {
      createCustomer: jest.fn(),
      createLodgeOrder: jest.fn(),
      payOrder: jest.fn(),
      updateOrderMetadata: jest.fn()
    };

    (SquareOrdersService as jest.Mock).mockImplementation(() => mockSquareOrdersService);
  });

  const createMockRequest = (body: any) => {
    return {
      json: jest.fn().mockResolvedValue(body),
      headers: new Headers({ 'content-type': 'application/json' })
    } as unknown as NextRequest;
  };

  const mockContext = {
    params: Promise.resolve({
      functionId: 'func-123',
      packageId: 'pkg-123'
    })
  };

  it('should create customer, order, and process payment successfully', async () => {
    const requestBody = {
      packageQuantity: 2, // User selects 2 packages
      bookingContact: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@lodge.org',
        mobile: '+61412345678',
        addressLine1: '123 Lodge St',
        suburb: 'Sydney',
        stateTerritory: 'NSW',
        postcode: '2000'
      },
      lodgeDetails: {
        grand_lodge_id: 'gl-123',
        lodge_id: 'l-123',
        lodgeName: 'Sydney Lodge No. 1'
      },
      paymentMethodId: 'cnon:card-nonce-123',
      amount: 390000, // Total in cents
      subtotal: 390000,
      squareFee: 0,
      billingDetails: {}
    };

    // Mock successful responses
    mockSquareOrdersService.createCustomer.mockResolvedValue({
      customerId: 'CUSTOMER_123',
      customer: { id: 'CUSTOMER_123' }
    });

    mockSquareOrdersService.createLodgeOrder.mockResolvedValue({
      orderId: 'ORDER_123',
      order: { 
        id: 'ORDER_123',
        totalMoney: { amount: 390000, currency: 'AUD' }
      }
    });

    mockSquareOrdersService.payOrder.mockResolvedValue({
      orderId: 'ORDER_123',
      paymentId: 'PAYMENT_123',
      order: { id: 'ORDER_123', state: 'COMPLETED' }
    });

    mockSupabase.rpc.mockResolvedValue({
      data: {
        registrationId: 'REG_123',
        confirmationNumber: 'LDG-123456'
      },
      error: null
    });

    mockSquareOrdersService.updateOrderMetadata.mockResolvedValue({
      orderId: 'ORDER_123'
    });

    const request = createMockRequest(requestBody);
    const response = await POST(request, mockContext);
    const responseData = await response.json();

    // Verify customer creation
    expect(mockSquareOrdersService.createCustomer).toHaveBeenCalledWith({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@lodge.org',
      mobile: '+61412345678',
      addressLine1: '123 Lodge St',
      city: 'Sydney',
      state: 'NSW',
      postcode: '2000',
      country: 'Australia'
    });

    // Verify order creation
    expect(mockSquareOrdersService.createLodgeOrder).toHaveBeenCalledWith({
      customerId: 'CUSTOMER_123',
      locationId: expect.any(String),
      packages: [{
        packageId: 'pkg-123',
        catalogObjectId: 'CATALOG_123',
        packageQuantity: 2,
        itemQuantity: 10,
        price: 1950,
        name: 'Lodge Table Package'
      }],
      metadata: expect.objectContaining({
        functionId: 'func-123',
        lodgeName: 'Sydney Lodge No. 1',
        registrationType: 'lodge'
      })
    });

    // Verify payment
    expect(mockSquareOrdersService.payOrder).toHaveBeenCalledWith({
      orderId: 'ORDER_123',
      paymentMethodId: 'cnon:card-nonce-123',
      amount: 3900,
      billingDetails: expect.any(Object)
    });

    // Verify database registration
    expect(mockSupabase.rpc).toHaveBeenCalledWith('upsert_lodge_registration', expect.objectContaining({
      p_function_id: 'func-123',
      p_package_id: 'pkg-123',
      p_square_order_id: 'ORDER_123',
      p_square_payment_id: 'PAYMENT_123',
      p_square_customer_id: 'CUSTOMER_123'
    }));

    // Verify response
    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.registrationId).toBe('REG_123');
    expect(responseData.confirmationNumber).toBe('LDG-123456');
  });

  it('should handle inventory unavailable error', async () => {
    const requestBody = {
      packageQuantity: 10,
      bookingContact: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@lodge.org'
      },
      lodgeDetails: {
        lodgeName: 'Sydney Lodge'
      },
      paymentMethodId: 'nonce-123'
    };

    mockSquareOrdersService.createCustomer.mockResolvedValue({
      customerId: 'CUSTOMER_123'
    });

    mockSquareOrdersService.createLodgeOrder.mockRejectedValue(
      new Error('Insufficient inventory: Lodge Table Package is sold out')
    );

    const request = createMockRequest(requestBody);
    const response = await POST(request, mockContext);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.success).toBe(false);
    expect(responseData.error).toContain('sold out');
    expect(responseData.errorType).toBe('INVENTORY_UNAVAILABLE');
  });

  it('should handle missing catalog_object_id', async () => {
    // Mock package without catalog_object_id
    mockSupabase.from().single.mockResolvedValue({
      data: {
        catalog_object_id: null, // Missing
        quantity: 10,
        name: 'Lodge Table Package',
        price: 1950
      },
      error: null
    });

    const requestBody = {
      packageQuantity: 1,
      bookingContact: { firstName: 'John', lastName: 'Doe', email: 'john@lodge.org' },
      lodgeDetails: { lodgeName: 'Sydney Lodge' },
      paymentMethodId: 'nonce-123'
    };

    const request = createMockRequest(requestBody);
    const response = await POST(request, mockContext);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.success).toBe(false);
    expect(responseData.error).toContain('Package not configured for online sales');
  });

  it('should validate required fields', async () => {
    const requestBody = {
      // Missing required fields
      lodgeDetails: { lodgeName: 'Sydney Lodge' }
    };

    const request = createMockRequest(requestBody);
    const response = await POST(request, mockContext);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.success).toBe(false);
    expect(responseData.error).toContain('Missing required fields');
  });

  it('should handle Square API errors gracefully', async () => {
    const requestBody = {
      packageQuantity: 1,
      bookingContact: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@lodge.org'
      },
      lodgeDetails: {
        lodgeName: 'Sydney Lodge'
      },
      paymentMethodId: 'nonce-123',
      amount: 195000,
      subtotal: 195000
    };

    mockSquareOrdersService.createCustomer.mockResolvedValue({
      customerId: 'CUSTOMER_123'
    });

    mockSquareOrdersService.createLodgeOrder.mockResolvedValue({
      orderId: 'ORDER_123'
    });

    mockSquareOrdersService.payOrder.mockRejectedValue(
      new Error('Card declined')
    );

    const request = createMockRequest(requestBody);
    const response = await POST(request, mockContext);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.success).toBe(false);
    expect(responseData.error).toContain('Payment failed');
    
    // Should not create registration if payment fails
    expect(mockSupabase.rpc).not.toHaveBeenCalled();
  });

  it('should include all lodge metadata in order', async () => {
    const requestBody = {
      packageQuantity: 1,
      bookingContact: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@lodge.org',
        mobile: '+61412345678'
      },
      lodgeDetails: {
        grand_lodge_id: 'gl-123',
        lodge_id: 'l-123',
        lodgeName: 'Sydney Lodge No. 1'
      },
      paymentMethodId: 'nonce-123',
      amount: 195000,
      additionalMetadata: {
        specialRequirements: 'Dietary requirements: Vegetarian',
        notes: 'Celebrating 150th anniversary'
      }
    };

    mockSquareOrdersService.createCustomer.mockResolvedValue({
      customerId: 'CUSTOMER_123'
    });

    mockSquareOrdersService.createLodgeOrder.mockResolvedValue({
      orderId: 'ORDER_123'
    });

    const request = createMockRequest(requestBody);
    await POST(request, mockContext);

    // Verify all metadata is passed to order creation
    expect(mockSquareOrdersService.createLodgeOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          grandLodgeId: 'gl-123',
          lodgeId: 'l-123',
          lodgeName: 'Sydney Lodge No. 1',
          contactName: 'John Doe',
          contactEmail: 'john@lodge.org',
          contactPhone: '+61412345678',
          specialRequirements: 'Dietary requirements: Vegetarian',
          notes: 'Celebrating 150th anniversary'
        })
      })
    );
  });
});