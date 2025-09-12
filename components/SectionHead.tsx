import { StyleSheet, Text, View } from 'react-native';
import { colors, type } from '../theme';

type Props = {
  title: string;
  trailing?: React.ReactNode;
};

export function SectionHead({ title, trailing }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 18,
    paddingBottom: 12,
  },
  title: {
    ...type.display24,
    color: colors.ink,
  },
});
