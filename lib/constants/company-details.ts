/**
 * LodgeTix Company Details Module
 * 
 * This module provides centralized company information, contact details, and utility functions
 * for consistent use across all legal pages, footers, and other components that require
 * company information.
 * 
 * @author Claude Code
 * @version 1.0.0
 */

/**
 * Core company information interface
 */
export interface CompanyInfo {
  readonly legalName: string;
  readonly tradingName: string;
  readonly abn: string;
  readonly address: Address;
  readonly contact: ContactDetails;
  readonly jurisdiction: Jurisdiction;
}

/**
 * Company address interface
 */
export interface Address {
  readonly street: string;
  readonly suburb: string;
  readonly state: string;
  readonly postcode: string;
  readonly country: string;
}

/**
 * Contact details interface
 */
export interface ContactDetails {
  readonly phone: string;
  readonly email: string;
  readonly supportEmail: string;
}

/**
 * Legal jurisdiction interface
 */
export interface Jurisdiction {
  readonly state: string;
  readonly country: string;
  readonly governingLaw: string;
}

/**
 * Brand positioning variants for different contexts
 */
export interface BrandPositioning {
  readonly primary: string;
  readonly secondary: string;
  readonly legal: string;
  readonly marketing: string;
}

/**
 * Logo assets and configurations
 */
export interface LogoAssets {
  readonly placeholder: {
    readonly svg: string;
    readonly png: string;
  };
  readonly component: string;
  readonly alt: string;
}

/**
 * Core company information constants
 */
export const COMPANY_INFO: CompanyInfo = {
  legalName: "Winding Stair Pty. Limited",
  tradingName: "LodgeTix",
  abn: "94687923128",
  address: {
    street: "66 Goulburn Street",
    suburb: "Sydney",
    state: "NSW",
    postcode: "2000",
    country: "Australia"
  },
  contact: {
    phone: "0408 925 926",
    email: "info@lodgetix.io",
    supportEmail: "support@lodgetix.io"
  },
  jurisdiction: {
    state: "New South Wales",
    country: "Australia",
    governingLaw: "Laws of New South Wales, Australia"
  }
} as const;

/**
 * Brand positioning variants for different contexts
 */
export const BRAND_POSITIONING: BrandPositioning = {
  primary: "Masonic Event Management Software",
  secondary: "The Complete Event Management Platform for Masonic Organizations",
  legal: "Event Management Software as a Service (SaaS) platform operated by Winding Stair Pty. Limited",
  marketing: "Purpose-built event management software crafted with Masonic traditions and requirements in mind"
} as const;

/**
 * Company description variants for different contexts
 */
export const COMPANY_DESCRIPTIONS = {
  /**
   * Short description for headers and brief introductions
   */
  short: "LodgeTix is a purpose-built event management software platform for Masonic organizations.",
  
  /**
   * Medium description for about sections and general use
   */
  medium: "LodgeTix is a comprehensive Software as a Service (SaaS) platform that provides Masonic organizations with complete event management capabilities including registration, check-in & badging, attendee management, sponsorship tracking, and automated communication tools.",
  
  /**
   * Long description for detailed explanations
   */
  long: "LodgeTix is a Software as a Service (SaaS) platform operated by Winding Stair Pty. Limited, providing comprehensive event management solutions specifically designed for Masonic organizations. Our software enables Lodges, Grand Lodges, and Masonic Orders to efficiently manage their events with features including attendee registration, check-in & badging, event marketing, attendee management & communication, sponsorship management, printed materials design & production, vendor & supplier management, and expense tracking. Purpose-built with deep understanding of Masonic traditions, hierarchy, and protocols, LodgeTix saves lodges 10+ hours per event while enhancing member experiences.",
  
  /**
   * Legal context description for terms and conditions
   */
  legal: `The LodgeTix software platform ("Service") is operated by Winding Stair Pty. Limited (ABN: 94687923128), a company incorporated under the laws of New South Wales, Australia.`,
  
  /**
   * SaaS-specific description for software pages
   */
  saas: "LodgeTix is the complete event management platform for Masonic organizations. Our purpose-built software streamlines every aspect of event management - from registration and ticketing to check-in, badging, and post-event reporting. Designed exclusively for Freemasonry, we understand the unique requirements of Masonic events including rank hierarchy, protocol management, and ceremonial traditions.",
  
  /**
   * Value proposition for marketing
   */
  value: "Save time, reduce errors, and deliver professional events with LodgeTix - the only event management software designed exclusively for Masonic organizations. Join lodges saving 10+ hours per event while reducing errors by 95%."
} as const;

/**
 * Formatting utility functions
 */
