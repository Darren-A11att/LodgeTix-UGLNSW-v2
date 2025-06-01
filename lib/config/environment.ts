/**
 * Environment configuration for functions architecture
 * Supports both FEATURED_FUNCTION_ID and FILTER_TO/FUNCTION_ID patterns
 */

export interface EnvironmentConfig {
  filterTo?: 'function' | 'organisation'
  functionId?: string
  organisationId?: string
  featuredFunctionId?: string
}

export function getEnvironmentConfig(): EnvironmentConfig {
  return {
    filterTo: process.env.FILTER_TO as 'function' | 'organisation' | undefined,
    functionId: process.env.FUNCTION_ID,
    organisationId: process.env.ORGANISATION_ID,
    featuredFunctionId: process.env.FEATURED_FUNCTION_ID
  }
}

/**
 * Helper function to check if filtering is enabled
 */
export function isFilteringEnabled(): boolean {
  const config = getEnvironmentConfig()
  // Check both explicit filtering and featured function filtering
  return !!(
    (config.filterTo && (config.functionId || config.organisationId)) ||
    config.featuredFunctionId
  )
}

/**
 * Get the filter parameters for database queries
 */
export function getFilterParams(): { column: string; value: string } | null {
  const config = getEnvironmentConfig()
  
  // First check explicit filtering configuration
  if (config.filterTo === 'function' && config.functionId) {
    return { column: 'function_id', value: config.functionId }
  }
  
  if (config.filterTo === 'organisation' && config.organisationId) {
    return { column: 'organiser_id', value: config.organisationId }
  }
  
  // Fall back to featured function if no explicit filtering but FEATURED_FUNCTION_ID is set
  if (!config.filterTo && config.featuredFunctionId) {
    return { column: 'function_id', value: config.featuredFunctionId }
  }
  
  return null
}