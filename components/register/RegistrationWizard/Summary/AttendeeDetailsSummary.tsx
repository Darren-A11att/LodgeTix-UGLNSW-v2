import React, { useMemo } from 'react';
import { useRegistrationStore, UnifiedAttendeeData } from '@/lib/registrationStore';
import { SummaryColumn, SummarySection, SummaryItem, StatusIndicator } from '.';
import { User, Users, UserCheck, ShieldCheck, Crown, CircleUserRound, PlusCircle, CheckCircle2, AlertCircle, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * Helper function to calculate the completion status of an attendee
 */
const calculateAttendeeStatus = (attendee: UnifiedAttendeeData): {
  status: 'complete' | 'partial' | 'incomplete';
  missingFields: string[];
} => {
  const requiredFields = ['firstName', 'lastName', 'primaryEmail'];
  const masonRequiredFields = [...requiredFields, 'lodgeNameNumber'];
  
  const fieldsToCheck = attendee.attendeeType === 'mason' ? masonRequiredFields : requiredFields;
  
  const missingFields = fieldsToCheck.filter(field => {
    const value = attendee[field as keyof UnifiedAttendeeData];
    return !value || (typeof value === 'string' && value.trim() === '');
  });
  
  if (missingFields.length === 0) {
    return { status: 'complete', missingFields: [] };
  } else if (missingFields.length < fieldsToCheck.length / 2) {
    return { status: 'partial', missingFields };
  } else {
    return { status: 'incomplete', missingFields };
  }
};

/**
 * Attendee Details Summary component with enhanced status tracking
 */
export const AttendeeDetailsSummary: React.FC = () => {
  const { attendees, registrationType, addAttendee, addPartnerAttendee } = useRegistrationStore();
  
  // Calculate overall completion percentage
  const completionStats = useMemo(() => {
    if (!attendees.length) return { percent: 0, complete: 0, total: 0 };
    
    const statuses = attendees.map(att => calculateAttendeeStatus(att));
    const complete = statuses.filter(s => s.status === 'complete').length;
    const percent = Math.round((complete / attendees.length) * 100);
    
    return { percent, complete, total: attendees.length };
  }, [attendees]);
  
  // Get type-specific requirements
  const typeRequirements = useMemo(() => {
    switch (registrationType) {
      case 'individuals':
      case 'individual': // backwards compatibility
        return {
          title: 'Individual Registration',
          icon: <User className="h-4 w-4 text-blue-600" />,
          requirements: [
            { text: 'At least one attendee', 
              met: attendees.length >= 1,
              status: attendees.length >= 1 ? 'success' : 'error' 
            }
          ]
        };
      case 'lodge':
        return {
          title: 'Lodge Registration',
          icon: <Users className="h-4 w-4 text-indigo-600" />,
          requirements: [
            { text: 'Minimum 3 lodge members', 
              met: attendees.filter(a => a.attendeeType === 'mason').length >= 3,
              status: attendees.filter(a => a.attendeeType === 'mason').length >= 3 ? 'success' : 'error'
            },
            { text: 'Lodge name and number', 
              met: attendees.some(a => a.lodgeNameNumber && a.lodgeNameNumber.trim() !== ''),
              status: attendees.some(a => a.lodgeNameNumber && a.lodgeNameNumber.trim() !== '') ? 'success' : 'warning'
            }
          ]
        };
      case 'delegation':
        return {
          title: 'Delegation Registration',
          icon: <ShieldCheck className="h-4 w-4 text-purple-600" />,
          requirements: [
            { text: 'At least one delegate', 
              met: attendees.length >= 1,
              status: attendees.length >= 1 ? 'success' : 'error'
            },
            { text: 'Grand Lodge information', 
              met: attendees.some(a => a.grand_lodge_id),
              status: attendees.some(a => a.grand_lodge_id) ? 'success' : 'warning'
            }
          ]
        };
      default:
        return {
          title: 'Registration',
          icon: <User className="h-4 w-4 text-gray-600" />,
          requirements: []
        };
    }
  }, [registrationType, attendees]);
  
  // Determine if attendees can be added (based on registration type limits)
  const canAddAttendee = useMemo(() => {
    if ((registrationType === 'individuals' || registrationType === 'individual') && attendees.length >= 10) return false;
    if (registrationType === 'lodge' && attendees.length >= 20) return false;
    if (registrationType === 'delegation' && attendees.length >= 10) return false;
    return true;
  }, [registrationType, attendees.length]);
  
  // Determine which attendees can have partners added
  const getCanAddPartner = (attendee: UnifiedAttendeeData): boolean => {
    return !attendee.partner && (attendee.attendeeType === 'mason' || attendee.attendeeType === 'guest');
  };
  
  // Helper to get the right icon for attendee type
  const getAttendeeIcon = (attendee: UnifiedAttendeeData): React.ReactNode => {
    if (attendee.isPrimary) return <Crown className="w-4 h-4 text-masonic-gold" />;
    if (attendee.attendeeType === 'mason') return <ShieldCheck className="w-4 h-4 text-masonic-navy" />;
    if (attendee.attendeeType === 'LadyPartner') return <UserCheck className="w-4 h-4 text-pink-500" />;
    if (attendee.attendeeType === 'GuestPartner') return <Users className="w-4 h-4 text-teal-500" />;
    if (attendee.attendeeType === 'guest') return <User className="w-4 h-4 text-gray-600" />;
    return <CircleUserRound className="w-4 h-4 text-gray-400" />;
  };
  
  // Helper to get status indicator for attendee
  const getStatusIndicator = (attendee: UnifiedAttendeeData): React.ReactNode => {
    const { status } = calculateAttendeeStatus(attendee);
    
    switch (status) {
      case 'complete':
        return <StatusIndicator status="success" text="Complete" iconOnly />;
      case 'partial':
        return <StatusIndicator status="warning" text="Incomplete" iconOnly />;
      case 'incomplete':
        return <StatusIndicator status="error" text="Missing Info" iconOnly />;
      default:
        return null;
    }
  };
  
  // Handler to add new attendee
  const handleAddAttendee = () => {
    if (canAddAttendee) {
      const defaultType = registrationType === 'lodge' || registrationType === 'delegation' 
        ? 'Mason' 
        : 'Guest';
      addAttendee(defaultType);
    }
  };
  
  // Handler to add partner to an attendee
  const handleAddPartner = (attendeeId: string) => {
    addPartnerAttendee(attendeeId);
  };
  
  // Custom sections for attendee details step
  const attendeeDetailsSections = (
    <>
      {/* Progress Section */}
      <SummarySection 
        title="Completion Status" 
        icon={<ClipboardCheck className="h-4 w-4 text-masonic-navy" />}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>{completionStats.complete} of {completionStats.total} attendees complete</span>
            <span>{completionStats.percent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`${
                completionStats.percent === 100 
                  ? 'bg-green-500' 
                  : completionStats.percent > 50 
                    ? 'bg-amber-500' 
                    : 'bg-masonic-navy'
              } h-2 rounded-full`}
              style={{ width: `${completionStats.percent}%` }}
            ></div>
          </div>
          
          {/* Type-specific requirements */}
          <div className="mt-3">
            <SummaryItem
              icon={typeRequirements.icon}
              label="Registration Type"
              value={typeRequirements.title}
            />
            
            <div className="mt-2 space-y-1.5">
              {typeRequirements.requirements.map((req, idx) => (
                <div key={idx} className="flex items-center text-xs">
                  {req.met ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mr-1.5" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600 mr-1.5" />
                  )}
                  <span className={req.met ? 'text-green-700' : 'text-amber-700'}>
                    {req.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SummarySection>
      
      {/* Attendees Section */}
      <SummarySection 
        title="Your Attendees" 
        icon={<Users className="h-4 w-4 text-gray-600" />}
        className="mt-4"
      >
        <div className="space-y-2">
          {attendees.length === 0 ? (
            <p className="text-xs text-gray-500 italic">No attendees added yet</p>
          ) : (
            <div className="space-y-1.5">
              {attendees.map((attendee) => {
                const canAddPartner = getCanAddPartner(attendee);
                
                // Get the related attendee name if this is a partner
                const getPartnerInfo = () => {
                  if (attendee.isPartner) {
                    const relatedAttendee = attendees.find(a => a.attendeeId === attendee.isPartner);
                    if (relatedAttendee) {
                      return `Partner of ${relatedAttendee.firstName} ${relatedAttendee.lastName}`;
                    }
                  }
                  return null;
                };
                
                // Format the type/role display
                const getTypeDisplay = () => {
                  const partnerInfo = getPartnerInfo();
                  if (partnerInfo) return partnerInfo;
                  
                  let typeDisplay = attendee.attendeeType;
                  if (attendee.isPrimary) {
                    return (
                      <>
                        {typeDisplay}
                        <Badge variant="outline" className="ml-1 text-[10px] py-0 h-4">Primary</Badge>
                      </>
                    );
                  }
                  return typeDisplay;
                };
                
                return (
                  <div key={attendee.attendeeId} className="flex items-center p-2 bg-white rounded-md border border-slate-200">
                    <div className="mr-2">
                      {getAttendeeIcon(attendee)}
                    </div>
                    <div className="flex-grow">
                      <p className="text-xs font-medium">
                        {attendee.firstName || 'Unnamed'} {attendee.lastName || 'Attendee'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getTypeDisplay()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      {canAddPartner && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 w-6 p-0 text-blue-600"
                          onClick={() => handleAddPartner(attendee.attendeeId)}
                          title="Add partner"
                        >
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <div className="ml-1">
                        {getStatusIndicator(attendee)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {canAddAttendee && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2 text-xs"
              onClick={handleAddAttendee}
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1" />
              Add Attendee
            </Button>
          )}
        </div>
      </SummarySection>
      
      {/* Next Steps Section */}
      <SummarySection 
        title="Completion Steps" 
        icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
        className="mt-4"
      >
        <ul className="space-y-1 text-xs pl-5 list-disc">
          <li>Complete information for all attendees</li>
          <li>Include contact details for primary attendee</li>
          <li className="font-medium text-masonic-navy">Agree to terms and conditions</li>
          <li className="text-gray-500">Continue to ticket selection</li>
        </ul>
        
        {/* Quick Tip */}
        <div className="mt-3 p-2 bg-blue-50 border border-blue-100 rounded text-xs text-blue-700">
          <p className="font-medium mb-1">Quick Tip</p>
          <p>Partners will be seated together with their registered attendees automatically.</p>
        </div>
      </SummarySection>
    </>
  );
  
  return (
    <SummaryColumn
      title="Attendee Details"
      customSections={attendeeDetailsSections}
      showProgress={true}
      defaultSections={null}
    />
  );
};