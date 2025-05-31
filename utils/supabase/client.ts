import { getBrowserClient } from '@/lib/supabase-singleton'

// This file now just re-exports the singleton client for backward compatibility
export function createClient() {
  return getBrowserClient()
}