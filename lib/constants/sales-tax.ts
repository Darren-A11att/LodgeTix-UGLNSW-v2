/**
 * Square Sales Tax Configuration
 * Environment-based GST tax catalog object IDs for Square orders
 */

import { getPaymentConfig } from '@/lib/config/payment';

// GST Tax Catalog IDs by environment
const GST_TAX_IDS = {
  sandbox: 'AUSSALESTAXML72H9K6Z6HG2',
  production: 'AUSSALESTAXMLW3GS6CJYJ05',
} as const;

/**
 * Get the appropriate GST tax catalog ID based on Square environment
 */
export function getGSTTaxId(): string {
  const config = getPaymentConfig();
  
  if (!config.square) {
    throw new Error('Square configuration is not available');
  }

  const environment = config.square.environment;
  return GST_TAX_IDS[environment];
}

/**
 * GST Tax configuration object for Square orders
 * Applies 10% inclusive GST tax at order level
 */
export interface GSTTaxConfig {
  catalogObjectId: string;
  name: string;
  percentage: string;
  inclusionType: 'INCLUSIVE' | 'ADDITIVE';
  scope: 'ORDER' | 'LINE_ITEM';
}

/**
 * Get GST tax configuration for Square orders
 */
export function getGSTTaxConfig(): GSTTaxConfig {
  return {
    catalogObjectId: getGSTTaxId(),
    name: 'GST',
    percentage: '10.0',
    inclusionType: 'INCLUSIVE',
    scope: 'ORDER',
  };
}

/**
 * Create Square order tax object for GST
 * Used when creating orders with Square Orders API
 * Note: When using catalog_object_id, Square API doesn't allow percentage to be specified
 */
export function createGSTOrderTax() {
  const config = getGSTTaxConfig();
  
  return {
    catalog_object_id: config.catalogObjectId,
    name: config.name,
    // Don't include percentage when using catalog_object_id - Square will use the catalog definition
    inclusion_type: config.inclusionType,
    scope: config.scope,
  };
}