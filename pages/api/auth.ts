import { supabase } from '@/lib/supabase-browser'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return await getSession(req, res)
    case 'POST':
      return await signIn(req, res)
    case 'DELETE':
      return await signOut(req, res)
    default:
      return res.status(405).json({ error: 'Method not allowed' })
  }
}

// Get the current session
async function getSession(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      return res.status(500).json({ error: 'Failed to get user session' })
    }
    
    if (!session) {
      return res.status(401).json({ user: null, message: 'No active session' })
    }
    
    return res.status(200).json({ user: session.user })
  } catch (error) {
    console.error('Error in getSession:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// Sign in with email and password
async function signIn(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      return res.status(401).json({ error: error.message })
    }
    
    return res.status(200).json({ user: data.user })
  } catch (error) {
    console.error('Error in signIn:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// Sign out
async function signOut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return res.status(500).json({ error: 'Failed to sign out' })
    }
    
    return res.status(200).json({ message: 'Signed out successfully' })
  } catch (error) {
    console.error('Error in signOut:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}