import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProvideAttendeesLaterProps {
  onConfirm: (masonCount: number, partnerCount: number) => void;
  minMembers?: number;
  maxMembers?: number;
}

export const ProvideAttendeesLater: React.FC<ProvideAttendeesLaterProps> = ({
  onConfirm,
  minMembers = 3,
  maxMembers = 20
}) => {
  const [masonCount, setMasonCount] = useState(minMembers);
  const [partnerCount, setPartnerCount] = useState(0);

  const increaseMasonCount = () => {
    if (masonCount < maxMembers) {
      setMasonCount(masonCount + 1);
    }
  };

  const decreaseMasonCount = () => {
    if (masonCount > minMembers) {
      setMasonCount(masonCount - 1);
    }
  };

  const increasePartnerCount = () => {
    if (partnerCount < maxMembers) {
      setPartnerCount(partnerCount + 1);
    }
  };

  const decreasePartnerCount = () => {
    if (partnerCount > 0) {
      setPartnerCount(partnerCount - 1);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-medium mb-3">Provide Attendee Count</h3>
      <p className="text-gray-600 mb-6">
        If you don't have all attendee details yet, you can specify how many members will be attending.
        You can provide their details later.
      </p>
      
      <div className="space-y-6 max-w-md mx-auto">
        {/* Mason Count */}
        <div className="space-y-2">
          <Label htmlFor="mason-count" className="text-gray-700">Number of Masons</Label>
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="icon"
              className="rounded-r-none h-10 w-10 border-gray-300"
              onClick={decreaseMasonCount}
              disabled={masonCount <= minMembers}
            >
              <span className="text-xl font-medium">−</span>
            </Button>
            <Input 
              id="mason-count"
              type="number" 
              min={minMembers}
              max={maxMembers}
              value={masonCount}
              onChange={(e) => {
                const value = parseInt(e.target.value) || minMembers;
                setMasonCount(Math.max(minMembers, Math.min(maxMembers, value)));
              }}
              className="h-10 text-center rounded-none border-x-0 w-20 border-gray-300" 
            />
            <Button 
              variant="outline" 
              size="icon"
              className="rounded-l-none h-10 w-10 border-gray-300"
              onClick={increaseMasonCount}
              disabled={masonCount >= maxMembers}
            >
              <span className="text-xl font-medium">+</span>
            </Button>
          </div>
        </div>
        
        {/* Partner Count */}
        <div className="space-y-2">
          <Label htmlFor="partner-count" className="text-gray-700">Number of Partners</Label>
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="icon"
              className="rounded-r-none h-10 w-10 border-gray-300"
              onClick={decreasePartnerCount}
              disabled={partnerCount <= 0}
            >
              <span className="text-xl font-medium">−</span>
            </Button>
            <Input 
              id="partner-count"
              type="number" 
              min="0"
              max={maxMembers}
              value={partnerCount}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                setPartnerCount(Math.max(0, Math.min(maxMembers, value)));
              }}
              className="h-10 text-center rounded-none border-x-0 w-20 border-gray-300" 
            />
            <Button 
              variant="outline" 
              size="icon"
              className="rounded-l-none h-10 w-10 border-gray-300"
              onClick={increasePartnerCount}
              disabled={partnerCount >= maxMembers}
            >
              <span className="text-xl font-medium">+</span>
            </Button>
          </div>
        </div>
        
        <div className="pt-4">
          <Button 
            className="w-full bg-[#0a2059] hover:bg-[#0c2669]"
            onClick={() => onConfirm(masonCount, partnerCount)}
          >
            Confirm Attendee Count
          </Button>
        </div>
      </div>
    </div>
  );
};