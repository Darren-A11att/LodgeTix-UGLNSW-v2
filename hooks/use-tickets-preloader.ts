import { useEffect, useRef } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { getFunctionTicketsService } from '@/lib/services/function-tickets-service';
import { api } from '@/lib/api-logger';

interface UseTicketsPreloaderOptions {
  enabled?: boolean;
  delay?: number; // Delay in milliseconds before starting preload
}

/**
 * Hook to preload tickets and packages data in the background
 * Triggers after attendee details are fully loaded
 */
export function useTicketsPreloader(options: UseTicketsPreloaderOptions = {}) {
  const { enabled = true, delay = 0 } = options;
  
  const functionId = useRegistrationStore(state => state.functionId);
  const registrationType = useRegistrationStore(state => state.registrationType);
  const setPreloadedTicketsData = useRegistrationStore(state => state.setPreloadedTicketsData);
  const isPreloadedDataValid = useRegistrationStore(state => state.isPreloadedDataValid);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const isPreloadingRef = useRef(false);
  const hasPreloadedRef = useRef(false);

  useEffect(() => {
    // Cleanup function to abort any ongoing preload
    const cleanup = () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      isPreloadingRef.current = false;
    };

    // Don't preload if disabled or required data not available
    if (!enabled || !functionId || !registrationType) {
      cleanup();
      return;
    }

    // Don't preload if already valid data exists
    if (isPreloadedDataValid(functionId, registrationType)) {
      console.log('[Preloader] Valid preloaded data already exists, skipping preload');
      hasPreloadedRef.current = true;
      return;
    }

    // Don't preload if already preloading or already preloaded
    if (isPreloadingRef.current || hasPreloadedRef.current) {
      return;
    }

    const startPreload = async () => {
      try {
        isPreloadingRef.current = true;
        abortControllerRef.current = new AbortController();
        
        console.log(`[Preloader] Starting background preload for function ${functionId}, type ${registrationType}`);
        
        // Use the same service as the ticket selection component
        const ticketsService = getFunctionTicketsService();
        const { tickets, packages } = await ticketsService.getFunctionTicketsAndPackages(
          functionId,
          registrationType
        );

        // Check if we were aborted during the fetch
        if (abortControllerRef.current?.signal.aborted) {
          console.log('[Preloader] Preload was aborted');
          return;
        }

        // Store the preloaded data
        setPreloadedTicketsData({
          tickets,
          packages,
          functionId,
          registrationType
        });

        hasPreloadedRef.current = true;
        console.log(`[Preloader] Successfully preloaded ${tickets.length} tickets and ${packages.length} packages`);
        
      } catch (error) {
        if (abortControllerRef.current?.signal.aborted) {
          console.log('[Preloader] Preload was aborted during fetch');
        } else {
          console.warn('[Preloader] Failed to preload tickets data:', error);
          api.error('Preloader failed:', error);
        }
      } finally {
        isPreloadingRef.current = false;
        abortControllerRef.current = null;
      }
    };

    // Start preload with optional delay
    const timeoutId = setTimeout(() => {
      startPreload();
    }, delay);

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      cleanup();
    };
  }, [enabled, functionId, registrationType, delay, setPreloadedTicketsData, isPreloadedDataValid]);

  // Reset preload status when function or registration type changes
  useEffect(() => {
    hasPreloadedRef.current = false;
  }, [functionId, registrationType]);

  // Return current preload status for debugging
  return {
    isPreloading: isPreloadingRef.current,
    hasPreloaded: hasPreloadedRef.current,
    canPreload: !!(enabled && functionId && registrationType)
  };
}