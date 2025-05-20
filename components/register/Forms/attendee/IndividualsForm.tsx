import React, { useCallback, useState } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { AttendeeWithPartner } from './AttendeeWithPartner';
import { AddRemoveControl } from '../shared/AddRemoveControl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Users, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AttendeeData } from './types';
import { validateAttendee } from './utils/validation';

interface IndividualsFormProps {
  maxAttendees?: number;
  allowPartners?: boolean;
  onComplete?: () => void;
  className?: string;
}

export const IndividualsForm: React.FC<IndividualsFormProps> = ({
  maxAttendees = 10,
  allowPartners = true,
  onComplete,
  className,
}) => {
  const { 
    attendees, 
    addMasonAttendee,
    addGuestAttendee,
    removeAttendee,
  } = useRegistrationStore();
  
  const [expandedAttendees, setExpandedAttendees] = useState<Set<string>>(
    new Set([attendees[0]?.attendeeId])
  );

  // Filter to only show primary attendees (not partners)
  const primaryAttendees = attendees.filter(a => !a.isPartner);

  // Add new attendee - first attendee is Mason, rest are Guests
  const handleAddAttendee = useCallback(() => {
    if (primaryAttendees.length >= maxAttendees) return;
    
    const attendeeType = primaryAttendees.length === 0 ? 'Mason' : 'Guest';
    const newAttendeeId = attendeeType === 'Mason' 
      ? addMasonAttendee() 
      : addGuestAttendee();
    
    // Expand the new attendee
    setExpandedAttendees(prev => new Set([...prev, newAttendeeId]));
  }, [addMasonAttendee, addGuestAttendee, primaryAttendees, maxAttendees]);

  // Remove attendee
  const handleRemoveAttendee = useCallback((attendeeId: string) => {
    removeAttendee(attendeeId);
    setExpandedAttendees(prev => {
      const next = new Set(prev);
      next.delete(attendeeId);
      return next;
    });
  }, [removeAttendee]);

  // Toggle attendee expansion
  const toggleAttendeeExpansion = useCallback((attendeeId: string) => {
    setExpandedAttendees(prev => {
      const next = new Set(prev);
      if (next.has(attendeeId)) {
        next.delete(attendeeId);
      } else {
        next.add(attendeeId);
      }
      return next;
    });
  }, []);

  // Validate all attendees
  const validateAllAttendees = useCallback(() => {
    const attendeesToValidate = attendees as AttendeeData[];
    return attendeesToValidate.every(attendee => {
      const errors = validateAttendee(attendee);
      return Object.keys(errors).length === 0;
    });
  }, [attendees]);

  // Validate and complete
  const handleComplete = useCallback(() => {
    const isValid = validateAllAttendees();
    if (isValid && onComplete) {
      onComplete();
    }
  }, [validateAllAttendees, onComplete]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6" />
            Individual Registration
          </h2>
          <p className="text-gray-600 mt-1">
            Register yourself and additional attendees
          </p>
        </div>
        
        <AddRemoveControl
          count={primaryAttendees.length}
          onAdd={handleAddAttendee}
          onRemove={() => {
            const lastAttendee = primaryAttendees[primaryAttendees.length - 1];
            if (lastAttendee && primaryAttendees.length > 1) {
              handleRemoveAttendee(lastAttendee.attendeeId);
            }
          }}
          minCount={1}
          maxCount={maxAttendees}
          countLabel="attendees"
          variant="compact"
        />
      </div>

      {/* Attendee forms */}
      <div className="space-y-6">
        {primaryAttendees.map((attendee, index) => {
          const isExpanded = expandedAttendees.has(attendee.attendeeId);
          const attendeeNumber = index + 1;
          const isPrimary = index === 0;
          
          // Count partners for attendee numbering
          const partnerCount = attendees.filter(
            a => a.isPartner === attendee.attendeeId
          ).length;

          return (
            <Card key={attendee.attendeeId} className="overflow-hidden">
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleAttendeeExpansion(attendee.attendeeId)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {isPrimary ? 'Your Details' : `Attendee ${attendeeNumber}`}
                    {!isExpanded && attendee.firstName && attendee.lastName && (
                      <span className="font-normal text-gray-600 ml-2">
                        - {attendee.firstName} {attendee.lastName}
                        {partnerCount > 0 && ` (+${partnerCount} partner)`}
                      </span>
                    )}
                  </CardTitle>
                  
                  <div className="flex items-center gap-2">
                    {!isPrimary && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveAttendee(attendee.attendeeId);
                        }}
                      >
                        Remove
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                    >
                      {isExpanded ? '−' : '+'}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent>
                  <AttendeeWithPartner
                    attendeeId={attendee.attendeeId}
                    attendeeNumber={attendeeNumber}
                    isPrimary={isPrimary}
                    allowPartner={allowPartners}
                  />
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Add attendee button */}
      {primaryAttendees.length < maxAttendees && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleAddAttendee}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Another Attendee
          </Button>
        </div>
      )}

      <Separator />

      {/* Action buttons */}
      <div className="flex justify-between">
        <Button variant="outline">
          Save Draft
        </Button>
        <Button onClick={handleComplete}>
          Continue to Tickets
        </Button>
      </div>
    </div>
  );
};

// Summary view for review
export const IndividualsFormSummary: React.FC = () => {
  const { attendees } = useRegistrationStore();
  
  // Group attendees by primary/partner relationship
  const attendeeGroups = attendees.reduce((groups, attendee) => {
    if (!attendee.isPartner) {
      groups.push({
        primary: attendee as AttendeeData,
        partners: attendees.filter(a => a.isPartner === attendee.attendeeId) as AttendeeData[],
      });
    }
    return groups;
  }, [] as Array<{ primary: AttendeeData; partners: AttendeeData[] }>);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Registration Summary</h3>
      
      {attendeeGroups.map((group, index) => (
        <Card key={group.primary.attendeeId}>
          <CardContent className="pt-4">
            <div className="space-y-2">
              <div>
                <p className="font-medium">
                  {index === 0 ? 'Primary Registrant' : `Attendee ${index + 1}`}
                </p>
                <p className="text-sm text-gray-600">
                  {group.primary.title} {group.primary.firstName} {group.primary.lastName}
                  {group.primary.attendeeType === 'Mason' && group.primary.lodgeNameNumber && (
                    <span> - {group.primary.lodgeNameNumber}</span>
                  )}
                </p>
              </div>
              
              {group.partners.map((partner) => (
                <div key={partner.attendeeId} className="ml-4">
                  <p className="text-sm">
                    <span className="font-medium">Partner:</span>{' '}
                    {partner.title} {partner.firstName} {partner.lastName}
                    {partner.relationship && ` (${partner.relationship})`}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
      
      <p className="text-sm text-gray-600">
        Total attendees: {attendees.length}
      </p>
    </div>
  );
};