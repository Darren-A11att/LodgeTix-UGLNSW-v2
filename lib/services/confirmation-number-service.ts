/**
 * Confirmation Number Service
 * 
 * Centralized service for generating confirmation numbers that comply with
 * the database constraint: (IND|LDG|DEL)-[0-9]{6}[A-Z]{2}
 * 
 * Format: [PREFIX]-[6 digits][2 uppercase letters]
 * Examples:
 * - Individual: IND-123456AB
 * - Lodge: LDG-789012CD
 * - Delegation: DEL-345678EF
 */

export type RegistrationType = 'individual' | 'lodge' | 'delegation';

interface ConfirmationNumberResult {
  confirmationNumber: string;
  isValid: boolean;
  error?: string;
}

/**
 * Maps registration types to their confirmation number prefixes
 */
const CONFIRMATION_PREFIXES: Record<RegistrationType, string> = {
  individual: 'IND',
  lodge: 'LDG',
  delegation: 'DEL'
};

/**
 * Validates a confirmation number against the database constraint
 */
export function validateConfirmationNumber(confirmationNumber: string): boolean {
  if (!confirmationNumber) return false;
  
  // Database constraint: (IND|LDG|DEL)-[0-9]{6}[A-Z]{2}$
  const pattern = /^(IND|LDG|DEL)-[0-9]{6}[A-Z]{2}$/;
  return pattern.test(confirmationNumber);
}

/**
 * Generates a random 6-digit number padded with leading zeros
 */
function generateRandomDigits(): string {
  return Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
}

/**
 * Generates two random uppercase letters
 */
function generateRandomLetters(): string {
  const letter1 = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const letter2 = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return letter1 + letter2;
}

/**
 * Generates a confirmation number for the specified registration type
 * 
 * @param registrationType - The type of registration (individual, lodge, delegation)
 * @returns ConfirmationNumberResult with the generated number and validation status
 */
export function generateConfirmationNumber(registrationType: RegistrationType): ConfirmationNumberResult {
  try {
    const prefix = CONFIRMATION_PREFIXES[registrationType];
    
    if (!prefix) {
      return {
        confirmationNumber: '',
        isValid: false,
        error: `Invalid registration type: ${registrationType}`
      };
    }

    // Generate format: PREFIX-[6 digits][2 letters]
    const digits = generateRandomDigits();
    const letters = generateRandomLetters();
    const confirmationNumber = `${prefix}-${digits}${letters}`;
    
    // Validate the generated number
    const isValid = validateConfirmationNumber(confirmationNumber);
    
    if (!isValid) {
      return {
        confirmationNumber,
        isValid: false,
        error: 'Generated confirmation number failed validation'
      };
    }

    return {
      confirmationNumber,
      isValid: true
    };
    
  } catch (error) {
    return {
      confirmationNumber: '',
      isValid: false,
      error: `Error generating confirmation number: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Generates a confirmation number with retry logic for uniqueness
 * 
 * @param registrationType - The type of registration
 * @param maxRetries - Maximum number of retry attempts (default: 5)
 * @returns ConfirmationNumberResult with retry information
 */
export function generateUniqueConfirmationNumber(
  registrationType: RegistrationType,
  maxRetries: number = 5
): ConfirmationNumberResult {
  let lastError: string | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = generateConfirmationNumber(registrationType);
    
    if (result.isValid) {
      return result;
    }
    
    lastError = result.error;
  }
  
  return {
    confirmationNumber: '',
    isValid: false,
    error: `Failed to generate valid confirmation number after ${maxRetries} attempts. Last error: ${lastError}`
  };
}

/**
 * Extracts the registration type from a confirmation number
 * 
 * @param confirmationNumber - The confirmation number to parse
 * @returns RegistrationType or null if invalid
 */
export function getRegistrationTypeFromConfirmationNumber(confirmationNumber: string): RegistrationType | null {
  if (!validateConfirmationNumber(confirmationNumber)) {
    return null;
  }
  
  const prefix = confirmationNumber.split('-')[0];
  
  switch (prefix) {
    case 'IND':
      return 'individual';
    case 'LDG':
      return 'lodge';
    case 'DEL':
      return 'delegation';
    default:
      return null;
  }
}

/**
 * Utility function to check if a confirmation number belongs to a specific registration type
 */
export function isConfirmationNumberForType(
  confirmationNumber: string,
  registrationType: RegistrationType
): boolean {
  const extractedType = getRegistrationTypeFromConfirmationNumber(confirmationNumber);
  return extractedType === registrationType;
}