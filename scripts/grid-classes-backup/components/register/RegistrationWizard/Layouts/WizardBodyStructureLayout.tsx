import React from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RegistrationStepIndicator } from "../Shared/registration-step-indicator";
import { SectionHeader } from "../Shared/SectionHeader";

interface WizardBodyStructureLayoutProps {
  // Step indicator props
  currentStep: number;
  totalSteps?: number;
  
  // Section header props
  sectionTitle: string;
  sectionDescription?: string;
  
  // Step container content
  children: React.ReactNode;
  
  // Navigation buttons
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  disableNext?: boolean;
  hideBack?: boolean;
  
  // Additional content near buttons
  additionalButtonContent?: React.ReactNode;
  
  className?: string;
}

export const WizardBodyStructureLayout: React.FC<WizardBodyStructureLayoutProps> = ({
  currentStep,
  totalSteps = 6,
  sectionTitle,
  sectionDescription,
  children,
  onBack,
  onNext,
  nextLabel = "Continue",
  backLabel = "Back",
  disableNext = false,
  hideBack = false,
  additionalButtonContent,
  className,
}) => {
  // Determine if we should hide the navigation row (on step 1 - Registration Type)
  const hideNavigationButtons = currentStep === 1;

  return (
    <div className={cn("flex flex-col h-full md:py-5", className)}>
      {/* Row 1: Step Indicator */}
      <div className="mb-6 md:mb-8 flex-shrink-0">
        <RegistrationStepIndicator currentStep={currentStep} />
      </div>
      
      {/* Explicit spacer div */}
      <div className="h-8 md:h-10"></div>
      
      {/* Row 2: Section Header */}
      <div className="mb-6 md:mb-5 flex-shrink-0">
        <SectionHeader>
          <h1 className="text-2xl font-bold text-masonic-navy">{sectionTitle}</h1>
          <div className="masonic-divider"></div>
          {sectionDescription && (
            <p className="text-gray-600">{sectionDescription}</p>
          )}
        </SectionHeader>
      </div>
      
      {/* Row 3: Step Container - takes remaining space */}
      <div className="flex-1 mb-6 md:mb-5">
        {children}
      </div>
      
      {/* Row 4: Navigation Buttons - hidden on Registration Type step */}
      {!hideNavigationButtons && (
        <div className="pt-4 md:pt-5 border-t border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              {!hideBack && onBack && (
                <Button 
                  variant="outline" 
                  onClick={onBack}
                  className="gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {backLabel}
                </Button>
              )}
            </div>
            
            {/* Center slot for additional content */}
            {additionalButtonContent && (
              <div className="flex-1 flex justify-center">
                {additionalButtonContent}
              </div>
            )}
            
            <div>
              {onNext && (
                <Button 
                  onClick={onNext}
                  disabled={disableNext}
                  className="gap-2"
                >
                  {nextLabel}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 