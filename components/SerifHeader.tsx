import { StyleSheet, Text, View } from 'react-native';
import { colors, type } from '../theme';
import { Eyebrow } from './Eyebrow';

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
};

export function SerifHeader({ eyebrow, title, subtitle, trailing }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={{ flex: 1 }}>
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    ...type.display32,
    color: colors.ink,
    marginTop: 6,
  },
  sub: {
    ...type.body13,
    color: colors.inkDim,
    marginTop: 6,
  },
});
