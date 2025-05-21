import React from 'react';
import { cn } from "@/lib/utils";
import { SummarySection } from './SummarySection';
import { Button } from '@/components/ui/button';
import { useRegistrationStore } from '@/lib/registrationStore';

interface SummaryColumnProps {
  className?: string;
  defaultSections?: React.ReactNode;
  customSections?: React.ReactNode;
  showProgress?: boolean;
  showActions?: boolean;
  title: string;
}

/**
 * A consistent structure for the summary column across all registration steps
 * Provides common sections, progress tracking, and actions
 */
export const SummaryColumn: React.FC<SummaryColumnProps> = ({
  className,
  defaultSections,
  customSections,
  showProgress = true,
  showActions = true,
  title
}) => {
  const { currentStep } = useRegistrationStore();
  
  // Calculate overall progress as a percentage (simplified)
  const progressPercentage = Math.min(Math.round((currentStep / 6) * 100), 100);
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Custom Sections - Specific to each step */}
      {customSections}
      
      {/* Default Sections - Common across steps */}
      {defaultSections}
      
      {/* Progress Section - Optional */}
      {showProgress && (
        <SummarySection title="Your Progress" className="mt-4">
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-masonic-navy h-2.5 rounded-full" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-right">{progressPercentage}% Complete</p>
            
            {/* Steps indicator */}
            <div className="flex justify-between mt-2">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div 
                  key={step}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs",
                    step < currentStep ? "bg-masonic-navy text-white" : 
                    step === currentStep ? "bg-masonic-gold text-white" : 
                    "bg-gray-200 text-gray-500"
                  )}
                >
                  {step}
                </div>
              ))}
            </div>
          </div>
        </SummarySection>
      )}
      
      {/* Action Section - Optional */}
      {showActions && (
        <SummarySection title="Need Help?" className="mt-4">
          <div className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-masonic-navy"
              onClick={() => window.open('https://lodge.tix/help', '_blank')}
            >
              View Help Center
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-gray-500"
              onClick={() => window.open('mailto:support@lodge.tix', '_blank')}
            >
              Contact Support
            </Button>
          </div>
        </SummarySection>
      )}
    </div>
  );
};