export const CompanyFormatters = {
  /**
   * Returns the full formatted address as a single string
   * @param separator - The separator to use between address lines (default: ', ')
   * @returns Formatted address string
   */
  getFullAddress: (separator: string = ', '): string => {
    const { address } = COMPANY_INFO;
    return `${address.street}${separator}${address.suburb} ${address.state} ${address.postcode}${separator}${address.country}`;
  },

  /**
   * Returns the address as an array of lines for multi-line display
   * @returns Array of address lines
   */
  getAddressLines: (): string[] => {
    const { address } = COMPANY_INFO;
    return [
      address.street,
      `${address.suburb} ${address.state} ${address.postcode}`,
      address.country
    ];
  },

  /**
   * Returns a formatted phone number link for HTML anchor tags
   * @returns Phone number in tel: format
   */
  getPhoneLink: (): string => {
    return `tel:${COMPANY_INFO.contact.phone.replace(/\s/g, '')}`;
  },

  /**
   * Returns a formatted email link for HTML anchor tags
   * @param isSupport - Whether to use support email (default: false)
   * @returns Email address in mailto: format
   */
  getEmailLink: (isSupport: boolean = false): string => {
    const email = isSupport ? COMPANY_INFO.contact.supportEmail : COMPANY_INFO.contact.email;
    return `mailto:${email}`;
  },

  /**
   * Returns the complete legal entity name with ABN
   * @returns Formatted legal entity string
   */
  getLegalEntity: (): string => {
    return `${COMPANY_INFO.legalName}, ABN: ${COMPANY_INFO.abn}`;
  },

  /**
   * Returns the trading name with legal context
   * @returns Formatted trading name string
   */
  getTradingName: (): string => {
    return `'${COMPANY_INFO.tradingName}' is a ${BRAND_POSITIONING.legal}`;
  },

  /**
   * Returns jurisdiction information for legal documents
   * @returns Formatted jurisdiction string
   */
  getJurisdiction: (): string => {
    return `Governed by the ${COMPANY_INFO.jurisdiction.governingLaw}`;
  }
} as const;

/**
 * Date formatting utilities for consistent date display across legal pages
 */
export const DateFormatters = {
  /**
   * Returns current date formatted for Australian context
   * @param options - Intl.DateTimeFormatOptions to customize formatting
   * @returns Formatted date string
   */
  getCurrentDateAU: (options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }): string => {
    return new Date().toLocaleDateString('en-AU', options);
  },

  /**
   * Returns current date formatted for legal documents
   * @returns Date in format suitable for "Last updated" fields
   */
  getLastUpdatedDate: (): string => {
    return DateFormatters.getCurrentDateAU();
  },

  /**
   * Formats a specific date for Australian context
   * @param date - Date to format
   * @param options - Intl.DateTimeFormatOptions to customize formatting
   * @returns Formatted date string
   */
  formatDateAU: (
    date: Date, 
    options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }
  ): string => {
    return date.toLocaleDateString('en-AU', options);
  },

  /**
   * Returns a date formatted for legal document effective dates
   * @param date - Date to format (defaults to current date)
   * @returns Formatted effective date string
   */
  getEffectiveDate: (date: Date = new Date()): string => {
    return `Effective as of ${DateFormatters.formatDateAU(date)}`;
  }
} as const;

/**
 * Logo assets and configurations
 */
export const LOGO_ASSETS: LogoAssets = {
  placeholder: {
    svg: '/placeholder-logo.svg',
    png: '/placeholder-logo.png'
  },
  component: 'MasonicLogo',
  alt: 'LodgeTix - Masonic Event Management Software'
} as const;

/**
 * Contact information component data for consistent display
 */
export const ContactDisplayData = {
  /**
   * Contact cards data for support pages
   */
  supportCards: [
    {
      name: 'General Support',
      description: 'Registration help, account issues, and general platform questions.',
      email: COMPANY_INFO.contact.supportEmail,
      phone: COMPANY_INFO.contact.phone
    },
    {
      name: 'Technical Support', 
      description: 'Technical issues, payment problems, and troubleshooting assistance.',
      email: COMPANY_INFO.contact.supportEmail,
      phone: COMPANY_INFO.contact.phone
    },
    {
      name: 'Event Inquiries',
      description: 'Questions about specific events, dates, venues, and requirements.',
      email: COMPANY_INFO.contact.email,
      phone: COMPANY_INFO.contact.phone
    }
  ],

  /**
   * Full contact information for display
   */
  fullContact: {
    companyName: COMPANY_INFO.legalName,
    tradingAs: COMPANY_INFO.tradingName,
    abn: COMPANY_INFO.abn,
    address: CompanyFormatters.getAddressLines(),
    phone: COMPANY_INFO.contact.phone,
    email: COMPANY_INFO.contact.email,
    supportEmail: COMPANY_INFO.contact.supportEmail,
    phoneLink: CompanyFormatters.getPhoneLink(),
    emailLink: CompanyFormatters.getEmailLink(),
    supportEmailLink: CompanyFormatters.getEmailLink(true)
  }
} as const;

/**
 * Export individual components for convenience
 */
export const {
  legalName: COMPANY_LEGAL_NAME,
  tradingName: COMPANY_TRADING_NAME,
  abn: COMPANY_ABN,
  address: COMPANY_ADDRESS,
  contact: COMPANY_CONTACT,
  jurisdiction: COMPANY_JURISDICTION
} = COMPANY_INFO;

/**
 * Export commonly used formatted strings
 */
export const FORMATTED_STRINGS = {
  FULL_ADDRESS: CompanyFormatters.getFullAddress(),
  ADDRESS_LINES: CompanyFormatters.getAddressLines(),
  PHONE_LINK: CompanyFormatters.getPhoneLink(),
  EMAIL_LINK: CompanyFormatters.getEmailLink(),
  SUPPORT_EMAIL_LINK: CompanyFormatters.getEmailLink(true),
  LEGAL_ENTITY: CompanyFormatters.getLegalEntity(),
  TRADING_NAME_LEGAL: CompanyFormatters.getTradingName(),
  JURISDICTION: CompanyFormatters.getJurisdiction(),
  LAST_UPDATED: DateFormatters.getLastUpdatedDate()
} as const;

/**
 * Type exports for external use
 */
export type {
  CompanyInfo as ICompanyInfo,
  Address as IAddress,
  ContactDetails as IContactDetails,
  Jurisdiction as IJurisdiction,
  BrandPositioning as IBrandPositioning
};