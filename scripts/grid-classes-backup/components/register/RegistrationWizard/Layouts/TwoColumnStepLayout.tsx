import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TwoColumnStepLayoutProps {
  // Main content area (forms, etc.)
  children: React.ReactNode;
  
  // Summary content for sidebar
  summaryContent: React.ReactNode;
  summaryTitle?: string;
  
  // Optional props
  className?: string;
  mainColumnClassName?: string;
  summaryColumnClassName?: string;
}

export const TwoColumnStepLayout: React.FC<TwoColumnStepLayoutProps> = ({
  children,
  summaryContent,
  summaryTitle = "Summary",
  className,
  mainColumnClassName,
  summaryColumnClassName,
}) => {
  // State for mobile summary collapse/expand
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  return (
    <div className={cn("w-full md:py-5", className)}>
      {/* Mobile Summary Toggle - Only visible on small screens */}
      <div className="lg:hidden mb-5">
        <Card>
          <CardHeader className="py-3 cursor-pointer" onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{summaryTitle}</CardTitle>
              <Button variant="ghost" size="sm">
                {isSummaryExpanded ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </Button>
            </div>
          </CardHeader>
          {isSummaryExpanded && (
            <CardContent>
              {summaryContent}
            </CardContent>
          )}
        </Card>
      </div>

      {/* Two-column desktop layout */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-5">
        {/* Main Content - 70% width on desktop */}
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
                {summaryContent}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}; 