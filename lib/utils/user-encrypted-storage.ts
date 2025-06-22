import CryptoJS from 'crypto-js';
import { StateStorage } from 'zustand/middleware';
import { getBrowserClient } from '@/lib/supabase-singleton';

// Cache the encryption key for the session
let cachedEncryptionKey: string | null = null;

export const getUserEncryptionKey = async (): Promise<string> => {
  if (cachedEncryptionKey) return cachedEncryptionKey;
  
  try {
    const supabase = getBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.id) {
      // Fallback to device-specific key
      return CryptoJS.SHA256(
        navigator.userAgent + screen.width + screen.height
      ).toString();
    }
    
    // Use user ID with app-specific salt
    const appSalt = 'lodgetix-2024-secure-salt';
    cachedEncryptionKey = CryptoJS.SHA256(user.id + appSalt).toString();
    return cachedEncryptionKey;
  } catch (error) {
    console.error('Failed to get user encryption key:', error);
    return 'lodgetix-fallback-key';
  }
};

export const clearEncryptionKeyCache = () => {
  cachedEncryptionKey = null;
};

export const createUserEncryptedStorage = (): StateStorage => {
  return {
    getItem: async (name: string): Promise<string | null> => {
      try {
        const encryptedData = localStorage.getItem(name);
        if (!encryptedData) return null;
        
        // Check if data is unencrypted (for migration)
        try {
          JSON.parse(encryptedData);
          return encryptedData; // Return unencrypted data
        } catch {
          // Decrypt the data
          const encryptionKey = await getUserEncryptionKey();
          const decrypted = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
          const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
          return decryptedString || null;
        }
      } catch (error) {
        console.error('Failed to decrypt storage:', error);
        return null;
      }
    },
    
    setItem: async (name: string, value: string): Promise<void> => {
      try {
        const encryptionKey = await getUserEncryptionKey();
        const encrypted = CryptoJS.AES.encrypt(value, encryptionKey).toString();
        localStorage.setItem(name, encrypted);
      } catch (error) {
        console.error('Failed to encrypt storage:', error);
        localStorage.setItem(name, value); // Fallback
      }
    },
    
    removeItem: (name: string): void => {
      localStorage.removeItem(name);
    }
  };
};