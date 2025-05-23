import React from 'react';
import { cn } from '@/lib/utils';

interface SummarySection {
  title: string;
  items: Array<{
    label: string;
    value: string | React.ReactNode;
    isHighlight?: boolean;
  }>;
}

interface SummaryRendererProps {
  sections: SummarySection[];
  footer?: string | null;
  emptyMessage?: string;
  className?: string;
}

/**
 * Generic renderer for summary data without nested cards
 * Renders sections with items in a clean, non-nested format
 */
export function SummaryRenderer({ 
  sections, 
  footer, 
  emptyMessage = 'No data available',
  className 
}: SummaryRendererProps) {
  if (sections.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground italic", className)}>
        {emptyMessage}
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-4", className)}>
      {sections.map((section, index) => (
        <div key={index} className="space-y-2">
          <h5 className="text-sm font-medium text-foreground">
            {section.title}
          </h5>
          <div className="space-y-1">
            {section.items.map((item, itemIndex) => (
              <div 
                key={itemIndex} 
                className={cn(
                  "flex items-center justify-between text-sm",
                  item.isHighlight && "font-medium"
                )}
              >
                <span className="text-muted-foreground">{item.label}</span>
                <span className={item.isHighlight ? "text-foreground" : "text-muted-foreground"}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {footer && (
        <div className="text-xs text-muted-foreground pt-2 border-t">
          {footer}
        </div>
      )}
    </div>
  );
}