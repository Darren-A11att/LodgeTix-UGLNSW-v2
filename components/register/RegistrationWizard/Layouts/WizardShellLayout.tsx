"use client"

import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";

interface WizardShellLayoutProps {
  header?: React.ReactNode;
  children: React.ReactNode; // Main content for the body
  footer?: React.ReactNode;
  className?: string;
}

export const WizardShellLayout: React.FC<WizardShellLayoutProps> = ({
  header,
  children,
  footer,
  className,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        {/* Loading skeleton */}
        <div className="w-full py-8 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mx-auto mb-4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto mb-3"></div>
          <div className="h-4 bg-slate-200 rounded w-2/3 mx-auto mb-3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header section */}
      {header && (
        <header className="py-4 flex-shrink-0">
          {header}
        </header>
      )}

      {/* Main body section */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer section */}
      {footer && (
        <footer className="py-4 border-t border-gray-100 flex-shrink-0">
          {footer}
        </footer>
      )}
    </div>
  );
}; 