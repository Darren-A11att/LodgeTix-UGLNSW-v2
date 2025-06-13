import { format } from 'date-fns'

const TYPE_PREFIXES = {
  individual: 'IND',
  lodge: 'LDG',
  delegation: 'DEL'
} as const

/**
 * Generates a unique confirmation number
 * Format: [TYPE]-[6 DIGITS]
 * Example: IND-123456, LDG-789012, DEL-345678
 * Constraint: ^[A-Z]{2,4}-[0-9]{6}$ (matches database constraint)
 * This format aligns with working lodge registration generation
 */
export function generateConfirmationNumber(
  registrationType: 'individual' | 'lodge' | 'delegation'
): string {
  const prefix = TYPE_PREFIXES[registrationType]
  
  // Generate 6 random digits (matches lodge registration pattern)
  const randomDigits = Math.floor(Math.random() * 999999).toString().padStart(6, '0')
  
  // Return format: PREFIX-DIGITS (matches working lodge format)
  return `${prefix}-${randomDigits}`
}

/**
 * Validates confirmation number format
 * Must match database constraint: ^[A-Z]{2,4}-[0-9]{6}$
 * Examples: IND-123456, LDG-789012, DEL-345678
 */
export function isValidConfirmationNumber(confirmationNumber: string): boolean {
  const pattern = /^[A-Z]{2,4}-[0-9]{6}$/
  return pattern.test(confirmationNumber)
}

/**
 * Extracts registration type from confirmation number
 * Handles format: PREFIX-DIGITS (e.g., IND-123456)
 */
export function getTypeFromConfirmationNumber(
  confirmationNumber: string
): 'individual' | 'lodge' | 'delegation' | null {
  // Split by hyphen and get the prefix part
  const prefix = confirmationNumber.split('-')[0]
  
  switch (prefix) {
    case 'IND':
      return 'individual'
    case 'LDG':
      return 'lodge'
    case 'DEL':
      return 'delegation'
    default:
      return null
  }
}