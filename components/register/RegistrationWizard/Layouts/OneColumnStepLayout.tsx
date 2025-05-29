"use client"

import React from 'react';
import { cn } from "@/lib/utils";

interface OneColumnStepLayoutProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export const OneColumnStepLayout: React.FC<OneColumnStepLayoutProps> = ({
  children,
  className,
  fullWidth = false,
}) => {
  return (
    <div className={cn(
      "w-full space-y-6",
      className
    )}>
      {children}
    </div>
  );
}; 