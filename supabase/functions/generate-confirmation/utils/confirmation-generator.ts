import { format } from 'date-fns'

const TYPE_PREFIXES = {
  individual: 'IND',
  lodge: 'LDG',
  delegation: 'DEL'
} as const

/**
 * Generates a unique confirmation number
 * Format: [TYPE][YEAR][MONTH][RANDOM]
 * Example: IND20240385AC
 */
export function generateConfirmationNumber(
  registrationType: 'individual' | 'lodge' | 'delegation'
): string {
  const prefix = TYPE_PREFIXES[registrationType]
  const year = format(new Date(), 'yyyy')
  const month = format(new Date(), 'MM')
  
  // Generate random suffix (2 letters + 2 numbers)
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const randomLetters = Array.from({ length: 2 }, () => 
    letters[Math.floor(Math.random() * letters.length)]
  ).join('')
  
  const randomNumbers = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  
  return `${prefix}${year}${month}${randomNumbers}${randomLetters}`
}

/**
 * Validates confirmation number format
 */
export function isValidConfirmationNumber(confirmationNumber: string): boolean {
  const pattern = /^(IND|LDG|DEL)\d{6}[A-Z]{2}$/
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