/**
 * Unified Terms of Service Management Service
 * 
 * This service provides comprehensive management of the unified terms of service,
 * including user acceptance tracking, compliance monitoring, and section-specific
 * access control for both Event Attendees and Event Organisers.
 * 
 * @author Claude Code
 * @version 1.0.0
 */

import { 
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
  GetTermsRequest,
  GetTermsResponse,
  AcceptTermsRequest,
  AcceptTermsResponse,
  TermsFilter,
  TermsSort,
  TermsPermissions,
  DEFAULT_TERMS_CONFIG,
  SECTION_DEPENDENCIES,
  USER_TYPE_REQUIREMENTS,
} from '@/lib/types/unified-terms-types';

/**
 * Core service class for unified terms management
 */
export class UnifiedTermsService {
  private readonly currentVersion = '1.0.0';
  private readonly effectiveDate = new Date('2024-12-18');

  /**
   * Get terms of service content based on user type and requirements
   */
  async getTerms(request: GetTermsRequest): Promise<GetTermsResponse> {
    const userType = request.userType || 'attendee';
    const version = request.version || this.currentVersion;
    
    // Get applicable sections for user type
    const applicableSections = this.getApplicableSections(userType, request.sectionsOnly);
    
    // Build section metadata
    const sections = await this.buildSectionMetadata(applicableSections, version);
    
    // Create presentation configuration
    const presentationConfig = this.createPresentationConfig(userType, applicableSections);
    
    // Get user compliance status (would typically fetch from database)
    const userCompliance = await this.getUserComplianceStatus(request.userType);
    
    return {
      version,
      effectiveDate: this.effectiveDate,
      sections,
      presentationConfig,
      userCompliance,
    };
  }

  /**
   * Process user acceptance of terms
   */
  async acceptTerms(request: AcceptTermsRequest): Promise<AcceptTermsResponse> {
    // Validate request
    this.validateAcceptanceRequest(request);
    
    // Create acceptance record
    const acceptance = await this.createAcceptanceRecord(request);
    
    // Update user compliance status
    const complianceStatus = await this.updateUserCompliance(request.userId, acceptance);
    
    // Determine next steps
    const nextSteps = this.determineNextSteps(complianceStatus, request.userType);
    
    return {
      acceptanceId: acceptance.id,
      status: acceptance.status,
      complianceStatus,
      nextSteps,
    };
  }

  /**
   * Get user's current compliance status
   */
  async getUserComplianceStatus(userType?: UserType, userId?: string): Promise<TermsComplianceStatus> {
    // In a real implementation, this would fetch from database
    const requiredSections = USER_TYPE_REQUIREMENTS[userType || 'attendee'];
    
    return {
      userId: userId || 'anonymous',
      userType: userType || 'attendee',
      isCompliant: false, // Would be calculated from actual acceptance records
      currentVersion: this.currentVersion,
      requiredSections,
      acceptedSections: [],
      missingSections: requiredSections,
      expiredSections: [],
      requiresUpdate: true,
    };
  }

  /**
   * Check if user needs to accept new terms
   */
  async checkTermsUpdate(userId: string, userType: UserType): Promise<TermsChangeNotification | null> {
    // In a real implementation, this would check for version updates
    // and return notification if acceptance required
    return null;
  }

  /**
   * Get terms navigation structure for user
   */
  async getTermsNavigation(
    userType: UserType,
    currentSection?: TermsSection
  ): Promise<TermsNavigation> {
    const applicableSections = this.getApplicableSections(userType);
    const sections = await this.buildSectionMetadata(applicableSections, this.currentVersion);
    
    // Filter to user-specific sections
    const userSpecificSections = sections.filter(section => 
      section.applicableUserTypes.includes(userType)
    );
    
    return {
      currentSection: currentSection || 'general-provisions',
      availableSections: sections,
      userSpecificSections,
      crossReferences: SECTION_DEPENDENCIES,
      breadcrumb: this.buildBreadcrumb(currentSection),
    };
  }

  /**
   * Get Masonic-specific requirements for terms
   */
  getMasonicRequirements(eventType: string): MasonicTermsRequirements {
    const ceremonialEvents = ['installation', 'consecration', 'degree-work'];
    const officialEvents = ['grand-lodge-meeting', 'district-meeting'];
    
    return {
      requiresMasonicMembership: true,
      grandLodgeVerificationRequired: ceremonialEvents.includes(eventType) || officialEvents.includes(eventType),
      applicableEvents: [eventType],
      protocolLevel: ceremonialEvents.includes(eventType) ? 'ceremonial' : 
                     officialEvents.includes(eventType) ? 'official' : 'basic',
      confidentialityRequirements: [
        'No recording or photography during ceremonial proceedings',
        'Maintain confidentiality of Masonic information shared',
        'Respect the sanctity of Lodge rooms and ceremonial spaces',
      ],
      disciplinaryProcedures: [
        'Violations reported to appropriate Grand Lodge authorities',
        'Progressive enforcement from warnings to exclusion',
        'Coordination with traditional Masonic discipline procedures',
      ],
    };
  }

