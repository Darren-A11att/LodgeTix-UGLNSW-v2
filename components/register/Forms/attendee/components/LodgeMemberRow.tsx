import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, UserPlus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UnifiedAttendeeData } from '@/lib/registrationStore';

interface LodgeMemberRowProps {
  attendee: UnifiedAttendeeData;
  isMember: boolean;
  isPrimary: boolean;
  hasPartner: boolean;
  parentName?: string;
  onSetPrimary: () => void;
  onRemove: () => void;
  onTogglePartner: () => void;
  onEdit: () => void;
}

export const LodgeMemberRow: React.FC<LodgeMemberRowProps> = ({
  attendee,
  isMember,
  isPrimary,
  hasPartner,
  parentName,
  onSetPrimary,
  onRemove,
  onTogglePartner,
  onEdit
}) => {
  if (!attendee) return null;

  const isPartner = !!attendee.isPartner;

  return (
    <TableRow className={isPartner ? 'bg-gray-50' : ''}>
      <TableCell className="pl-6">
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
      <TableCell className="pr-6">
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
};