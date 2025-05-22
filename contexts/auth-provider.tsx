'use client'

import { getBrowserClient } from '@/lib/supabase-unified'
import { User, Session, SupabaseClient } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

// Define the context shape
interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any | null }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Function to refresh user session
  const refreshSession = async () => {
    try {
      const { data, error } = await getBrowserClient().auth.getSession()
      if (error) {
        console.error('Error refreshing session:', error)
        return
      }

      setSession(data.session)
      setUser(data.session?.user ?? null)
    } catch (error) {
      console.error('Unexpected error during session refresh:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial session check
  useEffect(() => {
    refreshSession()

    // Set up auth state change listener
    const { data: { subscription } } = getBrowserClient().auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        setUser(session?.user ?? null)
        setSession(session)
        setIsLoading(false)
      }
    )

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const { error } = await getBrowserClient().auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error }
      }

      return { error: null }
    } catch (error) {
      console.error('Unexpected error during sign in:', error)
      return { error }
    } finally {
      setIsLoading(false)
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      setIsLoading(true)
      await getBrowserClient().auth.signOut()
      setUser(null)
      setSession(null)
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Provide the auth context to children
  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}