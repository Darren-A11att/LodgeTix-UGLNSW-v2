import { FEATURED_FUNCTION_ID } from '@/lib/utils/function-slug-resolver-client';
import { featuredFunctionApi } from '@/lib/services/featured-function-service';
import { functionDataCache } from '@/lib/cache/function-data-cache';
import { registrationStore } from '@/lib/registrationStore';

/**
 * Preloads featured function data and caches it for immediate access
 * This should be called on the homepage to ensure data is ready for registration
 */
export async function preloadFeaturedFunctionData(): Promise<void> {
  try {
    // Check if data is already cached
    const cacheKey = `featured-function:${FEATURED_FUNCTION_ID}`;
    const cachedData = functionDataCache.get(cacheKey);
    
    if (cachedData) {
      // Data is already cached, update the registration store
      registrationStore.getState().setFunctionId(FEATURED_FUNCTION_ID);
      return;
    }

    // Fetch all data in parallel
    const [functionDetails, functionEvents, functionPackages] = await Promise.all([
      featuredFunctionApi.getDetails(),
      featuredFunctionApi.getEvents(),
      featuredFunctionApi.getPackages()
    ]);

    // Cache the data for 30 minutes
    functionDataCache.set(
      cacheKey,
      { functionDetails, functionEvents, functionPackages },
      1000 * 60 * 30
    );

    // Also cache function details separately for quick access
    functionDataCache.setFunctionDetails(FEATURED_FUNCTION_ID, functionDetails);

    // Update the registration store with the function ID
    registrationStore.getState().setFunctionId(FEATURED_FUNCTION_ID);

    console.log('[Function Preloader] Featured function data cached successfully');
  } catch (error) {
    console.error('[Function Preloader] Failed to preload function data:', error);
  }
}

/**
 * Gets cached function data or fetches it if not available
 * This is a synchronous check that returns immediately
 */
export function getCachedFunctionData() {
  const cacheKey = `featured-function:${FEATURED_FUNCTION_ID}`;
  return functionDataCache.get(cacheKey);
}

/**
 * Ensures function data is available, fetching if necessary
 * This is useful for components that need the data immediately
 */
export async function ensureFunctionData() {
  const cached = getCachedFunctionData();
  if (!cached) {
    await preloadFeaturedFunctionData();
  }
  return getCachedFunctionData();
}