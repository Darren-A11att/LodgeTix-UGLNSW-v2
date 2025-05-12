import { supabase } from '@/lib/supabase-browser'
import { NextApiRequest, NextApiResponse } from 'next'

/**
 * Utility to handle API authentication
 * This can be used to protect API routes that require authentication
 */
export async function withAuth(
  req: NextApiRequest,
  res: NextApiResponse,
  handler: (userId: string, req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  try {
    // Get the session from Supabase
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      return res.status(500).json({ error: 'Failed to get session' })
    }
    
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' })
    }
    
    // Call the handler with the user ID
    return await handler(session.user.id, req, res)
  } catch (error) {
    console.error('Auth error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * Utility to handle errors in API routes
 */
export function handleApiError(res: NextApiResponse, error: any) {
  console.error('API error:', error)
  const message = error instanceof Error ? error.message : 'Internal server error'
  return res.status(500).json({ error: message })
}

/**
 * Utility to validate required fields in request body
 */
export function validateFields(
  req: NextApiRequest,
  res: NextApiResponse,
  fields: string[]
): boolean {
  const missingFields = fields.filter(field => !req.body[field])
  
  if (missingFields.length > 0) {
    res.status(400).json({
      error: `Missing required fields: ${missingFields.join(', ')}`
    })
    return false
  }
  
  return true
}