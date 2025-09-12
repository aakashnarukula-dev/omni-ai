import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../theme';

// Per AI_ARCHITECTURE.md — three-state confidence UI:
//  ≥ 0.85          Accepted: no chrome
//  0.60 – 0.85     Confirm:  2px urgent left-border + "TAP TO CONFIRM" eyebrow
//  < 0.60          Reject:   caller should skip entirely

type Props = {
  confidence: number;
  children: React.ReactNode;
  style?: ViewStyle;
};

export function Confidence({ confidence, children, style }: Props) {
  const needsConfirm = confidence >= 0.6 && confidence < 0.85;
  if (confidence < 0.6) return null;
  return (
    <View
      style={[
        styles.wrap,
        needsConfirm && styles.confirm,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  confirm: {
    borderLeftWidth: 2,
    borderLeftColor: colors.urgent,
    paddingLeft: 10,
  },
});
