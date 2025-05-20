// lib/design-system/tokens.ts
// Centralized design tokens for the LodgeTix application

export const designTokens = {
  // Grid configurations
  grids: {
    form: 'form-grid',
    formTight: 'form-grid-tight',
    formLoose: 'form-grid-loose',
    mason: 'mason-grid',
    guest: 'guest-grid',
    ticket: 'ticket-grid',
    order: 'order-grid',
  },
  
  // Field size mappings
  fieldSizes: {
    xs: 'field-xs',    // 12.5% (1/8)
    sm: 'field-sm',    // 25% (2/8)
    md: 'field-md',    // 50% (4/8)
    lg: 'field-lg',    // 75% (6/8)
    xl: 'field-xl',    // 100% (8/8)
    full: 'field-xl',  // alias for xl
  },
  
  // Specific field patterns for different forms
  fieldPatterns: {
    // Mason form field sizes
    mason: {
      title: 'field-xs',
      rank: 'field-xs',
      firstName: 'field-sm',
      lastName: 'field-sm',
      email: 'field-xl',
      phone: 'field-md',
      contactPreference: 'field-md',
      grandLodge: 'field-xl',
      lodge: 'field-lg',
      lodgeNumber: 'field-xs',
      dietary: 'field-xl',
      specialNeeds: 'field-xl',
      grandRank: 'field-md',
      grandOfficerStatus: 'field-md',
      grandOfficerRole: 'field-md',
    },
    
    // Guest form field sizes
    guest: {
      title: 'field-xs',
      relationship: 'field-sm',
      firstName: 'field-sm',
      lastName: 'field-sm',
      email: 'field-xl',
      phone: 'field-md',
      contactPreference: 'field-md',
      dietary: 'field-xl',
      specialNeeds: 'field-xl',
    },
    
    // Partner form field sizes
    partner: {
      title: 'field-xs',
      relationship: 'field-sm',
      firstName: 'field-sm',
      lastName: 'field-sm',
      dietary: 'field-xl',
      specialNeeds: 'field-xl',
    },
    
    // Address field sizes
    address: {
      street: 'field-xl',
      city: 'field-md',
      state: 'field-xs',
      postalCode: 'field-xs',
      country: 'field-md',
    },
    
    // Payment form field sizes
    payment: {
      cardNumber: 'field-xl',
      expiry: 'field-sm',
      cvc: 'field-xs',
      name: 'field-xl',
      email: 'field-xl',
      phone: 'field-md',
    },
  },
  
  // Component classes
  components: {
    // Input components
    input: 'input-base',
    select: 'select-base',
    textarea: 'textarea-base',
    
    // Button variants
    button: {
      base: 'button-base',
      primary: 'button-primary',
      secondary: 'button-secondary',
      outline: 'button-outline',
      ghost: 'button-ghost',
    },
    
    // Label components
    label: 'label-base',
    labelRequired: 'label-base label-required',
    
    // Text components
    error: 'error-text',
    hint: 'hint-text',
    help: 'help-text',
    
    // Card components
    card: 'card-base',
    cardHover: 'card-base card-hover',
    cardSelected: 'card-base card-selected',
    cardDisabled: 'card-base card-disabled',
    
    // Specific cards
    attendeeCard: 'attendee-card',
    ticketCard: 'ticket-card',
    paymentSection: 'payment-section',
  },
  
  // Spacing patterns
  spacing: {
    formSection: 'form-section',
    formSubsection: 'form-subsection',
    sectionHeader: 'form-section-header',
    stack: {
      sm: 'stack-sm',
      md: 'stack',
      lg: 'stack-lg',
      xl: 'stack-xl',
    },
    cardPadding: 'p-6',
    cardPaddingMobile: 'p-4 sm:p-6',
    modalPadding: 'p-4 sm:p-6',
  },
  
  // Layout patterns
  layouts: {
    registration: 'registration-container',
    step: 'registration-step',
    stepHeader: 'registration-header',
    formRow: 'form-row',
    formStack: 'form-stack',
    orderItem: 'order-item',
    orderTotal: 'order-total',
  },
  
  // Responsive utilities
  responsive: {
    mobileOnly: 'mobile-only',
    desktopOnly: 'desktop-only',
    tabletUp: 'tablet-up',
  },
  
  // State utilities
  states: {
    error: 'field-error',
    success: 'field-success',
    warning: 'field-warning',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
  },
  
  // Animation utilities
  animations: {
    shimmer: 'animate-shimmer',
    fadeIn: 'animate-fade-in',
    slideUp: 'animate-slide-up',
  },
  
  // Masonic theme utilities
  masonic: {
    text: {
      navy: 'masonic-text',
      gold: 'gold-text',
    },
    background: {
      navy: 'masonic-bg',
      gold: 'gold-bg',
      gradient: 'masonic-gradient',
      goldGradient: 'masonic-gold-gradient',
    },
    border: {
      navy: 'masonic-border',
      gold: 'gold-border',
    },
    divider: 'masonic-divider',
  },
} as const

// Type-safe helper functions
export function getFieldSizeClass(size: keyof typeof designTokens.fieldSizes): string {
  return designTokens.fieldSizes[size]
}

export function getFieldPatternSize(
  form: keyof typeof designTokens.fieldPatterns,
  field: string
): string {
  const patterns = designTokens.fieldPatterns[form]
  return patterns[field as keyof typeof patterns] || designTokens.fieldSizes.md
}

export function getGridClass(variant: keyof typeof designTokens.grids): string {
  return designTokens.grids[variant]
}

export function getComponentClass(
  component: keyof typeof designTokens.components
): string | Record<string, string> {
  return designTokens.components[component]
}

export function getSpacingClass(
  type: keyof typeof designTokens.spacing
): string | Record<string, string> {
  return designTokens.spacing[type]
}

// Utility function to combine classes
export function combineClasses(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// Form field size mapping for common patterns
export const commonFieldMappings = {
  // Personal information
  title: 'xs',
  firstName: 'sm',
  lastName: 'sm',
  fullName: 'md',
  email: 'xl',
  phone: 'md',
  
  // Address information
  addressLine1: 'xl',
  addressLine2: 'xl',
  city: 'md',
  state: 'xs',
  postalCode: 'xs',
  country: 'md',
  
  // Masonic information
  grandLodge: 'xl',
  lodge: 'lg',
  lodgeNumber: 'xs',
  rank: 'xs',
  
  // Other common fields
  notes: 'xl',
  dietary: 'xl',
  specialRequirements: 'xl',
  contactPreference: 'md',
} as const

// Export type definitions for type safety
export type FieldSize = keyof typeof designTokens.fieldSizes
export type GridVariant = keyof typeof designTokens.grids
export type ComponentKey = keyof typeof designTokens.components
export type SpacingKey = keyof typeof designTokens.spacing
export type FieldMapping = keyof typeof commonFieldMappings