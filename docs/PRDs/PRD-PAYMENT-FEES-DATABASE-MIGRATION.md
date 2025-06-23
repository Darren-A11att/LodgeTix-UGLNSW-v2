# PRD: Payment Gateway Database Migration

## Overview
Migrate payment fee configuration from environment variables to a database-driven system for better maintainability, flexibility, and clarity.

## Current State
- Payment fees are configured via environment variables
- Mixed naming conventions (square vs SQUARE, stripe vs STRIPE)
- Complex fallback logic between Square and Stripe variables
- Percentages stored as decimals (0.02 instead of 2.00%)
- Convoluted and difficult to maintain

## Objectives
1. Create a centralized `payment_fees` database table
2. Remove all payment fee environment variables
3. Simplify fee calculation logic
4. Support multiple payment gateways with clear configuration
5. Enable runtime fee adjustments without deployment

## Requirements

### Database Schema
Create table `payment_gateway` with columns:
- `payment_gateway_id`: SERIAL (auto-generated)
- `payment_gateway_uuid`: UUID (auto-generated)
- `payment_gateway`: TEXT ('square' or 'stripe')
- `fee_mode`: TEXT ('pass_on' or 'absorb')
- `domestic_card_percentage`: NUMERIC(4,2) (stored as percentage, e.g., 2.20 for 2.20%)
- `domestic_card_fixed`: NUMERIC (fixed fee in dollars, e.g., 0.30)
- `international_card_percentage`: NUMERIC(4,2) (percentage format)
- `international_card_fixed`: NUMERIC (fixed fee in dollars)
- `platform_fee_percentage`: NUMERIC(4,2) (percentage format)
- `platform_fee_min`: NUMERIC (minimum platform fee in dollars)
- `platform_fee_cap`: NUMERIC (maximum platform fee in dollars)
- `is_active`: BOOLEAN (TRUE, FALSE, or NULL)
- `created_on`: TIMESTAMP (auto-generated on creation)
- `enabled_on`: TIMESTAMP (when is_active set to TRUE)
- `disabled_on`: TIMESTAMP (when is_active set to FALSE)

### Business Logic
1. Only one row with is_active = TRUE at any time (global configuration)
2. When no active configuration exists, default to zero fees (absorb mode)
3. Percentage values stored in human-readable format (2.20% stored as 2.20)
4. All monetary values in dollars (not cents)
5. Fee calculator uses values from active row, doesn't care about gateway type
6. Always fetch fresh from database when calculating fees

### Migration Strategy
1. Create new database table with current Square configuration as seed data
2. Create service to fetch active configuration (single row where is_active = TRUE)
3. Update square-fee-calculator.ts to use database values
4. Update payment gateway selection to use database instead of env vars
5. Remove all fee-related environment variables
6. Update all references to use new system

## Success Criteria
1. All payment fee configuration stored in database
2. No environment variables for payment fees
3. Consistent naming (lowercase 'square', 'stripe')
4. Zero-fee fallback when no configuration exists
5. All existing functionality maintained
6. Tests pass for all fee calculation scenarios

## Out of Scope
- Changing the actual fee calculation formulas
- Modifying payment processing flow
- Historical fee tracking or versioning