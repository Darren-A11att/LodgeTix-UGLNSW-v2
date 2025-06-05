import { describe, it, expect } from 'vitest';
import {
  handleTitleChange,
  shouldShowGrandOfficerFields,
  shouldShowContactFields,
  getRequiredFields,
} from '../businessLogic';
import { createMockAttendee } from '../../../__tests__/setup';

describe('Business Logic', () => {
  describe('handleTitleChange', () => {
    it('should set rank to IM for W Bro', () => {
      const result = handleTitleChange('W Bro', 'MM');
      expect(result).toEqual({ title: 'W Bro', rank: 'IM' });
    });

    it('should set rank to GL for grand titles', () => {
      const result = handleTitleChange('RW Bro', 'MM');
      expect(result).toEqual({ title: 'RW Bro', rank: 'GL' });
      
      const result2 = handleTitleChange('VW Bro', 'MM');
      expect(result2).toEqual({ title: 'VW Bro', rank: 'GL' });
      
      const result3 = handleTitleChange('MW Bro', 'MM');
      expect(result3).toEqual({ title: 'MW Bro', rank: 'GL' });
    });

    it('should only update title for other cases', () => {
      const result = handleTitleChange('Bro', 'MM');
      expect(result).toEqual({ title: 'Bro' });
    });

    it('should not change rank if already GL', () => {
      const result = handleTitleChange('W Bro', 'GL');
      expect(result).toEqual({ title: 'W Bro' }); // doesn't suggest IM if already GL
    });
  });

  describe('shouldShowGrandOfficerFields', () => {
    it('should show for Mason with GL rank', () => {
      const mason = createMockAttendee({ attendeeType: 'mason', rank: 'GL' });
      expect(shouldShowGrandOfficerFields(mason)).toBe(true);
    });

    it('should not show for other ranks', () => {
      const mason = createMockAttendee({ attendeeType: 'mason', rank: 'MM' });
      expect(shouldShowGrandOfficerFields(mason)).toBe(false);
    });

    it('should not show for Guest', () => {
      const guest = createMockAttendee({ attendeeType: 'Guest' });
      expect(shouldShowGrandOfficerFields(guest)).toBe(false);
    });
  });

  describe('shouldShowContactFields', () => {
    it('should show for primary attendees', () => {
      const attendee = createMockAttendee({ isPrimary: true });
      expect(shouldShowContactFields(attendee)).toBe(true);
    });

    it('should show for attendees with Direct contact preference', () => {
      const attendee = createMockAttendee({ 
        isPrimary: false,
        contactPreference: 'directly'
      });
      expect(shouldShowContactFields(attendee)).toBe(true);
    });

    it('should not show for non-primary attendees with other preferences', () => {
      const attendee = createMockAttendee({ 
        isPrimary: false,
        contactPreference: 'primaryattendee'
      });
      expect(shouldShowContactFields(attendee)).toBe(false);
    });
  });

  describe('getRequiredFields', () => {
    it('should return basic fields for all attendees', () => {
      const attendee = createMockAttendee();
      const required = getRequiredFields(attendee);
      
      expect(required).toContain('title');
      expect(required).toContain('firstName');
      expect(required).toContain('lastName');
    });

    it('should include rank for Mason', () => {
      const mason = createMockAttendee({ attendeeType: 'mason' });
      const required = getRequiredFields(mason);
      
      expect(required).toContain('rank');
    });

    it('should include Grand Officer fields for GL rank', () => {
      const mason = createMockAttendee({ 
        attendeeType: 'mason',
        rank: 'GL',
        grandOfficerStatus: 'Present',
        isPrimary: true
      });
      const required = getRequiredFields(mason);
      
      expect(required).toContain('grandOfficerStatus');
      expect(required).toContain('presentGrandOfficerRole');
    });

    it('should include contact fields for primary attendees', () => {
      const attendee = createMockAttendee({ isPrimary: true });
      const required = getRequiredFields(attendee);
      
      expect(required).toContain('primaryEmail');
      expect(required).toContain('primaryPhone');
    });

    it('should not include contact fields for non-primary with indirect contact', () => {
      const attendee = createMockAttendee({ 
        isPrimary: false,
        contactPreference: 'primaryattendee'
      });
      const required = getRequiredFields(attendee);
      
      expect(required).not.toContain('primaryEmail');
      expect(required).not.toContain('primaryPhone');
    });
  });
});