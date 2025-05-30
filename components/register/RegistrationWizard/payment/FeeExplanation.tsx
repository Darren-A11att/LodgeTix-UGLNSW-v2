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
          To ensure event organizers receive the full ticket price, we add a 
          small processing fee to cover payment costs. This fee goes directly 
          to our payment processor.
        </p>
        <ul className="mt-2 text-sm list-disc list-inside">
          <li>Australian cards: 1.75% + $0.30</li>
          <li>International cards: 2.9% + $0.30</li>
        </ul>
      </AlertDescription>
    </Alert>
  );
}