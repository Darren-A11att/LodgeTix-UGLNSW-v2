# Task 071: Create MasonForm Composition

## Objective
Create the MasonForm layout composition that brings together all Mason-specific sections into a complete form.

## Dependencies
- Task 041 (BasicInfo)
- Task 042 (ContactInfo)
- Task 043 (AdditionalInfo)
- Task 044 (GrandLodgeSelection)
- Task 045 (LodgeSelection)
- Task 046 (GrandOfficerFields)
- Task 004 (useAttendeeData)

## Reference Files
- `components/register/forms/mason/MasonForm2.tsx`
- Architecture patterns in CLAUDE.md

## Steps

1. Create `components/register/forms/mason/layouts/MasonForm.tsx`:
```typescript
import React, { useCallback } from 'react';
import { BasicInfo } from '../../basic-details/BasicInfo';
import { ContactInfo } from '../../basic-details/ContactInfo';
import { AdditionalInfo } from '../../basic-details/AdditionalInfo';
import { GrandLodgeSelection } from '../lib/GrandLodgeSelection';
import { LodgeSelection } from '../lib/LodgeSelection';
import { GrandOfficerFields } from '../utils/GrandOfficerFields';
import { useAttendeeData } from '../../attendee/lib/useAttendeeData';
import { useRegistrationStore } from '@/lib/registrationStore';
import { FormProps } from '../../attendee/types';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';

export const MasonForm: React.FC<FormProps> = ({ 
  attendeeId, 
  attendeeNumber, 
  isPrimary = false 
}) => {
  const { attendee, updateField } = useAttendeeData(attendeeId);
  const { attendees } = useRegistrationStore();
  
  // Find primary Mason for "use same lodge" functionality
  const primaryMason = attendees.find(a => a.isPrimary && a.attendeeType === 'Mason');
  
  if (!attendee || attendee.attendeeType !== 'Mason') {
    return <div>Invalid attendee type</div>;
  }

  // Handle field changes
  const handleChange = useCallback((field: string, value: any) => {
    updateField(field, value);
  }, [updateField]);

  // Handle lodge-related changes
  const handleGrandLodgeChange = useCallback((grandLodgeId: string) => {
    updateField('grandLodgeId', grandLodgeId);
    // Clear lodge selection when grand lodge changes
    updateField('lodgeId', null);
    updateField('lodgeNameNumber', null);
  }, [updateField]);

  const handleLodgeChange = useCallback((lodgeId: string, lodgeNameNumber?: string) => {
    updateField('lodgeId', lodgeId);
    updateField('lodgeNameNumber', lodgeNameNumber || '');
  }, [updateField]);

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">
              {isPrimary ? 'Your Details' : `Attendee ${attendeeNumber} Details`}
            </h2>
            
            {/* Basic Information */}
            <section>
              <BasicInfo
                data={attendee}
                type="Mason"
                isPrimary={isPrimary}
                onChange={handleChange}
              />
            </section>

            <Separator />

            {/* Lodge Information */}
            <section className="space-y-6">
              <h3 className="text-lg font-semibold">Lodge Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GrandLodgeSelection
                  value={attendee.grandLodgeId}
                  onChange={handleGrandLodgeChange}
                  required={true}
                />
                
                <LodgeSelection
                  grandLodgeId={attendee.grandLodgeId}
                  value={attendee.lodgeId}
                  onChange={handleLodgeChange}
                  required={true}
                  showUseSameLodge={!isPrimary}
                  primaryMason={primaryMason}
                />
              </div>
            </section>

            {/* Grand Officer Fields (conditional) */}
            {attendee.rank === 'GL' && (
              <>
                <Separator />
                <section>
                  <GrandOfficerFields
                    data={attendee}
                    onChange={handleChange}
                    required={isPrimary}
                  />
                </section>
              </>
            )}

            <Separator />

            {/* Contact Information */}
            <section>
              <ContactInfo
                data={attendee}
                isPrimary={isPrimary}
                onChange={handleChange}
              />
            </section>

            <Separator />

            {/* Additional Information */}
            <section>
              <AdditionalInfo
                data={attendee}
                onChange={handleChange}
              />
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

2. Create a variant for compact display:
```typescript
// Compact version for modal or limited space
export const MasonFormCompact: React.FC<FormProps> = ({ 
  attendeeId, 
  attendeeNumber, 
  isPrimary = false 
}) => {
  const { attendee, updateField } = useAttendeeData(attendeeId);
  
  if (!attendee || attendee.attendeeType !== 'Mason') {
    return <div>Invalid attendee type</div>;
  }

  const handleChange = useCallback((field: string, value: any) => {
    updateField(field, value);
  }, [updateField]);

  const handleGrandLodgeChange = useCallback((grandLodgeId: string) => {
    updateField('grandLodgeId', grandLodgeId);
    updateField('lodgeId', null);
    updateField('lodgeNameNumber', null);
  }, [updateField]);

  const handleLodgeChange = useCallback((lodgeId: string, lodgeNameNumber?: string) => {
    updateField('lodgeId', lodgeId);
    updateField('lodgeNameNumber', lodgeNameNumber || '');
  }, [updateField]);

  return (
    <div className="space-y-6">
      {/* All sections in one flow without cards */}
      <BasicInfo
        data={attendee}
        type="Mason"
        isPrimary={isPrimary}
        onChange={handleChange}
      />
      
      <div className="space-y-4">
        <GrandLodgeSelection
          value={attendee.grandLodgeId}
          onChange={handleGrandLodgeChange}
          required={true}
        />
        
        <LodgeSelection
          grandLodgeId={attendee.grandLodgeId}
          value={attendee.lodgeId}
          onChange={handleLodgeChange}
          required={true}
        />
      </div>
      
      {attendee.rank === 'GL' && (
        <GrandOfficerFields
          data={attendee}
          onChange={handleChange}
          required={isPrimary}
        />
      )}
      
      <ContactInfo
        data={attendee}
        isPrimary={isPrimary}
        onChange={handleChange}
      />
      
      <AdditionalInfo
        data={attendee}
        onChange={handleChange}
      />
    </div>
  );
};
```

3. Create a summary display component:
```typescript
// Summary view for review pages
export const MasonFormSummary: React.FC<{ attendeeId: string }> = ({ attendeeId }) => {
  const { attendee } = useAttendeeData(attendeeId);
  
  if (!attendee || attendee.attendeeType !== 'Mason') {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium">Personal Details</h4>
        <p className="text-sm text-gray-600">
          {attendee.title} {attendee.firstName} {attendee.lastName}
          {attendee.rank && ` (${attendee.rank})`}
        </p>
      </div>
      
      <div>
        <h4 className="font-medium">Lodge Details</h4>
        <p className="text-sm text-gray-600">
          {attendee.lodgeNameNumber || 'No lodge selected'}
        </p>
      </div>
      
      {attendee.rank === 'GL' && attendee.grandOfficerStatus && (
        <div>
          <h4 className="font-medium">Grand Officer Status</h4>
          <p className="text-sm text-gray-600">
            {attendee.grandOfficerStatus}
            {attendee.presentGrandOfficerRole && ` - ${attendee.presentGrandOfficerRole}`}
          </p>
        </div>
      )}
      
      <div>
        <h4 className="font-medium">Contact</h4>
        <p className="text-sm text-gray-600">
          {attendee.primaryEmail || 'No email'}
          <br />
          {attendee.primaryPhone || 'No phone'}
        </p>
      </div>
    </div>
  );
};
```

## Deliverables
- MasonForm layout composition
- Compact variant for limited space
- Summary view component
- Proper section organization
- Conditional field rendering

## Success Criteria
- All sections properly composed
- Conditional logic works correctly
- Form updates store correctly
- Layout is responsive
- Good UX with clear sections