import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DraftRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  onStartNew: () => void;
  registrationType?: string | null;
  lastSaved?: string | null;
  attendeeCount?: number;
}

const DraftRecoveryModal: React.FC<DraftRecoveryModalProps> = ({
  isOpen,
  onClose, 
  onContinue,
  onStartNew,
  registrationType,
  lastSaved,
  attendeeCount = 0,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="w-[90%] max-w-md sm:w-full rounded-lg">
        <AlertDialogHeader className="space-y-3">
          <AlertDialogTitle className="text-xl text-center">
            Draft Registration Found
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-base">
            You have a registration in progress. Would you like to continue with your current draft or start a new registration?
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex-col sm:flex-row gap-3 pt-4">
          <AlertDialogCancel 
            onClick={onClose}
            className="w-full text-base font-normal"
          >
            Cancel
          </AlertDialogCancel>
          
          <AlertDialogAction
            onClick={onStartNew}
            className="w-full bg-red-600 hover:bg-red-700 text-white p-3 text-base font-medium"
          >
            Start New
          </AlertDialogAction>
          
          <AlertDialogAction
            onClick={onContinue}
            className="w-full bg-masonic-navy hover:bg-masonic-blue text-white p-3 text-base font-medium"
          >
            Continue Draft
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DraftRecoveryModal; 