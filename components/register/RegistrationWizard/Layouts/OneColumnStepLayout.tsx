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
      "w-full mx-0 space-y-5 px-2 sm:px-0",
      "sm:mx-auto md:py-5",
      className
    )}>
      {children}
    </div>
  );
}; 