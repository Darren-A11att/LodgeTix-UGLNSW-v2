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
          fee (2%, capped at $20) and Stripe payment processing fees.
        </p>
        <ul className="mt-2 text-sm list-disc list-inside">
          <li>Australian cards: 1.7% + $0.30</li>
          <li>International cards: 3.5% + $0.30</li>
        </ul>
      </AlertDescription>
    </Alert>
  );
}