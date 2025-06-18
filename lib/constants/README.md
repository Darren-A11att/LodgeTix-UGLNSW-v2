# Company Details Module

A centralized TypeScript module for managing LodgeTix company information, contact details, and formatting utilities across all legal pages and components.

## Overview

This module provides:
- ✅ Centralized company information (legal name, ABN, address, contact details)
- ✅ Brand positioning variants for different contexts
- ✅ Utility functions for consistent formatting
- ✅ Date formatters for legal documents
- ✅ TypeScript interfaces for type safety
- ✅ Pre-formatted strings for common use cases

## Quick Start

### Basic Usage

```typescript
import { 
  COMPANY_INFO, 
  FORMATTED_STRINGS 
} from '@/lib/constants/company-details';

// Use company information
console.log(COMPANY_INFO.tradingName); // "LodgeTix"
console.log(COMPANY_INFO.legalName);   // "Winding Stair Pty. Limited"
console.log(COMPANY_INFO.abn);         // "94687923128"

// Use pre-formatted strings
const phoneLink = FORMATTED_STRINGS.PHONE_LINK;     // "tel:0408925926"
const emailLink = FORMATTED_STRINGS.EMAIL_LINK;     // "mailto:info@lodgetix.io"
const fullAddress = FORMATTED_STRINGS.FULL_ADDRESS; // "66 Goulburn Street, Sydney NSW 2000, Australia"
```

### Contact Information

```typescript
import { ContactDisplayData } from '@/lib/constants/company-details';

// Use in contact pages
const contactInfo = ContactDisplayData.fullContact;
console.log(contactInfo.phone);        // "0408 925 926"
console.log(contactInfo.phoneLink);    // "tel:0408925926"
console.log(contactInfo.supportEmail); // "support@lodgetix.io"
```

### Legal Documents

```typescript
import { 
  COMPANY_DESCRIPTIONS, 
  DateFormatters,
  CompanyFormatters 
} from '@/lib/constants/company-details';

// For terms of service, privacy policy, etc.
const legalDescription = COMPANY_DESCRIPTIONS.legal;
const lastUpdated = DateFormatters.getLastUpdatedDate();
const jurisdiction = CompanyFormatters.getJurisdiction();
```

## Available Exports

### Core Constants

- `COMPANY_INFO` - Complete company information object
- `BRAND_POSITIONING` - Brand positioning variants
- `COMPANY_DESCRIPTIONS` - Description variants for different contexts
- `FORMATTED_STRINGS` - Pre-formatted common strings

### Utility Functions

- `CompanyFormatters` - Address, phone, email, and legal formatting utilities
- `DateFormatters` - Date formatting for Australian context and legal documents
- `ContactDisplayData` - Ready-to-use contact information for UI components

### TypeScript Types

- `ICompanyInfo` - Company information interface
- `IAddress` - Address structure interface
- `IContactDetails` - Contact details interface
- `IJurisdiction` - Legal jurisdiction interface
- `IBrandPositioning` - Brand positioning interface

## Common Use Cases

### 1. Legal Pages (Terms, Privacy, etc.)

```typescript
import { 
  COMPANY_INFO, 
  COMPANY_DESCRIPTIONS, 
  DateFormatters,
  FORMATTED_STRINGS 
} from '@/lib/constants/company-details';

export function TermsPage() {
  return (
    <div>
      <h1>Terms of Service</h1>
      <p>Last updated: {DateFormatters.getLastUpdatedDate()}</p>
      
      <p>
        By using {COMPANY_INFO.tradingName} operated by {COMPANY_INFO.legalName} 
        (ABN: {COMPANY_INFO.abn}), you agree to these terms.
      </p>
      
      <div className="contact-info">
        <p>{FORMATTED_STRINGS.LEGAL_ENTITY}</p>
        {FORMATTED_STRINGS.ADDRESS_LINES.map(line => <p>{line}</p>)}
        <p>Email: <a href={FORMATTED_STRINGS.SUPPORT_EMAIL_LINK}>
          {COMPANY_INFO.contact.supportEmail}
        </a></p>
      </div>
    </div>
  );
}
```

### 2. Contact Pages

```typescript
import { ContactDisplayData, FORMATTED_STRINGS } from '@/lib/constants/company-details';

export function ContactPage() {
  const { fullContact } = ContactDisplayData;
  
  return (
    <div>
      <h1>Contact Us</h1>
      
      <div className="company-info">
        <p>{fullContact.companyName}</p>
        <p>ABN: {fullContact.abn}</p>
        {fullContact.address.map(line => <p key={line}>{line}</p>)}
        
        <p>
          <a href={fullContact.phoneLink}>{fullContact.phone}</a>
        </p>
        <p>
          <a href={fullContact.supportEmailLink}>{fullContact.supportEmail}</a>
        </p>
      </div>
    </div>
  );
}
```

