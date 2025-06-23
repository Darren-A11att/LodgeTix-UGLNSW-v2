import { 
  getGSTTaxId, 
  getGSTTaxConfig, 
  createGSTOrderTax 
} from '../sales-tax';

// Mock the payment configuration
vi.mock('@/lib/config/payment', () => ({
  getPaymentConfig: vi.fn(() => ({
    square: {
      environment: process.env.SQUARE_ENVIRONMENT || 'sandbox'
    }
  }))
}));

describe('Sales Tax Configuration', () => {
  beforeEach(() => {
    // Reset environment variables
    delete process.env.SQUARE_ENVIRONMENT;
  });

  describe('getGSTTaxId', () => {
    it('should return sandbox tax ID for sandbox environment', () => {
      process.env.SQUARE_ENVIRONMENT = 'sandbox';
      const taxId = getGSTTaxId();
      expect(taxId).toBe('AUSSALESTAXML72H9K6Z6HG2');
    });

    it('should return production tax ID for production environment', () => {
      process.env.SQUARE_ENVIRONMENT = 'production';
      const taxId = getGSTTaxId();
      expect(taxId).toBe('AUSSALESTAXMLW3GS6CJYJ05');
    });

    it('should default to sandbox tax ID when environment not set', () => {
      const taxId = getGSTTaxId();
      expect(taxId).toBe('AUSSALESTAXML72H9K6Z6HG2');
    });

    // Note: Error handling test would require more complex mocking
    // In practice, Square configuration should always be available when this service is used
  });

  describe('getGSTTaxConfig', () => {
    it('should return correct GST tax configuration', () => {
      process.env.SQUARE_ENVIRONMENT = 'sandbox';
      const config = getGSTTaxConfig();
      
      expect(config).toEqual({
        catalogObjectId: 'AUSSALESTAXML72H9K6Z6HG2',
        name: 'GST',
        percentage: '10.0',
        inclusionType: 'INCLUSIVE',
        scope: 'ORDER'
      });
    });
  });

  describe('createGSTOrderTax', () => {
    it('should create correctly formatted Square order tax object', () => {
      process.env.SQUARE_ENVIRONMENT = 'production';
      const orderTax = createGSTOrderTax();
      
      expect(orderTax).toEqual({
        catalog_object_id: 'AUSSALESTAXMLW3GS6CJYJ05',
        name: 'GST',
        inclusion_type: 'INCLUSIVE',
        scope: 'ORDER'
      });
      
      // Ensure percentage is not included when using catalog_object_id
      expect(orderTax).not.toHaveProperty('percentage');
    });

    it('should use snake_case for Square API compatibility', () => {
      const orderTax = createGSTOrderTax();
      
      // Verify all properties use snake_case as required by Square API
      expect(orderTax).toHaveProperty('catalog_object_id');
      expect(orderTax).toHaveProperty('inclusion_type');
      expect(orderTax).not.toHaveProperty('catalogObjectId');
      expect(orderTax).not.toHaveProperty('inclusionType');
    });
  });
});