/**
 * Unified Terms of Service Type Definitions
 * 
 * This module provides TypeScript interfaces and types for the unified terms of service
 * structure, including user acceptance tracking, section management, and compliance
 * monitoring.
 * 
 * @author Claude Code
 * @version 1.0.0
 */

/**
 * User types that can accept terms
 */
export type UserType = 'attendee' | 'organiser' | 'both';

/**
 * Major sections of the unified terms
 */
export type TermsSection = 
  | 'general-provisions'
  | 'attendee-terms'
  | 'organiser-terms'
  | 'shared-responsibilities'
  | 'platform-operations'
  | 'legal-framework';

/**
 * Specific subsections for granular tracking
 */
export type TermsSubsection = 
  // General Provisions
  | 'agreement-scope'
  | 'universal-eligibility'
  | 'universal-conduct'
  // Attendee Terms
  | 'attendee-registration'
  | 'attendee-payment'
  | 'attendee-cancellation'
  | 'attendee-rights'
  // Organiser Terms
  | 'organiser-creation'
  | 'organiser-stripe'
  | 'organiser-refunds'
  | 'organiser-delivery'
  | 'organiser-liability'
  // Shared Responsibilities
  | 'cross-references'
  | 'conflict-resolution'
  | 'shared-data'
  // Platform Operations
  | 'platform-role'
  | 'platform-mediation'
  | 'platform-technical'
  // Legal Framework
  | 'masonic-disputes'
  | 'governing-law'
  | 'liability-framework'
  | 'termination-enforcement';

/**
 * Terms acceptance status
 */
export type AcceptanceStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

/**
 * Terms version tracking
 */
export interface TermsVersion {
  readonly version: string;
  readonly effectiveDate: Date;
  readonly previousVersion?: string;
  readonly changesSummary: string[];
  readonly affectedSections: TermsSection[];
  readonly requiresNewAcceptance: boolean;
}

/**
 * Individual section acceptance record
 */
export interface SectionAcceptance {
  readonly section: TermsSection;
  readonly subsection?: TermsSubsection;
  readonly acceptanceDate: Date;
  readonly version: string;
  readonly ipAddress: string;
  readonly userAgent: string;
  readonly explicit: boolean; // Whether user explicitly accepted this section
}

/**
 * Complete terms acceptance record
 */
export interface TermsAcceptance {
  readonly id: string;
  readonly userId: string;
  readonly userType: UserType;
  readonly acceptanceDate: Date;
  readonly version: string;
  readonly ipAddress: string;
  readonly userAgent: string;
  readonly sectionsAccepted: SectionAcceptance[];
  readonly status: AcceptanceStatus;
  readonly expiryDate?: Date;
  readonly supersededBy?: string; // ID of newer acceptance
}

/**
 * User's current terms compliance status
 */
export interface TermsComplianceStatus {
  readonly userId: string;
  readonly userType: UserType;
  readonly isCompliant: boolean;
  readonly currentVersion: string;
  readonly lastAcceptanceDate?: Date;
  readonly requiredSections: TermsSection[];
  readonly acceptedSections: TermsSection[];
  readonly missingSections: TermsSection[];
  readonly expiredSections: TermsSection[];
  readonly requiresUpdate: boolean;
}

/**
 * Terms presentation configuration
 */
export interface TermsPresentationConfig {
  readonly userType: UserType;
  readonly showSections: TermsSection[];
  readonly highlightSections: TermsSection[];
  readonly collapsedByDefault: TermsSection[];
  readonly requireExplicitAcceptance: TermsSection[];
  readonly showNavigationAids: boolean;
  readonly enableSectionFiltering: boolean;
}

/**
 * Section metadata for navigation and presentation
 */
export interface SectionMetadata {
  readonly section: TermsSection;
  readonly title: string;
  readonly description: string;
  readonly applicableUserTypes: UserType[];
  readonly dependencies: TermsSection[];
  readonly estimatedReadingTime: number; // in minutes
  readonly lastUpdated: Date;
  readonly changeLevel: 'major' | 'minor' | 'editorial';
}

/**
 * Terms navigation structure
 */
export interface TermsNavigation {
  readonly currentSection: TermsSection;
  readonly availableSections: SectionMetadata[];
  readonly userSpecificSections: SectionMetadata[];
  readonly crossReferences: Record<TermsSection, TermsSection[]>;
  readonly breadcrumb: string[];
}

/**
 * Terms change notification
 */
export interface TermsChangeNotification {
  readonly id: string;
  readonly userId: string;
  readonly changeDate: Date;
  readonly newVersion: string;
  readonly previousVersion: string;
  readonly affectedSections: TermsSection[];
  readonly requiresAcceptance: boolean;
  readonly notificationSent: boolean;
  readonly acceptanceDeadline?: Date;
  readonly changesSummary: string;
}

/**
 * Masonic-specific terms requirements
 */
export interface MasonicTermsRequirements {
  readonly requiresMasonicMembership: boolean;
  readonly grandLodgeVerificationRequired: boolean;
  readonly applicableEvents: string[];
  readonly protocolLevel: 'basic' | 'ceremonial' | 'official';
  readonly confidentialityRequirements: string[];
  readonly disciplinaryProcedures: string[];
}

/**
 * Payment terms configuration (3-day transition)
 */
export interface PaymentTermsConfig {
  readonly refundTransitionDays: number; // Default: 3
  readonly platformRefundPeriod: number; // Days 1-3
  readonly organiserRefundPeriod: number; // Day 4+
  readonly processingFeePolicy: 'platform' | 'organiser' | 'shared';
  readonly exceptionHandling: 'platform' | 'organiser' | 'collaborative';
}

