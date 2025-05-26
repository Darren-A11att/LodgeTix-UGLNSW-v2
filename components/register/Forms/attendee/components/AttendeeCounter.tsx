import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AttendeeCounterProps {
  id: string;
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
}

export const AttendeeCounter: React.FC<AttendeeCounterProps> = ({
  id,
  label,
  value,
  min = 0,
  max = 99,
  onChange,
  className = '',
  disabled = false
}) => {
  const handleDecrease = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrease = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id} className="text-gray-700">{label}</Label>
      <div className="flex items-center">
        <Button 
          variant="outline" 
          size="icon"
          className="rounded-r-none h-10 w-10 border-gray-300"
          onClick={handleDecrease}
          disabled={disabled || value <= min}
        >
          <span className="text-xl font-medium">−</span>
        </Button>
        <Input 
          id={id}
          type="number" 
          min={min}
          max={max}
          value={value}
          onChange={handleInputChange}
          className="h-10 text-center rounded-none border-x-0 w-20 border-gray-300" 
          disabled={disabled}
        />
        <Button 
          variant="outline" 
          size="icon"
          className="rounded-l-none h-10 w-10 border-gray-300"
          onClick={handleIncrease}
          disabled={disabled || value >= max}
        >
          <span className="text-xl font-medium">+</span>
        </Button>
      </div>
    </div>
  );
};