import { createClient } from '@supabase/supabase-js';
import { Database } from '@/shared/types/database';

/**
 * Singleton Supabase client for server-side realtime subscriptions
 * This client persists across requests to maintain websocket connections
 */
class SupabaseRealtimeSingleton {
  private static instance: SupabaseRealtimeSingleton;
  private client: ReturnType<typeof createClient<Database>> | null = null;

  private constructor() {}

  static getInstance(): SupabaseRealtimeSingleton {
    if (!SupabaseRealtimeSingleton.instance) {
      SupabaseRealtimeSingleton.instance = new SupabaseRealtimeSingleton();
    }
    return SupabaseRealtimeSingleton.instance;
  }

  getClient() {
    if (!this.client) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !anonKey) {
        throw new Error('Supabase URL and anon key are required for realtime');
      }

      // Create a persistent client for realtime subscriptions
      // Using anon key is fine for reading public data with RLS
      this.client = createClient<Database>(url, anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('🔌 [Realtime] Created persistent Supabase client for realtime');
      }
    }

    return this.client;
  }

  async cleanup() {
    if (this.client) {
      await this.client.removeAllChannels();
      this.client = null;
      if (process.env.NODE_ENV === 'development') {
        console.log('🧹 [Realtime] Cleaned up Supabase realtime client');
      }
    }
  }
}

export const supabaseRealtimeSingleton = SupabaseRealtimeSingleton.getInstance();