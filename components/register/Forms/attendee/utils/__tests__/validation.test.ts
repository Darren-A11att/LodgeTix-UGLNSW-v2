import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePhone,
  validateName,
  validateAttendee,
  validateGrandOfficerFields,
  validateContactPreference,
} from '../validation';
import { createMockAttendee, createMockGuest } from '../../../__tests__/setup';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user+tag@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should validate phone numbers', () => {
      expect(validatePhone('0400000000')).toBe(true);
      expect(validatePhone('0400 000 000')).toBe(true);
      expect(validatePhone('+61400000000')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('')).toBe(false);
      expect(validatePhone('abc')).toBe(false);
    });
  });

  describe('validateName', () => {
    it('should validate names between 2-20 characters', () => {
      expect(validateName('Jo')).toBe(true);
      expect(validateName('John')).toBe(true);
      expect(validateName('A very long name here')).toBe(true); // exactly 20 chars
    });

    it('should reject invalid names', () => {
      expect(validateName('J')).toBe(false);
      expect(validateName('A very long name here!')).toBe(false); // 21 chars
      expect(validateName('')).toBe(false);
      expect(validateName(' ')).toBe(false);
    });
  });

  describe('validateGrandOfficerFields', () => {
    it('should pass for non-GL ranks', () => {
      const attendee = createMockAttendee({ rank: 'MM' });
      expect(validateGrandOfficerFields(attendee)).toBe(true);
    });

    it('should require Grand Officer status for GL rank', () => {
      const attendee = createMockAttendee({ rank: 'GL' });
      expect(validateGrandOfficerFields(attendee)).toBe(false);
      
      attendee.grandOfficerStatus = 'Past';
      expect(validateGrandOfficerFields(attendee)).toBe(true);
    });

    it('should require role for Present Grand Officers', () => {
      const attendee = createMockAttendee({ 
        rank: 'GL',
        grandOfficerStatus: 'Present'
      });
      expect(validateGrandOfficerFields(attendee)).toBe(false);
      
      attendee.presentGrandOfficerRole = 'Grand Master';
      expect(validateGrandOfficerFields(attendee)).toBe(true);
    });

    it('should require other description when role is Other', () => {
      const attendee = createMockAttendee({ 
        rank: 'GL',
        grandOfficerStatus: 'Present',
        presentGrandOfficerRole: 'Other'
      });
      expect(validateGrandOfficerFields(attendee)).toBe(false);
      
      attendee.otherGrandOfficerRole = 'Special Role';
      expect(validateGrandOfficerFields(attendee)).toBe(true);
    });
  });

  describe('validateContactPreference', () => {
    it('should always pass for primary attendees', () => {
      const attendee = createMockAttendee({ isPrimary: true });
      expect(validateContactPreference(attendee)).toBe(true);
    });

    it('should validate preferences for non-primary attendees', () => {
      const attendee = createMockAttendee({ isPrimary: false });
      
      attendee.contactPreference = 'directly';
      expect(validateContactPreference(attendee)).toBe(true);
      
      attendee.contactPreference = 'primaryattendee';
      expect(validateContactPreference(attendee)).toBe(true);
      
      attendee.contactPreference = 'providelater';
      expect(validateContactPreference(attendee)).toBe(true);
      
      attendee.contactPreference = 'Invalid';
      expect(validateContactPreference(attendee)).toBe(false);
    });
  });

  describe('validateAttendee', () => {
    it('should validate complete Mason attendee', () => {
      const mason = createMockAttendee({
        rank: 'MM',
        grand_lodge_id: 'gl-123',
        lodge_id: 'lodge-456',
      });

      const result = validateAttendee(mason);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require Grand Officer details for GL rank', () => {
      const mason = createMockAttendee({
        rank: 'GL',
        grandOfficerStatus: null,
      });

      const result = validateAttendee(mason);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'grandOfficerStatus',
        message: 'Grand Officer status is required',
      });
    });

    it('should validate Guest attendee', () => {
      const guest = createMockGuest({
        contactPreference: 'directly',
      });

      const result = validateAttendee(guest);
      expect(result.isValid).toBe(true);
    });

    it('should require lodge for primary Masons', () => {
      const mason = createMockAttendee({
        isPrimary: true,
        rank: 'MM',
        grand_lodge_id: 'gl-123',
        lodge_id: null,
        lodgeNameNumber: null,
      });

      const result = validateAttendee(mason);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'lodge_id',
        message: 'Lodge is required',
      });
    });

    it('should validate name length restrictions', () => {
      const attendee = createMockAttendee({
        firstName: 'J', // too short
        lastName: 'A very long last name here!', // too long
      });

      const result = validateAttendee(attendee);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'firstName',
        message: 'First name must be 2-20 characters',
      });
      expect(result.errors).toContainEqual({
        field: 'lastName',
        message: 'Last name must be 2-20 characters',
      });
    });
  });
});