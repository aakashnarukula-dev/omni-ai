import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme';

type Props = {
  checked: boolean;
  onToggle: () => void;
  size?: number;
};

export function Checkbox({ checked, onToggle, size = 20 }: Props) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(0.9, { duration: 60 }),
      withTiming(1, { duration: 60 })
    );
  }, [checked, scale]);

  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onToggle();
      }}
      hitSlop={10}
    >
      <Animated.View style={aStyle}>
        <View
          style={[
            styles.box,
            {
              width: size,
              height: size,
              borderColor: checked ? colors.ink : colors.lineStrong,
              backgroundColor: checked ? colors.ink : 'transparent',
            },
          ]}
        >
          {checked ? (
            <Svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="none">
              <Path
                d="M5 12 L10 17 L19 7"
                stroke={colors.bg}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          ) : null}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
