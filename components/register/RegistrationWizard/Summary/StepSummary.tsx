import React from 'react';
import { cn } from '@/lib/utils';
import { Check, Circle } from 'lucide-react';

interface Step {
  number: number;
  label: string;
  isActive?: boolean;
  isCompleted?: boolean;
}

interface StepSummaryProps {
  currentStep: number;
  totalSteps?: number;
  steps?: Step[];
  children?: React.ReactNode;
  className?: string;
}

const defaultSteps: Step[] = [
  { number: 1, label: 'Registration Type' },
  { number: 2, label: 'Attendee Details' },
  { number: 3, label: 'Select Tickets' },
  { number: 4, label: 'Review Order' },
  { number: 5, label: 'Payment' },
  { number: 6, label: 'Confirmation' },
];

export function StepSummary({ 
  currentStep, 
  totalSteps = 6, 
  steps = defaultSteps,
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
      
      {/* Step Indicators */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium mb-3">Registration Steps</h4>
        <div className="space-y-1">
          {steps.map((step) => {
            const isActive = step.number === currentStep;
            const isCompleted = step.number < currentStep;
            
            return (
              <div
                key={step.number}
                className={cn(
                  "flex items-center gap-3 py-2 px-3 rounded-md transition-colors",
                  isActive && "bg-primary/10",
                  isCompleted && "text-muted-foreground"
                )}
              >
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-primary" />
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                        isActive ? "border-primary bg-primary" : "border-muted-foreground/30"
                      )}
                    >
                      <span
                        className={cn(
                          "text-xs font-medium",
                          isActive ? "text-primary-foreground" : "text-muted-foreground"
                        )}
                      >
                        {step.number}
                      </span>
                    </div>
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm",
                    isActive && "font-medium text-primary",
                    isCompleted && "line-through"
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Summary Content */}
      {children && (
        <div className="border-t pt-6">
          <h4 className="text-sm font-medium mb-4">Current Step Details</h4>
          {children}
        </div>
      )}
      
      {/* Help Section */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium mb-2">Need Help?</h4>
        <div className="space-y-2">
          <button className="text-sm text-primary hover:underline block">
            View Help Center
          </button>
          <button className="text-sm text-muted-foreground hover:text-primary block">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}