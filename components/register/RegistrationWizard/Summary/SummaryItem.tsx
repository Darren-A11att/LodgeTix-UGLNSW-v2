import React from 'react';
import { cn } from "@/lib/utils";

interface SummaryItemProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  action?: React.ReactNode;
}

/**
 * A consistent item component for displaying key-value pairs in the summary
 */
export const SummaryItem: React.FC<SummaryItemProps> = ({
  label,
  value,
  icon,
  className,
  labelClassName,
  valueClassName,
  action
}) => {
  return (
    <div className={cn("flex items-start mb-2 last:mb-0", className)}>
      {icon && <div className="mr-2 mt-0.5 flex-shrink-0">{icon}</div>}
      
      <div className="flex-grow">
        <div className={cn("text-xs text-gray-500", labelClassName)}>{label}</div>
        <div className={cn("text-sm font-medium", valueClassName)}>{value}</div>
      </div>
      
      {action && (
        <div className="ml-2 flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
};