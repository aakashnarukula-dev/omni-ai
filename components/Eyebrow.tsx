import { StyleSheet, Text, TextProps } from 'react-native';
import { colors, type } from '../theme';

export function Eyebrow({ style, children, ...rest }: TextProps) {
  return (
    <Text {...rest} style={[styles.text, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { ...type.eyebrow, color: colors.inkFaint },
});
