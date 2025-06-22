Encrypted localStorage with Zustand
#
typescript
#
zustand
#
storage
#
cryptojs
I don't know if anyone finds this any useful, but I had a specific requirement to save the localStorage data encrypted. Using zustand I created this snippet to persist my data.

import { PersistStorage } from "zustand/middleware";
import CryptoJS from "crypto-js";

export class EncryptedStorage implements PersistStorage<any> {
  getItem(key: string): any | undefined {
    const value = localStorage.getItem(key);

    if (value) {
      const decryptedBytes = CryptoJS.AES.decrypt(value, <YOUR_NONCE>)
      const decryptedValue = decryptedBytes.toString(CryptoJS.enc.Utf8);
      return decryptedValue
    }

    return value
  }

  setItem(key: string, value: any): void {
    const encrypted = CryptoJS.AES.encrypt(value, <YOUR_NONCE>).toString()
    localStorage.setItem(key, encrypted);
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }
}