import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt } from 'lucide-react';

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
  title?: string;
  useCard?: boolean;
}

/**
 * Generic renderer for summary data with optional Card styling
 * Renders sections with items in a clean, unified format
 */
export function SummaryRenderer({ 
  sections, 
  footer, 
  emptyMessage = 'No data available',
  className,
  title = 'Summary',
  useCard = false
}: SummaryRendererProps) {
  const renderContent = () => {
    if (sections.length === 0) {
      return (
        <div className={cn("text-sm text-muted-foreground italic", className)}>
          {emptyMessage}
        </div>
      );
    }
    
    return (
      <div className={cn("space-y-4", !useCard && className)}>
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
  };

  if (!useCard) {
    return renderContent();
  }

  return (
    <Card className={cn("border-2 border-primary/20", className)}>
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <CardTitle className="flex items-center gap-2 text-primary">
          <Receipt className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {renderContent()}
      </CardContent>
    </Card>
  );
}