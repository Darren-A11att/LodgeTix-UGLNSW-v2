"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ConfirmationData {
  registrationId: string;
  confirmationNumber: string;
  registrationType: 'individual' | 'lodge' | 'delegation';
  functionData?: {
    name?: string;
  };
  totalAmount?: number;
}

interface ConfirmationFallbackProps {
  confirmationNumber: string;
  registrationType?: 'individual' | 'lodge' | 'delegation';
  functionName?: string;
}

export function ConfirmationFallback({ 
  confirmationNumber, 
  registrationType: propRegistrationType = 'individual',
  functionName: propFunctionName 
}: ConfirmationFallbackProps) {
  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);

  useEffect(() => {
    // Try to load confirmation data from localStorage
    const loadConfirmationData = () => {
      try {
        // First try specific confirmation number
        const specificData = localStorage.getItem(`registration_${confirmationNumber}`);
        if (specificData) {
          setConfirmationData(JSON.parse(specificData));
          return;
        }

        // Fallback to recent registration if confirmation number matches
        const recentData = localStorage.getItem('recent_registration');
        if (recentData) {
          const parsed = JSON.parse(recentData);
          if (parsed.confirmationNumber === confirmationNumber) {
            setConfirmationData(parsed);
          }
        }
      } catch (error) {
        console.warn('Could not load confirmation data from localStorage:', error);
      }
    };

    loadConfirmationData();
  }, [confirmationNumber]);

  // Use localStorage data if available, otherwise use props
  const registrationType = confirmationData?.registrationType || propRegistrationType;
  const functionName = confirmationData?.functionData?.name || propFunctionName;
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">
              Payment Successful!
            </CardTitle>
            {functionName && (
              <p className="text-lg text-gray-600 mt-2">
                {functionName}
              </p>
            )}
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div>
              <p className="text-lg text-gray-700 mb-3">
                Your {registrationType} registration confirmation number is:
              </p>
              <div className="bg-gray-100 border-2 border-gray-200 p-4 rounded-lg">
                <p className="text-2xl font-mono font-bold text-gray-900 tracking-wider">
                  {confirmationNumber}
                </p>
              </div>
            </div>
            
            <div className="space-y-3 text-sm text-gray-600">
              <p className="flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Payment has been processed successfully
              </p>
              <p className="flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                You will receive a confirmation email shortly
              </p>
              <p className="flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Please save this confirmation number for your records
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                If you don't receive an email within 24 hours, please contact support with your confirmation number.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}