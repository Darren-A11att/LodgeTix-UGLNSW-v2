import { useState, useEffect } from 'react';
import { resolveFunctionSlug } from '@/lib/utils/function-slug-resolver-client';

interface OrganiserInfo {
  name: string;
  website?: string;
  known_as?: string;
}

interface UseFunctionOrganiserReturn {
  organiserName: string;
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook to fetch function organiser information for display in footer
 * @param slug - The function slug from the URL
 * @returns Object containing organiser name, loading state, and error state
 */
export function useFunctionOrganiser(slug: string): UseFunctionOrganiserReturn {
  const [organiserName, setOrganiserName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchOrganiserInfo = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Resolve slug to function ID
        const functionId = await resolveFunctionSlug(slug);
        
        if (!functionId) {
          throw new Error('Function not found');
        }

        // Fetch function details including organiser information
        const response = await fetch(`/api/functions/${functionId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch function details: ${response.status}`);
        }
        
        const functionData = await response.json();
        
        if (!isMounted) return;
        
        // Extract organiser name from the response
        const organiser = functionData.organiser as OrganiserInfo;
        
        if (organiser?.name) {
          setOrganiserName(organiser.name);
        } else {
          // Fallback to a default name if organiser info is missing
          setOrganiserName('United Grand Lodge of NSW & ACT');
        }
        
      } catch (err) {
        if (!isMounted) return;
        
        console.error('Error fetching organiser info:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Set fallback organiser name on error
        setOrganiserName('United Grand Lodge of NSW & ACT');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (slug) {
      fetchOrganiserInfo();
    } else {
      setIsLoading(false);
      setOrganiserName('United Grand Lodge of NSW & ACT');
    }

    return () => {
      isMounted = false;
    };
  }, [slug]);

  return {
    organiserName,
    isLoading,
    error
  };
}