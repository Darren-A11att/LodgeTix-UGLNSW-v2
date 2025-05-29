import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Info, ShoppingCart, Users, Package, Check, Building, Plus, X, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import formSaveManager from '@/lib/formSaveManager';
import { useDebouncedCallback } from 'use-debounce';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

// Import form components
import { BasicInfo } from '../basic-details/BasicInfo';
import { ContactInfo } from '../basic-details/ContactInfo';
import { GrandOfficerFields } from '../mason/utils/GrandOfficerFields';
import { GrandOfficerDropdown } from '../shared/GrandOfficerDropdown';
import { MASON_TITLES, MASON_RANKS, GRAND_OFFICER_ROLES, GUEST_TITLES, PARTNER_RELATIONSHIPS } from '../attendee/utils/constants';
import { GrandLodgeSelection } from '../mason/lib/GrandLodgeSelection';
import AutocompleteInput from '../shared/AutocompleteInput';

// Import our new extracted components
import {
  BookingContactSection,
  AttendeeCounter,
  LodgeSelectionCard,
} from './components';
import { AttendeeData } from './types';
import { generateUUID } from '@/lib/uuid-slug-utils';

// Constants for form behavior
const DEBOUNCE_DELAY = 500; // Increased from 300ms to reduce re-renders

// Event and ticket IDs for Grand Proclamation 2025
const EVENT_IDS = {
  GRAND_PROCLAMATION: '307c2d85-72d5-48cf-ac94-082ca2a5d23d',
  GALA_DINNER: '03a51924-1606-47c9-838d-9dc32657cd59',
  CEREMONY: '6c12952b-7cf3-4d6a-81bd-1ac3b7ff7076'
};

// Table package configuration (10 tickets per table)
const TABLE_SIZE = 10;
const TABLE_PRICE = 1950; // $195 per ticket x 10 = $1950 per table

interface GrandLodgesFormProps {
  minTables?: number;
  maxTables?: number;
  onComplete?: () => void;
  className?: string;
}

interface TableOrder {
  tableCount: number;
  totalTickets: number;
  totalPrice: number;
}

interface DelegationMember {
  id: string;
  type: 'Mason' | 'Guest' | 'Partner';
  title: string;
  firstName: string;
  lastName: string;
  grandRank?: string;
  isGrandOfficer?: boolean;
  grandOffice?: string;
  relationship?: string;
  partnerOf?: string;
  isEditing?: boolean;
}

