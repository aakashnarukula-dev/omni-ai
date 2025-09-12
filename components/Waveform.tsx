import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../theme';

type Props = {
  bars?: number;
  height?: number;
  color?: string;
  active?: boolean;
  amplitude?: number; // 0..1 — drives peaks when provided
};

export function Waveform({
  bars = 30,
  height = 80,
  color = colors.ink,
  active = true,
  amplitude,
}: Props) {
  return (
    <View style={[styles.row, { height }]}>
      {Array.from({ length: bars }).map((_, i) => (
        <Bar
          key={i}
          index={i}
          color={color}
          height={height}
          active={active}
          amplitude={amplitude}
        />
      ))}
    </View>
  );
}

function Bar({
  index,
  color,
  height,
  active,
  amplitude,
}: {
  index: number;
  color: string;
  height: number;
  active: boolean;
  amplitude?: number;
}) {
  const v = useSharedValue(0.08);

  useEffect(() => {
    if (!active) {
      v.value = withTiming(0.06, { duration: 180 });
      return;
    }
    const amp = typeof amplitude === 'number' ? amplitude : 0;
    // Per-bar weight in 0.45..1 so neighbours differ in height at the same amp.
    const seed = 0.45 + Math.abs(Math.sin(index * 12.9898)) * 0.55;
    // Cheap jitter so bars don't all move in lockstep at steady amplitude.
    const jitter = (Math.sin(index * 7.13 + amp * 17) + 1) * 0.06;
    const target = Math.max(0.06, Math.min(1, amp * seed + jitter));
    v.value = withTiming(target, {
      duration: 110,
      easing: Easing.out(Easing.quad),
    });
  }, [active, amplitude, index, v]);

  const aStyle = useAnimatedStyle(() => ({
    height: Math.max(3, height * v.value),
  }));

  return (
    <Animated.View
      style={[styles.bar, { backgroundColor: color }, aStyle]}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  bar: { width: 3, borderRadius: 2, minHeight: 3 },
});
