import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, type } from '../theme';

type Props = {
  label: string;
  active?: boolean;
  urgent?: boolean;
  solid?: boolean;
  dot?: boolean;
  dotColor?: string;
  onPress?: () => void;
};

export function Chip({ label, active, urgent, solid, dot, dotColor, onPress }: Props) {
  const bg = solid
    ? colors.ink
    : urgent
      ? 'rgba(245,165,36,0.08)'
      : active
        ? 'rgba(255,255,255,0.12)'
        : 'rgba(255,255,255,0.06)';
  const border = urgent
    ? 'rgba(245,165,36,0.3)'
    : active
      ? colors.lineStrong
      : colors.line;
  const fg = solid
    ? colors.bg
    : urgent
      ? colors.urgent
      : active
        ? colors.ink
        : colors.inkDim;

  const body = (
    <View
      style={[
        styles.wrap,
        { backgroundColor: bg, borderColor: border },
      ]}
    >
      {dot ? (
        <View
          style={[
            styles.dot,
            { backgroundColor: dotColor ?? fg },
          ]}
        />
      ) : null}
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </View>
  );

  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} hitSlop={6}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
  },
  label: {
    ...type.mono10,
    letterSpacing: 0.4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});
