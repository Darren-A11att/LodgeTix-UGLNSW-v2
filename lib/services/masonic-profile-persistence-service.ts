/**
 * Masonic Profile Persistence Service
 * 
 * Handles the mapping and persistence of masonic data from Zustand stores
 * to normalized database records, following the design decisions from BUG-003:
 * 
 * - attendees → contacts → masonic_profiles (via contact_id)
 * - masonic_profiles created only for attendee_type = 'mason' with complete data
 * - contacts required first before masonic_profiles
 * - Dual storage: normalized tables + JSONB for performance
 */

import { createClient } from '@/utils/supabase/server';
import { UnifiedAttendeeData } from '@/lib/registration-types';

export interface MasonicProfileData {
  masonic_title?: string;
  rank?: string;
  grand_rank?: string;
  grand_officer?: string;
  grand_office?: string;
  lodge_id?: string;
  grand_lodge_id?: string;
}

export interface MasonicValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface MasonicProfileCreateResult {
  success: boolean;
  masonic_profile_id?: string;
  error?: string;
  validation?: MasonicValidationResult;
}

export class MasonicProfilePersistenceService {
  
  /**
   * Extract masonic data from Zustand attendee data and map to database schema
   */
  static extractMasonicDataFromAttendee(attendee: UnifiedAttendeeData): MasonicProfileData {
    // Only extract if this is a mason attendee
    if (!this.isMasonAttendee(attendee)) {
      return {};
    }

    const masonicData: MasonicProfileData = {};

    // Map masonic title
    if (attendee.title || attendee.masonicTitle) {
      masonicData.masonic_title = attendee.title || attendee.masonicTitle;
    }

    // Map rank
    if (attendee.rank) {
      masonicData.rank = attendee.rank;
    }

    // Map grand officer information
    if (attendee.grandOfficerStatus && attendee.presentGrandOfficerRole) {
      // Combine status and role for grand_officer field
      masonicData.grand_officer = attendee.grandOfficerStatus;
      masonicData.grand_office = attendee.presentGrandOfficerRole;
      
      // Derive grand_rank from grand officer status
      if (attendee.grandOfficerStatus === 'Present') {
        masonicData.grand_rank = `Present ${attendee.presentGrandOfficerRole}`;
      } else if (attendee.grandOfficerStatus === 'Past') {
        masonicData.grand_rank = `Past ${attendee.presentGrandOfficerRole}`;
      }
    } else if (attendee.otherGrandOfficerRole) {
      masonicData.grand_officer = 'Past';
      masonicData.grand_office = attendee.otherGrandOfficerRole;
      masonicData.grand_rank = `Past ${attendee.otherGrandOfficerRole}`;
    }

    // Map lodge affiliations with UUID conversion
    if (attendee.lodge_id || attendee.lodgeOrganisationId) {
      const lodgeId = attendee.lodge_id || attendee.lodgeOrganisationId;
      masonicData.lodge_id = this.convertToUUID(lodgeId);
    }

    if (attendee.grand_lodge_id || attendee.grandLodgeOrganisationId) {
      const grandLodgeId = attendee.grand_lodge_id || attendee.grandLodgeOrganisationId;
      masonicData.grand_lodge_id = this.convertToUUID(grandLodgeId);
    }

    return masonicData;
  }

  /**
   * Validate masonic data before database insertion
   */
  static validateMasonicData(data: MasonicProfileData): MasonicValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check masonic affiliation constraint (either lodge_id OR grand_lodge_id required)
    if (!data.lodge_id && !data.grand_lodge_id) {
      errors.push('Either lodge_id or grand_lodge_id must be provided for masonic profiles');
    }

    // Validate UUID formats
    if (data.lodge_id && !this.isValidUUID(data.lodge_id)) {
      errors.push('lodge_id must be a valid UUID');
    }

    if (data.grand_lodge_id && !this.isValidUUID(data.grand_lodge_id)) {
      errors.push('grand_lodge_id must be a valid UUID');
    }

    // Validate field lengths (based on database schema)
    if (data.masonic_title && data.masonic_title.length > 50) {
      errors.push('masonic_title cannot exceed 50 characters');
    }

    if (data.rank && data.rank.length > 50) {
      errors.push('rank cannot exceed 50 characters');
    }

    if (data.grand_office && data.grand_office.length > 100) {
      errors.push('grand_office cannot exceed 100 characters');
    }

    // Add warnings for missing optional but useful data
    if (!data.rank) {
      warnings.push('No masonic rank provided');
    }

