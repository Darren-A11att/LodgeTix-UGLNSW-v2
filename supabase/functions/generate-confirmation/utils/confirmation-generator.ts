import { format } from 'date-fns'

const TYPE_PREFIXES = {
  individual: 'IND',
  lodge: 'LDG',
  delegation: 'DEL'
} as const

/**
 * Generates a unique confirmation number
 * Format: [TYPE][6 DIGITS][2 LETTERS]
 * Example: IND123456AB
 * Constraint: ^(IND|LDG|DEL)[0-9]{6}[A-Z]{2}$
 */
export function generateConfirmationNumber(
  registrationType: 'individual' | 'lodge' | 'delegation'
): string {
  const prefix = TYPE_PREFIXES[registrationType]
  
  // Generate 6 random digits
  const randomDigits = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
  
  // Generate 2 random uppercase letters
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const randomLetters = Array.from({ length: 2 }, () => 
    letters[Math.floor(Math.random() * letters.length)]
  ).join('')
  
  return `${prefix}${randomDigits}${randomLetters}`
}

/**
 * Validates confirmation number format
 * Must match database constraint: ^(IND|LDG|DEL)[0-9]{6}[A-Z]{2}$
 */
export function isValidConfirmationNumber(confirmationNumber: string): boolean {
  const pattern = /^(IND|LDG|DEL)[0-9]{6}[A-Z]{2}$/
  return pattern.test(confirmationNumber)
}

/**
 * Extracts registration type from confirmation number
 */
export function getTypeFromConfirmationNumber(
  confirmationNumber: string
): 'individual' | 'lodge' | 'delegation' | null {
  const prefix = confirmationNumber.substring(0, 3)
  
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