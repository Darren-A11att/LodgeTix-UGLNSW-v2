'use client';

import { useEffect, useState } from 'react';

export interface ConfirmationData {
  registrationId: string;
  confirmationNumber: string;
  functionData: any;
  billingDetails: any;
  attendees: any[];
  tickets: any[];
  totalAmount: number;
  subtotal: number;
  stripeFee: number;
  registrationType: string;
}

export function useConfirmationData(confirmationNumber: string): ConfirmationData | null {
  const [data, setData] = useState<ConfirmationData | null>(null);

  useEffect(() => {
    // Try to get data from localStorage
    const storageKey = `registration_${confirmationNumber}`;
    const storedData = localStorage.getItem(storageKey);
    
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setData(parsedData);
      } catch (error) {
        console.error('Error parsing stored confirmation data:', error);
      }
    } else {
      // Fallback: try to get the most recent registration data
      const recentRegistration = localStorage.getItem('recent_registration');
      if (recentRegistration) {
        try {
          const parsedData = JSON.parse(recentRegistration);
          if (parsedData.confirmationNumber === confirmationNumber) {
            setData(parsedData);
          }
        } catch (error) {
          console.error('Error parsing recent registration data:', error);
        }
      }
    }
  }, [confirmationNumber]);

  return data;
}