  /**
   * Get payment terms configuration including 3-day transition
   */
  getPaymentTermsConfig(): PaymentTermsConfig {
    return {
      refundTransitionDays: DEFAULT_TERMS_CONFIG.REFUND_TRANSITION_DAYS,
      platformRefundPeriod: 3, // Days 1-3
      organiserRefundPeriod: Infinity, // Day 4+
      processingFeePolicy: 'shared', // Platform handles processing fees during their period
      exceptionHandling: 'collaborative', // Both parties involved in exceptional circumstances
    };
  }

  /**
   * Validate terms acceptance request
   */
  private validateAcceptanceRequest(request: AcceptTermsRequest): void {
    if (!request.userId) {
      throw new Error('User ID is required for terms acceptance');
    }
    
    if (!request.version || request.version !== this.currentVersion) {
      throw new Error(`Terms version ${this.currentVersion} is required`);
    }
    
    const requiredSections = USER_TYPE_REQUIREMENTS[request.userType];
    const missingSections = requiredSections.filter(section => 
      !request.sectionsAccepted.includes(section)
    );
    
    if (missingSections.length > 0) {
      throw new Error(`Missing required sections: ${missingSections.join(', ')}`);
    }
  }

  /**
   * Create terms acceptance record
   */
  private async createAcceptanceRecord(request: AcceptTermsRequest): Promise<TermsAcceptance> {
    const id = `terms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const acceptanceDate = new Date();
    
    const sectionsAccepted: SectionAcceptance[] = request.sectionsAccepted.map(section => ({
      section,
      acceptanceDate,
      version: request.version,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      explicit: request.explicitAcceptance,
    }));
    
    const acceptance: TermsAcceptance = {
      id,
      userId: request.userId,
      userType: request.userType,
      acceptanceDate,
      version: request.version,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      sectionsAccepted,
      status: 'accepted',
      expiryDate: new Date(acceptanceDate.getTime() + (DEFAULT_TERMS_CONFIG.ACCEPTANCE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)),
    };
    
    // In a real implementation, this would save to database
    console.log('Terms acceptance recorded:', acceptance);
    
    return acceptance;
  }

  /**
   * Update user compliance status after acceptance
   */
  private async updateUserCompliance(
    userId: string, 
    acceptance: TermsAcceptance
  ): Promise<TermsComplianceStatus> {
    const requiredSections = USER_TYPE_REQUIREMENTS[acceptance.userType];
    const acceptedSections = acceptance.sectionsAccepted.map(sa => sa.section);
    
    return {
      userId,
      userType: acceptance.userType,
      isCompliant: requiredSections.every(section => acceptedSections.includes(section)),
      currentVersion: acceptance.version,
      lastAcceptanceDate: acceptance.acceptanceDate,
      requiredSections,
      acceptedSections,
      missingSections: requiredSections.filter(section => !acceptedSections.includes(section)),
      expiredSections: [],
      requiresUpdate: false,
    };
  }

  /**
   * Determine next steps after terms acceptance
   */
  private determineNextSteps(
    complianceStatus: TermsComplianceStatus, 
    userType: UserType
  ): string[] {
    const steps: string[] = [];
    
    if (complianceStatus.isCompliant) {
      steps.push('Terms acceptance complete - you can now use all platform features');
      
      if (userType === 'organiser' || userType === 'both') {
        steps.push('Complete Stripe Connect verification to start receiving payments');
        steps.push('Create your first event to begin using organiser features');
      }
      
      if (userType === 'attendee' || userType === 'both') {
        steps.push('Browse available events and register for those that interest you');
      }
    } else {
      steps.push(`Accept remaining required sections: ${complianceStatus.missingSections.join(', ')}`);
    }
    
    return steps;
  }

  /**
   * Get applicable sections for user type
   */
  private getApplicableSections(
    userType: UserType, 
    specificSections?: TermsSection[]
  ): TermsSection[] {
    if (specificSections) {
      return specificSections;
    }
    
    return USER_TYPE_REQUIREMENTS[userType];
  }

  /**
   * Build section metadata for given sections
   */
  private async buildSectionMetadata(
    sections: TermsSection[], 
    version: string
  ): Promise<SectionMetadata[]> {
    const metadata: Record<TermsSection, Omit<SectionMetadata, 'section'>> = {
      'general-provisions': {
        title: 'General Provisions',
        description: 'Core terms applying to all users - both event attendees and organisers',
        applicableUserTypes: ['attendee', 'organiser', 'both'],
        dependencies: [],
        estimatedReadingTime: 8,
        lastUpdated: this.effectiveDate,
        changeLevel: 'major',
      },
      'attendee-terms': {
        title: 'Event Attendee Terms',
        description: 'Specific terms for users registering for and attending events',
        applicableUserTypes: ['attendee', 'both'],
        dependencies: ['general-provisions'],
        estimatedReadingTime: 12,
        lastUpdated: this.effectiveDate,
        changeLevel: 'major',
      },
      'organiser-terms': {
        title: 'Event Organiser Terms',
        description: 'Specific terms for lodges and individuals creating and managing events',
        applicableUserTypes: ['organiser', 'both'],
        dependencies: ['general-provisions'],
        estimatedReadingTime: 15,
        lastUpdated: this.effectiveDate,
        changeLevel: 'major',
      },
      'shared-responsibilities': {
        title: 'Shared Responsibilities',
        description: 'Cross-user interaction protocols and shared data policies',
        applicableUserTypes: ['attendee', 'organiser', 'both'],
        dependencies: ['attendee-terms', 'organiser-terms'],
        estimatedReadingTime: 6,
        lastUpdated: this.effectiveDate,
        changeLevel: 'major',
      },
      'platform-operations': {
        title: 'Platform Operations',
        description: 'LodgeTix role, limitations, and mediation services',
        applicableUserTypes: ['attendee', 'organiser', 'both'],
        dependencies: ['general-provisions'],
        estimatedReadingTime: 8,
        lastUpdated: this.effectiveDate,
        changeLevel: 'major',
      },
      'legal-framework': {
        title: 'Legal Framework',
        description: 'Dispute resolution, governing law, and enforcement procedures',
        applicableUserTypes: ['attendee', 'organiser', 'both'],
        dependencies: ['general-provisions', 'shared-responsibilities'],
        estimatedReadingTime: 10,
        lastUpdated: this.effectiveDate,
        changeLevel: 'major',
      },
    };
    
    return sections.map(section => ({
      section,
      ...metadata[section],
    }));
  }

  /**
   * Create presentation configuration for user type
   */
  private createPresentationConfig(
    userType: UserType, 
    sections: TermsSection[]
  ): TermsPresentationConfig {
    const highlightSections: TermsSection[] = [];
    const requireExplicitAcceptance: TermsSection[] = [];
    
    // Highlight user-specific sections
    if (userType === 'attendee' || userType === 'both') {
      highlightSections.push('attendee-terms');
      requireExplicitAcceptance.push('attendee-terms');
    }
    
    if (userType === 'organiser' || userType === 'both') {
      highlightSections.push('organiser-terms');
      requireExplicitAcceptance.push('organiser-terms');
    }
    
    // Always require explicit acceptance for payment and liability terms
    requireExplicitAcceptance.push('shared-responsibilities', 'legal-framework');
    
    return {
      userType,
      showSections: sections,
      highlightSections,
      collapsedByDefault: ['platform-operations'], // Non-critical sections can be collapsed
      requireExplicitAcceptance,
      showNavigationAids: true,
      enableSectionFiltering: userType === 'both', // Enable filtering for dual-role users
    };
  }

  /**
   * Build breadcrumb navigation for current section
   */
  private buildBreadcrumb(currentSection?: TermsSection): string[] {
    const breadcrumb = ['Unified Terms of Service'];
    
    if (currentSection) {
      const sectionTitles: Record<TermsSection, string> = {
        'general-provisions': 'General Provisions',
        'attendee-terms': 'Event Attendee Terms',
        'organiser-terms': 'Event Organiser Terms',
        'shared-responsibilities': 'Shared Responsibilities',
        'platform-operations': 'Platform Operations',
        'legal-framework': 'Legal Framework',
      };
      
      breadcrumb.push(sectionTitles[currentSection]);
    }
    
    return breadcrumb;
  }
}

/**
 * Singleton instance for unified terms service
 */
export const unifiedTermsService = new UnifiedTermsService();

/**
 * Helper functions for terms management
 */
export const TermsHelpers = {
  /**
   * Check if user type requires specific section
   */
  requiresSection(userType: UserType, section: TermsSection): boolean {
    return USER_TYPE_REQUIREMENTS[userType].includes(section);
  },

  /**
   * Get missing sections for user type
   */
  getMissingSections(userType: UserType, acceptedSections: TermsSection[]): TermsSection[] {
    const required = USER_TYPE_REQUIREMENTS[userType];
    return required.filter(section => !acceptedSections.includes(section));
  },

  /**
   * Calculate reading time for sections
   */
  calculateReadingTime(sections: TermsSection[]): number {
    // Average reading speeds and section word counts would be configured
    const readingTimes: Record<TermsSection, number> = {
      'general-provisions': 8,
      'attendee-terms': 12,
      'organiser-terms': 15,
      'shared-responsibilities': 6,
      'platform-operations': 8,
      'legal-framework': 10,
    };
    
    return sections.reduce((total, section) => total + readingTimes[section], 0);
  },

  /**
   * Format terms version for display
   */
  formatVersion(version: string): string {
    return `v${version}`;
  },

  /**
   * Check if terms are expired
   */
  isExpired(acceptanceDate: Date, expiryDays: number = DEFAULT_TERMS_CONFIG.ACCEPTANCE_EXPIRY_DAYS): boolean {
    const expiryDate = new Date(acceptanceDate.getTime() + (expiryDays * 24 * 60 * 60 * 1000));
    return new Date() > expiryDate;
  },
};

/**
 * Export service and helpers
 */
export default unifiedTermsService;