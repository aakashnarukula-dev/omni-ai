// Wrapper around expo-secure-store. Masks digits for display.
// Sensitive card/PAN/Aadhaar full numbers live here, NEVER in Zustand.

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const enabled = Platform.OS !== 'web'; // secure-store is native-only

export async function saveSecret(key: string, value: string) {
  if (!enabled) return;
  await SecureStore.setItemAsync(key, value);
}

export async function readSecret(key: string): Promise<string | null> {
  if (!enabled) return null;
  return SecureStore.getItemAsync(key);
}

export async function deleteSecret(key: string) {
  if (!enabled) return;
  await SecureStore.deleteItemAsync(key);
}

export function maskCardNumber(num: string): string {
  const digits = num.replace(/\D/g, '');
  if (digits.length < 4) return num;
  const last4 = digits.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

export function maskIdNumber(num: string): string {
  const stripped = num.replace(/\s+/g, '');
  if (stripped.length <= 4) return num;
  const keep = 4;
  return '•'.repeat(stripped.length - keep) + stripped.slice(-keep);
}
