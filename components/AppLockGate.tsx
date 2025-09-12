import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  type AppStateStatus,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

import { colors, spacing, type } from '../theme';
import { Eyebrow } from './Eyebrow';

const BACKGROUND_RELOCK_MS = 15_000;

export function AppLockGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [status, setStatus] = useState<'idle' | 'prompting' | 'failed' | 'unsupported'>('idle');
  const backgroundedAtRef = useRef<number | null>(null);

  const authenticate = useCallback(async () => {
    setStatus('prompting');
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        setStatus('unsupported');
        setUnlocked(true);
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Omni',
        fallbackLabel: 'Use device PIN',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      if (result.success) {
        setUnlocked(true);
        setStatus('idle');
      } else {
        setStatus('failed');
      }
    } catch {
      setStatus('failed');
    }
  }, []);

  useEffect(() => {
    authenticate();
  }, [authenticate]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'background' || next === 'inactive') {
        backgroundedAtRef.current = Date.now();
      }
      if (next === 'active' && backgroundedAtRef.current) {
        const gap = Date.now() - backgroundedAtRef.current;
        backgroundedAtRef.current = null;
        if (gap >= BACKGROUND_RELOCK_MS) {
          setUnlocked(false);
          authenticate();
        }
      }
    });
    return () => sub.remove();
  }, [authenticate]);

  if (unlocked) return <>{children}</>;

  return (
    <View style={styles.root}>
      <View style={styles.center}>
        <Eyebrow>LOCKED</Eyebrow>
        <Text style={styles.title}>Omni</Text>
        <Text style={styles.sub}>
          {status === 'prompting'
            ? 'Authenticating…'
            : status === 'failed'
            ? 'Authentication failed. Tap to try again.'
            : 'Unlock to continue.'}
        </Text>
        <Pressable
          onPress={authenticate}
          style={styles.btn}
          disabled={status === 'prompting'}
        >
          <Text style={styles.btnText}>UNLOCK</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.screenX,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  title: { ...type.display44, color: colors.ink },
  sub: { ...type.body14, color: colors.inkDim, textAlign: 'center' },
  btn: {
    marginTop: 18,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: colors.ink,
  },
  btnText: { ...type.mono11, color: colors.bg, letterSpacing: 1.6 },
});
