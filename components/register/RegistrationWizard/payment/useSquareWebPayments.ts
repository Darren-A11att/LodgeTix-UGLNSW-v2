"use client";

import { useEffect, useState, useCallback } from 'react';
import { getSquareConfig, getSquareScriptUrl } from './SquareConfig';

// Type definitions for Square Web Payments SDK
declare global {
  interface Window {
    Square?: {
      payments: (applicationId: string, locationId: string) => Promise<{
        card: (options?: any) => Promise<{
          attach: (selector: string) => Promise<void>;
          tokenize: (billingContact?: any) => Promise<{
            status: string;
            token?: string;
            errors?: Array<{ code: string; detail: string; field?: string; }>;
          }>;
          destroy: () => void;
        }>;
      }>;
    };
  }
}

interface UseSquareWebPaymentsReturn {
  payments: any;
  isLoaded: boolean;
  error: string | null;
  loadSquare: () => Promise<boolean>;
}

// Global singleton state to prevent multiple Square instances
let globalSquareInstance: any = null;
let globalSquarePromise: Promise<any> | null = null;
let globalIsLoaded = false;
let globalError: string | null = null;
let isInitializing = false;

export const useSquareWebPayments = (): UseSquareWebPaymentsReturn => {
  const [payments, setPayments] = useState<any>(globalSquareInstance);
  const [isLoaded, setIsLoaded] = useState(globalIsLoaded);
  const [error, setError] = useState<string | null>(globalError);

  const loadSquareScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      // Check if Square is already loaded
      if (window.Square) {
        resolve(true);
        return;
      }

      const config = getSquareConfig();
      if (!config) {
        setError('Square configuration is invalid');
        resolve(false);
        return;
      }

      // Check if script is already being loaded
      if (document.querySelector('script[src*="square"]')) {
        // Wait for existing script to load
        const checkSquare = () => {
          if (window.Square) {
            resolve(true);
          } else {
            setTimeout(checkSquare, 100);
          }
        };
        checkSquare();
        return;
      }

      const script = document.createElement('script');
      script.src = getSquareScriptUrl(config.environment);
      script.onload = () => resolve(true);
      script.onerror = () => {
        setError('Failed to load Square Web Payments SDK');
        resolve(false);
      };
      
      document.head.appendChild(script);
    });
  }, []);

  const loadSquare = useCallback(async (): Promise<boolean> => {
    try {
      // If already loaded globally, use the existing instance
      if (globalSquareInstance && globalIsLoaded) {
        console.log('✅ [Square] Using existing global Square instance');
        setPayments(globalSquareInstance);
        setIsLoaded(true);
        setError(null);
        return true;
      }

      // If there's already a loading promise or initialization in progress, wait for it
      if (globalSquarePromise || isInitializing) {
        console.log('🔄 [Square] Waiting for existing Square initialization...');
        if (globalSquarePromise) {
          const result = await globalSquarePromise;
          setPayments(globalSquareInstance);
          setIsLoaded(globalIsLoaded);
          setError(globalError);
          return result;
        }
        // If just initializing but no promise yet, wait a bit and retry
        await new Promise(resolve => setTimeout(resolve, 50));
        return loadSquare();
      }

      // Set initialization flag and create promise to prevent race conditions
      isInitializing = true;
      console.log('🔧 [Square] Starting Square Web Payments initialization...');
      globalSquarePromise = new Promise(async (resolve) => {
        try {
          globalError = null;
          
          const config = getSquareConfig();
          if (!config) {
            console.error('❌ [Square] Configuration validation failed');
            console.log('🔍 [Square] Environment variables check:');
            console.log('  - NEXT_PUBLIC_SQUARE_APPLICATION_ID:', process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID ? '✅ Set' : '❌ Missing');
            console.log('  - NEXT_PUBLIC_SQUARE_LOCATION_ID:', process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ? '✅ Set' : '❌ Missing');
            console.log('  - NEXT_PUBLIC_SQUARE_ENVIRONMENT:', process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT ? '✅ Set' : '❌ Missing');
            globalError = 'Square configuration is missing or invalid - check environment variables';
            resolve(false);
            return;
          }

          console.log('✅ [Square] Configuration validated:', {
            applicationId: config.applicationId?.substring(0, 20) + '...',
            locationId: config.locationId?.substring(0, 10) + '...',
            environment: config.environment
          });

          // Load the Square script if not already loaded
          console.log('📥 [Square] Loading Square Web Payments SDK script...');
          const scriptLoaded = await loadSquareScript();
          if (!scriptLoaded) {
            console.error('❌ [Square] Failed to load Square script');
            globalError = 'Failed to load Square script';
            resolve(false);
            return;
          }

          console.log('✅ [Square] Script loaded successfully');

          // Initialize Square payments
          if (window.Square) {
            console.log('🔧 [Square] Initializing payments instance...');
            const paymentsInstance = await window.Square.payments(
              config.applicationId,
              config.locationId
            );
            
            console.log('✅ [Square] Payments instance created successfully');
            globalSquareInstance = paymentsInstance;
            globalIsLoaded = true;
            resolve(true);
          } else {
            console.error('❌ [Square] window.Square not available after script load');
            globalError = 'Square Web Payments SDK failed to initialize';
            resolve(false);
          }
        } catch (err: any) {
          console.error('❌ [Square] Error during initialization:', err);
          console.log('🔍 [Square] Error details:', {
            message: err.message,
            stack: err.stack,
            name: err.name
          });
          globalError = err.message || 'Failed to initialize Square Web Payments SDK';
          resolve(false);
        }
      });

      const result = await globalSquarePromise;
      
      // Update local state
      setPayments(globalSquareInstance);
      setIsLoaded(globalIsLoaded);
      setError(globalError);
      
      // Clear the promise and initialization flag since it's completed
      globalSquarePromise = null;
      isInitializing = false;
      
      return result;
    } catch (err: any) {
      console.error('❌ [Square] Error in loadSquare:', err);
      const errorMessage = err.message || 'Failed to initialize Square Web Payments SDK';
      globalError = errorMessage;
      setError(errorMessage);
      
      // Clear initialization flag and promise on error
      isInitializing = false;
      globalSquarePromise = null;
      
      return false;
    }
  }, [loadSquareScript]);

  useEffect(() => {
    loadSquare();
  }, [loadSquare]);

  // Listen for global state changes to update local component state
  useEffect(() => {
    const checkGlobalState = () => {
      if (globalSquareInstance !== payments) {
        setPayments(globalSquareInstance);
      }
      if (globalIsLoaded !== isLoaded) {
        setIsLoaded(globalIsLoaded);
      }
      if (globalError !== error) {
        setError(globalError);
      }
    };

    // Check immediately
    checkGlobalState();

    // Set up a polling mechanism to keep local state in sync
    const interval = setInterval(checkGlobalState, 100);

    return () => clearInterval(interval);
  }, [payments, isLoaded, error]);

  return {
    payments,
    isLoaded,
    error,
    loadSquare,
  };
};