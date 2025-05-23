import React from 'react';
import { Save, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Draft Registration Found
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            You have a registration in progress. Would you like to
            continue with your current draft or start a new
            registration?
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 w-full justify-center">
          <div className="flex flex-col sm:flex-row gap-2 justify-center w-full">
            <Button 
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            
            <Button 
              variant="destructive"
              className="flex-1"
              onClick={onStartNew}
            >
              Start New
            </Button>
            
            <Button 
              variant="default"
              className="flex-1"
              onClick={onContinue}
            >
              Continue Draft
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DraftRecoveryModal; 