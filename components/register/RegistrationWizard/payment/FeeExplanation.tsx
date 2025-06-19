"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export function FeeExplanation() {
  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>About Processing Fees</AlertTitle>
      <AlertDescription>
        <p className="text-sm">
          To ensure event organizers receive the full ticket price, we add 
          processing fees to cover payment costs. These include a platform 
          fee (2% with $1 minimum, capped at $20) and Square payment processing fees.
        </p>
        <ul className="mt-2 text-sm list-disc list-inside">
          <li>Platform fee: $1 minimum or 2% of order (max $20)</li>
          <li>Australian cards: 2.2%</li>
          <li>International cards: 2.2%</li>
        </ul>
      </AlertDescription>
    </Alert>
  );
}