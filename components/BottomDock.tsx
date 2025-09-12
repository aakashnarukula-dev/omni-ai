import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

import { colors } from '../theme';
import { useStore } from '../store';
import {
  IconBell,
  IconCard,
  IconCheck,
  IconMic,
  IconSearch,
} from './Icons';

type IconCmp = (p: { size?: number; color?: string }) => React.ReactElement;
const TABS: { label: string; Icon: IconCmp }[] = [
  { label: 'Tasks', Icon: IconCheck },
  { label: 'Alarms', Icon: IconBell },
  { label: 'Cards', Icon: IconCard },
];

export function BottomDock() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 14);

  const tabIndex = useStore((s) => s.tabIndex);
  const setTabIndex = useStore((s) => s.setTabIndex);
  const setSearchOpen = useStore((s) => s.setSearchOpen);
  const voiceState = useStore((s) => s.voice.state);
  const setVoiceState = useStore((s) => s.setVoiceState);
  const resetVoice = useStore((s) => s.resetVoice);
  const recording = voiceState === 'listening';

  const glow = useSharedValue(0);
  useEffect(() => {
    if (recording) {
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 800, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(glow);
      glow.value = withTiming(0, { duration: 240 });
    }
  }, [recording, glow]);
  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + glow.value * 0.45,
    transform: [{ scale: 1 + glow.value * 0.18 }],
  }));

  const onMicPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (recording) setVoiceState('transcribing');
    else {
      resetVoice();
      setVoiceState('listening');
    }
  };

  const onSearchPress = () => {
    Haptics.selectionAsync().catch(() => {});
    setSearchOpen(true);
  };

  return (
    <View
      style={[styles.outer, { paddingBottom: bottomPad }]}
      pointerEvents="box-none"
    >
      <View style={styles.dock}>
        <BlurView
          intensity={55}
          tint="dark"
          style={[StyleSheet.absoluteFill, { borderRadius: 36 }]}
        />
        <View style={styles.tint} pointerEvents="none" />

        <View style={styles.micSlot}>
          {recording ? (
            <Animated.View
              pointerEvents="none"
              style={[styles.micGlow, glowStyle]}
            />
          ) : null}
          <Pressable
            onPress={onMicPress}
            android_ripple={{ color: 'rgba(255,255,255,0.22)', borderless: true, radius: MIC_SIZE / 2 }}
            style={({ pressed }) => [
              styles.micBtn,
              recording && styles.micBtnRec,
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={recording ? 'Stop recording' : 'Voice capture'}
            hitSlop={6}
          >
            {recording ? (
              <View style={styles.stopSquare} />
            ) : (
              <IconMic size={19} color={colors.ink} />
            )}
          </Pressable>
        </View>

        <Pressable
          onPress={onSearchPress}
          android_ripple={{ color: 'rgba(255,255,255,0.18)', borderless: true, radius: SEARCH_SIZE / 2 }}
          style={({ pressed }) => [styles.searchBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Search"
          hitSlop={6}
        >
          <IconSearch size={19} color={colors.ink} />
        </Pressable>

        <View style={styles.divider} pointerEvents="none" />

        <View style={styles.tabsGroup}>
          {TABS.map((t, i) => {
            const active = tabIndex === i;
            return (
              <Pressable
                key={t.label}
                onPress={() => {
                  if (active) return;
                  Haptics.selectionAsync().catch(() => {});
                  setTabIndex(i);
                }}
                android_ripple={{ color: 'rgba(255,255,255,0.18)', borderless: true, radius: TAB_ICON / 2 }}
                style={({ pressed }) => [
                  styles.tabBtn,
                  pressed && !active && { opacity: 0.55 },
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={t.label}
                hitSlop={6}
              >
                <View style={[styles.tabIconWrap, active && styles.tabIconWrapActive]}>
                  <t.Icon size={18} color={active ? colors.bg : colors.ink} />
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const DOCK_HEIGHT = 64;
const TAB_ICON = 42;
const MIC_SIZE = 44;
const SEARCH_SIZE = 44;

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingTop: 6,
    alignItems: 'center',
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: DOCK_HEIGHT,
    borderRadius: 36,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
    backgroundColor:
      Platform.OS === 'android' ? 'rgba(18,18,20,0.94)' : 'rgba(18,18,20,0.72)',
    overflow: 'hidden',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 14,
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  tabsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: 6,
  },
  tabBtn: {
    width: TAB_ICON,
    height: TAB_ICON,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 999,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabIconWrapActive: {
    backgroundColor: colors.ink,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.14)',
    marginHorizontal: 6,
  },
  searchBtn: {
    width: SEARCH_SIZE,
    height: SEARCH_SIZE,
    borderRadius: SEARCH_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  micSlot: {
    width: MIC_SIZE,
    height: MIC_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  micGlow: {
    position: 'absolute',
    width: MIC_SIZE + 16,
    height: MIC_SIZE + 16,
    borderRadius: (MIC_SIZE + 16) / 2,
    backgroundColor: colors.urgent,
    opacity: 0.35,
  },
  micBtn: {
    width: MIC_SIZE,
    height: MIC_SIZE,
    borderRadius: MIC_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnRec: {
    backgroundColor: colors.urgent,
    borderColor: colors.urgent,
  },
  stopSquare: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: colors.bg,
  },
});
