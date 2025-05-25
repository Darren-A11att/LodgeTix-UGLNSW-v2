import React, { useCallback, useEffect, useState } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import formSaveManager from '@/lib/formSaveManager';
import { useDebouncedCallback } from 'use-debounce';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import our new extracted components
import {
  BookingContactSection,
  LodgeMemberRow,
  AttendeeCounter,
  LodgeSelectionCard,
  EditAttendeeDialog
} from './components';

// Constants for form behavior
const DEBOUNCE_DELAY = 300;

interface LodgesFormProps {
  minMembers?: number;
  maxMembers?: number;
  allowPartners?: boolean;
  onComplete?: () => void;
  className?: string;
}

interface LodgeMember {
  attendeeId: string;
  isPrimary: boolean;
}

export const LodgesFormRefactored: React.FC<LodgesFormProps> = ({
  minMembers = 3,
  maxMembers = 20,
  allowPartners = true,
  onComplete,
  className,
}) => {
  const { 
    attendees, 
    addMasonAttendee,
    removeAttendee,
    updateAttendee,
  } = useRegistrationStore();
  
  // Create debounced version of updateAttendee
  const debouncedUpdateAttendee = useDebouncedCallback(
    (attendeeId: string, updates: Partial<any>) => {
      updateAttendee(attendeeId, updates);
    },
    DEBOUNCE_DELAY
  );
  
  // Use the immediate update for critical operations
  const updateAttendeeImmediate = updateAttendee;
  
  const [selectedGrandLodge, setSelectedGrandLodge] = useState<string>('');
  const [selectedLodge, setSelectedLodge] = useState<string>('');
  const [lodgeName, setLodgeName] = useState('');
  const [lodgeMembers, setLodgeMembers] = useState<LodgeMember[]>([]);
  const [editingAttendeeId, setEditingAttendeeId] = useState<string | null>(null);
  const [masonCount, setMasonCount] = useState(1);
  const [partnerCount, setPartnerCount] = useState(0);
  
  // Calculate member attendees directly
  const memberAttendees = attendees.filter(a => {
    const isMember = lodgeMembers.some(m => m.attendeeId === a.attendeeId);
    const isPartnerOfMember = a.isPartner && 
      lodgeMembers.some(m => m.attendeeId === a.isPartner);
    
    return isMember || isPartnerOfMember;
  });

  // Get the primary attendee
  const primaryAttendee = attendees.find(a => 
    lodgeMembers.some(m => m.attendeeId === a.attendeeId && m.isPrimary)
  );

  const editingAttendee = attendees.find(a => a.attendeeId === editingAttendeeId);

  // One-time initialization
  const isInitializedRef = React.useRef(false);
  
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      
      if (lodgeMembers.length === 0) {
        const primaryId = addMasonAttendee();
        updateAttendeeImmediate(primaryId, {
          isPrimary: true,
        });
        setLodgeMembers([{ attendeeId: primaryId, isPrimary: true }]);
      }
    }
  }, []);

  // Add new member
  const handleAddMember = useCallback(() => {
    if (memberAttendees.filter(a => !a.isPartner).length >= maxMembers) return;
    
    const newId = addMasonAttendee();
    updateAttendeeImmediate(newId, {
      grandLodgeId: selectedGrandLodge ? Number(selectedGrandLodge) : 0,
      lodgeId: selectedLodge ? Number(selectedLodge) : 0,
      lodgeNameNumber: lodgeName,
    });
    
    setLodgeMembers(prev => [...prev, { attendeeId: newId, isPrimary: false }]);
    setEditingAttendeeId(newId);
  }, [addMasonAttendee, updateAttendeeImmediate, selectedGrandLodge, selectedLodge, lodgeName, memberAttendees, maxMembers]);
  
  const debouncedAddMember = useDebouncedCallback(handleAddMember, 300);

  // Update lodge details for all members
  const handleLodgeChange = useCallback((lodgeId: string, lodgeName: string) => {
    if (selectedLodge !== lodgeId) {
      setSelectedLodge(lodgeId);
      setLodgeName(lodgeName);
      
      memberAttendees.forEach(attendee => {
        if (!attendee.isPartner) {
          debouncedUpdateAttendee(attendee.attendeeId, { 
            grandLodgeId: selectedGrandLodge ? Number(selectedGrandLodge) : 0,
            lodgeId: lodgeId ? Number(lodgeId) : 0,
            lodgeNameNumber: lodgeName,
          });
        }
      });
    }
  }, [memberAttendees, debouncedUpdateAttendee, selectedGrandLodge, selectedLodge]);

  // Update Grand Lodge for all members
  const handleGrandLodgeChange = useCallback((grandLodgeId: string) => {
    if (selectedGrandLodge !== grandLodgeId) {
      setSelectedGrandLodge(grandLodgeId);
      setSelectedLodge('');
      setLodgeName('');
      
      memberAttendees.forEach(attendee => {
        if (!attendee.isPartner) {
          debouncedUpdateAttendee(attendee.attendeeId, { 
            grandLodgeId: grandLodgeId ? Number(grandLodgeId) : 0,
            lodgeId: 0,
            lodgeNameNumber: '',
          });
        }
      });
    }
  }, [memberAttendees, debouncedUpdateAttendee, selectedGrandLodge]);

  // Field change handler for BookingContactSection
  const handleFieldChange = useCallback((field: string, value: any) => {
    if (primaryAttendee) {
      debouncedUpdateAttendee(primaryAttendee.attendeeId, { [field]: value });
    }
  }, [debouncedUpdateAttendee, primaryAttendee]);

  const handleFieldChangeImmediate = useCallback((field: string, value: any) => {
    if (primaryAttendee) {
      updateAttendeeImmediate(primaryAttendee.attendeeId, { [field]: value });
    }
  }, [updateAttendeeImmediate, primaryAttendee]);

  // Validate and complete
  const handleComplete = useCallback(() => {
    formSaveManager.saveBeforeNavigation().then(() => {
      if (!selectedGrandLodge) {
        alert('Please select a Grand Lodge');
        return;
      }
      
      if (!selectedLodge) {
        alert('Please select a Lodge');
        return;
      }
      
      if (lodgeMembers.length < minMembers) {
        alert(`At least ${minMembers} lodge members are required`);
        return;
      }
      
      const hasPrimary = lodgeMembers.some(m => m.isPrimary);
      if (!hasPrimary) {
        alert('Please designate a Primary Contact (WM/Secretary)');
        return;
      }
      
      if (onComplete) {
        onComplete();
      }
    });
  }, [selectedGrandLodge, selectedLodge, lodgeMembers, minMembers, onComplete]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Lodge Selection Card */}
      <LodgeSelectionCard
        selectedGrandLodge={selectedGrandLodge}
        selectedLodge={selectedLodge}
        onGrandLodgeChange={handleGrandLodgeChange}
        onLodgeChange={handleLodgeChange}
        disabled={false}
      />

      {/* Booking Contact Section */}
      {primaryAttendee && selectedLodge && (
        <Card>
          <CardContent className="pt-0">
            <BookingContactSection
              attendee={primaryAttendee}
              onFieldChange={handleFieldChange}
              onFieldChangeImmediate={handleFieldChangeImmediate}
              disabled={!selectedLodge}
            />
          </CardContent>
        </Card>
      )}

      {/* Members Table with Tabs */}
      <Card className={cn(
        "border-2 border-primary/20 transition-opacity duration-300",
        !selectedLodge && "opacity-70"
      )}>
        <CardHeader className="py-4 px-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-primary font-medium text-lg">
              <Users className="w-5 h-5" />
              Lodge Members ({memberAttendees.filter(a => !a.isPartner).length})
            </CardTitle>
            <div className="flex items-center gap-2">
              {memberAttendees.filter(a => !a.isPartner).length < minMembers && (
                <Badge variant="destructive" className="animate-pulse rounded-full px-4 py-1 bg-red-100 text-red-600 border-0">
                  Need {minMembers - memberAttendees.filter(a => !a.isPartner).length} more
                </Badge>
              )}
              <Button
                onClick={debouncedAddMember}
                disabled={memberAttendees.filter(a => !a.isPartner).length >= maxMembers || !selectedLodge}
                className="gap-1 bg-[#0a2059] hover:bg-[#0c2669]"
              >
                <Plus className="w-4 h-4" />
                Add Member
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="have-details" className="w-full">
            <TabsList className="grid grid-cols-2 gap-0 mb-6 bg-gray-100 h-auto rounded-none p-0">
              <TabsTrigger 
                value="have-details" 
                className="py-4 px-6 data-[state=active]:bg-white data-[state=active]:border-b-0 data-[state=active]:shadow-none rounded-none border-b-2 data-[state=active]:border-b-transparent data-[state=active]:font-medium"
              >
                Have Attendee Details
              </TabsTrigger>
              <TabsTrigger 
                value="provide-later" 
                className="py-4 px-6 data-[state=active]:bg-white data-[state=active]:border-b-0 data-[state=active]:shadow-none rounded-none border-b-2 data-[state=active]:border-b-transparent data-[state=active]:font-medium"
              >
                Provide Attendees Later
              </TabsTrigger>
            </TabsList>
            
            {/* Tab: Have Attendee Details */}
            <TabsContent value="have-details" className="mt-0 px-0">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="border-b border-gray-100">
                    <TableHead className="text-gray-600 font-medium pl-6">Title</TableHead>
                    <TableHead className="text-gray-600 font-medium">First Name</TableHead>
                    <TableHead className="text-gray-600 font-medium">Last Name</TableHead>
                    <TableHead className="text-gray-600 font-medium">Rank</TableHead>
                    <TableHead className="text-gray-600 font-medium">Type</TableHead>
                    <TableHead className="text-gray-600 font-medium">Email</TableHead>
                    <TableHead className="text-gray-600 font-medium">Mobile</TableHead>
                    <TableHead className="text-gray-600 font-medium pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberAttendees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500 px-6">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Users className="w-10 h-10 text-gray-300" />
                          <p>No lodge members yet</p>
                          <p className="text-sm text-gray-400">Select a lodge and add members to continue</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {memberAttendees.map((attendee) => {
                    const member = lodgeMembers.find(m => m.attendeeId === attendee.attendeeId);
                    const isMember = !!member;
                    const hasPartner = !!attendee.partner;
                    const parentAttendee = attendee.isPartner ? 
                      attendees.find(a => a.attendeeId === attendee.isPartner) : 
                      undefined;
                    
                    return (
                      <LodgeMemberRow
                        key={attendee.attendeeId}
                        attendee={attendee} 
                        isMember={isMember}
                        isPrimary={member?.isPrimary || false}
                        hasPartner={hasPartner}
                        parentName={parentAttendee?.firstName || ''}
                        onSetPrimary={() => {
                          const updatedMembers = lodgeMembers.map(m => ({
                            ...m,
                            isPrimary: m.attendeeId === attendee.attendeeId
                          }));
                          setLodgeMembers(updatedMembers);
                          
                          memberAttendees.forEach(a => {
                            if (!a.isPartner) {
                              debouncedUpdateAttendee(a.attendeeId, { 
                                isPrimary: a.attendeeId === attendee.attendeeId 
                              });
                            }
                          });
                        }}
                        onRemove={() => {
                          if (attendee.partner) {
                            removeAttendee(attendee.partner);
                          }
                          removeAttendee(attendee.attendeeId);
                          setLodgeMembers(prev => prev.filter(m => m.attendeeId !== attendee.attendeeId));
                        }}
                        onTogglePartner={() => {
                          if (attendee.partner) {
                            removeAttendee(attendee.partner);
                            updateAttendeeImmediate(attendee.attendeeId, { partner: null });
                          } else {
                            const newPartnerId = addMasonAttendee();
                            if (newPartnerId) {
                              updateAttendeeImmediate(attendee.attendeeId, { partner: newPartnerId });
                              updateAttendeeImmediate(newPartnerId, {
                                isPartner: attendee.attendeeId,
                                attendeeType: 'Guest',
                                grandLodgeId: selectedGrandLodge ? Number(selectedGrandLodge) : 0,
                                lodgeId: selectedLodge ? Number(selectedLodge) : 0,
                                lodgeNameNumber: lodgeName,
                              });
                            }
                          }
                        }}
                        onEdit={() => setEditingAttendeeId(attendee.attendeeId)}
                      />
                    );
                  })}
                </TableBody>
              </Table>
              
              {/* Empty State Guidance */}
              {selectedLodge && memberAttendees.filter(a => !a.isPartner).length < minMembers && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mx-6 mb-6 mt-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 text-amber-500 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-medium text-amber-800">Minimum Members Required</h3>
                      <p className="mt-1 text-sm text-amber-700">
                        Lodge registrations require at least {minMembers} members to proceed. Click "Add Member" to add {minMembers - memberAttendees.filter(a => !a.isPartner).length} more member{minMembers - memberAttendees.filter(a => !a.isPartner).length > 1 ? 's' : ''}.
                      </p>
                      <div className="mt-3">
                        <Button
                          onClick={handleAddMember}
                          disabled={memberAttendees.filter(a => !a.isPartner).length >= maxMembers || !selectedLodge}
                          variant="secondary"
                          className="gap-2 bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300"
                        >
                          <Plus className="w-4 h-4" />
                          Add Member
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            
            {/* Tab: Provide Attendees Later */}
            <TabsContent value="provide-later" className="p-6">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-medium mb-3">Provide Attendee Count</h3>
                <p className="text-gray-600 mb-6">
                  If you don't have all attendee details yet, you can specify how many members will be attending.
                  You can provide their details later.
                </p>
                
                <div className="space-y-6 max-w-md mx-auto">
                  <AttendeeCounter
                    id="mason-count"
                    label="Number of Masons"
                    value={masonCount}
                    min={1}
                    max={maxMembers}
                    onChange={setMasonCount}
                  />
                  
                  <AttendeeCounter
                    id="partner-count"
                    label="Number of Partners"
                    value={partnerCount}
                    min={0}
                    max={maxMembers}
                    onChange={setPartnerCount}
                  />
                  
                  <div className="pt-4">
                    <Button 
                      className="w-full bg-[#0a2059] hover:bg-[#0c2669]"
                      onClick={() => {
                        // TODO: Implement attendee count confirmation logic
                        console.log(`Confirmed: ${masonCount} Masons, ${partnerCount} Partners`);
                      }}
                    >
                      Confirm Attendee Count
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <EditAttendeeDialog
        isOpen={!!editingAttendeeId}
        attendee={editingAttendee || null}
        lodgeName={lodgeName}
        parentAttendees={attendees}
        onClose={() => setEditingAttendeeId(null)}
        isPrimary={lodgeMembers.find(m => m.attendeeId === editingAttendeeId)?.isPrimary}
      />
    </div>
  );
};

// Summary view remains the same
export const LodgeFormSummary: React.FC = () => {
  const { attendees } = useRegistrationStore();
  
  const masonAttendees = attendees.filter(
    a => a.attendeeType === 'Mason' && !a.isPartner
  );
  
  const primaryMason = masonAttendees.find(a => a.isPrimary);
  const lodgeDetails = primaryMason?.lodgeNameNumber || 'Lodge';

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Lodge Registration Summary</h3>
      
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-2">
            <p className="font-medium">{lodgeDetails}</p>
            <p className="text-sm text-gray-600">
              {masonAttendees.length} members registered
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Member list */}
      <div className="space-y-2">
        {masonAttendees.map((mason, index) => (
          <div key={mason.attendeeId} className="flex items-center gap-2">
            {mason.isPrimary && <Badge variant="secondary">Primary</Badge>}
            <span className="text-sm">
              {mason.title} {mason.firstName} {mason.lastName}
              {mason.rank && ` (${mason.rank})`}
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