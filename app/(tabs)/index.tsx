import { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomDock } from '../../components/BottomDock';
import { SearchOverlay } from '../../components/SearchOverlay';
import { VoiceOverlay } from '../../components/VoiceOverlay';
import { colors } from '../../theme';
import { useStore } from '../../store';

import TasksScreen from './_tasks';
import AlarmsScreen from './_alarms';
import CardsScreen from './_cards';

const SCREENS = [TasksScreen, AlarmsScreen, CardsScreen];

export default function TabsPager() {
  const W = Dimensions.get('window').width;
  const tabIndex = useStore((s) => s.tabIndex);
  const setTabIndex = useStore((s) => s.setTabIndex);

  const translateX = useSharedValue(-tabIndex * W);

  useEffect(() => {
    translateX.value = withTiming(-tabIndex * W, { duration: 220 });
  }, [tabIndex, W, translateX]);

  const commitIndex = (next: number) => {
    if (next !== tabIndex) {
      Haptics.selectionAsync().catch(() => {});
      setTabIndex(next);
    }
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-18, 18])
    .failOffsetY([-14, 14])
    .onUpdate((e) => {
      const base = -tabIndex * W;
      const tentative = base + e.translationX;
      const min = -(SCREENS.length - 1) * W;
      translateX.value = Math.max(min, Math.min(0, tentative));
    })
    .onEnd((e) => {
      const base = -tabIndex * W;
      const travelled = translateX.value - base;
      const vx = e.velocityX;
      let next = tabIndex;
      if (travelled < -W / 3 || vx < -700) next = Math.min(SCREENS.length - 1, tabIndex + 1);
      else if (travelled > W / 3 || vx > 700) next = Math.max(0, tabIndex - 1);
      translateX.value = withSpring(-next * W, {
        damping: 26,
        stiffness: 240,
        mass: 0.9,
      });
      if (next !== tabIndex) runOnJS(commitIndex)(next);
    });

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.topInset} />
      <GestureDetector gesture={pan}>
        <View style={styles.pagerClip}>
          <Animated.View
            style={[
              styles.track,
              { width: W * SCREENS.length },
              trackStyle,
            ]}
          >
            {SCREENS.map((Screen, i) => (
              <View key={i} style={{ width: W, height: '100%' }}>
                <Screen />
              </View>
            ))}
          </Animated.View>
        </View>
      </GestureDetector>
      <BottomDock />
      <SearchOverlay />
      <VoiceOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topInset: { backgroundColor: colors.bg },
  pagerClip: { flex: 1, overflow: 'hidden' },
  track: { flexDirection: 'row', height: '100%' },
});
