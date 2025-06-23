/**
 * Client-safe Square fee calculator utilities
 * These functions can be safely imported in client components
 */

/**
 * Determine if a card should be treated as domestic based on user's country
 */
export function isDomesticCard(userCountry?: string): boolean {
  if (!userCountry) return false; // Default to international for safety
  return userCountry.toUpperCase() === 'AU';
}

/**
 * Get the appropriate fee label based on domestic/international status
 */
export function getProcessingFeeLabel(isDomestic: boolean): string {
  return isDomestic ? 'Processing fees' : 'International processing fees';
}

/**
 * Get fee disclaimer text
 */
export function getFeeDisclaimer(): string {
  return "Processing fees are added to cover payment processing costs. This ensures the full amount goes to the event organizer.";
}