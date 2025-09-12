import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { colors, radii, spacing, type } from '../../theme';
import { Eyebrow } from '../../components/Eyebrow';
import { IconSparkle } from '../../components/Icons';
import { useStore } from '../../store';

export default function AlarmsRinging() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const dismissAlarm = useStore((s) => s.dismissAlarm);
  const alarm = useStore((s) => s.alarms.find((a) => a.id === id));
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setSecs((s) => s + 1), 1000);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    const burst = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, 900);
    return () => {
      clearInterval(i);
      clearInterval(burst);
    };
  }, []);

  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.08, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.top}>
        <Eyebrow style={{ color: colors.urgent }}>RINGING · {alarm?.time ?? '14:00'}</Eyebrow>
      </View>
      <View style={styles.center}>
        <Text style={styles.label}>{alarm?.label ?? 'Clinic appointment'}</Text>
        <Animated.Text style={[styles.countdown, pulseStyle]}>
          {mm}:{ss}
        </Animated.Text>

        <View style={styles.nudge}>
          <View style={styles.sparkle}>
            <IconSparkle size={14} color={colors.bg} />
          </View>
          <View style={{ flex: 1 }}>
            <Eyebrow>OMNI NUDGE</Eyebrow>
            <Text style={[type.body14, { color: colors.ink, marginTop: 4 }]}>
              Clinic is 12 min away in current traffic — leave now.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            router.back();
          }}
          style={styles.ghostBtn}
        >
          <Text style={styles.ghostBtnText}>SNOOZE 10M</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            if (id) dismissAlarm(id);
            router.back();
          }}
          style={styles.primary}
        >
          <Text style={styles.primaryText}>MARK DONE</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.screenX },
  top: { paddingTop: 6 },
  center: { flex: 1, justifyContent: 'center', gap: 22 },
  label: { ...type.display28, color: colors.ink },
  countdown: {
    ...type.display44,
    fontFamily: 'JetBrainsMono_500Medium',
    color: colors.urgent,
    fontSize: 88,
    letterSpacing: 2,
  },
  nudge: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.bgRaise,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    marginTop: 18,
  },
  sparkle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { flexDirection: 'row', gap: 10, paddingBottom: 32 },
  ghostBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: radii.md,
    alignItems: 'center',
    backgroundColor: colors.bgRaise,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  ghostBtnText: { ...type.mono11, color: colors.ink, letterSpacing: 1.4 },
  primary: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: radii.md,
    alignItems: 'center',
    backgroundColor: colors.ink,
  },
  primaryText: { ...type.mono11, color: colors.bg, letterSpacing: 1.4 },
});
