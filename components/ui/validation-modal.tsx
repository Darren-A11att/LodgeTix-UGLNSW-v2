import React from 'react';
import { AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ValidationError {
  field: string;
  message: string;
}

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  errors: ValidationError[];
  title?: string;
  description?: string;
}

export const ValidationModal: React.FC<ValidationModalProps> = ({
  isOpen,
  onClose,
  errors,
  title = "Please Complete Required Fields",
  description = "The following fields need your attention:"
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ul className="space-y-2">
            {errors.map((error, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <div>
                  <span className="font-medium text-sm">{error.field}:</span>
                  <span className="text-sm text-muted-foreground ml-1">
                    {error.message}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="default">
            OK, I'll Fix These
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};