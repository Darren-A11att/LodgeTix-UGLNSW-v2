import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users } from 'lucide-react';
import { UnifiedAttendeeData } from '@/lib/registrationStore';
import { LodgeMemberRow } from './LodgeMemberRow';

interface LodgeMembersTableProps {
  memberAttendees: UnifiedAttendeeData[];
  lodgeMembers: Array<{ attendeeId: string; isPrimary: boolean }>;
  attendees: UnifiedAttendeeData[];
  onSetPrimary: (attendeeId: string) => void;
  onRemove: (attendeeId: string) => void;
  onTogglePartner: (attendeeId: string) => void;
  onEdit: (attendeeId: string) => void;
  debouncedUpdateAttendee: (attendeeId: string, updates: any) => void;
}

export const LodgeMembersTable: React.FC<LodgeMembersTableProps> = ({
  memberAttendees,
  lodgeMembers,
  attendees,
  onSetPrimary,
  onRemove,
  onTogglePartner,
  onEdit,
  debouncedUpdateAttendee
}) => {
  return (
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
              attendeeId={attendee.attendeeId}
              attendee={attendee}
              isMember={isMember}
              isPrimary={member?.isPrimary || false}
              onSetPrimary={() => onSetPrimary(attendee.attendeeId)}
              onRemove={() => onRemove(attendee.attendeeId)}
              onTogglePartner={() => onTogglePartner(attendee.attendeeId)}
              hasPartner={hasPartner}
              parentName={parentAttendee?.firstName || ''}
              onEdit={() => onEdit(attendee.attendeeId)}
            />
          );
        })}
      </TableBody>
    </Table>
  );
};