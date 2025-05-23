"use client"

import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { RegistrationStepIndicator } from "../Shared/registration-step-indicator";
import { SectionHeader } from "../Shared/SectionHeader";

interface WizardBodyStructureLayoutProps {
  // Step indicator props
  currentStep: number;
  totalSteps?: number;
  showStepIndicator?: boolean; // New prop to control step indicator visibility
  
  // Section header props
  sectionTitle: string;
  sectionDescription?: string;
  
  // Step container content
  children: React.ReactNode;
  
  // Additional content
  additionalContent?: React.ReactNode;
  
  className?: string;
}

export const WizardBodyStructureLayout: React.FC<WizardBodyStructureLayoutProps> = ({
  currentStep,
  totalSteps = 6,
  showStepIndicator = true, // Default to true for backward compatibility
  sectionTitle,
  sectionDescription,
  children,
  additionalContent,
  className,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Row 1: Step Indicator - hidden on small devices and when showStepIndicator is false */}
      {showStepIndicator && (
        <div className="mb-6 flex-shrink-0 hidden sm:block">
          <RegistrationStepIndicator currentStep={isMounted ? currentStep : 1} />
        </div>
      )}
      
      {/* Row 2: Section Header */}
      <div className="mb-6 flex-shrink-0">
        <SectionHeader>
          <h1 className="text-2xl font-bold text-masonic-navy">{sectionTitle}</h1>
          <div className="masonic-divider"></div>
          {sectionDescription && (
            <p className="text-gray-600 hidden sm:block">{sectionDescription}</p>
          )}
        </SectionHeader>
      </div>
      
      {/* Main content */}
      <div className="flex-1 mb-6 mx-0 px-0 sm:px-4">
        {children}
      </div>
      
      {/* Additional content if needed */}
      {additionalContent && (
        <div className="pt-4 border-t border-gray-100 flex-shrink-0">
          {additionalContent}
        </div>
      )}
    </div>
  );
}; 