import { 
  getSquareClient, 
  generateIdempotencyKey, 
  convertToCents,
  getSquareLocationId 
} from '@/lib/utils/square-client';
import { createGSTOrderTax } from '@/lib/constants/sales-tax';
import { ApiError } from 'square';

export interface LodgeContactDetails {
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

export interface PackageLineItem {
  packageId: string;
  catalogObjectId: string | null;  // This should be the variation ID, not item ID
  packageQuantity: number;  // Number of packages selected by user
  itemQuantity: number;     // Number of items per package
  price: number;           // Price per package in dollars
  name: string;
}

export interface CreateLodgeOrderData {
  customerId: string;
  locationId: string;
  packages: PackageLineItem[];
  metadata: Record<string, any>;
  processingFee?: number; // Processing fee in dollars
}

export interface PayOrderData {
  orderId: string;
  paymentMethodId: string;
  amount: number; // in dollars
  billingDetails?: any;
}

export class SquareOrdersService {
  private client: any;

  constructor() {
    this.client = getSquareClient();
  }

  /**
   * Create a Square customer for lodge registration
   */
  async createCustomer(contact: LodgeContactDetails) {
    try {
      const request = {
        givenName: contact.firstName,
        familyName: contact.lastName,
        emailAddress: contact.email,
        phoneNumber: contact.mobile,
        address: contact.addressLine1 ? {
          addressLine1: contact.addressLine1,
          locality: contact.city || '',
          administrativeDistrictLevel1: contact.state || '',
          postalCode: contact.postcode || '',
          country: contact.country === 'Australia' ? 'AU' : (contact.country || 'AU')
        } : undefined,
        idempotencyKey: generateIdempotencyKey()
      };

      console.log('[Square Orders] Creating customer:', { 
        email: contact.email,
        name: `${contact.firstName} ${contact.lastName}`
      });

      const response = await this.client.customersApi.createCustomer(request);

      if (!response.result.customer) {
        throw new Error('Failed to create customer - no customer returned');
      }

      return {
        customerId: response.result.customer.id,
        customer: response.result.customer
      };
    } catch (error) {
      console.error('[Square Orders] Customer creation error:', error);
      throw new Error(`Failed to create Square customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a Square order for lodge registration
   */
  async createLodgeOrder(orderData: CreateLodgeOrderData) {
    try {
      const { customerId, locationId, packages, metadata, processingFee } = orderData;

      // Separate packages with and without catalog IDs
      const catalogPackages = packages.filter(pkg => pkg.catalogObjectId);
      const adhocPackages = packages.filter(pkg => !pkg.catalogObjectId);

      // Check inventory only for catalog items
      if (catalogPackages.length > 0) {
        await this.checkInventoryAvailability(catalogPackages);
      }

      // Build line items - handle both catalog and ad-hoc items
      const lineItems = packages.map(pkg => {
        const totalQuantity = pkg.packageQuantity * pkg.itemQuantity;
        // Calculate price per individual item (not per package)
        const pricePerItem = pkg.price / pkg.itemQuantity; // pkg.price is per package, divide by items per package
        
        console.log('[Square Orders] Line item calculation:', {
          packageName: pkg.name,
          packagePrice: pkg.price,
          itemQuantity: pkg.itemQuantity,
          packageQuantity: pkg.packageQuantity,
          pricePerItem: pricePerItem,
          pricePerItemInCents: convertToCents(pricePerItem),
          totalQuantity: totalQuantity
        });
        
        if (pkg.catalogObjectId) {
          // Catalog item - catalogObjectId should be the variation ID
          return {
            catalogObjectId: pkg.catalogObjectId, // This is the variation ID
            quantity: totalQuantity.toString(),
            basePriceMoney: {
              amount: BigInt(convertToCents(pricePerItem)), // Price per individual item
              currency: 'AUD'
            },
            note: `${pkg.name} (${pkg.packageQuantity} packages × ${pkg.itemQuantity} items)`,
            uid: generateIdempotencyKey()
          };
        } else {
          // Ad-hoc item
          return {
            name: pkg.name,
            quantity: totalQuantity.toString(),
            basePriceMoney: {
              amount: BigInt(convertToCents(pricePerItem)), // Price per individual item
              currency: 'AUD'
            },
            note: `${pkg.name} (${pkg.packageQuantity} packages × ${pkg.itemQuantity} items)`,
            uid: generateIdempotencyKey()
          };
        }
      });

      // Create order with service charges if processing fee is provided
      const orderRequest: any = {
        order: {
          locationId: locationId || getSquareLocationId(),
          customerId,
          state: 'OPEN', // Create order in OPEN state for payment
          lineItems,
          metadata: {
            function_id: metadata.functionId,
            lodge_name: metadata.lodgeName,
            registration_type: metadata.registrationType,
            package_count: packages.reduce((sum, pkg) => sum + pkg.packageQuantity, 0).toString(),
            items_per_package: packages[0]?.itemQuantity.toString() || '1'
          }
        },
        idempotencyKey: generateIdempotencyKey()
      };

      // Add service charge for processing fee if provided
      if (processingFee && processingFee > 0) {
        orderRequest.order.serviceCharges = [
          {
            name: 'Processing Fee',
            amountMoney: {
              amount: BigInt(convertToCents(processingFee)),
              currency: 'AUD'
            },
            calculationPhase: 'SUBTOTAL_PHASE',
            taxable: false,
            uid: generateIdempotencyKey()
          }
        ];
      }

      // Add GST tax at order level
      try {
        const gstTax = createGSTOrderTax();
        orderRequest.order.taxes = [
          {
            catalogObjectId: gstTax.catalog_object_id,
            name: gstTax.name,
            // Note: Don't include percentage when using catalog_object_id - Square API will reject it
            inclusionType: gstTax.inclusion_type,
            scope: gstTax.scope,
            uid: generateIdempotencyKey()
          }
        ];
        
        console.log('[Square Orders] Added GST tax:', {
          catalogObjectId: gstTax.catalog_object_id,
          inclusionType: gstTax.inclusion_type,
          scope: gstTax.scope
        });
      } catch (error) {
        console.error('[Square Orders] Failed to add GST tax:', error);
        // Don't fail order creation if tax configuration fails
        // Tax will be handled by Square's default tax rules
      }

      console.log('[Square Orders] Creating order:', {
        customerId,
        lineItemCount: lineItems.length,
        processingFee: processingFee,
        totalItems: orderRequest.order.metadata.total_items,
        orderRequest: JSON.stringify(orderRequest.order, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value
        )
      });

      const response = await this.client.ordersApi.createOrder(orderRequest);

      if (!response.result.order) {
        throw new Error('Failed to create order - no order returned');
      }

      return {
        orderId: response.result.order.id,
        order: response.result.order
      };
    } catch (error) {
      console.error('[Square Orders] Order creation error:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('Insufficient inventory')) {
          throw error; // Re-throw inventory errors as-is
        }
        if (error.message.includes('Missing catalog object ID')) {
          throw error; // Re-throw validation errors as-is
        }
      }
      
      throw new Error(`Failed to create Square order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check inventory availability for all items
   */
  private async checkInventoryAvailability(packages: PackageLineItem[]) {
    for (const pkg of packages) {
      if (!pkg.catalogObjectId) continue;

      try {
        const response = await this.client.catalogApi.retrieveCatalogObject(
          pkg.catalogObjectId,
          true // includeRelatedObjects to get inventory
        );

        // Check if we have inventory information
        if (response.result?.relatedObjects) {
          const inventoryCount = response.result.relatedObjects.find(
            (obj: any) => obj.type === 'INVENTORY_COUNT'
          );

          if (inventoryCount) {
            const availableQuantity = parseInt(inventoryCount.inventoryCount?.quantity || '0');
            const requiredQuantity = pkg.packageQuantity * pkg.itemQuantity;

            if (availableQuantity < requiredQuantity) {
              throw new Error(`Insufficient inventory: ${pkg.name} is sold out`);
            }
          }
        }
        
        // Log successful catalog object retrieval
        console.log(`[Square Orders] Successfully retrieved catalog object ${pkg.catalogObjectId} for ${pkg.name}`);
      } catch (error) {
        // If it's already an inventory error, re-throw
        if (error instanceof Error && error.message.includes('Insufficient inventory')) {
          throw error;
        }
        // Log but don't fail on other catalog errors (item might not track inventory)
        console.warn(`[Square Orders] Could not check inventory for ${pkg.catalogObjectId}:`, error);
      }
    }
  }

  /**
   * Create a payment for a Square order
   */
  async createPayment(paymentData: PayOrderData) {
    try {
      const { orderId, paymentMethodId, amount } = paymentData;

      // Create payment using the payment token
      const request = {
        sourceId: paymentMethodId, // This is the payment token from Square Web Payments SDK
        idempotencyKey: generateIdempotencyKey(),
        amountMoney: {
          amount: BigInt(convertToCents(amount)),
          currency: 'AUD'
        },
        orderId: orderId,
        autocomplete: true // Automatically complete the payment
      };

      console.log('[Square Orders] Creating payment:', {
        orderId,
        amount,
        sourceId: paymentMethodId
      });

      const response = await this.client.paymentsApi.createPayment(request);

      if (!response.result.payment) {
        throw new Error('Failed to create payment - no payment returned');
      }

      return {
        orderId: orderId,
        paymentId: response.result.payment.id,
        payment: response.result.payment,
        status: response.result.payment.status
      };
    } catch (error) {
      console.error('[Square Orders] Payment error:', error);
      
      // Handle specific payment errors
      if (error instanceof ApiError) {
        const errorMessage = error.errors?.[0]?.detail || error.message;
        throw new Error(`Payment failed: ${errorMessage}`);
      }
      
      throw new Error(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Pay an order using a payment ID
   */
  async payOrder(orderId: string, paymentId: string) {
    try {
      const request = {
        idempotencyKey: generateIdempotencyKey(),
        paymentIds: [paymentId]
      };

      console.log('[Square Orders] Paying order with payment:', {
        orderId,
        paymentId
      });

      const response = await this.client.ordersApi.payOrder(orderId, request);

      if (!response.result.order) {
        throw new Error('Failed to pay order - no order returned');
      }

      return {
        orderId: response.result.order.id,
        order: response.result.order,
        state: response.result.order.state
      };
    } catch (error) {
      console.error('[Square Orders] Pay order error:', error);
      throw new Error(`Failed to pay order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update order metadata after registration
   */
  async updateOrderMetadata(data: { orderId: string; metadata: Record<string, string> }) {
    try {
      const { orderId, metadata } = data;

      // First, get the current order to get its version
      const currentOrder = await this.client.ordersApi.retrieveOrder(orderId);
      
      const request = {
        order: {
          version: currentOrder.result.order?.version,
          metadata: {
            ...currentOrder.result.order?.metadata,
            ...metadata
          }
        },
        idempotencyKey: generateIdempotencyKey()
      };

      console.log('[Square Orders] Updating order metadata:', {
        orderId,
        newMetadata: metadata
      });

      const response = await this.client.ordersApi.updateOrder(orderId, request);

      return {
        orderId: response.result.order?.id,
        order: response.result.order
      };
    } catch (error) {
      console.error('[Square Orders] Update metadata error:', error);
      // Non-critical error, log but don't throw
      return { orderId: data.orderId, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}