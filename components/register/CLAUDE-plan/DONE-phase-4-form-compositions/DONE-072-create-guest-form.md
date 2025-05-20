# Task 072: Create GuestForm Composition

## Objective
Create the GuestForm layout composition that brings together all Guest-specific sections into a complete form.

## Dependencies
- Task 041 (BasicInfo)
- Task 042 (ContactInfo)  
- Task 043 (AdditionalInfo)
- Task 004 (useAttendeeData)

## Reference Files
- `components/register/forms/guest/GuestForm2.tsx`
- Architecture patterns in CLAUDE.md

## Steps

1. Create `components/register/forms/guest/layouts/GuestForm.tsx`:
```typescript
import React, { useCallback } from 'react';
import { BasicInfo } from '../../basic-details/BasicInfo';
import { ContactInfo } from '../../basic-details/ContactInfo';
import { AdditionalInfo } from '../../basic-details/AdditionalInfo';
import { useAttendeeData } from '../../attendee/lib/useAttendeeData';
import { FormProps } from '../../attendee/types';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';

export const GuestForm: React.FC<FormProps> = ({ 
  attendeeId, 
  attendeeNumber, 
  isPrimary = false 
}) => {
  const { attendee, updateField } = useAttendeeData(attendeeId);
  
  if (!attendee || attendee.attendeeType !== 'Guest') {
    return <div>Invalid attendee type</div>;
  }

  // Handle field changes  
  const handleChange = useCallback((field: string, value: any) => {
    updateField(field, value);
  }, [updateField]);

  // Determine if this is a partner
  const isPartner = !!attendee.isPartner;
  const partnerLabel = isPartner ? 'Partner' : 'Guest';

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">
              {isPrimary 
                ? 'Your Details' 
                : isPartner 
                  ? `${partnerLabel} Details`
                  : `Attendee ${attendeeNumber} Details`
              }
            </h2>
            
            {/* Basic Information */}
            <section>
              <BasicInfo
                data={attendee}
                type="Guest"
                isPrimary={isPrimary}
                onChange={handleChange}
              />
            </section>

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

2. Create a compact variant:
```typescript
// Compact version for modal or limited space
export const GuestFormCompact: React.FC<FormProps> = ({ 
  attendeeId, 
  attendeeNumber, 
  isPrimary = false 
}) => {
  const { attendee, updateField } = useAttendeeData(attendeeId);
  
  if (!attendee || attendee.attendeeType !== 'Guest') {
    return <div>Invalid attendee type</div>;
  }

  const handleChange = useCallback((field: string, value: any) => {
    updateField(field, value);
  }, [updateField]);

  return (
    <div className="space-y-6">
      {/* All sections in one flow without cards */}
      <BasicInfo
        data={attendee}
        type="Guest"
        isPrimary={isPrimary}
        onChange={handleChange}
      />
      
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

3. Create a partner-specific variant:
```typescript
// Partner-specific form with relationship field
export const PartnerForm: React.FC<FormProps & { parentAttendeeId: string }> = ({ 
  attendeeId, 
  attendeeNumber,
  parentAttendeeId,
  isPrimary = false 
}) => {
  const { attendee, updateField } = useAttendeeData(attendeeId);
  const { attendee: parentAttendee } = useAttendeeData(parentAttendeeId);
  
  if (!attendee || attendee.attendeeType !== 'Guest') {
    return <div>Invalid attendee type</div>;
  }

  const handleChange = useCallback((field: string, value: any) => {
    updateField(field, value);
  }, [updateField]);

  const parentName = parentAttendee 
    ? `${parentAttendee.firstName} ${parentAttendee.lastName}`
    : 'primary attendee';

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Partner Details</h2>
              <p className="text-sm text-gray-600 mt-1">
                Partner of {parentName}
              </p>
            </div>
            
            {/* Relationship Selection */}
            <section>
              <PartnerRelationshipSelect
                value={attendee.relationship}
                onChange={(value) => handleChange('relationship', value)}
                attendeeName={parentName}
                required={true}
              />
            </section>

            <Separator />
            
            {/* Basic Information */}
            <section>
              <BasicInfo
                data={attendee}
                type="Guest"
                isPrimary={false}
                onChange={handleChange}
              />
            </section>

            <Separator />

            {/* Contact Information */}
            <section>
              <ContactInfo
                data={attendee}
                isPrimary={false}
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

4. Create a summary display component:
```typescript
// Summary view for review pages
export const GuestFormSummary: React.FC<{ attendeeId: string }> = ({ attendeeId }) => {
  const { attendee } = useAttendeeData(attendeeId);
  
  if (!attendee || attendee.attendeeType !== 'Guest') {
    return null;
  }

  const isPartner = !!attendee.isPartner;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium">
          {isPartner ? 'Partner Details' : 'Guest Details'}
        </h4>
        <p className="text-sm text-gray-600">
          {attendee.title} {attendee.firstName} {attendee.lastName}
          {attendee.relationship && ` (${attendee.relationship})`}
        </p>
      </div>
      
      <div>
        <h4 className="font-medium">Contact</h4>
        <p className="text-sm text-gray-600">
          {attendee.contactPreference === 'Directly' ? (
            <>
              {attendee.primaryEmail || 'No email'}
              <br />
              {attendee.primaryPhone || 'No phone'}
            </>
          ) : (
            `Contact via ${attendee.contactPreference}`
          )}
        </p>
      </div>
      
      {(attendee.dietaryRequirements || attendee.specialNeeds) && (
        <div>
          <h4 className="font-medium">Special Requirements</h4>
          {attendee.dietaryRequirements && (
            <p className="text-sm text-gray-600">
              Dietary: {attendee.dietaryRequirements}
            </p>
          )}
          {attendee.specialNeeds && (
            <p className="text-sm text-gray-600">
              Other: {attendee.specialNeeds}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
```

## Deliverables
- GuestForm layout composition
- Compact variant
- Partner-specific variant
- Summary view component
- Consistent styling with MasonForm

## Success Criteria
- All sections properly composed
- Partner relationship handling
- Form updates store correctly
- Layout is responsive
- Simpler than Mason form but complete