export const GrandLodgesForm: React.FC<GrandLodgesFormProps> = ({
  minTables = 1,
  maxTables = 10,
  onComplete,
  className,
}) => {
  const { 
    attendees, 
    addMasonAttendee,
    addGuestAttendee,
    addPartnerAttendee,
    updateAttendee,
    setLodgeTicketOrder,
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
  const [primaryAttendeeId, setPrimaryAttendeeId] = useState<string | null>(null);
  const [tableCount, setTableCount] = useState(1);
  const [ticketCount, setTicketCount] = useState(1);
  const [tableOrder, setTableOrder] = useState<TableOrder>({
    tableCount: 1,
    totalTickets: TABLE_SIZE,
    totalPrice: TABLE_PRICE
  });
  const [activeTab, setActiveTab] = useState<'purchaseOnly' | 'registerDelegation'>('purchaseOnly');
  const [delegationMembers, setDelegationMembers] = useState<DelegationMember[]>([]);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<DelegationMember | null>(null);
  const [delegationOrder, setDelegationOrder] = useState(1);
  
  // Get the primary attendee
  const primaryAttendee = attendees.find(a => a.attendeeId === primaryAttendeeId);

  // Update table order when count changes
  useEffect(() => {
    setTableOrder({
      tableCount,
      totalTickets: tableCount * TABLE_SIZE,
      totalPrice: tableCount * TABLE_PRICE
    });
  }, [tableCount]);
  
  // Initialize Grand Lodge from primary attendee when loaded
  useEffect(() => {
    if (primaryAttendee && !selectedGrandLodge && primaryAttendee.grandLodgeId) {
      // Initialize Grand Lodge
      setSelectedGrandLodge(String(primaryAttendee.grandLodgeId));
    }
  }, [primaryAttendee, selectedGrandLodge]);

  // One-time initialization
  const isInitializedRef = React.useRef(false);
  
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      
      if (!primaryAttendeeId) {
        const primaryId = addMasonAttendee();
        updateAttendeeImmediate(primaryId, {
          isPrimary: true,
          attendeeType: 'Mason',
        });
        setPrimaryAttendeeId(primaryId);
      }
    }
  }, [primaryAttendeeId, addMasonAttendee, updateAttendeeImmediate]);

  // Update table count (for register delegation)
  const handleTableCountChange = useCallback((newCount: number) => {
    if (newCount >= minTables && newCount <= maxTables) {
      setTableCount(newCount);
      // Store the table order in the registration store
      if (setLodgeTicketOrder) {
        setLodgeTicketOrder({
          tableCount: newCount,
          totalTickets: newCount * TABLE_SIZE,
          galaDinnerTickets: newCount * TABLE_SIZE,
          ceremonyTickets: newCount * TABLE_SIZE,
          eventId: EVENT_IDS.GRAND_PROCLAMATION,
          galaDinnerEventId: EVENT_IDS.GALA_DINNER,
          ceremonyEventId: EVENT_IDS.CEREMONY,
        });
      }
    }
  }, [minTables, maxTables, setLodgeTicketOrder]);

  // Update ticket count (for purchase only)
  const handleTicketCountChange = useCallback((newCount: number) => {
    if (newCount >= 1 && newCount <= 100) {
      setTicketCount(newCount);
      // Store the ticket order
      if (setLodgeTicketOrder) {
        setLodgeTicketOrder({
          tableCount: 0, // No tables, just tickets
          totalTickets: newCount,
          galaDinnerTickets: newCount,
          ceremonyTickets: newCount,
          eventId: EVENT_IDS.GRAND_PROCLAMATION,
          galaDinnerEventId: EVENT_IDS.GALA_DINNER,
          ceremonyEventId: EVENT_IDS.CEREMONY,
        });
      }
    }
  }, [setLodgeTicketOrder]);

  // Update Grand Lodge for primary attendee - No Lodge selection needed for Grand Lodges
  const handleGrandLodgeChange = useCallback((grandLodgeId: string) => {
    if (selectedGrandLodge !== grandLodgeId) {
      setSelectedGrandLodge(grandLodgeId);
      
      if (primaryAttendee) {
        const updates: any = { 
          grandLodgeId: grandLodgeId ? Number(grandLodgeId) : 0,
        };
        debouncedUpdateAttendee(primaryAttendee.attendeeId, updates);
      }
    }
  }, [primaryAttendee, debouncedUpdateAttendee, selectedGrandLodge]);

  // Add delegation member functions
  const addDelegationMember = useCallback((type: 'Mason' | 'Guest' | 'Partner', partnerOfId?: string) => {
    const newMember: DelegationMember = {
      id: generateUUID(),
      type,
      title: type === 'Mason' ? 'Bro' : type === 'Guest' ? 'Mr' : 'Mrs',
      firstName: '',
      lastName: '',
      grandRank: type === 'Mason' ? 'GKL' : undefined,
      isGrandOfficer: type === 'Mason',
      grandOffice: '',
      relationship: type === 'Partner' ? 'Wife' : undefined,
      partnerOf: partnerOfId,
      isEditing: true
    };
    setDelegationMembers([...delegationMembers, newMember]);
    setEditingMember(newMember);
  }, [delegationMembers]);

  const updateDelegationMember = useCallback((memberId: string, updates: Partial<DelegationMember>) => {
    setDelegationMembers(delegationMembers.map(member => 
      member.id === memberId ? { ...member, ...updates } : member
    ));
  }, [delegationMembers]);

  const removeDelegationMember = useCallback((memberId: string) => {
    setDelegationMembers(delegationMembers.filter(member => member.id !== memberId));
  }, [delegationMembers]);

  // Get available grand offices for autocomplete
  const grandOfficeOptions = GRAND_OFFICER_ROLES.map(role => ({
    value: role,
    label: role
  }));

  // Field change handler for BookingContactSection
  // Use primaryAttendeeId instead of primaryAttendee to reduce dependency changes
  const handleFieldChange = useCallback((field: string, value: any) => {
    if (primaryAttendeeId) {
      debouncedUpdateAttendee(primaryAttendeeId, { [field]: value });
    }
  }, [debouncedUpdateAttendee, primaryAttendeeId]);

  const handleFieldChangeImmediate = useCallback((field: string, value: any) => {
    if (primaryAttendeeId) {
      updateAttendeeImmediate(primaryAttendeeId, { [field]: value });
    }
  }, [updateAttendeeImmediate, primaryAttendeeId]);

  // Validate and complete
  const handleComplete = useCallback(() => {
    formSaveManager.saveBeforeNavigation().then(() => {
      if (!selectedGrandLodge) {
        alert('Please select a Grand Lodge');
        return;
      }
      
      if (!primaryAttendee || !primaryAttendee.firstName || !primaryAttendee.lastName) {
        alert('Please complete the booking contact details');
        return;
      }
      
      if (activeTab === 'purchaseOnly') {
        // For purchase only, validate ticket count
        if (ticketCount < 1) {
          alert('Please select at least 1 ticket');
          return;
        }
        
        // Store ticket order
        if (setLodgeTicketOrder) {
          setLodgeTicketOrder({
            tableCount: 0,
            totalTickets: ticketCount,
            galaDinnerTickets: ticketCount,
            ceremonyTickets: ticketCount,
            eventId: EVENT_IDS.GRAND_PROCLAMATION,
            galaDinnerEventId: EVENT_IDS.GALA_DINNER,
            ceremonyEventId: EVENT_IDS.CEREMONY,
          });
        }
        
        // Skip directly to payment step (step 3)
        if (onComplete) {
          // Set flag to skip ticket selection step
          useRegistrationStore.getState().setCurrentStep(3);
          onComplete();
        }
      } else {
        // For register delegation, validate delegation members
        if (delegationMembers.length === 0) {
          alert('Please add at least one delegation member');
          return;
        }
        
        // Validate all members have required fields
        const invalidMembers = delegationMembers.filter(member => 
          !member.firstName || !member.lastName || !member.title ||
          (member.type === 'Mason' && (!member.grandRank || !member.grandOffice))
        );
        
        if (invalidMembers.length > 0) {
          alert('Please complete all required fields for delegation members');
          return;
        }
        
        // Convert delegation members to attendees
        delegationMembers.forEach((member, index) => {
          if (member.type === 'Mason') {
            const attendeeId = addMasonAttendee();
            updateAttendee(attendeeId, {
              title: member.title,
              firstName: member.firstName,
              lastName: member.lastName,
              suffix: member.grandRank,
              rank: 'GL',
              grandOfficerStatus: 'Present',
              presentGrandOfficerRole: member.grandOffice,
              grandLodgeId: Number(selectedGrandLodge),
              contactPreference: 'PrimaryAttendee',
              isPrimary: index === 0 && !primaryAttendeeId
            });
          } else if (member.type === 'Guest') {
            const attendeeId = addGuestAttendee();
            updateAttendee(attendeeId, {
              title: member.title,
              firstName: member.firstName,
              lastName: member.lastName,
              contactPreference: 'PrimaryAttendee'
            });
          } else if (member.type === 'Partner' && member.partnerOf) {
            const attendeeId = addPartnerAttendee(member.partnerOf);
            if (attendeeId) {
              updateAttendee(attendeeId, {
                title: member.title,
                firstName: member.firstName,
                lastName: member.lastName,
                relationship: member.relationship || 'Wife',
                contactPreference: 'PrimaryAttendee'
              });
            }
          }
        });
        
        if (onComplete) {
          onComplete();
        }
      }
    });
  }, [selectedGrandLodge, primaryAttendee, activeTab, ticketCount, delegationMembers, onComplete, setLodgeTicketOrder, addMasonAttendee, addGuestAttendee, addPartnerAttendee, updateAttendee, primaryAttendeeId]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Grand Lodge Selection with integrated Booking Contact */}
      <div className="relative">
        <Card className="border-2 border-primary/20">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Building className="w-5 h-5" />
              Grand Lodge Details
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              These details will be applied to all members in this registration
            </p>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Grand Lodge Selection Field - No Lodge selection needed for Grand Lodges */}
            <div className="space-y-2">
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
            
            {/* Booking Contact Details */}
            {primaryAttendee && (
              <BookingContactDetails
                primaryAttendee={primaryAttendee}
                handleFieldChange={handleFieldChange}
                handleFieldChangeImmediate={handleFieldChangeImmediate}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Registration Type Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'purchaseOnly' | 'registerDelegation')} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="purchaseOnly">Purchase Tickets Only</TabsTrigger>
          <TabsTrigger value="registerDelegation">Register Delegation</TabsTrigger>
        </TabsList>

        {/* Purchase Tickets Only Tab */}
        <TabsContent value="purchaseOnly" className="mt-6">
          <Card className={cn(
            "border-2 border-primary/20 transition-opacity duration-300",
            !selectedGrandLodge && "opacity-70"
          )}>
            <CardHeader className="py-4 px-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-primary font-medium text-lg">
                  <ShoppingCart className="w-5 h-5" />
                  Ticket Purchase
                </CardTitle>
                <Badge className="bg-blue-100 text-blue-800 border-0">
                  Grand Proclamation 2025
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-8">
                {/* Column 1: Package Info */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg mb-4">Grand Proclamation Package</h3>
                  
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="w-5 h-5 text-primary" />
                          <h4 className="font-medium">Individual Ticket</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Complete package per attendee including:
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1 ml-4">
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-600" />
                            Installation Ceremony
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-600" />
                            Grand Banquet Gala Dinner
                          </li>
                        </ul>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">$195</p>
                        <p className="text-sm text-gray-500">per ticket</p>
                      </div>
                    </div>
                  </div>

                  <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-sm">
                      Purchase tickets now and provide attendee details later.
                      This option will skip directly to payment.
                    </AlertDescription>
                  </Alert>
                </div>

                {/* Column 2: Ticket Count and Summary */}
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="ticket-count" className="text-base font-medium mb-2 block">
                      Number of Tickets
                    </Label>
                    <AttendeeCounter
                      id="ticket-count"
                      label=""
                      value={ticketCount}
                      min={1}
                      max={100}
                      onChange={handleTicketCountChange}
                      disabled={!selectedGrandLodge}
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      {ticketCount} {ticketCount === 1 ? 'ticket' : 'tickets'}
                    </p>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                    <h4 className="font-medium text-lg">Order Summary</h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Tickets</span>
                        <span className="font-medium">{ticketCount} × $195</span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total Amount</span>
                        <span className="text-2xl font-bold text-primary">
                          ${(ticketCount * 195).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Register Delegation Tab */}
        <TabsContent value="registerDelegation" className="mt-6">
          <Card className={cn(
            "border-2 border-primary/20",
            !selectedGrandLodge && "opacity-70"
          )}>
            <CardHeader className="py-4 px-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-primary font-medium text-lg">
                  <Users className="w-5 h-5" />
                  Delegation Members
                </CardTitle>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="delegation-order">Delegation Order:</Label>
                    <Input
                      id="delegation-order"
                      type="number"
                      value={delegationOrder}
                      onChange={(e) => setDelegationOrder(Number(e.target.value))}
                      className="w-20"
                      min={1}
                      max={999}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addDelegationMember('Mason')}
                      disabled={!selectedGrandLodge}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Add Mason
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddMemberDialog(true)}
                      disabled={!selectedGrandLodge || delegationMembers.length === 0}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Add Partner
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addDelegationMember('Guest')}
                      disabled={!selectedGrandLodge}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Add Guest
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {delegationMembers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No delegation members added yet.</p>
                  <p className="text-sm mt-2">Click the buttons above to add members.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>First Name</TableHead>
                      <TableHead>Last Name</TableHead>
                      <TableHead>Grand Rank</TableHead>
                      <TableHead>Grand Office</TableHead>
                      <TableHead>Relationship</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {delegationMembers.map((member, index) => (
                      <DelegationMemberRow
                        key={member.id}
                        member={member}
                        index={index}
                        onUpdate={updateDelegationMember}
                        onRemove={removeDelegationMember}
                        grandOfficeOptions={grandOfficeOptions}
                        delegationMembers={delegationMembers}
                      />
                    ))}
                  </TableBody>
                </Table>
              )}

              {delegationMembers.length > 0 && (
                <Alert className="mt-6 border-amber-200 bg-amber-50">
                  <Info className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700 text-sm">
                    All delegation members will be registered under {selectedGrandLodge ? 'the selected Grand Lodge' : 'your Grand Lodge'}.
                    Contact details will default to the primary attendee.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      

      {/* Add Partner Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Partner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Select which delegation member this partner belongs to:</p>
            <Select onValueChange={(memberId) => {
              addDelegationMember('Partner', memberId);
              setShowAddMemberDialog(false);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select delegation member" />
              </SelectTrigger>
              <SelectContent>
                {delegationMembers
                  .filter(m => m.type === 'Mason' || m.type === 'Guest')
                  .map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.firstName} {member.lastName}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Delegation Member Row Component
const DelegationMemberRow: React.FC<{
  member: DelegationMember;
  index: number;
  onUpdate: (id: string, updates: Partial<DelegationMember>) => void;
  onRemove: (id: string) => void;
  grandOfficeOptions: { value: string; label: string }[];
  delegationMembers: DelegationMember[];
}> = ({ member, index, onUpdate, onRemove, grandOfficeOptions, delegationMembers }) => {
  const [isEditing, setIsEditing] = useState(member.isEditing || false);

  const handleSave = () => {
    if (member.firstName && member.lastName && member.title) {
      onUpdate(member.id, { isEditing: false });
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <TableRow>
        <TableCell>{index + 1}</TableCell>
        <TableCell>{member.type}</TableCell>
        <TableCell>
          <Select
            value={member.title}
            onValueChange={(value) => onUpdate(member.id, { title: value })}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {member.type === 'Mason' ? 
                MASON_TITLES.map(title => (
                  <SelectItem key={title} value={title}>{title}</SelectItem>
                )) :
                GUEST_TITLES.map(title => (
                  <SelectItem key={title} value={title}>{title}</SelectItem>
                ))
              }
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          <Input
            value={member.firstName}
            onChange={(e) => onUpdate(member.id, { firstName: e.target.value })}
            placeholder="First name"
            className="w-32"
          />
        </TableCell>
        <TableCell>
          <Input
            value={member.lastName}
            onChange={(e) => onUpdate(member.id, { lastName: e.target.value })}
            placeholder="Last name"
            className="w-32"
          />
        </TableCell>
        <TableCell>
          {member.type === 'Mason' ? (
            <Input
              value={member.grandRank || 'GKL'}
              onChange={(e) => onUpdate(member.id, { grandRank: e.target.value })}
              placeholder="GKL"
              className="w-20"
            />
          ) : '-'}
        </TableCell>
        <TableCell>
          {member.type === 'Mason' ? (
            <AutocompleteInput
              id={`grand-office-${member.id}`}
              name="grandOffice"
              value={member.grandOffice || ''}
              onChange={(value) => onUpdate(member.id, { grandOffice: value })}
              options={grandOfficeOptions}
              getOptionLabel={(option) => option.label}
              getOptionValue={(option) => option.value}
              placeholder="Select or type"
              className="w-40"
              allowCreate={true}
              createNewText="Use"
            />
          ) : '-'}
        </TableCell>
        <TableCell>
          {member.type === 'Partner' ? (
            <Select
              value={member.relationship || ''}
              onValueChange={(value) => onUpdate(member.id, { relationship: value })}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PARTNER_RELATIONSHIPS.map(rel => (
                  <SelectItem key={rel} value={rel}>{rel}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : member.type === 'Guest' ? (
            <Input
              value={member.relationship || ''}
              onChange={(e) => onUpdate(member.id, { relationship: e.target.value })}
              placeholder="e.g., Friend"
              className="w-28"
            />
          ) : '-'}
        </TableCell>
        <TableCell>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={handleSave}>
              <Check className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onRemove(member.id)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  // View mode
  const partnerOfMember = member.partnerOf ? 
    delegationMembers.find(m => m.id === member.partnerOf) : null;

  return (
    <TableRow>
      <TableCell>{index + 1}</TableCell>
      <TableCell>{member.type}</TableCell>
      <TableCell>{member.title}</TableCell>
      <TableCell>{member.firstName}</TableCell>
      <TableCell>{member.lastName}</TableCell>
      <TableCell>{member.type === 'Mason' ? member.grandRank : '-'}</TableCell>
      <TableCell>{member.type === 'Mason' ? member.grandOffice : '-'}</TableCell>
      <TableCell>
        {member.type === 'Partner' && partnerOfMember ? 
          `${member.relationship} of ${partnerOfMember.firstName} ${partnerOfMember.lastName}` :
          member.relationship || '-'
        }
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onRemove(member.id)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

// Summary view for Grand Lodge orders
export const GrandLodgeFormSummary: React.FC = () => {
  const { attendees, lodgeTicketOrder } = useRegistrationStore();
  
  const primaryAttendee = attendees.find(a => a.isPrimary);
  const grandLodgeName = primaryAttendee?.grandLodgeId ? 'Grand Lodge' : 'Grand Lodge';

  if (!lodgeTicketOrder) {
    return null;
  }

  const isPurchaseOnly = lodgeTicketOrder.tableCount === 0;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        {isPurchaseOnly ? 'Grand Lodge Ticket Purchase' : 'Grand Lodge Delegation'} Summary
      </h3>
      
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div>
              <p className="font-medium text-lg">{grandLodgeName}</p>
              <p className="text-sm text-gray-600">
                Contact: {primaryAttendee?.title} {primaryAttendee?.firstName} {primaryAttendee?.lastName}
              </p>
            </div>
            
            <div className="border-t pt-3 space-y-2">
              {isPurchaseOnly ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tickets Purchased</span>
                    <span className="font-medium">{lodgeTicketOrder.totalTickets}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">• Gala Dinner</span>
                    <span>{lodgeTicketOrder.galaDinnerTickets} tickets</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">• Ceremony</span>
                    <span>{lodgeTicketOrder.ceremonyTickets} tickets</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Delegation Members</span>
                    <span className="font-medium">{attendees.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">• Masons</span>
                    <span>{attendees.filter(a => a.attendeeType === 'Mason').length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">• Guests</span>
                    <span>{attendees.filter(a => a.attendeeType === 'Guest').length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">• Partners</span>
                    <span>{attendees.filter(a => a.isPartner).length}</span>
                  </div>
                </>
              )}
            </div>
            
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Amount</span>
                <span className="text-lg font-bold text-primary">
                  ${(lodgeTicketOrder.totalTickets * 195).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert className="border-amber-200 bg-amber-50">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-700 text-sm">
          {isPurchaseOnly ? 
            'Attendee details can be allocated to these tickets at any time before the event.' :
            'All delegation members have been registered with their details.'
          }
        </AlertDescription>
      </Alert>
    </div>
  );
};

// Export an alias for backward compatibility
// Removed duplicate export - LodgeFormSummary is exported from LodgesForm.tsx

// Memoized booking contact details to prevent re-renders
const BookingContactDetails = React.memo(({ 
  primaryAttendee, 
  handleFieldChange, 
  handleFieldChangeImmediate 
}: {
  primaryAttendee: any;
  handleFieldChange: (field: string, value: any) => void;
  handleFieldChangeImmediate: (field: string, value: any) => void;
}) => {
  return (
    <div className="space-y-4 border-t pt-6">
      <h3 className="text-base font-medium">Booking Contact</h3>
      
      {/* Name and Title Row - following MasonForm layout */}
      <div className="grid grid-cols-12 gap-4">
        {/* Masonic Title - 2 columns */}
        <div className="col-span-2">
          <Label>Title *</Label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={primaryAttendee.title || ''}
            onChange={(e) => handleFieldChangeImmediate('title', e.target.value)}
          >
            <option value="">Select</option>
            {MASON_TITLES.map(title => (
              <option key={title} value={title}>{title}</option>
            ))}
          </select>
        </div>
        
        {/* First Name - 4 columns */}
        <div className="col-span-4">
          <Label>First Name *</Label>
          <input
            type="text"
            className="w-full border rounded-md px-3 py-2"
            value={primaryAttendee.firstName || ''}
            onChange={(e) => handleFieldChange('firstName', e.target.value)}
            required
          />
        </div>
        
        {/* Last Name - 4 columns */}
        <div className="col-span-4">
          <Label>Last Name *</Label>
          <input
            type="text"
            className="w-full border rounded-md px-3 py-2"
            value={primaryAttendee.lastName || ''}
            onChange={(e) => handleFieldChange('lastName', e.target.value)}
            required
          />
        </div>
        
        {/* Rank - 2 columns */}
        <div className="col-span-2">
          <Label>Rank *</Label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={primaryAttendee.rank || ''}
            onChange={(e) => handleFieldChangeImmediate('rank', e.target.value)}
          >
            <option value="">Select</option>
            {MASON_RANKS.map(rank => (
              <option key={rank.value} value={rank.value}>{rank.label}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Grand Officer Fields - show if rank is GL */}
      {primaryAttendee.rank === 'GL' && (
        <GrandOfficerFields
          data={primaryAttendee}
          onChange={handleFieldChangeImmediate}
          required={true}
        />
      )}
      
      {/* Contact Information */}
      <ContactInfo
        data={primaryAttendee}
        isPrimary={true}
        onChange={handleFieldChange}
      />
    </div>
  );
});

BookingContactDetails.displayName = 'BookingContactDetails';