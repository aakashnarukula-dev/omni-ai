// Zustand StateStorage backed by expo-secure-store (Keystore / Keychain).
// Splits values into chunks because Android SecureStore caps values at ~2 KB.

import * as SecureStore from 'expo-secure-store';
import type { StateStorage } from 'zustand/middleware';

const CHUNK_SIZE = 1800;

export const secureStorage: StateStorage = {
  getItem: async (name) => {
    const countStr = await SecureStore.getItemAsync(`${name}__c`).catch(() => null);
    if (!countStr) return null;
    const count = Number(countStr);
    if (!Number.isFinite(count) || count <= 0) return null;
    const parts: string[] = [];
    for (let i = 0; i < count; i++) {
      const p = await SecureStore.getItemAsync(`${name}__${i}`).catch(() => null);
      if (p == null) return null;
      parts.push(p);
    }
    return parts.join('');
  },

  setItem: async (name, value) => {
    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    const oldCountStr = await SecureStore.getItemAsync(`${name}__c`).catch(() => null);
    const oldCount = oldCountStr ? Number(oldCountStr) : 0;
    await SecureStore.setItemAsync(`${name}__c`, String(chunks.length));
    for (let i = 0; i < chunks.length; i++) {
      await SecureStore.setItemAsync(`${name}__${i}`, chunks[i]);
    }
    for (let i = chunks.length; i < oldCount; i++) {
      await SecureStore.deleteItemAsync(`${name}__${i}`).catch(() => {});
    }
  },

  removeItem: async (name) => {
    const countStr = await SecureStore.getItemAsync(`${name}__c`).catch(() => null);
    const count = countStr ? Number(countStr) : 0;
    for (let i = 0; i < count; i++) {
      await SecureStore.deleteItemAsync(`${name}__${i}`).catch(() => {});
    }
    await SecureStore.deleteItemAsync(`${name}__c`).catch(() => {});
  },
};
