How to Encrypt/Decrypt a Persisted Zustand Store in Next.js 15 with Any Web Storage
Isaiah Abiodun
Isaiah Abiodun
Mobile Engineer with Animation


May 29, 2025
Next.js is a server-side first framework, while Zustand provides a lightweight client-side state management solution. Combining the two is powerful and becomes critical to avoid security risks and prevent exposure.

Every new technology brings with it new risks, but the greatest risk of all is for me not to understand those risks.
🔐 Why Encrypt Zustand Stores?
While Zustand's persist middleware simplifies storing client state (e.g., tokens, user preferences) in localStorage, sessionStorage, IndexedDB or even cookies, encryption becomes critical to avoid security risks, prevent exposure of sensitive data, and ensure data confidentiality, even if storage is compromised.

🔧 Here's how to securely encrypt and decrypt your Zustand store
Next.js 15 provides out-of-the-box dependency crypto from Node.js, which can be used without downloading any external dependencies apart from Zustand. We need the following dependencies;

Crypto
Zustand

# NPM
npm install zustand

# YARN
yarn add zustand
We need to write out our encrypted function using AES-256-CBC from crypto. Below is the code;

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';


# ENCRYPT
const encryptData = (data: string, secretKey: string) => {
  const iv = randomBytes(16);
  const cipher = createCipheriv(
    'aes-256-cbc',
    Buffer.from(secretKey, 'hex'),
    iv,
  );
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

# DECRYPT
const decryptData = (data: string, secretKey: string): string => {
  const [ivHex, encryptedData] = data.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv(
    'aes-256-cbc',
    Buffer.from(secretKey, 'hex'),
    iv,
  );
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
Above, we have written both functions we want to use to encrypt and decrypt our client state from Zustand. However, because Next.js 15 is a server-first approach, we need to solve an issue when we run next build to build our Next.js project.

import type { StateStorage } from 'zustand/middleware';

# Encrypted function to solve the SSR of next build
const createEncryptedStorage = (): StateStorage => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
}
With the code above, we have solved the SSR issues that might occur when building our project with next build.

# Full Encrypted Storage with localStorage
# localStorage can be swapped with any storage of your choice

const createEncryptedStorage = ((): StateStorage => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }

const secretKey = 'MY_SECRET_KEY'

return {
    getItem: (name: string): string | null => {
      const encryptedValue = localStorage.getItem(name);
      if (!encryptedValue) return null;

      try {
        const decryptedValue = decryptData(encryptedValue, secretKey);
        const decrypted = JSON.parse(decryptedValue);
        return decrypted;
      } catch (error) {
        console.error('Error decrypting or parsing data:', error);
        return null;
      }
    },
    setItem: (name: string, value: string): void => {
      try {
        const jsonString = JSON.stringify(value);
        const encryptedValue = encryptData(jsonString, secretKey);
        return localStorage.setItem(name, encryptedValue);
      } catch (error) {
        console.error('Error encrypting or stringifying data:', error);
      }
    },
    removeItem: (name: string): void => {
      return localStorage.removeItem(name);
    },
  };
})();
Then, we can use the createEncryptedStorage function with our Zustand persisted store with the code below;

# Zustand Persistence store from https://zustand.docs.pmnd.rs/middlewares/persist

import { createStore } from 'zustand/vanilla'
import {  createJSONStorage, persist } from 'zustand/middleware'

type PositionStoreState = { position: { x: number; y: number } }

type PositionStoreActions = {
  setPosition: (nextPosition: PositionStoreState['position']) => void
}

type PositionStore = PositionStoreState & PositionStoreActions

const positionStore = createStore<PositionStore>()(
  persist(
    (set) => ({
      position: { x: 0, y: 0 },
      setPosition: (position) => set({ position }),
    }),
    { 
     name: 'position-storage',
     storage: createJSONStorage(() => createEncryptedStorage),      
    },
  ),
) 
✨ Conclusion
Encrypting client state is not optional; it is crucial for users' trust. Consider securely storing your secret keys using environmental variables directly in next.config.mjs as shown in the example code below, which is compiled at build time with your application.

# next.config.mjs
const nextConfig = {
// rest of the config
  env: {
    KEY_NAME: process.env.KEY_NAME,
 }
}

export default nextConfig;
