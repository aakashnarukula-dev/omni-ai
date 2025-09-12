import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, type } from '../theme';

export function QueuedPill({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View style={styles.wrap}>
      <View style={styles.dot} />
      <Text style={styles.text}>{count} queued</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(250,250,250,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.ok,
  },
  text: {
    ...type.mono10,
    color: colors.inkDim,
    letterSpacing: 0.4,
  },
});
