'use client';

import { useEffect } from 'react';
import { clearEncryptionKeyCache } from '@/lib/utils/user-encrypted-storage';
import { createClient } from '@/utils/supabase/client';

export function AuthEncryptionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = createClient();
    
    // Clear encryption key cache on auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      clearEncryptionKeyCache();
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  return <>{children}</>;
}