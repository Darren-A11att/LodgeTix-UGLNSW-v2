import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SquareOrdersService } from '@/lib/services/square-orders-service';
import { Client } from 'square';

// Mock Square SDK
vi.mock('square');
vi.mock('@/lib/utils/square-client', () => ({
  getSquareClient: vi.fn(() => mockSquareClient),
  generateIdempotencyKey: vi.fn(() => 'test-idempotency-key'),
  convertToCents: vi.fn((amount) => Math.round(amount * 100)),
  getSquareLocationId: vi.fn(() => 'LOCATION_123')
}));

let mockSquareClient: any;

describe('SquareOrdersService', () => {
  let service: SquareOrdersService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSquareClient = {
      customersApi: {
        createCustomer: vi.fn()
      },
      ordersApi: {
        createOrder: vi.fn(),
        updateOrder: vi.fn(),
        payOrder: vi.fn(),
        retrieveOrder: vi.fn()
      },
      catalogApi: {
        retrieveCatalogObject: vi.fn()
      }
    };

    service = new SquareOrdersService();
  });

  describe('createCustomer', () => {
    it('should create a customer with lodge contact details', async () => {
      const lodgeContact = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@lodge.org',
        mobile: '+61412345678',
        addressLine1: '123 Lodge Street',
        city: 'Sydney',
        state: 'NSW',
        postcode: '2000',
        country: 'Australia'
      };

      const mockResponse = {
        result: {
          customer: {
            id: 'CUSTOMER_123',
            givenName: 'John',
            familyName: 'Doe',
            emailAddress: 'john.doe@lodge.org',
            phoneNumber: '+61412345678'
          }
        }
      };

      mockSquareClient.customersApi.createCustomer.mockResolvedValue(mockResponse);

      const result = await service.createCustomer(lodgeContact);

      expect(mockSquareClient.customersApi.createCustomer).toHaveBeenCalledWith({
        givenName: 'John',
        familyName: 'Doe',
        emailAddress: 'john.doe@lodge.org',
        phoneNumber: '+61412345678',
        address: {
          addressLine1: '123 Lodge Street',
          locality: 'Sydney',
          administrativeDistrictLevel1: 'NSW',
          postalCode: '2000',
          country: 'AU'
        },
        idempotencyKey: 'test-idempotency-key'
      });

      expect(result).toEqual({
        customerId: 'CUSTOMER_123',
        customer: mockResponse.result.customer
      });
    });

    it('should handle customer creation errors', async () => {
      mockSquareClient.customersApi.createCustomer.mockRejectedValue(
        new Error('Invalid phone number')
      );

      await expect(service.createCustomer({
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid@email',
        mobile: 'invalid'
      })).rejects.toThrow('Failed to create Square customer');
    });
  });

  describe('createLodgeOrder', () => {
    it('should create an order with correct line items', async () => {
      const orderData = {
        customerId: 'CUSTOMER_123',
        locationId: 'LOCATION_123',
        packages: [{
          packageId: 'PKG_123',
          catalogObjectId: 'CATALOG_123',
          packageQuantity: 2, // User selected 2 packages
          itemQuantity: 10,   // Each package contains 10 items
          price: 1950,        // Price per package
          name: 'Lodge Table Package'
        }],
        metadata: {
          functionId: 'FUNC_123',
          lodgeName: 'Sydney Lodge',
          registrationType: 'lodge'
        }
      };

      const mockInventoryResponse = {
        result: {
          counts: [{
            catalogObjectId: 'CATALOG_123',
            state: 'IN_STOCK',
            quantity: '100'
          }]
        }
      };

      const mockOrderResponse = {
        result: {
          order: {
            id: 'ORDER_123',
            lineItems: [{
              uid: 'LINE_ITEM_123',
              catalogObjectId: 'CATALOG_123',
              quantity: '20', // 2 packages × 10 items
              basePriceMoney: {
                amount: 195000, // $1950 in cents
                currency: 'AUD'
              }
            }],
            totalMoney: {
              amount: 390000, // $3900 total
              currency: 'AUD'
            }
          }
        }
      };

      mockSquareClient.catalogApi.retrieveCatalogObject.mockResolvedValue(mockInventoryResponse);
      mockSquareClient.ordersApi.createOrder.mockResolvedValue(mockOrderResponse);

      const result = await service.createLodgeOrder(orderData);

      // Verify inventory check
      expect(mockSquareClient.catalogApi.retrieveCatalogObject).toHaveBeenCalledWith(
        'CATALOG_123',
        true // includeRelatedObjects for inventory
      );

      // Verify order creation
      expect(mockSquareClient.ordersApi.createOrder).toHaveBeenCalledWith({
        order: {
          locationId: 'LOCATION_123',
          customerId: 'CUSTOMER_123',
          lineItems: [{
            catalogObjectId: 'CATALOG_123',
            quantity: '20', // Total quantity: 2 packages × 10 items each
            basePriceMoney: {
              amount: BigInt(195000), // Price per package in cents
              currency: 'AUD'
            },
            note: 'Lodge Table Package (2 packages × 10 items)',
            uid: 'test-idempotency-key'
          }],
          metadata: {
            function_id: 'FUNC_123',
            lodge_name: 'Sydney Lodge',
            registration_type: 'lodge',
            package_count: '2',
            items_per_package: '10'
          }
        },
        idempotencyKey: 'test-idempotency-key'
      });

      expect(result).toEqual({
        orderId: 'ORDER_123',
        order: mockOrderResponse.result.order
      });
    });

    it('should fail if inventory is insufficient', async () => {
      const orderData = {
        customerId: 'CUSTOMER_123',
        locationId: 'LOCATION_123',
        packages: [{
          packageId: 'PKG_123',
          catalogObjectId: 'CATALOG_123',
          packageQuantity: 5,
          itemQuantity: 10,
          price: 1950,
          name: 'Lodge Table Package'
        }],
        metadata: {}
      };

      const mockInventoryResponse = {
        result: {
          relatedObjects: [{
            type: 'INVENTORY_COUNT',
            inventoryCount: {
              quantity: '30' // Only 30 available, but need 50
            }
          }]
        }
      };

      mockSquareClient.catalogApi.retrieveCatalogObject.mockResolvedValue(mockInventoryResponse);

      await expect(service.createLodgeOrder(orderData))
        .rejects.toThrow('Insufficient inventory: Lodge Table Package is sold out');
    });

    it('should handle missing catalog object', async () => {
      const orderData = {
        customerId: 'CUSTOMER_123',
        locationId: 'LOCATION_123',
        packages: [{
          packageId: 'PKG_123',
          catalogObjectId: null, // Missing catalog object
          packageQuantity: 1,
          itemQuantity: 10,
          price: 1950,
          name: 'Lodge Table Package'
        }],
        metadata: {}
      };

      await expect(service.createLodgeOrder(orderData))
        .rejects.toThrow('Missing catalog object ID for package: Lodge Table Package');
    });
  });

  describe('payOrder', () => {
    it('should process payment for an order', async () => {
      const paymentData = {
        orderId: 'ORDER_123',
        paymentMethodId: 'cnon:card-nonce-123',
        amount: 3900, // $39.00
        billingDetails: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@lodge.org'
        }
      };

      // Mock create payment response
      const mockPaymentResponse = {
        result: {
          payment: {
            id: 'PAYMENT_123',
            status: 'COMPLETED',
            amountMoney: {
              amount: 390000,
              currency: 'AUD'
            },
            orderId: 'ORDER_123'
          }
        }
      };

      // Mock pay order response
      const mockPayOrderResponse = {
        result: {
          order: {
            id: 'ORDER_123',
            state: 'COMPLETED',
            totalMoney: {
              amount: 390000,
              currency: 'AUD'
            }
          }
        }
      };

      // Note: In the actual implementation, we'll create the payment with the order reference
      // then use the pay order endpoint
      mockSquareClient.ordersApi.payOrder.mockResolvedValue(mockPayOrderResponse);

      const result = await service.payOrder(paymentData);

      expect(mockSquareClient.ordersApi.payOrder).toHaveBeenCalledWith(
        'ORDER_123',
        {
          paymentIds: [paymentData.paymentMethodId],
          idempotencyKey: 'test-idempotency-key'
        }
      );

      expect(result).toEqual({
        orderId: 'ORDER_123',
        paymentId: paymentData.paymentMethodId,
        order: mockPayOrderResponse.result.order
      });
    });

    it('should handle payment failures', async () => {
      mockSquareClient.ordersApi.payOrder.mockRejectedValue(
        new Error('Card declined')
      );

      await expect(service.payOrder({
        orderId: 'ORDER_123',
        paymentMethodId: 'invalid-nonce',
        amount: 1000
      })).rejects.toThrow('Payment failed');
    });
  });

  describe('updateOrderMetadata', () => {
    it('should update order with additional metadata', async () => {
      const updateData = {
        orderId: 'ORDER_123',
        metadata: {
          confirmation_number: 'LDG-123456',
          registration_id: 'REG_123'
        }
      };

      // Mock retrieve order response
      const mockRetrieveResponse = {
        result: {
          order: {
            id: 'ORDER_123',
            version: 1,
            metadata: {}
          }
        }
      };

      const mockUpdateResponse = {
        result: {
          order: {
            id: 'ORDER_123',
            metadata: {
              confirmation_number: 'LDG-123456',
              registration_id: 'REG_123'
            }
          }
        }
      };

      mockSquareClient.ordersApi.retrieveOrder.mockResolvedValue(mockRetrieveResponse);
      mockSquareClient.ordersApi.updateOrder.mockResolvedValue(mockUpdateResponse);

      const result = await service.updateOrderMetadata(updateData);

      expect(mockSquareClient.ordersApi.updateOrder).toHaveBeenCalledWith(
        'ORDER_123',
        {
          order: {
            version: 1,
            metadata: {
              confirmation_number: 'LDG-123456',
              registration_id: 'REG_123'
            }
          },
          idempotencyKey: 'test-idempotency-key'
        }
      );

      expect(result).toEqual({
        orderId: 'ORDER_123',
        order: mockUpdateResponse.result.order
      });
    });
  });
});