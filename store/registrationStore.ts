// This is a redirection file to maintain compatibility
// Import from the correct location
export * from '../lib/registrationStore';
export * from '../lib/registration-types';

// Import the default export as well
import { useRegistrationStore as importedUseRegistrationStore } from '../lib/registrationStore';
export const useRegistrationStore = importedUseRegistrationStore;

// Export default as a fallback
export default importedUseRegistrationStore;