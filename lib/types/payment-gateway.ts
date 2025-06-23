/**
 * Payment Gateway Configuration Types
 * Database-driven payment fee configuration system
 */

export interface PaymentGatewayConfig {
  payment_gateway_id: number;
  payment_gateway_uuid: string;
  payment_gateway: 'square' | 'stripe';
  fee_mode: 'pass_on' | 'absorb';
  domestic_card_percentage: number; // Stored as 2.20 for 2.20%
  domestic_card_fixed: number; // Fixed fee in dollars
  international_card_percentage: number; // Stored as 2.20 for 2.20%
  international_card_fixed: number; // Fixed fee in dollars
  platform_fee_percentage: number; // Stored as 2.00 for 2.00%
  platform_fee_min: number; // Minimum platform fee in dollars
  platform_fee_cap: number; // Maximum platform fee in dollars
  is_active: boolean | null;
  created_on: string; // ISO timestamp
  enabled_on: string | null; // ISO timestamp
  disabled_on: string | null; // ISO timestamp
}

export interface FeeCalculationValues {
  fee_mode: 'pass_on' | 'absorb';
  domestic_card_percentage: number; // Converted to decimal (0.022 for 2.2%)
  domestic_card_fixed: number;
  international_card_percentage: number; // Converted to decimal
  international_card_fixed: number;
  platform_fee_percentage: number; // Converted to decimal
  platform_fee_min: number;
  platform_fee_cap: number;
}

export type PaymentGatewayName = 'square' | 'stripe';