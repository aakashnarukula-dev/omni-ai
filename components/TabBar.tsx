import { Platform, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme';
import { IconMic, IconSearch } from './Icons';
import { useStore } from '../store';

export function TabBar() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 18);
  const voiceState = useStore((s) => s.voice.state);
  const setVoiceState = useStore((s) => s.setVoiceState);
  const resetVoice = useStore((s) => s.resetVoice);
  const setSearchOpen = useStore((s) => s.setSearchOpen);
  const recording = voiceState === 'listening';

  const onMicPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (recording) {
      setVoiceState('transcribing');
    } else {
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
      style={[styles.dock, { paddingBottom: bottomPad }]}
      pointerEvents="box-none"
    >
      <View style={styles.pillWrap} pointerEvents="box-none">
        <View style={[styles.pill, recording && styles.pillRecording]}>
          <BlurView
            intensity={50}
            tint="dark"
            style={[StyleSheet.absoluteFill, styles.pillBlur]}
          />
          <View style={styles.pillTint} pointerEvents="none" />

          <Pressable
            onPress={onSearchPress}
            android_ripple={{ color: 'rgba(255,255,255,0.08)', borderless: false }}
            style={styles.searchSegment}
            accessibilityRole="button"
            accessibilityLabel="Search"
          >
            <IconSearch size={22} color={colors.ink} />
          </Pressable>

          <View style={styles.divider} pointerEvents="none" />

          <Pressable
            onPress={onMicPress}
            style={[styles.micSegment, recording && styles.micSegmentActive]}
            accessibilityRole="button"
            accessibilityLabel={recording ? 'Stop recording' : 'Voice capture'}
          >
            {recording ? (
              <View style={styles.stopSquare} />
            ) : (
              <IconMic size={28} color={colors.bg} />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const PILL_HEIGHT = 64;

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 6,
    alignItems: 'center',
  },
  pillWrap: {
    width: 200,
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 14,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: PILL_HEIGHT / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
    backgroundColor:
      Platform.OS === 'android' ? 'rgba(18,18,20,0.94)' : 'rgba(18,18,20,0.7)',
  },
  pillRecording: {
    borderColor: colors.urgent,
  },
  pillBlur: { borderRadius: PILL_HEIGHT / 2 },
  pillTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  searchSegment: {
    width: PILL_HEIGHT,
    height: PILL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  micSegment: {
    flex: 1,
    height: PILL_HEIGHT,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micSegmentActive: {
    backgroundColor: colors.urgent,
  },
  stopSquare: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: colors.bg,
  },
});
