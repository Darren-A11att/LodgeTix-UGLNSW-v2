/**
 * Supabase Naming Convention Adapter
 * 
 * This utility provides adapters to handle the transition between different naming
 * conventions in the Supabase database and application code. It allows the application
 * to work with both the old PascalCase/camelCase and new snake_case naming conventions.
 */

import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/shared/types/database';

// Table name mapping (PascalCase to snake_case)
export const tableNameMap: Record<string, string> = {
  'AttendeeEvents': 'attendee_events',
  'Attendees': 'attendees',
  'Customers': 'customers',
  'Events': 'events',
  'EventTickets': 'event_tickets',
  'GrandLodges': 'grand_lodges',
  'Lodges': 'lodges',
  'registrations': 'registrations',
  'tickets': 'tickets',
  'TicketTypes': 'ticket_types',
};

// Column name mapping (camelCase to snake_case)
// This is not an exhaustive list, just common columns that might be used in queries
export const columnNameMap: Record<string, string> = {
  // Common fields
  'id': 'id', // No change needed
  'createdAt': 'created_at',
  'updatedAt': 'updated_at',
  
  // Event fields
  'eventId': 'event_id',
  'eventName': 'event_name',
  'eventDate': 'event_date',
  'eventLocation': 'event_location',
  'eventDescription': 'event_description',
  'eventStatus': 'event_status',
  'eventType': 'event_type',
  'eventCapacity': 'event_capacity',
  'isFeatured': 'is_featured',
  'eventSlug': 'event_slug',
  
  // Attendee fields
  'attendeeId': 'attendee_id',
  'firstName': 'first_name',
  'lastName': 'last_name',
  'emailAddress': 'email_address',
  'phoneNumber': 'phone_number',
  'registrationId': 'registration_id',
  'hasPartner': 'has_partner',
  'partnerFirstName': 'partner_first_name',
  'partnerLastName': 'partner_last_name',
  'partnerEmailAddress': 'partner_email_address',
  'partnerPhoneNumber': 'partner_phone_number',
  'partnerRelationship': 'partner_relationship',
  'dietaryRequirements': 'dietary_requirements',
  
  // Lodge fields
  'lodgeId': 'lodge_id',
  'lodgeName': 'lodge_name',
  'lodgeNumber': 'lodge_number',
  'grandLodgeId': 'grand_lodge_id',
  'grandLodgeName': 'grand_lodge_name',
  'isGrandOfficer': 'is_grand_officer',
  'grandRank': 'grand_rank',
  
  // Registration fields
  'registrationType': 'registration_type',
  'customerId': 'customer_id',
  'registrationStatus': 'registration_status',
  'paymentAmount': 'payment_amount',
  'paymentStatus': 'payment_status',
  'paymentIntentId': 'payment_intent_id',
  'billingName': 'billing_name',
  'billingEmail': 'billing_email',
  'billingStreet': 'billing_street',
  'billingCity': 'billing_city',
  'billingState': 'billing_state',
  'billingZip': 'billing_zip',
  'billingCountry': 'billing_country',
  
  // Ticket fields
  'ticketTypeId': 'ticket_type_id',
  'ticketPrice': 'ticket_price',
  'ticketStatus': 'ticket_status',
  'ticketQuantity': 'ticket_quantity',
  'ticketName': 'ticket_name',
  'ticketDescription': 'ticket_description',
  'isPartnerTicket': 'is_partner_ticket',
};

/**
 * Converts a camelCase or PascalCase string to snake_case
 * @param str The string to convert
 * @returns The snake_case version of the string
 */
export function toSnakeCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

/**
 * Converts a snake_case string to camelCase
 * @param str The string to convert
 * @returns The camelCase version of the string
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Converts object keys from camelCase to snake_case
 * @param obj The object to convert
 * @returns A new object with snake_case keys
 */
export function objectToSnakeCase<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = columnNameMap[key] || toSnakeCase(key);
      result[snakeKey] = obj[key];
    }
  }
  return result;
}

/**
 * Converts object keys from snake_case to camelCase
 * @param obj The object to convert
 * @returns A new object with camelCase keys
 */
export function objectToCamelCase<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = toCamelCase(key);
      result[camelKey] = obj[key];
    }
  }
  return result;
}

/**
 * Gets the snake_case table name for a given PascalCase table name
 * @param pascalCaseTableName The PascalCase table name
 * @returns The snake_case table name
 */
export function getTableName(pascalCaseTableName: string): string {
  return tableNameMap[pascalCaseTableName] || toSnakeCase(pascalCaseTableName);
}

/**
 * Creates an adapted Supabase client that handles the naming convention transition
 * @param supabaseUrl The Supabase URL
 * @param supabaseKey The Supabase key
 * @returns A Supabase client adapter
 */
export function createAdaptedClient(supabaseUrl: string, supabaseKey: string) {
  const supabase = createClient<Database>(supabaseUrl, supabaseKey);
  
  // Override the from method to use snake_case table names
  const originalFrom = supabase.from;
  supabase.from = function(table: string) {
    const snakeTable = getTableName(table);
    const result = originalFrom.call(this, snakeTable);
    
    // Add a wrapping method that converts result data back to camelCase
    const originalThen = result.then;
    if (originalThen) {
      result.then = function(callback) {
        return originalThen.call(this, (result: any) => {
          if (result.data && Array.isArray(result.data)) {
            result.data = result.data.map(objectToCamelCase);
          } else if (result.data) {
            result.data = objectToCamelCase(result.data);
          }
          return callback(result);
        });
      };
    }
    
    return result;
  };
  
  // Override insert to convert object keys to snake_case
  const originalInsert = PostgrestFilterBuilder.prototype.insert;
  PostgrestFilterBuilder.prototype.insert = function(values, options) {
    if (Array.isArray(values)) {
      values = values.map(objectToSnakeCase);
    } else {
      values = objectToSnakeCase(values);
    }
    return originalInsert.call(this, values, options);
  };
  
  // Override update to convert object keys to snake_case
  const originalUpdate = PostgrestFilterBuilder.prototype.update;
  PostgrestFilterBuilder.prototype.update = function(values, options) {
    values = objectToSnakeCase(values);
    return originalUpdate.call(this, values, options);
  };
  
  return supabase;
}

export default {
  tableNameMap,
  columnNameMap,
  toSnakeCase,
  toCamelCase,
  objectToSnakeCase,
  objectToCamelCase,
  getTableName,
  createAdaptedClient,
};