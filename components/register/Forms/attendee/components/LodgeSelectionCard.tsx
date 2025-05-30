import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building } from 'lucide-react';
import { GrandLodgeSelection } from '../../mason/lib/GrandLodgeSelection';
import { LodgeSelection } from '../../mason/lib/LodgeSelection';

interface LodgeSelectionCardProps {
  selectedGrandLodge: string;
  selectedLodge: string;
  onGrandLodgeChange: (grandLodgeId: string) => void;
  onLodgeChange: (lodgeId: string, lodgeName: string) => void;
  disabled?: boolean;
  className?: string;
}

export const LodgeSelectionCard: React.FC<LodgeSelectionCardProps> = ({
  selectedGrandLodge,
  selectedLodge,
  onGrandLodgeChange,
  onLodgeChange,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      <Card className="border-2 border-primary/20">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Building className="w-5 h-5" />
            Your Lodge
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            These details will be applied to all members in this registration
          </p>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="relative">
                <GrandLodgeSelection 
                  value={selectedGrandLodge}
                  onChange={onGrandLodgeChange}
                />
                {!selectedGrandLodge && !disabled && (
                  <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                    </svg>
                    Required to proceed
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="relative">
                <LodgeSelection 
                  grand_lodge_id={selectedGrandLodge}
                  value={selectedLodge}
                  onChange={(lodgeId, lodgeName) => onLodgeChange(lodgeId, lodgeName ?? '')}
                  disabled={!selectedGrandLodge || disabled}
                />
                {selectedGrandLodge && !selectedLodge && !disabled && (
                  <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                    </svg>
                    Required to proceed
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};