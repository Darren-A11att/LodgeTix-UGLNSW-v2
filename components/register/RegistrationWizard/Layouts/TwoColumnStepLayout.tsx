"use client"

import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StepSummary } from '../Summary/StepSummary';

interface TwoColumnStepLayoutProps {
  // Main content area (forms, etc.)
  children: React.ReactNode;
  
  // Summary content for sidebar
  summaryContent?: React.ReactNode;
  summaryTitle?: string;
  
  // Step information
  currentStep?: number;
  totalSteps?: number;
  stepName?: string;
  
  // Optional props
  className?: string;
  mainColumnClassName?: string;
  summaryColumnClassName?: string;
}

export const TwoColumnStepLayout: React.FC<TwoColumnStepLayoutProps> = ({
  children,
  summaryContent,
  summaryTitle = "Step Summary",
  currentStep = 1,
  totalSteps = 6,
  stepName,
  className,
  mainColumnClassName,
  summaryColumnClassName,
}) => {
  return (
    <div className={cn("w-full", className)}>
      {/* Two-column desktop layout */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Main Content - full width on mobile, 70% width on desktop */}
        <div className={cn("lg:col-span-7", mainColumnClassName)}>
          {children}
        </div>
        
        {/* Summary Sidebar - 30% width on desktop, hidden on mobile */}
        <div className={cn("hidden lg:block lg:col-span-3", summaryColumnClassName)}>
          <div className="sticky top-4">
            <Card>
              <CardHeader>
                <CardTitle>{summaryTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <StepSummary currentStep={currentStep} totalSteps={totalSteps} stepName={stepName}>
                  {summaryContent}
                </StepSummary>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};