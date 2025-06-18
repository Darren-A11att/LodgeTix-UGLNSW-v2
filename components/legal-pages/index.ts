/**
 * Legal Pages Components Index
 * 
 * This file exports all legal page components for easy importing throughout the application.
 * These components contain legally binding terms and should be handled carefully.
 */

// Event Organiser Terms
export { default as EventOrganiserTerms } from './event-organiser-terms'
export { default as OrganiserTermsSummary } from './organiser-terms-summary'
export { default as OrganiserOnboardingTerms } from './organiser-onboarding-terms'

// Export types
export type { TermsAcceptanceData } from './organiser-onboarding-terms'

// Note: Other legal content components are located in /docs/legal-pages/
// This directory focuses on comprehensive terms and binding legal agreements

// Re-export types for external use
export type { 
  ICompanyInfo, 
  IAddress, 
  IContactDetails, 
  IJurisdiction, 
  IBrandPositioning 
} from '@/lib/constants/company-details'