#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { DATABASE_FIELD_MAPPINGS, DATABASE_TABLE_MAPPINGS, DATABASE_ENUM_MAPPINGS } from '../lib/database-mappings';

// Generate TypeScript helper functions and types for field mappings

function generateHelpers() {
  const output = `// Auto-generated field mapping helpers
// Generated on: ${new Date().toISOString()}

import { DATABASE_FIELD_MAPPINGS, DATABASE_TABLE_MAPPINGS, DATABASE_ENUM_MAPPINGS } from './database-mappings';

// Type for camelCase field names
export type CamelCaseFields = keyof typeof DATABASE_FIELD_MAPPINGS;

// Type for snake_case field names
export type SnakeCaseFields = typeof DATABASE_FIELD_MAPPINGS[CamelCaseFields];

// Type for camelCase table names
export type CamelCaseTables = keyof typeof DATABASE_TABLE_MAPPINGS;

// Type for snake_case table names
export type SnakeCaseTables = typeof DATABASE_TABLE_MAPPINGS[CamelCaseTables];

// Type for PascalCase enum values
export type PascalCaseEnums = keyof typeof DATABASE_ENUM_MAPPINGS;

// Type for snake_case enum values
export type SnakeCaseEnums = typeof DATABASE_ENUM_MAPPINGS[PascalCaseEnums];

/**
 * Convert a camelCase field name to snake_case
 */
export function toSnakeCase(field: CamelCaseFields): SnakeCaseFields {
  return DATABASE_FIELD_MAPPINGS[field];
}

/**
 * Convert a snake_case field name to camelCase
 */
export function toCamelCase(field: SnakeCaseFields): CamelCaseFields | undefined {
  const entry = Object.entries(DATABASE_FIELD_MAPPINGS).find(([_, snake]) => snake === field);
  return entry ? entry[0] as CamelCaseFields : undefined;
}

/**
 * Convert an object with camelCase keys to snake_case keys
 */
export function toSnakeCaseObject<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = DATABASE_FIELD_MAPPINGS[key as CamelCaseFields] || key;
    result[snakeKey] = value;
  }
  
  return result;
}

/**
 * Convert an object with snake_case keys to camelCase keys
 */
export function toCamelCaseObject<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = toCamelCase(key as SnakeCaseFields) || key;
    result[camelKey] = value;
  }
  
  return result;
}

/**
 * Type-safe field name mapper for TypeScript
 */
export type FieldMapper<T> = {
  [K in keyof T as K extends CamelCaseFields ? SnakeCaseFields : K]: T[K];
};

/**
 * Reverse field name mapper for TypeScript
 */
export type ReverseFieldMapper<T> = {
  [K in keyof T as K extends SnakeCaseFields ? CamelCaseFields : K]: T[K];
};

/**
 * Get the snake_case version of a table name
 */
export function getTableName(camelCase: CamelCaseTables): SnakeCaseTables {
  return DATABASE_TABLE_MAPPINGS[camelCase];
}

/**
 * Get the snake_case version of an enum value
 */
export function getEnumValue(pascalCase: PascalCaseEnums): SnakeCaseEnums {
  return DATABASE_ENUM_MAPPINGS[pascalCase];
}

// Field groups for common entities
export const CONTACT_FIELDS = {
  contactId: 'contact_id',
  firstName: 'first_name',
  lastName: 'last_name',
  email: 'email',
  mobileNumber: 'mobile_number',
  addressLine1: 'address_line_1',
  addressLine2: 'address_line_2',
  suburbCity: 'suburb_city',
  state: 'state',
  country: 'country',
  postcode: 'postcode',
  dietaryRequirements: 'dietary_requirements',
  specialNeeds: 'special_needs'
} as const;

export const EVENT_FIELDS = {
  eventId: 'event_id',
  name: 'name',
  description: 'description',
  startDateTime: 'start_date_time',
  endDateTime: 'end_date_time',
  location: 'location',
  status: 'status',
  visibility: 'visibility'
} as const;

export const REGISTRATION_FIELDS = {
  registrationId: 'registration_id',
  primaryContactId: 'primary_contact_id',
  registrationType: 'registration_type',
  totalAmount: 'total_amount',
  paymentStatus: 'payment_status'
} as const;

export const TICKET_FIELDS = {
  ticketId: 'ticket_id',
  eventTicketId: 'event_ticket_id',
  serialNumber: 'serial_number',
  ticketCost: 'ticket_cost',
  amountPaid: 'amount_paid',
  ticketHolderId: 'ticket_holder_id'
} as const;

// Example usage types
export interface CamelCaseContact {
  contactId: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface SnakeCaseContact {
  contact_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

// Type assertion helpers
export function assertSnakeCase<T>(obj: T): FieldMapper<T> {
  return toSnakeCaseObject(obj) as FieldMapper<T>;
}

export function assertCamelCase<T>(obj: T): ReverseFieldMapper<T> {
  return toCamelCaseObject(obj) as ReverseFieldMapper<T>;
}
`;

  return output;
}

function main() {
  const outputPath = path.join(process.cwd(), 'lib', 'database-field-helpers.ts');
  
  console.log('Generating Field Helpers');
  console.log('=======================');
  console.log(`Output: ${outputPath}\n`);
  
  const helpers = generateHelpers();
  
  fs.writeFileSync(outputPath, helpers, 'utf8');
  
  console.log('✅ Successfully generated field helpers!');
  console.log('\nYou can now import and use these helpers:');
  console.log(`  import { toSnakeCase, toCamelCase, toSnakeCaseObject } from './lib/database-field-helpers';`);
  console.log('\nExample usage:');
  console.log(`  const dbField = toSnakeCase('firstName'); // returns 'first_name'`);
  console.log(`  const codeField = toCamelCase('first_name'); // returns 'firstName'`);
}

main();