import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface MinimumMembersAlertProps {
  currentCount: number;
  minMembers: number;
  onAddMember: () => void;
  disabled?: boolean;
}

export const MinimumMembersAlert: React.FC<MinimumMembersAlertProps> = ({
  currentCount,
  minMembers,
  onAddMember,
  disabled = false
}) => {
  const membersNeeded = minMembers - currentCount;
  
  if (currentCount >= minMembers) return null;

  return (
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
            Lodge registrations require at least {minMembers} members to proceed. Click "Add Member" to add {membersNeeded} more member{membersNeeded > 1 ? 's' : ''}.
          </p>
          <div className="mt-3">
            <Button
              onClick={onAddMember}
              disabled={disabled}
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
  );
};