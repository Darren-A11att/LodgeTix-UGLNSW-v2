import React, { useCallback, useEffect, useState } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { AttendeeWithPartner } from './AttendeeWithPartner';
import { AddRemoveControl } from '../shared/AddRemoveControl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Shield, Users, Building } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { GrandLodgeSelection } from '../mason/lib/GrandLodgeSelection';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import formSaveManager from '@/lib/formSaveManager';
import { useAttendeeDataWithDebounce } from './lib/useAttendeeData';
import { getFunctionTicketsService, FunctionTicketDefinition, FunctionPackage } from '@/lib/services/function-tickets-service';

interface DelegationsFormProps {
  functionId: string;
  delegationType?: 'GrandLodge' | 'MasonicGoverningBody';
  minDelegates?: number;
  maxDelegates?: number;
  allowPartners?: boolean;
  onComplete?: () => void;
  className?: string;
  fieldErrors?: Record<string, Record<string, string>>;
}

// Constants
const DEBOUNCE_DELAY = 300; // Changed from implicit 500ms to explicit 300ms

export const DelegationsForm: React.FC<DelegationsFormProps> = ({
  functionId,
  delegationType = 'GrandLodge',
  minDelegates = 1,
  maxDelegates = 20,
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
    updateAttendee,
    addPrimaryAttendee,
  } = useRegistrationStore();
  
  const [delegationDetails, setDelegationDetails] = useState<{
    name: string;
    grand_lodge_id?: string;
  }>({
    name: '',
    grand_lodge_id: undefined,
  });

  // Dynamic data state for function tickets and packages
  const [functionTickets, setFunctionTickets] = useState<FunctionTicketDefinition[]>([]);
  const [functionPackages, setFunctionPackages] = useState<FunctionPackage[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Filter to only show delegates (not partners)
  const delegateAttendees = attendees.filter(
    a => !a.isPartner
  );

  // Find the head of delegation (primary)
  const headOfDelegation = delegateAttendees.find(a => a.isPrimary);

  // Fetch function tickets and packages data
  useEffect(() => {
    const fetchFunctionData = async () => {
      try {
        setIsLoadingData(true);
        setDataError(null);
        
        if (!functionId) {
          throw new Error('No function ID provided to DelegationsForm');
        }
        
        const ticketsService = getFunctionTicketsService();
        const { tickets, packages } = await ticketsService.getFunctionTicketsAndPackages(functionId);
        
        setFunctionTickets(tickets);
        setFunctionPackages(packages);
        
        console.log('Delegation packages fetched:', packages);
        console.log('Package eligibility types:', packages.map(p => ({
          name: p.name,
          eligibleRegistrationTypes: p.eligibleRegistrationTypes
        })));
      } catch (error) {
        console.error('Failed to fetch function data:', error);
        setDataError(error instanceof Error ? error.message : 'Failed to load data');
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchFunctionData();
  }, [functionId]);

  // Update delegation grand lodge when head changes
  useEffect(() => {
    if (headOfDelegation && headOfDelegation.grand_lodge_id) {
      setDelegationDetails(prev => ({
        ...prev,
        grand_lodge_id: headOfDelegation.grand_lodge_id,
      }));
    }
  }, [headOfDelegation]);

  // Add new delegate
  const handleAddDelegate = useCallback(() => {
    if (delegateAttendees.length >= maxDelegates) return;
    
    // For delegations, we can add either Mason or Guest
    const isMasonDelegate = Math.random() > 0.5; // This would be determined by user choice
    const newDelegateId = isMasonDelegate ? addMasonAttendee() : addGuestAttendee();
    
    // Auto-populate grand lodge from delegation
    if (delegationDetails.grand_lodge_id) {
      updateAttendee(newDelegateId, {
        grand_lodge_id: delegationDetails.grand_lodge_id,
        contactPreference: 'PrimaryAttendee',
      });
    }
  }, [addMasonAttendee, addGuestAttendee, updateAttendee, delegationDetails, delegateAttendees.length, maxDelegates]);

  // Remove delegate
  const handleRemoveDelegate = useCallback((delegateId: string) => {
    removeAttendee(delegateId);
  }, [removeAttendee]);

  // Handle grand lodge change for entire delegation
  const handleGrandLodgeChange = useCallback((grandLodgeId: string) => {
    setDelegationDetails(prev => ({ ...prev, grand_lodge_id: grandLodgeId }));
    
    // Update all delegates with new grand lodge
    delegateAttendees.forEach(delegate => {
      updateAttendee(delegate.attendeeId, { grand_lodge_id: grandLodgeId });
    });
  }, [delegateAttendees, updateAttendee]);

  // Validate all attendees
  const validateAllAttendees = useCallback(() => {
    // Simple validation - check required fields for all attendees
    return attendees.every(attendee => {
      const hasBasicInfo = attendee.firstName && attendee.lastName && attendee.title;
      if (attendee.isPrimary || attendee.contactPreference === 'Directly') {
        return hasBasicInfo && attendee.primaryEmail && attendee.primaryPhone;
      }
      return hasBasicInfo;
    });
  }, [attendees]);

  // Validate and complete
  const handleComplete = useCallback(() => {
    // First, ensure all form data is saved
    formSaveManager.saveBeforeNavigation().then(() => {
      const isValid = validateAllAttendees();
      
      // Additional delegation-specific validation
      if (!delegationDetails.name) {
        alert('Please enter a delegation name');
        return;
      }
      
      if (!delegationDetails.grand_lodge_id) {
        alert('Please select a Grand Lodge');
        return;
      }
      
      if (delegateAttendees.length < minDelegates) {
        alert(`At least ${minDelegates} delegate(s) are required`);
        return;
      }
      
      if (!headOfDelegation) {
        alert('Please designate a Head of Delegation');
        return;
      }

      if (isValid && onComplete) {
        onComplete();
      }
    });
  }, [validateAllAttendees, delegationDetails, delegateAttendees.length, minDelegates, headOfDelegation, onComplete]);

  // Auto-add primary delegate if none exists
  useEffect(() => {
    if (delegateAttendees.length === 0) {
      addPrimaryAttendee();
    }
  }, []);

  const [showDelegateTypeDialog, setShowDelegateTypeDialog] = useState(false);

  // Handle delegate type selection
  const handleDelegateTypeSelection = useCallback((type: 'Mason' | 'Guest') => {
    const newDelegateId = type === 'Mason' ? addMasonAttendee() : addGuestAttendee();
    
    if (delegationDetails.grand_lodge_id) {
      updateAttendee(newDelegateId, {
        grand_lodge_id: delegationDetails.grand_lodge_id,
        contactPreference: 'PrimaryAttendee',
      });
    }
    
    setShowDelegateTypeDialog(false);
  }, [addMasonAttendee, addGuestAttendee, updateAttendee, delegationDetails]);

  // Show loading state
  if (isLoadingData) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600">Loading delegation registration options...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (dataError) {
    return (
      <div className={cn("space-y-6", className)}>
        <Alert variant="destructive">
          <AlertDescription>
            Error loading function data: {dataError}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Official Delegation Registration
        </h2>
        <p className="text-gray-600 mt-1">
          Register an official {delegationType === 'GrandLodge' ? 'Grand Lodge' : 'Masonic Governing Body'} delegation
        </p>
      </div>

      {/* Delegation info card */}
      <Card>
        <CardHeader>
          <CardTitle>Delegation Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="delegation-name">Delegation Name</Label>
            <Input
              id="delegation-name"
              value={delegationDetails.name}
              onChange={(e) => setDelegationDetails(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., United Grand Lodge of NSW & ACT"
            />
          </div>
          
          <div>
            <Label>Grand Lodge</Label>
            <GrandLodgeSelection 
              value={delegationDetails.grand_lodge_id || ''}
              onChange={handleGrandLodgeChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Delegation info alert */}
      {delegationDetails.name && delegationDetails.grand_lodge_id && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Registering delegation from <strong>{delegationDetails.name}</strong>
            {delegateAttendees.length > 1 && 
              `. All ${delegateAttendees.length} delegates will be registered under this Grand Lodge.`
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Delegate counter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Delegates
            </CardTitle>
            <div className="flex items-center gap-4">
              <Badge variant="secondary">
                {delegateAttendees.length} delegate{delegateAttendees.length !== 1 ? 's' : ''}
              </Badge>
              <Button
                onClick={() => setShowDelegateTypeDialog(true)}
                disabled={delegateAttendees.length >= maxDelegates}
                size="sm"
              >
                Add Delegate
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Delegate forms */}
      <div className="space-y-6">
        {delegateAttendees.map((delegate, index) => {
          const isHead = delegate.isPrimary;
          const delegateNumber = index + 1;
          
          return (
            <Card key={delegate.attendeeId} className={cn(
              "overflow-hidden",
              isHead && "ring-2 ring-blue-500"
            )}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {isHead ? (
                      <>
                        <Badge>Head of Delegation</Badge>
                        {delegate.attendeeType} Delegate
                      </>
                    ) : (
                      <>
                        {delegate.attendeeType} Delegate {delegateNumber}
                        {!isHead && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Make this delegate the head
                              delegateAttendees.forEach(d => {
                                updateAttendee(d.attendeeId, { 
                                  isPrimary: d.attendeeId === delegate.attendeeId 
                                });
                              });
                            }}
                          >
                            Set as Head
                          </Button>
                        )}
                      </>
                    )}
                    {delegate.firstName && delegate.lastName && (
                      <span className="font-normal text-gray-600 ml-2">
                        - {delegate.title} {delegate.firstName} {delegate.lastName}
                      </span>
                    )}
                  </CardTitle>
                  
                  {!isHead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDelegate(delegate.attendeeId)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <AttendeeWithPartner
                  attendeeId={delegate.attendeeId}
                  attendeeNumber={delegateNumber}
                  isPrimary={isHead}
                  allowPartner={allowPartners}
                  onRemove={!isHead ? () => handleRemoveDelegate(delegate.attendeeId) : undefined}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add delegate reminder */}
      {delegateAttendees.length < minDelegates && (
        <Alert variant="destructive">
          <AlertDescription>
            You need at least {minDelegates - delegateAttendees.length} more delegate{minDelegates - delegateAttendees.length > 1 ? 's' : ''} to proceed.
          </AlertDescription>
        </Alert>
      )}

      <Separator />

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{delegateAttendees.length}</p>
              <p className="text-sm text-gray-600">Delegates</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {attendees.filter(a => a.isPartner).length}
              </p>
              <p className="text-sm text-gray-600">Partners</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{attendees.length}</p>
              <p className="text-sm text-gray-600">Total Attendees</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm font-medium">
                {delegationDetails.name || 'No Delegation Name'}
              </p>
              <p className="text-sm text-gray-600">Delegation</p>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Delegate Type Selection Dialog */}
      {showDelegateTypeDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Select Delegate Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <Button
                  onClick={() => handleDelegateTypeSelection('Mason')}
                  className="w-full"
                >
                  Add Mason Delegate
                </Button>
                <Button
                  onClick={() => handleDelegateTypeSelection('Guest')}
                  variant="outline"
                  className="w-full"
                >
                  Add Guest Delegate
                </Button>
                <Button
                  onClick={() => setShowDelegateTypeDialog(false)}
                  variant="ghost"
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// Summary view for delegation registration
export const DelegationFormSummary: React.FC = () => {
  const { attendees } = useRegistrationStore();
  
  const delegateAttendees = attendees.filter(
    a => !a.isPartner
  );
  
  const headOfDelegation = delegateAttendees.find(a => a.isPrimary);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Delegation Summary</h3>
      
      {headOfDelegation && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-2">
              <p className="font-medium">Head of Delegation</p>
              <p className="text-sm text-gray-600">
                {headOfDelegation.title} {headOfDelegation.firstName} {headOfDelegation.lastName}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delegates list */}
      <div className="space-y-2">
        {delegateAttendees.map((delegate, index) => (
          <div key={delegate.attendeeId} className="flex items-center gap-2">
            {delegate.isPrimary && <Badge variant="secondary">Head</Badge>}
            <span className="text-sm">
              {delegate.title} {delegate.firstName} {delegate.lastName}
              {delegate.attendeeType === 'Mason' && delegate.rank && ` (${delegate.rank})`}
            </span>
          </div>
        ))}
      </div>

      {/* Partner count */}
      {attendees.some(a => a.isPartner) && (
        <p className="text-sm text-gray-600">
          + {attendees.filter(a => a.isPartner).length} partners
        </p>
      )}
    </div>
  );
};