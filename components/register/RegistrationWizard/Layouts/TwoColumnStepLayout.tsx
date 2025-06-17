"use client"

import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
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
        {/* Main Content - full width on mobile, 80% width on desktop */}
        <div className={cn("lg:col-span-7", mainColumnClassName)}>
          {children}
        </div>
        
        {/* Summary Sidebar - 30% width on desktop, hidden on mobile */}
        <div className={cn("hidden lg:block lg:col-span-3", summaryColumnClassName)}>
          <div className="sticky top-4">
            <Card className="border-2 border-primary/20">
              <CardHeader className="bg-primary/5 border-b border-primary/10">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <BarChart3 className="w-5 h-5" />
                  {summaryTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
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