/**
 * Utilities for generating and working with confirmation numbers
 */

/**
 * Default event code to use if none is provided
 */
const DEFAULT_EVENT_CODE = "GI";

/**
 * Generates a human-readable confirmation number
 * Format: PREFIX-XXXXXX (where X is numeric and PREFIX is the event code)
 * @param eventCode Optional event code to use as prefix (e.g., "GI" for Grand Installation)
 * @returns A formatted confirmation number string
 */
export function generateConfirmationNumber(eventCode?: string): string {
  // Use provided event code or default
  const prefix = eventCode?.toUpperCase() || DEFAULT_EVENT_CODE;
  
  // Generate a random 6-digit number
  const numericPart = generateNumericSegment(6);
  
  // Format with prefix and separator
  return `${prefix}-${numericPart}`;
}

/**
 * Generates a random numeric segment of specified length
 * @param length The length of the segment to generate
 * @returns A random numeric string
 */
function generateNumericSegment(length: number): string {
  // Ensure first digit isn't 0 to maintain proper length
  let result = '';
  
  // Generate first digit (1-9)
  result += Math.floor(Math.random() * 9) + 1;
  
  // Generate remaining digits (0-9)
  for (let i = 1; i < length; i++) {
    result += Math.floor(Math.random() * 10);
  }
  
  return result;
}

/**
 * Validates a confirmation number format
 * @param confirmationNumber The confirmation number to validate
 * @param eventCode Optional event code to validate against
 * @returns True if the format is valid, false otherwise
 */
export function isValidConfirmationNumber(confirmationNumber: string, eventCode?: string): boolean {
  if (eventCode) {
    // If event code is provided, validate against that specific prefix
    const pattern = new RegExp(`^${eventCode.toUpperCase()}-\\d{6}$`);
    return pattern.test(confirmationNumber);
  } else {
    // Generic validation - any alphabetic prefix followed by 6 digits
    const pattern = /^[A-Z]+-\d{6}$/;
    return pattern.test(confirmationNumber);
  }
}