import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PlusCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PartnerToggleProps {
  hasPartner: boolean;
  onToggle: () => void;
  partnerLabel?: string;
  addText?: string;
  removeText?: string;
  useSwitch?: boolean;
  disabled?: boolean;
  className?: string;
}

export const PartnerToggle: React.FC<PartnerToggleProps> = ({
  hasPartner,
  onToggle,
  partnerLabel = "Partner",
  addText = "Add Partner",
  removeText = "Remove Partner",
  useSwitch = false,
  disabled = false,
  className,
}) => {
  if (useSwitch) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <Switch
          id="partner-toggle"
          checked={hasPartner}
          onCheckedChange={onToggle}
          disabled={disabled}
        />
        <Label 
          htmlFor="partner-toggle"
          className={cn(
            "cursor-pointer",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          Include {partnerLabel}
        </Label>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant={hasPartner ? "destructive" : "outline"}
      size="sm"
      onClick={onToggle}
      disabled={disabled}
      className={cn("transition-all", className)}
    >
      {hasPartner ? (
        <>
          <XCircle className="w-4 h-4 mr-2" />
          {removeText}
        </>
      ) : (
        <>
          <PlusCircle className="w-4 h-4 mr-2" />
          {addText}
        </>
      )}
    </Button>
  );
};

export default PartnerToggle;