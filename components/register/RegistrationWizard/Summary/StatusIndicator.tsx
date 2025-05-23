import React from 'react';
import { CheckCircle2, AlertCircle, XCircle, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";

type StatusType = 'success' | 'warning' | 'error' | 'pending' | 'info';

interface StatusIndicatorProps {
  status: StatusType;
  text: string;
  className?: string;
  iconOnly?: boolean;
}

/**
 * A consistent status indicator component used across summary sections
 */
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  text,
  className,
  iconOnly = false
}) => {
  // Define status-specific styles and icons
  const statusConfig = {
    success: {
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    warning: {
      icon: <AlertCircle className="h-4 w-4" />,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
    error: {
      icon: <XCircle className="h-4 w-4" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    pending: {
      icon: <Clock className="h-4 w-4" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    info: {
      icon: <AlertCircle className="h-4 w-4" />,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    }
  };

  const config = statusConfig[status];

  if (iconOnly) {
    return (
      <span className={cn(config.color, className)} title={text}>
        {config.icon}
      </span>
    );
  }

  return (
    <div className={cn(
      "flex items-center py-1 px-2 rounded-md text-xs",
      config.bgColor,
      config.borderColor,
      config.color,
      "border",
      className
    )}>
      <span className="mr-1">{config.icon}</span>
      <span>{text}</span>
    </div>
  );
};