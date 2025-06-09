'use client';

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

export function PrintButton() {
  return (
    <Button 
      variant="secondary" 
      size="sm" 
      onClick={() => window.print()}
      className="bg-white text-masonic-navy hover:bg-gray-100"
    >
      <Printer className="h-4 w-4 mr-2" />
      Print
    </Button>
  );
}