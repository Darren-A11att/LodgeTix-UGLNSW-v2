import React, { useCallback, useEffect, useState } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Building, Plus, Trash2, Users, UserPlus, Edit } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { AttendeeData } from './types';
import { GrandLodgeSelection } from '../mason/lib/GrandLodgeSelection';
import { LodgeSelection } from '../mason/lib/LodgeSelection';
import { MasonForm } from '../mason/Layouts/MasonForm';
import { GuestForm } from '../guest/Layouts/GuestForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import formSaveManager from '@/lib/formSaveManager';
import { TextField, SelectField, EmailField, PhoneField } from '../shared/FieldComponents';
import { useDebouncedCallback } from 'use-debounce';

// Constants for form behavior
const DEBOUNCE_DELAY = 300; // 300ms debounce delay for field updates

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

// Simpler table row component without React.memo to avoid complexity
function LodgeMemberRow({
  attendeeId,
  isMember,
  isPrimary,
  onSetPrimary,
  onRemove,
  onTogglePartner,
  hasPartner,
  parentName,
  onEdit,
  attendee
}: {
  attendeeId: string;
  isMember: boolean;
  isPrimary: boolean;
  onSetPrimary: () => void;
  onRemove: () => void;
  onTogglePartner: () => void;
  hasPartner: boolean;
  parentName?: string;
  onEdit: () => void;
  attendee: any; // Pass attendee data directly to avoid store subscription
}) {
  if (!attendee) return null;

  const isPartner = !!attendee.isPartner;

  return (
    <TableRow className={isPartner ? 'bg-gray-50' : ''}>
      <TableCell>
        {isPartner && <span className="text-xs text-gray-500 mr-2">└─</span>}
        {attendee.title || 'Select title'}
      </TableCell>
      <TableCell>
        {attendee.firstName || 'First name'}
      </TableCell>
      <TableCell>
        {attendee.lastName || 'Last name'}
      </TableCell>
      <TableCell>
        {attendee.rank || 'Select rank'}
      </TableCell>
      <TableCell>
        {isPartner ? (
          <Badge variant="secondary">Guest Partner</Badge>
        ) : (
          <Badge>Mason</Badge>
        )}
      </TableCell>
      <TableCell>
        {attendee.primaryEmail || 'Email'}
      </TableCell>
      <TableCell>
        {attendee.primaryPhone || 'Mobile'}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onEdit}
          >
            <Edit className="w-4 h-4" />
          </Button>
          {isMember && (
            <>
              {isPrimary ? (
                <Badge>Primary</Badge>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onSetPrimary}
                >
                  Set as Primary
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={onTogglePartner}
                title={hasPartner ? "Remove Partner" : "Add Partner"}
              >
                <UserPlus className={cn("w-4 h-4", hasPartner && "text-blue-600")} />
              </Button>
              {!isPrimary && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onRemove}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
          {isPartner && (
            <span className="text-sm text-gray-500">
              Partner of {parentName}
            </span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export const LodgesForm: React.FC<LodgesFormProps> = ({
  minMembers = 3,
  maxMembers = 20,
  allowPartners = true,
  onComplete,
  className,
}) => {
  // Simple direct store access without complexity
  const { 
    attendees, 
    addMasonAttendee,
    removeAttendee,
    updateAttendee,
  } = useRegistrationStore();
  
  // Create debounced version of updateAttendee
  const debouncedUpdateAttendee = useDebouncedCallback(
    (attendeeId: string, updates: Partial<AttendeeData>) => {
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
  
  // Calculate member attendees directly without memoization
  const memberAttendees = attendees.filter(a => {
    // Check if this is a lodge member
    const isMember = lodgeMembers.some(m => m.attendeeId === a.attendeeId);
    
    // Check if this is a partner of a lodge member
    const isPartnerOfMember = a.isPartner && 
      lodgeMembers.some(m => m.attendeeId === a.isPartner);
    
    return isMember || isPartnerOfMember;
  });

  const editingAttendee = attendees.find(a => a.attendeeId === editingAttendeeId);

  // One-time initialization using a ref
  const isInitializedRef = React.useRef(false);
  
  // Initialize with one member (primary) - only runs once using an empty dependency array
  // This is safe because we have the isInitializedRef check
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      console.log('Initializing lodge members');
      
      // Only initialize if we have no lodge members
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

  // Update lodge details for all members
  const handleLodgeChange = useCallback((lodgeId: string, lodgeName: string) => {
    // Only update state if value has changed to prevent infinite loop
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
    // Only update if value has changed
    if (selectedGrandLodge !== grandLodgeId) {
      setSelectedGrandLodge(grandLodgeId);
      // Clear lodge selection when grand lodge changes
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

  // Validate and complete
  const handleComplete = useCallback(() => {
    // First, ensure all form data is saved
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

  // Simple, direct rendering approach without complex optimizations
  return (
    <div className={cn("space-y-6", className)}>
      {/* Lodge Details - Enhanced Design */}
      <div className="relative">
        <Card className="border-2 border-primary/20">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Building className="w-5 h-5" />
              Your Lodge
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              These details will be applied to all members in this registration
            </p>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="relative">
                  <GrandLodgeSelection 
                    value={selectedGrandLodge}
                    onChange={handleGrandLodgeChange}
                  />
                  {!selectedGrandLodge && (
                    <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                      </svg>
                      Required to proceed
                    </p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="relative">
                  {selectedGrandLodge ? (
                    <LodgeSelection 
                      grandLodgeId={selectedGrandLodge}
                      value={selectedLodge}
                      onChange={(lodgeId, lodgeName) => handleLodgeChange(lodgeId, lodgeName ?? '')}
                    />
                  ) : (
                    <div className="border rounded-md h-10 px-3 py-2 bg-gray-50 text-gray-400 flex items-center">
                      Select a Grand Lodge first
                    </div>
                  )}
                  {selectedGrandLodge && !selectedLodge && (
                    <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                      </svg>
                      Required to proceed
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Booking Contact Section */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-base font-medium flex items-center gap-2 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary">
                  <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                </svg>
                Booking Contact
              </h3>
              <div className="space-y-6">
                {/* Row 1: Title, First Name, Last Name, Rank */}
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-2">
                    <SelectField
                      label="Masonic Title"
                      name="primary-title"
                      value=""
                      onChange={() => {}}
                      options={[
                        { value: "Bro", label: "Bro" },
                        { value: "W Bro", label: "W Bro" },
                        { value: "VW Bro", label: "VW Bro" },
                        { value: "RW Bro", label: "RW Bro" },
                      ]}
                      disabled={!selectedLodge}
                      updateOnBlur={true}
                    />
                  </div>
                  
                  <div className="col-span-4">
                    <TextField
                      label="First Name"
                      name="primary-firstname"
                      value=""
                      onChange={() => {}}
                      disabled={!selectedLodge}
                      updateOnBlur={true}
                    />
                  </div>
                  
                  <div className="col-span-4">
                    <TextField
                      label="Last Name"
                      name="primary-lastname"
                      value=""
                      onChange={() => {}}
                      disabled={!selectedLodge}
                      updateOnBlur={true}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <SelectField
                      label="Rank"
                      name="primary-rank"
                      value=""
                      onChange={() => {}}
                      options={[
                        { value: "EA", label: "EA" },
                        { value: "FC", label: "FC" },
                        { value: "MM", label: "MM" },
                        { value: "IM", label: "IM" },
                        { value: "GL", label: "GL" },
                      ]}
                      disabled={!selectedLodge}
                      updateOnBlur={true}
                    />
                  </div>
                </div>
                
                {/* Row 2: Email, Phone */}
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-6">
                    <EmailField
                      label="Email Address"
                      name="primary-email"
                      value=""
                      onChange={() => {}}
                      disabled={!selectedLodge}
                      updateOnBlur={true}
                    />
                  </div>
                  <div className="col-span-6">
                    <PhoneField
                      label="Phone Number"
                      name="primary-phone"
                      value=""
                      onChange={() => {}}
                      disabled={!selectedLodge}
                      updateOnBlur={true}
                    />
                  </div>
                </div>
                
                {/* Row 3: Primary Contact Badge */}
                <div className="flex items-center">
                  <Badge className="bg-blue-50 hover:bg-blue-50 text-blue-700 border border-blue-200">Primary Contact</Badge>
                  <Badge className="ml-2 bg-gray-50 hover:bg-gray-50 text-gray-700 border border-gray-200">Mason</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <Card className={cn(
        "border transition-opacity duration-300",
        !selectedLodge && "opacity-70"
      )}>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Lodge Members ({memberAttendees.filter(a => !a.isPartner).length})
            </CardTitle>
            <div className="flex items-center gap-2">
              {memberAttendees.filter(a => !a.isPartner).length < minMembers && (
                <Badge variant="destructive" className="animate-pulse">
                  Need {minMembers - memberAttendees.filter(a => !a.isPartner).length} more
                </Badge>
              )}
              <Button
                onClick={handleAddMember}
                disabled={memberAttendees.filter(a => !a.isPartner).length >= maxMembers || !selectedLodge}
                size="sm"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Member
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-medium">Title</TableHead>
                <TableHead className="font-medium">First Name</TableHead>
                <TableHead className="font-medium">Last Name</TableHead>
                <TableHead className="font-medium">Rank</TableHead>
                <TableHead className="font-medium">Type</TableHead>
                <TableHead className="font-medium">Email</TableHead>
                <TableHead className="font-medium">Mobile</TableHead>
                <TableHead className="font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberAttendees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
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
                    attendeeId={attendee.attendeeId}
                    attendee={attendee} 
                    isMember={isMember}
                    isPrimary={member?.isPrimary || false}
                    onSetPrimary={() => {
                      // Set primary logic
                      const updatedMembers = lodgeMembers.map(m => ({
                        ...m,
                        isPrimary: m.attendeeId === attendee.attendeeId
                      }));
                      setLodgeMembers(updatedMembers);
                      
                      // Update isPrimary in store
                      memberAttendees.forEach(a => {
                        if (!a.isPartner) {
                          debouncedUpdateAttendee(a.attendeeId, { 
                            isPrimary: a.attendeeId === attendee.attendeeId 
                          });
                        }
                      });
                    }}
                    onRemove={() => {
                      // Remove member logic
                      if (attendee.partner) {
                        removeAttendee(attendee.partner);
                      }
                      removeAttendee(attendee.attendeeId);
                      setLodgeMembers(prev => prev.filter(m => m.attendeeId !== attendee.attendeeId));
                    }}
                    onTogglePartner={() => {
                      if (attendee.partner) {
                        // Remove partner
                        removeAttendee(attendee.partner);
                        updateAttendeeImmediate(attendee.attendeeId, { partner: null });
                      } else {
                        // Add partner
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
                    hasPartner={hasPartner}
                    parentName={parentAttendee?.firstName || ''}
                    onEdit={() => setEditingAttendeeId(attendee.attendeeId)}
                  />
                );
              })}
            </TableBody>
          </Table>
          
          {/* Empty State Guidance */}
          {selectedLodge && memberAttendees.filter(a => !a.isPartner).length < minMembers && (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 text-amber-500">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-amber-800">Minimum Members Required</h3>
                  <p className="mt-1 text-sm text-amber-700">
                    Lodge registrations require at least {minMembers} members to proceed.
                    Click "Add Member" to add {minMembers - memberAttendees.filter(a => !a.isPartner).length} more member{minMembers - memberAttendees.filter(a => !a.isPartner).length > 1 ? 's' : ''}.
                  </p>
                  <div className="mt-2">
                    <Button
                      onClick={handleAddMember}
                      disabled={memberAttendees.filter(a => !a.isPartner).length >= maxMembers || !selectedLodge}
                      size="sm"
                      variant="secondary"
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Member
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog - Enhanced */}
      <Dialog open={!!editingAttendeeId} onOpenChange={(open) => !open && setEditingAttendeeId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2 text-primary">
              {editingAttendee?.isPartner ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M1 8.25a1.25 1.25 0 112.5 0v7.5a1.25 1.25 0 11-2.5 0v-7.5zM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0114 3c0 .995-.182 1.948-.514 2.826-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 01-1.341 5.974C17.153 16.323 16.072 17 14.9 17h-3.192a3 3 0 01-1.341-.317l-2.734-1.366A3 3 0 006.292 15H5V8h.963c.685 0 1.258-.483 1.612-1.068a4.011 4.011 0 012.166-1.73c.432-.143.853-.386 1.011-.814.16-.432.248-.9.248-1.388z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                </svg>
              )}
              Edit {editingAttendee?.isPartner ? 'Partner' : 'Member'} Details
            </DialogTitle>
            {editingAttendee && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={editingAttendee.isPartner ? "secondary" : "default"}>
                  {editingAttendee.isPartner ? "Guest Partner" : "Mason"}
                </Badge>
                {lodgeMembers.find(m => m.attendeeId === editingAttendee.attendeeId)?.isPrimary && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Primary Contact
                  </Badge>
                )}
                <span className="text-sm text-gray-500">
                  {editingAttendee.attendeeType === 'Mason' ? 
                    `From ${lodgeName || 'selected lodge'}` : 
                    editingAttendee.isPartner ? 
                      `Partner of ${attendees.find(a => a.attendeeId === editingAttendee.isPartner)?.firstName || 'member'}` : 
                      'Guest'}
                </span>
              </div>
            )}
          </DialogHeader>
          {editingAttendee && (
            <div className="mt-4">
              <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm text-gray-600">
                <p className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-500">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                  </svg>
                  Fill in the details for this {editingAttendee.isPartner ? 'partner' : 'lodge member'}.
                </p>
                {editingAttendee.attendeeType === 'Mason' && (
                  <p className="mt-2">
                    Lodge information will be automatically applied to this member.
                  </p>
                )}
              </div>
              
              {editingAttendee.attendeeType === 'Mason' ? (
                <MasonForm
                  attendeeId={editingAttendee.attendeeId}
                  attendeeNumber={1}
                  isPrimary={lodgeMembers.find(m => m.attendeeId === editingAttendee.attendeeId)?.isPrimary || false}
                />
              ) : (
                <GuestForm
                  attendeeId={editingAttendee.attendeeId}
                  attendeeNumber={1}
                  isPrimary={false}
                />
              )}
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => {
                    // Discard changes by restoring original data from backup
                    if (editingAttendeeId) {
                      // This just closes the dialog without saving
                      setEditingAttendeeId(null);
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                  Discard
                </Button>
                
                <Button 
                  className="gap-2"
                  onClick={() => {
                    // Save changes to Zustand store
                    formSaveManager.saveBeforeNavigation().then(() => {
                      // Close the dialog after saving
                      setEditingAttendeeId(null);
                    });
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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