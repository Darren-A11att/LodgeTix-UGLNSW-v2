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
        updateAttendee(primaryId, {
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
    updateAttendee(newId, {
      grandLodgeId: selectedGrandLodge,
      lodgeId: selectedLodge,
      lodgeNameNumber: lodgeName,
    });
    
    setLodgeMembers(prev => [...prev, { attendeeId: newId, isPrimary: false }]);
    setEditingAttendeeId(newId);
  }, [addMasonAttendee, updateAttendee, selectedGrandLodge, selectedLodge, lodgeName, memberAttendees, maxMembers]);

  // Update lodge details for all members
  const handleLodgeChange = useCallback((lodgeId: string, lodgeName: string) => {
    setSelectedLodge(lodgeId);
    setLodgeName(lodgeName);
    
    memberAttendees.forEach(attendee => {
      if (!attendee.isPartner) {
        updateAttendee(attendee.attendeeId, { 
          grandLodgeId: selectedGrandLodge,
          lodgeId,
          lodgeNameNumber: lodgeName,
        });
      }
    });
  }, [memberAttendees, updateAttendee, selectedGrandLodge]);

  // Update Grand Lodge for all members
  const handleGrandLodgeChange = useCallback((grandLodgeId: string) => {
    setSelectedGrandLodge(grandLodgeId);
    // Clear lodge selection when grand lodge changes
    setSelectedLodge('');
    setLodgeName('');
    
    memberAttendees.forEach(attendee => {
      if (!attendee.isPartner) {
        updateAttendee(attendee.attendeeId, { 
          grandLodgeId,
          lodgeId: '',
          lodgeNameNumber: '',
        });
      }
    });
  }, [memberAttendees, updateAttendee]);

  // Validate and complete
  const handleComplete = useCallback(() => {
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
  }, [selectedGrandLodge, selectedLodge, lodgeMembers, minMembers, onComplete]);

  // Simple, direct rendering approach without complex optimizations
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Building className="w-6 h-6" />
          Lodge Registration
        </h2>
        <p className="text-gray-600 mt-1">
          Register multiple members from your lodge
        </p>
      </div>

      {/* Lodge Details */}
      <Card>
        <CardHeader>
          <CardTitle>Lodge Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Grand Lodge</Label>
            <GrandLodgeSelection 
              value={selectedGrandLodge}
              onChange={handleGrandLodgeChange}
            />
          </div>
          
          {selectedGrandLodge && (
            <div>
              <Label>Lodge</Label>
              <LodgeSelection 
                grandLodgeId={selectedGrandLodge}
                value={selectedLodge}
                onChange={(lodgeId, lodgeName) => handleLodgeChange(lodgeId, lodgeName ?? '')}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Lodge Members ({memberAttendees.filter(a => !a.isPartner).length})
            </CardTitle>
            <div className="flex items-center gap-2">
              {memberAttendees.filter(a => !a.isPartner).length < minMembers && (
                <Badge variant="destructive">
                  Need {minMembers - memberAttendees.filter(a => !a.isPartner).length} more
                </Badge>
              )}
              <Button
                onClick={handleAddMember}
                disabled={memberAttendees.filter(a => !a.isPartner).length >= maxMembers}
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
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Rank</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
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
                          updateAttendee(a.attendeeId, { 
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
                        updateAttendee(attendee.attendeeId, { partner: null });
                      } else {
                        // Add partner
                        const newPartnerId = addMasonAttendee();
                        if (newPartnerId) {
                          updateAttendee(attendee.attendeeId, { partner: newPartnerId });
                          updateAttendee(newPartnerId, {
                            isPartner: attendee.attendeeId,
                            attendeeType: 'Guest',
                            grandLodgeId: selectedGrandLodge,
                            lodgeId: selectedLodge,
                            lodgeNameNumber: lodgeName,
                          });
                        }
                      }
                    }}
                    hasPartner={hasPartner}
                    parentName={parentAttendee?.firstName}
                    onEdit={() => setEditingAttendeeId(attendee.attendeeId)}
                  />
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add member reminder */}
      {memberAttendees.filter(a => !a.isPartner).length < minMembers && (
        <Alert variant="destructive">
          <AlertDescription>
            You need at least {minMembers - memberAttendees.filter(a => !a.isPartner).length} more member{minMembers - memberAttendees.filter(a => !a.isPartner).length > 1 ? 's' : ''} to proceed.
          </AlertDescription>
        </Alert>
      )}

      <Separator />

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{memberAttendees.filter(a => !a.isPartner).length}</p>
              <p className="text-sm text-gray-600">Lodge Members</p>
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
                {lodgeName || 'No Lodge Selected'}
              </p>
              <p className="text-sm text-gray-600">Lodge</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between">
        <Button variant="outline">
          Save Draft
        </Button>
        <Button 
          onClick={handleComplete}
          disabled={memberAttendees.filter(a => !a.isPartner).length < minMembers || !selectedLodge}
        >
          Continue to Tickets
        </Button>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingAttendeeId} onOpenChange={(open) => !open && setEditingAttendeeId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit {editingAttendee?.isPartner ? 'Partner' : 'Member'} Details
            </DialogTitle>
          </DialogHeader>
          {editingAttendee && (
            <div className="mt-4">
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