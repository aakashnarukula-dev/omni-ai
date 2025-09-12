import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, type } from '../theme';

type Props = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

export function EmptyState({ title, subtitle, children }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      {children ? <View style={styles.extras}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screenX,
    gap: 12,
  },
  title: {
    ...type.display32,
    color: colors.ink,
    textAlign: 'center',
  },
  sub: {
    ...type.body14,
    color: colors.inkDim,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  extras: { marginTop: 22, alignItems: 'center' },
});
