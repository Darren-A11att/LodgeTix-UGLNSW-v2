import React, { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { AttendeeWithPartner } from './AttendeeWithPartner';
import { AddRemoveControl, LegacyAddRemoveControl } from '../shared/AddRemoveControl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Users, Plus, UserRound, UserCog, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AttendeeData } from './types';
import { validateAttendee } from './utils/validation';
import formSaveManager from '@/lib/formSaveManager';

interface IndividualsFormProps {
  maxAttendees?: number;
  allowPartners?: boolean;
  onComplete?: () => void;
  className?: string;
  fieldErrors?: Record<string, Record<string, string>>;
}

export const IndividualsForm: React.FC<IndividualsFormProps> = ({
  maxAttendees = 10,
  allowPartners = true,
  onComplete,
  className,
  fieldErrors = {},
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
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile device
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640); // sm breakpoint
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Filter to only show primary attendees (not partners)
  const primaryAttendees = attendees.filter(a => !a.isPartner);
  
  // Compute mason and guest counts
  const masonCount = useMemo(() => {
    return primaryAttendees.filter(a => a.attendeeType === 'mason').length;
  }, [primaryAttendees]);
  
  const guestCount = useMemo(() => {
    return primaryAttendees.filter(a => a.attendeeType === 'guest').length;
  }, [primaryAttendees]);

  // Helper function to generate dynamic card title
  const getCardTitle = useCallback((attendee: AttendeeData, index: number, isExpanded: boolean): React.ReactNode => {
    const isPrimary = index === 0;
    
    // Check if we have enough data to show a personalized title
    const hasBasicInfo = attendee.firstName && attendee.lastName && attendee.title;
    const hasMasonicInfo = attendee.attendeeType === 'mason' && attendee.rank;
    
    // For masons: show title + name + rank when we have all the info
    if (attendee.attendeeType === 'mason' && hasBasicInfo && hasMasonicInfo) {
      const nameAndTitle = `${attendee.title} ${attendee.firstName} ${attendee.lastName}`;
      
      // For grand officers (GL rank), use the specific grand rank fields
      let rankDisplay = '';
      if (attendee.rank === 'GL') {
        // For Grand Lodge officers, check for present/past grand officer role first
        if (attendee.presentGrandOfficerRole) {
          rankDisplay = attendee.presentGrandOfficerRole;
        } else if (attendee.otherGrandOfficerRole) {
          rankDisplay = attendee.otherGrandOfficerRole;
        } else if (attendee.suffix) {
          rankDisplay = attendee.suffix;
        } else {
          rankDisplay = 'GL';
        }
      } else {
        rankDisplay = attendee.rank;
      }
      
      return (
        <span>
          {nameAndTitle}
          <span className="ml-2 text-sm text-gray-500">{rankDisplay}</span>
        </span>
      );
    }
    
    // For guests: show title + name when we have the basic info
    if (attendee.attendeeType === 'guest' && hasBasicInfo) {
      return `${attendee.title} ${attendee.firstName} ${attendee.lastName}`;
    }
    
    // Fallback to default titles when we don't have enough data
    if (!attendee.firstName && !attendee.lastName) {
      return isPrimary ? 'Your Details' : 'New Attendee';
    }
    
    // Show what we have for partial data
    const parts: string[] = [];
    if (attendee.title) parts.push(attendee.title);
    if (attendee.firstName) parts.push(attendee.firstName);
    if (attendee.lastName) parts.push(attendee.lastName);
    
    return parts.join(' ') || (isPrimary ? 'Your Details' : `Attendee ${index + 1}`);
  }, []);

  // Add new attendee with mobile-specific behavior
  const handleAddAttendee = useCallback((type: 'mason' | 'guest') => {
    if (primaryAttendees.length >= maxAttendees) return;
    
    // First save any pending changes to ensure current data is preserved
    formSaveManager.saveBeforeNavigation();
    
    // Add the new attendee
    const newAttendeeId = type === 'mason' 
      ? addMasonAttendee() 
      : addGuestAttendee();
    
    // On mobile, collapse all other cards and only expand the new one
    if (isMobile) {
      setExpandedAttendees(new Set([newAttendeeId]));
    } else {
      // On desktop, add to expanded set
      setExpandedAttendees(prev => new Set([...prev, newAttendeeId]));
    }
    
    // Explicitly save state after adding attendee
    setTimeout(() => {
      formSaveManager.saveOnAttendeeChange();
      
      // On mobile, scroll to the new card
      if (isMobile && cardRefs.current[newAttendeeId]) {
        setTimeout(() => {
          const card = cardRefs.current[newAttendeeId];
          if (card) {
            // Find the scrollable container (main element with overflow-y-auto)
            const scrollableContainer = document.querySelector('main.overflow-y-auto');
            if (!scrollableContainer) {
              console.warn('Scrollable container not found');
              return;
            }
            
            // Get the card header within the card
            const cardHeader = card.querySelector('.cursor-pointer'); // The CardHeader element
            
            if (cardHeader) {
              // Get positions relative to the scrollable container
              const containerRect = scrollableContainer.getBoundingClientRect();
              const cardHeaderRect = cardHeader.getBoundingClientRect();
              
              // Calculate the current scroll position of the container
              const currentScrollTop = scrollableContainer.scrollTop;
              
              // Calculate where the card header is relative to the container's scrollable area
              const cardRelativeTop = cardHeaderRect.top - containerRect.top + currentScrollTop;
              
              // We want to position the card header at the top of the visible area with a small gap
              // The container has padding-top of 16px (p-4), so we account for that
              const targetScrollTop = cardRelativeTop - 8; // 8px gap from the top of the visible area
              
              // Scroll the container (not the window!)
              scrollableContainer.scrollTo({
                top: Math.max(0, targetScrollTop),
                behavior: 'smooth'
              });
            }
          }
        }, 400); // Increased delay to ensure card expansion completes
      }
    }, 100); // Small delay to ensure component has rendered
  }, [addMasonAttendee, addGuestAttendee, primaryAttendees, maxAttendees, isMobile]);

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
            <Card 
              key={attendee.attendeeId} 
              className="rounded-lg border bg-card text-card-foreground shadow-sm border-masonic-navy overflow-hidden"
              ref={(el) => { cardRefs.current[attendee.attendeeId] = el; }}
            >
              <CardHeader 
                className={`bg-masonic-lightblue py-3 px-4 cursor-pointer ${isExpanded ? "" : "hover:bg-masonic-lightblue/90"}`}
                onClick={() => toggleAttendeeExpansion(attendee.attendeeId)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">
                    {getCardTitle(attendee, index, isExpanded)}
                    {partnerCount > 0 && !isExpanded && (
                      <span className="font-normal text-gray-600 ml-2">
                        (+{partnerCount} partner{partnerCount > 1 ? 's' : ''})
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
                <CardContent className="px-4 sm:px-6 pt-0 sm:pt-2 pb-3 sm:pb-6">
                  <AttendeeWithPartner
                    attendeeId={attendee.attendeeId}
                    attendeeNumber={attendeeNumber}
                    isPrimary={isPrimary}
                    allowPartner={allowPartners}
                    onRemove={!isPrimary ? () => handleRemoveAttendee(attendee.attendeeId) : undefined}
                    fieldErrors={fieldErrors}
                  />
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Attendee type controls at the bottom of form */}
      <div>
        {/* Desktop view - existing controls */}
        <div className="hidden sm:flex items-center gap-4">
          <LegacyAddRemoveControl
            label="Mason"
            count={primaryAttendees.filter(a => a.attendeeType === 'mason').length}
            onAdd={() => handleAddAttendee('mason')}
            onRemove={() => {
              const masonAttendees = primaryAttendees.filter(a => a.attendeeType === 'mason');
              // Don't remove the first Mason if it's the only one
              if (masonAttendees.length > 1) {
                const lastMason = masonAttendees[masonAttendees.length - 1];
                handleRemoveAttendee(lastMason.attendeeId);
              }
            }}
            min={1}
            max={5}
            removeDisabled={primaryAttendees.filter(a => a.attendeeType === 'mason').length <= 1}
          />
          <LegacyAddRemoveControl
            label="Guest"
            count={primaryAttendees.filter(a => a.attendeeType === 'guest').length}
            onAdd={() => handleAddAttendee('guest')}
            onRemove={() => {
              const guestAttendees = primaryAttendees.filter(a => a.attendeeType === 'guest');
              if (guestAttendees.length > 0) {
                const lastGuest = guestAttendees[guestAttendees.length - 1];
                handleRemoveAttendee(lastGuest.attendeeId);
              }
            }}
            min={0}
            max={5}
          />
        </div>
        
        {/* Mobile view - simple buttons */}
        <div className="sm:hidden flex justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAddAttendee('mason')}
            disabled={primaryAttendees.filter(a => a.attendeeType === 'mason').length >= 5}
            className="border-[#c8a870] text-[#c8a870] hover:border-[#b09760] hover:text-[#b09760]"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Mason
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAddAttendee('guest')}
            disabled={primaryAttendees.filter(a => a.attendeeType === 'guest').length >= 5}
            className="border-[#c8a870] text-[#c8a870] hover:border-[#b09760] hover:text-[#b09760]"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Guest
          </Button>
        </div>
      </div>

      <Separator className="mt-6" />

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
                  {group.primary.attendeeType === 'mason' && group.primary.lodgeNameNumber && (
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