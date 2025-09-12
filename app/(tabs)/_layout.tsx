import { Slot } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { colors } from '../../theme';

export default function TabsLayout() {
  return (
    <View style={styles.root}>
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
