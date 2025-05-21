import React from 'react';
import { cn } from "@/lib/utils";

interface SummarySectionProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  contentClassName?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

/**
 * A consistent section component for the summary column
 * Provides a standard way to structure content in the summary sidebar
 */
export const SummarySection: React.FC<SummarySectionProps> = ({
  title,
  children,
  icon,
  className,
  titleClassName,
  contentClassName,
  collapsible = false,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  return (
    <div className={cn("mb-4 last:mb-0", className)}>
      <div 
        className={cn(
          "flex items-center mb-2",
          collapsible && "cursor-pointer",
          titleClassName
        )}
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
      >
        {icon && <span className="mr-2">{icon}</span>}
        <h3 className="text-sm font-medium">{title}</h3>
        {collapsible && (
          <button className="ml-auto text-gray-500 hover:text-gray-700">
            {isExpanded ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
        )}
      </div>
      {(!collapsible || isExpanded) && (
        <div className={cn("text-sm text-gray-600", contentClassName)}>
          {children}
        </div>
      )}
    </div>
  );
};