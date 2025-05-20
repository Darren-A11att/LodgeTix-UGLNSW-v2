import React from 'react';
import { Button } from "@/components/ui/button";

interface LadyPartnerToggleProps {
  hasPartner: boolean;
  onToggle: () => void;
}

const LadyPartnerToggle: React.FC<LadyPartnerToggleProps> = ({
  hasPartner,
  onToggle
}) => {
  return (
    <div className="mt-6 border-t border-slate-200 pt-4 flex justify-center">
      <Button
        onClick={onToggle}
        variant={hasPartner ? "outline" : "default"}
        className={hasPartner
          ? "border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
          : "bg-masonic-gold text-masonic-navy hover:bg-masonic-lightgold"
        }
      >
        {hasPartner ? 'Remove Lady or Partner' : 'Register Partner'}
      </Button>
    </div>
  );
};

export default LadyPartnerToggle;