import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

import {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from '@expo-google-fonts/instrument-serif';
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
} from '@expo-google-fonts/geist';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';

import { colors } from '../theme';
import { AppLockGate } from '../components/AppLockGate';
import { NotificationSync } from '../components/NotificationSync';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AppLockGate>
          <NotificationSync />
          <View style={styles.root}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg },
                animation: 'fade',
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="transcribe" options={{ presentation: 'modal' }} />
              <Stack.Screen name="search" options={{ presentation: 'modal' }} />
              <Stack.Screen name="assistant" options={{ presentation: 'modal' }} />
              <Stack.Screen name="confirm" options={{ presentation: 'modal' }} />
              <Stack.Screen name="camera/scan" options={{ presentation: 'modal' }} />
              <Stack.Screen name="camera/review" />
              <Stack.Screen name="manual/entry" />
              <Stack.Screen name="detail/[id]" />
              <Stack.Screen name="alarms/settings" />
              <Stack.Screen name="alarms/ringing" options={{ presentation: 'modal' }} />
            </Stack>
          </View>
        </AppLockGate>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