    if (!data.masonic_title) {
      warnings.push('No masonic title provided');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Create masonic_profiles record in database
   */
  static async createMasonicProfile(
    contactId: string, 
    masonicData: MasonicProfileData
  ): Promise<MasonicProfileCreateResult> {
    
    try {
      // Validate input data
      const validation = this.validateMasonicData(masonicData);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`,
          validation
        };
      }

      // Validate contact_id format
      if (!this.isValidUUID(contactId)) {
        return {
          success: false,
          error: 'contact_id must be a valid UUID'
        };
      }

      const supabase = await createClient();

      // Check if contact exists
      const { data: existingContact, error: contactError } = await supabase
        .from('contacts')
        .select('contact_id')
        .eq('contact_id', contactId)
        .single();

      if (contactError || !existingContact) {
        return {
          success: false,
          error: `Contact with ID ${contactId} not found`
        };
      }

      // Check if masonic profile already exists for this contact
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('masonic_profiles')
        .select('masonic_profile_id')
        .eq('contact_id', contactId)
        .single();

      if (existingProfile) {
        // Update existing profile
        const { data: updatedProfile, error: updateError } = await supabase
          .from('masonic_profiles')
          .update({
            ...masonicData,
            updated_at: new Date().toISOString()
          })
          .eq('contact_id', contactId)
          .select('masonic_profile_id')
          .single();

        if (updateError) {
          return {
            success: false,
            error: `Failed to update masonic profile: ${updateError.message}`
          };
        }

        return {
          success: true,
          masonic_profile_id: updatedProfile.masonic_profile_id,
          validation
        };
      } else {
        // Create new profile
        const { data: newProfile, error: createError } = await supabase
          .from('masonic_profiles')
          .insert({
            contact_id: contactId,
            ...masonicData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('masonic_profile_id')
          .single();

        if (createError) {
          return {
            success: false,
            error: `Failed to create masonic profile: ${createError.message}`
          };
        }

        return {
          success: true,
          masonic_profile_id: newProfile.masonic_profile_id,
          validation
        };
      }

    } catch (error) {
      return {
        success: false,
        error: `Unexpected error creating masonic profile: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Process attendee array and create masonic profiles for mason attendees
   */
  static async processAttendeesForMasonicProfiles(
    attendees: UnifiedAttendeeData[],
    contactIdMap: Record<string, string> // attendeeId -> contactId mapping
  ): Promise<{
    success: boolean;
    created: Array<{ attendeeId: string; masonicProfileId: string }>;
    errors: Array<{ attendeeId: string; error: string }>;
  }> {
    
    const created: Array<{ attendeeId: string; masonicProfileId: string }> = [];
    const errors: Array<{ attendeeId: string; error: string }> = [];

    for (const attendee of attendees) {
      // Only process mason attendees
      if (!this.isMasonAttendee(attendee)) {
        continue;
      }

      const attendeeId = attendee.attendeeId || attendee.id;
      if (!attendeeId) {
        errors.push({ attendeeId: 'unknown', error: 'Attendee missing ID' });
        continue;
      }

      const contactId = contactIdMap[attendeeId];
      if (!contactId) {
        errors.push({ 
          attendeeId, 
          error: 'No contact_id found for mason attendee (contacts required first)' 
        });
        continue;
      }

      // Extract and create masonic profile
      const masonicData = this.extractMasonicDataFromAttendee(attendee);
      const result = await this.createMasonicProfile(contactId, masonicData);

      if (result.success && result.masonic_profile_id) {
        created.push({ 
          attendeeId, 
          masonicProfileId: result.masonic_profile_id 
        });
      } else {
        errors.push({ 
          attendeeId, 
          error: result.error || 'Unknown error creating masonic profile' 
        });
      }
    }

    return {
      success: errors.length === 0,
      created,
      errors
    };
  }

  /**
   * Generate masonic_status JSONB for attendees table
   */
  static generateMasonicStatusJsonb(attendee: UnifiedAttendeeData): object | null {
    if (!this.isMasonAttendee(attendee)) {
      return null;
    }

    return {
      rank: attendee.rank,
      grand_lodge_id: attendee.grand_lodge_id || attendee.grandLodgeOrganisationId,
      lodge_id: attendee.lodge_id || attendee.lodgeOrganisationId,
      lodgeNameNumber: attendee.lodgeNameNumber,
      grandOfficerStatus: attendee.grandOfficerStatus,
      presentGrandOfficerRole: attendee.presentGrandOfficerRole,
      attendeeType: attendee.attendeeType,
      title: attendee.title || attendee.masonicTitle,
      otherGrandOfficerRole: attendee.otherGrandOfficerRole,
      postNominals: attendee.postNominals,
      grandLodgeName: attendee.grandLodgeName,
      lodgeName: attendee.lodgeName
    };
  }

  // --- UTILITY METHODS ---

  /**
   * Check if attendee is a mason and has masonic data
   */
  private static isMasonAttendee(attendee: UnifiedAttendeeData): boolean {
    const isMason = attendee.attendeeType === 'mason' || attendee.type === 'mason';
    const hasMasonicData = !!(
      attendee.rank || 
      attendee.lodge_id || 
      attendee.grand_lodge_id ||
      attendee.lodgeOrganisationId ||
      attendee.grandLodgeOrganisationId
    );
    
    return isMason && hasMasonicData;
  }

  /**
   * Convert string/number ID to UUID string
   */
  private static convertToUUID(value: string | number | null | undefined): string | undefined {
    if (!value) return undefined;
    
    const stringValue = String(value);
    
    // If already a UUID, return as-is
    if (this.isValidUUID(stringValue)) {
      return stringValue;
    }
    
    // If it's a number, it might be a legacy ID that needs conversion
    // For now, return undefined and log warning
    console.warn(`Non-UUID value provided for masonic profile: ${stringValue}`);
    return undefined;
  }

  /**
   * Validate UUID format
   */
  private static isValidUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}

export default MasonicProfilePersistenceService;