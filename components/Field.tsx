import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, type } from '../theme';
import { Eyebrow } from './Eyebrow';

type Props = {
  label: string;
  value: string;
  mono?: boolean;
  confidence?: number;
};

export function Field({ label, value, mono, confidence }: Props) {
  const needsConfirm =
    typeof confidence === 'number' && confidence >= 0.6 && confidence < 0.85;
  return (
    <View
      style={[
        styles.wrap,
        needsConfirm && { borderLeftColor: colors.urgent, borderLeftWidth: 2 },
      ]}
    >
      <Eyebrow>{label}</Eyebrow>
      <Text
        style={[
          mono ? type.mono15 : type.body14,
          { color: colors.ink, marginTop: 6 },
        ]}
      >
        {value}
      </Text>
      {typeof confidence === 'number' ? (
        <Text style={styles.conf}>
          {needsConfirm ? 'TAP TO CONFIRM · ' : ''}
          {Math.round(confidence * 100)}%
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.bgRaise,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  conf: {
    ...type.mono10,
    color: colors.inkFaint,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 6,
  },
});
