'use client';

import { useEffect, useState } from 'react';
import { useCompletedRegistrationsStore } from '@/lib/completedRegistrationsStore';
import { useRegistrationStore } from '@/lib/registrationStore';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestEncryptionPage() {
  const [localStorageData, setLocalStorageData] = useState<any>({});
  const [user, setUser] = useState<any>(null);
  
  const { addCompletedRegistration, getAllRegistrations } = useCompletedRegistrationsStore();
  const registrationStore = useRegistrationStore();
  
  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
    
    // Check localStorage
    updateLocalStorageView();
  }, []);
  
  const updateLocalStorageView = () => {
    const data: any = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('lodgetix') || key.includes('registration'))) {
        const value = localStorage.getItem(key);
        data[key] = value;
      }
    }
    setLocalStorageData(data);
  };
  
  const testAddCompletedRegistration = () => {
    addCompletedRegistration({
      completedAt: Date.now(),
      registrationId: `test-${Date.now()}`,
      functionId: 'test-function-123',
      functionStartDate: new Date().toISOString(),
      confirmationNumber: `TEST-${Date.now()}`,
      paymentReference: {
        provider: 'square',
        paymentId: 'test-payment-123'
      },
      paymentStatus: 'completed',
      userId: user?.id || 'test-user',
      confirmationEmails: [],
      metadata: {
        registrationType: 'individuals',
        primaryAttendee: {
          firstName: 'Test',
          lastName: 'User',
          attendeeType: 'mason',
          rank: 'MM'
        },
        attendees: [],
        totalAttendees: 1,
        totalAmount: 100,
        subtotal: 90
      }
    });
    
    setTimeout(updateLocalStorageView, 100);
  };
  
  const testAddDraftRegistration = () => {
    registrationStore.setRegistrationType('individuals');
    registrationStore.addAttendee('mason');
    
    setTimeout(updateLocalStorageView, 100);
  };
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Encryption Test Page</h1>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Current User</CardTitle>
        </CardHeader>
        <CardContent>
          <p>User ID: {user?.id || 'Not logged in'}</p>
          <p>Email: {user?.email || 'N/A'}</p>
          <p>Anonymous: {user?.is_anonymous ? 'Yes' : 'No'}</p>
        </CardContent>
      </Card>
      
      <div className="space-y-4 mb-4">
        <Button onClick={testAddCompletedRegistration}>Add Test Completed Registration</Button>
        <Button onClick={testAddDraftRegistration}>Add Test Draft Registration</Button>
        <Button onClick={updateLocalStorageView} variant="outline">Refresh View</Button>
      </div>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Completed Registrations in Store</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(getAllRegistrations(), null, 2)}
          </pre>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>localStorage Contents</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(localStorageData).map(([key, value]) => (
            <div key={key} className="mb-4">
              <h3 className="font-semibold">{key}:</h3>
              <div className="bg-gray-100 p-2 rounded overflow-auto">
                <pre className="text-xs whitespace-pre-wrap break-all">
                  {typeof value === 'string' && value.length > 100 
                    ? `${value.substring(0, 100)}... (${value.length} chars total)`
                    : value}
                </pre>
                {typeof value === 'string' && (() => {
                  try {
                    JSON.parse(value);
                    return <p className="text-green-600 text-xs mt-1">✓ Valid JSON (unencrypted)</p>;
                  } catch {
                    return <p className="text-blue-600 text-xs mt-1">✓ Encrypted data</p>;
                  }
                })()}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}