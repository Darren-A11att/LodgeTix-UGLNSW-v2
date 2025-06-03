/**
 * Function Slug Resolver
 * Utilities for resolving function slugs to UUIDs in featured function mode
 */

import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createBrowserClient } from '@/utils/supabase/client'

// Get featured function ID from environment
export const FEATURED_FUNCTION_ID = process.env.FEATURED_FUNCTION_ID || process.env.NEXT_PUBLIC_FEATURED_FUNCTION_ID || 'eebddef5-6833-43e3-8d32-700508b1c089'

// Cache for resolved slugs (in-memory for server components)
const slugCache = new Map<string, string>()

/**
 * Resolves a function slug to its UUID
 * In featured function mode, this primarily returns the featured function ID
 * @param slug - The function slug from the URL
 * @param isServerSide - Whether this is running server-side
 * @returns The function UUID
 */
export async function resolveFunctionSlug(slug: string, isServerSide: boolean = true): Promise<string> {
  // Check cache first
  if (slugCache.has(slug)) {
    return slugCache.get(slug)!
  }

  try {
    // In featured function mode, we should primarily use the featured function
    // But we still need to handle the case where a specific slug is provided
    const supabase = isServerSide 
      ? await createServerClient() 
      : createBrowserClient()
    
    // Query to check if this slug exists and get its ID
    const { data, error } = await supabase
      .from('functions')
      .select('function_id, slug')
      .eq('slug', slug)
      .single()

    if (error || !data) {
      console.warn(`Function with slug "${slug}" not found, using featured function`)
      return FEATURED_FUNCTION_ID
    }

    // Cache the result
    slugCache.set(slug, data.function_id)
    return data.function_id
  } catch (error) {
    console.error('Error resolving function slug:', error)
    // Fall back to featured function ID
    return FEATURED_FUNCTION_ID
  }
}

/**
 * Gets the featured function details including its slug
 * Useful for components that need to know both ID and slug
 */
export async function getFeaturedFunctionInfo(isServerSide: boolean = true): Promise<{ id: string; slug: string }> {
  try {
    const supabase = isServerSide 
      ? await createServerClient() 
      : createBrowserClient()
    
    const { data, error } = await supabase
      .from('functions')
      .select('function_id, slug')
      .eq('function_id', FEATURED_FUNCTION_ID)
      .single()

    if (error || !data) {
      console.error('Featured function not found')
      return { id: FEATURED_FUNCTION_ID, slug: 'featured' }
    }

    return { id: data.function_id, slug: data.slug }
  } catch (error) {
    console.error('Error getting featured function info:', error)
    return { id: FEATURED_FUNCTION_ID, slug: 'featured' }
  }
}

/**
 * Checks if a given slug is the featured function
 */
export async function isFeaturedFunction(slug: string, isServerSide: boolean = true): Promise<boolean> {
  const featuredInfo = await getFeaturedFunctionInfo(isServerSide)
  return featuredInfo.slug === slug
}

