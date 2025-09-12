import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radii } from '../theme';

type Props = {
  leading?: React.ReactNode;
  children: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  urgent?: boolean;
};

export function RowCard({ leading, children, trailing, onPress, style, urgent }: Props) {
  const body = (
    <View
      style={[
        styles.wrap,
        urgent && { borderLeftColor: colors.urgent, borderLeftWidth: 2 },
        style,
      ]}
    >
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.body}>{children}</View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} android_ripple={{ color: 'rgba(255,255,255,0.04)' }}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.bgRaise,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  leading: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.bgRaise2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  trailing: { alignItems: 'flex-end', justifyContent: 'center' },
});
