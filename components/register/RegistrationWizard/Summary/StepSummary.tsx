import React from 'react';
import { cn } from '@/lib/utils';

interface StepSummaryProps {
  currentStep: number;
  totalSteps?: number;
  stepName?: string;
  children?: React.ReactNode;
  className?: string;
}

export function StepSummary({ 
  currentStep, 
  totalSteps = 6, 
  stepName,
  children,
  className 
}: StepSummaryProps) {
  const completionPercentage = Math.round(((currentStep - 1) / (totalSteps - 1)) * 100);
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Progress Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Your Progress</span>
          <span className="text-muted-foreground">{completionPercentage}% Complete</span>
        </div>
        
        {/* Progress Bar */}
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-primary transition-all duration-300 ease-out"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>
      
      {/* Summary Content */}
      {children && (
        <div className="border-t pt-6">
          <h4 className="text-sm font-medium mb-4">{stepName ? `${stepName} Summary` : 'Current Step Details'}</h4>
          {children}
        </div>
      )}
    </div>
  );
}