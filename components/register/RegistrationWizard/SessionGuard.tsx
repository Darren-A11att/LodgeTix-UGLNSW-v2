"use client";

import React, { useEffect, useState } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { createClient } from '@/utils/supabase/client';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface SessionGuardProps {
  children: React.ReactNode;
}

export function SessionGuard({ children }: SessionGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const anonymousSessionEstablished = useRegistrationStore(state => state.anonymousSessionEstablished);
  const setAnonymousSessionEstablished = useRegistrationStore(state => state.setAnonymousSessionEstablished);

  useEffect(() => {
    const ensureSession = async () => {
      try {
        console.log('🔒 SessionGuard: Checking session status...');
        
        // First check the store state
        if (anonymousSessionEstablished) {
          console.log('✅ SessionGuard: Store indicates session is established');
          setIsChecking(false);
          return;
        }

        // Check if there's an actual session
        const supabase = createClient();
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ SessionGuard: Error checking session:', error);
          setSessionError('Failed to verify session. Please try again.');
          setIsChecking(false);
          return;
        }

        if (session && session.user) {
          console.log('✅ SessionGuard: Valid session found (anonymous:', session.user.is_anonymous, ')');
          setAnonymousSessionEstablished(true);
          setIsChecking(false);
          return;
        }

        // No session found - try to create one
        console.log('🔐 SessionGuard: No session found, creating anonymous session...');
        const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
        
        if (authError) {
          console.error('❌ SessionGuard: Failed to create anonymous session:', authError);
          setSessionError(`Failed to create session: ${authError.message}`);
          setIsChecking(false);
          return;
        }
        
        if (authData.user && authData.session) {
          console.log('✅ SessionGuard: Anonymous session created:', authData.user.id);
          setAnonymousSessionEstablished(true);
          setIsChecking(false);
          
          // Force a store persist to ensure it's saved
          if (useRegistrationStore.persist?.rehydrate) {
            setTimeout(() => {
              useRegistrationStore.persist.rehydrate();
            }, 100);
          }
        } else {
          console.error('❌ SessionGuard: Session created but missing user/session data');
          setSessionError('Failed to establish session. Please try again.');
          setIsChecking(false);
        }
      } catch (error) {
        console.error('❌ SessionGuard: Unexpected error:', error);
        setSessionError('An unexpected error occurred. Please refresh the page.');
        setIsChecking(false);
      }
    };

    ensureSession();
  }, [anonymousSessionEstablished, setAnonymousSessionEstablished]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-masonic-navy" />
        <p className="text-sm text-gray-600">Initializing registration...</p>
      </div>
    );
  }

  // Show error state if session couldn't be established
  if (sessionError) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Alert variant="destructive">
          <AlertDescription className="space-y-4">
            <p>{sessionError}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="w-full"
            >
              Refresh Page
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Session is ready, render children
  return <>{children}</>;
}