/**
 * Stripe Connect terms integration
 */
export interface StripeConnectTerms {
  readonly connectedAccountAgreement: boolean;
  readonly kycRequirements: string[];
  readonly complianceObligations: string[];
  readonly disputeResolutionProcedures: string[];
  readonly dataSharing: string[];
  readonly feeStructure: {
    readonly processingFees: string;
    readonly platformFees: string;
    readonly chargebackFees: string;
  };
}

/**
 * Terms analytics and monitoring
 */
export interface TermsAnalytics {
  readonly sectionViewCounts: Record<TermsSection, number>;
  readonly averageReadingTime: Record<TermsSection, number>;
  readonly acceptanceRates: Record<TermsSection, number>;
  readonly dropOffPoints: TermsSection[];
  readonly commonQuestions: string[];
  readonly userFeedback: {
    readonly clarity: number; // 1-5 rating
    readonly completeness: number;
    readonly usability: number;
    readonly comments: string[];
  };
}

/**
 * Terms enforcement action
 */
export interface TermsEnforcementAction {
  readonly id: string;
  readonly userId: string;
  readonly actionType: 'warning' | 'suspension' | 'termination';
  readonly violatedSections: TermsSection[];
  readonly actionDate: Date;
  readonly description: string;
  readonly appealable: boolean;
  readonly appealDeadline?: Date;
  readonly coordinatedWithGrandLodge: boolean;
}

/**
 * Terms API request/response types
 */
export interface GetTermsRequest {
  readonly userType?: UserType;
  readonly version?: string;
  readonly sectionsOnly?: TermsSection[];
}

export interface GetTermsResponse {
  readonly version: string;
  readonly effectiveDate: Date;
  readonly sections: SectionMetadata[];
  readonly presentationConfig: TermsPresentationConfig;
  readonly userCompliance: TermsComplianceStatus;
}

export interface AcceptTermsRequest {
  readonly userId: string;
  readonly userType: UserType;
  readonly version: string;
  readonly sectionsAccepted: TermsSection[];
  readonly explicitAcceptance: boolean;
  readonly ipAddress: string;
  readonly userAgent: string;
}

export interface AcceptTermsResponse {
  readonly acceptanceId: string;
  readonly status: AcceptanceStatus;
  readonly complianceStatus: TermsComplianceStatus;
  readonly nextSteps: string[];
}

/**
 * Utility types for terms management
 */
export type TermsFilter = Partial<{
  userType: UserType;
  section: TermsSection;
  status: AcceptanceStatus;
  dateRange: {
    from: Date;
    to: Date;
  };
}>;

export type TermsSort = 
  | 'acceptanceDate'
  | 'section'
  | 'userType'
  | 'status'
  | 'version';

/**
 * Terms management permissions
 */
export interface TermsPermissions {
  readonly canViewTerms: boolean;
  readonly canAcceptTerms: boolean;
  readonly canModifyTerms: boolean;
  readonly canViewAnalytics: boolean;
  readonly canEnforceTerms: boolean;
  readonly scopedToUserTypes: UserType[];
  readonly scopedToSections: TermsSection[];
}

/**
 * Export all types for external use
 */
export type {
  UserType,
  TermsSection,
  TermsSubsection,
  AcceptanceStatus,
  TermsVersion,
  SectionAcceptance,
  TermsAcceptance,
  TermsComplianceStatus,
  TermsPresentationConfig,
  SectionMetadata,
  TermsNavigation,
  TermsChangeNotification,
  MasonicTermsRequirements,
  PaymentTermsConfig,
  StripeConnectTerms,
  TermsAnalytics,
  TermsEnforcementAction,
  GetTermsRequest,
  GetTermsResponse,
  AcceptTermsRequest,
  AcceptTermsResponse,
  TermsFilter,
  TermsSort,
  TermsPermissions,
};

/**
 * Default configuration constants
 */
export const DEFAULT_TERMS_CONFIG = {
  REFUND_TRANSITION_DAYS: 3,
  ACCEPTANCE_EXPIRY_DAYS: 365,
  NOTIFICATION_ADVANCE_DAYS: 30,
  READING_TIME_BUFFER: 1.2, // 20% buffer for estimated reading time
  MAX_SECTIONS_PER_REQUEST: 10,
} as const;

/**
 * Section dependencies mapping
 */
export const SECTION_DEPENDENCIES: Record<TermsSection, TermsSection[]> = {
  'general-provisions': [],
  'attendee-terms': ['general-provisions'],
  'organiser-terms': ['general-provisions'],
  'shared-responsibilities': ['attendee-terms', 'organiser-terms'],
  'platform-operations': ['general-provisions'],
  'legal-framework': ['general-provisions', 'shared-responsibilities'],
} as const;

/**
 * User type section requirements
 */
export const USER_TYPE_REQUIREMENTS: Record<UserType, TermsSection[]> = {
  'attendee': [
    'general-provisions',
    'attendee-terms',
    'shared-responsibilities',
    'platform-operations',
    'legal-framework',
  ],
  'organiser': [
    'general-provisions',
    'organiser-terms',
    'shared-responsibilities',
    'platform-operations',
    'legal-framework',
  ],
  'both': [
    'general-provisions',
    'attendee-terms',
    'organiser-terms',
    'shared-responsibilities',
    'platform-operations',
    'legal-framework',
  ],
} as const;