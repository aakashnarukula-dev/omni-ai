import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { colors, radii, spacing, type } from '../theme';
import { useStore } from '../store';
import {
  IconBell,
  IconCard,
  IconCheck,
} from './Icons';

type IconCmp = (p: { size?: number; color?: string }) => React.ReactElement;

type Tab = { label: string; Icon: IconCmp };

const TABS: Tab[] = [
  { label: 'Tasks', Icon: IconCheck },
  { label: 'Alarms', Icon: IconBell },
  { label: 'Cards', Icon: IconCard },
];

export function TopChipTabs() {
  const tabIndex = useStore((s) => s.tabIndex);
  const setTabIndex = useStore((s) => s.setTabIndex);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {TABS.map((t, i) => {
          const focused = tabIndex === i;
          const tint = focused ? colors.bg : colors.ink;
          return (
            <Pressable
              key={t.label}
              onPress={() => {
                if (focused) return;
                Haptics.selectionAsync().catch(() => {});
                setTabIndex(i);
              }}
              style={[styles.chip, focused && styles.chipActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
            >
              <t.Icon size={14} color={tint} />
              <Text style={[styles.chipText, { color: tint }]}>
                {t.label.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.bg },
  row: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 18,
    paddingBottom: 12,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
    backgroundColor: colors.bgRaise,
  },
  chipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  chipText: {
    ...type.mono11,
    letterSpacing: 1.2,
  },
});
