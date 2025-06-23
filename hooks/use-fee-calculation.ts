import { useState, useEffect } from 'react';
import type { SquareFeeCalculation } from '@/lib/utils/square-fee-calculator';

interface UseFeeCalculationOptions {
  subtotal: number;
  isDomestic?: boolean;
  userCountry?: string;
  enabled?: boolean;
}

interface UseFeeCalculationResult {
  fees: SquareFeeCalculation | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useFeeCalculation({
  subtotal,
  isDomestic,
  userCountry,
  enabled = true
}: UseFeeCalculationOptions): UseFeeCalculationResult {
  const [fees, setFees] = useState<SquareFeeCalculation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateFees = async () => {
    if (!enabled) {
      setFees(null);
      return;
    }

    // If subtotal is 0, return zero fees
    if (subtotal === 0) {
      setFees({
        connectedAmount: 0,
        platformFee: 0,
        squareFee: 0,
        customerPayment: 0,
        processingFeesDisplay: 0,
        isDomestic: isDomestic,
        breakdown: {
          platformFeePercentage: 0,
          platformFeeCap: 0,
          platformFeeMinimum: 0,
          squarePercentage: 0,
          squareFixed: 0,
        }
      });
      setIsLoading(false);
      return;
    }

    if (subtotal < 0) {
      setError('Subtotal cannot be negative');
      setFees(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/calculate-fees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subtotal,
          isDomestic,
          userCountry
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate fees');
      }

      setFees(data.fees);
    } catch (err) {
      console.error('Fee calculation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to calculate fees');
      setFees(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    calculateFees();
  }, [subtotal, isDomestic, userCountry, enabled]);

  return {
    fees,
    isLoading,
    error,
    refetch: calculateFees
  };
}