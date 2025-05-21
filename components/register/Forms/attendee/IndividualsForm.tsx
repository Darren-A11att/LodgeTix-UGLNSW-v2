import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { AttendeeWithPartner } from './AttendeeWithPartner';
import { AddRemoveControl, LegacyAddRemoveControl } from '../shared/AddRemoveControl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Users, Plus, UserRound, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AttendeeData } from './types';
import { validateAttendee } from './utils/validation';
import formSaveManager from '@/lib/formSaveManager';

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
  
  // Compute mason and guest counts
  const masonCount = useMemo(() => {
    return primaryAttendees.filter(a => a.attendeeType === 'Mason').length;
  }, [primaryAttendees]);
  
  const guestCount = useMemo(() => {
    return primaryAttendees.filter(a => a.attendeeType === 'Guest').length;
  }, [primaryAttendees]);

  // Add new attendee - first attendee is Mason, rest can be selected
  const handleAddAttendee = useCallback(() => {
    if (primaryAttendees.length >= maxAttendees) return;
    
    // First save any pending changes to ensure current data is preserved
    formSaveManager.saveBeforeNavigation();
    
    // Default behavior for backward compatibility
    const attendeeType = primaryAttendees.length === 0 ? 'Mason' : 'Guest';
    const newAttendeeId = attendeeType === 'Mason' 
      ? addMasonAttendee() 
      : addGuestAttendee();
    
    // Expand the new attendee
    setExpandedAttendees(prev => new Set([...prev, newAttendeeId]));
    
    // Explicitly save state after adding attendee
    setTimeout(() => {
      formSaveManager.saveOnAttendeeChange();
    }, 100); // Small delay to ensure component has rendered
  }, [addMasonAttendee, addGuestAttendee, primaryAttendees, maxAttendees]);

  // Remove attendee
  const handleRemoveAttendee = useCallback((attendeeId: string) => {
    // First save any pending changes to ensure we don't lose data from other attendees
    formSaveManager.saveBeforeNavigation();
    
    // Remove the attendee
    removeAttendee(attendeeId);
    
    // Update expanded state
    setExpandedAttendees(prev => {
      const next = new Set(prev);
      next.delete(attendeeId);
      return next;
    });
    
    // Explicitly save state after removing attendee
    setTimeout(() => {
      formSaveManager.saveOnAttendeeChange();
    }, 100); // Small delay to ensure store has updated
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

  // Validate and complete - now with explicit save
  const handleComplete = useCallback(() => {
    // First, save all form fields to ensure we have the latest data
    formSaveManager.saveBeforeNavigation().then(() => {
      // After saving, validate attendees
      const isValid = validateAllAttendees();
      if (isValid && onComplete) {
        console.log('[IndividualsForm] Form validation passed - proceeding to next step');
        onComplete();
      } else {
        console.log('[IndividualsForm] Form validation failed');
      }
    });
  }, [validateAllAttendees, onComplete]);

  return (
    <div className={cn("space-y-6", className)}>

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
                  <CardTitle className="text-lg font-semibold">
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
                        className="text-destructive hover:bg-destructive/10"
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
                <CardContent className="px-6 pt-2 pb-6">
                  <AttendeeWithPartner
                    attendeeId={attendee.attendeeId}
                    attendeeNumber={attendeeNumber}
                    isPrimary={isPrimary}
                    allowPartner={allowPartners}
                    onRemove={!isPrimary ? () => handleRemoveAttendee(attendee.attendeeId) : undefined}
                  />
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Attendee type controls at the bottom of form */}
      <div className="mt-6 pt-6 border-t border-slate-200 space-y-6">
        <div className="flex items-center gap-4">
          <LegacyAddRemoveControl
            label="Mason"
            count={primaryAttendees.filter(a => a.attendeeType === 'Mason').length}
            onAdd={() => {
              // Save current form state before adding a new attendee
              formSaveManager.saveBeforeNavigation();
              
              const newAttendeeId = addMasonAttendee();
              setExpandedAttendees(prev => new Set([...prev, newAttendeeId]));
              
              // Explicitly save after adding attendee
              setTimeout(() => {
                formSaveManager.saveOnAttendeeChange();
              }, 100);
            }}
            onRemove={() => {
              const masonAttendees = primaryAttendees.filter(a => a.attendeeType === 'Mason');
              // Don't remove the first Mason if it's the only one
              if (masonAttendees.length > 1) {
                const lastMason = masonAttendees[masonAttendees.length - 1];
                handleRemoveAttendee(lastMason.attendeeId);
              }
            }}
            min={1}
            max={5}
            removeDisabled={primaryAttendees.filter(a => a.attendeeType === 'Mason').length <= 1}
          />
          <LegacyAddRemoveControl
            label="Guest"
            count={primaryAttendees.filter(a => a.attendeeType === 'Guest').length}
            onAdd={() => {
              // Save current form state before adding a new attendee
              formSaveManager.saveBeforeNavigation();
              
              const newAttendeeId = addGuestAttendee();
              setExpandedAttendees(prev => new Set([...prev, newAttendeeId]));
              
              // Explicitly save after adding attendee
              setTimeout(() => {
                formSaveManager.saveOnAttendeeChange();
              }, 100);
            }}
            onRemove={() => {
              const guestAttendees = primaryAttendees.filter(a => a.attendeeType === 'Guest');
              if (guestAttendees.length > 0) {
                const lastGuest = guestAttendees[guestAttendees.length - 1];
                handleRemoveAttendee(lastGuest.attendeeId);
              }
            }}
            min={0}
            max={5}
          />
        </div>
      </div>

      <Separator />

      {/* Action buttons - removed since navigation is handled by WizardBodyStructureLayout */}
      {/* Keep the handleComplete function so it can still be called by the onComplete prop */}
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