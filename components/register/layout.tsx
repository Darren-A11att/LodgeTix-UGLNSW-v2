import React from 'react';
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
  return (
    <div className={cn(
      "container mx-auto max-w-6xl px-4 flex flex-col h-[100dvh] min-h-[100dvh] max-h-[100dvh]",
      className
    )}>
      {/* Header section */}
      {header && (
        <header className="py-4 flex-shrink-0">
          {header}
        </header>
      )}

      {/* Main scrollable body section */}
      <main className="wizard-container flex-1 overflow-y-auto py-4 min-h-0">
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