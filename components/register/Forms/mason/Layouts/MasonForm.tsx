import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { BasicInfo } from '@/components/register/Forms/basic-details/BasicInfo';
import { ContactInfo } from '@/components/register/Forms/basic-details/ContactInfo';
import { AdditionalInfo } from '@/components/register/Forms/basic-details/AdditionalInfo';
import { GrandLodgeSelection } from '../lib/GrandLodgeSelection';
import { LodgeSelection } from '../lib/LodgeSelection';
import { GrandOfficerFields } from '../utils/GrandOfficerFields';
import { useAttendeeDataWithDebounce } from '@/components/register/Forms/attendee/lib/useAttendeeData';
import { FormProps } from '@/components/register/Forms/attendee/types';
import { useRegistrationStore } from '@/lib/registrationStore';
import { shouldShowContactFields, shouldShowConfirmationMessage, handleTitleChange, handleRankChange, isGrandTitle } from '@/components/register/Forms/attendee/utils/businessLogic';
import { X, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { TextField, SelectField, EmailField, PhoneField, TextareaField } from '../../shared/FieldComponents';
import { MASON_TITLES, MASON_RANKS, GRAND_OFFICER_ROLES } from '../../attendee/utils/constants';
import { CONTACT_PREFERENCES } from '../../attendee/utils/constants';
import { ContactConfirmationMessage } from '../../basic-details/ContactConfirmationMessage';
import { GrandOfficerDropdown } from '../../shared/GrandOfficerDropdown';
import formSaveManager from '@/lib/formSaveManager';

// Constants for form behavior
const DEBOUNCE_DELAY = 300; // 300ms debounce delay for field updates

interface MasonFormProps extends FormProps {
  onRemove?: () => void;
  fieldErrors?: Record<string, Record<string, string>>;
}

export const MasonForm: React.FC<MasonFormProps> = ({ attendeeId, attendeeNumber, isPrimary, onRemove, fieldErrors = {} }) => {
  // Use custom hook with debounce for field updates
  const { attendee, updateField, updateMultipleFields, updateFieldImmediate } = useAttendeeDataWithDebounce(attendeeId, DEBOUNCE_DELAY);
  const [showDietary, setShowDietary] = useState(false);
  const [showAccessibility, setShowAccessibility] = useState(false);
  
  // Get primary mason for lodge selection
  const primaryMason = useRegistrationStore(state => 
    state.attendees.find(a => a.isPrimary && a.attendeeType === 'Mason')
  );
  
  // Determine the label used for this attendee in validation errors
  const attendeeLabel = useMemo(() => {
    if (isPrimary) return 'Primary Mason';
    const masons = useRegistrationStore.getState().attendees.filter(a => a.attendeeType === 'Mason' && !a.isPartner);
    const index = masons.findIndex(a => a.attendeeId === attendeeId);
    return `Mason ${index + 1}`;
  }, [attendeeId, isPrimary]);
  
  // Get field errors for this specific attendee
  const attendeeFieldErrors = fieldErrors[attendeeLabel] || {};
  
  // Initialize useSameLodge state from attendee data
  const [internalUseSameLodge, setInternalUseSameLodge] = useState(false);
  
  // Effect to sync attendee.useSameLodge with internal state
  useEffect(() => {
    if (attendee) {
      setInternalUseSameLodge(!!attendee.useSameLodge);
    }
  }, [attendee?.useSameLodge]);

  const { attendees } = useRegistrationStore();
  
  // For contact confirmation message
  const primaryAttendee = attendees.find(a => a.isPrimary);
  const primaryName = primaryAttendee 
    ? `${primaryAttendee.firstName} ${primaryAttendee.lastName}`
    : 'the primary attendee';
    
  // Keep local state for immediate UI response
  const [localContactPreference, setLocalContactPreference] = useState<string>(
    attendee?.contactPreference || 'PrimaryAttendee'
  );
  
  // Contacts fields logic - use local state for immediate UI response
  const showContactFields = isPrimary || localContactPreference === 'Directly';
  const showConfirmation = !isPrimary && 
    (localContactPreference === 'PrimaryAttendee' || localContactPreference === 'ProvideLater');
  
  // Callbacks for complex field updates
  const handleLodgeChange = useCallback((lodgeId: string, lodgeNameNumber?: string, organisationId?: string) => {
    // Use immediate update to prevent data loss during navigation
    updateFieldImmediate('lodge_id', lodgeId);
    updateFieldImmediate('lodgeNameNumber', lodgeNameNumber || '');
    if (organisationId) {
      updateFieldImmediate('lodgeOrganisationId', organisationId);
    }
  }, [updateFieldImmediate]);
  
  // Sync with data when it changes
  useEffect(() => {
    if (attendee?.contactPreference) {
      setLocalContactPreference(attendee.contactPreference);
    }
  }, [attendee?.contactPreference]);
  
  // Contact preference change with immediate local update
  const handleContactPreferenceChange = useCallback((value: string) => {
    // Update local state immediately for UI
    setLocalContactPreference(value);
    
    // Update store - use immediate to prevent delays
    updateFieldImmediate('contactPreference', value);
    
    // Clear contact fields if not needed
    if (value !== 'Directly') {
      updateFieldImmediate('primaryEmail', '');
      updateFieldImmediate('primaryPhone', '');
    }
    
    console.log('MasonForm - Contact preference changed to:', value);
  }, [updateFieldImmediate]);
  
  // Title change with business logic
  const handleTitleSelection = useCallback((value: string) => {
    const updates = handleTitleChange(value, attendee.rank || '');
    updateMultipleFields(updates);
  }, [updateMultipleFields, attendee.rank]);
  
  // Rank change with business logic
  const handleRankSelection = useCallback((value: string) => {
    const updates = handleRankChange(value, attendee.title || '', attendee.rank || '', attendee.grandOfficerStatus);
    updateMultipleFields(updates);
  }, [updateMultipleFields, attendee.title, attendee.rank, attendee.grandOfficerStatus]);

  // Save form data on blur
  const handleFieldBlur = useCallback(() => {
    formSaveManager.triggerBlurEvents();
  }, []);
  
  if (!attendee) return <div className="p-4 text-center">Loading...</div>;
  
  // Debug log to check attendee data
  console.log('[MasonForm] Attendee data:', {
    attendeeId: attendee.attendeeId,
    isPrimary: attendee.isPrimary,
    grand_lodge_id: attendee.grand_lodge_id,
    lodge_id: attendee.lodge_id,
    useSameLodge: attendee.useSameLodge
  });
  
  // Check if we should show "use same lodge" option
  const showSameLodgeOption = !isPrimary && 
                              attendee.attendeeType === 'Mason' && 
                              primaryMason?.lodge_id;
  
  // Title options for Mason
  const titleOptions = MASON_TITLES.map(title => ({ value: title, label: title }));
  
  // Rank options
  const rankOptions = MASON_RANKS.map(rank => ({ 
    value: rank.value, 
    label: rank.label 
  }));
  
  return (
    <div className="p-4 space-y-4 relative" data-attendee-id={attendeeId}>
      
      {/* Desktop Layout (md and above) */}
      <div className="hidden md:block space-y-4">
        {/* Row 1: Title, First Name, Last Name, Rank */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-2">
            <SelectField
              label="Masonic Title"
              name="title"
              value={attendee.title || ''}
              onChange={handleTitleSelection}
              options={titleOptions}
              required={true}
              updateOnBlur={true}
              error={attendeeFieldErrors.title}
            />
          </div>
          
          <div className="col-span-4">
            <TextField
              label="First Name"
              name="firstName"
              value={attendee.firstName || ''}
              onChange={(value) => updateFieldImmediate('firstName', value)}
              required={true}
              updateOnBlur={true}
              error={attendeeFieldErrors.firstName}
            />
          </div>
          
          <div className="col-span-4">
            <TextField
              label="Last Name"
              name="lastName"
              value={attendee.lastName || ''}
              onChange={(value) => updateFieldImmediate('lastName', value)}
              required={true}
              updateOnBlur={true}
              error={attendeeFieldErrors.lastName}
            />
          </div>
          
          <div className="col-span-2">
            <SelectField
              label="Rank"
              name="rank"
              value={attendee.rank || ''}
              onChange={handleRankSelection}
              options={rankOptions}
              required={true}
              updateOnBlur={true}
              error={attendeeFieldErrors.rank}
            />
          </div>
        </div>
        
        {/* Row 2 (Conditional): Grand Rank, Grand Officer, Grand Office, Other Grand Office */}
        {attendee.rank === 'GL' && (
          <GrandOfficerFields 
            data={attendee}
            onChange={updateFieldImmediate}
            required={isPrimary}
          />
        )}
        
        {/* Row 3: Use Same Lodge option (when applicable) */}
        {showSameLodgeOption && (
          <div className="grid grid-cols-12 gap-4 mb-4">
            <div className="col-span-12">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="use-same-lodge"
                  checked={internalUseSameLodge}
                  onCheckedChange={(checked) => {
                    // Update internal state immediately for UI responsiveness
                    setInternalUseSameLodge(!!checked);
                    
                    // Update store value - use updateFieldImmediate to avoid debounce delay
                    updateFieldImmediate('useSameLodge', !!checked);
                    
                    if (!!checked && primaryMason?.lodge_id && primaryMason?.grand_lodge_id) {
                      // Update both Grand Lodge and Lodge immediately without debounce
                      updateFieldImmediate('grand_lodge_id', primaryMason.grand_lodge_id);
                      updateFieldImmediate('lodge_id', primaryMason.lodge_id);
                      updateFieldImmediate('lodgeNameNumber', primaryMason.lodgeNameNumber || '');
                      // Also copy organisationid fields
                      if (primaryMason.grandLodgeOrganisationId) {
                        updateFieldImmediate('grandLodgeOrganisationId', primaryMason.grandLodgeOrganisationId);
                      }
                      if (primaryMason.lodgeOrganisationId) {
                        updateFieldImmediate('lodgeOrganisationId', primaryMason.lodgeOrganisationId);
                      }
                    }
                  }}
                />
                <Label htmlFor="use-same-lodge" className="cursor-pointer">
                  Use same Lodge as {primaryMason?.firstName || 'Primary Mason'} 
                  {primaryMason?.lodgeNameNumber && ` (${primaryMason.lodgeNameNumber})`}
                </Label>
              </div>
            </div>
          </div>
        )}
        
        {/* Row 4: Grand Lodge, Lodge - only show if not using same lodge */}
        {!internalUseSameLodge && (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
              <GrandLodgeSelection 
                value={attendee.grand_lodge_id}
                onChange={(value, organisationId) => {
                  console.log('[MasonForm] Grand Lodge onChange called with:', value, organisationId);
                  updateFieldImmediate('grand_lodge_id', value);
                  if (organisationId) {
                    updateFieldImmediate('grandLodgeOrganisationId', organisationId);
                  }
                }}
                error={attendeeFieldErrors.grand_lodge_id}
              />
            </div>
            
            <div className="col-span-6">
              <LodgeSelection 
                grand_lodge_id={attendee.grand_lodge_id}
                value={attendee.lodge_id}
                onChange={handleLodgeChange}
                required={isPrimary}
                showUseSameLodge={false} /* Moved to its own row above */
                primaryMason={primaryMason}
                error={attendeeFieldErrors.lodge_id}
              />
            </div>
          </div>
        )}
        
        {/* Row 4: Contact Information (different for primary vs non-primary) */}
        {isPrimary ? (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
              <EmailField
                label="Email Address"
                name="primaryEmail"
                value={attendee.primaryEmail || ''}
                onChange={(value) => updateFieldImmediate('primaryEmail', value)}
                required={true}
                updateOnBlur={true}
                error={attendeeFieldErrors.primaryEmail}
              />
            </div>
            <div className="col-span-6">
              <PhoneField
                label="Mobile Number"
                name="primaryPhone"
                value={attendee.primaryPhone || ''}
                onChange={(value) => updateFieldImmediate('primaryPhone', value)}
                required={true}
                updateOnBlur={true}
                error={attendeeFieldErrors.primaryPhone}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Contact preference for non-primary */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-4">
                <SelectField
                  label="Contact"
                  name="contactPreference"
                  value={localContactPreference}
                  onChange={handleContactPreferenceChange}
                  options={CONTACT_PREFERENCES}
                  required={true}
                  updateOnBlur={true}
                  error={attendeeFieldErrors.contactPreference}
                />
              </div>
              
              {/* Confirmation message in same row, 8 columns wide */}
              {showConfirmation && (
                <div className="col-span-8">
                  <ContactConfirmationMessage
                    contactPreference={localContactPreference}
                    primaryAttendeeName={primaryName}
                  />
                </div>
              )}
            </div>
            
            {/* Contact fields only when preference is "Directly" */}
            {showContactFields && (
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-4">
                  <EmailField
                    label="Email Address"
                    name="primaryEmail"
                    value={attendee.primaryEmail || ''}
                    onChange={(value) => updateFieldImmediate('primaryEmail', value)}
                    required={true}
                    updateOnBlur={true}
                    error={attendeeFieldErrors.primaryEmail}
                  />
                </div>
                <div className="col-span-4">
                  <PhoneField
                    label="Mobile Number"
                    name="primaryPhone"
                    value={attendee.primaryPhone || ''}
                    onChange={(value) => updateFieldImmediate('primaryPhone', value)}
                    required={true}
                    updateOnBlur={true}
                    error={attendeeFieldErrors.primaryPhone}
                  />
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Row 5: Dietary Requirements */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12">
            <TextareaField
              label="Dietary Requirements"
              name="dietaryRequirements"
              value={attendee.dietaryRequirements || ''}
              onChange={(value) => updateField('dietaryRequirements', value)}
              placeholder="E.g., vegetarian, gluten-free, allergies"
              rows={1}
              maxLength={200}
              inputClassName="min-h-[40px] py-1.5"
              updateOnBlur={true}
            />
          </div>
        </div>
        
        {/* Row 6: Special Needs or Accessibility Requirements */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12">
            <TextareaField
              label="Special Needs or Accessibility Requirements"
              name="specialNeeds"
              value={attendee.specialNeeds || ''}
              onChange={(value) => updateField('specialNeeds', value)}
              placeholder="Please list any special needs or accessibility requirements"
              rows={1}
              maxLength={500}
              inputClassName="min-h-[40px] py-1.5"
              updateOnBlur={true}
            />
          </div>
        </div>
      </div>
      
      {/* Mobile Layout (smaller than md) */}
      <div className="md:hidden space-y-4">
        {/* Stack fields vertically */}
        <div className="space-y-4">
          <SelectField
            label="Title"
            name="title"
            value={attendee.title || ''}
            onChange={handleTitleSelection}
            options={titleOptions}
            required={true}
            updateOnBlur={true}
          />
          
          <TextField
            label="First Name"
            name="firstName"
            value={attendee.firstName || ''}
            onChange={(value) => updateFieldImmediate('firstName', value)}
            required={true}
            updateOnBlur={true}
          />
          
          <TextField
            label="Last Name"
            name="lastName"
            value={attendee.lastName || ''}
            onChange={(value) => updateFieldImmediate('lastName', value)}
            required={true}
            updateOnBlur={true}
          />
          
          <SelectField
            label="Rank"
            name="rank"
            value={attendee.rank || ''}
            onChange={handleRankSelection}
            options={rankOptions}
            required={true}
            updateOnBlur={true}
          />
          
          {attendee.rank === 'GL' && (
            <div className="space-y-4">
              <TextField
                label="Grand Rank"
                name="suffix"
                value={attendee.suffix || ''}
                onChange={(value) => updateField('suffix', value)}
                placeholder="PGRNK"
                required={isPrimary}
                updateOnBlur={true}
              />
              
              <SelectField
                label="Grand Officer"
                name="grandOfficerStatus"
                value={attendee.grandOfficerStatus || ''}
                onChange={(value) => {
                  updateFieldImmediate('grandOfficerStatus', value);
                  if (value === 'Past' && attendee.grandOfficerStatus === 'Present') {
                    updateFieldImmediate('presentGrandOfficerRole', '');
                    updateFieldImmediate('otherGrandOfficerRole', '');
                  }
                }}
                options={[
                  { value: 'Present', label: 'Present' },
                  { value: 'Past', label: 'Past' }
                ]}
                required={isPrimary}
                updateOnBlur={true}
              />
              
              {attendee.grandOfficerStatus === 'Present' && (
                <div className="space-y-2">
                  <GrandOfficerDropdown
                    label="Grand Office"
                    name="presentGrandOfficerRole"
                    value={attendee.presentGrandOfficerRole || ''}
                    onChange={(value) => {
                      updateFieldImmediate('presentGrandOfficerRole', value);
                      if (value !== 'Other') {
                        updateFieldImmediate('otherGrandOfficerRole', '');
                      }
                    }}
                    options={GRAND_OFFICER_ROLES.map(role => ({
                      value: role,
                      label: role
                    }))}
                    required={isPrimary}
                    className="relative z-10"
                  />
                </div>
              )}
              
              {attendee.presentGrandOfficerRole === 'Other' && (
                <div className="space-y-2">
                  <TextField
                    label="Other Grand Office"
                    name="otherGrandOfficerRole"
                    value={attendee.otherGrandOfficerRole || ''}
                    onChange={(value) => updateField('otherGrandOfficerRole', value)}
                    placeholder="Enter specific role"
                    required={isPrimary}
                    updateOnBlur={true}
                  />
                </div>
              )}
            </div>
          )}
          
          {/* Use Same Lodge option (when applicable) */}
          {showSameLodgeOption && (
            <div className="mb-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="use-same-lodge-mobile"
                  checked={internalUseSameLodge}
                  onCheckedChange={(checked) => {
                    // Update internal state immediately for UI responsiveness
                    setInternalUseSameLodge(!!checked);
                    
                    // Update store value - use updateFieldImmediate to avoid debounce delay
                    updateFieldImmediate('useSameLodge', !!checked);
                    
                    if (!!checked && primaryMason?.lodge_id && primaryMason?.grand_lodge_id) {
                      // Update both Grand Lodge and Lodge immediately without debounce
                      updateFieldImmediate('grand_lodge_id', primaryMason.grand_lodge_id);
                      updateFieldImmediate('lodge_id', primaryMason.lodge_id);
                      updateFieldImmediate('lodgeNameNumber', primaryMason.lodgeNameNumber || '');
                      // Also copy organisationid fields
                      if (primaryMason.grandLodgeOrganisationId) {
                        updateFieldImmediate('grandLodgeOrganisationId', primaryMason.grandLodgeOrganisationId);
                      }
                      if (primaryMason.lodgeOrganisationId) {
                        updateFieldImmediate('lodgeOrganisationId', primaryMason.lodgeOrganisationId);
                      }
                    }
                  }}
                />
                <Label htmlFor="use-same-lodge-mobile" className="cursor-pointer text-sm">
                  Use same Lodge as {primaryMason?.firstName || 'Primary Mason'} 
                  {primaryMason?.lodgeNameNumber && ` (${primaryMason.lodgeNameNumber})`}
                </Label>
              </div>
            </div>
          )}
          
          {/* Only show lodge selection fields if not using same lodge */}
          {!internalUseSameLodge && (
            <>
              <GrandLodgeSelection 
                value={attendee.grand_lodge_id}
                onChange={(value, organisationId) => {
                  updateFieldImmediate('grand_lodge_id', value);
                  if (organisationId) {
                    updateFieldImmediate('grandLodgeOrganisationId', organisationId);
                  }
                }}
              />
              
              <LodgeSelection 
                grand_lodge_id={attendee.grand_lodge_id}
                value={attendee.lodge_id}
                onChange={handleLodgeChange}
                required={isPrimary}
                showUseSameLodge={false} /* Moved to its own row above */
                primaryMason={primaryMason}
              />
            </>
          )}
          
          {/* Contact fields */}
          {isPrimary ? (
            <>
              <EmailField
                label="Email Address"
                name="primaryEmail"
                value={attendee.primaryEmail || ''}
                onChange={(value) => updateField('primaryEmail', value)}
                required={true}
                updateOnBlur={true}
              />
              <PhoneField
                label="Mobile Number"
                name="primaryPhone"
                value={attendee.primaryPhone || ''}
                onChange={(value) => updateField('primaryPhone', value)}
                required={true}
                updateOnBlur={true}
              />
            </>
          ) : (
            <>
              <div>
                <SelectField
                  label="Contact"
                  name="contactPreference"
                  value={localContactPreference}
                  onChange={handleContactPreferenceChange}
                  options={CONTACT_PREFERENCES}
                  required={true}
                  updateOnBlur={true}
                />
              </div>
              
              {/* Confirmation message directly below contact dropdown */}
              {showConfirmation && (
                <div className="mt-2">
                  <ContactConfirmationMessage
                    contactPreference={localContactPreference}
                    primaryAttendeeName={primaryName}
                  />
                </div>
              )}
              
              {showContactFields && (
                <>
                  <div className="mt-4">
                    <EmailField
                      label="Email Address"
                      name="primaryEmail"
                      value={attendee.primaryEmail || ''}
                      onChange={(value) => updateField('primaryEmail', value)}
                      required={true}
                      updateOnBlur={true}
                    />
                  </div>
                  <div className="mt-4">
                    <PhoneField
                      label="Mobile Number"
                      name="primaryPhone"
                      value={attendee.primaryPhone || ''}
                      onChange={(value) => updateField('primaryPhone', value)}
                      required={true}
                      updateOnBlur={true}
                    />
                  </div>
                </>
              )}
            </>
          )}
          
          {/* Collapsible Dietary Requirements */}
          {showDietary ? (
            <div className="border p-3 rounded-md bg-white relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 rounded-full"
                onClick={() => setShowDietary(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              <TextareaField
                label="Dietary Requirements"
                name="dietaryRequirements"
                value={attendee.dietaryRequirements || ''}
                onChange={(value) => updateField('dietaryRequirements', value)}
                placeholder="E.g., vegetarian, gluten-free, allergies"
                rows={1}
                maxLength={200}
                inputClassName="min-h-[40px] py-1.5"
                updateOnBlur={true}
              />
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full flex justify-between items-center"
              onClick={() => setShowDietary(true)}
            >
              <span>Dietary Requirements</span>
              <Plus className="h-4 w-4" />
            </Button>
          )}
          
          {/* Collapsible Accessibility Requirements */}
          {showAccessibility ? (
            <div className="border p-3 rounded-md bg-white relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 rounded-full"
                onClick={() => setShowAccessibility(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              <TextareaField
                label="Special Needs or Accessibility Requirements"
                name="specialNeeds"
                value={attendee.specialNeeds || ''}
                onChange={(value) => updateField('specialNeeds', value)}
                placeholder="Please list any special needs or accessibility requirements"
                rows={1}
                maxLength={500}
                inputClassName="min-h-[40px] py-1.5"
                updateOnBlur={true}
              />
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full flex justify-between items-center"
              onClick={() => setShowAccessibility(true)}
            >
              <span>Accessibility Requirements</span>
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MasonForm;