### 3. Footer Components

```typescript
import { 
  COMPANY_INFO, 
  BRAND_POSITIONING, 
  FORMATTED_STRINGS 
} from '@/lib/constants/company-details';

export function Footer() {
  return (
    <footer>
      <div>
        <h3>{COMPANY_INFO.tradingName}</h3>
        <p>{BRAND_POSITIONING.primary}</p>
        
        <div className="legal-info">
          <p>{COMPANY_INFO.legalName}</p>
          <p>ABN: {COMPANY_INFO.abn}</p>
          <p>{FORMATTED_STRINGS.JURISDICTION}</p>
        </div>
      </div>
    </footer>
  );
}
```

### 4. Email Templates

```typescript
import { 
  COMPANY_INFO, 
  CompanyFormatters 
} from '@/lib/constants/company-details';

export function EmailSignature() {
  return (
    <div className="email-signature">
      <p><strong>{COMPANY_INFO.tradingName}</strong></p>
      <p>{CompanyFormatters.getFullAddress()}</p>
      <p>
        Phone: <a href={CompanyFormatters.getPhoneLink()}>
          {COMPANY_INFO.contact.phone}
        </a>
      </p>
      <p>
        Email: <a href={CompanyFormatters.getEmailLink(true)}>
          {COMPANY_INFO.contact.supportEmail}
        </a>
      </p>
    </div>
  );
}
```

## Formatting Utilities

### Address Formatting

```typescript
import { CompanyFormatters } from '@/lib/constants/company-details';

// Single line address
const fullAddress = CompanyFormatters.getFullAddress();
// "66 Goulburn Street, Sydney NSW 2000, Australia"

// Multi-line address array
const addressLines = CompanyFormatters.getAddressLines();
// ["66 Goulburn Street", "Sydney NSW 2000", "Australia"]

// Custom separator
const addressWithPipes = CompanyFormatters.getFullAddress(' | ');
// "66 Goulburn Street | Sydney NSW 2000 | Australia"
```

### Contact Formatting

```typescript
import { CompanyFormatters } from '@/lib/constants/company-details';

// Phone links
const phoneLink = CompanyFormatters.getPhoneLink();
// "tel:0408925926"

// Email links
const emailLink = CompanyFormatters.getEmailLink();
// "mailto:info@lodgetix.io"

const supportEmailLink = CompanyFormatters.getEmailLink(true);
// "mailto:support@lodgetix.io"
```

### Legal Formatting

```typescript
import { CompanyFormatters } from '@/lib/constants/company-details';

// Complete legal entity
const legalEntity = CompanyFormatters.getLegalEntity();
// "Winding Stair Pty. Limited, ABN: 94687923128"

// Trading name with legal context
const tradingName = CompanyFormatters.getTradingName();
// "'LodgeTix' is a Event Ticketing marketplace platform operated by Winding Stair Pty. Limited"

// Jurisdiction
const jurisdiction = CompanyFormatters.getJurisdiction();
// "Governed by the Laws of New South Wales, Australia"
```

### Date Formatting

```typescript
import { DateFormatters } from '@/lib/constants/company-details';

// Current date in Australian format
const currentDate = DateFormatters.getCurrentDateAU();
// "18 June 2025"

// Last updated date for legal documents
const lastUpdated = DateFormatters.getLastUpdatedDate();
// "18 June 2025"

// Effective date with prefix
const effectiveDate = DateFormatters.getEffectiveDate();
// "Effective as of 18 June 2025"

// Custom date formatting
const customDate = DateFormatters.formatDateAU(new Date(), {
  year: 'numeric',
  month: 'short',
  day: 'numeric'
});
// "18 Jun 2025"
```

## Company Information Reference

```typescript
COMPANY_INFO = {
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
}
```

## Best Practices

1. **Import only what you need** to keep bundle size minimal
2. **Use FORMATTED_STRINGS** for common use cases to avoid repeated formatting
3. **Use DateFormatters** for consistent Australian date formatting
4. **Use CompanyFormatters utilities** for dynamic formatting needs
5. **Import types** when you need them for props or component interfaces
6. **Use COMPANY_DESCRIPTIONS** variants for context-appropriate messaging

## Files

- `company-details.ts` - Main module with all constants and utilities
- `example-usage.tsx` - Comprehensive examples showing integration patterns  
- `README.md` - This documentation file

## Integration

This module is designed to replace hardcoded company information across:
- Legal pages (terms, privacy, refund policy)
- Contact pages and forms
- Footer components  
- Email templates
- Error pages
- About pages

For questions or updates to company information, update the constants in `company-details.ts` and all consuming components will automatically reflect the changes.