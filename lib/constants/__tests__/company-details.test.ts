/**
 * Tests for Company Details Module
 * 
 * These tests ensure the company details module exports the correct information
 * and utility functions work as expected.
 */

import { describe, it, expect } from 'vitest';
import {
  COMPANY_INFO,
  BRAND_POSITIONING,
  COMPANY_DESCRIPTIONS,
  CompanyFormatters,
  DateFormatters,
  ContactDisplayData,
  FORMATTED_STRINGS
} from '../company-details';

describe('Company Details Module', () => {
  describe('COMPANY_INFO', () => {
    it('should have correct legal name', () => {
      expect(COMPANY_INFO.legalName).toBe('Winding Stair Pty. Limited');
    });

    it('should have correct trading name', () => {
      expect(COMPANY_INFO.tradingName).toBe('LodgeTix');
    });

    it('should have correct ABN', () => {
      expect(COMPANY_INFO.abn).toBe('94687923128');
    });

    it('should have complete address information', () => {
      expect(COMPANY_INFO.address.street).toBe('66 Goulburn Street');
      expect(COMPANY_INFO.address.suburb).toBe('Sydney');
      expect(COMPANY_INFO.address.state).toBe('NSW');
      expect(COMPANY_INFO.address.postcode).toBe('2000');
      expect(COMPANY_INFO.address.country).toBe('Australia');
    });

    it('should have contact information', () => {
      expect(COMPANY_INFO.contact.phone).toBe('0408 925 926');
      expect(COMPANY_INFO.contact.email).toBe('info@lodgetix.io');
      expect(COMPANY_INFO.contact.supportEmail).toBe('support@lodgetix.io');
    });

    it('should have jurisdiction information', () => {
      expect(COMPANY_INFO.jurisdiction.state).toBe('New South Wales');
      expect(COMPANY_INFO.jurisdiction.country).toBe('Australia');
      expect(COMPANY_INFO.jurisdiction.governingLaw).toBe('Laws of New South Wales, Australia');
    });
  });

  describe('BRAND_POSITIONING', () => {
    it('should have all positioning variants', () => {
      expect(BRAND_POSITIONING.primary).toContain('Event Ticketing Platform');
      expect(BRAND_POSITIONING.secondary).toContain('ticketing marketplace');
      expect(BRAND_POSITIONING.legal).toContain('operated by Winding Stair');
      expect(BRAND_POSITIONING.marketing).toContain('Masonic event management');
    });
  });

  describe('COMPANY_DESCRIPTIONS', () => {
    it('should have descriptions of varying lengths', () => {
      expect(COMPANY_DESCRIPTIONS.short.length).toBeLessThan(COMPANY_DESCRIPTIONS.medium.length);
      expect(COMPANY_DESCRIPTIONS.medium.length).toBeLessThan(COMPANY_DESCRIPTIONS.long.length);
    });

    it('should have legal description with proper structure', () => {
      expect(COMPANY_DESCRIPTIONS.legal).toContain('LodgeTix');
      expect(COMPANY_DESCRIPTIONS.legal).toContain('Winding Stair Pty. Limited');
      expect(COMPANY_DESCRIPTIONS.legal).toContain('ABN: 94687923128');
    });
  });

  describe('CompanyFormatters', () => {
    describe('getFullAddress', () => {
      it('should return full address with default separator', () => {
        const address = CompanyFormatters.getFullAddress();
        expect(address).toBe('66 Goulburn Street, Sydney NSW 2000, Australia');
      });

      it('should accept custom separator', () => {
        const address = CompanyFormatters.getFullAddress(' | ');
        expect(address).toBe('66 Goulburn Street | Sydney NSW 2000 | Australia');
      });
    });

    describe('getAddressLines', () => {
      it('should return address as array of lines', () => {
        const lines = CompanyFormatters.getAddressLines();
        expect(lines).toHaveLength(3);
        expect(lines[0]).toBe('66 Goulburn Street');
        expect(lines[1]).toBe('Sydney NSW 2000');
        expect(lines[2]).toBe('Australia');
      });
    });

    describe('getPhoneLink', () => {
      it('should return tel: link without spaces', () => {
        const phoneLink = CompanyFormatters.getPhoneLink();
        expect(phoneLink).toBe('tel:0408925926');
        expect(phoneLink).not.toContain(' ');
      });
    });

    describe('getEmailLink', () => {
      it('should return standard email link by default', () => {
        const emailLink = CompanyFormatters.getEmailLink();
        expect(emailLink).toBe('mailto:info@lodgetix.io');
      });

      it('should return support email link when requested', () => {
        const supportEmailLink = CompanyFormatters.getEmailLink(true);
        expect(supportEmailLink).toBe('mailto:support@lodgetix.io');
      });
    });

    describe('getLegalEntity', () => {
      it('should return formatted legal entity with ABN', () => {
        const legalEntity = CompanyFormatters.getLegalEntity();
        expect(legalEntity).toBe('Winding Stair Pty. Limited, ABN: 94687923128');
      });
    });

    describe('getTradingName', () => {
      it('should return trading name with legal context', () => {
        const tradingName = CompanyFormatters.getTradingName();
        expect(tradingName).toContain("'LodgeTix'");
        expect(tradingName).toContain('Winding Stair Pty. Limited');
      });
    });

    describe('getJurisdiction', () => {
      it('should return formatted jurisdiction', () => {
        const jurisdiction = CompanyFormatters.getJurisdiction();
        expect(jurisdiction).toBe('Governed by the Laws of New South Wales, Australia');
      });
    });
  });

  describe('DateFormatters', () => {
    describe('getCurrentDateAU', () => {
      it('should return current date in Australian format', () => {
        const date = DateFormatters.getCurrentDateAU();
        expect(date).toMatch(/^\d{1,2} \w+ \d{4}$/); // e.g., "18 June 2025"
      });
    });

    describe('getLastUpdatedDate', () => {
      it('should return current date for last updated', () => {
        const lastUpdated = DateFormatters.getLastUpdatedDate();
        const current = DateFormatters.getCurrentDateAU();
        expect(lastUpdated).toBe(current);
      });
    });

    describe('formatDateAU', () => {
      it('should format specific date in Australian format', () => {
        const testDate = new Date('2025-06-18');
        const formatted = DateFormatters.formatDateAU(testDate);
        expect(formatted).toMatch(/18 June 2025/);
      });
    });

    describe('getEffectiveDate', () => {
      it('should return effective date with prefix', () => {
        const effectiveDate = DateFormatters.getEffectiveDate();
        expect(effectiveDate).toMatch(/^Effective as of \d{1,2} \w+ \d{4}$/);
      });
    });
  });

  describe('ContactDisplayData', () => {
    describe('supportCards', () => {
      it('should have three support cards', () => {
        expect(ContactDisplayData.supportCards).toHaveLength(3);
      });

      it('should have required fields for each card', () => {
        ContactDisplayData.supportCards.forEach(card => {
          expect(card).toHaveProperty('name');
          expect(card).toHaveProperty('description');
          expect(card).toHaveProperty('email');
          expect(card).toHaveProperty('phone');
        });
      });
    });

    describe('fullContact', () => {
      it('should have all contact information', () => {
        const contact = ContactDisplayData.fullContact;
        expect(contact.companyName).toBe('Winding Stair Pty. Limited');
        expect(contact.tradingAs).toBe('LodgeTix');
        expect(contact.abn).toBe('94687923128');
        expect(contact.address).toHaveLength(3);
        expect(contact.phone).toBe('0408 925 926');
        expect(contact.phoneLink).toBe('tel:0408925926');
        expect(contact.email).toBe('info@lodgetix.io');
        expect(contact.supportEmail).toBe('support@lodgetix.io');
      });
    });
  });

  describe('FORMATTED_STRINGS', () => {
    it('should have all pre-formatted strings', () => {
      expect(FORMATTED_STRINGS.FULL_ADDRESS).toBe('66 Goulburn Street, Sydney NSW 2000, Australia');
      expect(FORMATTED_STRINGS.PHONE_LINK).toBe('tel:0408925926');
      expect(FORMATTED_STRINGS.EMAIL_LINK).toBe('mailto:info@lodgetix.io');
      expect(FORMATTED_STRINGS.SUPPORT_EMAIL_LINK).toBe('mailto:support@lodgetix.io');
      expect(FORMATTED_STRINGS.LEGAL_ENTITY).toBe('Winding Stair Pty. Limited, ABN: 94687923128');
      expect(FORMATTED_STRINGS.JURISDICTION).toBe('Governed by the Laws of New South Wales, Australia');
    });

    it('should have address lines array', () => {
      expect(FORMATTED_STRINGS.ADDRESS_LINES).toHaveLength(3);
      expect(FORMATTED_STRINGS.ADDRESS_LINES[0]).toBe('66 Goulburn Street');
    });

    it('should have last updated date', () => {
      expect(FORMATTED_STRINGS.LAST_UPDATED).toMatch(/^\d{1,2} \w+ \d{4}$/);
    });
  });

  describe('Type safety', () => {
    it('should maintain data integrity', () => {
      expect(COMPANY_INFO.tradingName).toBe('LodgeTix');
      expect(COMPANY_INFO.address.street).toBe('66 Goulburn Street');
      expect(typeof COMPANY_INFO.abn).toBe('string');
    });

    it('should have consistent object structure', () => {
      expect(COMPANY_INFO).toHaveProperty('legalName');
      expect(COMPANY_INFO).toHaveProperty('tradingName');
      expect(COMPANY_INFO).toHaveProperty('abn');
      expect(COMPANY_INFO).toHaveProperty('address');
      expect(COMPANY_INFO).toHaveProperty('contact');
      expect(COMPANY_INFO).toHaveProperty('jurisdiction');
    });
  });

  describe('Email validation', () => {
    it('should have valid email format for all email addresses', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(COMPANY_INFO.contact.email).toMatch(emailRegex);
      expect(COMPANY_INFO.contact.supportEmail).toMatch(emailRegex);
    });
  });

  describe('Phone validation', () => {
    it('should have valid Australian mobile format', () => {
      const phone = COMPANY_INFO.contact.phone;
      expect(phone).toMatch(/^04\d{2} \d{3} \d{3}$/); // Australian mobile format
    });
  });

  describe('ABN validation', () => {
    it('should have 11-digit ABN', () => {
      expect(COMPANY_INFO.abn).toMatch(/^\d{11}$/);
      expect(COMPANY_INFO.abn).toHaveLength(11);
    });
  });
});